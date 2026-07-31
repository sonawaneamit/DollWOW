import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(process.argv.slice(2).map((value, index, list) => [value, list[index + 1]]));
const mediaRoot = path.resolve(args.get("--media-root") || "/tmp/avant-pictures-0731/1 Pictures");
const outputPath = path.resolve(args.get("--output") || path.join(ROOT, "data/exports/avant-source-audit.json"));

const entries = await fs.readdir(mediaRoot, { withFileTypes: true });
const products = [];

for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
  const sourceFolder = entry.name;
  const parsed = parseSourceFolder(sourceFolder);
  const files = await walk(path.join(mediaRoot, sourceFolder));
  const images = files.filter(isImage);
  const videos = files.filter((file) => path.extname(file).toLowerCase() === ".mp4");
  const completeGallery = images.length >= 8;

  products.push({
    ...parsed,
    sourceFolder,
    imageCount: images.length,
    videoCount: videos.length,
    mediaState: completeGallery ? "ready" : videos.length ? "needs-video-stills" : "needs-supplier-images",
    reviewNotes: completeGallery
      ? []
      : ["Do not create a public product gallery until a merchandiser has approved the available official media."]
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  source: "Avant manufacturer-provided product photo pack",
  totals: {
    configurations: products.length,
    ready: products.filter((item) => item.mediaState === "ready").length,
    needsVideoStills: products.filter((item) => item.mediaState === "needs-video-stills").length,
    needsSupplierImages: products.filter((item) => item.mediaState === "needs-supplier-images").length
  },
  products
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals }, null, 2));

function parseSourceFolder(value) {
  const match = value.match(/^(\d+)\.([^-]+)-(\d+)cm\s+([A-Z])\s+Cup\s+(.+?)\s+Head\s+Full\s+Silicone\s+Doll\s+\(([^)]+)\)$/i);
  if (!match) return { sourceName: value };
  const [, sourceNumber, displayName, heightCm, cupSize, headModel, skinTone] = match;
  return {
    sourceNumber: Number(sourceNumber),
    displayName: displayName.trim(),
    heightCm: Number(heightCm),
    cupSize: `${cupSize.toUpperCase()}-Cup`,
    headModel: headModel.trim(),
    skinTone: skinTone.trim(),
    material: "Silicone",
    bodyType: "female",
    listingTitle: `Avant ${displayName.trim()} ${heightCm}cm ${cupSize.toUpperCase()}-Cup Full Silicone Doll`
  };
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => (entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))
  );
  return nested.flat();
}

function isImage(filePath) {
  return [".jpg", ".jpeg", ".png", ".webp"].includes(path.extname(filePath).toLowerCase());
}
