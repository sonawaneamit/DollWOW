import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const OPENAI_MODEL = process.env.OPENAI_LOOK_TAG_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
const LOOK_VALUES = new Set([
  "hair-blonde",
  "hair-brunette",
  "hair-black",
  "hair-red",
  "skin-fair",
  "skin-tan",
  "skin-brown",
  "skin-black",
  "look-asian",
  "look-latina",
  "look-anime",
  "shape-slim",
  "shape-curvy",
  "shape-fuller",
  "shape-petite"
]);

let tokenCache = null;

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

assertShopifyAdminEnv();

const execute = Boolean(args.execute);
const force = Boolean(args.force);
const noAi = Boolean(args.noAi);
if (!noAi) assertOpenAIEnv();
const limit = Number(args.limit || 0);
const concurrency = Math.max(1, Math.min(Number(args.concurrency || 4), 8));
const match = String(args.match || "").toLowerCase();
const outDir = path.join(ROOT, "data", "exports");
await fs.mkdir(outDir, { recursive: true });

const products = await fetchShopifyProducts(limit || 2500);
const filtered = products.filter((product) => {
  if (!isCustomerVisibleProduct(product)) return false;
  if (match && ![product.handle, product.title, product.vendor, product.sourceTitle, product.sourceHandle].filter(Boolean).join(" ").toLowerCase().includes(match)) {
    return false;
  }
  if (!force && product.lookTags?.length) return false;
  return true;
});

console.log(`Scanned ${products.length} live Shopify products.`);
console.log(`Queued ${filtered.length} products for ${noAi ? "metadata" : "AI vision"} look-tag enrichment.`);

const results = [];
let processed = 0;

for (let index = 0; index < filtered.length; index += concurrency) {
  const batch = filtered.slice(index, index + concurrency);
  const settled = await Promise.all(batch.map((product) => enrichProduct(product, { noAi }).catch((error) => ({
    product,
    status: "failed",
    error: error instanceof Error ? error.message : String(error),
    tags: heuristicLookTags(product),
    attributes: null
  }))));

  results.push(...settled);
  processed += settled.length;
  console.log(`Enriched ${processed}/${filtered.length}`);
}

function isCustomerVisibleProduct(product) {
  return !(product.tags || []).some((tag) => /^dollwow-system$/i.test(tag) || /^custom-option-charge$/i.test(tag));
}

const actionable = results.filter((result) => result.status !== "unchanged" && result.tags.length);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(outDir, `shopify-look-tags-${timestamp}.json`);

await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      model: noAi ? "metadata-only" : OPENAI_MODEL,
      scannedProducts: products.length,
      queuedProducts: filtered.length,
      actionableProducts: actionable.length,
      summary: summarize(results),
      results: results.map((result) => ({
        handle: result.product.handle,
        productId: result.product.id,
        title: result.product.title,
        currentLookTags: result.product.lookTags || [],
        proposedLookTags: result.tags,
        status: result.status,
        source: result.source,
        attributes: result.attributes,
        error: result.error || undefined,
        imageUrl: result.product.imageUrl || undefined
      }))
    },
    null,
    2
  )
);

console.log(`Actionable look-tag updates: ${actionable.length}.`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  for (const result of actionable.slice(0, 30)) {
    console.log(`- ${result.product.handle}: ${(result.product.lookTags || []).join(",") || "(none)"} -> ${result.tags.join(",")}`);
  }
  process.exit(0);
}

let updated = 0;
for (const result of actionable) {
  await updateLookTags(result.product, result.tags, result.attributes);
  updated += 1;
  if (updated % 25 === 0 || updated === actionable.length) {
    console.log(`Updated ${updated}/${actionable.length}`);
  }
}

console.log(JSON.stringify({ mode: "execute", updated, report: path.relative(ROOT, reportPath) }, null, 2));

async function enrichProduct(product, { noAi: metadataOnly = false } = {}) {
  const heuristicTags = heuristicLookTags(product);
  if (metadataOnly || !product.imageUrl) {
    return buildResult(product, heuristicTags, "metadata", null);
  }

  const ai = await classifyImage(product);
  const visualTags = mapVisualAttributesToTags(ai);
  const tags = mergeTags(heuristicTags, visualTags);
  return buildResult(product, tags, visualTags.length ? "openai_vision" : "metadata", ai);
}

function buildResult(product, tags, source, attributes) {
  const current = normalizeTags(product.lookTags || []);
  const proposed = normalizeTags(tags);
  const status = current.join("|") === proposed.join("|") ? "unchanged" : "update";
  return { product, status, source, tags: proposed, attributes, error: null };
}

async function classifyImage(product) {
  const payload = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You classify adult doll catalog product images for ecommerce filtering. The subject is a manufactured doll/product, not a real person. Return cautious retail look attributes only. Do not identify people, age, or real-world protected identity. If a visual attribute is unclear, use unclear or omit it."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              task: "Classify this doll product photo into simple storefront filters.",
              product_title: product.title,
              brand: product.vendor,
              source_title: product.sourceTitle || "",
              known_material: product.material || "",
              known_height_cm: product.heightCm || null,
              known_cup_size: product.cupSize || "",
              allowed_hair_colors: ["blonde", "brunette", "black", "red", "silver_gray", "colorful", "unclear"],
              allowed_skin_tones: ["fair", "tan", "brown", "black", "unclear"],
              allowed_style_tags: ["asian", "latina", "anime", "cosplay"],
              allowed_shape_tags: ["slim", "curvy", "fuller", "petite"],
              confidence_rule: "Use high only when obvious. Use medium when likely. Use low/unclear when not visually supported."
            })
          },
          {
            type: "image_url",
            image_url: { url: product.imageUrl, detail: "low" }
          }
        ]
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "dollwow_look_attributes",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            hair_color: { type: "string", enum: ["blonde", "brunette", "black", "red", "silver_gray", "colorful", "unclear"] },
            hair_confidence: { type: "string", enum: ["low", "medium", "high"] },
            skin_tone: { type: "string", enum: ["fair", "tan", "brown", "black", "unclear"] },
            skin_confidence: { type: "string", enum: ["low", "medium", "high"] },
            style_tags: {
              type: "array",
              items: { type: "string", enum: ["asian", "latina", "anime", "cosplay"] }
            },
            style_confidence: { type: "string", enum: ["low", "medium", "high"] },
            shape_tags: {
              type: "array",
              items: { type: "string", enum: ["slim", "curvy", "fuller", "petite"] }
            },
            shape_confidence: { type: "string", enum: ["low", "medium", "high"] },
            notes: { type: "string" }
          },
          required: ["hair_color", "hair_confidence", "skin_tone", "skin_confidence", "style_tags", "style_confidence", "shape_tags", "shape_confidence", "notes"]
        }
      }
    },
    max_tokens: 500
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
    throw new Error(`OpenAI look tagging failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI look tagging returned no content.");
  return JSON.parse(content);
}

function mapVisualAttributesToTags(attributes) {
  const tags = [];
  if (["medium", "high"].includes(attributes.hair_confidence)) {
    if (attributes.hair_color === "blonde") tags.push("hair-blonde");
    if (attributes.hair_color === "brunette") tags.push("hair-brunette");
    if (attributes.hair_color === "black") tags.push("hair-black");
    if (attributes.hair_color === "red") tags.push("hair-red");
  }
  if (["medium", "high"].includes(attributes.skin_confidence)) {
    if (attributes.skin_tone === "fair") tags.push("skin-fair");
    if (attributes.skin_tone === "tan") tags.push("skin-tan");
    if (attributes.skin_tone === "brown") tags.push("skin-brown");
    if (attributes.skin_tone === "black") tags.push("skin-black");
  }
  if (["medium", "high"].includes(attributes.style_confidence)) {
    for (const tag of attributes.style_tags || []) {
      if (tag === "asian") tags.push("look-asian");
      if (tag === "latina") tags.push("look-latina");
      if (["anime", "cosplay"].includes(tag)) tags.push("look-anime");
    }
  }
  if (["medium", "high"].includes(attributes.shape_confidence)) {
    for (const tag of attributes.shape_tags || []) {
      if (tag === "slim") tags.push("shape-slim");
      if (tag === "curvy") tags.push("shape-curvy");
      if (tag === "fuller") tags.push("shape-fuller");
      if (tag === "petite") tags.push("shape-petite");
    }
  }
  return normalizeTags(tags);
}

function heuristicLookTags(product) {
  const text = [
    product.title,
    product.sourceTitle,
    product.sourceHandle,
    product.handle,
    product.productType,
    product.material,
    product.cupSize,
    ...(product.tags || []),
    ...(product.imageTexts || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tags = [];
  addIf(tags, "hair-blonde", /\b(blonde|blond|platinum)\b/.test(text));
  addIf(tags, "hair-brunette", /\b(brunette|brown hair|dark brown)\b/.test(text));
  addIf(tags, "hair-black", /\bblack hair\b/.test(text));
  addIf(tags, "hair-red", /\b(redhead|red hair|auburn|ginger)\b/.test(text));
  addIf(tags, "skin-fair", /\b(white skin|fair skin|light skin|pale skin)\b/.test(text));
  addIf(tags, "skin-tan", /\b(tan skin|tanned skin|light tan)\b/.test(text));
  addIf(tags, "skin-brown", /\b(brown skin|dark tan)\b/.test(text));
  addIf(tags, "skin-black", /\b(black skin|deep skin|dark skin|ebony)\b/.test(text));
  addIf(tags, "look-asian", /\b(asian|japanese|korean|chinese|thai|filipina|vietnamese)\b/.test(text));
  addIf(tags, "look-latina", /\b(latina|latin|hispanic)\b/.test(text));
  addIf(tags, "look-anime", /\b(anime|cosplay|elf|fantasy)\b/.test(text));
  addIf(tags, "shape-slim", /\b(slim|skinny|slender)\b/.test(text));
  addIf(tags, "shape-fuller", /\b(bbw|chubby|plus size)\b/.test(text));

  const cup = product.cupSize?.toUpperCase().match(/[A-Z]/)?.[0];
  const cupRank = cup ? cup.charCodeAt(0) - 64 : 0;
  if (product.heightCm && product.heightCm <= 154) tags.push("shape-petite");
  if (product.heightCm && product.heightCm <= 158 && product.weightLb && product.weightLb <= 75) tags.push("shape-slim");
  if (cupRank >= 7) tags.push("shape-curvy");
  if (cupRank >= 10 || (product.weightLb && product.weightLb >= 110)) tags.push("shape-fuller");

  return normalizeTags(tags);
}

function addIf(tags, tag, condition) {
  if (condition) tags.push(tag);
}

function mergeTags(...groups) {
  return normalizeTags(groups.flat());
}

function normalizeTags(tags) {
  return Array.from(
    new Set(
      (tags || [])
        .map((tag) =>
          String(tag || "")
            .toLowerCase()
            .replace(/^tag:/, "")
            .replace(/_/g, "-")
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/^-|-$/g, "")
        )
        .filter((tag) => LOOK_VALUES.has(tag))
    )
  ).sort();
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
              lookTags: metafield(namespace: "custom", key: "look_tags") { value }
              sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
              sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
              material: metafield(namespace: "custom", key: "material") { value }
              heightCm: metafield(namespace: "custom", key: "height_cm") { value }
              weightLb: metafield(namespace: "custom", key: "weight_lb") { value }
              cupSize: metafield(namespace: "custom", key: "cup_size") { value }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after }
    );

    products.push(
      ...data.products.edges.map(({ node }) => {
        const images = (node.images?.edges || []).map(({ node: image }) => image).filter(Boolean);
        return {
          id: node.id,
          handle: node.handle || "",
          title: node.title || "",
          vendor: node.vendor || "",
          productType: node.productType || "",
          tags: node.tags || [],
          lookTags: parseJson(node.lookTags?.value) || [],
          sourceTitle: node.sourceTitle?.value || "",
          sourceHandle: node.sourceHandle?.value || "",
          material: node.material?.value || "",
          heightCm: numberValue(node.heightCm?.value),
          weightLb: numberValue(node.weightLb?.value),
          cupSize: node.cupSize?.value || "",
          imageUrl: images[0]?.url || "",
          imageTexts: images.flatMap((image) => [image.url, image.altText]).filter(Boolean)
        };
      })
    );

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function updateLookTags(product, lookTags, attributes) {
  const currentTags = new Set(product.tags || []);
  for (const tag of currentTags) {
    if (LOOK_VALUES.has(tag)) currentTags.delete(tag);
  }
  for (const tag of lookTags) currentTags.add(tag);

  const metafields = [
    {
      ownerId: product.id,
      namespace: "custom",
      key: "look_tags",
      type: "json",
      value: JSON.stringify(lookTags)
    }
  ];
  if (attributes) {
    metafields.push({
      ownerId: product.id,
      namespace: "custom",
      key: "look_attributes",
      type: "json",
      value: JSON.stringify(attributes)
    });
  }

  const data = await adminFetch(
    `mutation UpdateProductLookTags($product: ProductUpdateInput!, $metafields: [MetafieldsSetInput!]!) {
      productUpdate(product: $product) {
        product { id tags }
        userErrors { field message }
      }
      metafieldsSet(metafields: $metafields) {
        metafields { key value }
        userErrors { field message }
      }
    }`,
    {
      product: {
        id: product.id,
        tags: [...currentTags].sort()
      },
      metafields
    }
  );

  const updateError = data.productUpdate.userErrors[0];
  if (updateError) {
    const field = Array.isArray(updateError.field) ? updateError.field.join(".") : updateError.field;
    throw new Error(field ? `${field}: ${updateError.message}` : updateError.message);
  }

  const metafieldError = data.metafieldsSet.userErrors[0];
  if (metafieldError) {
    const field = Array.isArray(metafieldError.field) ? metafieldError.field.join(".") : metafieldError.field;
    throw new Error(field ? `${field}: ${metafieldError.message}` : metafieldError.message);
  }
}

function summarize(results) {
  return results.reduce(
    (summary, result) => {
      summary[result.status] = (summary[result.status] || 0) + 1;
      for (const tag of result.tags || []) summary[tag] = (summary[tag] || 0) + 1;
      return summary;
    },
    {}
  );
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const token = await getAdminAccessToken(domain);

  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
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
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required.");
  }
}

function assertOpenAIEnv() {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing environment variable: OPENAI_API_KEY");
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
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
    // CI/Vercel envs are fine.
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (["help", "execute", "force", "noAi"].includes(key)) {
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
  npm run enrich:look-tags
  npm run enrich:look-tags -- --limit 50
  npm run enrich:look-tags -- --execute --concurrency 4
  npm run enrich:look-tags -- --execute --force

Dry-runs by default. Uses OpenAI vision plus metadata heuristics to write custom.look_tags
and Shopify tags such as hair-blonde, skin-black, look-asian, shape-curvy.`);
}
