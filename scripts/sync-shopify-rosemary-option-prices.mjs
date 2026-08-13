import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareOptionCoverage } from "./lib/option-coverage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const args = parseArgs(process.argv.slice(2));
const execute = Boolean(args.execute);
const reconcileOptions = Boolean(args["reconcile-options"]);
const limit = Math.max(0, Number(args.limit || 0));
const concurrency = Math.min(10, Math.max(1, Number(args.concurrency || 5)));
const sourceTimeoutMs = Math.max(2_000, Number(args["source-timeout-ms"] || 12_000));
const sourceAttempts = Math.min(4, Math.max(1, Number(args["source-attempts"] || 2)));
const match = String(args.match || "").trim().toLowerCase();
const brand = String(args.brand || "").trim().toLowerCase();
const titlePrefix = String(args["title-prefix"] || "").trim().toLowerCase();
const excludeTitlePrefix = String(args["exclude-title-prefix"] || "").trim().toLowerCase();
const catalogBrand = String(args["catalog-brand"] || "").trim().toLowerCase();
let tokenCache = null;

await loadLocalEnv();
assertShopifyAdminEnv();

if (args["apply-report"]) {
  const reportPath = path.resolve(ROOT, String(args["apply-report"]));
  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const changes = (report.products || []).filter((result) => result.status === "changed" && result.productId && Array.isArray(result.groups));
  if (!execute) {
    console.log(JSON.stringify({ mode: "dry-run", reportPath: path.relative(ROOT, reportPath), wouldUpdate: changes.length }, null, 2));
    process.exit(0);
  }
  let updated = 0;
  for (let index = 0; index < changes.length; index += 25) {
    const batch = changes.slice(index, index + 25);
    await setCustomizationGroupsBatch(batch);
    updated += batch.length;
    if (updated % 100 === 0 || updated === changes.length) console.log(`Updated ${updated}/${changes.length}`);
  }
  console.log(JSON.stringify({ mode: "execute", reportPath: path.relative(ROOT, reportPath), updated }, null, 2));
  process.exit(0);
}

const products = await fetchProducts(limit || 5000, args.handle ? String(args.handle) : "");
if (args["list-vendors"] || args["list-brands"]) {
  const counts = new Map();
  for (const product of products) {
    if (!isRosemaryUrl(product.sourceUrl?.value || "")) continue;
    const value = args["list-brands"] ? product.catalogBrand?.value || "(blank)" : product.vendor || "(blank)";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  console.log(JSON.stringify([...counts].sort((left, right) => right[1] - left[1]).map(([value, count]) => ({ value, count })), null, 2));
  process.exit(0);
}
const candidates = products.filter((product) => {
  const sourceUrl = product.sourceUrl?.value || "";
  const groups = parseGroups(product.customizationGroups?.value);
  const searchable = `${product.title} ${product.handle} ${product.vendor}`.toLowerCase();
  const normalizedVendor = normalize(product.vendor || "");
  const normalizedBrand = normalize(product.catalogBrand?.value || "");
  return isRosemaryUrl(sourceUrl) &&
    (!match || searchable.includes(match)) &&
    (!brand || normalizedVendor === normalize(brand) || normalizedBrand === normalize(brand)) &&
    (!titlePrefix || product.title.toLowerCase().startsWith(titlePrefix)) &&
    (!excludeTitlePrefix || !product.title.toLowerCase().startsWith(excludeTitlePrefix)) &&
    (!catalogBrand || normalize(product.catalogBrand?.value || "") === normalize(catalogBrand));
});

console.log(`Checking ${candidates.length} Rosemary-sourced products with imported customization groups…`);
const results = await mapWithConcurrency(candidates, concurrency, refreshCandidate);
const changed = results.filter((result) => result.status === "changed");
const noPriceData = results.filter((result) => result.status === "no-price-data");
const unmatched = results.filter((result) => result.status === "unmatched");
const failed = results.filter((result) => result.status === "failed");
const coverageIncomplete = results.filter((result) => result.reconciledCoverage && !result.reconciledCoverage.complete);

const report = {
  generatedAt: new Date().toISOString(),
  mode: execute ? "execute" : "dry-run",
  checked: results.length,
  changed: changed.length,
  noPriceData: noPriceData.length,
  unmatched: unmatched.length,
  failed: failed.length,
  coverageIncomplete: coverageIncomplete.length,
  products: results
};

const reportDir = path.join(ROOT, "data", "exports");
await fs.mkdir(reportDir, { recursive: true });
const reportKey = catalogBrand || titlePrefix || brand || match;
const reportSuffix = reportKey ? `-${reportKey.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : "";
const reportPath = path.join(reportDir, `shopify-rosemary-option-price-sync${reportSuffix}.json`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (execute) {
  for (const result of changed) {
    await setCustomizationGroups(result.productId, result.groups);
  }
}

console.log(JSON.stringify({
  mode: execute ? "execute" : "dry-run",
  checked: results.length,
  updated: execute ? changed.length : 0,
  wouldUpdate: changed.length,
  noPriceData: noPriceData.length,
  unmatched: unmatched.length,
  failed: failed.length,
  coverageIncomplete: coverageIncomplete.length,
  reportPath: path.relative(ROOT, reportPath)
}, null, 2));

async function refreshCandidate(product) {
  const sourceUrl = product.sourceUrl.value;
  const groups = parseGroups(product.customizationGroups.value);
  try {
    const html = await fetchText(sourceUrl);
    const sourceGroups = extractOptionGroups(html, sourceUrl);
    const priceMerge = mergePriceDeltas(groups, sourceGroups);
    const nextGroups = reconcileOptions
      ? mergeSourceCoverage(priceMerge.groups, sourceGroups)
      : priceMerge.groups;
    const { pricedMatches, unmatchedOptions } = priceMerge;
    const relevantSourceGroups = sourceGroups.filter(isStoredSourceGroup);
    const optionCoverage = compareOptionCoverage(groups, relevantSourceGroups);
    const reconciledCoverage = compareOptionCoverage(nextGroups, relevantSourceGroups);
    if (!pricedMatches) {
      return {
        status: sourceGroups.length ? "no-price-data" : "unmatched",
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        brand: product.catalogBrand?.value || product.vendor,
        sourceUrl,
        pricedMatches,
        unmatchedOptions,
        optionCoverage,
        reconciledCoverage,
        productId: product.id,
        groups
      };
    }
    return {
      status: JSON.stringify(groups) === JSON.stringify(nextGroups) ? "unchanged" : "changed",
      handle: product.handle,
      title: product.title,
      vendor: product.vendor,
      brand: product.catalogBrand?.value || product.vendor,
      sourceUrl,
      pricedMatches,
      unmatchedOptions,
      optionCoverage,
      reconciledCoverage,
      productId: product.id,
      groups: nextGroups
    };
  } catch (error) {
    return {
      status: "failed",
      handle: product.handle,
      title: product.title,
      vendor: product.vendor,
      brand: product.catalogBrand?.value || product.vendor,
      sourceUrl,
      error: error instanceof Error ? error.message : String(error),
      productId: product.id,
      groups
    };
  }
}

function mergePriceDeltas(groups, sourceGroups) {
  let pricedMatches = 0;
  const unmatchedOptions = [];
  const sourceByGroup = new Map(sourceGroups.map((group) => [normalize(group.label), group]));
  const nextGroups = groups.map((group) => {
    const sourceGroup = sourceByGroup.get(normalize(group.label));
    if (!sourceGroup) {
      unmatchedOptions.push(...(group.options || []).map((option) => `${group.label}: ${option.label}`));
      return group;
    }
    const sourceByOption = new Map(sourceGroup.options.map((option) => [normalize(option.label), option]));
    return {
      ...group,
      options: (group.options || []).map((option) => {
        const sourceOption = sourceByOption.get(normalize(option.label));
        if (!sourceOption) {
          unmatchedOptions.push(`${group.label}: ${option.label}`);
          return option;
        }
        if (!Number.isFinite(sourceOption.priceDelta)) return option;
        pricedMatches += 1;
        return { ...option, priceDelta: sourceOption.priceDelta };
      })
    };
  });
  return { groups: nextGroups, pricedMatches, unmatchedOptions };
}

function extractOptionGroups(html, sourceUrl) {
  const labelMatches = [...html.matchAll(/<span[^>]+class=["'][^"']*\btc-epo-element-label-text\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)].map((match) => ({
    label: cleanText(match[1]),
    index: match.index || 0
  }));
  return labelMatches.map((match, index) => {
    const section = html.slice(match.index, labelMatches[index + 1]?.index ?? html.length);
    const options = [...section.matchAll(/<li\b[^>]*class=["'][^"']*\btmcp-field-wrap\b[^"']*["'][^>]*>[\s\S]*?<\/li>/gi)]
      .map((option) => extractOption(option[0], sourceUrl))
      .filter(Boolean);
    const label = cleanText(match.label.replace(/^select\s+/i, ""));
    return {
      id: slugify(label),
      label,
      display: options.some((option) => option.swatch?.kind === "image") ? "swatches" : "cards",
      selectionMode: options.some((option) => option.inputType === "checkbox") ? "multiple" : "single",
      options,
    };
  }).filter((group) => group.label && group.options.length >= 2);
}

function extractOption(html, sourceUrl) {
  const label = cleanText(html.match(/<span[^>]+class=["'][^"']*\btc-label-text\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || "") ||
    cleanText(html.match(/<img[^>]+alt=["']([^"']+)["']/i)?.[1] || "") ||
    cleanText(html.match(/\bvalue=["']([^"']+)["']/i)?.[1] || "").replace(/_\d+$/, "");
  if (!label) return null;
  const rawImage = decodeHtml(html.match(/\bdata-image=["']([^"']+)["']/i)?.[1] || "") ||
    decodeHtml(html.match(/<img[^>]+class=["'][^"']*\btc-image\b[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1] || "");
  const imageUrl = absolutizeUrl(rawImage, sourceUrl);
  return {
    id: slugify(label),
    label,
    priceDelta: extractOptionPriceDelta(html),
    inputType: html.match(/<input\b[^>]*\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase() || null,
    selected: /<input\b[^>]*(?:\schecked(?:=["']checked["'])?)(?=[\s>])/i.test(html),
    swatch: imageUrl ? { kind: "image", value: imageUrl, label } : undefined,
  };
}

function mergeSourceCoverage(storedGroups, sourceGroups) {
  // The current supplier page is authoritative for non-head option groups.
  // Retaining source-absent stored choices is what allowed stale/unpriced
  // options to survive earlier imports. WM head libraries are injected by the
  // storefront's compatibility rules instead of being duplicated here.
  return sourceGroups.filter(isStoredSourceGroup).map(sourceGroupForStorage);
}

function isStoredSourceGroup(group) {
  return !/^(head|other heads)$/i.test(String(group?.label || "").trim());
}

function enrichStoredOption(stored, source) {
  return {
    ...stored,
    priceDelta: source.priceDelta,
    priceVerified: true,
    purchasable: true,
    swatch: source.swatch || stored.swatch,
    productionNote: source.selected ? "Default supplier selection." : stored.productionNote,
  };
}

function normalizeStoredOption(option) {
  const neutral = /^(factory default|no change|no add-on|no thanks|none|standard|regular|as shown|as shown in product photos)$/i.test(String(option?.label || "").trim()) ||
    /default supplier selection|no paid add-on/i.test(option?.productionNote || "");
  const free = /\bfree\b/i.test(option?.label || "");
  if (option?.priceDelta !== undefined || (!neutral && !free)) return option;
  return { ...option, priceDelta: 0, priceVerified: true, purchasable: true };
}

function sourceGroupForStorage(group) {
  return {
    id: group.id || slugify(group.label),
    label: titleCase(group.label),
    display: group.display || "cards",
    selectionMode: group.selectionMode || "single",
    options: group.options.map(sourceOptionForStorage),
  };
}

function sourceOptionForStorage(option) {
  return {
    id: option.id || slugify(option.label),
    label: /^no change$/i.test(option.label) ? "Factory default" : option.label,
    priceDelta: option.priceDelta ?? 0,
    priceVerified: true,
    purchasable: true,
    swatch: option.swatch,
    productionNote: option.selected ? "Default supplier selection." : undefined,
  };
}

function canonicalOptionKey(label) {
  if (/^(no change|factory default|as shown|as shown in product photos)$/i.test(String(label || "").trim())) return "__default__";
  if (/^(no add-on|no thanks|none)$/i.test(String(label || "").trim())) return "__none__";
  return normalize(label);
}

function absolutizeUrl(value, sourceUrl) {
  if (!value || value === "no-image") return null;
  try {
    const url = new URL(value, sourceUrl);
    const nitroPath = url.pathname.match(/\/www\.rosemarydoll\.com(\/wp-content\/uploads\/.*)$/i)?.[1];
    if (/nitrocdn\.com$/i.test(url.hostname) && nitroPath) {
      return `https://www.rosemarydoll.com${nitroPath}`;
    }
    if (url.hostname === "rosemarydoll.com") url.hostname = "www.rosemarydoll.com";
    return url.toString();
  } catch {
    return null;
  }
}

function extractOptionPriceDelta(html) {
  const directRaw = decodeHtml(html.match(/\bdata-price=["']([^"']*)["']/i)?.[1] || "").trim();
  const direct = Number(directRaw);
  if (directRaw && Number.isFinite(direct)) return direct;
  for (const attribute of ["data-rules", "data-original-rules"]) {
    const raw = decodeHtml(html.match(new RegExp(`\\b${attribute}=["']([^"']*)["']`, "i"))?.[1] || "");
    const values = [...raw.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter((value) => Number.isFinite(value) && value > 0);
    if (values.length) return Math.max(...values);
  }
  return 0;
}

async function fetchProducts(limit, handle = "") {
  const products = [];
  let after = null;
  do {
    const data = await adminFetch(`query Products($first: Int!, $after: String, $query: String) {
      products(first: $first, after: $after, query: $query) {
        nodes {
          id handle title vendor
          catalogBrand: metafield(namespace: "custom", key: "brand") { value }
          sourceUrl: metafield(namespace: "custom", key: "source_url") { value }
          customizationGroups: metafield(namespace: "custom", key: "customization_groups") { value }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`, { first: Math.min(250, limit - products.length), after, query: handle ? `handle:${handle}` : null });
    products.push(...data.products.nodes);
    after = data.products.pageInfo.endCursor;
    if (!data.products.pageInfo.hasNextPage) break;
  } while (products.length < limit);
  return products;
}

async function setCustomizationGroups(ownerId, groups) {
  const data = await adminFetch(`mutation SetGroups($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) { userErrors { field message } }
  }`, { metafields: [{ ownerId, namespace: "custom", key: "customization_groups", type: "json", value: JSON.stringify(groups) }] });
  const errors = data.metafieldsSet.userErrors;
  if (errors.length) throw new Error(errors.map((error) => error.message).join("; "));
}

async function setCustomizationGroupsBatch(changes) {
  const data = await adminFetch(`mutation SetGroups($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) { userErrors { field message } }
  }`, {
    metafields: changes.map((change) => ({
      ownerId: change.productId,
      namespace: "custom",
      key: "customization_groups",
      type: "json",
      value: JSON.stringify(change.groups)
    }))
  });
  const errors = data.metafieldsSet.userErrors;
  if (errors.length) throw new Error(errors.map((error) => error.message).join("; "));
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const accessToken = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken }, body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `Shopify Admin API HTTP ${response.status}`);
  return payload.data;
}

async function getAdminAccessToken(domain) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET })
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Failed to get Shopify Admin access.");
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000 };
  return tokenCache.accessToken;
}

async function fetchText(url) {
  let lastError;
  for (let attempt = 1; attempt <= sourceAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: AbortSignal.timeout(sourceTimeoutMs)
      });
      if (!response.ok) {
        const error = new Error(`Source returned HTTP ${response.status}`);
        error.status = response.status;
        error.retryAfter = Number(response.headers.get("retry-after") || 0);
        throw error;
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      const retryable = error?.status === 403 || error?.status === 429 || error?.status === 503 || error?.name === "TimeoutError";
      if (!retryable || attempt === sourceAttempts) break;
      const delayMs = error.retryAfter ? error.retryAfter * 1000 : Math.min(8_000, 750 * (2 ** (attempt - 1)));
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function mapWithConcurrency(items, max, mapper) {
  const results = [];
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      results.push(await mapper(item));
      if (results.length % 100 === 0) console.log(`Checked ${results.length}/${items.length}`);
    }
  }));
  return results;
}

function parseGroups(value) {
  try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function isRosemaryUrl(value) { try { return new URL(value).hostname.endsWith("rosemarydoll.com"); } catch { return false; } }
function normalize(value) { return cleanText(value).toLowerCase().replace(/\bselect\b/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
function slugify(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function titleCase(value) { return cleanText(value).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function cleanText(value) { return decodeHtml(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(); }
function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
function parseArgs(values) { return Object.fromEntries(values.flatMap((value, index) => value.startsWith("--") ? [[value.slice(2), values[index + 1]?.startsWith("--") ? true : values[index + 1] ?? true]] : [])); }
function assertShopifyAdminEnv() { if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) throw new Error("SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET are required."); }
async function loadLocalEnv() { try { const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8"); for (const rawLine of text.split(/\r?\n/)) { const line = rawLine.trim(); if (!line || line.startsWith("#")) continue; const separator = line.indexOf("="); if (separator < 0) continue; const key = line.slice(0, separator).trim(); const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""); process.env[key] ||= value; } } catch {} }
