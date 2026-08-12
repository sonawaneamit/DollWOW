import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const execute = process.argv.includes("--execute");
let tokenCache = null;

await loadLocalEnv();

const product = {
  title: "Avant Clara 165cm F-Cup Full Silicone Doll",
  handle: "avant-clara-165cm-f-cup-full-silicone",
  vendor: "Avant Doll",
  price: "2099.00",
  descriptionHtml:
    "<p>Clara combines Avant's 165 cm F-cup full silicone body with the Ros head in Wheat. Review the measurements, material, and available configuration with our team before placing a custom order.</p>",
  tags: ["avant-doll", "gender-female", "material-silicone", "factory-order", "full-size", "dollwow-test"],
  metafields: [
    metafield("catalog_identity_key", "avant|165|f|silicone|ros|wheat"),
    metafield("catalog_body_identity_key", "avant|165|f|silicone"),
    metafield("display_name", "Clara"),
    metafield("head_model", "Ros"),
    metafield("body_type", "female"),
    metafield("brand", "Avant Doll"),
    metafield("material", "Silicone"),
    metafield("height_cm", "165", "number_integer"),
    metafield("weight_lb", "72.3", "number_decimal"),
    metafield("cup_size", "F-Cup"),
    metafield(
      "measurements",
      JSON.stringify({
        Height: "5 ft 5 in / 165 cm",
        Weight: "72.3 lb / 32 kg",
        "Cup size": "F-Cup",
        "Neck Girth": "10.2 in / 26 cm",
        "Shoulders Width": "12.5 in / 32 cm",
        Bust: "33.4 in / 85 cm",
        "Under Bust": "24.4 in / 62 cm",
        Waist: "22.2 in / 56.5 cm",
        Hip: "36.6 in / 93 cm",
        "Arms Length": "18.1 in / 46 cm",
        "Legs Length": "32.2 in / 82 cm",
        "Feet Length": "8.2 in / 21 cm",
        "Vagina Depth": "7.2 in / 18.5 cm",
        "Anus Depth": "6.2 in / 16 cm",
        "Oral Depth": "5.9 in / 15 cm"
      }),
      "json"
    ),
    metafield("stock_status", "custom"),
    metafield("custom_available", "true", "boolean"),
    metafield("source_title", "Avant Clara 165cm F-Cup Ros Head Full Silicone Doll (Wheat)"),
    metafield("source_handle", "avant-clara-165cm-f-cup-ros-wheat"),
    metafield("qc_note", "Manufacturer-provided Avant catalog media and specifications.", "multi_line_text_field"),
    metafield("import_review_flags", JSON.stringify({ testListing: true, catalogVisible: false, robots: "noindex" }), "json")
  ],
  images: ["_O3A6915.jpg", "_O3A6927.jpg", "_O3A6937.jpg", "_O3A7082.jpg"]
};

const assetDirectory = "/tmp/avant-clara-0731";

if (!execute) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        handle: product.handle,
        title: product.title,
        price: product.price,
        images: product.images.map((name) => path.join(assetDirectory, name)),
        publication: "Headless only",
        catalogVisible: false,
        robots: "noindex"
      },
      null,
      2
    )
  );
  process.exit(0);
}

assertShopifyAdminEnv();
const existing = await findProductByHandle(product.handle);
let created = existing;
if (!created) {
  const imageSources = [];
  for (const fileName of product.images) {
    imageSources.push(await uploadImageToStaging(path.join(assetDirectory, fileName)));
  }
  created = await createProduct(imageSources);
  const variantId = created.variants.nodes[0]?.id;
  if (!variantId) throw new Error("Shopify did not return the initial product variant.");
  await updateVariant(created.id, variantId);
}
const publication = await getHeadlessPublication();
await publishToHeadless(created.id, publication.id);

console.log(
  JSON.stringify(
    {
      status: "created",
      productId: created.id,
      handle: product.handle,
      productUrl: `https://dollwow.com/products/${product.handle}`,
      publication: publication.name,
      catalogVisible: false,
      robots: "noindex"
    },
    null,
    2
  )
);

function metafield(key, value, type = "single_line_text_field") {
  return { namespace: "custom", key, type, value: String(value) };
}

async function createProduct(mediaSources) {
  const data = await adminFetch(
    `mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product { id handle variants(first: 1) { nodes { id } } }
        userErrors { field message }
      }
    }`,
    {
      product: {
        title: product.title,
        handle: product.handle,
        descriptionHtml: product.descriptionHtml,
        vendor: product.vendor,
        productType: "Adult doll",
        tags: product.tags,
        status: "ACTIVE",
        seo: {
          title: "Avant Clara 165cm F-Cup Full Silicone Doll | DollWow",
          description: "Explore Clara, an Avant 165cm F-cup full silicone doll with detailed body measurements and custom-order support."
        },
        metafields: product.metafields
      },
      media: mediaSources.map((originalSource) => ({ originalSource, mediaContentType: "IMAGE", alt: "Avant Clara 165cm F-Cup Full Silicone Doll" }))
    }
  );
  const error = data.productCreate.userErrors[0];
  if (error) throw new Error(`productCreate failed: ${formatUserError(error)}`);
  if (!data.productCreate.product) throw new Error("Shopify did not return the created product.");
  return data.productCreate.product;
}

async function updateVariant(productId, variantId) {
  const data = await adminFetch(
    `mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        userErrors { field message }
      }
    }`,
    {
      productId,
      variants: [
        {
          id: variantId,
          price: product.price,
          inventoryPolicy: "CONTINUE",
          taxable: true,
          inventoryItem: { sku: "DW-AVANT-CLARA-165F-SIL" }
        }
      ]
    }
  );
  const error = data.productVariantsBulkUpdate.userErrors[0];
  if (error) throw new Error(`productVariantsBulkUpdate failed: ${formatUserError(error)}`);
}

async function uploadImageToStaging(filePath) {
  const fileName = path.basename(filePath);
  const file = await fs.readFile(filePath);
  const data = await adminFetch(
    `mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    { input: [{ resource: "IMAGE", filename: fileName, mimeType: "image/jpeg", httpMethod: "POST" }] }
  );
  const error = data.stagedUploadsCreate.userErrors[0];
  if (error) throw new Error(`stagedUploadsCreate failed for ${fileName}: ${formatUserError(error)}`);
  const target = data.stagedUploadsCreate.stagedTargets[0];
  if (!target?.url || !target.resourceUrl) throw new Error(`Shopify did not return a staging target for ${fileName}.`);

  const form = new FormData();
  for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
  form.append("file", new Blob([file], { type: "image/jpeg" }), fileName);
  const response = await fetch(target.url, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Supplier image upload failed for ${fileName}: HTTP ${response.status}`);
  return target.resourceUrl;
}

async function getHeadlessPublication() {
  const data = await adminFetch(`query Publications { publications(first: 50) { nodes { id name } } }`);
  const publication = data.publications.nodes.find((item) => /headless/i.test(item.name || ""));
  if (!publication) throw new Error("The Shopify Headless publication was not found; refusing to publish anywhere else.");
  return publication;
}

async function publishToHeadless(productId, publicationId) {
  const data = await adminFetch(
    `mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { field message } }
    }`,
    { id: productId, input: [{ publicationId }] }
  );
  const error = data.publishablePublish.userErrors[0];
  if (error) throw new Error(`publishablePublish failed: ${formatUserError(error)}`);
}

async function findProductByHandle(handle) {
  const data = await adminFetch(
    `query ProductByHandle($query: String!) { products(first: 1, query: $query) { nodes { id handle variants(first: 1) { nodes { id } } } } }`,
    { query: `handle:${handle}` }
  );
  return data.products.nodes.find((item) => item.handle === handle) || null;
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
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
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
    // A dry run can still be useful without local credentials.
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
