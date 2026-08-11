import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
let tokenCache = null;

await loadLocalEnv();
const args = parseArgs(process.argv.slice(2));
const execute = Boolean(args.execute);
const inputPath = path.resolve(ROOT, args.input || "data/catalog-display-name-overrides.json");
const overrides = JSON.parse(await fs.readFile(inputPath, "utf8"));
if (!Array.isArray(overrides) || !overrides.length) throw new Error("The display-name override file must contain at least one row.");

const results = [];
for (const override of overrides) {
  const product = await findProduct(override.handle);
  if (!product) {
    results.push({ ...override, status: "missing_product", currentDisplayName: "" });
    continue;
  }
  const currentDisplayName = product.displayName?.value || "";
  const status = currentDisplayName === override.displayName ? "unchanged" : "set";
  results.push({ ...override, id: product.id, currentDisplayName, status });
}

const unresolved = results.filter((result) => result.status === "missing_product");
if (unresolved.length) throw new Error(`Could not find ${unresolved.length} requested Shopify products. No changes were applied.`);

const actionable = results.filter((result) => result.status === "set");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(ROOT, "data", "exports", `shopify-display-name-overrides-${timestamp}.json`);
await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), mode: execute ? "execute" : "dry-run", input: path.relative(ROOT, inputPath), actionableProducts: actionable.length, results }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ mode: execute ? "execute" : "dry-run", actionableProducts: actionable.length, report: path.relative(ROOT, reportPath), results: results.map(({ handle, currentDisplayName, displayName, status }) => ({ handle, currentDisplayName, displayName, status })) }, null, 2));

if (execute) {
  for (const result of actionable) await setDisplayName(result.id, result.displayName);
  console.log(`Updated ${actionable.length} Shopify display names.`);
}

async function findProduct(handle) {
  const data = await adminFetch(
    `query ProductByHandle($query: String!) {
      products(first: 5, query: $query) {
        nodes { id handle displayName: metafield(namespace: "custom", key: "display_name") { value } }
      }
    }`,
    { query: `handle:${handle}` }
  );
  return data.products.nodes.find((product) => product.handle === handle) || null;
}

async function setDisplayName(ownerId, value) {
  const data = await adminFetch(
    `mutation SetDisplayName($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { field message } }
    }`,
    { metafields: [{ ownerId, namespace: "custom", key: "display_name", type: "single_line_text_field", value }] }
  );
  const error = data.metafieldsSet.userErrors[0];
  if (error) throw new Error(`${Array.isArray(error.field) ? error.field.join(".") : error.field || "Shopify"}: ${error.message}`);
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
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: requireEnv("SHOPIFY_CLIENT_ID"), client_secret: requireEnv("SHOPIFY_CLIENT_SECRET") })
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Could not obtain a Shopify Admin token.");
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000 };
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

function parseArgs(values) {
  const parsed = { execute: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--execute") parsed.execute = true;
    else if (value === "--input") {
      parsed.input = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}
