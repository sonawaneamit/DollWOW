import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findRosemaryExclusiveSignals } from "./rosemary-guardrails.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await loadLocalEnv();

const DEFAULT_ACTOR_ID = process.env.APIFY_WEB_SCRAPER_ACTOR_ID || "apify~web-scraper";

const BRAND_START_URLS = {
  wm: "https://www.rosemarydoll.com/sex-doll-brands/wm-sex-dolls/",
  angelkiss: "https://www.rosemarydoll.com/sex-doll-brands/angelkiss-dolls/",
  zelex: "https://www.rosemarydoll.com/sex-doll-brands/zelex-dolls/",
  irontech: "https://www.rosemarydoll.com/sex-doll-brands/irontech-doll/",
  starpery: "https://www.rosemarydoll.com/sex-doll-brands/starpery-dolls/",
  "doll-castle": "https://www.rosemarydoll.com/sex-doll-brands/dolls-castle-sex-dolls/"
};

const BRAND_LABELS = {
  wm: "WM Dolls",
  angelkiss: "Anglekiss Dolls",
  zelex: "Zelex Dolls",
  irontech: "Irontech Doll",
  starpery: "Starpery Dolls",
  "doll-castle": "Doll Castle"
};

const IGNORED_PRODUCT_HANDLES = new Set(["custom-full-silicone-female-doll", "custom-full-tpe-sex-doll"]);
const PRODUCT_PATH_PATTERN = /(?:^|\/)product\//i;

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const brand = String(args.brand || "").toLowerCase();
const startUrl = args.url || BRAND_START_URLS[brand];
const limit = Number(args.limit || 24);

if (!startUrl) {
  throw new Error(`Pass --brand ${Object.keys(BRAND_START_URLS).join("|")} or --url <Rosemary category URL>.`);
}

class ApifyPermissionError extends Error {
  constructor(approvalUrl) {
    super("Apify blocked this actor because its account permissions have not been approved yet.");
    this.approvalUrl = approvalUrl;
  }
}

const fetchLimit = isProductUrl(startUrl) ? limit : Math.max(limit * 2, limit);
const items = await getScrapeItems(startUrl, fetchLimit, brand);
const normalized = items
  .map((item) => normalizeRosemaryProduct(item, brand))
  .filter(Boolean)
  .slice(0, limit);
const outputPath = args.out || path.join(ROOT, "data", "imports", `rosemary-${brand || "custom"}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(
  outputPath,
  JSON.stringify(
    {
      source: "rosemarydoll.com",
      startUrl,
      brand: brand || null,
      scrapedAt: new Date().toISOString(),
      mode: args.local || !process.env.APIFY_API_TOKEN ? "local" : "apify",
      count: normalized.length,
      products: normalized
    },
    null,
    2
  )
);

console.log(`Wrote ${normalized.length} normalized Rosemary products to ${path.relative(ROOT, outputPath)}`);
if (!process.env.APIFY_API_TOKEN && !args.local) {
  console.log("APIFY_API_TOKEN was not set, so the script used local fetch mode. Add the token to use Apify.");
}

async function getScrapeItems(startUrl, limit, brand) {
  if (args.local || !process.env.APIFY_API_TOKEN) return runLocalScrape(startUrl, limit, brand);
  try {
    return await runApifyScrape(startUrl, limit, brand);
  } catch (error) {
    if (error instanceof ApifyPermissionError) {
      console.error(error.message);
      console.error(`Approve actor permissions: ${error.approvalUrl}`);
      console.error("Then rerun the same command, or add --local to use local fetch mode.");
      process.exit(1);
    }
    throw error;
  }
}

async function runApifyScrape(startUrl, limit, brandSlug) {
  const productUrls = await resolveProductUrls(startUrl, limit);
  const actorId = encodeURIComponent(DEFAULT_ACTOR_ID);
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(process.env.APIFY_API_TOKEN)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      startUrls: productUrls.map((url) => ({ url })),
      maxRequestsPerCrawl: Math.max(productUrls.length, 1),
      maxRequestRetries: 2,
      pageFunction: buildApifyPageFunction(limit, brandSlug, isProductUrl(startUrl) ? null : startUrl)
    })
  });

  if (!response.ok) {
    const body = await response.text();
    const approvalUrl = body.match(/"approvalUrl"\s*:\s*"([^"]+)"/)?.[1];
    if (response.status === 403 && approvalUrl) throw new ApifyPermissionError(approvalUrl);
    throw new Error(`Apify actor failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const errorItem = Array.isArray(data) ? data.find((item) => item?.["#error"]) : null;
  if (errorItem) {
    const messages = errorItem["#debug"]?.errorMessages?.join("; ") || "unknown Apify extraction error";
    throw new Error(`Apify product extraction failed: ${messages}`);
  }
  return Array.isArray(data) ? data.filter((item) => item?.sourceUrl && isProductUrl(item.sourceUrl)).slice(0, limit) : [];
}

function buildApifyPageFunction(limit, brandSlug, collectionUrl) {
  return `async function pageFunction(context) {
    const { request } = context;
    const isProduct = /(?:^|\\/)product\\//i.test(new URL(request.url).pathname);
    if (!isProduct) return null;

    const meta = (selector) => document.querySelector(selector)?.getAttribute('content') || null;
    const html = document.documentElement.outerHTML;
    return {
      sourceUrl: request.url,
      sourceCollectionUrl: ${JSON.stringify(collectionUrl || null)},
      brandSlug: ${JSON.stringify(brandSlug || null)},
      title: meta('meta[property="og:title"]') || document.querySelector('h1')?.textContent || document.title,
      price: document.querySelector('[itemprop="price"]')?.getAttribute('content') || meta('meta[property="product:price:amount"]') || null,
      image: meta('meta[property="og:image"]'),
      description: meta('meta[property="og:description"]'),
      html
    };
  }`;
}

async function runLocalScrape(startUrl, limit, brandSlug) {
  const productUrls = await resolveProductUrls(startUrl, limit);
  const products = [];

  for (const url of productUrls) {
    let html = "";
    try {
      html = await fetchText(url);
    } catch (error) {
      console.warn(`Skipping ${url}: ${error.message}`);
      continue;
    }
    products.push({
      sourceUrl: url,
      sourceCollectionUrl: isProductUrl(startUrl) ? null : startUrl,
      brandSlug,
      title: pickMeta(html, "og:title") || pickTitle(html),
      price: pickJsonPrice(html),
      image: pickMeta(html, "og:image"),
      description: pickMeta(html, "og:description"),
      html
    });
  }

  return products;
}

async function resolveProductUrls(startUrl, limit) {
  if (isProductUrl(startUrl)) return [startUrl];
  const categoryHtml = await fetchText(startUrl);
  return extractProductUrls(categoryHtml, startUrl).slice(0, limit);
}

function isProductUrl(url) {
  return PRODUCT_PATH_PATTERN.test(new URL(url).pathname);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 DollWow import review bot",
      accept: "text/html,application/xhtml+xml"
    }
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

function extractProductUrls(html, baseUrl) {
  const urls = new Set();
  const matches = html.matchAll(/href=["']([^"']*(?:\/[a-z]{2})?\/product\/[^"']+)["']/gi);
  for (const match of matches) {
    const url = new URL(match[1], baseUrl);
    url.search = "";
    urls.add(url.toString());
  }
  return [...urls].filter((value) => {
    const url = new URL(value);
    if (url.hostname !== "www.rosemarydoll.com" && url.hostname !== "rosemarydoll.com") return false;
    if (!PRODUCT_PATH_PATTERN.test(url.pathname)) return false;
    const handle = url.pathname.replace(/\/$/, "").split("/").pop();
    return !IGNORED_PRODUCT_HANDLES.has(handle);
  });
}

function normalizeRosemaryProduct(item, brandFallback) {
  if (!item?.sourceUrl) return null;
  const rawTitle = cleanPlainText(item.title || pickTitle(item.html || ""));
  const title = rawTitle.replace(/\s+-\s+RosemaryDoll$/i, "");
  const description = cleanText(item.description || "");
  const price = Number(item.price || pickJsonPrice(item.html || ""));
  const brand = cleanBrand(extractSpec(description, "Brand")) || title.match(/\(([^)]+)\)/)?.[1] || BRAND_LABELS[brandFallback] || brandFallback || "RosemaryDoll";
  const sourceUrl = item.sourceUrl.split("?")[0];
  const handle = sourceUrl.replace(/\/$/, "").split("/").pop();
  if (/watermark/i.test(`${title} ${handle}`)) return null;
  const imageUrls = unique([item.image, ...extractImageUrls(item.html || "")]).filter(isCatalogImage).slice(0, 16);
  const optionGroupLabels = extractOptionGroupLabels(item.html || "");
  const optionGroups = extractOptionGroups(item.html || "", sourceUrl);
  const reviewFlags = {
    exclusiveSignals: findRosemaryExclusiveSignals({
      sourceUrl,
      sourceCollectionUrl: item.sourceCollectionUrl || null,
      handle,
      brand,
      brandSlug: item.brandSlug || brandFallback || slugify(brand),
      title,
      description,
      html: item.html || "",
      optionGroupLabels,
      optionGroups
    })
  };
  const stockSignal = `${rawTitle} ${pickTitle(item.html || "")}`;
  const isReadyToShip = /\bin stock\b|fast shipping/i.test(stockSignal);
  const dimensions = {
    heightCm: numberFromSpec(description, /Height:[^/]+\/\s*([0-9.]+)\s*cm/i),
    weightLb: numberFromSpec(description, /Weight:\s*([0-9.]+)\s*lbs?/i),
    cupSize: cleanText(description.match(/Bra Size:\s*([^:]+?)(?: Feet Length| Bust|$)/i)?.[1] || "")
  };

  return {
    source: "rosemarydoll",
    sourceUrl,
    sourceCollectionUrl: item.sourceCollectionUrl || null,
    handle,
    sourceTitle: title.replace(/\s*\[[^\]]+\]\s*/g, " ").replace(/\s+/g, " ").trim(),
    title: title.replace(/\s*\[[^\]]+\]\s*/g, " ").replace(/\s+/g, " ").trim(),
    brand,
    brandSlug: item.brandSlug || brandFallback || slugify(brand),
    price: Number.isFinite(price) ? price : null,
    currency: "USD",
    stockStatus: isReadyToShip ? "ready_to_ship" : "custom",
    warehouseCountry: isReadyToShip && /\bUSA?\b|United States/i.test(stockSignal) ? "United States" : null,
    customAvailable: !isReadyToShip,
    description,
    specs: dimensions,
    imageUrls,
    optionGroupLabels,
    optionGroups,
    reviewFlags,
    excludedFromDollWow: reviewFlags.exclusiveSignals.length > 0,
    importedAt: new Date().toISOString()
  };
}

function pickMeta(html, property) {
  return cleanText(html.match(new RegExp(`<meta[^>]+property=["']${escapeRegex(property)}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] || "");
}

function pickTitle(html) {
  return cleanPlainText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "");
}

function pickJsonPrice(html) {
  return html.match(/"price"\s*:\s*"?([0-9.]+)"?/i)?.[1] || html.match(/itemprop=["']price["'][^>]+content=["']([0-9.]+)["']/i)?.[1] || null;
}

function extractImageUrls(html) {
  return unique([...html.matchAll(/https?:\/\/www\.rosemarydoll\.com\/wp-content\/uploads\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi)].map((match) => decodeHtml(match[0])));
}

function isCatalogImage(url) {
  return (
    Boolean(url) &&
    !/logo|favicon|placeholder|payment|paypal|visa|mastercard|klarna|afterpay|trust|reward|timeline|fedex|certificate|authorization/i.test(url) &&
    !/\/(?:us|ca|eu|uk|jp|au-1|nz-1)\.(?:jpe?g|png|webp)$/i.test(url)
  );
}

function extractOptionGroupLabels(html) {
  const text = cleanText(html.replace(/<[^>]+>/g, " "));
  return unique([...text.matchAll(/\b(SELECT [A-Z0-9\s\-&/]+?)(?=\s{2,}| NOTE| Image:|$)/g)].map((match) => cleanText(match[1]))).slice(0, 30);
}

function extractOptionGroups(html, sourceUrl) {
  const labelMatches = [...html.matchAll(/<span[^>]+class=["'][^"']*\btc-epo-element-label-text\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi)].map((match) => ({
    label: cleanOptionGroupLabel(match[1]),
    index: match.index || 0
  }));

  return labelMatches
    .map((match, index) => {
      const next = labelMatches[index + 1]?.index ?? html.length;
      const section = html.slice(match.index, next);
      const optionMatches = [...section.matchAll(/<li\b[^>]*class=["'][^"']*\btmcp-field-wrap\b[^"']*["'][^>]*>[\s\S]*?<\/li>/gi)];
      const options = optionMatches.map((optionMatch) => extractOption(optionMatch[0], sourceUrl)).filter(Boolean);
      if (!match.label || options.length < 2) return null;
      return {
        id: slugify(match.label.replace(/^select\s+/i, "")),
        label: titleCase(match.label.replace(/^select\s+/i, "")),
        sourceLabel: match.label,
        display: options.some((option) => option.imageUrl) ? "swatches" : "cards",
        inputType: options.some((option) => option.inputType === "checkbox") ? "checkboxes" : "radio",
        options
      };
    })
    .filter(Boolean)
    .filter((group) => isUsefulOptionGroup(group))
    .slice(0, 40);
}

function extractOption(html, sourceUrl) {
  const label =
    cleanText(html.match(/<span[^>]+class=["'][^"']*\btc-label-text\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || "") ||
    cleanText(html.match(/<img[^>]+alt=["']([^"']+)["']/i)?.[1] || "") ||
    cleanText(html.match(/\bvalue=["']([^"']+)["']/i)?.[1] || "").replace(/_\d+$/, "");
  if (!label) return null;

  const rawImage =
    decodeHtml(html.match(/\bdata-image=["']([^"']+)["']/i)?.[1] || "") ||
    decodeHtml(html.match(/<img[^>]+class=["'][^"']*\btc-image\b[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1] || "");
  const imageUrl = absolutizeRosemaryUrl(rawImage, sourceUrl);
  const priceDelta = extractOptionPriceDelta(html);

  return {
    id: slugify(label),
    label,
    value: cleanText(html.match(/\bvalue=["']([^"']+)["']/i)?.[1] || ""),
    priceDelta,
    imageUrl: imageUrl && isCatalogImage(imageUrl) ? imageUrl : null,
    selected: /<input\b[^>]*(?:\schecked(?:=["']checked["'])?)(?=[\s>])/i.test(html),
    inputType: html.match(/<input\b[^>]*\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase() || null
  };
}

function extractOptionPriceDelta(html) {
  const rawPrice = decodeHtml(html.match(/\bdata-price=["']([^"']*)["']/i)?.[1] || "");
  const dataPrice = Number(rawPrice);
  if (Number.isFinite(dataPrice) && dataPrice > 0) return dataPrice;

  for (const attr of ["data-rules", "data-original-rules"]) {
    const rawRules = decodeHtml(html.match(new RegExp(`\\b${attr}=["']([^"']*)["']`, "i"))?.[1] || "");
    const rulesPrice = priceFromRules(rawRules);
    if (rulesPrice > 0) return rulesPrice;
  }

  return 0;
}

function priceFromRules(rawRules) {
  if (!rawRules) return 0;
  const values = [];
  collectNumericValues(parseRules(rawRules), values);
  if (!values.length) {
    values.push(...[...rawRules.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0])));
  }
  return Math.max(0, ...values.filter((value) => Number.isFinite(value)));
}

function parseRules(rawRules) {
  try {
    return JSON.parse(rawRules);
  } catch {
    return rawRules;
  }
}

function collectNumericValues(value, values) {
  if (Array.isArray(value)) {
    for (const item of value) collectNumericValues(item, values);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectNumericValues(item, values);
    return;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) values.push(numeric);
}

function cleanOptionGroupLabel(value) {
  return cleanText(value.replace(/<[^>]+>/g, " ")).replace(/\*+/g, "").trim();
}

function isUsefulOptionGroup(group) {
  if (!group?.options?.length) return false;
  if (/payment|shipping|coupon|rush|terms|quantity/i.test(group.label)) return false;
  return group.options.some((option) => option.imageUrl) || /skin|eye|head|wig|hair|body|feet|heating|vagina|nail|makeup|stand|storage|skeleton/i.test(group.label);
}

function absolutizeRosemaryUrl(value, sourceUrl) {
  if (!value || value === "no-image") return null;
  try {
    const url = new URL(value, sourceUrl || "https://www.rosemarydoll.com/");
    if (url.hostname === "rosemarydoll.com") url.hostname = "www.rosemarydoll.com";
    return url.toString();
  } catch {
    return null;
  }
}

function extractSpec(description, label) {
  return cleanText(description.match(new RegExp(`${escapeRegex(label)}:\\s*([^:]+?)(?:\\s+[A-Z][A-Za-z ]+:|$)`, "i"))?.[1] || "");
}

function numberFromSpec(description, regex) {
  const value = Number(description.match(regex)?.[1]);
  return Number.isFinite(value) ? value : null;
}

function cleanText(value) {
  return cleanPlainText(value)
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPlainText(value) {
  return decodeHtml(String(value || "")).replace(/\s+/g, " ").trim();
}

function cleanBrand(value) {
  return cleanPlainText(value)
    .split(/\bThis doll\b|\bWe provide\b|\bAlternatively\b/i)[0]
    .trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "local" || key === "help") {
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
  npm run scrape:rosemary -- --brand zelex --limit 20
  npm run scrape:rosemary -- --brand wm --limit 10 --local
  npm run scrape:rosemary -- --brand angelkiss --limit 10 --local
  npm run scrape:rosemary -- --url https://www.rosemarydoll.com/shop/?filter_brand=zelex-doll --limit 12

By default the script uses Apify when APIFY_API_TOKEN is set. Without a token, it uses local fetch mode.
Output is written to data/imports/ and ignored by git for review before Shopify import.`);
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
    // Local env is optional; CI/Vercel can provide process.env directly.
  }
}
