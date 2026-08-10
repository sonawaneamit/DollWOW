import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const sourcePath = path.join(ROOT, "content", "learn", "sex-doll-guide-products.json");
const outputDir = path.join(ROOT, "data", "exports", "seo-intelligence", dateStamp, "ultimate-guide-product-shortlist");
const reportPath = path.join(ROOT, "docs", "seo-intelligence", `${dateStamp}-ultimate-guide-product-shortlist.md`);

const groups = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const response = await fetch("https://dollwow.com/product-feed.json");
if (!response.ok) throw new Error(`Could not load DollWow product feed: HTTP ${response.status}`);
const feed = await response.json();
const byHandle = new Map((feed.products || []).map((product) => [product.handle, product]));
const handles = groups.flatMap((group) => group.items.map((item) => item.handle));
const rows = groups.flatMap((group) => group.items.map((item) => {
  const product = byHandle.get(item.handle);
  return {
    group: group.title,
    reason: item.reason,
    handle: item.handle,
    found: Boolean(product),
    title: product?.title || "",
    brand: product?.brand || "",
    material: product?.material || "",
    heightCm: product?.heightCm || null,
    heightUs: product?.heightCm ? heightImperial(product.heightCm) : "",
    weightLb: product?.weightLb || null,
    weightKg: product?.weightLb ? round(product.weightLb * 0.45359237) : null,
    startingPrice: product?.priceRange?.min?.amount || null,
    currency: product?.priceRange?.min?.currencyCode || null,
    stockStatus: product?.stockStatus || null,
    customAvailable: product?.customAvailable ?? null,
    canonicalUrl: product?.canonicalUrl || "",
    imageUrl: product?.image?.url || "",
    dataWarnings: [
      !product?.weightLb ? "weight_requires_confirmation" : null,
      !product?.material ? "material_requires_confirmation" : null,
      !product?.heightCm ? "height_requires_confirmation" : null
    ].filter(Boolean)
  };
}));

const uniqueHandles = new Set(handles);
const brands = new Set(rows.map((row) => row.brand).filter(Boolean));
const completionGate = {
  status: groups.length === 6 && handles.length === 24 && uniqueHandles.size === 24 && rows.every((row) => row.found && row.canonicalUrl && row.imageUrl && row.startingPrice && row.heightCm) && brands.size >= 12 ? "Passed" : "Failed",
  criteria: "Six use-case groups contain 24 unique, live, image-backed products across at least 12 carried brands, each with a canonical URL, current price, and height. Missing weight is disclosed rather than inferred."
};

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(path.join(outputDir, "shortlist-snapshot.json"), `${JSON.stringify({ generatedAt, productFeedGeneratedAt: feed.generatedAt, completionGate, rows }, null, 2)}\n`, "utf8");
await fs.writeFile(reportPath, renderReport(), "utf8");

console.log("Validated Ultimate Guide product shortlist.");
console.log(`Products: ${rows.length}`);
console.log(`Brands: ${brands.size}`);
console.log(`Missing weight fields: ${rows.filter((row) => !row.weightLb).length}`);
console.log(`Completion gate: ${completionGate.status}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function renderReport() {
  return `# Ultimate Guide Product Shortlist

Generated: ${generatedAt}

## Completion Gate

Status: ${completionGate.status}

${completionGate.criteria}

## Snapshot

- Product groups: ${groups.length}
- Unique live products: ${uniqueHandles.size}
- Carried brands represented: ${brands.size}
- Products requiring weight confirmation: ${rows.filter((row) => !row.weightLb).length}
- Product feed generated: ${feed.generatedAt || "unknown"}

| Group | Product | Brand | Material | Height | Weight | Starting price | Status | Warning |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- |
${rows.map((row) => `| ${row.group} | [${row.title}](${row.canonicalUrl}) | ${row.brand} | ${row.material} | ${row.heightUs} / ${row.heightCm} cm | ${row.weightLb ? `${round(row.weightLb)} lb / ${row.weightKg} kg` : "Confirm before purchase"} | ${row.currency} ${row.startingPrice} | ${row.stockStatus || "Confirm"} | ${row.dataWarnings.join(", ")} |`).join("\n")}

## Use Rule

The shortlist is a current comparison sample, not a popularity ranking or a claim of hands-on testing. Product cards must use live Shopify data, real catalog imagery, dual units, a visible inclusion reason, and a link to the exact product. Missing specifications stay visibly unconfirmed.
`;
}

function heightImperial(heightCm) {
  const totalInches = Math.round(heightCm / 2.54);
  return `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`;
}

function round(value) {
  return Number(Number(value).toFixed(1));
}
