import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(ROOT, args.input || "data/imports/rosretty-official-full.json");
const outputPath = path.resolve(
  ROOT,
  args.output || path.join("data", "exports", `rosretty-official-import-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
);
const reportPath = outputPath.replace(/\.json$/, ".report.json");
const retailAdjustment = Number(args["price-adjustment"] ?? 0);
const latestOrderPath = args["latest-order"] ? path.resolve(ROOT, args["latest-order"]) : null;

if (!Number.isFinite(retailAdjustment) || retailAdjustment < 0) {
  throw new Error("--price-adjustment must be a non-negative USD amount.");
}

const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
const captured = Array.isArray(source.products) ? source.products : [];
const latestOrder = latestOrderPath ? JSON.parse(await fs.readFile(latestOrderPath, "utf8")) : null;
const accepted = captured
  .filter(isRosrettyListing)
  .filter((product) => !isAndDollListing(product))
  .filter((product) => Number(product.price) > 0)
  .filter((product) => officialImages(product).length > 0);

const releaseRanks = buildReleaseRanks(accepted, latestOrder?.products || []);
const products = accepted.map((product, index) => mapProduct(product, releaseRanks.get(product.sourceUrl) ?? index + 1, retailAdjustment));
products.sort((left, right) => left.extended.sourceReleaseRank - right.extended.sourceReleaseRank);
disambiguateDuplicateTitles(products);

const report = {
  generatedAt: new Date().toISOString(),
  source: source.collectionUrl || "https://www.rosretty.com/collections/all",
  sourceCaptureCount: captured.length,
  acceptedRosrettyListings: products.length,
  excludedNonRosrettyListings: captured.filter((product) => !isRosrettyListing(product)).length,
  excludedMissingPriceOrMedia: captured.filter(isRosrettyListing).length - accepted.length,
  releaseOrder: {
    source: latestOrder?.source || "official collection order",
    matchedToLatestSource: [...releaseRanks.values()].filter((rank) => rank <= (latestOrder?.products?.length || 0)).length,
    unmatched: accepted.filter((product) => (releaseRanks.get(product.sourceUrl) || Infinity) > (latestOrder?.products?.length || 0)).map((product) => ({
      title: cleanText(product.title),
      sourceUrl: product.sourceUrl
    }))
  },
  pricing: {
    currency: "USD",
    officialSourcePrice: true,
    dollWowAdjustment: retailAdjustment,
    note: retailAdjustment
      ? `A $${retailAdjustment} retail adjustment was applied to the official Rosretty base price.`
      : "Official Rosretty base prices are preserved for review."
  },
  products: products.map((product) => ({
    handle: product.handle,
    title: product.title,
    sourceUrl: product.sourceUrl,
    price: product.priceRange.minVariantPrice.amount,
    imageCount: product.images.length,
    measurements: Object.keys(product.extended.measurements || {}).length,
    reviewFlags: product.reviewFlags
  }))
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(ROOT, outputPath), report: path.relative(ROOT, reportPath), totals: report }, null, 2));

function isRosrettyListing(product) {
  // The official collection contains multiple seller labels. Keep the two
  // Rosretty labels and leave the separate SY Doll entries out of this batch.
  return /^rosretty(?:\s+doll)?$/i.test(cleanText(product.vendor));
}

function isAndDollListing(product) {
  return /(?:\/products\/and-doll-|\band\s+doll\b)/i.test(`${product.sourceUrl || ""} ${product.title || ""}`);
}

function buildReleaseRanks(officialProducts, latestProducts) {
  if (!latestProducts.length) return new Map(officialProducts.map((product, index) => [product.sourceUrl, index + 1]));

  // A trusted vendor may be faster to publish a new release than the brand's
  // own storefront. When the visual-match review has a high-confidence link
  // back to an official product, that vendor's newest-first rank wins.
  const reviewedRanks = new Map();
  for (const listing of latestProducts) {
    const sourceUrl = listing.officialSourceUrl;
    const rank = Number(listing.match?.releaseRank);
    if (sourceUrl && listing.match?.confident && Number.isFinite(rank) && rank > 0) {
      reviewedRanks.set(sourceUrl, rank);
    }
  }

  if (reviewedRanks.size) {
    const fallbackStart = Math.max(...reviewedRanks.values()) + 1;
    return new Map(officialProducts.map((product, index) => [
      product.sourceUrl,
      reviewedRanks.get(product.sourceUrl) ?? fallbackStart + index
    ]));
  }

  const latestByKey = new Map();
  for (const listing of latestProducts) {
    for (const key of identityKeys(listing.title)) {
      const ranks = latestByKey.get(key) || [];
      ranks.push(listing.releaseRank);
      latestByKey.set(key, ranks);
    }
  }

  const ranks = new Map();
  const fallbackStart = latestProducts.length + 1;
  officialProducts.forEach((product, index) => {
    const matches = identityKeys(product.title)
      .flatMap((key) => latestByKey.get(key) || []);
    const uniqueMatches = [...new Set(matches)];
    ranks.set(product.sourceUrl, uniqueMatches.length === 1 ? uniqueMatches[0] : fallbackStart + index);
  });
  return ranks;
}

function identityKeys(title) {
  const raw = cleanText(title);
  const height = raw.match(/\b(\d{2,3})\s*cm\b/i)?.[1] || "";
  const names = [];
  const dashTail = raw.split(/\s*[-–—]\s*/).at(-1)?.trim();
  if (dashTail && /^[\p{L}][\p{L}' -]{1,42}$/u.test(dashTail)) names.push(dashTail);
  const endName = raw.match(/\b(?:doll|torso)\s+([A-Za-z][A-Za-z'-]{2,})$/i)?.[1];
  if (endName) names.push(endName);
  const keys = names.map((name) => normalize(`${name}-${height}`)).filter(Boolean);
  return [...new Set(keys)];
}

function mapProduct(source, releaseRank, adjustment) {
  const identity = identityFrom(source);
  const price = roundRetailPrice(Number(source.price) + adjustment);
  const images = officialImages(source).map((url, index) => ({
    url,
    altText: index === 0 ? `${identity.displayName} by Rosretty` : `${identity.displayName} product photo ${index + 1}`
  }));
  const measurements = cleanMeasurements(source.specs || {});
  const stockStatus = /(?:in[\s-]?stock|ready[\s-]?to[\s-]?ship)/i.test(`${source.title || ""} ${source.sourceUrl || ""}`)
    ? "ready_to_ship"
    : "custom";
  const tags = unique([
    "rosretty-dolls",
    stockStatus === "ready_to_ship" ? "ready_to_ship" : "factory_order",
    "female-dolls",
    identity.isTorso ? "torso" : "full-size",
    identity.material ? slugify(identity.material) : "",
    identity.heightCm ? heightTag(identity.heightCm) : "",
    ...lookTags(source.title)
  ]);
  const extended = {
    catalogIdentityKey: slugify(["rosretty", identity.heightCm, identity.material, identity.displayName].filter(Boolean).join("-")),
    catalogBodyIdentityKey: slugify(["rosretty", identity.heightCm, identity.material, identity.isTorso ? "torso" : "full"].filter(Boolean).join("-")),
    displayName: identity.displayName,
    headModel: undefined,
    bodyType: "female",
    brand: "Rosretty",
    material: identity.material,
    heightCm: identity.heightCm,
    weightLb: numberFromMeasurement(measurements.Weight),
    cupSize: identity.cupSize,
    measurements,
    warehouseCountry: undefined,
    stockStatus,
    deliveryEstimate: stockStatus === "ready_to_ship" ? "Ships within 1-3 business days after stock confirmation" : "Usually 3-5 weeks from order to delivery",
    stockLastCheckedAt: new Date().toISOString(),
    customAvailable: false,
    customizationGroups: [],
    sourceReleaseRank: releaseRank,
    sourceBasePrice: Number(source.price),
    qcNote: stockStatus === "ready_to_ship"
      ? "Ready-to-ship availability is confirmed before dispatch."
      : "Factory photos are shared for approval before shipment when available for this build."
  };

  const title = cleanTitle(`Rosretty ${identity.displayName} ${identity.heightCm ? `${identity.heightCm}cm` : ""} ${identity.material || ""} ${identity.isTorso ? "Torso" : "Companion Doll"}`);
  return {
    title,
    handle: slugify(`rosretty-${identity.displayName}-${identity.heightCm || ""}cm-${identity.material || ""}-${shortHash(source.sourceUrl)}`),
    description: publicDescription(identity, stockStatus),
    vendor: "Rosretty",
    productType: identity.isTorso ? "Torso doll" : "Companion doll",
    tags,
    images,
    featuredImage: images[0] || null,
    variants: [{ id: "source-default", title: "Default", availableForSale: true, price: { amount: String(price), currencyCode: "USD" }, selectedOptions: [] }],
    priceRange: { minVariantPrice: { amount: String(price), currencyCode: "USD" }, maxVariantPrice: { amount: String(price), currencyCode: "USD" } },
    sourceUrl: source.sourceUrl,
    sourceTitle: cleanText(source.title),
    sourceHandle: new URL(source.sourceUrl).pathname.split("/").filter(Boolean).at(-1),
    sourcePrice: Number(source.price),
    sourceEdition: editionFrom(source.title),
    publishedAt: null,
    reviewFlags: ["official-rosretty-source", "official-custom-options-not-exposed"],
    extended
  };
}

function identityFrom(source) {
  const raw = cleanText(source.title);
  const heightCm = Number(raw.match(/\b(\d{2,3})\s*cm\b/i)?.[1]) || undefined;
  const material = /silicone\s*head/i.test(raw) ? "Silicone head" : /full\s+silicone|silicone/i.test(raw) ? "Silicone" : /tpe/i.test(raw) ? "TPE" : undefined;
  const displayName = extractName(raw, source.sourceUrl) || "Rosretty Doll";
  return { displayName, heightCm, material, cupSize: undefined, isTorso: /\btorso\b/i.test(raw) };
}

function extractName(raw, sourceUrl) {
  const tail = cleanText(raw).split(/\s*[-–—]\s*/).at(-1)?.trim();
  if (tail && /^[\p{L}][\p{L}' -]{1,42}$/u.test(tail)) return titleCase(tail);
  const slug = new URL(sourceUrl).pathname.split("/").filter(Boolean).at(-1) || "";
  const match = slug.match(/(?:sex-doll|sex-torso)-([a-z]+)(?:-[a-z0-9]{3,})?$/i);
  return match?.[1] ? titleCase(match[1]) : "";
}

function officialImages(product) {
  const byBase = new Map();
  for (const value of product.imageUrls || []) {
    try {
      const url = new URL(value);
      if (!/staticdj\.com$/i.test(url.hostname)) continue;
      if (!/\.(?:jpe?g|png|webp)$/i.test(url.pathname)) continue;
      url.protocol = "https:";
      const base = url.pathname.replace(/_(?:180|400|650|720|900|1024)x?(?=\.[a-z]+$)/i, "");
      // The capture contains delivery-size variants such as `_400x` and
      // `_1024x`. Keep the original asset path so Shopify receives the
      // source-resolution file rather than a storefront thumbnail.
      const original = new URL(url);
      original.pathname = base;
      const current = byBase.get(base);
      if (!current || imageWidth(url) > imageWidth(new URL(current.variant))) {
        byBase.set(base, { original: original.toString(), variant: url.toString() });
      }
    } catch {
      // Ignore malformed image references.
    }
  }
  return [...byBase.values()].map(({ original }) => original).slice(0, 40);
}

function imageWidth(url) {
  const match = url.pathname.match(/_(\d{2,4})x?(?=\.[a-z]+$)/i);
  return Number(match?.[1] || 0);
}

function cleanMeasurements(specs) {
  const aliases = { "Foot Length": "Feet Length", "Shoulder Width": "Shoulders Width", "Arm Length": "Arms Length", "Leg Length": "Legs Length", "Vaginal Depth": "Vagina Depth", "Anal Depth": "Anus Depth" };
  return Object.fromEntries(Object.entries(specs)
    .filter(([, value]) => value)
    .map(([label, value]) => [aliases[label] || label, cleanText(value)]));
}

function lookTags(title) {
  const value = cleanText(title).toLowerCase();
  return [
    value.includes("blonde") ? "blonde" : "",
    value.includes("brunette") ? "brunette" : "",
    value.includes("red-hair") || value.includes("red hair") ? "red-hair" : "",
    value.includes("ebony") ? "black-dolls" : "",
    value.includes("skinny") ? "slim-builds" : "",
    value.includes("voluptuous") || value.includes("big breasts") ? "curvy-builds" : ""
  ];
}

function publicDescription(identity, stockStatus) {
  const details = [identity.heightCm ? `${identity.heightCm} cm` : "", identity.material].filter(Boolean).join(" with ");
  const availability = stockStatus === "ready_to_ship" ? "This listing is shown as ready to ship, subject to stock confirmation." : "This model is available as a custom factory order.";
  return `${identity.displayName} is a Rosretty ${identity.isTorso ? "torso" : "companion doll"}${details ? ` at ${details}` : ""}. Review the product photos and full measurements to compare the configuration. ${availability}`;
}

function disambiguateDuplicateTitles(products) {
  const groups = new Map();
  for (const product of products) {
    const key = normalize(product.title);
    groups.set(key, [...(groups.get(key) || []), product]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.forEach((product, index) => {
      const edition = product.sourceEdition || `Style ${index + 1}`;
      product.title = cleanTitle(`${product.title.replace(/\s+Companion Doll$/i, "")} - ${edition} Companion Doll`);
    });
  }
}

function editionFrom(value) {
  const raw = cleanText(value).toLowerCase();
  const labels = [["blonde", "Blonde"], ["red-hair", "Red Hair"], ["red hair", "Red Hair"], ["catwoman", "Catwoman"], ["cosplay", "Cosplay"], ["ebony", "Ebony"]];
  return labels.filter(([needle]) => raw.includes(needle)).map(([, label]) => label).join(" ");
}

function heightTag(heightCm) {
  if (heightCm < 155) return "height-under-155cm";
  if (heightCm < 160) return "height-155-159cm";
  if (heightCm < 165) return "height-160-164cm";
  if (heightCm < 170) return "height-165-169cm";
  return "height-170cm-plus";
}

function numberFromMeasurement(value) {
  const pounds = String(value || "").match(/([\d.]+)\s*(?:lb|lbs)/i);
  if (pounds) return Number(pounds[1]);
  const kilograms = String(value || "").match(/([\d.]+)\s*kg/i);
  return kilograms ? Math.round(Number(kilograms[1]) * 2.20462 * 10) / 10 : undefined;
}

function roundRetailPrice(value) { return Math.round(value); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function shortHash(value) { return createHash("sha1").update(String(value)).digest("hex").slice(0, 7); }
function normalize(value) { return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function slugify(value) { return normalize(value); }
function cleanText(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }
function cleanTitle(value) {
  return cleanText(value)
    .replace(/\bCompanion Doll\s+Companion Doll\b/i, "Companion Doll")
    .replace(/\bSilicone head\b/g, "Silicone Head")
    .trim();
}
function titleCase(value) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function parseArgs(values) { const parsed = {}; for (let index = 0; index < values.length; index += 1) { if (!values[index].startsWith("--")) continue; const key = values[index].slice(2); const next = values[index + 1]; parsed[key] = !next || next.startsWith("--") ? true : next; if (parsed[key] !== true) index += 1; } return parsed; }
