import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const reviewPath = path.resolve(ROOT, args.review || path.join("data", "exports", "rosretty-review-manifest.json"));
const officialPath = path.resolve(ROOT, args.official || path.join("data", "imports", "rosretty-official.json"));
const referencePath = path.resolve(ROOT, args.reference || path.join("data", "imports", "rosretty-yourdoll.json"));
const outputPath = path.resolve(
  ROOT,
  args.output || path.join("data", "exports", `rosretty-approved-preview-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
);
const reportPath = outputPath.replace(/\.json$/, ".report.json");

const [review, officialSource, referenceSource] = await Promise.all([
  readJson(reviewPath),
  readProducts(officialPath),
  readProducts(referencePath)
]);

const officialByUrl = new Map(officialSource.map((product) => [product.sourceUrl, product]));
const referenceByUrl = new Map(referenceSource.map((product) => [product.sourceUrl, product]));
const approvedPairs = (review.products || []).filter((product) => product.status === "approved-for-import" && product.visualReview?.state === "approved");

const products = approvedPairs.map((pair, index) => {
  const official = officialByUrl.get(pair.official?.sourceUrl);
  const reference = referenceByUrl.get(pair.visualReview?.candidateUrl);
  if (!official || !reference) {
    throw new Error(`Approved Rosretty pair is missing its source record: ${pair.official?.sourceUrl || "unknown"}`);
  }
  return mapProduct(official, reference, pair, index + 1);
});

const report = {
  generatedAt: new Date().toISOString(),
  policy: "This is a draft-only review preview. It contains only gallery pairs explicitly approved by a reviewer. Do not publish or import this file until price and product-specific customization review are complete.",
  sourceFiles: { reviewPath, officialPath, referencePath },
  totals: {
    reviewedPairs: (review.products || []).length,
    approvedPairs: products.length,
    officialImagesKept: products.reduce((total, product) => total + product.images.length, 0),
    productsNeedingCustomizationReview: products.filter((product) => product.reviewFlags.includes("yourdoll-options-must-be-mapped-before-import")).length
  },
  products: products.map((product) => ({
    handle: product.handle,
    title: product.title,
    officialUrl: product.sourceUrl,
    yourDollReferenceUrl: product.referenceUrl,
    officialPrice: product.sourcePrice,
    yourDollPrice: product.referencePrice,
    previewPrice: product.priceRange.minVariantPrice.amount,
    imageCount: product.images.length,
    reviewFlags: product.reviewFlags
  }))
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(ROOT, outputPath), report: path.relative(ROOT, reportPath), totals: report.totals }, null, 2));

function mapProduct(official, reference, pair, releaseRank) {
  const sourceTitle = cleanText(official.title);
  const referenceTitle = cleanText(reference.title);
  const name = extractDisplayName(sourceTitle) || extractDisplayName(referenceTitle) || "Rosretty Doll";
  const heightCm = numberOrNull(official.heightCm) || heightFrom(sourceTitle) || heightFrom(referenceTitle);
  const material = materialFrom(`${official.material || ""} ${sourceTitle}`) || materialFrom(`${reference.material || ""} ${referenceTitle}`);
  const cupSize = cupFrom(official.cupSize || sourceTitle) || cupFrom(reference.cupSize || referenceTitle);
  const bodyType = /\bmale\b|man doll/i.test(`${sourceTitle} ${referenceTitle}`) ? "male" : "female";
  const images = officialImages(official, `${name} ${heightCm || ""}cm ${material || ""}`);
  const officialPrice = amountFrom(official.price);
  const referencePrice = amountFrom(reference.price);
  // The lower of the two public reference prices is only a non-binding preview price.
  // A manager still chooses the final retail before this product can enter Shopify.
  const previewPrice = Math.max(0, Math.min(...[officialPrice, referencePrice].filter(Boolean)) || officialPrice || referencePrice || 0);
  const measurements = normalizeMeasurements(official.specs || official.measurements || {});
  const title = cleanTitle(`Rosretty ${name} ${heightCm ? `${heightCm}cm` : ""} ${cupSize || ""} ${material || ""} ${bodyType === "male" ? "Male" : ""} Companion Doll`);
  const headModel = inferHeadModel(official.sku, referenceTitle);

  return {
    title,
    handle: slugify(`rosretty-${name}-${heightCm || ""}cm-${cupSize || ""}-${material || ""}-${shortHash(official.sourceUrl)}`),
    description: publicDescription({ name, heightCm, material, cupSize, bodyType }),
    vendor: "Rosretty",
    productType: "Companion doll",
    tags: unique([
      "rosretty", "rosretty-dolls", "factory_order", "customizable",
      bodyType === "male" ? "male-dolls" : "female-dolls",
      material ? slugify(material) : "",
      heightCm ? heightTag(heightCm) : "",
      cupSize ? slugify(cupSize) : ""
    ]),
    images,
    featuredImage: images[0] || null,
    variants: [{
      id: "source-default",
      title: "Default",
      availableForSale: true,
      price: { amount: String(previewPrice), currencyCode: "USD" },
      selectedOptions: []
    }],
    priceRange: {
      minVariantPrice: { amount: String(previewPrice), currencyCode: "USD" },
      maxVariantPrice: { amount: String(previewPrice), currencyCode: "USD" }
    },
    sourceUrl: official.sourceUrl,
    sourceTitle,
    sourceHandle: official.sku || slugify(name),
    referenceUrl: reference.sourceUrl,
    referenceTitle,
    sourcePrice: officialPrice || null,
    referencePrice: referencePrice || null,
    publishedAt: official.publishedAt || official.published_at || null,
    reviewFlags: [
      "visual-pair-approved",
      "draft-only-price-preview-requires-manager-confirmation",
      "yourdoll-options-must-be-mapped-before-import"
    ],
    seo: {
      title: cleanTitle(`Rosretty ${name} ${heightCm ? `${heightCm}cm` : ""} ${material || ""} Doll | DollWow`),
      description: cleanText(`Explore the Rosretty ${name}${heightCm ? ` ${heightCm}cm` : ""}${material ? ` ${material.toLowerCase()}` : ""} doll with product photos, measurements, and configuration details at DollWow.`).slice(0, 155)
    },
    extended: {
      catalogIdentityKey: slugify(["rosretty", headModel || name, heightCm, cupSize, material].filter(Boolean).join("-")),
      catalogBodyIdentityKey: slugify(["rosretty", heightCm, cupSize, material, bodyType, "full"].filter(Boolean).join("-")),
      displayName: name,
      headModel,
      bodyType,
      brand: "Rosretty",
      material,
      heightCm,
      weightLb: weightLbFrom(measurements.weight),
      cupSize,
      measurements,
      warehouseCountry: null,
      stockStatus: "custom",
      deliveryEstimate: "Usually 3-5 weeks from order to delivery",
      stockLastCheckedAt: new Date().toISOString(),
      customAvailable: false,
      customizationGroups: [],
      sourceReleaseRank: releaseRank,
      sourceBasePrice: officialPrice || null,
      qcNote: "Product-specific configuration and final availability are confirmed before fulfillment.",
      provenance: {
        officialSource: official.sourceUrl,
        officialMedia: "Rosretty official storefront",
        referenceSource: reference.sourceUrl,
        visualReview: pair.visualReview?.note || "Approved official/reference gallery pair"
      }
    }
  };
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readProducts(filePath) {
  const payload = await readJson(filePath);
  const products = Array.isArray(payload) ? payload : payload.products;
  if (!Array.isArray(products)) throw new Error(`${filePath} must contain a products array.`);
  return products;
}

function officialImages(product, altText) {
  const raw = [...(product.imageUrls || []), ...(product.images || [])]
    .map((image) => typeof image === "string" ? image : image?.url || image?.src)
    .filter(Boolean);
  const valid = raw.filter((url) => {
    try {
      const parsed = new URL(url);
      return /img\.staticdj\.com$/i.test(parsed.hostname) && !/_(?:120|160|180|240|300|360|400|480|600)x/i.test(parsed.pathname);
    } catch {
      return false;
    }
  });
  return unique(valid).slice(0, 24).map((url) => ({ url, altText, width: null, height: null }));
}

function normalizeMeasurements(source) {
  return Object.fromEntries(Object.entries(source || {}).map(([key, value]) => [cleanText(key), cleanText(value)]).filter(([, value]) => value));
}

function extractDisplayName(title) {
  const tail = cleanText(title).split(/\s[-–—]\s/).at(-1)?.replace(/\s*\|.*$/, "").trim();
  return tail && /^[\p{L}][\p{L}' -]{1,40}$/u.test(tail) ? titleCase(tail) : "";
}

function heightFrom(value) {
  return numberOrNull(String(value).match(/\b(\d{2,3})\s*cm\b/i)?.[1]);
}

function cupFrom(value) {
  const match = String(value || "").match(/\b([A-Z])\s*-?\s*Cup\b/i);
  return match ? `${match[1].toUpperCase()}-Cup` : null;
}

function materialFrom(value) {
  const text = String(value || "").toLowerCase();
  if (/full silicone|silicone body/.test(text)) return "Silicone";
  if (/silicone head/.test(text)) return "Silicone head";
  if (/\btpe\b/.test(text)) return "TPE";
  if (/silicone/.test(text)) return "Silicone";
  return null;
}

function inferHeadModel(sku, title) {
  const source = `${sku || ""} ${title || ""}`.toUpperCase();
  return source.match(/\b(?:HEAD\s*)?(S\d{1,3})\b/)?.[1] || null;
}

function amountFrom(value) {
  const amount = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function weightLbFrom(value) {
  const kilograms = Number(String(value || "").match(/(\d+(?:\.\d+)?)\s*kg/i)?.[1]);
  return Number.isFinite(kilograms) ? Math.round(kilograms * 2.20462 * 10) / 10 : null;
}

function publicDescription({ name, heightCm, material, cupSize, bodyType }) {
  const details = [heightCm ? `${heightCm} cm` : null, material, cupSize].filter(Boolean).join(", ");
  const pronoun = bodyType === "male" ? "him" : "her";
  return `Meet ${name}, a Rosretty ${bodyType === "male" ? "male" : "female"} companion doll${details ? ` listed with ${details}` : ""}. Review the product gallery, measurements, and available configuration choices before ordering ${pronoun}.`;
}

function heightTag(heightCm) {
  if (heightCm < 155) return "height-under-155cm";
  if (heightCm < 160) return "height-155-159cm";
  if (heightCm < 165) return "height-160-164cm";
  if (heightCm < 170) return "height-165-169cm";
  return "height-170cm-plus";
}

function cleanTitle(value) {
  return cleanText(value).replace(/\s+/g, " ").trim();
}

function cleanText(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function shortHash(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 5);
}

function titleCase(value) {
  return String(value).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseArgs(values) {
  const output = {};
  for (let index = 0; index < values.length; index += 1) {
    if (values[index].startsWith("--")) output[values[index].slice(2)] = values[index + 1];
  }
  return output;
}
