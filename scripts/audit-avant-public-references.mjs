import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(process.argv.slice(2).map((value, index, list) => [value, list[index + 1]]));
const collectionUrl = args.get("--url") || "https://www.yourdoll.com/avant-doll/?orderby=date&paged=1";
const manifestPath = path.resolve(args.get("--manifest") || path.join(ROOT, "data/exports/avant-review-manifest.json"));
const outputPath = path.resolve(args.get("--output") || path.join(ROOT, "data/exports/avant-public-reference-audit.json"));

await loadLocalEnv();
if (!process.env.APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN is required for the public-reference audit.");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const publicProducts = await scrapeCollection(collectionUrl);
const matches = manifest.products.map((product) => matchOfficialProduct(product, publicProducts));

const report = {
  generatedAt: new Date().toISOString(),
  collectionUrl,
  sourcePolicy: "Avant manufacturer files remain authoritative for product media, specifications, and approved options. This public audit only detects coverage and listing differences.",
  totals: {
    officialConfigurations: manifest.products.length,
    publicProductsFound: publicProducts.length,
    matched: matches.filter((match) => match.status === "matched").length,
    missingPublicMatch: matches.filter((match) => match.status === "missing-public-match").length,
    needsReview: matches.filter((match) => match.status === "needs-review").length
  },
  officialProducts: matches,
  unmatchedPublicProducts: publicProducts.filter((candidate) => !matches.some((match) => match.publicReference?.url === candidate.url))
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals }, null, 2));

async function scrapeCollection(url) {
  const actorId = encodeURIComponent(process.env.APIFY_WEB_SCRAPER_ACTOR_ID || "apify~web-scraper");
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(process.env.APIFY_API_TOKEN)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      startUrls: [{ url }],
      maxRequestsPerCrawl: 120,
      maxRequestRetries: 2,
      pageFunction: `async function pageFunction(context) {
        const { request } = context;
        const pageUrl = new URL(request.url);
        const isProduct = pageUrl.pathname.includes('/product/');
        if (!isProduct) {
          const links = [...document.querySelectorAll('a[href*="/product/"]')]
            .map((node) => new URL(node.getAttribute('href'), request.url).toString())
            .filter((link, index, values) => new URL(link).hostname.endsWith('yourdoll.com') && values.indexOf(link) === index)
            .slice(0, 80);
          await Promise.all(links.map((link) => context.enqueueRequest({ url: link })));
          return null;
        }
        const meta = (selector) => document.querySelector(selector)?.getAttribute('content') || null;
        const images = [...document.images]
          .map((image) => image.currentSrc || image.src)
          .filter(Boolean)
          .filter((image, index, values) => values.indexOf(image) === index);
        return {
          url: request.url,
          title: meta('meta[property="og:title"]') || document.querySelector('h1')?.textContent?.trim() || document.title,
          price: meta('meta[property="product:price:amount"]') || document.querySelector('[itemprop="price"]')?.getAttribute('content') || null,
          imageCount: images.length,
          images: images.slice(0, 100)
        };
      }`
    })
  });
  if (!response.ok) throw new Error(`Apify public-reference audit failed (${response.status}): ${await response.text()}`);
  const data = await response.json();
  return (Array.isArray(data) ? data : [])
    .filter((item) => item?.url && item?.title)
    .map((item) => ({ ...item, title: clean(item.title) }));
}

function matchOfficialProduct(product, candidates) {
  const expected = normalize(`${product.displayName} ${product.heightCm} ${product.cupSize} ${product.headModel}`);
  const byName = candidates.filter((candidate) => normalize(candidate.title).includes(normalize(product.displayName)));
  const exact = byName.find((candidate) => {
    const title = normalize(candidate.title);
    return title.includes(String(product.heightCm)) && title.includes(normalize(product.cupSize).replace("cup", ""));
  });
  const candidate = exact || byName[0] || null;

  if (!candidate) {
    return { official: product.displayName, sourceFolder: product.sourceFolder, status: "missing-public-match", publicReference: null };
  }

  const officialImageCount = product.imageCount;
  const publicImageCount = candidate.imageCount;
  const countsDiffer = officialImageCount !== publicImageCount;
  return {
    official: product.displayName,
    sourceFolder: product.sourceFolder,
    status: countsDiffer ? "needs-review" : "matched",
    publicReference: {
      source: "YourDoll",
      url: candidate.url,
      title: candidate.title,
      price: candidate.price,
      publicImageCount,
      officialImageCount,
      notes: countsDiffer
        ? [`Public image count (${publicImageCount}) differs from official Avant gallery (${officialImageCount}). Retain official media and review the public page only for configuration detail.`]
        : []
    },
    matchKey: expected
  };
}

function normalize(value = "") {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const contents = await fs.readFile(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Environment variables can be supplied by the shell or deployment environment.
  }
}
