import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const execute = Boolean(args.execute);
const limit = Number(args.limit || 0);
const batchSize = Number(args.batch || 100);

assertShopifyEnv();
if (execute) assertSupabaseEnv();

const products = await fetchShopifyProducts(limit || 2000);
const rows = products.map(toProductExtendedRow);

if (!execute) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        count: rows.length,
        sample: rows.slice(0, 3)
      },
      null,
      2
    )
  );
  console.log("Dry run only. Apply supabase/migrations/0002_catalog_identity.sql, then rerun with --execute.");
  process.exit(0);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

let upserted = 0;
for (let index = 0; index < rows.length; index += batchSize) {
  const batch = rows.slice(index, index + batchSize);
  const { error } = await supabase.from("products_extended").upsert(batch, {
    onConflict: "shopify_product_id"
  });

  if (error) {
    throw new Error(`Supabase products_extended upsert failed near row ${index + 1}: ${error.message}`);
  }

  upserted += batch.length;
  console.log(`Upserted ${upserted}/${rows.length}`);
}

console.log(
  JSON.stringify(
    {
      mode: "execute",
      upserted,
      identityKeys: rows.filter((row) => row.catalog_identity_key).length
    },
    null,
    2
  )
);

async function fetchShopifyProducts(limit) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const products = [];
  let after = null;

  while (products.length < limit) {
    const first = Math.min(250, limit - products.length);
    const data = await storefrontFetch(
      domain,
      token,
      `query Products($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          edges {
            node {
              id
              handle
              title
              vendor
              productType
              featuredImage { url }
              priceRange { minVariantPrice { amount currencyCode } }
              seo { title description }
              catalogIdentityKey: metafield(namespace: "custom", key: "catalog_identity_key") { value }
              catalogBodyIdentityKey: metafield(namespace: "custom", key: "catalog_body_identity_key") { value }
              headModel: metafield(namespace: "custom", key: "head_model") { value }
              bodyType: metafield(namespace: "custom", key: "body_type") { value }
              brand: metafield(namespace: "custom", key: "brand") { value }
              material: metafield(namespace: "custom", key: "material") { value }
              heightCm: metafield(namespace: "custom", key: "height_cm") { value }
              weightLb: metafield(namespace: "custom", key: "weight_lb") { value }
              cupSize: metafield(namespace: "custom", key: "cup_size") { value }
              warehouseCountry: metafield(namespace: "custom", key: "warehouse_country") { value }
              stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
              deliveryEstimate: metafield(namespace: "custom", key: "delivery_estimate") { value }
              stockLastCheckedAt: metafield(namespace: "custom", key: "stock_last_checked_at") { value }
              customAvailable: metafield(namespace: "custom", key: "custom_available") { value }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after }
    );

    products.push(...data.products.edges.map((edge) => edge.node));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function storefrontFetch(domain, token, query, variables = {}) {
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token
    },
    body: JSON.stringify({ query, variables })
  });

  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || `Shopify Storefront API failed with HTTP ${response.status}.`);
  }
  return payload.data;
}

function toProductExtendedRow(product) {
  return {
    shopify_product_id: product.id,
    catalog_identity_key: value(product.catalogIdentityKey),
    catalog_body_identity_key: value(product.catalogBodyIdentityKey),
    head_model: value(product.headModel),
    body_type: value(product.bodyType),
    shopify_handle: product.handle,
    title: product.title,
    brand: value(product.brand) || product.vendor || null,
    supplier: product.vendor || null,
    material: value(product.material),
    height_cm: numberValue(value(product.heightCm)),
    weight_lb: numberValue(value(product.weightLb)),
    cup_size: value(product.cupSize),
    warehouse_country: value(product.warehouseCountry),
    stock_status: value(product.stockStatus),
    stock_last_checked_at: dateValue(value(product.stockLastCheckedAt)),
    delivery_estimate: value(product.deliveryEstimate),
    custom_available: booleanValue(value(product.customAvailable)) ?? false,
    product_type: product.productType || null,
    price: numberValue(product.priceRange?.minVariantPrice?.amount),
    currency: product.priceRange?.minVariantPrice?.currencyCode || "USD",
    primary_image_url: product.featuredImage?.url || null,
    seo_title: product.seo?.title || null,
    seo_description: product.seo?.description || null,
    last_synced_from_shopify_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function value(metafield) {
  const raw = metafield?.value;
  return raw === undefined || raw === null || raw === "" ? null : raw;
}

function numberValue(raw) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(raw) {
  if (raw === null || raw === undefined || raw === "") return undefined;
  return ["true", "1", "yes"].includes(String(raw).toLowerCase());
}

function dateValue(raw) {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function assertShopifyEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN are required.");
  }
}

function assertSupabaseEnv() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --execute.");
  }
}

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const content = await fs.readFile(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed
        .slice(index + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Vercel/CI envs are fine.
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
  npm run sync:shopify-products
  npm run sync:shopify-products -- --limit 25
  npm run sync:shopify-products -- --execute

Dry-runs by default. With --execute, upserts Shopify Storefront products into Supabase products_extended.
Run supabase/migrations/0002_catalog_identity.sql before --execute.`);
}
