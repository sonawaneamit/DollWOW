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
const products = await fetchIrontechProducts();
const sourceDates = await fetchSourcePublishDates(products);
const ranks = buildReleaseRanks(sourceDates);
const results = products.map((product) => {
  const key = normalizeHandle(product.sourceHandle || product.handle);
  const sourceReleaseRank = ranks.get(key);
  const currentRank = toInteger(product.sourceReleaseRank);
  return {
    product,
    sourceReleaseRank,
    status: sourceReleaseRank === undefined ? "unmatched" : currentRank === sourceReleaseRank ? "unchanged" : "update"
  };
});

const updates = results.filter((result) => result.status === "update");
const unmatched = results.filter((result) => result.status === "unmatched");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(ROOT, "data", "exports");
await fs.mkdir(outDir, { recursive: true });
const reportPath = path.join(outDir, `irontech-release-order-${timestamp}.json`);

await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      mode: execute ? "execute" : "dry-run",
      liveIrontechProductCount: products.length,
      sourceDatesFound: sourceDates.size,
      exactMatches: results.length - unmatched.length,
      updatesNeeded: updates.length,
      unmatched: unmatched.map(({ product }) => ({ handle: product.handle, title: product.title, sourceHandle: product.sourceHandle || null })),
      updates: updates.map(({ product, sourceReleaseRank }) => ({
        handle: product.handle,
        title: product.title,
        sourceHandle: product.sourceHandle || null,
        sourceReleaseRank
      }))
    },
    null,
    2
  )
);

console.log(`Live Irontech products: ${products.length}`);
console.log(`Source publish dates found: ${sourceDates.size}`);
console.log(`Exact release-order matches: ${results.length - unmatched.length}`);
console.log(`Updates needed: ${updates.length}`);
console.log(`Unmatched products left unchanged: ${unmatched.length}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

if (!execute) {
  for (const result of updates.slice(0, 12)) {
    console.log(`- ${result.product.handle} -> oldest-first rank ${result.sourceReleaseRank}`);
  }
  process.exit(0);
}

let updated = 0;
for (const result of updates) {
  await setReleaseRank(result.product.id, result.sourceReleaseRank);
  updated += 1;
  if (updated % 25 === 0 || updated === updates.length) console.log(`Updated ${updated}/${updates.length}`);
}

console.log(JSON.stringify({ mode: "execute", updated, report: path.relative(ROOT, reportPath) }, null, 2));

function buildReleaseRanks(sourceDates) {
  const entries = [...sourceDates.entries()].sort(([leftHandle, leftDate], [rightHandle, rightDate]) => {
    const dateComparison = leftDate.localeCompare(rightDate);
    return dateComparison || leftHandle.localeCompare(rightHandle);
  });
  const ranks = new Map();
  entries.forEach(([handle], index) => {
    ranks.set(handle, index + 1);
  });
  return ranks;
}

async function fetchSourcePublishDates(products) {
  const candidates = products
    .map((product) => normalizeHandle(product.sourceHandle))
    .filter(Boolean);
  const uniqueHandles = [...new Set(candidates)];
  const dates = new Map();
  const concurrency = 8;

  for (let index = 0; index < uniqueHandles.length; index += concurrency) {
    const chunk = uniqueHandles.slice(index, index + concurrency);
    const settled = await Promise.all(
      chunk.map(async (handle) => {
        const url = new URL("https://www.rosemarydoll.com/wp-json/wp/v2/product");
        url.searchParams.set("slug", handle);
        try {
          const response = await fetch(url, { headers: { "User-Agent": "DollWow catalog ordering/1.0" } });
          if (!response.ok) return null;
          const payload = await response.json();
          const date = payload?.[0]?.date_gmt || payload?.[0]?.date;
          return typeof date === "string" && /^\d{4}-\d{2}-\d{2}T/.test(date) ? { handle, date } : null;
        } catch {
          return null;
        }
      })
    );

    for (const entry of settled) {
      if (entry) dates.set(entry.handle, entry.date);
    }
    console.log(`Checked source dates ${Math.min(index + chunk.length, uniqueHandles.length)}/${uniqueHandles.length}`);
  }

  return dates;
}

async function fetchIrontechProducts() {
  const products = [];
  let after = null;

  while (true) {
    const data = await adminFetch(
      `query IrontechProducts($after: String) {
        products(first: 100, after: $after, query: "tag:irontech", sortKey: TITLE) {
          edges {
            node {
              id
              handle
              title
              sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
              sourceReleaseRank: metafield(namespace: "custom", key: "source_release_rank") { value }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after }
    );

    products.push(
      ...data.products.edges.map(({ node }) => ({
        id: node.id,
        handle: node.handle || "",
        title: node.title || "",
        sourceHandle: node.sourceHandle?.value || "",
        sourceReleaseRank: node.sourceReleaseRank?.value || ""
      }))
    );

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function setReleaseRank(productId, rank) {
  const data = await adminFetch(
    `mutation SetSourceReleaseRank($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key value }
        userErrors { field message }
      }
    }`,
    {
      metafields: [
        {
          ownerId: productId,
          namespace: "custom",
          key: "source_release_rank",
          type: "number_integer",
          value: String(rank)
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

function normalizeHandle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\/product\//, "")
    .replace(/\/$/, "");
}

function toInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const token = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
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
    throw new Error("SHOPIFY_STORE_DOMAIN plus Shopify Admin credentials are required.");
  }
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
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
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Failed to mint Shopify Admin access token.");
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000 };
  return tokenCache.accessToken;
}

async function loadLocalEnv() {
  try {
    const content = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Environment variables can be supplied by Vercel or CI.
  }
}

function parseArgs(values) {
  return Object.fromEntries(values.filter((value) => value.startsWith("--")).map((value) => [value.slice(2), true]));
}

function printHelp() {
  console.log(`Usage:\n  npm run backfill:irontech-release-order\n  npm run backfill:irontech-release-order -- --execute\n\nReads original product publish dates from exact source handles, writes custom.source_release_rank, and leaves source-date failures unchanged.`);
}
