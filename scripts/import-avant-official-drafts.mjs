import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const args = new Map(process.argv.slice(2).map((value, index, list) => [value, list[index + 1]]));
const execute = process.argv.includes("--execute");
const limit = Number(args.get("--limit") || 0);
const only = String(args.get("--only") || "").trim().toLowerCase();
const publicationStatus = String(args.get("--status") || "DRAFT").trim().toUpperCase();
const planPath = path.resolve(args.get("--input") || path.join(ROOT, "data/exports/avant-official-import-plan.json"));

if (!new Set(["DRAFT", "ACTIVE"]).has(publicationStatus)) {
  throw new Error("--status must be either DRAFT or ACTIVE.");
}

let tokenCache = null;
await loadLocalEnv();

const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
const products = plan.products
  .filter((product) => !only || [product.handle, product.displayName].join(" ").toLowerCase().includes(only))
  .slice(0, limit || undefined);

if (!execute) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        input: path.relative(ROOT, planPath),
        products: products.map((product) => ({
          handle: product.handle,
          title: product.title,
          media: product.media.imageCount,
          priceStatus: product.commercial.priceStatus,
          price: product.commercial.minimumAdvertisedUsd || null,
          status: publicationStatus
        }))
      },
      null,
      2
    )
  );
  process.exit(0);
}

assertShopifyAdminEnv();
const summary = { created: [], updated: [], failed: [] };

for (const product of products) {
  try {
    const existing = await findProductByHandle(product.handle);
    const mediaSources = [];
    for (const filePath of product.media.imageFiles) {
      mediaSources.push(await uploadImageToStaging(filePath));
    }

    if (existing) {
      await updateProduct(existing.id, product);
      await replaceProductMedia(existing.id, mediaSources, product.title);
      await updateExistingVariant(existing.id, product);
      summary.updated.push(product.handle);
    } else {
      const created = await createProduct(product, mediaSources);
      const variantId = created.variants.nodes[0]?.id;
      if (variantId) await updateVariant(created.id, variantId, product);
      summary.created.push(product.handle);
    }
  } catch (error) {
    summary.failed.push({ handle: product.handle, error: error instanceof Error ? error.message : String(error) });
  }
  console.log(`Avant import: ${summary.created.length + summary.updated.length + summary.failed.length}/${products.length}`);
}

console.log(JSON.stringify({ mode: "execute", ...summary }, null, 2));
if (summary.failed.length) process.exitCode = 1;

function productInput(product) {
  const priceConfirmed = Boolean(product.commercial.minimumAdvertisedUsd);
  return {
    title: product.title,
    handle: product.handle,
    descriptionHtml: descriptionFor(product),
    vendor: "Avant Doll",
    productType: "Adult doll",
    tags: tagsFor(product),
    status: publicationStatus,
    seo: {
      title: `${product.title} | DollWow`,
      description: `Explore ${product.displayName}, an Avant Doll ${product.identity.heightCm} cm ${product.identity.cupSize} full silicone model with detailed measurements and available custom options.`
    },
    metafields: metafieldsFor(product, { priceConfirmed })
  };
}

function descriptionFor(product) {
  const { displayName, identity } = product;
  return `<p>${displayName} is an Avant Doll ${identity.heightCm} cm ${identity.cupSize} full silicone model with a ${identity.headModel} head in ${identity.skinTone} skin. Review the detailed measurements, gallery, and available custom options before ordering.</p>`;
}

function tagsFor(product) {
  const lookTags = initialLookTags(product);
  return [
    "avant",
    "avant-doll",
    "avant-dolls",
    "female-doll",
    "full-size",
    "factory-order",
    "custom",
    "silicone",
    "material-silicone",
    `height-${product.identity.heightCm}-cm`,
    `cup-${product.identity.cupSize.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    ...lookTags
  ];
}

function initialLookTags(product) {
  const tags = [];
  if (/white/i.test(product.identity.skinTone)) tags.push("skin-fair");
  if (/wheat|tan/i.test(product.identity.skinTone)) tags.push("skin-tan");
  if (product.identity.heightCm <= 154) tags.push("shape-petite");
  if (product.identity.heightCm <= 158) tags.push("shape-slim");
  return tags;
}

function metafieldsFor(product, { priceConfirmed }) {
  const identity = product.identity;
  const identityKey = ["avant", identity.heightCm, identity.cupSize.replace(/-cup/i, ""), "silicone", identity.headModel, identity.skinTone]
    .map((item) => String(item).toLowerCase().replace(/[^a-z0-9]+/g, "-"))
    .join("|");
  return [
    metafield("catalog_identity_key", identityKey),
    metafield("catalog_body_identity_key", `avant|${identity.heightCm}|${identity.cupSize.toLowerCase().replace(/-cup/i, "")}|silicone`),
    metafield("display_name", product.displayName),
    metafield("head_model", identity.headModel),
    metafield("body_type", "female"),
    metafield("brand", "Avant Doll"),
    metafield("material", "Silicone"),
    metafield("height_cm", identity.heightCm, "number_integer"),
    metafield("cup_size", identity.cupSize),
    metafield("measurements", JSON.stringify(product.measurements || {}), "json"),
    metafield("stock_status", "custom"),
    metafield("delivery_estimate", "3-5 weeks from order to delivery"),
    metafield("custom_available", "true", "boolean"),
    metafield("customization_groups", JSON.stringify(product.documentedOptions), "json"),
    metafield("look_tags", JSON.stringify(initialLookTags(product)), "json"),
    metafield(
      "look_attributes",
      JSON.stringify({ skin_tone: identity.skinTone, source: "Avant manufacturer-provided configuration" }),
      "json"
    ),
    metafield("source_title", product.title),
    metafield("source_handle", product.handle),
    metafield("qc_note", "Manufacturer-provided Avant catalog media and body specifications.", "multi_line_text_field"),
    metafield(
      "import_review_flags",
      JSON.stringify({
        source: "avant-official",
        mediaState: product.media.supplierMediaComplete ? "complete" : "needs-additional-stills",
        priceStatus: product.commercial.priceStatus,
        catalogVisible: false,
        publicationBlocked: true,
        commercialPriceConfirmed: priceConfirmed
      }),
      "json"
    )
  ];
}

async function createProduct(product, mediaSources) {
  const data = await adminFetch(
    `mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product { id handle variants(first: 1) { nodes { id } } }
        userErrors { field message }
      }
    }`,
    {
      product: productInput(product),
      media: mediaSources.map((originalSource) => ({ originalSource, mediaContentType: "IMAGE", alt: `${product.title} product photo` }))
    }
  );
  const error = data.productCreate.userErrors[0];
  if (error) throw new Error(`productCreate failed: ${formatUserError(error)}`);
  if (!data.productCreate.product) throw new Error("Shopify did not return the created Avant product.");
  return data.productCreate.product;
}

async function updateProduct(id, product) {
  const input = productInput(product);
  const data = await adminFetch(
    `mutation ProductUpdate($product: ProductUpdateInput!) { productUpdate(product: $product) { userErrors { field message } } }`,
    { product: { id, ...input } }
  );
  const error = data.productUpdate.userErrors[0];
  if (error) throw new Error(`productUpdate failed: ${formatUserError(error)}`);
}

async function replaceProductMedia(productId, mediaSources, title) {
  const existing = await adminFetch(
    `query ProductMedia($id: ID!) { product(id: $id) { media(first: 100) { nodes { id } } } }`,
    { id: productId }
  );
  const mediaIds = existing.product?.media?.nodes?.map((media) => media.id) || [];
  if (mediaIds.length) {
    const deletion = await adminFetch(
      `mutation ProductDeleteMedia($productId: ID!, $mediaIds: [ID!]!) { productDeleteMedia(productId: $productId, mediaIds: $mediaIds) { mediaUserErrors { field message } } }`,
      { productId, mediaIds }
    );
    const error = deletion.productDeleteMedia.mediaUserErrors[0];
    if (error) throw new Error(`productDeleteMedia failed: ${formatUserError(error)}`);
  }
  if (!mediaSources.length) return;
  const created = await adminFetch(
    `mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) { productCreateMedia(productId: $productId, media: $media) { mediaUserErrors { field message } } }`,
    { productId, media: mediaSources.map((originalSource) => ({ originalSource, mediaContentType: "IMAGE", alt: `${title} product photo` })) }
  );
  const error = created.productCreateMedia.mediaUserErrors[0];
  if (error) throw new Error(`productCreateMedia failed: ${formatUserError(error)}`);
}

async function updateVariant(productId, variantId, product) {
  const data = await adminFetch(
    `mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
    }`,
    {
      productId,
      variants: [{ id: variantId, price: String(product.commercial.minimumAdvertisedUsd || 0), inventoryPolicy: "CONTINUE", taxable: true, inventoryItem: { sku: `DW-AVANT-${product.sourceNumber}` } }]
    }
  );
  const error = data.productVariantsBulkUpdate.userErrors[0];
  if (error) throw new Error(`productVariantsBulkUpdate failed: ${formatUserError(error)}`);
}

async function updateExistingVariant(productId, product) {
  const data = await adminFetch(
    `query ProductVariant($id: ID!) { product(id: $id) { variants(first: 1) { nodes { id } } } }`,
    { id: productId }
  );
  const variantId = data.product?.variants?.nodes?.[0]?.id;
  if (variantId) await updateVariant(productId, variantId, product);
}

async function findProductByHandle(handle) {
  const data = await adminFetch(
    `query ProductByHandle($query: String!) { products(first: 1, query: $query) { nodes { id handle } } }`,
    { query: `handle:${handle}` }
  );
  return data.products.nodes.find((item) => item.handle === handle) || null;
}

async function uploadImageToStaging(filePath) {
  const fileName = path.basename(filePath);
  const mimeType = mimeTypeFor(fileName);
  const file = await fs.readFile(filePath);
  const data = await adminFetch(
    `mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } }
    }`,
    { input: [{ resource: "IMAGE", filename: fileName, mimeType, httpMethod: "POST" }] }
  );
  const error = data.stagedUploadsCreate.userErrors[0];
  if (error) throw new Error(`stagedUploadsCreate failed for ${fileName}: ${formatUserError(error)}`);
  const target = data.stagedUploadsCreate.stagedTargets[0];
  if (!target?.url || !target.resourceUrl) throw new Error(`Shopify did not return a staging target for ${fileName}.`);

  const form = new FormData();
  for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
  form.append("file", new Blob([file], { type: mimeType }), fileName);
  const response = await fetch(target.url, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Official Avant image upload failed for ${fileName}: HTTP ${response.status}`);
  return target.resourceUrl;
}

function metafield(key, value, type = "single_line_text_field") {
  return { namespace: "custom", key, type, value: String(value) };
}

function mimeTypeFor(fileName) {
  if (/\.png$/i.test(fileName)) return "image/png";
  if (/\.webp$/i.test(fileName)) return "image/webp";
  return "image/jpeg";
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
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET })
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
    // Environment variables may be provided by the host instead.
  }
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN and Shopify Admin credentials are required.");
  }
}

function formatUserError(error) {
  const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
  return field ? `${field}: ${error.message}` : error.message;
}
