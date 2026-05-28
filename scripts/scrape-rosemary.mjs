import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ACTOR_ID = process.env.APIFY_WEB_SCRAPER_ACTOR_ID || "apify~web-scraper";

const BRAND_START_URLS = {
  wm: "https://www.rosemarydoll.com/sex-doll-brands/wm-sex-dolls/",
  zelex: "https://www.rosemarydoll.com/sex-doll-brands/zelex-dolls/",
  irontech: "https://www.rosemarydoll.com/sex-doll-brands/irontech-doll/",
  starpery: "https://www.rosemarydoll.com/sex-doll-brands/starpery-dolls/",
  "doll-castle": "https://www.rosemarydoll.com/sex-doll-brands/dolls-castle-sex-dolls/"
};

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

const items = args.local || !process.env.APIFY_API_TOKEN ? await runLocalScrape(startUrl, limit, brand) : await runApifyScrape(startUrl, limit, brand);
const normalized = items.map((item) => normalizeRosemaryProduct(item, brand)).filter(Boolean);
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

async function runApifyScrape(startUrl, limit, brandSlug) {
  const actorId = encodeURIComponent(DEFAULT_ACTOR_ID);
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(process.env.APIFY_API_TOKEN)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      startUrls: [{ url: startUrl }],
      maxRequestsPerCrawl: Math.max(limit * 3, 10),
      maxRequestRetries: 2,
      pageFunction: buildApifyPageFunction(limit, brandSlug)
    })
  });

  if (!response.ok) {
    throw new Error(`Apify actor failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data.filter((item) => item?.sourceUrl?.includes("/product/")).slice(0, limit) : [];
}

function buildApifyPageFunction(limit, brandSlug) {
  return `async function pageFunction(context) {
    const { $, request, enqueueRequest } = context;
    const isProduct = request.url.includes('/product/');

    if (!isProduct) {
      const urls = new Set();
      $('a[href*="/product/"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && urls.size < ${Number(limit)}) urls.add(href.split('?')[0]);
      });
      for (const url of urls) await enqueueRequest({ url });
      $('a.next, a[rel="next"], .woocommerce-pagination a').each(async (_, element) => {
        const href = $(element).attr('href');
        if (href) await enqueueRequest({ url: href });
      });
      return null;
    }

    const html = $.html();
    return {
      sourceUrl: request.url,
      brandSlug: ${JSON.stringify(brandSlug || null)},
      title: $('meta[property="og:title"]').attr('content') || $('h1').first().text(),
      price: $('[itemprop="price"]').attr('content') || $('meta[property="product:price:amount"]').attr('content') || null,
      image: $('meta[property="og:image"]').attr('content') || null,
      description: $('meta[property="og:description"]').attr('content') || null,
      html
    };
  }`;
}

async function runLocalScrape(startUrl, limit, brandSlug) {
  const categoryHtml = await fetchText(startUrl);
  const productUrls = extractProductUrls(categoryHtml, startUrl).slice(0, limit);
  const products = [];

  for (const url of productUrls) {
    const html = await fetchText(url);
    products.push({
      sourceUrl: url,
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
  const matches = html.matchAll(/href=["']([^"']*\/product\/[^"']+)["']/gi);
  for (const match of matches) {
    const url = new URL(match[1], baseUrl);
    url.search = "";
    urls.add(url.toString());
  }
  return [...urls].filter((url) => url.includes("rosemarydoll.com/product/"));
}

function normalizeRosemaryProduct(item, brandFallback) {
  if (!item?.sourceUrl) return null;
  const rawTitle = cleanPlainText(item.title || pickTitle(item.html || ""));
  const title = rawTitle.replace(/\s+-\s+RosemaryDoll$/i, "");
  const description = cleanText(item.description || "");
  const price = Number(item.price || pickJsonPrice(item.html || ""));
  const brand = cleanBrand(extractSpec(description, "Brand")) || title.match(/\(([^)]+)\)/)?.[1] || brandFallback || "RosemaryDoll";
  const sourceUrl = item.sourceUrl.split("?")[0];
  const handle = sourceUrl.replace(/\/$/, "").split("/").pop();
  const imageUrls = unique([item.image, ...extractImageUrls(item.html || "")]).filter(Boolean).slice(0, 16);
  const optionGroupLabels = extractOptionGroupLabels(item.html || "");
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
    handle,
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

function extractOptionGroupLabels(html) {
  const text = cleanText(html.replace(/<[^>]+>/g, " "));
  return unique([...text.matchAll(/\b(SELECT [A-Z0-9\s\-&/]+?)(?=\s{2,}| NOTE| Image:|$)/g)].map((match) => cleanText(match[1]))).slice(0, 30);
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
  npm run scrape:rosemary -- --url https://www.rosemarydoll.com/shop/?filter_brand=zelex-doll --limit 12

By default the script uses Apify when APIFY_API_TOKEN is set. Without a token, it uses local fetch mode.
Output is written to data/imports/ and ignored by git for review before Shopify import.`);
}
