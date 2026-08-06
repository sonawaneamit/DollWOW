import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const officialPath = path.resolve(ROOT, args.official || "data/imports/rosretty-official-full-fresh.json");
const vendorPath = path.resolve(ROOT, args.vendor || "data/imports/rosretty-cloudclimax-latest.json");
const outputPath = path.resolve(ROOT, args.output || "data/exports/rosretty-cloudclimax-visual-matches.json");
const official = JSON.parse(await fs.readFile(officialPath, "utf8")).products || [];
const vendor = JSON.parse(await fs.readFile(vendorPath, "utf8")).products || [];
const cache = new Map();

const acceptedOfficial = official.filter((product) => /^rosretty(?:\s+doll)?$/i.test(clean(product.vendor)));
const results = [];

for (const product of acceptedOfficial) {
  const candidates = vendor.filter((listing) => compatible(product, listing));
  const namedCandidates = candidates.filter((listing) => hasOfficialName(listing.title, product.title));
  const officialImages = (product.imageUrls || []).slice(0, 5);
  const scored = [];

  for (const listing of candidates) {
    const score = await bestImageScore(officialImages, listing.imageUrl);
    if (score !== null) scored.push({ ...listing, visualScore: score });
  }

  scored.sort((left, right) => right.visualScore - left.visualScore);
  const bestVisual = scored[0];
  // A unique model name within the same height/body type is a stronger signal
  // than photo similarity when vendors use a different campaign image.
  const namedMatch = namedCandidates.length === 1 ? namedCandidates[0] : null;
  const namedScore = namedMatch
    ? scored.find((item) => item.sourceUrl === namedMatch.sourceUrl)?.visualScore ?? null
    : null;
  const best = namedMatch
    ? { ...namedMatch, visualScore: namedScore ?? 0 }
    : bestVisual;
  const runnerUp = scored[1];
  const titleNameMatch = best ? hasOfficialName(best.title, product.title) : false;
  const gap = best && runnerUp ? best.visualScore - runnerUp.visualScore : best?.visualScore || 0;
  // A vendor listing can rename a model, but photo styling alone is not
  // reliable enough for a release-order change. Exact model-name matches get
  // a lower image threshold; a renamed model needs an exceptionally clear,
  // well-separated gallery match.
  const confidentlyMatched = Boolean(best && (
    (namedMatch && namedCandidates.length === 1) ||
    (titleNameMatch && best.visualScore >= 0.85 && gap >= 0.02) ||
    (best.visualScore >= 0.985 && gap >= 0.14)
  ));
  const matchMethod = namedMatch
    ? (namedScore === null ? "name-and-body" : "name-and-image")
    : "image-match";
  results.push({
    officialTitle: product.title,
    officialSourceUrl: product.sourceUrl,
    match: best ? {
      title: best.title,
      sourceUrl: best.sourceUrl,
      releaseRank: best.releaseRank,
      visualScore: Number(best.visualScore.toFixed(4)),
      scoreGap: Number(gap.toFixed(4)),
      method: matchMethod,
      confident: confidentlyMatched
    } : null,
    alternatives: scored.slice(1, 4).map((item) => ({
      title: item.title,
      sourceUrl: item.sourceUrl,
      releaseRank: item.releaseRank,
      visualScore: Number(item.visualScore.toFixed(4))
    }))
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  source: "CloudClimax newest-first collection order, matched to official Rosretty products by product-image similarity",
  totals: {
    official: results.length,
    confident: results.filter((result) => result.match?.confident).length,
    needsReview: results.filter((result) => !result.match?.confident).length
  },
  products: results
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(ROOT, outputPath), totals: output.totals }, null, 2));

function compatible(product, listing) {
  const left = productFacts(product.title);
  const right = productFacts(listing.title);
  if (left.height && right.height && left.height !== right.height) return false;
  if (left.torso !== right.torso) return false;
  return true;
}

function productFacts(value = "") {
  const text = clean(value).toLowerCase();
  return {
    height: Number(text.match(/\b(\d{2,3})\s*cm\b/)?.[1]) || null,
    torso: /\btorso\b/.test(text)
  };
}

async function bestImageScore(officialImages, vendorImage) {
  if (!vendorImage || !officialImages.length) return null;
  const vendorVector = await vector(vendorImage);
  if (!vendorVector) return null;
  let best = null;
  for (const image of officialImages) {
    const officialVector = await vector(image);
    if (!officialVector) continue;
    const score = cosine(officialVector, vendorVector);
    if (best === null || score > best) best = score;
  }
  return best;
}

async function vector(url) {
  if (cache.has(url)) return cache.get(url);
  try {
    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; DollWowCatalogReview/1.0)" } });
    if (!response.ok) return null;
    const raw = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(33, 32, { fit: "cover", position: "centre" })
      .grayscale()
      .raw()
      .toBuffer();
    const values = Uint8Array.from({ length: 32 * 32 }, (_, index) => {
      const row = Math.floor(index / 32);
      const column = index % 32;
      return raw[row * 33 + column] > raw[row * 33 + column + 1] ? 1 : 0;
    });
    cache.set(url, values);
    return values;
  } catch {
    cache.set(url, null);
    return null;
  }
}

function cosine(left, right) {
  let same = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) same += 1;
  }
  return same / left.length;
}

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function hasOfficialName(vendorTitle, officialTitle) {
  const name = clean(officialTitle)
    .split(/\s*[-–—]\s*/)
    .at(-1)
    ?.replace(/\b(?:doll|torso)\b/gi, "")
    .trim();
  if (!name || name.length < 3 || !/^[A-Za-z][A-Za-z' -]+$/.test(name)) return false;
  return new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(clean(vendorTitle));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
