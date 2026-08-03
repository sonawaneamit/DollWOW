import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const SOURCE_API = "https://www.rosemarydoll.com/wp-json/wp/v2/product";
const SOURCE_DATE_CACHE_PATH = path.join(ROOT, "data", "exports", "source-release-date-cache.json");
let tokenCache = null;

await loadLocalEnv();
const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log("Usage: npm run backfill:source-release-order [-- --brand <brand>] [--execute]");
  process.exit(0);
}

assertShopifyAdminEnv();
const brands = JSON.parse(await fs.readFile(path.join(ROOT, "lib/catalog/brand-data.json"), "utf8"));
const requestedBrand = args.brand ? resolveBrand(args.brand, brands) : null;
if (args.brand && !requestedBrand) throw new Error(`Unknown catalog brand: ${args.brand}`);

const execute = Boolean(args.execute);
if (execute) await ensureStorefrontReleaseRankDefinition();

const products = await fetchProducts();
const grouped = groupByBrand(products, brands, requestedBrand?.value);
const report = { mode: execute ? "execute" : "dry-run", generatedAt: new Date().toISOString(), brands: [] };
const updates = [];

for (const brand of (requestedBrand ? [requestedBrand] : brands)) {
  const entries = grouped.get(brand.value) || [];
  const rosemaryEntries = entries.filter((product) => isRosemarySource(product.sourceUrl) || product.sourceHandle);
  const dates = await fetchSourceDates(rosemaryEntries);
  const ranks = buildRanks(dates);
  const unmatched = [];
  let unchanged = 0;

  for (const product of entries) {
    const sourceKey = sourceKeyFor(product);
    const rank = sourceKey ? ranks.get(sourceKey) : undefined;
    if (rank === undefined) {
      unmatched.push({ handle: product.handle, title: product.title, sourceHandle: product.sourceHandle || null, sourceUrl: product.sourceUrl || null });
      continue;
    }
    if (toInteger(product.sourceReleaseRank) === rank) unchanged += 1;
    else updates.push({ product, rank, brand: brand.value });
  }

  report.brands.push({
    brand: brand.value,
    label: brand.label,
    liveProducts: entries.length,
    verifiedSourceDates: dates.size,
    unchanged,
    updatesNeeded: updates.filter((item) => item.brand === brand.value).length,
    unmatched
  });
  console.log(`${brand.label}: ${dates.size}/${entries.length} source dates verified`);
}

report.totalUpdatesNeeded = updates.length;
report.totalUnmatched = report.brands.reduce((total, brand) => total + brand.unmatched.length, 0);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(ROOT, "data", "exports");
await fs.mkdir(outDir, { recursive: true });
const reportPath = path.join(outDir, `source-release-order-${timestamp}.json`);
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

console.log(`Updates needed: ${updates.length}`);
console.log(`Unmatched products left unchanged: ${report.totalUnmatched}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) process.exit(0);

let updated = 0;
for (let index = 0; index < updates.length; index += 25) {
  const batch = updates.slice(index, index + 25);
  await setReleaseRanks(batch.map(({ product, rank }) => ({ productId: product.id, rank })));
  updated += batch.length;
  console.log(`Updated ${updated}/${updates.length}`);
}
console.log(`Completed: ${updated} release ranks saved.`);

function groupByBrand(products, brands, onlyBrand) {
  const grouped = new Map(brands.map((brand) => [brand.value, []]));
  for (const product of products) {
    const brand = resolveProductBrand(product, brands);
    if (brand && (!onlyBrand || brand.value === onlyBrand)) grouped.get(brand.value).push(product);
  }
  return grouped;
}

function resolveProductBrand(product, brands) {
  const values = [product.brand, product.vendor, ...product.tags, product.title].map(normalizeText).filter(Boolean);
  return brands.find((brand) => {
    const aliases = [brand.value, brand.label, brand.collectionHandle, ...brand.tags, ...brand.aliases].map(normalizeText);
    return aliases.some((alias) => values.some((value) => value === alias || new RegExp(`(^| )${escapeRegExp(alias)}( |$)`).test(value)));
  });
}

function resolveBrand(value, brands) {
  const normalized = normalizeText(value);
  return brands.find((brand) => [brand.value, brand.label, brand.collectionHandle, ...brand.tags, ...brand.aliases].some((alias) => normalizeText(alias) === normalized));
}

async function fetchSourceDates(products) {
  const sourceKeys = [...new Set(products.map(sourceKeyFor).filter(Boolean))];
  const cachedDates = await readSourceDateCache();
  const dates = new Map(sourceKeys.filter((key) => cachedDates[key]).map((key) => [key, cachedDates[key]]));
  const keysToCheck = sourceKeys.filter((key) => !dates.has(key));
  const concurrency = 32;

  for (let index = 0; index < keysToCheck.length; index += concurrency) {
    const chunk = keysToCheck.slice(index, index + concurrency);
    const settled = await Promise.all(chunk.map(fetchSourceDate));
    for (const entry of settled) {
      if (!entry) continue;
      dates.set(entry.key, entry.date);
      cachedDates[entry.key] = entry.date;
    }
    await fs.mkdir(path.dirname(SOURCE_DATE_CACHE_PATH), { recursive: true });
    await fs.writeFile(SOURCE_DATE_CACHE_PATH, JSON.stringify(cachedDates, null, 2));
    console.log(`Checked source dates ${dates.size}/${sourceKeys.length}`);
  }
  return dates;
}

async function readSourceDateCache() {
  try {
    return JSON.parse(await fs.readFile(SOURCE_DATE_CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function fetchSourceDate(key) {
  const url = new URL(SOURCE_API);
  url.searchParams.set("slug", key);
  try {
    const response = await fetch(url, { headers: { "User-Agent": "DollWow catalog ordering/1.0" } });
    if (!response.ok) return null;
    const payload = await response.json();
    const date = payload?.[0]?.date_gmt || payload?.[0]?.date;
    return typeof date === "string" && /^\d{4}-\d{2}-\d{2}T/.test(date) ? { key, date } : null;
  } catch {
    return null;
  }
}

function buildRanks(dates) {
  const ranks = new Map();
  [...dates.entries()]
    .sort(([leftKey, leftDate], [rightKey, rightDate]) => leftDate.localeCompare(rightDate) || leftKey.localeCompare(rightKey))
    .forEach(([key], index) => ranks.set(key, index + 1));
  return ranks;
}

function sourceKeyFor(product) {
  const value = product.sourceHandle || product.sourceUrl;
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.pathname.split("/").filter(Boolean).at(-1)?.toLowerCase() || "";
  } catch {
    return String(value).trim().toLowerCase().replace(/^https?:\/\/[^/]+\/product\//, "").replace(/\/$/, "");
  }
}

function isRosemarySource(value) {
  try {
    return new URL(value).hostname.endsWith("rosemarydoll.com");
  } catch {
    return false;
  }
}

async function fetchProducts() {
  const products = [];
  let after = null;
  while (true) {
    const data = await adminFetch(
      `query Products($after: String) {
        products(first: 100, after: $after, query: "status:active", sortKey: TITLE) {
          edges { node {
            id handle title vendor tags
            brand: metafield(namespace: "custom", key: "brand") { value }
            sourceUrl: metafield(namespace: "custom", key: "source_url") { value }
            sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
            sourceReleaseRank: metafield(namespace: "custom", key: "source_release_rank") { value }
          } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after }
    );
    products.push(...data.products.edges.map(({ node }) => ({
      ...node,
      brand: node.brand?.value || "",
      sourceUrl: node.sourceUrl?.value || "",
      sourceHandle: node.sourceHandle?.value || "",
      sourceReleaseRank: node.sourceReleaseRank?.value || ""
    })));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products;
}

async function ensureStorefrontReleaseRankDefinition() {
  const data = await adminFetch(`query Definition { metafieldDefinition(identifier: { namespace: "custom", key: "source_release_rank", ownerType: PRODUCT }) { id } }`);
  if (data.metafieldDefinition) return;
  const response = await adminFetch(`mutation Create($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { userErrors { field message } } }`, {
    definition: { name: "Source release rank", namespace: "custom", key: "source_release_rank", ownerType: "PRODUCT", type: "number_integer", access: { storefront: "PUBLIC_READ" } }
  });
  const error = response.metafieldDefinitionCreate?.userErrors?.[0];
  if (error) throw new Error(error.message);
}

async function setReleaseRanks(entries) {
  const data = await adminFetch(`mutation SetRank($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { field message } } }`, {
    metafields: entries.map(({ productId, rank }) => ({ ownerId: productId, namespace: "custom", key: "source_release_rank", type: "number_integer", value: String(rank) }))
  });
  const error = data.metafieldsSet.userErrors[0];
  if (error) throw new Error(error.message);
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const token = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token }, body: JSON.stringify({ query, variables }) });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `Shopify Admin API failed with HTTP ${response.status}.`);
  return payload.data;
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) throw new Error("SHOPIFY_STORE_DOMAIN plus Shopify Admin credentials are required.");
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }) });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Failed to mint Shopify Admin access token.");
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000 };
  return tokenCache.accessToken;
}

async function loadLocalEnv() {
  try {
    const content = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Environment variables can be supplied by Vercel or CI.
  }
}

function parseArgs(values) {
  const args = {};
  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].startsWith("--")) continue;
    const key = values[index].slice(2);
    args[key] = values[index + 1] && !values[index + 1].startsWith("--") ? values[++index] : true;
  }
  return args;
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}
