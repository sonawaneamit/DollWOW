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

assertShopifyAdminEnv();

const execute = Boolean(args.execute);
const limit = Number(args.limit || 0);
const match = String(args.match || "").toLowerCase();
const reportHandles = args.report ? await loadHandlesFromReport(args.report) : null;
const outDir = path.join(ROOT, "data", "exports");
await fs.mkdir(outDir, { recursive: true });

const products = await fetchShopifyProducts(limit || 2500);
const filtered = products.filter((product) => {
  if (reportHandles && !reportHandles.has(product.handle)) return false;
  if (match) {
    return [product.handle, product.title, product.vendor, product.sourceTitle].filter(Boolean).join(" ").toLowerCase().includes(match);
  }
  return true;
});

const results = filtered
  .map((product) => {
    const proposedTitle = buildPublicTitle(product);
    const proposedSeoTitle = buildSeoTitle(product);
    const proposedSeoDescription = buildSeoDescription(product, proposedSeoTitle);
    const proposedDescriptionHtml = buildDescriptionHtml(product, proposedTitle);
    const changes = {};

    if (cleanText(product.title) !== cleanText(proposedTitle)) {
      changes.title = { from: product.title, to: proposedTitle };
    }
    if (cleanText(product.seoTitle) !== cleanText(proposedSeoTitle)) {
      changes.seoTitle = { from: product.seoTitle || "", to: proposedSeoTitle };
    }
    if (cleanText(product.seoDescription) !== cleanText(proposedSeoDescription)) {
      changes.seoDescription = { from: product.seoDescription || "", to: proposedSeoDescription };
    }
    if (normalizeHtml(product.descriptionHtml) !== normalizeHtml(proposedDescriptionHtml)) {
      changes.descriptionHtml = { from: normalizeHtml(product.descriptionHtml), to: normalizeHtml(proposedDescriptionHtml) };
    }

    return {
      product,
      proposed: {
        title: proposedTitle,
        seoTitle: proposedSeoTitle,
        seoDescription: proposedSeoDescription,
        descriptionHtml: proposedDescriptionHtml
      },
      changes
    };
  })
  .filter((result) => Object.keys(result.changes).length > 0);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(outDir, `shopify-public-copy-refresh-${timestamp}.json`);
await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      match: match || null,
      totalProducts: products.length,
      scannedProducts: filtered.length,
      changedProducts: results.length,
      results: results.map((result) => ({
        id: result.product.id,
        handle: result.product.handle,
        currentTitle: result.product.title,
        proposedTitle: result.proposed.title,
        currentSeoTitle: result.product.seoTitle || "",
        proposedSeoTitle: result.proposed.seoTitle,
        currentSeoDescription: result.product.seoDescription || "",
        proposedSeoDescription: result.proposed.seoDescription,
        changes: Object.keys(result.changes)
      }))
    },
    null,
    2
  )
);

console.log(`Scanned ${filtered.length} live Shopify products.`);
console.log(`Found ${results.length} products with public-copy changes.`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  for (const result of results.slice(0, 15)) {
    console.log(`- ${result.product.handle}`);
    if (result.changes.title) console.log(`    title: ${result.changes.title.from} -> ${result.changes.title.to}`);
    if (result.changes.seoTitle) console.log(`    seoTitle: ${result.changes.seoTitle.from} -> ${result.changes.seoTitle.to}`);
  }
  process.exit(0);
}

let updated = 0;
for (const result of results) {
  await updateProductCopy(result.product.id, result.proposed);
  updated += 1;
  if (updated % 25 === 0 || updated === results.length) {
    console.log(`Updated ${updated}/${results.length}`);
  }
}

console.log(JSON.stringify({ mode: "execute", updated, report: path.relative(ROOT, reportPath) }, null, 2));

async function fetchShopifyProducts(limit) {
  const products = [];
  let after = null;

  while (products.length < limit) {
    const first = Math.min(100, limit - products.length);
    const data = await adminFetch(
      `query Products($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          edges {
            cursor
            node {
              id
              handle
              title
              descriptionHtml
              vendor
              productType
              tags
              seo { title description }
              brand: metafield(namespace: "custom", key: "brand") { value }
              material: metafield(namespace: "custom", key: "material") { value }
              heightCm: metafield(namespace: "custom", key: "height_cm") { value }
              cupSize: metafield(namespace: "custom", key: "cup_size") { value }
              stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
              headModel: metafield(namespace: "custom", key: "head_model") { value }
              displayName: metafield(namespace: "custom", key: "display_name") { value }
              sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
              sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after }
    );

    products.push(
      ...data.products.edges.map(({ node }) => ({
        id: node.id,
        handle: node.handle,
        title: node.title,
        descriptionHtml: node.descriptionHtml || "",
        vendor: node.vendor || "",
        productType: node.productType || "",
        tags: node.tags || [],
        seoTitle: node.seo?.title || "",
        seoDescription: node.seo?.description || "",
        brand: node.brand?.value || node.vendor || "",
        material: node.material?.value || "",
        heightCm: numberValue(node.heightCm?.value),
        cupSize: node.cupSize?.value || "",
        stockStatus: node.stockStatus?.value || "",
        headModel: node.headModel?.value || "",
        displayName: node.displayName?.value || "",
        sourceTitle: node.sourceTitle?.value || "",
        sourceHandle: node.sourceHandle?.value || ""
      }))
    );

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function updateProductCopy(productId, proposed) {
  const data = await adminFetch(
    `mutation ProductUpdate($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product { id title }
        userErrors { field message }
      }
    }`,
    {
      product: {
        id: productId,
        title: proposed.title,
        descriptionHtml: proposed.descriptionHtml,
        seo: {
          title: proposed.seoTitle,
          description: proposed.seoDescription
        }
      }
    }
  );

  const error = data.productUpdate.userErrors[0];
  if (error) {
    const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
    throw new Error(field ? `${field}: ${error.message}` : error.message);
  }
}

function buildPublicTitle(product) {
  return buildProductTitle(product, { seo: false });
}

function buildSeoTitle(product) {
  return buildProductTitle(product, { seo: true });
}

function buildProductTitle(product, { seo }) {
  const brand = shortBrandLabel(product.brand || product.vendor);
  const sourceSeriesValue = sourceSeries(product.sourceTitle || product.title);
  const model = cleanText(product.displayName) || publicModelName(product.sourceTitle || product.title, product.sourceHandle || product.handle, sourceSeriesValue, brand);
  const publicModel = isReferenceLikeName(model) && !seo ? "" : model;
  const height = normalizeHeight(product.heightCm);
  const cup = normalizeCup(product.cupSize);
  const material = normalizeMaterial(product.material || product.productType);
  const kind = productKindLabel(inferProductKind(product.productType, product.tags));
  const inferredKind = inferProductKind(product.productType, product.tags);
  const availability = product.stockStatus === "ready_to_ship" ? "Ready-To-Ship" : "Customizable";
  const head = product.headModel ? readableHeadModel(product.headModel) : "";
  const headTitlePart = formatHeadTitlePart(material, head);
  const normalizedSeries = cleanText(sourceSeriesValue).toLowerCase();
  const normalizedModel = cleanText(publicModel).toLowerCase();
  const includeHead = !hasSameHeadReference(publicModel, head) && !hasSameHeadReference(sourceSeriesValue, head);
  const includeVisibleHead = includeHead && inferredKind === "head";
  const baseParts = [
    brand,
    publicModel,
    normalizedSeries && normalizedSeries === normalizedModel ? "" : sourceSeriesValue,
    height,
    cup ? `${cup}-Cup` : "",
    material,
    seo ? (includeHead ? headTitlePart : "") : includeVisibleHead ? headTitlePart : ""
  ].filter(Boolean);
  const suffixParts = seo ? [availability, shouldAppendKind(baseParts.join(" "), kind) ? kind : ""].filter(Boolean) : [];
  const parts = [...baseParts, ...suffixParts];
  return preserveAcronyms(cleanText(parts.join(" "))) || product.title;
}

function buildSeoDescription(product, title) {
  const availability = product.stockStatus === "ready_to_ship" ? "ready to ship" : "custom order";
  return `${title} with detailed measurements, ${availability} review, and private checkout at DollWow.`.slice(0, 155);
}

function buildDescriptionHtml(product, title) {
  const brand = cleanText(product.brand || product.vendor);
  const material = cleanText(normalizeMaterial(product.material || product.productType)).toLowerCase();
  const height = product.heightCm ? `${Math.round(product.heightCm)} cm` : "";
  const cup = normalizeCup(product.cupSize);
  const availability =
    product.stockStatus === "ready_to_ship"
      ? "Ready-to-ship availability is confirmed before payment is finalized."
      : "Custom build timing and compatibility are confirmed before production begins.";
  const specPhrase = [height, cup ? `${cup}-Cup` : "", material].filter(Boolean).join(" ");

  return [
    `<p>${escapeHtml(title)} from ${escapeHtml(brand || "DollWow")}.</p>`,
    specPhrase ? `<p>Review the full measurements, materials, and available options before checkout. This build is listed with ${escapeHtml(specPhrase)} specs.</p>` : "",
    `<p>${escapeHtml(availability)} DollWow keeps checkout private and confirms the final order details with you before fulfillment.</p>`
  ]
    .filter(Boolean)
    .join("");
}

function shortBrandLabel(value) {
  const text = cleanText(value);
  if (!text) return "";
  if (/^wm(\s+dolls?)?$/i.test(text)) return "WM";
  return text.replace(/\s+dolls$/i, "");
}

function publicModelName(title, handle, series, brand) {
  const candidates = [
    extractBrandQualifiedName(title, brand),
    extractNamedSuffix(title),
    extractLeadingName(title),
    extractBrandQualifiedName(String(handle || "").replace(/-/g, " "), brand),
    extractLeadingName(String(handle || "").replace(/-/g, " "))
  ].filter(Boolean);
  for (const candidate of candidates) {
    const cleaned = sanitizePublicModelName(candidate, series);
    if (cleaned) return cleaned;
  }
  return "";
}

function extractNamedSuffix(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const match = cleaned.match(/\s[-–]\s([^()]+?)(?:\s*\([^)]*\))?$/);
  return match ? cleanText(match[1]) : "";
}

function extractLeadingName(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const match = cleaned.match(/^([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*){0,2})\s+\d{2,3}\s*cm\b/i);
  return match ? cleanText(match[1]) : "";
}

function extractBrandQualifiedName(value, brand) {
  const cleaned = cleanText(value);
  const brandLabel = cleanText(brand);
  if (!cleaned || !brandLabel) return "";

  const compactBrand = escapeRegExp(brandLabel.replace(/\s+dolls$/i, "").trim());
  if (!compactBrand) return "";

  const match = cleaned.match(new RegExp(`^${compactBrand}\\s+([A-Za-z][A-Za-z'\\-]*(?:\\s+[A-Za-z][A-Za-z'\\-]*){0,1})\\s+\\d{2,3}\\s*cm\\b`, "i"));
  return match ? cleanText(match[1]) : "";
}

function sanitizePublicModelName(value, series) {
  const cleaned = cleanText(value)
    .replace(/[._]+/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(rosemary|rosemarydoll|joy\s*love|joylovedolls?)\b/gi, "")
    .replace(/\b(ready[-\s]?to[-\s]?ship|customizable|companion|doll|dolls|sex|adult|silicone|tpe|hybrid|head|torso)\b/gi, "")
    .replace(/\b\d{2,3}\s*cm\b/gi, "")
    .replace(/\b\d+\s*ft\s*\d*\b/gi, "")
    .replace(/\b[a-z]{1,3}\s*-?\s*cup\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  const numericHead = cleaned.match(/^#?\s*([a-z]?\d+[a-z]?)$/i);
  if (numericHead) return `Head ${numericHead[1].toUpperCase()}`;

  const words = cleaned.split(" ").filter(Boolean);
  if (!words.length || words.length > 2) return "";
  if (series && words.length > 1) return "";
  if (words.every((word) => word.length <= 2)) return "";

  const normalized = titleCase(cleaned);
  const generic = normalized.toLowerCase();
  if (["heads", "head", "realistic ai companion"].includes(generic)) return "";
  return normalized;
}

function sourceSeries(value) {
  const match = cleanText(value).match(/\b(zelex\s+)?(sle|evo|gynoid|zen|ros|ai)\s*\d+(?:\.\d+)?\b/i);
  return match ? match[0].replace(/^zelex\s+/i, "").toUpperCase() : "";
}

function hasSameHeadReference(left, right) {
  const a = normalizeHeadReference(left);
  const b = normalizeHeadReference(right);
  return Boolean(a && b && a === b);
}

function shouldAppendKind(title, kind) {
  if (!kind) return false;
  const normalizedTitle = cleanText(title).toLowerCase();
  const normalizedKind = cleanText(kind).toLowerCase();
  if (!normalizedKind) return false;
  if (normalizedTitle.includes(normalizedKind)) return false;
  return true;
}

function normalizeHeadReference(value) {
  const cleaned = cleanText(value).toLowerCase();
  if (!cleaned) return "";
  const match = cleaned.match(/(?:head[-_\s#]*)?([a-z]?\d+[a-z]?)/i);
  return match ? match[1].toUpperCase() : "";
}

function isReferenceLikeName(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return false;
  if (/^Head\s+[A-Z]?\d+[A-Z]?$/i.test(cleaned)) return true;
  if (/^(SLE|EVO|AI|ROS|ZEN|GYNOID)\s*\d+(?:\.\d+)?$/i.test(cleaned)) return true;
  return false;
}

function normalizeHeight(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return `${Math.round(parsed)}cm`;
}

function normalizeCup(value) {
  const text = cleanText(value);
  const normalized = text
    .toLowerCase()
    .replace(/(?:-|\/|\s)*cup$/i, "")
    .replace(/[^a-z0-9]+/g, "");
  if (!normalized || ["na", "nacup", "none", "notapplicable", "nocup"].includes(normalized)) return "";
  const match = text.match(/[a-z]{1,3}/i);
  return match ? match[0].toUpperCase() : "";
}

function normalizeMaterial(value) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized.includes("silicone head")) return "Silicone Head";
  if (normalized.includes("silicone")) return "Silicone";
  if (normalized.includes("tpe")) return "TPE";
  if (normalized.includes("hybrid")) return "Hybrid";
  return "";
}

function inferProductKind(productType, tags = []) {
  const type = cleanText(productType).toLowerCase();
  const text = cleanText(`${type} ${tags.join(" ")}`).toLowerCase();
  if (/\bsilicone[-\s]?head\s+doll\b/.test(type) || /\bsilicone[-\s]?head\s+companion\b/.test(type)) return "full_doll";
  if (/\b(replacement\s+head|standalone\s+head|doll\s+head|heads?)\b/.test(type)) return "head";
  if (/\btorso\b/.test(text)) return "torso";
  if (/\b(accessory|care kit|stand|wig)\b/.test(text)) return "accessory";
  return "full_doll";
}

function productKindLabel(kind) {
  if (kind === "head") return "Head";
  if (kind === "torso") return "Torso";
  if (kind === "accessory") return "Accessory";
  return "Companion Doll";
}

function readableHeadModel(value) {
  const match = String(value || "").match(/(?:head[-_\s]*)?([a-z]?\d+[a-z]?)/i);
  return match ? `Head ${match[1].toUpperCase()}` : "";
}

function formatHeadTitlePart(material, head) {
  const normalizedMaterial = cleanText(material).toLowerCase();
  if (normalizedMaterial !== "silicone head") return head;
  const match = cleanText(head).match(/^Head\s+(.+)$/i);
  return match ? match[1].toUpperCase() : head;
}

function preserveAcronyms(value) {
  return String(value || "")
    .replace(/\bTpe\b/g, "TPE")
    .replace(/\bNa\b/g, "N/A")
    .replace(/\bUsa\b/g, "USA")
    .replace(/\bUk\b/g, "UK")
    .replace(/\bEu\b/g, "EU");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleCase(value) {
  return String(value || "").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function normalizeHtml(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const accessToken = await getAdminAccessToken(domain);
    const response = await fetchWithRetry(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: JSON.stringify({ query, variables })
    });
    const payload = await response.json();
    const message = payload.errors?.[0]?.message || `HTTP ${response.status}`;

    if (response.ok && !payload.errors?.length) {
      return payload.data;
    }

    if (/throttled/i.test(message) && attempt < 5) {
      await new Promise((resolve) => setTimeout(resolve, 1250 * attempt));
      continue;
    }

    throw new Error(`Shopify Admin API request failed: ${message}`);
  }
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

async function fetchWithRetry(url, options, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
  }
  throw lastError;
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required.");
  }
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
    // local env optional
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

async function loadHandlesFromReport(reportPath) {
  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.join(ROOT, reportPath);
  const payload = JSON.parse(await fs.readFile(absolutePath, "utf8"));
  const rows = Array.isArray(payload?.results) ? payload.results : [];
  return new Set(
    rows
      .filter((row) => row.status === "set" || row.status === "unchanged" || row.proposedDisplayName)
      .map((row) => row.handle)
      .filter(Boolean)
  );
}

function printHelp() {
  console.log(`Usage:
  node scripts/refresh-shopify-public-copy.mjs
  node scripts/refresh-shopify-public-copy.mjs --match zelex
  node scripts/refresh-shopify-public-copy.mjs --report data/exports/shopify-human-display-names-2026-06-12T09-35-25-279Z.json
  node scripts/refresh-shopify-public-copy.mjs --limit 100
  node scripts/refresh-shopify-public-copy.mjs --execute

Dry-runs by default. Rebuilds live Shopify product titles, SEO titles/descriptions, and public description HTML using DollWow-owned naming rules.`);
}
