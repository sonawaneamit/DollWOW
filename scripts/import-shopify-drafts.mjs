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

const inputPath = path.resolve(ROOT, args.input || (await findLatestPreview()));
const execute = Boolean(args.execute);
const limit = Number(args.limit || 0);
const products = JSON.parse(await fs.readFile(inputPath, "utf8")).slice(0, limit || undefined);

if (!Array.isArray(products) || !products.length) {
  throw new Error(`No products found in ${path.relative(ROOT, inputPath)}.`);
}

console.log(`${execute ? "Importing" : "Dry run for"} ${products.length} Shopify draft products from ${path.relative(ROOT, inputPath)}`);

if (!execute) {
  for (const product of products) {
    console.log(`- ${product.handle}: ${product.title} (${product.priceRange?.minVariantPrice?.amount || "no price"})`);
  }
  console.log("Dry run only. Add --execute to create draft products in Shopify.");
  process.exit(0);
}

assertShopifyAdminEnv();

const results = [];
for (const product of products) {
  const existing = await findExistingProduct(product.handle);
  if (existing) {
    results.push({ handle: product.handle, status: "skipped_existing", productId: existing.id });
    console.log(`Skipped existing product ${product.handle} (${existing.id})`);
    continue;
  }

  const created = await createDraftProduct(product);
  const variantId = created.variants?.nodes?.[0]?.id;
  if (variantId) {
    await updateInitialVariant(created.id, variantId, product);
  }
  results.push({ handle: product.handle, status: "created_draft", productId: created.id, variantId });
  console.log(`Created draft ${product.handle} (${created.id})`);
}

console.log(JSON.stringify({ count: results.length, results }, null, 2));

async function findLatestPreview() {
  const exportDir = path.join(ROOT, "data", "exports");
  const entries = await fs.readdir(exportDir);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.startsWith("rosemary-") && entry.endsWith("-storefront-products.json"))
      .map(async (entry) => {
        const file = path.join(exportDir, entry);
        const stat = await fs.stat(file);
        return { file, mtimeMs: stat.mtimeMs };
      })
  );
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files[0]) throw new Error("No storefront preview JSON found. Run npm run prepare:rosemary-import first.");
  return files[0].file;
}

async function findExistingProduct(handle) {
  const data = await adminFetch(
    `query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes { id handle title status }
      }
    }`,
    { query: `handle:${handle}` }
  );
  return data.products.nodes.find((product) => product.handle === handle) || null;
}

async function createDraftProduct(product) {
  const data = await adminFetch(
    `mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          handle
          title
          status
          variants(first: 1) {
            nodes { id title price }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      product: {
        title: product.title,
        handle: product.handle,
        descriptionHtml: productDescriptionHtml(product),
        vendor: product.vendor || "DollWow",
        productType: product.productType || "Adult doll",
        tags: product.tags || [],
        status: "DRAFT",
        seo: {
          title: `${product.title} | DollWow`,
          description: plainText(product.description).slice(0, 155)
        },
        metafields: productMetafields(product)
      },
      media: (product.images || []).slice(0, Number(args.maxImages || 8)).map((image) => ({
        originalSource: encodeMediaUrl(image.url),
        alt: image.altText || product.title,
        mediaContentType: "IMAGE"
      }))
    }
  );

  const error = data.productCreate.userErrors[0];
  if (error) throw new Error(`productCreate failed for ${product.handle}: ${formatUserError(error)}`);
  if (!data.productCreate.product) throw new Error(`Shopify did not return product for ${product.handle}.`);
  return data.productCreate.product;
}

async function updateInitialVariant(productId, variantId, product) {
  const price = product.priceRange?.minVariantPrice?.amount;
  if (!price) return;

  const data = await adminFetch(
    `mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
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
          price,
          inventoryPolicy: "CONTINUE",
          taxable: true,
          inventoryItem: {
            sku: skuFor(product),
            tracked: false
          }
        }
      ]
    }
  );

  const error = data.productVariantsBulkUpdate.userErrors[0];
  if (error) throw new Error(`productVariantsBulkUpdate failed for ${product.handle}: ${formatUserError(error)}`);
}

function productMetafields(product) {
  const extended = product.extended || {};
  return [
    metafield("brand", extended.brand),
    metafield("material", extended.material),
    metafield("height_cm", extended.heightCm, "number_integer"),
    metafield("weight_lb", extended.weightLb, "number_decimal"),
    metafield("cup_size", extended.cupSize),
    metafield("warehouse_country", extended.warehouseCountry),
    metafield("stock_status", extended.stockStatus),
    metafield("delivery_estimate", extended.deliveryEstimate),
    metafield("stock_last_checked_at", extended.stockLastCheckedAt, "date_time"),
    metafield("custom_available", extended.customAvailable, "boolean"),
    metafield("qc_note", extended.qcNote, "multi_line_text_field")
  ].filter(Boolean);
}

function metafield(key, value, type = "single_line_text_field") {
  if (value === undefined || value === null || value === "") return null;
  return {
    namespace: "custom",
    key,
    type,
    value: type === "boolean" ? String(Boolean(value)) : String(value)
  };
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

function productDescriptionHtml(product) {
  const extended = product.extended || {};
  const rows = [
    ["Brand", extended.brand],
    ["Material", extended.material],
    ["Height", extended.heightCm ? `${extended.heightCm} cm` : ""],
    ["Weight", extended.weightLb ? `${extended.weightLb} lb` : ""],
    ["Cup size", extended.cupSize],
    ["Availability", availabilityLabel(extended)],
    ["Warehouse", extended.warehouseCountry]
  ].filter(([, value]) => value);
  const specList = rows.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join("");
  return [
    `<p>${escapeHtml(product.description || product.title)}</p>`,
    specList ? `<ul>${specList}</ul>` : "",
    `<p>Final availability, production options, and warehouse timing are confirmed by DollWow support before fulfillment.</p>`
  ]
    .filter(Boolean)
    .join("");
}

function availabilityLabel(extended) {
  if (extended.stockStatus === "ready_to_ship") return "Ready to ship after stock confirmation";
  if (extended.stockStatus === "custom") return "Custom factory order";
  return "Check stock before sale";
}

function skuFor(product) {
  return ["DW", ...(product.tags || []).slice(0, 1), product.handle]
    .join("-")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 64);
}

function encodeMediaUrl(url) {
  return encodeURI(url);
}

function formatUserError(error) {
  const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
  return field ? `${field}: ${error.message}` : error.message;
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required for --execute.");
  }
}

function plainText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  npm run import:shopify-drafts
  npm run import:shopify-drafts -- --input data/exports/rosemary-custom-storefront-products.json
  npm run import:shopify-drafts -- --input data/exports/rosemary-custom-storefront-products.json --limit 1 --execute

Dry-runs by default. With --execute, creates Shopify products as DRAFT, attaches media, sets custom metafields, and updates the initial variant price/SKU.`);
}
