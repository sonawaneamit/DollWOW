import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.resolve(ROOT, process.argv[2] || "docs/catalog/customization-coverage-audit-2026-08-13.md");
const API_VERSION = "2026-04";
let tokenCache;

await loadLocalEnv();
assertEnv();
const products = await fetchProducts();
const rows = summarize(products);
const totals = rows.reduce((sum, row) => add(sum, row), emptyRow("Total"));
const generatedAt = new Date().toISOString();

const markdown = `# Customization data-presence audit

Generated: ${generatedAt}

This is a read-only snapshot of active Shopify products. It measures only the presence of stored manufacturer/dealer option data before the storefront applies brand-specific compatibility rules. It is **not** a visual audit and must never be used to call a brand complete.

## Coverage by brand

| Brand | Products | With options | Choices | Priced | With photos | Photo coverage | Head choices | Head photos | Unpriced non-default choices |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${[...rows, totals].map(rowLine).join("\n")}

## Interpretation

- **Priced** means the stored choice has a numeric price delta, including a verified zero-dollar choice.
- **With photos** means only that a choice contains an image-swatch URL. It does not prove the image is current, accurate, compatible, successfully loaded, source-matched, customer-ready, or Visualizer-ready.
- **Unpriced non-default choices** are retained in the manufacturer record but must not interrupt checkout. They require a current manufacturer, Rosemary, or YourDoll price before becoming purchasable.
- A head image is not automatically Visualizer-ready. Identity-preserving head replacement remains gated until its dedicated workflow passes QA.

## Data-quality target — not a completion claim

- One included replacement head choice is single-select where the body supports compatible heads.
- Additional heads are a separately priced multi-select group and charge once for every selected head.
- Special/exclusive replacement heads retain their verified surcharge.
- Every public paid choice has a numeric source-backed delta.
- Appearance choices have accurate option photos before Visualizer exposure.
- Unsupported, incompatible, or unverified choices remain out of checkout without replacing the purchase CTA with a contact-team detour.

The actual completion gate is maintained in \`docs/catalog/brand-option-visual-reconciliation-2026-08-13.md\` and requires source counts, prices, images, compatibility, selection rules, rendered desktop/mobile behavior, both themes, and regression evidence for every relevant product family.
`;

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, markdown);
console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), generatedAt, activeProducts: products.length, brands: rows.length, totals }, null, 2));

function summarize(products) {
  const byBrand = new Map();
  for (const product of products) {
    const brand = product.brand?.value || product.vendor || "Needs brand review";
    const row = byBrand.get(brand) || emptyRow(brand);
    row.products += 1;
    const groups = parseGroups(product.groups?.value);
    if (groups.length) row.withOptions += 1;
    for (const group of groups) {
      const headGroup = /\bhead\b/i.test(group.label || "");
      for (const option of group.options || []) {
        row.choices += 1;
        if (Number.isFinite(option.priceDelta)) row.priced += 1;
        if (hasImage(option)) row.images += 1;
        if (headGroup) {
          row.headChoices += 1;
          if (hasImage(option)) row.headImages += 1;
        }
        if (!hasVerifiedPrice(option)) row.unpriced += 1;
      }
    }
    byBrand.set(brand, row);
  }
  return [...byBrand.values()].filter((row) => row.withOptions).sort((a, b) => b.products - a.products || a.brand.localeCompare(b.brand));
}

function emptyRow(brand) {
  return { brand, products: 0, withOptions: 0, choices: 0, priced: 0, images: 0, headChoices: 0, headImages: 0, unpriced: 0 };
}

function add(left, right) {
  for (const key of ["products", "withOptions", "choices", "priced", "images", "headChoices", "headImages", "unpriced"]) left[key] += right[key];
  return left;
}

function rowLine(row) {
  const coverage = row.choices ? `${Math.round(row.images / row.choices * 100)}%` : "0%";
  return `| ${escapeCell(row.brand)} | ${number(row.products)} | ${number(row.withOptions)} | ${number(row.choices)} | ${number(row.priced)} | ${number(row.images)} | ${coverage} | ${number(row.headChoices)} | ${number(row.headImages)} | ${number(row.unpriced)} |`;
}

function hasImage(option) {
  return option?.swatch?.kind === "image" && /^https?:\/\//i.test(option.swatch.value || "");
}

function hasVerifiedPrice(option) {
  if (option.priceVerified === false || option.purchasable === false) return false;
  if (Number.isFinite(option.priceDelta)) return true;
  if (/\bfree\b/i.test(option.label || "")) return true;
  if (/default supplier selection/i.test(option.productionNote || "")) return true;
  return /^(no add-on|no thanks|none|factory default|default supplier selection|as shown)$/i.test(option.label || "");
}

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await adminFetch(`query Coverage($after: String) {
      products(first: 250, after: $after, query: "status:active") {
        nodes {
          id vendor
          brand: metafield(namespace: "custom", key: "brand") { value }
          groups: metafield(namespace: "custom", key: "customization_groups") { value }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`, { after });
    products.push(...data.products.nodes);
    after = data.products.pageInfo.endCursor;
    if (!data.products.pageInfo.hasNextPage) break;
  } while (true);
  return products;
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
  if (tokenCache?.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
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
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index < 0) continue;
      process.env[line.slice(0, index).trim()] ||= line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}

function assertEnv() {
  for (const key of ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"]) if (!process.env[key]) throw new Error(`Missing ${key}`);
}

function parseGroups(value) { try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function escapeCell(value) { return String(value || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim(); }
function number(value) { return Number(value || 0).toLocaleString("en-US"); }
