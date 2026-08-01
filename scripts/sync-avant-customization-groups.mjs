import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const execute = process.argv.includes("--execute");
let tokenCache = null;

await loadLocalEnv();
const plan = JSON.parse(await fs.readFile(path.join(ROOT, "data/exports/avant-official-import-plan.json"), "utf8"));
const template = JSON.parse(await fs.readFile(path.join(ROOT, "data/avant-customization-groups.json"), "utf8"));

if (!execute) {
  console.log(JSON.stringify({
    mode: "dry-run",
    products: plan.products.map((product) => ({ handle: product.handle, groups: buildGroups(product.identity).length }))
  }, null, 2));
  process.exit(0);
}

assertShopifyAdminEnv();
const summary = { updated: [], failed: [] };
for (const product of plan.products) {
  try {
    const existing = await adminFetch(
      `query ProductByHandle($query: String!) { products(first: 1, query: $query) { nodes { id handle } } }`,
      { query: `handle:${product.handle}` }
    );
    const ownerId = existing.products.nodes[0]?.id;
    if (!ownerId) throw new Error("Product was not found in Shopify.");

    const data = await adminFetch(
      `mutation SetCustomization($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { userErrors { field message } }
      }`,
      {
        metafields: [{
          ownerId,
          namespace: "custom",
          key: "customization_groups",
          type: "json",
          value: JSON.stringify(buildGroups(product.identity))
        }]
      }
    );
    const errors = data.metafieldsSet.userErrors;
    if (errors.length) throw new Error(errors.map((error) => error.message).join("; "));
    summary.updated.push(product.handle);
  } catch (error) {
    summary.failed.push({ handle: product.handle, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify({ mode: "execute", ...summary }, null, 2));
if (summary.failed.length) process.exitCode = 1;

function buildGroups(identity) {
  const groups = structuredClone(template.groups);
  const skinGroup = groups.find((group) => group.id === "skin-tone");
  if (skinGroup && /white/i.test(identity.skinTone)) {
    skinGroup.options.sort((left, right) => Number(right.id === "white") - Number(left.id === "white"));
  }
  return groups;
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const accessToken = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `Shopify Admin API HTTP ${response.status}`);
  return payload.data;
}

async function getAdminAccessToken(domain) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    throw new Error("Shopify Admin credentials are missing.");
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
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Failed to get Shopify Admin access.");
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000 };
  return tokenCache.accessToken;
}

async function loadLocalEnv() {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 0) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] ||= value;
    }
  } catch {
    // The deployment host can supply environment variables directly.
  }
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN and Shopify Admin credentials are required.");
  }
}
