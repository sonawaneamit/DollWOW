import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const officialPath = path.resolve(ROOT, args.official || "data/exports/rosretty-official-vendor-ranked.json");
const matchesPath = path.resolve(ROOT, args.matches || "data/exports/rosretty-cloudclimax-visual-matches.json");
const listingsPath = path.resolve(ROOT, args.listings || "data/imports/rosretty-cloudclimax-latest.json");
const outputPath = path.resolve(ROOT, args.output || "data/exports/rosretty-highres-media-refresh.json");

const [officialProducts, matchReport, listingCapture] = await Promise.all([
  readJson(officialPath),
  readJson(matchesPath),
  readJson(listingsPath)
]);

const matchByOfficialSource = new Map((matchReport.products || [])
  .filter((item) => item.match?.confident && item.officialSourceUrl && item.match.sourceUrl)
  .map((item) => [item.officialSourceUrl, item.match]));
const listingBySource = new Map((listingCapture.products || []).map((listing) => [listing.sourceUrl, listing]));

const refreshed = [];
const skipped = [];

for (const product of officialProducts) {
  const match = matchByOfficialSource.get(product.sourceUrl);
  const listing = match ? listingBySource.get(match.sourceUrl) : null;
  const sourceImage = listing?.imageUrl;
  const highResImage = sourceImage ? await findOriginalImage(sourceImage) : null;

  if (!highResImage) {
    skipped.push({ handle: product.handle, reason: match ? "no_verified_highres_retailer_asset" : "no_verified_retailer_match" });
    continue;
  }

  const originalImages = product.images || [];
  const images = [
    { url: highResImage.url, altText: `${product.title} product photo` },
    ...originalImages.filter((image) => image.url !== highResImage.url)
  ];
  refreshed.push({ ...product, images, featuredImage: images[0] });
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(refreshed, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(ROOT, outputPath),
  refreshed: refreshed.length,
  skipped: skipped.length,
  skipped
}, null, 2));

async function findOriginalImage(listingImageUrl) {
  const listingUrl = new URL(listingImageUrl);
  const pathname = listingUrl.pathname.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]+$)/i, "");
  const stem = pathname.replace(/\.[a-z]+$/i, "");
  const candidates = [".png", ".webp", ".jpg", ".jpeg"].map((extension) => {
    const url = new URL(listingUrl);
    url.pathname = `${stem}${extension}`;
    return url.toString();
  });

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { redirect: "follow" });
      if (!response.ok || !/^image\//i.test(response.headers.get("content-type") || "")) continue;
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      // A large catalog card needs at least a 1000px-wide source to stay crisp
      // on desktop and high-density mobile displays. Do not promote a smaller
      // retailer thumbnail simply because it is an original file URL.
      if ((metadata.width || 0) >= 1000) return { url: candidate, width: metadata.width, height: metadata.height };
    } catch {
      // Try the next original format.
    }
  }
  return null;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function parseArgs(values) {
  return Object.fromEntries(values.reduce((all, value, index) => {
    if (!value.startsWith("--")) return all;
    const key = value.slice(2);
    const next = values[index + 1];
    all.push([key, next && !next.startsWith("--") ? next : true]);
    return all;
  }, []));
}
