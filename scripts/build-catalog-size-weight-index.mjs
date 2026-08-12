import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.argv.includes("--source")
  ? process.argv[process.argv.indexOf("--source") + 1]
  : "https://dollwow.com/product-feed.json";
const OUTPUT = path.join(ROOT, "content", "learn", "sex-doll-size-weight-index.json");

const feed = await readJson(SOURCE);
const reviewedAt = new Date().toISOString();
const eligible = (feed.products || [])
  .map(normalizeProduct)
  .filter((product) => product.heightCm >= 121 && product.weightLb > 0 && product.price > 0);

if (!eligible.length) throw new Error("No eligible full-size listings were found.");

const heightBands = [
  { label: "121-154 cm", imperial: "4 ft 0 in-5 ft 1 in", min: 121, max: 154 },
  { label: "155-159 cm", imperial: "5 ft 1 in-5 ft 3 in", min: 155, max: 159 },
  { label: "160-164 cm", imperial: "5 ft 3 in-5 ft 5 in", min: 160, max: 164 },
  { label: "165-169 cm", imperial: "5 ft 5 in-5 ft 7 in", min: 165, max: 169 },
  { label: "170 cm and taller", imperial: "5 ft 7 in and taller", min: 170, max: Infinity }
];
const weightBands = [
  { label: "Under 75 lb", metric: "Under 34 kg", min: 0, max: 74.999 },
  { label: "75-89 lb", metric: "34-40.4 kg", min: 75, max: 89.999 },
  { label: "90-109 lb", metric: "40.8-49.4 kg", min: 90, max: 109.999 },
  { label: "110 lb and heavier", metric: "49.9 kg and heavier", min: 110, max: Infinity }
];

const heightValues = eligible.map((product) => product.heightCm);
const weightValues = eligible.map((product) => product.weightLb);
const result = {
  generatedAt: reviewedAt,
  catalogReviewedAt: feed.generatedAt || null,
  sourceUrl: /^https?:/.test(SOURCE) ? SOURCE : null,
  methodology: {
    catalogListings: Number(feed.productCount || feed.products?.length || 0),
    analyzedListings: eligible.length,
    excludedListings: Number(feed.productCount || feed.products?.length || 0) - eligible.length,
    minimumHeightCm: 121,
    rule: "Includes current DollWow listings at least 121 cm tall with a positive listed weight and price. The 121 cm boundary removes compact partial-body products from the full-size distribution.",
    limitation: "The unit of analysis is a catalog listing, not a unique body mold or the entire market. One body can appear with several heads or configurations. Listed measurements come from current product data and may change."
  },
  summary: {
    medianHeightCm: round(percentile(heightValues, 0.5), 1),
    medianHeightImperial: imperialHeight(percentile(heightValues, 0.5)),
    middleHalfHeightCm: [round(percentile(heightValues, 0.25), 1), round(percentile(heightValues, 0.75), 1)],
    medianWeightLb: round(percentile(weightValues, 0.5), 1),
    medianWeightKg: round(lbToKg(percentile(weightValues, 0.5)), 1),
    middleHalfWeightLb: [round(percentile(weightValues, 0.25), 1), round(percentile(weightValues, 0.75), 1)],
    middleHalfWeightKg: [round(lbToKg(percentile(weightValues, 0.25)), 1), round(lbToKg(percentile(weightValues, 0.75)), 1)]
  },
  heightBands: heightBands.map((band) => summarizeBand(eligible, band, "heightCm", { imperial: band.imperial })),
  weightBands: weightBands.map((band) => summarizeBand(eligible, band, "weightLb", { metric: band.metric })),
  materials: ["TPE", "Silicone", "Hybrid"].map((material) => summarizeGroup(eligible.filter((product) => product.material === material), material)),
  representativeListings: representativeListings(eligible)
};

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`Analyzed ${eligible.length} current full-size listings.`);
console.log(`Output: ${path.relative(ROOT, OUTPUT)}`);

async function readJson(source) {
  if (/^https?:/.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Unable to fetch product feed: HTTP ${response.status}`);
    return response.json();
  }
  return JSON.parse(await fs.readFile(path.resolve(ROOT, source), "utf8"));
}

function normalizeProduct(product) {
  const material = /silicone head|hybrid/i.test(product.material || "")
    ? "Hybrid"
    : /^silicone$/i.test(product.material || "")
      ? "Silicone"
      : /^tpe$/i.test(product.material || "")
        ? "TPE"
        : "Other";
  return {
    handle: product.handle,
    title: product.title,
    brand: product.brand,
    material,
    heightCm: Number(product.heightCm || 0),
    weightLb: Number(product.weightLb || 0),
    price: Number(product.priceRange?.min?.amount || 0),
    canonicalUrl: product.canonicalUrl,
    image: product.image
  };
}

function summarizeBand(products, band, field, extra) {
  const rows = products.filter((product) => product[field] >= band.min && product[field] <= band.max);
  return {
    label: band.label,
    ...extra,
    count: rows.length,
    sharePercent: round((rows.length / products.length) * 100, 1),
    medianWeightLb: round(percentile(rows.map((product) => product.weightLb), 0.5), 1),
    medianWeightKg: round(lbToKg(percentile(rows.map((product) => product.weightLb), 0.5)), 1),
    medianHeightCm: round(percentile(rows.map((product) => product.heightCm), 0.5), 1),
    medianHeightImperial: imperialHeight(percentile(rows.map((product) => product.heightCm), 0.5))
  };
}

function summarizeGroup(products, label) {
  return {
    label,
    count: products.length,
    medianHeightCm: round(percentile(products.map((product) => product.heightCm), 0.5), 1),
    medianHeightImperial: imperialHeight(percentile(products.map((product) => product.heightCm), 0.5)),
    medianWeightLb: round(percentile(products.map((product) => product.weightLb), 0.5), 1),
    medianWeightKg: round(lbToKg(percentile(products.map((product) => product.weightLb), 0.5)), 1),
    medianPrice: round(percentile(products.map((product) => product.price), 0.5), 0)
  };
}

function representativeListings(products) {
  const picks = [
    nearest(products.filter((product) => product.heightCm < 155), 150, "heightCm", "Compact full-size example"),
    nearest(products.filter((product) => product.heightCm >= 160 && product.heightCm <= 169), percentile(products.map((product) => product.weightLb), 0.5), "weightLb", "Middle-range handling example"),
    nearest(products.filter((product) => product.heightCm >= 170), 175, "heightCm", "Taller full-size example")
  ].filter(Boolean);
  return [...new Map(picks.map((product) => [product.handle, product])).values()];
}

function nearest(products, target, field, role) {
  const product = [...products].sort((a, b) => Math.abs(a[field] - target) - Math.abs(b[field] - target))[0];
  return product ? { ...product, role, weightKg: round(lbToKg(product.weightLb), 1), heightImperial: imperialHeight(product.heightCm) } : null;
}

function percentile(values, fraction) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function imperialHeight(heightCm) {
  const inches = Math.round(Number(heightCm || 0) / 2.54);
  return `${Math.floor(inches / 12)} ft ${inches % 12} in`;
}

function lbToKg(value) {
  return Number(value || 0) * 0.45359237;
}

function round(value, places) {
  return Number(Number(value || 0).toFixed(places));
}
