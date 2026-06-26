import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
let tokenCache = null;

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

assertShopifyAdminEnv();

const execute = Boolean(args.execute);
const limit = Number(args.limit || 0);
const match = String(args.match || "").toLowerCase();
const outDir = path.join(ROOT, "data", "exports");
await fs.mkdir(outDir, { recursive: true });

const products = await fetchShopifyProducts(limit || 2500);
const filtered = match
  ? products.filter((product) => [product.handle, product.title, product.vendor, product.sourceTitle, product.displayName].filter(Boolean).join(" ").toLowerCase().includes(match))
  : products;

const results = filtered.map((product) => {
  const proposedDisplayName = buildDisplayName(product);
  const currentDisplayName = cleanText(product.displayName);
  const shouldSet = proposedDisplayName && currentDisplayName !== proposedDisplayName;
  const shouldClear = !proposedDisplayName && currentDisplayName;

  return {
    product,
    currentDisplayName,
    proposedDisplayName,
    status: shouldSet ? "set" : shouldClear ? "clear" : "unchanged"
  };
});

const actionable = results.filter((result) => result.status !== "unchanged");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(outDir, `shopify-display-name-backfill-${timestamp}.json`);
await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      match: match || null,
      totalProducts: products.length,
      scannedProducts: filtered.length,
      actionableProducts: actionable.length,
      summary: summarize(actionable),
      results: actionable.map((result) => ({
        id: result.product.id,
        handle: result.product.handle,
        title: result.product.title,
        currentDisplayName: result.currentDisplayName,
        proposedDisplayName: result.proposedDisplayName,
        status: result.status
      }))
    },
    null,
    2
  )
);

console.log(`Scanned ${filtered.length} live Shopify products.`);
console.log(`Found ${actionable.length} display-name changes.`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  for (const result of actionable.slice(0, 25)) {
    console.log(`- ${result.product.handle}: ${result.currentDisplayName || "(empty)"} -> ${result.proposedDisplayName || "(clear)"}`);
  }
  process.exit(0);
}

let updated = 0;
for (const result of actionable) {
  await updateDisplayName(result.product.id, result.proposedDisplayName);
  updated += 1;
  if (updated % 25 === 0 || updated === actionable.length) {
    console.log(`Updated ${updated}/${actionable.length}`);
  }
}

console.log(JSON.stringify({ mode: "execute", updated, report: path.relative(ROOT, reportPath) }, null, 2));

async function fetchShopifyProducts(limit) {
  const products = [];
  let after = null;

  while (products.length < limit) {
    const first = Math.min(100, limit - products.length);
    const data = await adminFetch(
      `query Products($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          edges {
            node {
              id
              handle
              title
              vendor
              productType
              tags
              brand: metafield(namespace: "custom", key: "brand") { value }
              displayName: metafield(namespace: "custom", key: "display_name") { value }
              sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
              sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
              headModel: metafield(namespace: "custom", key: "head_model") { value }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after }
    );

    products.push(
      ...data.products.edges.map(({ node }) => ({
        id: node.id,
        handle: node.handle,
        title: node.title || "",
        vendor: node.vendor || "",
        productType: node.productType || "",
        tags: node.tags || [],
        brand: node.brand?.value || node.vendor || "",
        displayName: node.displayName?.value || "",
        sourceTitle: node.sourceTitle?.value || "",
        sourceHandle: node.sourceHandle?.value || "",
        headModel: node.headModel?.value || ""
      }))
    );

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function updateDisplayName(productId, value) {
  const data = await adminFetch(
    `mutation SetDisplayName($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key value }
        userErrors { field message }
      }
    }`,
    {
      metafields: [
        {
          ownerId: productId,
          namespace: "custom",
          key: "display_name",
          type: "single_line_text_field",
          value: value || ""
        }
      ]
    }
  );

  const error = data.metafieldsSet.userErrors[0];
  if (error) {
    const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
    throw new Error(field ? `${field}: ${error.message}` : error.message);
  }
}

function buildDisplayName(product) {
  const sourceOrTitle = product.sourceTitle || product.title;
  const sourceSeriesValue = sourceSeries(sourceOrTitle);
  const brand = shortBrandLabel(product.brand || product.vendor);
  const direct = sanitizeDisplayName(
    extractNamedSuffix(sourceOrTitle) ||
      extractLeadingName(sourceOrTitle) ||
      extractLeadingName((product.sourceHandle || product.handle || "").replace(/-/g, " ")),
    sourceSeriesValue,
    brand
  );

  if (direct) return direct;
  if (sourceSeriesValue) return sourceSeriesValue;
  if (product.headModel) return readableHeadModel(product.headModel);
  return "";
}

function sanitizeDisplayName(value, series, brand) {
  const stripped = stripLeadingBrand(cleanText(value), brand);
  const cleaned = stripped
    .replace(/[._]+/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(rosemary|rosemarydoll|joy\s*love|joylovedolls?)\b/gi, "")
    .replace(/\b(ready[-\s]?to[-\s]?ship|customizable|companion|doll|dolls|sex|adult|silicone|tpe|hybrid|head|torso)\b/gi, "")
    .replace(/\b\d{2,3}\s*cm\b/gi, "")
    .replace(/\b\d+\s*ft\s*\d*\b/gi, "")
    .replace(/\b[a-z]{1,3}\s*-?\s*cup\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  const numericHead = cleaned.match(/^#?\s*([a-z]?\d+[a-z]?)$/i);
  if (numericHead) return `Head ${numericHead[1].toUpperCase()}`;
  const words = cleaned.split(" ").filter(Boolean);
  if (!words.length || words.length > 2) return "";
  if (series && words.length > 1) return "";
  if (words.every((word) => word.length <= 2)) return "";
  const normalized = titleCase(cleaned);
  if (["head", "heads", "realistic ai companion"].includes(normalized.toLowerCase())) return "";
  return normalized;
}

function shortBrandLabel(value) {
  const text = cleanText(value);
  if (!text) return "";
  if (/^wm(\s+dolls?)?$/i.test(text)) return "WM";
  return text.replace(/\s+dolls$/i, "");
}

function extractNamedSuffix(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const match = cleaned.match(/\s[-–]\s([^()]+?)(?:\s*\([^)]*\))?$/);
  return match ? cleanText(match[1]) : "";
}

function extractLeadingName(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const match = cleaned.match(/^([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*){0,2})\s+\d{2,3}\s*cm\b/i);
  return match ? cleanText(match[1]) : "";
}

function sourceSeries(value) {
  const match = cleanText(value).match(/\b(zelex\s+)?(sle|evo|gynoid|zen|ros|ai)\s*\d+(?:\.\d+)?\b/i);
  return match ? match[0].replace(/^zelex\s+/i, "").toUpperCase() : "";
}

function readableHeadModel(value) {
  const match = String(value || "").match(/(?:head[-_\s]*)?([a-z]?\d+[a-z]?)/i);
  return match ? `Head ${match[1].toUpperCase()}` : "";
}

function stripLeadingBrand(value, brand) {
  if (!value || !brand) return value;
  return value.replace(new RegExp(`^${escapeRegExp(brand)}\\s+`, "i"), "").trim();
}

function titleCase(value) {
  return String(value || "").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function summarize(results) {
  return results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] || 0) + 1;
    return summary;
  }, {});
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const accessToken = await getAdminAccessToken(domain);
  const response = await fetchWithRetry(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`Shopify Admin API request failed: ${message}`);
  }
  return payload.data;
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    throw new Error("Shopify Admin API requires SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET.");
  }

  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Failed to mint Shopify Admin access token.");
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000
  };
  return tokenCache.accessToken;
}

async function fetchWithRetry(url, options, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
  }
  throw lastError;
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required.");
  }
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
    // local env optional
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (["help", "execute"].includes(key)) {
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
  npm run backfill:display-names
  npm run backfill:display-names -- --match starpery
  npm run backfill:display-names -- --execute

Dry-runs by default. Backfills a short DollWow display name into Shopify metafield custom.display_name for support/search/cart use.`);
}
