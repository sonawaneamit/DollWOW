import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const SOURCE_PATTERN = /\b(?:rosemary(?:doll)?|joy\s*love|joylovedolls?)\b/i;
let tokenCache = null;

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
const execute = Boolean(args.execute);
const products = await fetchProducts();
const reviewedProducts = products.map((product) => {
    const descriptionHtml = sanitizeDescription(product.descriptionHtml);
    const qcNote = sanitizeQcNote(product.qcNote);
    return {
      ...product,
      descriptionHtml,
      qcNote,
      descriptionChanged: descriptionHtml !== product.descriptionHtml,
      qcNoteChanged: qcNote !== product.qcNote
    };
  });
const changes = reviewedProducts.filter((product) => product.descriptionChanged || product.qcNoteChanged);
const unresolved = reviewedProducts.filter((product) => SOURCE_PATTERN.test(product.descriptionHtml) || SOURCE_PATTERN.test(product.qcNote));

if (execute && unresolved.length) throw new Error(`Source-store language remains in ${unresolved.length} reviewed products. No changes were applied.`);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(ROOT, "data", "exports", `shopify-source-copy-cleanup-${timestamp}.json`);
await fs.writeFile(
  reportPath,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: execute ? "execute" : "dry-run",
    scannedProducts: products.length,
    changedProducts: changes.length,
    unresolvedProducts: unresolved.map((product) => ({ handle: product.handle, descriptionHtml: product.descriptionHtml, qcNote: product.qcNote })),
    changes: changes.map((product) => ({
      handle: product.handle,
      descriptionChanged: product.descriptionChanged,
      qcNoteChanged: product.qcNoteChanged
    }))
  }, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify({ mode: execute ? "execute" : "dry-run", scannedProducts: products.length, changedProducts: changes.length, unresolvedProducts: unresolved.length, report: path.relative(ROOT, reportPath) }, null, 2));

if (execute) {
  let updated = 0;
  for (const product of changes) {
    if (product.descriptionChanged) await updateDescription(product.id, product.descriptionHtml);
    if (product.qcNoteChanged) await updateQcNote(product.id, product.qcNote);
    updated += 1;
  }
  console.log(`Updated ${updated} Shopify products.`);
}

function sanitizeDescription(value) {
  return String(value || "")
    .replace(/,?\s*with the base price aligned to Rosemary(?:Doll)?(?:'s|’s) reviewed \d+\s*cm Real Lady pricing\.?/gi, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\.\./g, ".")
    .trim();
}

function sanitizeQcNote(value) {
  const note = String(value || "");
  if (/^Prepared from https?:\/\/(?:www\.)?rosemarydoll\.com\//i.test(note)) {
    return "Our team can confirm current options, pricing, and availability before checkout.";
  }
  if (/^Current Rosemary regional stock snapshot/i.test(note)) {
    return "Regional stock and the exact warehouse are confirmed before checkout.";
  }
  return note
    .replace(/\s*(?:Full-silicone p|P)rice follows (?:the reviewed )?Rosemary[^.]*\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchProducts() {
  const products = [];
  let after = null;
  while (true) {
    const data = await adminFetch(
      `query SourceCopyProducts($after: String) {
        products(first: 100, after: $after, sortKey: TITLE) {
          nodes {
            id
            handle
            descriptionHtml
            qcNote: metafield(namespace: "custom", key: "qc_note") { value }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after }
    );
    products.push(...data.products.nodes.map((node) => ({ id: node.id, handle: node.handle, descriptionHtml: node.descriptionHtml || "", qcNote: node.qcNote?.value || "" })));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products.filter((product) => SOURCE_PATTERN.test(product.descriptionHtml) || SOURCE_PATTERN.test(product.qcNote));
}

async function updateDescription(id, descriptionHtml) {
  const data = await adminFetch(
    `mutation UpdatePublicDescription($product: ProductUpdateInput!) {
      productUpdate(product: $product) { userErrors { field message } }
    }`,
    { product: { id, descriptionHtml } }
  );
  throwOnUserErrors(data.productUpdate.userErrors);
}

async function updateQcNote(ownerId, value) {
  const data = await adminFetch(
    `mutation UpdateQcNote($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { field message } }
    }`,
    { metafields: [{ ownerId, namespace: "custom", key: "qc_note", type: "multi_line_text_field", value }] }
  );
  throwOnUserErrors(data.metafieldsSet.userErrors);
}

function throwOnUserErrors(errors = []) {
  if (!errors.length) return;
  const error = errors[0];
  throw new Error(`${Array.isArray(error.field) ? error.field.join(".") : error.field || "Shopify"}: ${error.message}`);
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
  return { execute: values.includes("--execute") };
}
