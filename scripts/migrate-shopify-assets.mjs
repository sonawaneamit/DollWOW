import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const CACHE_PATH = path.join(ROOT, "tmp", "shopify-file-migration-cache.json");
let tokenCache = null;

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

assertShopifyAdminEnv();

const execute = Boolean(args.execute);
const limit = Number(args.limit || 0);
const query = String(args.query || "vendor:DollWow");
const batchSize = Math.max(1, Math.min(20, Number(args["batch-size"] || 12)));
const cleanupSource = args["cleanup-source"] !== "false";
const rewriteQcNote = args["rewrite-qc-note"] !== "false";
const reportPath = path.resolve(ROOT, args.report || path.join("tmp", "shopify-asset-migration-report.json"));

const products = await fetchProducts(query, limit);
const inventory = buildInventory(products);

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, JSON.stringify(inventory.report, null, 2));

console.log(`Scanned ${products.length} products for query "${query}".`);
console.log(`Found ${inventory.uniqueSwatchUrls.length} unique swatch URLs across ${inventory.productsWithSwatches} products.`);
console.log(`Report written to ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  console.log("Dry run only. Add --execute to upload Shopify Files, rewrite customization metafields, and clear source-trace metafields.");
  process.exit(0);
}

const cache = await readCache();
const swatchUrlMap = await migrateSwatchAssets(inventory.uniqueSwatchUrls, cache, batchSize);
await writeCache(cache);

let updatedProducts = 0;
let unchangedProducts = 0;
let deletedSourceMetafields = 0;

for (const product of products) {
  const originalGroups = parseCustomizationGroups(product.customizationGroups?.value);
  if (!originalGroups.length) {
    unchangedProducts += 1;
    continue;
  }

  const migratedGroups = rewriteCustomizationGroups(originalGroups, swatchUrlMap);
  const customizationChanged = JSON.stringify(migratedGroups) !== JSON.stringify(originalGroups);
  const qcNoteValue = rewriteQcNote ? sanitizeQcNote(product.qcNote?.value) : undefined;
  const qcNoteChanged = qcNoteValue !== undefined && qcNoteValue !== (product.qcNote?.value || undefined);
  const shouldDeleteSource = cleanupSource && [product.sourceUrl?.value, product.sourceTitle?.value, product.sourceHandle?.value].some(Boolean);

  if (!customizationChanged && !qcNoteChanged && !shouldDeleteSource) {
    unchangedProducts += 1;
    continue;
  }

  await updateProductMetafields(product.id, {
    customizationGroups: customizationChanged ? migratedGroups : undefined,
    qcNote: qcNoteChanged ? qcNoteValue : undefined
  });

  if (shouldDeleteSource) {
    const deletedCount = await deleteSourceMetafields(product.id);
    deletedSourceMetafields += deletedCount;
  }

  updatedProducts += 1;
  console.log(`Updated ${product.handle}${shouldDeleteSource ? " (source metafields cleared)" : ""}`);
}

console.log(
  JSON.stringify(
    {
      productsScanned: products.length,
      productsUpdated: updatedProducts,
      productsUnchanged: unchangedProducts,
      uniqueSwatchUrls: inventory.uniqueSwatchUrls.length,
      uploadedFiles: Object.keys(cache.urls || {}).length,
      deletedSourceMetafields
    },
    null,
    2
  )
);

async function fetchProducts(query, limit) {
  const products = [];
  let after = null;

  while (true) {
    const data = await adminFetch(
      `query Products($after: String, $query: String!) {
        products(first: 100, after: $after, query: $query) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            featuredImage { url }
            images(first: 5) {
              nodes { url }
            }
            customizationGroups: metafield(namespace: "custom", key: "customization_groups") { value }
            qcNote: metafield(namespace: "custom", key: "qc_note") { value }
            sourceUrl: metafield(namespace: "custom", key: "source_url") { value }
            sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
            sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
          }
        }
      }`,
      { after, query }
    );

    for (const product of data.products.nodes) {
      products.push(product);
      if (limit && products.length >= limit) return products;
    }

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

function buildInventory(products) {
  const uniqueSwatchUrls = new Set();
  const swatchHosts = {};
  const productHosts = {};
  let productsWithSwatches = 0;
  let productsWithExternalMedia = 0;

  for (const product of products) {
    const groups = parseCustomizationGroups(product.customizationGroups?.value);
    const swatchUrls = groups.flatMap((group) =>
      (group.options || [])
        .map((option) => option?.swatch)
        .filter((swatch) => swatch?.kind === "image" && swatch.value)
        .map((swatch) => swatch.value)
    );

    if (swatchUrls.length) productsWithSwatches += 1;

    for (const url of swatchUrls) {
      uniqueSwatchUrls.add(normalizeRosemaryAssetUrl(url));
      const host = safeHost(url);
      if (host) swatchHosts[host] = (swatchHosts[host] || 0) + 1;
    }

    const mediaUrls = [product.featuredImage?.url, ...(product.images?.nodes || []).map((image) => image?.url)].filter(Boolean);
    const externalMedia = mediaUrls.filter((url) => safeHost(url) && safeHost(url) !== "cdn.shopify.com");
    if (externalMedia.length) productsWithExternalMedia += 1;
    for (const url of externalMedia) {
      const host = safeHost(url);
      if (host) productHosts[host] = (productHosts[host] || 0) + 1;
    }
  }

  return {
    uniqueSwatchUrls: [...uniqueSwatchUrls],
    productsWithSwatches,
    report: {
      generatedAt: new Date().toISOString(),
      query,
      productsScanned: products.length,
      productsWithSwatches,
      uniqueSwatchUrls: uniqueSwatchUrls.size,
      swatchHosts,
      productsWithExternalMedia,
      productMediaHosts: productHosts
    }
  };
}

async function migrateSwatchAssets(urls, cache, batchSize) {
  const mapping = new Map();
  const pending = [];

  for (const originalUrl of urls) {
    const normalizedUrl = normalizeRosemaryAssetUrl(originalUrl);
    const cached = cache.urls[normalizedUrl];
    const failed = cache.failed[normalizedUrl];
    if (cached) {
      mapping.set(normalizedUrl, cached);
      continue;
    }
    if (failed) continue;
    pending.push(normalizedUrl);
  }

  console.log(`${pending.length} swatch images need Shopify-native copies.`);

  for (let index = 0; index < pending.length; index += batchSize) {
    const batch = pending.slice(index, index + batchSize);
    const created = await createShopifyFiles(batch);
    const { readyFiles, failedFiles } = await waitForFiles(created);

    for (const file of readyFiles) {
      if (!file.image?.url) continue;
      cache.urls[file.sourceUrl] = file.image.url;
      mapping.set(file.sourceUrl, file.image.url);
    }

    for (const file of failedFiles) {
      cache.failed[file.sourceUrl] = {
        failedAt: new Date().toISOString(),
        reason: file.reason || "Shopify file processing failed"
      };
      console.warn(`Skipped failed asset: ${file.sourceUrl}`);
    }

    await writeCache(cache);
    console.log(`Migrated ${Math.min(index + batch.length, pending.length)}/${pending.length} swatch images`);
  }

  for (const [sourceUrl, cdnUrl] of Object.entries(cache.urls)) {
    mapping.set(sourceUrl, cdnUrl);
  }

  return mapping;
}

async function createShopifyFiles(sourceUrls) {
  const data = await adminFetch(
    `mutation FileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          __typename
          ... on MediaImage {
            id
            fileStatus
            alt
          }
        }
        userErrors { field message code }
      }
    }`,
    {
      files: sourceUrls.map((sourceUrl) => ({
        alt: "DollWow customization reference",
        contentType: "IMAGE",
        originalSource: sourceUrl,
        filename: deterministicFilename(sourceUrl)
      }))
    }
  );

  const error = data.fileCreate.userErrors?.[0];
  if (error) {
    throw new Error(`fileCreate failed: ${formatUserError(error)}`);
  }

  return data.fileCreate.files.map((file, index) => ({
    ...file,
    sourceUrl: sourceUrls[index]
  }));
}

async function waitForFiles(files) {
  const pending = new Map(files.map((file) => [file.id, file.sourceUrl]));
  const ready = [];
  const failed = [];

  for (let attempt = 0; attempt < 20 && pending.size; attempt += 1) {
    const ids = [...pending.keys()];
    const data = await adminFetch(
      `query Files($ids: [ID!]!) {
        nodes(ids: $ids) {
          __typename
          ... on MediaImage {
            id
            fileStatus
            alt
            image { url }
          }
        }
      }`,
      { ids }
    );

    for (const node of data.nodes || []) {
      if (!node?.id || !pending.has(node.id)) continue;
      if (node.fileStatus === "READY" && node.image?.url) {
        ready.push({
          ...node,
          sourceUrl: pending.get(node.id)
        });
        pending.delete(node.id);
      } else if (node.fileStatus === "FAILED") {
        failed.push({
          ...node,
          sourceUrl: pending.get(node.id),
          reason: "Shopify file processing failed"
        });
        pending.delete(node.id);
      }
    }

    if (pending.size) {
      await delay(1500 + attempt * 200);
    }
  }

  if (pending.size) {
    for (const [id, sourceUrl] of pending.entries()) {
      failed.push({
        id,
        sourceUrl,
        reason: "Timed out waiting for Shopify file processing"
      });
    }
  }

  return { readyFiles: ready, failedFiles: failed };
}

function rewriteCustomizationGroups(groups, swatchUrlMap) {
  return groups.map((group) => ({
    ...group,
    options: (group.options || []).map((option) => {
      if (option.swatch?.kind !== "image" || !option.swatch.value) return option;
      const normalized = normalizeRosemaryAssetUrl(option.swatch.value);
      const migrated = swatchUrlMap.get(normalized) || normalized;
      return {
        ...option,
        swatch: {
          ...option.swatch,
          value: migrated
        }
      };
    })
  }));
}

async function updateProductMetafields(productId, input) {
  const metafields = [];

  if (input.customizationGroups) {
    metafields.push({
      namespace: "custom",
      key: "customization_groups",
      type: "json",
      value: JSON.stringify(input.customizationGroups)
    });
  }

  if (input.qcNote !== undefined) {
    metafields.push({
      namespace: "custom",
      key: "qc_note",
      type: "multi_line_text_field",
      value: input.qcNote
    });
  }

  if (!metafields.length) return;

  const data = await adminFetch(
    `mutation ProductUpdate($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product { id handle }
        userErrors { field message }
      }
    }`,
    {
      product: {
        id: productId,
        metafields
      }
    }
  );

  const error = data.productUpdate.userErrors?.[0];
  if (error) {
    throw new Error(`productUpdate failed: ${formatUserError(error)}`);
  }
}

async function deleteSourceMetafields(productId) {
  const entries = [
    { ownerId: productId, namespace: "custom", key: "source_url" },
    { ownerId: productId, namespace: "custom", key: "source_title" },
    { ownerId: productId, namespace: "custom", key: "source_handle" }
  ];

  const data = await adminFetch(
    `mutation MetafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) {
        deletedMetafields { key namespace ownerId }
        userErrors { field message }
      }
    }`,
    { metafields: entries }
  );

  const errors = data.metafieldsDelete.userErrors || [];
  const fatal = errors.find((error) => !/not found/i.test(error.message || ""));
  if (fatal) {
    throw new Error(`metafieldsDelete failed: ${formatUserError(fatal)}`);
  }

  return (data.metafieldsDelete.deletedMetafields || []).length;
}

function sanitizeQcNote(value) {
  if (!value) return "Final details are confirmed before checkout or production.";
  if (/prepared from|review supplier authorization|before publish/i.test(value)) {
    return "Final details are confirmed before checkout or production.";
  }
  return value;
}

function normalizeRosemaryAssetUrl(value) {
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();

    if (pathname.includes("deluxe-care-kit")) {
      return "/option-swatches/deluxe-care-kit.svg";
    }

    if (pathname.includes("care-kit")) {
      return "/option-swatches/care-kit.svg";
    }

    if (url.hostname.includes("nitrocdn.com")) {
      const match = url.pathname.match(/\/(www\.)?(supplier|rosemarydoll)\.com(\/wp-content\/uploads\/.+)$/i);
      if (match) {
        return `https://www.rosemarydoll.com${match[3]}`;
      }
      return value;
    }

    if (/(^|\.)supplier\.com$/i.test(url.hostname)) {
      url.hostname = "www.rosemarydoll.com";
      return url.toString();
    }

    if (url.hostname === "rosemarydoll.com") {
      url.hostname = "www.rosemarydoll.com";
      return url.toString();
    }

    return value;
  } catch {
    return value;
  }
}

function deterministicFilename(sourceUrl) {
  const normalized = normalizeRosemaryAssetUrl(sourceUrl);
  const digest = crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 12);
  const pathname = new URL(normalized).pathname;
  const extensionMatch = pathname.match(/\.([a-z0-9]+)$/i);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "jpg";
  const base = path.basename(pathname, extensionMatch ? `.${extension}` : "").replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "swatch";
  return `dw-option-${base}-${digest}.${extension}`;
}

function parseCustomizationGroups(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    throw new Error(payload.errors?.[0]?.message || `HTTP ${response.status}`);
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

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { urls: parsed.urls || {}, failed: parsed.failed || {} };
  } catch {
    return { urls: {}, failed: {} };
  }
}

async function writeCache(cache) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function safeHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function formatUserError(error) {
  const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
  return field ? `${field}: ${error.message}` : error.message;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    // optional in shared environments
  }
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required.");
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/migrate-shopify-assets.mjs
  node scripts/migrate-shopify-assets.mjs --query "vendor:DollWow tag:angelkiss"
  node scripts/migrate-shopify-assets.mjs --execute
  node scripts/migrate-shopify-assets.mjs --execute --batch-size 10 --report tmp/migration-report.json

Dry-runs by default. With --execute, uploads customization swatch images into Shopify Files, rewrites product customization metafields to Shopify CDN URLs, sanitizes qc_note, and clears source-trace metafields.`);
}
