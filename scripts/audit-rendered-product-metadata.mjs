import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(ROOT, args.input || "data/exports/catalog-audit-live-2026-08-12.json");
const outputPath = path.resolve(ROOT, args.output || "data/exports/catalog-rendered-metadata-audit.json");
const baseUrl = String(args.base || "https://dollwow.com").replace(/\/$/, "");
const concurrency = Math.max(1, Math.min(Number(args.concurrency || 12), 24));
const audit = JSON.parse(await fs.readFile(inputPath, "utf8"));
const candidates = (audit.findings || []).filter((finding) => finding.titleWarnings?.length);

const rows = new Array(candidates.length);
let nextIndex = 0;
await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, async () => {
  while (nextIndex < candidates.length) {
    const index = nextIndex;
    nextIndex += 1;
    rows[index] = await inspectProduct(candidates[index]);
  }
}));

const successful = rows.filter((row) => row.status === 200);
const titleGroups = duplicateGroups(successful, (row) => normalize(row.title));
const descriptionGroups = duplicateGroups(successful, (row) => normalize(row.description));
const schemaDescriptionGroups = duplicateGroups(successful, (row) => normalize(row.schemaDescription));
const canonicalGroups = duplicateGroups(successful, (row) => normalize(row.canonical));
const imageAltGroups = duplicateImageAltGroups(successful);
const payload = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  sourceAudit: path.relative(ROOT, inputPath),
  summary: {
    inspectedProducts: rows.length,
    successfulProducts: successful.length,
    failedProducts: rows.length - successful.length,
    duplicateRenderedTitleGroups: titleGroups.length,
    productsWithDuplicateRenderedTitles: countProducts(titleGroups),
    duplicateRenderedDescriptionGroups: descriptionGroups.length,
    productsWithDuplicateRenderedDescriptions: countProducts(descriptionGroups),
    duplicateSchemaDescriptionGroups: schemaDescriptionGroups.length,
    productsWithDuplicateSchemaDescriptions: countProducts(schemaDescriptionGroups),
    duplicateImageAltGroups: imageAltGroups.length,
    productsWithDuplicateImageAlts: countUniqueProducts(imageAltGroups),
    productsUsingNumberOnlyGalleryAlts: successful.filter((row) => row.usesNumberOnlyGalleryAlts).length,
    duplicateCanonicalGroups: canonicalGroups.length
  },
  duplicateRenderedTitles: titleGroups,
  duplicateRenderedDescriptions: descriptionGroups,
  duplicateSchemaDescriptions: schemaDescriptionGroups,
  duplicateImageAlts: imageAltGroups,
  duplicateCanonicals: canonicalGroups,
  rows
};

await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...payload.summary, output: path.relative(ROOT, outputPath) }, null, 2));

async function inspectProduct(finding) {
  const url = `${baseUrl}/products/${finding.handle}`;
  try {
    const response = await fetch(url, { headers: { "User-Agent": "DollWow rendered metadata audit/1.0" } });
    const html = await response.text();
    const productSchema = extractProductSchema(html);
    const imageAltTexts = extractImageAlts(html).filter((alt) => /image \d+ of \d+|product photo/i.test(alt));
    return {
      handle: finding.handle,
      brand: finding.brand,
      rawTitle: finding.title,
      status: response.status,
      title: extract(html, /<title>([\s\S]*?)<\/title>/i),
      description: extract(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i),
      schemaDescription: cleanValue(productSchema?.description),
      imageAltTexts,
      usesNumberOnlyGalleryAlts: imageAltTexts.length > 0 && imageAltTexts.every((alt) => /image \d+ of \d+$/i.test(alt)),
      canonical: extract(html, /<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']\s*\/?>/i),
      url
    };
  } catch (error) {
    return { handle: finding.handle, brand: finding.brand, rawTitle: finding.title, status: 0, error: error instanceof Error ? error.message : String(error), url };
  }
}

function extract(html, pattern) {
  const match = html.match(pattern);
  return decodeEntities(match?.[1] || "").replace(/\s+/g, " ").trim();
}

function duplicateGroups(rows, valueForRow) {
  const groups = new Map();
  for (const row of rows) {
    const key = valueForRow(row);
    if (!key) continue;
    const items = groups.get(key) || [];
    items.push({ handle: row.handle, brand: row.brand, title: row.title, description: row.description, canonical: row.canonical, url: row.url });
    groups.set(key, items);
  }
  return Array.from(groups.entries())
    .filter(([, products]) => products.length > 1)
    .map(([value, products]) => ({ value, count: products.length, products }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function countProducts(groups) {
  return groups.reduce((total, group) => total + group.products.length, 0);
}

function countUniqueProducts(groups) {
  return new Set(groups.flatMap((group) => group.products.map((product) => product.handle))).size;
}

function duplicateImageAltGroups(rows) {
  const groups = new Map();
  for (const row of rows) {
    for (const alt of row.imageAltTexts || []) {
      const key = normalize(alt);
      if (!key) continue;
      const products = groups.get(key) || [];
      if (!products.some((product) => product.handle === row.handle)) {
        products.push({ handle: row.handle, brand: row.brand, alt, url: row.url });
      }
      groups.set(key, products);
    }
  }
  return Array.from(groups.entries())
    .filter(([, products]) => products.length > 1)
    .map(([value, products]) => ({ value, count: products.length, products }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function extractProductSchema(html) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const payload = JSON.parse(decodeEntities(match[1]));
      const entries = Array.isArray(payload) ? payload : payload?.["@graph"] || [payload];
      const product = entries.find((entry) => entry?.["@type"] === "Product");
      if (product) return product;
    } catch {
      // Ignore unrelated or malformed JSON-LD blocks and continue searching.
    }
  }
  return null;
}

function extractImageAlts(html) {
  return Array.from(html.matchAll(/<img\b[^>]*\balt=["']([\s\S]*?)["'][^>]*>/gi), (match) => cleanValue(match[1])).filter(Boolean);
}

function cleanValue(value) {
  return decodeEntities(String(value || "")).replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    parsed[value.slice(2)] = values[index + 1];
    index += 1;
  }
  return parsed;
}
