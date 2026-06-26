import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const DEFAULT_DENOMINATIONS = [500, 100, 50, 10, 5, 1];

let tokenCache = null;
let publicationCache = null;

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
const execute = Boolean(args.execute);
const denominations = String(args.denominations || DEFAULT_DENOMINATIONS.join(","))
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0)
  .sort((a, b) => b - a);
const currency = String(args.currency || process.env.SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY || "USD").toUpperCase();
const publicationNamePattern = args.publication ? new RegExp(String(args.publication), "i") : /headless|online store/i;

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!denominations.length) {
  throw new Error("At least one positive denomination is required.");
}

console.log(`${execute ? "Creating/updating" : "Dry run for"} Shopify custom option charge products: ${denominations.map((value) => `${currency} ${value}`).join(", ")}`);

if (!execute) {
  console.log("Dry run only. Add --execute to create or update the system products in Shopify.");
  process.exit(0);
}

assertShopifyAdminEnv();

const variantMap = {};
for (const amount of denominations) {
  const product = await upsertChargeProduct(amount);
  const variant = product.variants?.nodes?.[0];
  if (!variant?.id) {
    throw new Error(`Shopify did not return a variant for ${product.handle}.`);
  }
  await updateChargeVariant(product.id, variant.id, amount);
  await publishProduct(product.id);
  variantMap[String(amount)] = variant.id;
  console.log(`- ${currency} ${amount}: ${variant.id}`);
}

console.log("\nAdd this to Vercel and .env.local:");
console.log(`SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY=${currency}`);
console.log(`SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS='${JSON.stringify(variantMap)}'`);

async function upsertChargeProduct(amount) {
  const handle = chargeHandle(amount);
  const existing = await findExistingProduct(handle);
  if (existing) {
    return updateChargeProduct(existing.id, amount);
  }
  return createChargeProduct(amount);
}

async function findExistingProduct(handle) {
  const data = await adminFetch(
    `query FindChargeProduct($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        variants(first: 1) { nodes { id title price } }
      }
    }`,
    { handle }
  );
  return data.productByHandle || null;
}

async function createChargeProduct(amount) {
  const data = await adminFetch(
    `mutation CreateChargeProduct($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product {
          id
          handle
          variants(first: 1) { nodes { id title price } }
        }
        userErrors { field message }
      }
    }`,
    {
      product: chargeProductInput(amount)
    }
  );
  const error = data.productCreate.userErrors[0];
  if (error) throw new Error(`productCreate failed: ${formatUserError(error)}`);
  return data.productCreate.product;
}

async function updateChargeProduct(productId, amount) {
  const data = await adminFetch(
    `mutation UpdateChargeProduct($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          handle
          variants(first: 1) { nodes { id title price } }
        }
        userErrors { field message }
      }
    }`,
    {
      product: {
        id: productId,
        ...chargeProductInput(amount)
      }
    }
  );
  const error = data.productUpdate.userErrors[0];
  if (error) throw new Error(`productUpdate failed: ${formatUserError(error)}`);
  return data.productUpdate.product;
}

function chargeProductInput(amount) {
  return {
    title: `DollWow Custom Option Charge ${currency} ${amount}`,
    handle: chargeHandle(amount),
    descriptionHtml:
      "<p>System-only checkout line used to charge selected DollWow customization options. This item is not sold separately.</p>",
    vendor: "DollWow",
    productType: "System charge",
    tags: ["dollwow-system", "custom-option-charge"],
    status: "ACTIVE",
    seo: {
      title: "DollWow custom option charge",
      description: "System-only checkout charge."
    }
  };
}

async function updateChargeVariant(productId, variantId, amount) {
  const data = await adminFetch(
    `mutation UpdateChargeVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price }
        userErrors { field message }
      }
    }`,
    {
      productId,
      variants: [
        {
          id: variantId,
          price: String(amount),
          inventoryPolicy: "CONTINUE",
          taxable: true,
          inventoryItem: {
            sku: `DOLLWOW-CUSTOM-OPTION-${currency}-${amount}`,
            tracked: false
          }
        }
      ]
    }
  );
  const error = data.productVariantsBulkUpdate.userErrors[0];
  if (error) throw new Error(`productVariantsBulkUpdate failed: ${formatUserError(error)}`);
}

async function publishProduct(productId) {
  const publications = await getTargetPublications();
  if (!publications.length) {
    throw new Error(`No Shopify publications matched ${publicationNamePattern}.`);
  }
  const data = await adminFetch(
    `mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    {
      id: productId,
      input: publications.map((publication) => ({ publicationId: publication.id }))
    }
  );
  const error = data.publishablePublish.userErrors[0];
  if (error) throw new Error(`publishablePublish failed: ${formatUserError(error)}`);
}

async function getTargetPublications() {
  if (publicationCache) return publicationCache;
  const data = await adminFetch(
    `query Publications {
      publications(first: 50) {
        nodes { id name }
      }
    }`
  );
  publicationCache = data.publications.nodes.filter((publication) => publicationNamePattern.test(publication.name || ""));
  return publicationCache;
}

function chargeHandle(amount) {
  return `dollwow-custom-option-charge-${currency.toLowerCase()}-${String(amount).replace(".", "-")}`;
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const accessToken = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || `Shopify Admin API request failed with HTTP ${response.status}.`);
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

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required for --execute.");
  }
}

function formatUserError(error) {
  const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
  return field ? `${field}: ${error.message}` : error.message;
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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] ||= value;
    }
  } catch {
    // Local env is optional for dry runs.
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/setup-custom-option-charges.mjs
  node scripts/setup-custom-option-charges.mjs -- --execute
  node scripts/setup-custom-option-charges.mjs -- --execute --denominations 500,100,50,10,5,1 --currency USD

Creates system-only Shopify products for paid custom-option checkout charges and prints
SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS for Vercel/.env.local.`);
}
