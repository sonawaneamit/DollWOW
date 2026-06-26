import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const DEFAULT_REPORT_DIR = path.join(ROOT, "data", "exports");
const MEASUREMENT_LABELS = [
  "Height",
  "Weight",
  "Bra Size",
  "Cup Size",
  "Cup size",
  "Feet Length",
  "Bust",
  "Legs Length",
  "Waist",
  "Arms Length",
  "Hip",
  "Shoulders Width",
  "Shoulder Width",
  "Vagina Length",
  "Vagina Depth",
  "Anus Length",
  "Anus Depth",
  "Mouth Depth",
  "Oral Depth"
];
const MEASUREMENT_STOP_LABELS = [...MEASUREMENT_LABELS, "Brand", "Material", "Availability", "Warehouse", "Delivery"];
const MEASUREMENT_LOOKAHEAD = MEASUREMENT_STOP_LABELS.map(escapeRegex).join("|");

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const execute = Boolean(args.execute);
const force = Boolean(args.force);
const limit = Number(args.limit || 0);
const minMeasurements = Number(args.minMeasurements || 6);
const concurrency = Math.max(1, Number(args.concurrency || 5));
const requestTimeoutMs = Math.max(5_000, Number(args.timeoutMs || 20_000));
const reportDir = path.resolve(ROOT, args.outDir || DEFAULT_REPORT_DIR);
const reportBase = `measurement-backfill-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const sourceMap = await buildSourceMap();
const products = await fetchShopifyProducts(limit || 2500);

if (args.fromReport) {
  await runFromReport(path.resolve(ROOT, args.fromReport), products);
  process.exit(0);
}

const targets = products.filter((product) => force || needsBackfill(product));

console.log(`Catalog products: ${products.length}`);
console.log(`Products needing measurement backfill: ${targets.length}`);
console.log(`Known source handle mappings: ${sourceMap.size}`);

let updated = 0;
let processed = 0;
const results = await mapWithConcurrency(targets, concurrency, async (product) => {
  let result;
  let activeSource = null;
  try {
    const source = chooseSource(product, sourceMap);
    activeSource = source;
    if (!source.ok) {
      result = {
        handle: product.handle,
        title: product.title,
        status: source.status,
        reason: source.reason,
        sourceCandidates: source.candidates?.slice(0, 5) || []
      };
      return result;
    }

    const scraped = scrapeMeasurementsFromCandidate(source) || (await scrapeMeasurements(source.sourceUrl));
    const count = measurementCount(scraped.measurements);
    if (count < minMeasurements) {
      result = {
        handle: product.handle,
        title: product.title,
        status: "skipped_sparse_measurements",
        measurementCount: count,
        sourceUrl: source.sourceUrl,
        sourceTitle: source.sourceTitle,
        measurements: scraped.measurements,
        headModel: scraped.headModel || ""
      };
      return result;
    }

    if (execute) {
      await setProductMetafields(product.id, [
        metafield(product.id, "measurements", JSON.stringify(scraped.measurements), "json"),
        metafield(product.id, "source_url", source.sourceUrl),
        metafield(product.id, "source_title", source.sourceTitle || scraped.title || ""),
        metafield(product.id, "source_handle", source.sourceHandle || sourceHandleFromUrl(source.sourceUrl)),
        ...(scraped.headModel ? [metafield(product.id, "head_model", scraped.headModel)] : [])
      ]);
      updated += 1;
      if (updated % 25 === 0) console.log(`Updated ${updated}/${targets.length}`);
    }

    result = {
      handle: product.handle,
      title: product.title,
      status: execute ? "updated" : "would_update",
      measurementCount: count,
      sourceUrl: source.sourceUrl,
      sourceTitle: source.sourceTitle || scraped.title || "",
      measurements: scraped.measurements,
      headModel: scraped.headModel || ""
    };
    return result;
  } catch (error) {
    result = {
        handle: product.handle,
        title: product.title,
        status: "error",
        reason: error.message,
        sourceUrl: activeSource?.sourceUrl,
        sourceTitle: activeSource?.sourceTitle,
        headModel: product.headModel?.value || ""
      };
      return result;
  } finally {
    processed += 1;
    if (processed % 100 === 0 || processed === targets.length) console.log(`Processed ${processed}/${targets.length}`);
  }
});

await fs.mkdir(reportDir, { recursive: true });
const summary = summarize(results);
const report = {
  mode: execute ? "execute" : "dry-run",
  generatedAt: new Date().toISOString(),
  productCount: products.length,
  targetCount: targets.length,
  updated,
  summary,
  results
};
const jsonPath = path.join(reportDir, `${reportBase}.json`);
const csvPath = path.join(reportDir, `${reportBase}.csv`);
await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
await fs.writeFile(csvPath, toCsv(results), "utf8");

console.log(JSON.stringify({ mode: report.mode, productCount: products.length, targetCount: targets.length, updated, summary, json: path.relative(ROOT, jsonPath), csv: path.relative(ROOT, csvPath) }, null, 2));
if (!execute) console.log("Dry run only. Rerun with --execute to write Shopify metafields.");

async function runFromReport(reportPath, products) {
  const sourceReport = await readJson(reportPath);
  const productsByHandle = new Map(products.map((product) => [product.handle, product]));
  const rows = (sourceReport.results || []).filter((result) => result.status === "would_update" && measurementCount(result.measurements) >= minMeasurements);
  const limitedRows = limit ? rows.slice(0, limit) : rows;
  let updatedFromReport = 0;
  const reportResults = [];

  for (const result of limitedRows) {
    const product = productsByHandle.get(result.handle);
    if (!product) {
      reportResults.push({ ...result, status: "skipped_missing_shopify_product" });
      continue;
    }

    if (execute) {
      await setProductMetafields(product.id, [
        metafield(product.id, "measurements", JSON.stringify(result.measurements), "json"),
        metafield(product.id, "source_url", result.sourceUrl || ""),
        metafield(product.id, "source_title", result.sourceTitle || ""),
        metafield(product.id, "source_handle", sourceHandleFromUrl(result.sourceUrl || "")),
        ...(result.headModel ? [metafield(product.id, "head_model", result.headModel)] : [])
      ]);
      updatedFromReport += 1;
      if (updatedFromReport % 50 === 0 || updatedFromReport === limitedRows.length) console.log(`Updated ${updatedFromReport}/${limitedRows.length} from report`);
    }

    reportResults.push({
      ...result,
      status: execute ? "updated_from_report" : "would_update_from_report"
    });
  }

  await fs.mkdir(reportDir, { recursive: true });
  const output = {
    mode: execute ? "execute-from-report" : "dry-run-from-report",
    sourceReport: path.relative(ROOT, reportPath),
    generatedAt: new Date().toISOString(),
    productCount: products.length,
    targetCount: limitedRows.length,
    updated: updatedFromReport,
    summary: summarize(reportResults),
    results: reportResults
  };
  const jsonPath = path.join(reportDir, `${reportBase}-from-report.json`);
  const csvPath = path.join(reportDir, `${reportBase}-from-report.csv`);
  await fs.writeFile(jsonPath, JSON.stringify(output, null, 2), "utf8");
  await fs.writeFile(csvPath, toCsv(reportResults), "utf8");
  console.log(JSON.stringify({ mode: output.mode, targetCount: output.targetCount, updated: updatedFromReport, summary: output.summary, json: path.relative(ROOT, jsonPath), csv: path.relative(ROOT, csvPath) }, null, 2));
  if (!execute) console.log("Dry run only. Add --execute to write these report-backed measurements.");
}

async function buildSourceMap() {
  const map = new Map();
  for (const file of await listJsonFiles(path.join(ROOT, "data", "imports"))) {
    const data = await readJson(file);
    for (const product of data.products || []) {
      addSourceCandidate(map, product.handle, product, file);
      addSourceCandidate(map, sourceHandleFromUrl(product.sourceUrl), product, file);
    }
  }

  for (const file of await listJsonFiles(path.join(ROOT, "data", "exports"))) {
    if (!file.endsWith("-storefront-products.json") && !file.includes("-storefront-products-seo-products.json")) continue;
    const products = await readJson(file);
    if (!Array.isArray(products)) continue;
    for (const product of products) {
      addSourceCandidate(map, product.handle, product, file);
      addSourceCandidate(map, product.sourceHandle, product, file);
      addSourceCandidate(map, sourceHandleFromUrl(product.sourceUrl), product, file);
      for (const handle of product.reviewFlags?.legacyHandles || []) addSourceCandidate(map, handle, product, file);
    }
  }

  return map;
}

function addSourceCandidate(map, handle, product, sourceFile) {
  const key = slugify(handle);
  if (!key || !product?.sourceUrl) return;
  const candidate = {
    sourceUrl: normalizeRosemaryProductUrl(product.sourceUrl),
    sourceTitle: cleanText(product.sourceTitle || product.title || ""),
    sourceHandle: product.sourceHandle || sourceHandleFromUrl(product.sourceUrl),
    sourceDescription: cleanText(product.description || product.sourceDescription || ""),
    sourceFile: path.relative(ROOT, sourceFile)
  };
  if (!candidate.sourceUrl) return;
  const list = map.get(key) || [];
  if (!list.some((item) => item.sourceUrl === candidate.sourceUrl && item.sourceTitle === candidate.sourceTitle)) list.push(candidate);
  map.set(key, list);
}

function chooseSource(product, map) {
  const existingUrl = product.sourceUrl?.value;
  if (existingUrl) {
    return {
      ok: true,
      sourceUrl: normalizeRosemaryProductUrl(existingUrl),
      sourceTitle: product.sourceTitle?.value || "",
      sourceHandle: product.sourceHandle?.value || sourceHandleFromUrl(existingUrl)
    };
  }

  const candidates = map.get(slugify(product.handle)) || [];
  const uniqueUrls = [...new Map(candidates.map((candidate) => [candidate.sourceUrl, candidate])).values()];
  if (uniqueUrls.length === 1) return { ok: true, ...uniqueUrls[0] };
  if (uniqueUrls.length > 1) {
    const scored = uniqueUrls
      .map((candidate) => ({ ...candidate, score: sourceScore(product, candidate) }))
      .sort((a, b) => b.score - a.score);
    if (scored[0]?.score >= 3 && scored[0].score > (scored[1]?.score || 0)) return { ok: true, ...scored[0] };
    return { ok: false, status: "skipped_ambiguous_source", reason: "Multiple source URLs matched this handle.", candidates: uniqueUrls };
  }

  if (looksLikeRosemaryHandle(product.handle)) {
    return {
      ok: true,
      sourceUrl: `https://www.rosemarydoll.com/product/${product.handle}/`,
      sourceTitle: product.title,
      sourceHandle: product.handle
    };
  }

  return { ok: false, status: "skipped_no_source", reason: "No source URL mapping found." };
}

function sourceScore(product, candidate) {
  const productTokens = new Set(cleanText(`${product.title} ${product.handle}`).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const sourceTokens = cleanText(`${candidate.sourceTitle} ${candidate.sourceHandle}`).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  return sourceTokens.reduce((score, token) => score + (productTokens.has(token) ? 1 : 0), 0);
}

function looksLikeRosemaryHandle(handle) {
  return /\b\d{2,3}cm\b/i.test(handle) && /\b(?:cup|doll|head)\b/i.test(handle);
}

async function scrapeMeasurements(sourceUrl) {
  const html = await fetchText(sourceUrl);
  const description =
    pickMeta(html, "og:description") ||
    pickMetaName(html, "description") ||
    cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  return {
    title: pickMeta(html, "og:title") || pickTitle(html),
    measurements: extractMeasurements(description),
    headModel: extractHeadModel(description)
  };
}

function scrapeMeasurementsFromCandidate(candidate) {
  const localMeasurements = extractMeasurements(candidate.sourceDescription || "");
  const headModel = extractHeadModel(candidate.sourceDescription || "");
  if (measurementCount(localMeasurements) >= minMeasurements || headModel) {
    return {
      title: candidate.sourceTitle || "",
      measurements: localMeasurements,
      headModel,
      origin: "local-description"
    };
  }
  return null;
}

function extractMeasurements(text) {
  const normalized = cleanText(text || "");
  const result = {};
  for (const label of MEASUREMENT_LABELS) {
    const value = cleanText(
      normalized.match(new RegExp(`\\b${escapeRegex(label)}:\\s*([^:]+?)(?=\\s+(?:${MEASUREMENT_LOOKAHEAD})|$)`, "i"))?.[1] || ""
    );
    if (!value) continue;
    result[normalizeMeasurementLabel(label)] = value;
  }
  return result;
}

async function fetchShopifyProducts(limit) {
  const products = [];
  let after = null;
  while (products.length < limit) {
    const first = Math.min(250, limit - products.length);
    const data = await adminFetch(
      `query Products($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          nodes {
            id
            handle
            title
            measurements: metafield(namespace: "custom", key: "measurements") { value }
            headModel: metafield(namespace: "custom", key: "head_model") { value }
            sourceUrl: metafield(namespace: "custom", key: "source_url") { value }
            sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
            sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after }
    );
    products.push(
      ...data.products.nodes.map((node) => ({
        ...node,
        measurements: parseJson(node.measurements?.value) || {}
      }))
    );
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products;
}

async function setProductMetafields(ownerId, metafields) {
  const data = await adminFetch(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key }
        userErrors { field message }
      }
    }`,
    { metafields }
  );
  const error = data.metafieldsSet.userErrors[0];
  if (error) throw new Error(`${Array.isArray(error.field) ? error.field.join(".") : error.field}: ${error.message}`);
}

function metafield(ownerId, key, value, type = "single_line_text_field") {
  return { ownerId, namespace: "custom", key, type, value: String(value) };
}

async function adminFetch(query, variables = {}) {
  const domain = requireEnv("SHOPIFY_STORE_DOMAIN").replace(/^https?:\/\//, "");
  const response = await fetchWithRetry(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": await getAdminAccessToken(domain)
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || `Shopify Admin API failed with HTTP ${response.status}.`);
  }
  return payload.data;
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: requireEnv("SHOPIFY_CLIENT_ID"),
      client_secret: requireEnv("SHOPIFY_CLIENT_SECRET")
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Failed to mint Shopify Admin token.");
  return payload.access_token;
}

async function fetchText(url) {
  const response = await fetchWithRetry(url, {
    headers: {
      "user-agent": "Mozilla/5.0 DollWow measurement review bot",
      accept: "text/html,application/xhtml+xml"
    }
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

async function fetchWithRetry(url, options, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error.name === "AbortError" ? new Error(`Request timed out after ${requestTimeoutMs}ms`) : error;
      if (attempt === attempts) throw lastError;
    } finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
  }
  throw lastError;
}

async function mapWithConcurrency(values, size, mapper) {
  const results = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function listJsonFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => path.join(dir, entry.name));
  } catch {
    return [];
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return {};
  }
}

function pickMeta(html, property) {
  const escaped = escapeRegex(property);
  return decodeHtml(html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] || "");
}

function pickMetaName(html, name) {
  const escaped = escapeRegex(name);
  return decodeHtml(html.match(new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] || "");
}

function pickTitle(html) {
  return decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
}

function normalizeMeasurementLabel(label) {
  if (/^bra size$/i.test(label) || /^cup size$/i.test(label)) return "Cup size";
  if (/^shoulder width$/i.test(label)) return "Shoulders Width";
  if (/^mouth depth$/i.test(label)) return "Oral Depth";
  if (/^vagina length$/i.test(label)) return "Vagina Depth";
  if (/^anus length$/i.test(label)) return "Anus Depth";
  return label;
}

function measurementCount(measurements) {
  return Object.values(measurements || {}).filter(Boolean).length;
}

function needsBackfill(product) {
  const measurements = product.measurements || {};
  const count = measurementCount(measurements);
  if (count < minMeasurements) return true;
  if (!product.headModel?.value) return true;
  return MEASUREMENT_LABELS.some((label) => !measurements[normalizeMeasurementLabel(label)]);
}

function extractHeadModel(text) {
  const normalized = cleanText(text || "");
  const patterns = [
    /\b(?:has|with)\s+[a-z0-9\s-]*?head\s*#\s*([a-z]{0,6}\d[\da-z-]*)\b/i,
    /\bhead\s*(?:#|no\.?|number)?\s*([a-z]{0,6}\d[\da-z-]*)\b/i,
    /\bsilicone\s*#\s*([a-z]{0,8}\d[\da-z-]*)\b/i
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern)?.[1];
    const cleaned = normalizeHeadModel(match);
    if (cleaned) return cleaned;
  }
  return "";
}

function normalizeHeadModel(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/^#/, "")
    .replace(/\.+$/, "")
    .replace(/\s+/g, "")
    .toUpperCase();
  if (!cleaned || !/[0-9]/.test(cleaned) || !/^[A-Z0-9-]+$/.test(cleaned)) return "";
  return cleaned;
}

function sourceHandleFromUrl(url) {
  if (!url) return "";
  try {
    return new URL(url).pathname.replace(/\/$/, "").split("/").pop() || "";
  } catch {
    return "";
  }
}

function normalizeRosemaryProductUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname === "rosemarydoll.com") url.hostname = "www.rosemarydoll.com";
    url.search = "";
    return url.toString();
  } catch {
    return "";
  }
}

function summarize(results) {
  return results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] || 0) + 1;
    return summary;
  }, {});
}

function toCsv(results) {
  const headers = ["handle", "status", "measurementCount", "headModel", "sourceUrl", "sourceTitle", "reason", "title"];
  return `${headers.join(",")}\n${results.map((result) => headers.map((header) => csvCell(result[header] ?? "")).join(",")).join("\n")}\n`;
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function cleanText(value) {
  return decodeHtml(String(value || "").replace(/\s+/g, " ").trim());
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
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
    // Local env is optional when shell env is already populated.
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (["help", "execute", "force"].includes(key)) {
      parsed[key] = true;
    } else {
      parsed[key] = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage:
  npm run backfill:measurements
  npm run backfill:measurements -- --limit 20
  npm run backfill:measurements -- --timeoutMs 15000
  npm run backfill:measurements -- --fromReport data/exports/measurement-backfill-example.json --execute
  npm run backfill:measurements -- --execute
  npm run backfill:measurements -- --force --execute

Dry-runs by default. The script reconstructs Rosemary source URLs from local import/export artifacts,
scrapes full body measurements, and writes Shopify custom.measurements/source_* metafields when --execute is passed.`);
}
