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
const outDir = path.join(ROOT, "data", "exports");
await fs.mkdir(outDir, { recursive: true });

const products = await fetchShopifyProducts(limit || 2500);
const filtered = match
  ? products.filter((product) => [product.handle, product.title, product.vendor, product.sourceTitle, product.sourceHandle].filter(Boolean).join(" ").toLowerCase().includes(match))
  : products;

const results = filtered.map((product) => {
  const inferred = inferBodyType(product);
  const current = normalizeBodyType(product.bodyType);
  const currentTags = new Set(product.tags || []);
  const desiredTags = new Set(
    [
      ...[...currentTags].filter((tag) => tag !== "male-doll" && tag !== "female-doll"),
      inferred !== "unknown" ? `${inferred}-doll` : null
    ].filter(Boolean)
  );
  const tagChanged = [...desiredTags].sort().join("|") !== [...currentTags].sort().join("|");
  const metafieldChanged = current !== inferred;

  return {
    product,
    currentBodyType: current,
    inferredBodyType: inferred,
    currentTags: [...currentTags],
    proposedTags: [...desiredTags],
    status: metafieldChanged || tagChanged ? "update" : "unchanged"
  };
});

const actionable = results.filter((result) => result.status === "update");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(outDir, `shopify-body-type-backfill-${timestamp}.json`);
await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      match: match || null,
      totalProducts: products.length,
      scannedProducts: filtered.length,
      actionableProducts: actionable.length,
      summary: summarize(actionable),
      results: actionable.map((result) => ({
        id: result.product.id,
        handle: result.product.handle,
        title: result.product.title,
        currentBodyType: result.currentBodyType,
        inferredBodyType: result.inferredBodyType,
        currentTags: result.currentTags,
        proposedTags: result.proposedTags,
        sourceTitle: result.product.sourceTitle
      }))
    },
    null,
    2
  )
);

console.log(`Scanned ${filtered.length} live Shopify products.`);
console.log(`Found ${actionable.length} body-type updates.`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  for (const result of actionable.slice(0, 25)) {
    console.log(`- ${result.product.handle}: ${result.currentBodyType} -> ${result.inferredBodyType}`);
  }
  process.exit(0);
}

let updated = 0;
for (const result of actionable) {
  await updateBodyTypeAndTags(result.product.id, result.inferredBodyType, result.proposedTags);
  updated += 1;
  if (updated % 25 === 0 || updated === actionable.length) {
    console.log(`Updated ${updated}/${actionable.length}`);
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
            node {
              id
              handle
              title
              vendor
              productType
              tags
              bodyType: metafield(namespace: "custom", key: "body_type") { value }
              sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
              sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
              cupSize: metafield(namespace: "custom", key: "cup_size") { value }
              measurements: metafield(namespace: "custom", key: "measurements") { value }
              images(first: 10) {
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
      ...data.products.edges.map(({ node }) => ({
        id: node.id,
        handle: node.handle || "",
        title: node.title || "",
        vendor: node.vendor || "",
        productType: node.productType || "",
        tags: node.tags || [],
        bodyType: node.bodyType?.value || "",
        sourceTitle: node.sourceTitle?.value || "",
        sourceHandle: node.sourceHandle?.value || "",
        cupSize: node.cupSize?.value || "",
        imageTexts: (node.images?.edges || [])
          .flatMap(({ node: image }) => [image?.url, image?.altText])
          .filter(Boolean),
        measurements: parseJson(node.measurements?.value) || {}
      }))
    );

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

function inferBodyType(product) {
  const text = [
    product.title,
    product.sourceTitle,
    product.sourceHandle,
    product.handle,
    product.productType,
    ...(product.tags || []),
    ...(product.imageTexts || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\bmale masturbator\b/.test(text)) {
    if (/\b(vagina depth|bust|bra size|big boobs?)\b/.test(text)) return "female";
    return "unknown";
  }

  const measurementText = Object.keys(product.measurements || {}).join(" ").toLowerCase();
  const combinedText = `${text} ${measurementText}`;

  if (/\b(male|man|men|boy|boys|gentleman|gentlemen|masculine)\b/.test(text)) return "male";
  if (/\b(male[-\s]+(?:silicone|tpe|sex|companion|love|realistic|body|torso)|(?:silicone|tpe)[-\s]+male|with[-\s]+(?:big[-\s]+)?penis)\b/.test(text)) return "male";
  if (/\b(female|woman|women|girl|girls|feminine)\b/.test(text)) return "female";

  const cup = cleanText(product.cupSize).toLowerCase().replace(/\s+/g, "");
  if (cup && !["na", "n/a", "none"].includes(cup)) return "female";

  if (/\b(vagina depth|bust|bra size)\b/.test(combinedText)) return "female";
  if (/\b(penis|male torso|male body)\b/.test(combinedText)) return "male";

  return "unknown";
}

function normalizeBodyType(value) {
  return ["male", "female"].includes(String(value).toLowerCase()) ? String(value).toLowerCase() : "unknown";
}

async function updateBodyTypeAndTags(productId, bodyType, tags) {
  const data = await adminFetch(
    `mutation UpdateProductBodyType($product: ProductUpdateInput!, $metafields: [MetafieldsSetInput!]!) {
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
        id: productId,
        tags
      },
      metafields: [
        {
          ownerId: productId,
          namespace: "custom",
          key: "body_type",
          type: "single_line_text_field",
          value: bodyType
        }
      ]
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
  return results.reduce((summary, result) => {
    summary[result.inferredBodyType] = (summary[result.inferredBodyType] || 0) + 1;
    return summary;
  }, {});
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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
  npm run backfill:body-type
  npm run backfill:body-type -- --match 6ye
  npm run backfill:body-type -- --execute

Dry-runs by default. Infers male/female/unknown from source fields, writes Shopify custom.body_type,
and normalizes male-doll/female-doll tags when --execute is passed.`);
}
