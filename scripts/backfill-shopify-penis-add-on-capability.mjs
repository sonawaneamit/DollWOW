import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const METAFIELD_KEY = "has_insertable_penis_add_on";
let tokenCache = null;

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

assertShopifyAdminEnv();

const execute = Boolean(args.execute);
const products = await fetchProducts();
const results = products.map((product) => {
  const eligible = hasSelectableInsertablePenisAddOn(product.customizationGroups);
  const current = parseBoolean(product.currentCapability);
  return {
    product,
    eligible,
    current,
    status: current === eligible ? "unchanged" : "update"
  };
});
const updates = results.filter((result) => result.status === "update");
const eligible = results.filter((result) => result.eligible);
const activeEligible = eligible.filter((result) => result.product.status === "ACTIVE");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(ROOT, "data", "exports");
const reportPath = path.join(outDir, `shopify-penis-add-on-capability-${timestamp}.json`);

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      productsScanned: products.length,
      eligibleProducts: eligible.length,
      activeEligibleProducts: activeEligible.length,
      updatesNeeded: updates.length,
      eligibleByBrand: summarizeByBrand(activeEligible),
      updates: updates.map(({ product, eligible: nextValue, current }) => ({
        id: product.id,
        handle: product.handle,
        title: product.title,
        brand: product.vendor,
        status: product.status,
        current,
        nextValue
      }))
    },
    null,
    2
  )
);

console.log(`Scanned ${products.length} Shopify products.`);
console.log(`Eligible products: ${eligible.length} (${activeEligible.length} active).`);
console.log(`Metafield updates needed: ${updates.length}.`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  for (const result of activeEligible.slice(0, 12)) {
    console.log(`- ${result.product.handle}: insertable penis option available`);
  }
  process.exit(0);
}

await ensureStorefrontDefinition();
let updated = 0;
for (let index = 0; index < updates.length; index += 25) {
  const batch = updates.slice(index, index + 25);
  await setCapabilityMetafields(batch);
  updated += batch.length;
  console.log(`Updated ${updated}/${updates.length}`);
}

console.log(JSON.stringify({ mode: "execute", updated, activeEligibleProducts: activeEligible.length, report: path.relative(ROOT, reportPath) }, null, 2));

async function fetchProducts() {
  const products = [];
  let after = null;

  while (true) {
    const data = await adminFetch(
      `query ProductCapabilities($after: String) {
        products(first: 100, after: $after, sortKey: TITLE) {
          edges {
            node {
              id
              handle
              title
              vendor
              status
              customizationGroups: metafield(namespace: "custom", key: "customization_groups") { value }
              currentCapability: metafield(namespace: "custom", key: "${METAFIELD_KEY}") { value }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after }
    );

    products.push(
      ...data.products.edges.map(({ node }) => ({
        id: node.id,
        handle: node.handle || "",
        title: node.title || "",
        vendor: node.vendor || "Unknown brand",
        status: node.status || "UNKNOWN",
        customizationGroups: parseJson(node.customizationGroups?.value),
        currentCapability: node.currentCapability?.value
      }))
    );

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
    console.log(`Read ${products.length} products...`);
  }

  return products;
}

function hasSelectableInsertablePenisAddOn(groups) {
  if (!Array.isArray(groups)) return false;
  const group = groups.find((candidate) => {
    const identity = `${candidate?.id || ""} ${candidate?.label || ""} ${candidate?.name || ""}`.toLowerCase();
    return identity.includes("insertable-penis-add-on") || /insertable\s+penis\s+add[- ]?on/.test(identity);
  });
  if (!group) return false;

  const options = Array.isArray(group.options) ? group.options : [];
  return options.some((option) => {
    const label = `${option?.id || ""} ${option?.label || ""} ${option?.name || ""}`.toLowerCase();
    return label.trim() && !/(no change|no thanks|none|factory default|not included)/.test(label);
  });
}

async function ensureStorefrontDefinition() {
  const data = await adminFetch(
    `query CapabilityDefinition {
      metafieldDefinition(identifier: { namespace: "custom", key: "${METAFIELD_KEY}", ownerType: PRODUCT }) { id }
    }`
  );

  const response = data.metafieldDefinition
    ? await adminFetch(
        `mutation ExposeCapability($definition: MetafieldDefinitionUpdateInput!) {
          metafieldDefinitionUpdate(definition: $definition) { userErrors { field message } }
        }`,
        { definition: { id: data.metafieldDefinition.id, access: { storefront: "PUBLIC_READ" } } }
      )
    : await adminFetch(
        `mutation CreateCapability($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) { userErrors { field message } }
        }`,
        {
          definition: {
            name: "Insertable penis add-on available",
            namespace: "custom",
            key: METAFIELD_KEY,
            ownerType: "PRODUCT",
            type: "boolean",
            access: { storefront: "PUBLIC_READ" }
          }
        }
      );

  const errors = response.metafieldDefinitionUpdate?.userErrors || response.metafieldDefinitionCreate?.userErrors || [];
  throwOnUserErrors(errors);
}

async function setCapabilityMetafields(results) {
  const data = await adminFetch(
    `mutation SetProductCapabilities($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { field message } }
    }`,
    {
      metafields: results.map(({ product, eligible }) => ({
        ownerId: product.id,
        namespace: "custom",
        key: METAFIELD_KEY,
        type: "boolean",
        value: String(eligible)
      }))
    }
  );
  throwOnUserErrors(data.metafieldsSet.userErrors);
}

function summarizeByBrand(results) {
  return Object.fromEntries(
    [...results.reduce((counts, result) => counts.set(result.product.vendor, (counts.get(result.product.vendor) || 0) + 1), new Map()).entries()].sort(
      ([leftBrand, leftCount], [rightBrand, rightCount]) => rightCount - leftCount || leftBrand.localeCompare(rightBrand)
    )
  );
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function throwOnUserErrors(errors = []) {
  const error = errors[0];
  if (!error) return;
  const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
  throw new Error(field ? `${field}: ${error.message}` : error.message);
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const token = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || `Shopify Admin API failed with HTTP ${response.status}.`);
  }
  return payload.data;
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus Shopify Admin credentials are required.");
  }
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
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
  return Object.fromEntries(values.filter((value) => value.startsWith("--")).map((value) => [value.slice(2), true]));
}

function printHelp() {
  console.log(`Usage:\n  npm run backfill:penis-add-on-capability\n  npm run backfill:penis-add-on-capability -- --execute\n\nDry-runs by default. Derives a public boolean capability from exact Shopify customization groups.`);
}
