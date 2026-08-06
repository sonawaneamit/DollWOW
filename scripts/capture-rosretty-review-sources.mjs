import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(process.argv.slice(2).map((value, index, list) => [value, list[index + 1]]));
const source = args.get("--source");
const limit = Math.max(1, Number(args.get("--limit") || 10));
const offset = Math.max(0, Number(args.get("--offset") || 0));
const urlsPath = args.get("--urls");
const directUrl = args.get("--url");

const sourceConfig = {
  official: {
    collectionUrl: "https://www.rosretty.com/collections/all",
    productPath: "/products/",
    requiredPathPart: null,
    output: "data/imports/rosretty-official.json"
  },
  yourdoll: {
    collectionUrl: "https://www.yourdoll.com/rosretty-doll/",
    productPath: "/product/",
    requiredPathPart: "/product/sex-doll-rst",
    output: "data/imports/rosretty-yourdoll.json"
  }
}[source];

if (!sourceConfig) throw new Error("Use --source official or --source yourdoll.");

await loadLocalEnv();
if (!process.env.APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN is required to capture the Rosretty review sources.");

const actorId = encodeURIComponent(process.env.APIFY_WEB_SCRAPER_ACTOR_ID || "apify~web-scraper");
const endpoint = `https://api.apify.com/v2/acts/${actorId}/runs?token=${encodeURIComponent(process.env.APIFY_API_TOKEN)}`;
const seedUrls = directUrl
  ? [new URL(directUrl).toString()]
  : await readSeedUrls(urlsPath, sourceConfig, offset, limit);
const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    startUrls: seedUrls.length > 0 ? seedUrls.map((url) => ({ url })) : [{ url: sourceConfig.collectionUrl }],
    // The actor counts the collection page and any redirects toward this cap.
    // Leave enough room for the requested product pages to actually run.
    maxRequestsPerCrawl: limit + (source === "official" ? 40 : 24),
    maxRequestRetries: 2,
    pageFunction: buildPageFunction(sourceConfig.productPath, sourceConfig.requiredPathPart, limit, offset)
  })
});

if (!response.ok) throw new Error(`Apify source capture failed (${response.status}): ${await response.text()}`);
const result = await response.json();
if (!result?.data?.id) throw new Error("Apify did not return a run id.");

console.log(JSON.stringify({
  source,
  collectionUrl: sourceConfig.collectionUrl,
  seededProductUrls: seedUrls.length,
  offset,
  limit,
  runId: result.data.id,
  status: result.data.status,
  next: `npm run finalize:rosretty-review -- --source ${source} --run-id ${result.data.id}${args.has("--append") ? " --append" : ""}`
}, null, 2));

async function readSeedUrls(filePath, config, requestedOffset, requestedLimit) {
  if (!filePath) {
    if (!config.requiredPathPart) {
      return Array.from({ length: 6 }, (_, index) => {
        const url = new URL(config.collectionUrl);
        if (index) url.searchParams.set("page", String(index + 1));
        return url.toString();
      });
    }
    return [];
  }

  const contents = await fs.readFile(path.resolve(ROOT, filePath), "utf8");
  const raw = JSON.parse(contents);
  const values = Array.isArray(raw) ? raw : raw.urls;
  if (!Array.isArray(values)) throw new Error("--urls must point to a JSON array, or an object with a urls array.");

  return [...new Set(values
    .map((value) => typeof value === "string" ? value : value?.sourceUrl || value?.url)
    .filter(Boolean)
    .map((value) => new URL(value).toString())
    .filter((value) => {
      const url = new URL(value);
      return url.hostname.endsWith(new URL(config.collectionUrl).hostname)
        && (!config.requiredPathPart || url.pathname.includes(config.requiredPathPart));
    }))]
    .slice(requestedOffset, requestedOffset + requestedLimit);
}

function buildPageFunction(productPath, requiredPathPart, requestLimit, requestOffset) {
  return `async function pageFunction(context) {
    const { request } = context;
    const current = new URL(request.url);
    const productPath = ${JSON.stringify(productPath)};
    const requiredPathPart = ${JSON.stringify(requiredPathPart)};
    const isProduct = current.pathname.includes(productPath) && (!requiredPathPart || current.pathname.includes(requiredPathPart));
    if (!isProduct) {
      const links = [...document.querySelectorAll('a[href]')]
        .map((node) => {
          const url = new URL(node.getAttribute('href'), request.url);
          url.search = '';
          url.hash = '';
          url.pathname = url.pathname.replace(/^\\/collections\\/[^/]+\\/products\\//, '/products/');
          return url.toString();
        })
        .filter((url) => new URL(url).hostname === current.hostname
          && new URL(url).pathname.includes(productPath)
          && (!requiredPathPart || new URL(url).pathname.includes(requiredPathPart)))
        .filter((url, index, values) => values.indexOf(url) === index)
        .slice(${requestOffset}, ${requestOffset + requestLimit});
      await Promise.all(links.map((url) => context.enqueueRequest({ url })));
      return null;
    }

    const meta = (selector) => document.querySelector(selector)?.getAttribute('content') || null;
    const parseJson = (value) => { try { return JSON.parse(value); } catch { return null; } };
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((node) => {
        const value = parseJson(node.textContent || '');
        return Array.isArray(value) ? value : value ? [value] : [];
      });
    const productSchema = jsonLd.find((value) => {
      const type = value?.['@type'];
      return type === 'Product' || (Array.isArray(type) && type.includes('Product'));
    }) || {};
    const scriptText = [...document.scripts].map((node) => node.textContent || '').join(' ');
    const title = (meta('meta[property="og:title"]') || document.querySelector('h1')?.textContent || document.title || '').replace(/\\s+/g, ' ').trim();
    const imageUrls = [...new Set([
      meta('meta[property="og:image"]'),
      ...[...document.images].map((image) => image.currentSrc || image.src)
    ].filter(Boolean))].slice(0, 80);
    const details = document.body.innerText.replace(/\\s+/g, ' ').slice(0, 30000);
    const vendor = productSchema?.brand?.name
      || productSchema?.brand
      || scriptText.match(/["']vendor["']\\s*:\\s*["']([^"']+)["']/i)?.[1]
      || null;
    const options = [...document.querySelectorAll('select, fieldset, [data-option-name], [data-product-option], [class*="product-option" i], [class*="option-group" i], [class*="option_wrap" i], [class*="swatch" i]')]
      .map((node) => {
        const label = node.getAttribute('data-option-name')
          || node.getAttribute('data-product-option')
          || node.querySelector('legend, .option-title, .option-label, .product-option-title, label')?.textContent
          || node.previousElementSibling?.textContent
          || node.getAttribute('name')
          || '';
        const values = node.matches('select')
          ? [...node.options].map((option) => option.textContent?.trim()).filter(Boolean)
          : [...node.querySelectorAll('input[type="radio"], input[type="checkbox"], button, option, [data-value], [data-option-value]')]
            .map((option) => option.getAttribute('data-option-value') || option.getAttribute('data-value') || option.getAttribute('value') || option.getAttribute('aria-label') || option.textContent?.trim())
            .filter(Boolean);
        return { label: String(label).replace(/\\s+/g, ' ').trim(), values: [...new Set(values)].slice(0, 100) };
      })
      .filter((group) => group.label && group.values.length)
      .slice(0, 30);
    const heightCm = Number(title.match(/\\b(1[0-9]{2})\\s*cm\\b/i)?.[1]) || null;
    const cupSize = title.match(/\\b([a-z])\\s*-?\\s*cup\\b/i)?.[1]?.toUpperCase() || null;
    const searchableText = title + ' ' + details;
    const measurement = (labels) => {
      const expression = new RegExp('(?:' + labels.join('|') + ')\\\\s*:?\\\\s*(\\\\d+(?:\\\\.\\\\d+)?)\\\\s*cm\\\\b', 'i');
      const match = details.match(expression);
      return match ? match[1] + ' cm' : null;
    };
    const material = /silicone\\s*head.*tpe|tpe.*silicone\\s*head/i.test(searchableText)
      ? 'Silicone Head + TPE Body'
      : /silicone/i.test(searchableText)
        ? 'Silicone'
        : /tpe/i.test(searchableText)
          ? 'TPE'
          : null;
    return {
      sourceUrl: (() => { const url = new URL(request.url); url.search = ''; url.hash = ''; url.pathname = url.pathname.replace(/^\\/collections\\/[^/]+\\/products\\//, '/products/'); return url.toString(); })(),
      title,
      vendor: typeof vendor === 'string' ? vendor.replace(/\\s+/g, ' ').trim() : null,
      price: meta('meta[property="product:price:amount"]') || document.querySelector('[itemprop="price"]')?.getAttribute('content') || null,
      sku: details.match(/(?:SKU|Model)\\s*[:#]?\\s*([A-Z0-9_-]{4,})/i)?.[1] || null,
      imageUrls,
      heightCm,
      cupSize: cupSize ? cupSize + '-Cup' : null,
      material,
      options,
      specs: {
        Height: heightCm ? heightCm + ' cm' : null,
        Weight: measurement(['Weight', 'Net Weight']),
        Bust: measurement(['Bust', 'Breast']),
        Waist: measurement(['Waist']),
        Hip: measurement(['Hip']),
        'Feet Length': measurement(['Feet Length', 'Foot Length']),
        'Legs Length': measurement(['Legs Length', 'Leg Length']),
        'Arms Length': measurement(['Arms Length', 'Arm Length']),
        'Shoulders Width': measurement(['Shoulders Width', 'Shoulder Width']),
        'Vagina Depth': measurement(['Vagina Depth', 'Vaginal Depth']),
        'Anus Depth': measurement(['Anus Depth', 'Anal Depth']),
        'Oral Depth': measurement(['Oral Depth'])
      }
    };
  }`;
}

async function loadLocalEnv() {
  try {
    const contents = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Deployment environment can supply credentials instead.
  }
}
