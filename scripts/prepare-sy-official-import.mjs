import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "https://sydolls.com";
const args = parseArgs(process.argv.slice(2));
const brand = String(args.brand || "sy").toLowerCase();
const outputPath = path.resolve(
  ROOT,
  args.output || path.join("data", "exports", `${brand}-official-import-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
);
const reportPath = outputPath.replace(/\.json$/, ".report.json");
const limit = Math.max(0, Number(args.limit || 0));
const requestedHandles = new Set(String(args.handles || "").split(",").map((value) => value.trim()).filter(Boolean));
const concurrency = Math.min(8, Math.max(1, Number(args.concurrency || 4)));
const priceAdjustment = Number(args["price-adjustment"] ?? 100);

if (!Number.isFinite(priceAdjustment) || priceAdjustment < 0) {
  throw new Error("--price-adjustment must be a non-negative USD amount.");
}

if (!new Set(["sy", "moonvale"]).has(brand)) {
  throw new Error("Use --brand sy or --brand moonvale.");
}

const sourceProducts = await fetchCollectionProducts(brand === "moonvale" ? "/collections/moonvale-doll/products.json" : "/collections/all/products.json");
const usStock = await fetchCollectionProducts("/collections/sy-dolls-in-stock-us/products.json");
const euStock = await fetchCollectionProducts("/collections/sy-dolls-in-stock-eu/products.json");
const stockByHandle = new Map([
  ...usStock.map((product) => [product.handle, { country: "United States", collection: "SY Dolls In Stock US" }]),
  ...euStock.map((product) => [product.handle, { country: "Europe", collection: "SY Dolls In Stock EU" }])
]);

const catalog = sourceProducts
  .filter((product) => belongsToRequestedBrand(product, brand))
  .filter(isCatalogDoll)
  .filter((product) => !requestedHandles.size || requestedHandles.has(product.handle))
  .sort((left, right) => new Date(left.published_at) - new Date(right.published_at) || left.handle.localeCompare(right.handle));
const selected = limit ? catalog.slice(0, limit) : catalog;
const products = await mapWithConcurrency(selected, concurrency, async (product, index) => {
  const details = await fetchProductDetails(product.handle);
  return mapProduct(product, details, stockByHandle.get(product.handle), index + 1, priceAdjustment);
});
disambiguateDuplicateTitles(products);

const payload = products;
const report = {
  generatedAt: new Date().toISOString(),
  source: SOURCE,
  brand,
  totals: {
    sourceProducts: sourceProducts.length,
    catalogDolls: catalog.length,
    prepared: products.length,
    readyToShipUnitedStates: products.filter((product) => product.extended.warehouseCountry === "United States").length,
    readyToShipEurope: products.filter((product) => product.extended.warehouseCountry === "Europe").length,
    customOrder: products.filter((product) => product.extended.stockStatus === "custom").length,
    optionGroups: products.reduce((total, product) => total + product.extended.customizationGroups.length, 0),
    optionImageReferences: products.reduce(
      (total, product) => total + product.extended.customizationGroups.reduce((groupTotal, group) => groupTotal + group.options.filter((option) => option.swatch?.kind === "image").length, 0),
      0
    ),
    productsWithoutOptions: {
      count: products.filter((product) => !product.extended.customizationGroups.length).length,
      samples: products.filter((product) => !product.extended.customizationGroups.length).slice(0, 20).map((product) => product.handle)
    }
  },
  pricing: {
    currency: "USD",
    sourcePrice: "Official SY / Moonvale storefront price.",
    dollWowAdjustment: priceAdjustment,
    rationale: "Initial retail adjustment from sampled comparable YourDoll listings. Promotional or stock-only listings are not used as a per-product price override; review the generated product rows before publishing."
  },
  products: products.map((product) => ({
    handle: product.handle,
    title: product.title,
    sourceUrl: product.sourceUrl,
    publishedAt: product.publishedAt,
    sourcePrice: product.sourcePrice,
    price: product.priceRange.minVariantPrice.amount,
    stockStatus: product.extended.stockStatus,
    warehouseCountry: product.extended.warehouseCountry || null,
    imageCount: product.images.length,
    optionGroups: product.extended.customizationGroups.map((group) => ({ label: group.label, options: group.options.length }))
  }))
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(ROOT, outputPath), report: path.relative(ROOT, reportPath), totals: report.totals }, null, 2));

async function fetchCollectionProducts(collectionPath) {
  const products = [];
  for (let page = 1; page < 100; page += 1) {
    const url = new URL(collectionPath, SOURCE);
    url.searchParams.set("limit", "250");
    url.searchParams.set("page", String(page));
    const response = await fetchWithRetry(url);
    if (!response.ok) throw new Error(`Unable to fetch ${url}: ${response.status}`);
    const payload = await response.json();
    const pageProducts = Array.isArray(payload.products) ? payload.products : [];
    products.push(...pageProducts);
    if (pageProducts.length < 250) break;
  }
  return uniqueBy(products, (product) => product.handle);
}

function belongsToRequestedBrand(product, requestedBrand) {
  const vendor = normalize(product.vendor);
  return requestedBrand === "moonvale" ? vendor === "moonvale-doll" : vendor === "sy-doll";
}

function isCatalogDoll(product) {
  const title = normalize(product.title);
  const excluded = /(?:avis-option|accessor|extra-wig|stand-option|additional-payment|gift-card|shipping-protection|repair-kit|cleaning-kit|storage-case|doll-head-for-sex-dolls|alternative-silicone-head|body-option|chest-hair|closable-eyes|option-set|makeup-option|wig-option)/;
  const looksLikeDoll = /(?:\b\d{2,3}\s*cm\b|torso)/i.test(product.title) && /doll|torso/i.test(product.title);
  return Boolean(product.handle)
    && (product.images || []).length > 0
    && looksLikeDoll
    && !excluded.test(normalize(product.handle))
    && !excluded.test(title);
}

async function fetchProductDetails(handle) {
  const response = await fetchWithRetry(`${SOURCE}/products/${handle}`);
  if (!response.ok) return { measurements: {}, options: [], fetchError: `HTTP ${response.status}` };
  const html = await response.text();
  return {
    measurements: parseMeasurements(html),
    options: parseAvisOptions(html),
    fetchError: null
  };
}

async function fetchWithRetry(url, retries = 4) {
  let response;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    response = await fetch(url, { headers: { "User-Agent": "DollWow authorized catalog importer/1.0" } });
    if (response.ok || (response.status !== 429 && response.status < 500)) return response;
    if (attempt < retries) await wait(750 * (attempt + 1));
  }
  return response;
}

function mapProduct(source, details, stock, releaseRank, retailAdjustment) {
  const identity = identityFrom(source);
  const label = source.vendor === "Moonvale Doll" ? "Moonvale" : "SY Doll";
  const sourceTitle = cleanText(source.title);
  const title = cleanTitle(`${label} ${identity.displayName} ${identity.heightCm ? `${identity.heightCm}cm` : ""} ${identity.cupSize || ""} ${identity.material || ""} ${identity.isTorso ? "Torso" : "Companion Doll"}`);
  const sourcePrice = Number(source.variants?.map((variant) => Number(variant.price)).filter(Number.isFinite).sort((a, b) => a - b)[0] || 0);
  const price = sourcePrice ? roundRetailPrice(sourcePrice + retailAdjustment) : 0;
  const images = (source.images || []).map((image) => ({
    url: image.src,
    altText: cleanText(image.alt || title),
    width: image.width || null,
    height: image.height || null
  }));
  const stockStatus = stock ? "ready_to_ship" : "custom";
  const extended = {
    catalogIdentityKey: identity.catalogIdentityKey,
    catalogBodyIdentityKey: identity.catalogBodyIdentityKey,
    displayName: identity.displayName,
    headModel: identity.headModel,
    bodyType: identity.bodyType,
    brand: source.vendor === "Moonvale Doll" ? "Moonvale" : "SY Dolls",
    material: identity.material,
    heightCm: identity.heightCm,
    weightLb: numberFromMeasurement(details.measurements["Weight"] || details.measurements["Net Weight"]),
    cupSize: identity.cupSize,
    measurements: details.measurements,
    warehouseCountry: stock?.country,
    stockStatus,
    deliveryEstimate: stock ? "Ships within 1-3 business days after stock confirmation" : "Usually 3-5 weeks from order to delivery",
    stockLastCheckedAt: new Date().toISOString(),
    customAvailable: Boolean(details.options.length),
    customizationGroups: details.options,
    sourceReleaseRank: releaseRank,
    sourceBasePrice: sourcePrice,
    qcNote: stock ? "Ready-to-ship inventory is confirmed before release." : "Factory photos are shared for approval before shipment when available for this custom build."
  };
  const tags = unique([
    source.vendor === "Moonvale Doll" ? "moonvale-dolls" : "sy-dolls",
    stock ? "ready_to_ship" : "factory_order",
    stock?.country ? `warehouse-${slugify(stock.country)}` : "",
    identity.bodyType === "male" ? "male-dolls" : "female-dolls",
    identity.isTorso ? "torso" : "full-size",
    identity.material ? slugify(identity.material) : "",
    identity.heightCm ? heightTag(identity.heightCm) : "",
    identity.cupSize ? slugify(identity.cupSize) : "",
    ...safeTags(source.tags)
  ]);
  return {
    title,
    handle: slugify(`${label}-${identity.displayName}-${identity.heightCm || ""}cm-${identity.cupSize || ""}-${identity.material || ""}-${shortHash(source.handle)}`),
    description: publicDescription(identity, stockStatus),
    vendor: source.vendor === "Moonvale Doll" ? "Moonvale" : "SY Dolls",
    productType: identity.isTorso ? "Torso doll" : "Companion doll",
    tags,
    images,
    featuredImage: images[0] || null,
    variants: [{
      id: "source-default",
      title: "Default",
      availableForSale: true,
      price: { amount: String(price), currencyCode: "USD" },
      selectedOptions: []
    }],
    priceRange: { minVariantPrice: { amount: String(price), currencyCode: "USD" }, maxVariantPrice: { amount: String(price), currencyCode: "USD" } },
    sourceUrl: `${SOURCE}/products/${source.handle}`,
    sourceTitle,
    sourceHandle: source.handle,
    sourcePrice,
    sourceEdition: editionFrom(sourceTitle),
    publishedAt: source.published_at,
    reviewFlags: [
      ...(details.fetchError ? ["official-product-page-fetch-failed"] : []),
      ...(!details.fetchError && stockStatus === "custom" && !details.options.length ? ["official-custom-options-not-exposed"] : [])
    ],
    extended
  };
}

function identityFrom(source) {
  const raw = cleanText(source.title);
  const heightCm = Number(raw.match(/(\d{2,3})\s*cm/i)?.[1]) || undefined;
  const cupMatch = raw.match(/([A-Z](?:\+|\-|\s*)?Cup)/i);
  const cupSize = cupMatch ? cupMatch[1].replace(/\s+/g, "-").replace(/cup/i, "Cup") : undefined;
  const material = /silicone head/i.test(raw) ? "Silicone head" : /(?:full silicone|silicone body|\bsilicone\b)/i.test(raw) ? "Silicone" : /tpe/i.test(raw) ? "TPE" : undefined;
  const headModel = raw.match(/(?:head\s*#?|head\s*)([A-Za-z0-9-]{1,12})/i)?.[1];
  const displayName = extractDisplayName(raw) || extractNameFromHandle(source.handle) || "SY Doll";
  const isTorso = /torso|half body|upper body/i.test(raw);
  const bodyType = /\bmale\b|man\s*doll|for men/i.test(raw) ? "male" : "female";
  return {
    displayName,
    heightCm,
    cupSize,
    material,
    headModel,
    bodyType,
    isTorso,
    catalogIdentityKey: slugify([source.vendor, heightCm, cupSize, material, headModel || displayName].filter(Boolean).join("-")),
    catalogBodyIdentityKey: slugify([source.vendor, heightCm, cupSize, material, bodyType, isTorso ? "torso" : "full"].filter(Boolean).join("-"))
  };
}

function extractDisplayName(raw) {
  const normalized = cleanText(raw)
    .replace(/\bSY\s*DOLL\b\s*\|?/gi, "")
    .replace(/\b(?:in stock|us|eu)\b/gi, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
  const tail = normalized.split(/[-–—|]/).at(-1)?.trim().replace(/[.]+$/, "");
  if (tail && /^[\p{L}][\p{L}'& ]{1,42}$/u.test(tail)) return titleCase(tail);
  const beforeMeasurements = normalized.split(/\b\d{2,3}\s*cm\b/i)[0].trim();
  const simpleName = beforeMeasurements.match(/^([A-Za-z][A-Za-z' -]{1,42})$/);
  return simpleName?.[1] ? titleCase(simpleName[1].trim()) : "";
}

function extractNameFromHandle(handle) {
  const parts = String(handle || "").toLowerCase().split("-").filter(Boolean);
  const marker = Math.max(parts.lastIndexOf("doll"), parts.lastIndexOf("torso"));
  const ignored = new Set(["in", "stock", "us", "eu", "new", "copy", "realistic", "silicone", "tpe", "sex"]);
  const candidate = parts
    .slice(marker >= 0 ? marker + 1 : -2)
    .filter((part) => !ignored.has(part) && !/^\d+$/.test(part))
    .slice(0, 3)
    .join(" ");
  return /^[a-z][a-z' ]{1,42}$/i.test(candidate) ? titleCase(candidate) : "";
}

function disambiguateDuplicateTitles(products) {
  const byTitle = new Map();
  for (const product of products) {
    const key = normalize(product.title);
    const matches = byTitle.get(key) || [];
    matches.push(product);
    byTitle.set(key, matches);
  }

  for (const matches of byTitle.values()) {
    if (matches.length < 2) continue;
    const used = new Set();
    for (const [index, product] of matches.entries()) {
      const base = product.title.replace(/\s+Companion Doll$/i, "");
      let edition = product.sourceEdition;
      if (!edition || used.has(normalize(edition))) edition = `Style ${index + 1}`;
      used.add(normalize(edition));
      product.title = cleanTitle(`${base} - ${edition} Companion Doll`);
      product.description = `${product.description.replace(/\.$/, "")} This listing is presented as the ${edition.toLowerCase()} style.`;
    }
  }
}

function editionFrom(sourceTitle) {
  const raw = cleanText(sourceTitle).toLowerCase();
  const labels = [
    ["blonde", "Blonde"], ["brunette", "Brunette"], ["black hair", "Black Hair"], ["red hair", "Red Hair"], ["pink hair", "Pink Hair"], ["silver hair", "Silver Hair"],
    ["white leopard", "White Leopard"], ["yellow leopard", "Yellow Leopard"], ["black panther", "Black Panther"], ["white panther", "White Panther"],
    ["red fox", "Red Fox"], ["white fox", "White Fox"], ["deer", "Deer"], ["catwoman", "Catwoman"], ["nurse", "Nurse"],
    ["cheerleader", "Cheerleader"], ["cowgirl", "Cowgirl"], ["office lady", "Office"], ["christmas", "Christmas"], ["halloween", "Halloween"],
    ["sporty", "Sporty"], ["homebody", "Homebody"], ["cosplay", "Cosplay"], ["anime", "Anime"]
  ];
  const found = labels.filter(([needle]) => raw.includes(needle)).map(([, label]) => label);
  return unique(found).slice(0, 2).join(" ");
}

function parseMeasurements(html) {
  const decoded = decodeEscapedMarkup(html);
  const labels = [
    "Brand", "Material", "Height", "Arm Length", "Bust", "Leg Length", "Waist", "Foot Length", "Hip", "Vaginal Depth", "Shoulder Width", "Anal Depth", "Net Weight", "Oral Depth", "Gross Weight", "Cup Size", "Weight",
    "Neck Circumference", "Upper Arm Circumference", "Forearm Circumference", "Palm Length", "Thigh Circumference", "Calf Circumference", "Nipple Depth"
  ];
  const measurements = {};
  const cells = [...decoded.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => cleanText(match[1]));
  for (const cell of cells) {
    const match = cell.match(/^([A-Za-z ]{3,24}):\s*(.+)$/);
    if (!match) continue;
    const label = labels.find((candidate) => normalize(candidate) === normalize(match[1]));
    if (label && match[2].length <= 100) measurements[canonicalMeasurementLabel(label)] = match[2];
  }
  const detailItems = [...decoded.matchAll(/<strong\b[^>]*>\s*([^<:：]+?)\s*[:：]?\s*<\/strong>\s*[:：]?\s*([\s\S]{1,120}?)(?=<br\b|<\/li>|<strong\b|<\/p>|<\/div>|$)/gi)];
  for (const item of detailItems) {
    const rawLabel = cleanText(item[1]);
    const value = cleanText(item[2]).replace(/^[:：]\s*/, "");
    const label = labels.find((candidate) => normalize(candidate) === normalize(rawLabel));
    if (label && value && value.length <= 100) measurements[canonicalMeasurementLabel(label)] = value;
  }
  return measurements;
}

function parseAvisOptions(html) {
  const marker = 'window.ap_front_settings.config["optionset"].push(';
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const objectStart = start + marker.length;
  const json = balancedObject(html, objectStart);
  if (!json) return [];
  try {
    const optionSet = JSON.parse(json);
    return (optionSet.options || []).map(mapAvisGroup).filter((group) => group.options.length > 0);
  } catch {
    return [];
  }
}

function mapAvisGroup(source) {
  const values = Array.isArray(source.option_values) ? source.option_values : [];
  const selectionMode = String(source.allow_multiple) === "true" ? "multiple" : "single";
  const groupLabel = cleanText(source.label_product || source.label_cart || "Customization option");
  return {
    id: slugify(source.key || source.option_id || groupLabel),
    label: groupLabel,
    required: false,
    selectionMode,
    display: values.some((value) => value.swatch?.file_image_url) ? "cards" : values.length > 7 ? "compact" : "cards",
    options: values.map((value) => ({
      id: slugify(value.value_id || value.handle || value.value),
      label: cleanText(value.value || "Option"),
      priceDelta: Number(value.price) || 0,
      swatch: value.swatch?.file_image_url
        ? { kind: "image", value: value.swatch.file_image_url, label: cleanText(value.value || "Option") }
        : value.swatch?.color
          ? { kind: "color", value: value.swatch.color, label: cleanText(value.value || "Option") }
          : { kind: "text", value: cleanText(value.value || "Option") }
    })).filter((option) => option.id && option.label)
  };
}

function balancedObject(value, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return value.slice(start, index + 1);
  }
  return null;
}

async function mapWithConcurrency(items, max, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await mapper(items[index], index);
      if ((index + 1) % 10 === 0 || index + 1 === items.length) console.log(`Prepared ${index + 1}/${items.length}`);
    }
  }));
  return output;
}

function publicDescription(identity, stockStatus) {
  const parts = [identity.heightCm ? `${identity.heightCm} cm` : "", identity.material, identity.cupSize].filter(Boolean).join(", ");
  if (stockStatus === "ready_to_ship") {
    return `${identity.displayName}${parts ? ` is a ready-to-ship listing in ${parts}.` : " is a ready-to-ship listing."} Measurements and current availability are shown below.`;
  }
  return `${identity.displayName}${parts ? ` is listed in ${parts}.` : " is listed here."} Browse the full measurements and available configuration choices for this model below.`;
}

function canonicalMeasurementLabel(label) {
  return {
    "Net Weight": "Weight",
    "Cup Size": "Cup size",
    "Shoulder Width": "Shoulders Width",
    "Foot Length": "Feet Length",
    "Arm Length": "Arms Length",
    "Leg Length": "Legs Length"
  }[label] || label;
}

function numberFromMeasurement(value) {
  const match = String(value || "").match(/([\d.]+)\s*(?:lb|lbs)/i);
  if (match) return Number(match[1]);
  const kg = String(value || "").match(/([\d.]+)\s*kg/i);
  return kg ? Math.round(Number(kg[1]) * 2.20462 * 10) / 10 : undefined;
}

function safeTags(tags) {
  return String(tags || "").split(",").map(normalize).filter((tag) => /^(?:male|female|tpe|silicone|silicone-head|full-silicone|torso|in-stock|us-in-stock|eu-in-stock)$/.test(tag));
}

function heightTag(heightCm) {
  if (heightCm < 155) return "height-under-155cm";
  if (heightCm < 160) return "height-155-159cm";
  if (heightCm < 165) return "height-160-164cm";
  if (heightCm < 170) return "height-165-169cm";
  return "height-170cm-plus";
}

function roundRetailPrice(value) {
  return Math.round(Number(value) || 0);
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }
function uniqueBy(values, key) { return [...new Map(values.map((value) => [key(value), value])).values()]; }
function shortHash(value) { return createHash("sha1").update(String(value)).digest("hex").slice(0, 7); }
function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].startsWith("--")) continue;
    const key = values[index].slice(2);
    const next = values[index + 1];
    parsed[key] = !next || next.startsWith("--") ? true : next;
    if (parsed[key] !== true) index += 1;
  }
  return parsed;
}
function normalize(value) { return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function slugify(value) { return normalize(value); }
function cleanText(value) { return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }
function cleanTitle(value) { return cleanText(value).replace(/\b(?:Sex Doll|Realistic Sex Doll)\b/gi, "Companion Doll").replace(/\bCompanion Doll\s+Companion Doll\b/i, "Companion Doll").trim(); }
function titleCase(value) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function decodeEscapedMarkup(value) { return String(value).replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">").replace(/\\u0026/gi, "&").replace(/\\\//g, "/"); }
function decodeHtml(value) { return decodeEscapedMarkup(value).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&#(?:x[\da-f]+|\d+);/gi, " "); }
function wait(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
