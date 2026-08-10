import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const args = parseArgs(process.argv.slice(2));
const executeDrafts = Boolean(args["execute-drafts"]);
const executeRegions = Boolean(args["execute-regions"]);
const executeOptions = Boolean(args["execute-options"]);
const prepareMissing = Boolean(args["prepare-missing"]);
const snapshotDate = String(args.date || new Date().toISOString().slice(0, 10));
const regions = ["usa", "eu", "canada", "australia"];
const regionLabels = { usa: "United States", eu: "European Union", canada: "Canada", australia: "Australia" };
let tokenCache;
const carriedBrands = new Map([
  ["erovenus", "Erovenus"], ["se dolls", "SE Doll"], ["jarliet dolls", "Jarliet Dolls"],
  ["wm dolls", "WM Dolls"], ["piper dolls", "Piper Dolls"], ["irontech dolls", "Irontech Dolls"]
]);

await loadLocalEnv();
assertAdminEnv();

const sourceProducts = await loadSnapshots();
const shopifyProducts = await fetchProducts();
const activeReady = shopifyProducts.filter((product) => product.status === "ACTIVE" && product.stockStatus === "ready_to_ship" && isRosemaryUrl(product.sourceUrl));
const reconciliation = reconcile(sourceProducts, shopifyProducts);
const protectedIds = new Set(reconciliation.matches.flatMap((match) => match.shopifyProducts.map((product) => product.id)));
const stale = activeReady.filter((product) => !protectedIds.has(product.id));

if (executeRegions) await updateRegions(reconciliation.matches);
if (executeOptions) await updateStockOptions(reconciliation.matches);
if (executeDrafts) await draftProducts(stale);
const missingPreviewPath = prepareMissing ? await writeMissingPreview(reconciliation.missing) : null;

const report = {
  generatedAt: new Date().toISOString(),
  snapshotDate,
  mode: { executeDrafts, executeRegions, executeOptions, prepareMissing },
  source: {
    regionalPlacements: sourceProducts.reduce((total, product) => total + product.regions.length, 0),
    uniqueProducts: sourceProducts.length,
    byRegion: Object.fromEntries(regions.map((region) => [regionLabels[region], sourceProducts.filter((product) => product.regions.includes(region)).length]))
  },
  shopify: { activeReadyRosemary: activeReady.length },
  results: {
    matchedSourceProducts: reconciliation.matches.length,
    missingSourceProducts: reconciliation.missing.length,
    ambiguousSourceProducts: reconciliation.ambiguous.length,
    staleProducts: stale.length,
    drafted: executeDrafts ? stale.length : 0,
    regionsUpdated: executeRegions ? reconciliation.matches.reduce((total, match) => total + match.shopifyProducts.length, 0) : 0,
    optionsUpdated: executeOptions ? reconciliation.matches.reduce((total, match) => total + match.shopifyProducts.length, 0) : 0
  },
  matches: reconciliation.matches.map((match) => ({
    sourceUrl: match.source.sourceUrl,
    sourceTitle: match.source.sourceTitle,
    brand: match.source.brand,
    regions: match.source.regions.map((region) => regionLabels[region]),
    reason: match.reason,
    shopifyProducts: match.shopifyProducts.map(summary)
  })),
  missing: reconciliation.missing.map((source) => sourceSummary(source)),
  ambiguous: reconciliation.ambiguous.map((entry) => ({ source: sourceSummary(entry.source), candidates: entry.candidates.map(({ product, score, reasons }) => ({ ...summary(product), score, reasons })) })),
  stale: stale.map(summary),
  missingPreviewPath: missingPreviewPath ? path.relative(ROOT, missingPreviewPath) : null
};

const reportPath = path.join(ROOT, "data", "exports", `rosemary-stock-reconciliation-${snapshotDate}.json`);
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath: path.relative(ROOT, reportPath), ...report.results }, null, 2));

async function writeMissingPreview(missing) {
  const previews = [];
  for (const region of regions) {
    const file = path.join(ROOT, "data", "exports", `rosemary-stock-${region}-${snapshotDate}-storefront-products.json`);
    previews.push(...JSON.parse(await fs.readFile(file, "utf8")));
  }
  const previewByUrl = new Map(previews.map((product) => [normalizeUrl(product.sourceUrl), product]));
  const products = missing.map((source) => {
    const preview = previewByUrl.get(normalizeUrl(source.sourceUrl));
    if (!preview) throw new Error(`Missing prepared preview for ${source.sourceUrl}`);
    const regions = source.regions.map((region) => regionLabels[region]);
    return {
      ...preview,
      title: preview.extended?.customAvailable === false
        ? preview.title.replace(/\s+Customizable(?=\s+(?:Companion Doll|Hips|Torso|Head)\b)/i, "")
        : preview.title,
      tags: [...new Set([...(preview.tags || []).filter((tag) => tag !== "custom"), "ready_to_ship", ...regions.map((region) => `warehouse-${normalize(region).replace(/ /g, "-")}`)])],
      extended: {
        ...preview.extended,
        stockStatus: "ready_to_ship",
        warehouseCountry: regions[0],
        warehouseRegions: regions,
        stockLastCheckedAt: new Date().toISOString(),
        qcNote: `Current Rosemary regional stock snapshot ${snapshotDate}. Regions: ${regions.join(", ")}. Review exact warehouse options and pricing before activation.`
      }
    };
  });
  const output = path.join(ROOT, "data", "exports", `rosemary-stock-missing-${snapshotDate}-storefront-products.json`);
  await fs.writeFile(output, `${JSON.stringify(products, null, 2)}\n`);
  return output;
}

function reconcile(sources, products) {
  const matches = [];
  const missing = [];
  const ambiguous = [];
  for (const source of sources) {
    const candidates = products
      .map((product) => scoreCandidate(source, product))
      .filter((candidate) => candidate.score >= 70)
      .sort((left, right) => right.score - left.score);
    if (!candidates.length) { missing.push(source); continue; }
    const topScore = candidates[0].score;
    const top = candidates.filter((candidate) => candidate.score === topScore);
    const exact = candidates.filter((candidate) => candidate.reasons.includes("source-url"));
    if (exact.length) {
      matches.push({ source, reason: "source-url", shopifyProducts: exact.map((candidate) => candidate.product) });
    } else if (top.length === 1 && topScore >= 95) {
      matches.push({ source, reason: top[0].reasons.join("+"), shopifyProducts: [top[0].product] });
    } else {
      ambiguous.push({ source, candidates: candidates.slice(0, 8) });
      // Ambiguous candidates are deliberately protected from automated drafting.
      matches.push({ source, reason: "ambiguous-protected", shopifyProducts: top.map((candidate) => candidate.product) });
    }
  }
  return { matches, missing, ambiguous };
}

function scoreCandidate(source, product) {
  if (normalizeBrand(product.brand || product.vendor) !== normalizeBrand(source.brand)) return { product, score: 0, reasons: [] };
  let score = 0;
  const reasons = [];
  if (normalizeUrl(product.sourceUrl) && normalizeUrl(product.sourceUrl) === normalizeUrl(source.sourceUrl)) { score += 140; reasons.push("source-url"); }
  if (assetKey(product.imageUrl) && assetKey(product.imageUrl) === assetKey(source.imageUrl)) { score += 100; reasons.push("primary-image"); }
  if (source.heightCm && product.heightCm && source.heightCm === product.heightCm) { score += 18; reasons.push("height"); }
  if (source.cupSize && product.cupSize && normalize(source.cupSize) === normalize(product.cupSize)) { score += 12; reasons.push("cup"); }
  if (source.material && product.material && normalizeMaterial(source.material) === normalizeMaterial(product.material)) { score += 18; reasons.push("material"); }
  const sourceTokens = modelTokens(source.sourceTitle);
  const productTokens = modelTokens(`${product.title} ${product.sourceUrl}`);
  const overlap = sourceTokens.filter((token) => productTokens.includes(token));
  if (overlap.length) { score += Math.min(36, overlap.length * 12); reasons.push(`model:${overlap.join("-")}`); }
  return { product, score, reasons };
}

async function loadSnapshots() {
  const byUrl = new Map();
  for (const region of regions) {
    const file = path.join(ROOT, "data", "imports", `rosemary-stock-${region}-${snapshotDate}.json`);
    const snapshot = JSON.parse(await fs.readFile(file, "utf8"));
    const previewFile = path.join(ROOT, "data", "exports", `rosemary-stock-${region}-${snapshotDate}-storefront-products.json`);
    const preview = JSON.parse(await fs.readFile(previewFile, "utf8"));
    const previewByUrl = new Map(preview.map((product) => [normalizeUrl(product.sourceUrl), product]));
    for (const product of snapshot.products || []) {
      const brand = carriedBrands.get(normalize(product.brand));
      if (!brand) continue;
      const key = normalizeUrl(product.sourceUrl);
      const current = byUrl.get(key);
      if (current) { current.regions.push(region); continue; }
      const prepared = previewByUrl.get(key);
      byUrl.set(key, {
        sourceUrl: product.sourceUrl,
        sourceTitle: product.sourceTitle || product.title,
        brand,
        price: product.price,
        heightCm: product.specs?.heightCm,
        cupSize: product.specs?.cupSize,
        material: product.material || inferMaterial(product.sourceTitle || product.title),
        imageUrl: product.imageUrls?.[0] || "",
        regions: [region],
        customAvailable: prepared?.extended?.customAvailable === true,
        customizationGroups: prepared?.extended?.customizationGroups || []
      });
    }
  }
  return [...byUrl.values()];
}

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await adminFetch(`query Products($after: String) {
      products(first: 250, after: $after) {
        nodes {
          id handle title vendor status featuredImage { url }
          brand: metafield(namespace: "custom", key: "brand") { value }
          sourceUrl: metafield(namespace: "custom", key: "source_url") { value }
          stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
          warehouseCountry: metafield(namespace: "custom", key: "warehouse_country") { value }
          heightCm: metafield(namespace: "custom", key: "height_cm") { value }
          cupSize: metafield(namespace: "custom", key: "cup_size") { value }
          material: metafield(namespace: "custom", key: "material") { value }
          customAvailable: metafield(namespace: "custom", key: "custom_available") { value }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`, { after });
    products.push(...data.products.nodes.map((node) => ({
      ...node,
      brand: node.brand?.value || "",
      sourceUrl: node.sourceUrl?.value || "",
      stockStatus: node.stockStatus?.value || "",
      warehouseCountry: node.warehouseCountry?.value || "",
      heightCm: Number(node.heightCm?.value || 0) || undefined,
      cupSize: node.cupSize?.value || "",
      material: node.material?.value || "",
      customAvailable: node.customAvailable?.value || "",
      imageUrl: node.featuredImage?.url || ""
    })));
    after = data.products.pageInfo.endCursor;
    if (!data.products.pageInfo.hasNextPage) break;
  } while (after);
  return products;
}

async function updateRegions(matches) {
  const entries = matches.flatMap((match) => match.shopifyProducts.map((product) => ({
    ownerId: product.id,
    namespace: "custom",
    key: "warehouse_regions",
    type: "json",
    value: JSON.stringify(match.source.regions.map((region) => regionLabels[region]))
  })));
  for (let index = 0; index < entries.length; index += 25) {
    const data = await adminFetch(`mutation SetRegions($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { field message } } }`, { metafields: entries.slice(index, index + 25) });
    assertNoErrors(data.metafieldsSet.userErrors);
  }
}

async function updateStockOptions(matches) {
  const entries = matches.flatMap((match) => match.shopifyProducts.flatMap((product) => {
    const metafields = [
      { ownerId: product.id, namespace: "custom", key: "custom_available", type: "boolean", value: String(match.source.customAvailable) },
      { ownerId: product.id, namespace: "custom", key: "stock_last_checked_at", type: "date_time", value: new Date().toISOString() }
    ];
    if (match.source.customizationGroups.length) metafields.push({ ownerId: product.id, namespace: "custom", key: "customization_groups", type: "json", value: JSON.stringify(match.source.customizationGroups) });
    return metafields;
  }));
  for (let index = 0; index < entries.length; index += 25) {
    const data = await adminFetch(`mutation SetStockOptions($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { field message } } }`, { metafields: entries.slice(index, index + 25) });
    assertNoErrors(data.metafieldsSet.userErrors);
  }
}

async function draftProducts(products) {
  for (const product of products) {
    const data = await adminFetch(`mutation Draft($product: ProductUpdateInput!) { productUpdate(product: $product) { userErrors { field message } } }`, { product: { id: product.id, status: "DRAFT" } });
    assertNoErrors(data.productUpdate.userErrors);
  }
}

function sourceSummary(source) { return { sourceUrl: source.sourceUrl, sourceTitle: source.sourceTitle, brand: source.brand, regions: source.regions.map((region) => regionLabels[region]), price: source.price }; }
function summary(product) { return { id: product.id, handle: product.handle, title: product.title, brand: product.brand || product.vendor, status: product.status, sourceUrl: product.sourceUrl, warehouseCountry: product.warehouseCountry }; }
function normalize(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function normalizeBrand(value) { return normalize(value).replace(/\bdolls?\b/g, "").replace(/\bsedoll\b/g, "se").trim(); }
function normalizeUrl(value) { try { const url = new URL(value); return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`; } catch { return ""; } }
function assetKey(value) { try { return decodeURIComponent(new URL(value).pathname.split("/").pop() || "").toLowerCase().replace(/-\d+x\d+(?=\.[a-z]+$)/, ""); } catch { return ""; } }
function inferMaterial(value) { const text = normalize(value); if (text.includes("tpe")) return "TPE"; if (text.includes("silicone")) return "Silicone"; return ""; }
function normalizeMaterial(value) { const text = normalize(value); if (text.includes("tpe")) return "tpe"; if (text.includes("silicone")) return "silicone"; return text; }
function modelTokens(value) { return [...new Set(normalize(value).split(" ").filter((token) => token.length >= 3 && !/^(https|www|rosemarydoll|product|companion|ready|ship|shipping|stock|only|doll|dolls|silicone|tpe|head|sex|cup|cm|ft|version|with|series|united|states|european|union)$/.test(token) && !/^\d+$/.test(token)))]; }
function isRosemaryUrl(value) { try { return new URL(value).hostname.endsWith("rosemarydoll.com"); } catch { return false; } }
function assertNoErrors(errors) { if (errors?.length) throw new Error(errors.map((error) => error.message).join("; ")); }
function parseArgs(values) { return Object.fromEntries(values.flatMap((value, index) => value.startsWith("--") ? [[value.slice(2), values[index + 1]?.startsWith("--") ? true : values[index + 1] ?? true]] : [])); }

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const token = await getAdminToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token }, body: JSON.stringify({ query, variables }) });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.map((error) => error.message).join("; ") || `Shopify HTTP ${response.status}`);
  return payload.data;
}
async function getAdminToken(domain) {
  if (tokenCache) return tokenCache;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }) });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Shopify authentication failed");
  tokenCache = payload.access_token;
  return tokenCache;
}
function assertAdminEnv() { if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) throw new Error("Shopify Admin environment is required"); }
async function loadLocalEnv() { try { const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8"); for (const raw of text.split(/\r?\n/)) { const line = raw.trim(); if (!line || line.startsWith("#")) continue; const index = line.indexOf("="); if (index < 0) continue; process.env[line.slice(0, index).trim()] ||= line.slice(index + 1).trim().replace(/^['"]|['"]$/g, ""); } } catch {} }
