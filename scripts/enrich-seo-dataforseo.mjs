import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT_DIR = path.join(ROOT, "data", "exports");
const DATAFORSEO_ENDPOINT = "https://api.dataforseo.com/v3/keywords_data/clickstream_data/dataforseo_search_volume/live";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

await loadEnvFile(path.join(ROOT, ".env.local"));
if (args.env) await loadEnvFile(path.resolve(ROOT, args.env));

const inputPath = path.resolve(ROOT, args.input || (await findLatestPreview()));
const outputDir = path.resolve(ROOT, args.outDir || DEFAULT_OUT_DIR);
const basename = path.basename(inputPath, ".json");
const outputPath = path.resolve(ROOT, args.out || path.join(outputDir, `${basename}-seo-products.json`));
const reportPath = path.resolve(ROOT, args.report || path.join(outputDir, `${basename}-seo-report.json`));
const execute = Boolean(args.execute);
const products = JSON.parse(await fs.readFile(inputPath, "utf8"));

if (!Array.isArray(products) || !products.length) {
  throw new Error(`No storefront products found in ${path.relative(ROOT, inputPath)}.`);
}

const candidates = unique(products.flatMap((product) => keywordCandidates(product))).slice(0, 1000);
const volumes = execute ? await fetchKeywordVolumes(candidates) : new Map();
const enrichedProducts = products.map((product) => enrichProductSeo(product, volumes));

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(enrichedProducts, null, 2), "utf8");
await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      sourceFile: path.relative(ROOT, inputPath),
      generatedAt: new Date().toISOString(),
      mode: execute ? "dataforseo" : "dry-run",
      productCount: products.length,
      keywordCount: candidates.length,
      output: path.relative(ROOT, outputPath),
      products: enrichedProducts.map((product) => ({
        handle: product.handle,
        title: product.title,
        primaryKeyword: product.seo?.primaryKeyword,
        seoTitle: product.seo?.title,
        seoDescription: product.seo?.description,
        topKeywords: (product.seo?.keywordCandidates || []).slice(0, 6)
      }))
    },
    null,
    2
  ),
  "utf8"
);

console.log(`${execute ? "DataForSEO enriched" : "Dry-run SEO enriched"} ${products.length} products from ${path.relative(ROOT, inputPath)}`);
console.log(`SEO storefront JSON: ${path.relative(ROOT, outputPath)}`);
console.log(`SEO report: ${path.relative(ROOT, reportPath)}`);
if (!execute) console.log("Dry run only. Add --execute to fetch DataForSEO search-volume data.");

async function findLatestPreview() {
  const entries = await fs.readdir(DEFAULT_OUT_DIR);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.startsWith("rosemary-") && entry.endsWith("-storefront-products.json"))
      .map(async (entry) => {
        const file = path.join(DEFAULT_OUT_DIR, entry);
        const stat = await fs.stat(file);
        return { file, mtimeMs: stat.mtimeMs };
      })
  );
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files[0]) throw new Error("No storefront preview JSON found. Run npm run prepare:rosemary-import first.");
  return files[0].file;
}

async function fetchKeywordVolumes(keywords) {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
  }
  if (!keywords.length) return new Map();

  const response = await fetch(DATAFORSEO_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      {
        keywords,
        location_name: args.location || "United States",
        language_code: args.language || "en"
      }
    ])
  });

  const payload = await response.json();
  if (!response.ok || payload.status_code >= 40000) {
    throw new Error(payload.status_message || `DataForSEO request failed with HTTP ${response.status}.`);
  }

  const results = payload.tasks?.flatMap((task) => task.result || []) || [];
  return new Map(
    results.map((item) => [
      normalizeKeyword(item.keyword),
      {
        searchVolume: Number(item.search_volume || 0) || null,
        competition: typeof item.competition === "number" ? item.competition : null,
        cpc: typeof item.cpc === "number" ? item.cpc : null
      }
    ])
  );
}

function enrichProductSeo(product, volumes) {
  const candidates = keywordCandidates(product).map((keyword) => {
    const data = volumes.get(normalizeKeyword(keyword));
    return {
      keyword,
      searchVolume: data?.searchVolume ?? null,
      competition: data?.competition ?? null,
      cpc: data?.cpc ?? null
    };
  });
  candidates.sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));
  const primaryKeyword = candidates.find((candidate) => candidate.searchVolume)?.keyword || candidates[0]?.keyword || product.title;

  return {
    ...product,
    seo: {
      ...(product.seo || {}),
      primaryKeyword,
      title: seoTitle(product, primaryKeyword),
      description: seoDescription(product, primaryKeyword),
      keywordCandidates: candidates
    }
  };
}

function keywordCandidates(product) {
  const extended = product.extended || {};
  const brand = cleanBrand(extended.brand || product.vendor || "");
  const material = cleanText(extended.material || inferMaterial(product));
  const height = extended.heightCm ? `${extended.heightCm}cm` : "";
  const cup = cleanCup(extended.cupSize);
  const base = [brand, height, cup ? `${cup} cup` : "", material, "sex doll"].filter(Boolean).join(" ");
  const custom = extended.customAvailable ? "custom sex doll" : "in stock sex doll";
  const warehouse = extended.warehouseCountry === "United States" ? "usa warehouse sex doll" : "";

  return unique([
    normalizeKeyword(base),
    normalizeKeyword([brand, material, "sex doll"].filter(Boolean).join(" ")),
    normalizeKeyword([height, material, "sex doll"].filter(Boolean).join(" ")),
    normalizeKeyword([cup ? `${cup} cup` : "", material, "sex doll"].filter(Boolean).join(" ")),
    normalizeKeyword([brand, custom].filter(Boolean).join(" ")),
    normalizeKeyword(warehouse),
    normalizeKeyword(product.title.replace(/\bcompanion doll\b/i, "sex doll"))
  ]).filter((keyword) => keyword.length >= 8);
}

function seoTitle(product, primaryKeyword) {
  const extended = product.extended || {};
  const brand = cleanBrand(extended.brand || product.vendor || "");
  const title = primaryKeyword && primaryKeyword !== product.title ? titleCase(primaryKeyword) : product.title;
  return truncate(cleanText(`${title}${brand && !title.toLowerCase().includes(brand.toLowerCase()) ? ` by ${brand}` : ""} | DollWow`), 68);
}

function seoDescription(product, primaryKeyword) {
  const extended = product.extended || {};
  const stock = extended.stockStatus === "ready_to_ship" ? "warehouse timing" : "custom options";
  return truncate(
    cleanText(
      `Compare ${primaryKeyword || product.title} with clear specs, ${stock}, discreet checkout, and DollWow team confirmation before fulfillment.`
    ),
    156
  );
}

function inferMaterial(product) {
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  if (text.includes("silicone head")) return "silicone head";
  if (text.includes("silicone")) return "silicone";
  if (text.includes("tpe")) return "tpe";
  return "adult doll";
}

function cleanBrand(value) {
  return cleanText(value).replace(/\bWm\b/i, "WM").replace(/\bTpe\b/i, "TPE");
}

function cleanCup(value) {
  return cleanText(value).replace(/\s*cup$/i, "").replace(/[^a-z]/gi, "").toUpperCase();
}

function normalizeKeyword(value) {
  return cleanText(value).toLowerCase();
}

function titleCase(value) {
  return cleanText(value).replace(/\b[a-z]/g, (letter) => letter.toUpperCase()).replace(/\bTpe\b/g, "TPE").replace(/\bWm\b/g, "WM");
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trimEnd();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "help" || key === "execute") {
      parsed[key] = true;
    } else {
      parsed[key] = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

async function loadEnvFile(envPath) {
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] ||= value;
    }
  } catch {
    // Optional for dry runs.
  }
}

function printHelp() {
  console.log(`Usage:
  npm run seo:dataforseo -- --input data/exports/rosemary-wm-storefront-products.json
  npm run seo:dataforseo -- --input data/exports/rosemary-wm-storefront-products.json --execute
  npm run seo:dataforseo -- --input data/exports/rosemary-wm-storefront-products.json --env ../ColorMine-Website/.env --execute

Dry-runs by default and writes SEO-enriched storefront JSON plus a review report.
With --execute, fetches DataForSEO search-volume data for generated product keyword candidates.`);
}
