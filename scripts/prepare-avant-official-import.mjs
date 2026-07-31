import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(process.argv.slice(2).map((value, index, list) => [value, list[index + 1]]));
const reviewPath = path.resolve(args.get("--review") || path.join(ROOT, "data/exports/avant-review-manifest.json"));
const sourceRoot = path.resolve(args.get("--source") || "/tmp/avant-pictures-0731/1 Pictures");
const outputPath = path.resolve(args.get("--output") || path.join(ROOT, "data/exports/avant-official-import-plan.json"));

const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
const products = [];
const displayNameCounts = review.products.reduce((counts, product) => {
  const key = product.displayName.trim().toLowerCase();
  counts.set(key, (counts.get(key) || 0) + 1);
  return counts;
}, new Map());

for (const product of review.products) {
  const mediaDirectory = path.join(sourceRoot, product.sourceFolder);
  const media = await collectMedia(mediaDirectory);
  const measurements = buildMeasurements(product.officialBodySpecification, product.heightCm, product.cupSize);
  const readyForDraft = product.launchState === "ready-for-draft" && product.publicReference.status !== "pending-match";

  products.push({
    sourceNumber: product.sourceNumber,
    title: product.listingTitle,
    handle: slugify(
      `avant-${product.displayName}-${product.heightCm}cm-${product.cupSize}-full-silicone${
        displayNameCounts.get(product.displayName.trim().toLowerCase()) > 1 ? `-${product.skinTone}` : ""
      }`
    ),
    displayName: product.displayName,
    identity: {
      brand: "Avant Doll",
      heightCm: product.heightCm,
      cupSize: product.cupSize,
      material: product.material,
      bodyType: product.bodyType,
      headModel: product.headModel,
      skinTone: product.skinTone
    },
    media: {
      source: "Avant manufacturer-provided product pack",
      imageCount: media.images.length,
      videoCount: media.videos.length,
      imageFiles: media.images,
      videoFiles: media.videos,
      supplierMediaComplete: product.mediaState === "ready",
      reviewNote: product.mediaState === "ready"
        ? "Use the complete official image gallery; do not substitute public-site media."
        : "Hold for additional official stills or supplier-provided image approval before publishing."
    },
    measurements,
    documentedOptions: optionLibrary(product),
    commercial: {
      minimumAdvertisedUsd: product.minimumAdvertisedUsd,
      supplierCostUsd: product.supplierCostUsd,
      priceStatus: product.minimumAdvertisedUsd ? "official-map-confirmed" : "supplier-price-confirmation-needed"
    },
    publicReference: product.publicReference,
    launchReadiness: {
      state: readyForDraft ? "ready-for-shopify-draft" : product.launchState,
      blockers: blockersFor(product, media, measurements)
    }
  });
}

const plan = {
  generatedAt: new Date().toISOString(),
  sourceOfTruth: "Avant manufacturer-provided media, body specifications, option/pricing workbook, and product catalog",
  publicReferencePolicy: "YourDoll is used only to cross-check public coverage, current product availability, and price/listing differences. Manufacturer files remain the source of truth for product media and specifications.",
  importPolicy: "Create Shopify drafts only for products with verified commercial pricing, complete official media, product-specific option review, and a recorded public-reference result. Do not automatically publish.",
  totals: {
    configurations: products.length,
    fullOfficialGallery: products.filter((product) => product.media.supplierMediaComplete).length,
    needsMediaFollowup: products.filter((product) => !product.media.supplierMediaComplete).length,
    officialMapConfirmed: products.filter((product) => product.commercial.minimumAdvertisedUsd).length,
    readyForShopifyDraft: products.filter((product) => product.launchReadiness.state === "ready-for-shopify-draft").length,
    publicReferenceMismatch: products.filter((product) => product.publicReference.status === "media-count-mismatch").length
  },
  products
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: plan.totals }, null, 2));

async function collectMedia(directory) {
  const files = await walk(directory);
  const images = files.filter((file) => /\.(?:jpe?g|png|webp)$/i.test(file)).sort();
  const videos = files.filter((file) => /\.(?:mp4|mov)$/i.test(file)).sort();
  return { images, videos };
}

async function walk(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const filePath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(filePath) : [filePath];
    }));
    return nested.flat();
  } catch {
    return [];
  }
}

function buildMeasurements(row, heightCm, cupSize) {
  if (!row) return null;
  const [, neckGirth, shouldersWidth, bust, underBust, waist, hip, armsLength, handLength, legsLength, feetLength, vaginaDepth, anusDepth, oralDepth, weight] = row;
  return compact({
    Height: formatHeight(heightCm),
    Weight: weight && asWeight(weight),
    "Cup size": cupSize,
    "Neck Girth": asImperialMetric(neckGirth),
    "Shoulders Width": asImperialMetric(shouldersWidth),
    Bust: asImperialMetric(bust),
    "Under Bust": asImperialMetric(underBust),
    Waist: asImperialMetric(waist),
    Hip: asImperialMetric(hip),
    "Arms Length": asImperialMetric(armsLength),
    "Hand Length": asImperialMetric(handLength),
    "Legs Length": asImperialMetric(legsLength),
    "Feet Length": asImperialMetric(feetLength),
    "Vagina Depth": asImperialMetric(vaginaDepth),
    "Anus Depth": asImperialMetric(anusDepth),
    "Oral Depth": asImperialMetric(oralDepth)
  });
}

function asImperialMetric(value) {
  if (!value) return null;
  const match = String(value).match(/([\d.]+)cm\s*\/\s*([\d.]+)in/i);
  return match ? `${match[2]} in / ${match[1]} cm` : String(value);
}

function asWeight(value) {
  const match = String(value).match(/([\d.]+)kg\s*[/|]\s*([\d.]+)lbs?/i);
  return match ? `${match[2]} lb / ${match[1]} kg` : String(value);
}

function formatHeight(heightCm) {
  const inches = Math.round(heightCm / 2.54);
  return `${Math.floor(inches / 12)} ft ${inches % 12} in / ${heightCm} cm`;
}

function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => Boolean(value)));
}

function optionLibrary(product) {
  return [
    { group: "Head", selected: `${product.headModel} head`, source: "official configuration" },
    { group: "Skin tone", selected: product.skinTone, source: "official configuration" },
    { group: "Wig and hairstyle", source: "official Avant option catalog", requiresProductReview: true },
    { group: "Eye color", source: "official Avant option catalog", requiresProductReview: true },
    { group: "Nail and areola color", source: "official Avant option catalog", requiresProductReview: true },
    { group: "Body, foot, and breast options", source: "official Avant option catalog", requiresProductReview: true },
    { group: "Implanted hair and body upgrades", source: "official Avant option catalog", requiresProductReview: true },
    { group: "Care and storage accessories", source: "official Avant option catalog", requiresProductReview: true }
  ];
}

function blockersFor(product, media, measurements) {
  const blockers = [];
  if (product.mediaState !== "ready" || !media.images.length) blockers.push("Official gallery requires approved stills or additional supplier images.");
  if (!measurements) blockers.push("Official body specification is missing.");
  if (!product.minimumAdvertisedUsd) blockers.push("Supplier-confirmed selling price is required.");
  if (product.publicReference.status === "pending-match") blockers.push("YourDoll/public reference cross-check is pending.");
  if (product.publicReference.status === "media-count-mismatch") blockers.push("Public reference has a different gallery count; retain official media and review listing details.");
  blockers.push("Confirm which documented option groups apply to this configuration before publishing.");
  return blockers;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
