import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const LEGACY_VALUES = new Set([
  "4-8 weeks",
  "usually 3-5 weeks from order to delivery",
  "fast shipping after stock confirmation",
  "ships within 1-3 business days after stock confirmation",
  "3-5 weeks from order to delivery"
]);
let tokenCache = null;

await loadLocalEnv();

const execute = process.argv.includes("--execute");
const products = await fetchProducts();
const matches = products.filter((product) => LEGACY_VALUES.has(normalize(product.deliveryEstimate)));
const valueCounts = Object.entries(
  matches.reduce((counts, product) => {
    counts[product.deliveryEstimate] = (counts[product.deliveryEstimate] || 0) + 1;
    return counts;
  }, {})
).sort((a, b) => b[1] - a[1]);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(ROOT, "data", "exports", `shopify-delivery-estimate-cleanup-${timestamp}.json`);

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(
  reportPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: execute ? "execute" : "dry-run",
    scannedProducts: products.length,
    matchedProducts: matches.length,
    valueCounts,
    products: matches.map(({ id, handle, deliveryEstimate }) => ({ id, handle, deliveryEstimate }))
  }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify({
  mode: execute ? "execute" : "dry-run",
  scannedProducts: products.length,
  matchedProducts: matches.length,
  valueCounts,
  report: path.relative(ROOT, reportPath)
}, null, 2));

if (execute && matches.length) {
  let deleted = 0;
  for (let index = 0; index < matches.length; index += 100) {
    const batch = matches.slice(index, index + 100).map((product) => ({
      ownerId: product.id,
      namespace: "custom",
      key: "delivery_estimate"
    }));
    deleted += await deleteMetafields(batch);
    console.log(`Deleted ${deleted}/${matches.length} legacy delivery estimates.`);
  }

  const remaining = (await fetchProducts()).filter((product) => LEGACY_VALUES.has(normalize(product.deliveryEstimate)));
  if (remaining.length) throw new Error(`${remaining.length} legacy delivery estimates remain after cleanup.`);
  console.log(`Verified zero legacy delivery estimates remain across Shopify products.`);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replaceAll("–", "-").replace(/\s+/g, " ");
}

async function fetchProducts() {
  const products = [];
  let after = null;
  while (true) {
    const data = await adminFetch(
      `query DeliveryEstimateProducts($after: String) {
        products(first: 250, after: $after, sortKey: TITLE) {
          nodes {
            id
            handle
            deliveryEstimate: metafield(namespace: "custom", key: "delivery_estimate") { value }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after }
    );
    products.push(...data.products.nodes.map((node) => ({
      id: node.id,
      handle: node.handle,
      deliveryEstimate: node.deliveryEstimate?.value || ""
    })));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products;
}

async function deleteMetafields(metafields) {
  const data = await adminFetch(
    `mutation DeleteDeliveryEstimates($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) {
        deletedMetafields { key namespace ownerId }
        userErrors { field message }
      }
    }`,
    { metafields }
  );
  const errors = data.metafieldsDelete.userErrors || [];
  if (errors.length) throw new Error(errors.map((error) => `${error.field?.join(".") || "Shopify"}: ${error.message}`).join("; "));
  return data.metafieldsDelete.deletedMetafields?.length || 0;
}

async function adminFetch(query, variables = {}) {
  const domain = requireEnv("SHOPIFY_STORE_DOMAIN").replace(/^https?:\/\//, "");
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await getAccessToken(domain) },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `Shopify Admin API failed with HTTP ${response.status}.`);
  return payload.data;
}

async function getAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  if (tokenCache?.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
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
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Could not obtain a Shopify Admin token.");
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000
  };
  return tokenCache.accessToken;
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

async function loadLocalEnv() {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index < 0) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] ||= value;
    }
  } catch {
    // Environment validation happens when credentials are used.
  }
}
