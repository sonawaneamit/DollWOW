import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const preparedPath = path.resolve(ROOT, "data/exports/dollwow-wm-current-2026-08-13-storefront-products.json");
const reviewPath = path.resolve(ROOT, "data/exports/wm-current-duplicate-review-2026-08-13.json");
const priorPath = path.resolve(ROOT, "data/exports/shopify-rosemary-option-price-sync-wm.json");
const outputPath = path.resolve(ROOT, "data/exports/wm-missing-draft-candidates.json");
const reportPath = path.resolve(ROOT, "data/exports/wm-missing-draft-review.json");

const prepared = JSON.parse(await fs.readFile(preparedPath, "utf8"));
const review = JSON.parse(await fs.readFile(reviewPath, "utf8"));
const prior = JSON.parse(await fs.readFile(priorPath, "utf8"));
const mapped = new Set((prior.products || []).map((row) => canonical(row.sourceUrl)).filter(Boolean));
const reviewByUrl = new Map(review.reviews.map((row) => [canonical(row.sourceUrl), row]));
const decisions = [];
const candidates = [];

for (const product of prepared) {
  const url = canonical(product.sourceUrl);
  const duplicate = reviewByUrl.get(url);
  if (mapped.has(url)) {
    decisions.push(decision(product, "existing", "Exact source URL is already mapped to a live DollWOW product."));
    continue;
  }
  if (isWarehouse(product)) {
    decisions.push(decision(product, "stock_workflow", "Ready-to-ship inventory belongs in the regional stock synchronization workflow."));
    continue;
  }
  if (!duplicate || duplicate.recommendation !== "likely_safe_new_listing") {
    decisions.push(decision(product, "manual_review", duplicate?.notes || "No safe-new duplicate decision exists."));
    continue;
  }
  if (!product.images?.length || !product.priceRange?.minVariantPrice?.amount) {
    decisions.push(decision(product, "source_conflict", "Missing a usable source gallery or base price."));
    continue;
  }
  if (!(product.extended?.customizationGroups || []).length) {
    decisions.push(decision(product, "option_review", "No customization form was captured."));
    continue;
  }
  candidates.push(product);
}

// A source can expose the same body/head combination in more than one current
// row. Keep the most complete draft and merge only exact duplicate source URLs.
const bySource = new Map();
for (const product of candidates) {
  const key = canonical(product.sourceUrl);
  const current = bySource.get(key);
  if (!current) {
    bySource.set(key, product);
    continue;
  }
  const primary = completeness(current) >= completeness(product) ? current : product;
  const secondary = primary === current ? product : current;
  const images = new Map((primary.images || []).map((image) => [canonical(image.url), image]));
  for (const image of secondary.images || []) images.set(canonical(image.url), image);
  bySource.set(key, { ...primary, images: [...images.values()] });
  decisions.push(decision(secondary, "consolidated_duplicate_source", "Duplicate current source URL consolidated into one draft."));
}

const drafts = [...bySource.values()];
const summary = {
  prepared: prepared.length,
  existingExactSource: decisions.filter((row) => row.status === "existing").length,
  stockWorkflow: decisions.filter((row) => row.status === "stock_workflow").length,
  manualReview: decisions.filter((row) => row.status === "manual_review").length,
  sourceConflicts: decisions.filter((row) => row.status === "source_conflict").length,
  optionReview: decisions.filter((row) => row.status === "option_review").length,
  consolidatedDuplicateSources: decisions.filter((row) => row.status === "consolidated_duplicate_source").length,
  draftCandidates: drafts.length,
  candidateMaterials: countBy(drafts, (product) => product.extended?.material || "Unknown")
};

await fs.writeFile(outputPath, JSON.stringify(drafts, null, 2));
await fs.writeFile(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), summary, decisions }, null, 2));
console.log(JSON.stringify({ summary, candidates: path.relative(ROOT, outputPath), report: path.relative(ROOT, reportPath) }, null, 2));

function isWarehouse(product) {
  const text = `${product.title} ${product.sourceTitle} ${product.sourceUrl} ${(product.tags || []).join(" ")}`.toLowerCase();
  return /ready[- ]to[- ]ship|in[- ]stock|warehouse/.test(text);
}
function decision(product, status, reason) {
  return { status, reason, handle: product.handle, title: product.title, sourceUrl: product.sourceUrl };
}
function completeness(product) {
  return (product.images?.length || 0) * 10 + (product.extended?.customizationGroups?.length || 0) * 3;
}
function countBy(rows, getter) {
  return rows.reduce((result, row) => { const key = getter(row); result[key] = (result[key] || 0) + 1; return result; }, {});
}
function canonical(value) {
  try { const url = new URL(value); url.search = ""; url.hash = ""; return url.toString().replace(/\/$/, ""); }
  catch { return String(value || "").replace(/[?#].*$/, "").replace(/\/$/, ""); }
}
