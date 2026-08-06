import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const collectionUrl = args.url || "https://cloudclimax.co.uk/product-category/luxury-sex-dolls/rosretty-doll/";
const outputPath = path.resolve(ROOT, args.output || "data/imports/rosretty-cloudclimax-latest.json");
const maxPages = Number(args["max-pages"] || 12);
const products = [];
const seenUrls = new Set();

for (let page = 1; page <= maxPages; page += 1) {
  const url = new URL(page === 1 ? collectionUrl : `page/${page}/`, collectionUrl);
  url.searchParams.set("orderby", "date");
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; DollWowCatalogReview/1.0)" }
  });

  // WordPress returns a 404 after the final paginated collection page.
  if (response.status === 404 && page > 1) break;
  if (!response.ok) throw new Error(`CloudClimax returned ${response.status} for ${url}`);
  const pageProducts = extractProducts(await response.text());
  if (!pageProducts.length) break;

  let added = 0;
  for (const product of pageProducts) {
    if (seenUrls.has(product.sourceUrl)) continue;
    seenUrls.add(product.sourceUrl);
    products.push({ ...product, releaseRank: products.length + 1 });
    added += 1;
  }
  if (!added) break;
}

const output = {
  source: collectionUrl,
  capturedAt: new Date().toISOString(),
  sort: "latest-first",
  products
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(ROOT, outputPath), count: products.length, first: products.slice(0, 5) }, null, 2));

function extractProducts(html) {
  const results = [];
  const cards = html.matchAll(/<li\b[^>]*class="[^"]*\bproduct\b[^"]*"[^>]*>([\s\S]*?)<\/li>/gi);
  for (const cardMatch of cards) {
    const card = cardMatch[1];
    const sourceUrl = firstMatch(card, /<a\s+href="([^"]+)"[^>]*class="[^"]*woocommerce-LoopProduct-link[^"]*"/i);
    const title = cleanHtml(firstMatch(card, /<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i));
    if (!sourceUrl || !title) continue;
    const imageUrl = firstMatch(card, /<img[^>]+(?:data-src|src)="([^"]+)"/i);
    results.push({ title, sourceUrl: decodeHtml(sourceUrl), imageUrl: imageUrl ? decodeHtml(imageUrl) : undefined });
  }
  return results;
}

function firstMatch(value, expression) {
  return value.match(expression)?.[1];
}

function cleanHtml(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
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
