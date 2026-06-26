import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const OPENAI_MODEL = process.env.OPENAI_NAMING_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
let tokenCache = null;

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

assertShopifyAdminEnv();
assertOpenAIEnv();

const execute = Boolean(args.execute);
const limit = Number(args.limit || 0);
const batchSize = Math.min(25, Math.max(1, Number(args.batchSize || 20)));
const match = String(args.match || "").toLowerCase();
const outDir = path.join(ROOT, "data", "exports");
await fs.mkdir(outDir, { recursive: true });

const products = await fetchShopifyProducts(limit || 2500);
const filtered = match
  ? products.filter((product) => [product.handle, product.title, product.vendor, product.displayName, product.sourceTitle].filter(Boolean).join(" ").toLowerCase().includes(match))
  : products;

const usedNamesByBrand = buildUsedNamesByBrand(filtered);
const candidates = filtered.filter(shouldGenerateHumanName);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(outDir, `shopify-human-display-names-${timestamp}.json`);

if (!candidates.length) {
  await fs.writeFile(reportPath, JSON.stringify({ mode: execute ? "execute" : "dry-run", scannedProducts: filtered.length, candidateProducts: 0, results: [] }, null, 2));
  console.log(`Scanned ${filtered.length} live Shopify products.`);
  console.log("Found 0 products needing generated DollWow names.");
  console.log(`Report: ${path.relative(ROOT, reportPath)}`);
  process.exit(0);
}

const generatedByBrand = new Map();
const results = [];

for (let index = 0; index < candidates.length; index += batchSize) {
  const batch = candidates.slice(index, index + batchSize);
  const batchResult = await requestBatchNames(batch, usedNamesByBrand, generatedByBrand);
  for (const item of batchResult) {
    const product = batch.find((entry) => entry.handle === item.handle);
    if (!product) continue;

    const existingNames = new Set([...(usedNamesByBrand.get(product.brand) || []), ...(generatedByBrand.get(product.brand) || [])]);
    const chosen = chooseBestCandidate(item.candidates, existingNames, product);
    if (!chosen) {
      results.push({
        handle: product.handle,
        productId: product.id,
        brand: product.brand,
        currentDisplayName: product.displayName,
        sourceTitle: product.sourceTitle || product.title,
        generatedCandidates: item.candidates,
        proposedDisplayName: "",
        status: "failed_no_unique_candidate"
      });
      continue;
    }

    if (!generatedByBrand.has(product.brand)) generatedByBrand.set(product.brand, new Set());
    generatedByBrand.get(product.brand).add(chosen);

    results.push({
      handle: product.handle,
      productId: product.id,
      brand: product.brand,
      currentDisplayName: product.displayName,
      sourceTitle: product.sourceTitle || product.title,
      generatedCandidates: item.candidates,
      proposedDisplayName: chosen,
      status: cleanText(product.displayName) === cleanText(chosen) ? "unchanged" : "set"
    });
  }
}

const actionable = results.filter((result) => result.status === "set");

await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      model: OPENAI_MODEL,
      scannedProducts: filtered.length,
      candidateProducts: candidates.length,
      actionableProducts: actionable.length,
      failedProducts: results.filter((result) => result.status.startsWith("failed")).length,
      results
    },
    null,
    2
  )
);

console.log(`Scanned ${filtered.length} live Shopify products.`);
console.log(`Found ${candidates.length} products needing generated DollWow names.`);
console.log(`Actionable generated names: ${actionable.length}.`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  for (const result of actionable.slice(0, 25)) {
    console.log(`- ${result.handle}: ${result.currentDisplayName || "(empty)"} -> ${result.proposedDisplayName}`);
  }
  process.exit(0);
}

let updated = 0;
for (const result of actionable) {
  await updateDisplayName(result.productId, result.proposedDisplayName);
  updated += 1;
  if (updated % 25 === 0 || updated === actionable.length) {
    console.log(`Updated ${updated}/${actionable.length}`);
  }
}

console.log(JSON.stringify({ mode: "execute", updated, report: path.relative(ROOT, reportPath) }, null, 2));

async function requestBatchNames(batch, usedNamesByBrand, generatedByBrand) {
  const items = batch.map((product) => ({
    handle: product.handle,
    brand: product.brand,
    source_title: product.sourceTitle || product.title,
    source_handle: product.sourceHandle || product.handle,
    height_cm: product.heightCm || null,
    cup_size: product.cupSize || null,
    material: product.material || null,
    head_model: product.headModel || null,
    style_gender: inferStyleGender(product),
    forbidden_names: Array.from(new Set([...(usedNamesByBrand.get(product.brand) || []), ...(generatedByBrand.get(product.brand) || [])])).slice(0, 150)
  }));

  const payload = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You create customer-facing DollWow display names for product records. Return exactly three candidate names per handle. Rules: names must be human-like, easy to say, Title Case, one or two words, no brand names, no measurements, no material words, no model numbers, no head numbers, no punctuation except a natural apostrophe or hyphen, no explicit sexual terms, no copyrighted or celebrity names, and no reuse of forbidden names. Make the names feel premium but common enough for support chats and phone calls. Keep them distinct from the visible source title wording rather than copying the source name verbatim."
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Generate three DollWow-style candidate names for each product handle.",
          items
        })
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "dollwow_display_name_candidates",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  handle: { type: "string" },
                  candidates: {
                    type: "array",
                    minItems: 3,
                    maxItems: 3,
                    items: { type: "string" }
                  }
                },
                required: ["handle", "candidates"]
              }
            }
          },
          required: ["items"]
        }
      }
    }
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OpenAI name generation failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI name generation returned no content.");
  const parsed = JSON.parse(content);
  return parsed.items || [];
}

function chooseBestCandidate(candidates, existingNames, product) {
  const sourceTitle = cleanText(product.sourceTitle || product.title).toLowerCase();
  for (const raw of candidates || []) {
    const value = normalizeGeneratedName(raw);
    if (!value) continue;
    if (isReferenceLikeName(value)) continue;
    if (existingNames.has(value)) continue;
    if (sourceTitle.includes(value.toLowerCase())) continue;
    return value;
  }
  return "";
}

function normalizeGeneratedName(value) {
  const cleaned = cleanText(value)
    .replace(/[._]+/g, " ")
    .replace(/[^A-Za-z'\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const words = cleaned.split(" ").filter(Boolean);
  if (!words.length || words.length > 2) return "";
  return titleCase(cleaned);
}

function inferStyleGender(product) {
  if (product.bodyType === "male") return "masculine";
  if (product.bodyType === "female") return "feminine";
  const text = [product.title, product.sourceTitle, product.productType, product.handle, ...(product.tags || [])].filter(Boolean).join(" ").toLowerCase();
  if (/\bmale masturbator\b/.test(text)) return "feminine";
  if (/\b(male|man|men|boy|boys|guy|guys|gentleman|gentlemen)\b/.test(text)) return "masculine";
  return "feminine";
}

function shouldGenerateHumanName(product) {
  if (inferProductKind(product.productType, product.tags) === "accessory") return false;
  const text = [product.title, product.sourceTitle, product.handle, product.sourceHandle, product.productType, ...(product.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\btorso\b/.test(text)) return false;
  if (/\bmale masturbator\b/.test(text)) return false;
  if (/\bheads?\b/.test(text) && !/\b\d{2,3}\s*cm\b/.test(text)) return false;

  const current = cleanText(product.displayName);
  if (!current) return true;
  return isReferenceLikeName(current);
}

function buildUsedNamesByBrand(products) {
  const byBrand = new Map();
  for (const product of products) {
    const name = cleanText(product.displayName);
    if (!name || isReferenceLikeName(name)) continue;
    if (!byBrand.has(product.brand)) byBrand.set(product.brand, new Set());
    byBrand.get(product.brand).add(name);
  }
  return byBrand;
}

async function fetchShopifyProducts(limit) {
  const products = [];
  let after = null;

  while (products.length < limit) {
    const first = Math.min(100, limit - products.length);
    const data = await adminFetch(
      `query Products($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          edges {
            node {
              id
              handle
              title
              vendor
              productType
              tags
              brand: metafield(namespace: "custom", key: "brand") { value }
              material: metafield(namespace: "custom", key: "material") { value }
              heightCm: metafield(namespace: "custom", key: "height_cm") { value }
              cupSize: metafield(namespace: "custom", key: "cup_size") { value }
              displayName: metafield(namespace: "custom", key: "display_name") { value }
              bodyType: metafield(namespace: "custom", key: "body_type") { value }
              sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
              sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
              headModel: metafield(namespace: "custom", key: "head_model") { value }
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
        title: node.title || "",
        vendor: node.vendor || "",
        productType: node.productType || "",
        tags: node.tags || [],
        brand: node.brand?.value || node.vendor || "",
        material: node.material?.value || "",
        heightCm: numberValue(node.heightCm?.value),
        cupSize: node.cupSize?.value || "",
        displayName: node.displayName?.value || "",
        bodyType: node.bodyType?.value || "",
        sourceTitle: node.sourceTitle?.value || "",
        sourceHandle: node.sourceHandle?.value || "",
        headModel: node.headModel?.value || ""
      }))
    );

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function updateDisplayName(productId, value) {
  const data = await adminFetch(
    `mutation SetDisplayName($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key value }
        userErrors { field message }
      }
    }`,
    {
      metafields: [
        {
          ownerId: productId,
          namespace: "custom",
          key: "display_name",
          type: "single_line_text_field",
          value
        }
      ]
    }
  );

  const error = data.metafieldsSet.userErrors[0];
  if (error) {
    const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
    throw new Error(field ? `${field}: ${error.message}` : error.message);
  }
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

function isReferenceLikeName(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return false;
  if (/^Head\s+[A-Z]?\d+[A-Z]?$/i.test(cleaned)) return true;
  if (/^(SLE|EVO|AI|ROS|ZEN|GYNOID)\s*\d+(?:\.\d+)?$/i.test(cleaned)) return true;
  return false;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function titleCase(value) {
  return String(value || "").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/i);
      if (!match) continue;
      const [, key, ...rest] = match;
      let value = rest.join("=");
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

function assertShopifyAdminEnv() {
  const hasToken = Boolean(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET));
  const missing = [];
  if (!process.env.SHOPIFY_STORE_DOMAIN) missing.push("SHOPIFY_STORE_DOMAIN");
  if (!hasToken) missing.push("SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET");
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

function assertOpenAIEnv() {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing environment variable: OPENAI_API_KEY");
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

  if (!response.ok) throw new Error(`Shopify Admin API error ${response.status}: ${await response.text()}`);
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors.map((error) => error.message).join("; "));
  return json.data;
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

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/generate-shopify-human-display-names.mjs
  node scripts/generate-shopify-human-display-names.mjs --match 6ye --limit 200
  node scripts/generate-shopify-human-display-names.mjs --execute

Dry-runs by default. Generates customer-facing DollWow human names for products whose display names are still generic references like Head 218 or blank.`);
}
