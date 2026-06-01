import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT_DIR = path.join(ROOT, "data", "exports");

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const inputPath = path.resolve(ROOT, args.input || (await findLatestImport()));
const outputDir = path.resolve(ROOT, args.outDir || DEFAULT_OUT_DIR);
const vendor = args.vendor || "DollWow";
const status = args.status || "draft";
const publish = args.publish === "true";

const importData = JSON.parse(await fs.readFile(inputPath, "utf8"));
const products = dedupeProducts(importData.products || []);
const preparedAt = new Date().toISOString();
const basename = path.basename(inputPath, ".json");
const csvPath = path.join(outputDir, `${basename}-shopify-products.csv`);
const previewPath = path.join(outputDir, `${basename}-storefront-products.json`);
const reportPath = path.join(outputDir, `${basename}-review-report.json`);

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(csvPath, buildShopifyCsv(products, { vendor, status, publish }), "utf8");
await fs.writeFile(previewPath, JSON.stringify(products.map((product) => toStorefrontProduct(product, vendor)), null, 2), "utf8");
await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      sourceFile: path.relative(ROOT, inputPath),
      preparedAt,
      productCount: products.length,
      csv: path.relative(ROOT, csvPath),
      storefrontPreview: path.relative(ROOT, previewPath),
      warnings: products.flatMap((product) => reviewWarnings(product))
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Prepared ${products.length} products from ${path.relative(ROOT, inputPath)}`);
console.log(`Shopify CSV: ${path.relative(ROOT, csvPath)}`);
console.log(`Storefront preview: ${path.relative(ROOT, previewPath)}`);
console.log(`Review report: ${path.relative(ROOT, reportPath)}`);

async function findLatestImport() {
  const importDir = path.join(ROOT, "data", "imports");
  const entries = await fs.readdir(importDir);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.startsWith("rosemary-") && entry.endsWith(".json"))
      .map(async (entry) => {
        const file = path.join(importDir, entry);
        const stat = await fs.stat(file);
        return { file, mtimeMs: stat.mtimeMs };
      })
  );
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files[0]) throw new Error("No Rosemary import JSON found. Run npm run scrape:rosemary first.");
  return files[0].file;
}

function dedupeProducts(products) {
  const byHandle = new Map();
  for (const product of products) {
    if (!product?.handle) continue;
    byHandle.set(product.handle, product);
  }
  return [...byHandle.values()];
}

function buildShopifyCsv(products, options) {
  const headers = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Status"
  ];
  const rows = [headers];

  for (const product of products) {
    const images = product.imageUrls?.filter(isCatalogImage)?.length ? product.imageUrls.filter(isCatalogImage) : [""];
    images.forEach((imageUrl, imageIndex) => {
      const isProductRow = imageIndex === 0;
      rows.push([
        product.handle,
        isProductRow ? product.title : "",
        isProductRow ? productBodyHtml(product) : "",
        isProductRow ? options.vendor : "",
        isProductRow ? "Adult > Adult Products" : "",
        isProductRow ? productType(product) : "",
        isProductRow ? productTags(product).join(", ") : "",
        isProductRow ? String(options.publish).toUpperCase() : "",
        isProductRow ? "Configuration" : "",
        isProductRow ? baseConfigurationLabel(product) : "",
        isProductRow ? skuFor(product) : "",
        isProductRow ? gramsFor(product) : "",
        isProductRow ? "shopify" : "",
        isProductRow ? inventoryQty(product) : "",
        isProductRow ? "deny" : "",
        isProductRow ? "manual" : "",
        isProductRow ? product.price || "" : "",
        "",
        isProductRow ? "TRUE" : "",
        isProductRow ? "TRUE" : "",
        imageUrl,
        imageUrl ? String(imageIndex + 1) : "",
        imageUrl ? product.title : "",
        isProductRow ? "FALSE" : "",
        isProductRow ? seoTitle(product) : "",
        isProductRow ? seoDescription(product) : "",
        isProductRow ? options.status : ""
      ]);
    });
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function toStorefrontProduct(product, vendor) {
  const amount = String(product.price || "0");
  const material = inferMaterial(product);
  return {
    id: `gid://shopify/Product/import-${product.handle}`,
    handle: product.handle,
    title: product.title,
    description: product.description,
    vendor,
    productType: productType(product),
    tags: productTags(product),
    featuredImage: product.imageUrls?.filter(isCatalogImage)?.[0] ? image(product.imageUrls.filter(isCatalogImage)[0], product.title) : null,
    images: (product.imageUrls || []).filter(isCatalogImage).map((url) => image(url, product.title)),
    variants: [
      {
        id: `gid://shopify/ProductVariant/import-${product.handle}`,
        title: baseConfigurationLabel(product),
        availableForSale: true,
        price: { amount, currencyCode: product.currency || "USD" },
        selectedOptions: [{ name: "Configuration", value: baseConfigurationLabel(product) }]
      }
    ],
    priceRange: {
      minVariantPrice: { amount, currencyCode: product.currency || "USD" },
      maxVariantPrice: { amount, currencyCode: product.currency || "USD" }
    },
    extended: {
      brand: product.brand,
      material,
      heightCm: product.specs?.heightCm || null,
      weightLb: product.specs?.weightLb || null,
      cupSize: product.specs?.cupSize || "",
      warehouseCountry: product.warehouseCountry || (product.stockStatus === "custom" ? "Factory order" : null),
      stockStatus: product.stockStatus || "check_stock",
      deliveryEstimate: product.stockStatus === "ready_to_ship" ? "Fast shipping after stock confirmation" : "4-8 weeks",
      stockLastCheckedAt: product.importedAt || new Date().toISOString(),
      customAvailable: Boolean(product.customAvailable),
      customizationGroups: normalizeCustomizationGroups(product.optionGroups || []),
      qcNote: `Prepared from ${product.sourceUrl}. Review supplier authorization, pricing, images, and option mapping before publish.`
    }
  };
}

function productBodyHtml(product) {
  const specs = [
    ["Brand", product.brand],
    ["Material", inferMaterial(product)],
    ["Height", product.specs?.heightCm ? `${product.specs.heightCm} cm` : ""],
    ["Weight", product.specs?.weightLb ? `${product.specs.weightLb} lb` : ""],
    ["Cup size", product.specs?.cupSize],
    ["Stock", product.stockStatus === "ready_to_ship" ? "Ready to ship after confirmation" : "Custom factory order"],
    ["Warehouse", product.warehouseCountry]
  ].filter(([, value]) => value);
  const specHtml = specs.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join("");
  const optionLabels = (product.optionGroupLabels || []).slice(0, 12);
  const optionImageCount = countOptionImages(product.optionGroups || []);
  const optionHtml = optionLabels.length
    ? `<p><strong>Customization groups to map:</strong> ${escapeHtml(optionLabels.join(", "))}</p>`
    : "";
  const optionImageHtml = optionImageCount
    ? `<p><strong>Customization option images captured:</strong> ${optionImageCount}</p>`
    : "";

  return [
    `<p>${escapeHtml(product.description || product.title)}</p>`,
    specHtml ? `<ul>${specHtml}</ul>` : "",
    optionHtml,
    optionImageHtml,
    `<p>Final availability, production options, and warehouse timing are confirmed by DollWow support before fulfillment.</p>`
  ]
    .filter(Boolean)
    .join("");
}

function reviewWarnings(product) {
  const warnings = [];
  const prefix = `${product.handle}:`;
  if (!product.price) warnings.push(`${prefix} missing price`);
  if (!product.imageUrls?.filter(isCatalogImage)?.length) warnings.push(`${prefix} missing catalog images`);
  if (/^custom full/i.test(product.title)) warnings.push(`${prefix} generic title should be reviewed`);
  if (product.stockStatus === "ready_to_ship" && !product.warehouseCountry) warnings.push(`${prefix} ready-to-ship item missing warehouse country`);
  if (product.customAvailable && !product.optionGroupLabels?.length) warnings.push(`${prefix} custom item has no option group labels`);
  if (product.customAvailable && !countOptionImages(product.optionGroups || [])) warnings.push(`${prefix} custom item has no captured option images`);
  return warnings;
}

function normalizeCustomizationGroups(groups) {
  return groups
    .filter(shouldExposeCustomizationGroup)
    .map((group) => ({
      id: group.id,
      label: group.label,
      description: `${group.label} options captured from supplier-style Rosemary option data. Final compatibility and pricing are confirmed before fulfillment.`,
      required: true,
      display: group.display === "swatches" ? "swatches" : "cards",
      options: (group.options || [])
        .filter((option) => option?.label)
        .map((option) => ({
          id: option.id || slugify(option.label),
          label: normalizeOptionLabel(option.label),
          priceDelta: Number(option.priceDelta || 0) || undefined,
          swatch: option.imageUrl
            ? {
                kind: "image",
                value: option.imageUrl,
                label: option.label
              }
            : undefined,
          productionNote: option.selected ? "Default supplier selection." : undefined
        }))
        .slice(0, 36)
    }))
    .filter((group) => group.id && group.label && group.options.length >= 2)
    .slice(0, 12);
}

function shouldExposeCustomizationGroup(group) {
  if (!group?.label) return false;
  if (/^other heads?$/i.test(group.label)) return false;
  if (/^heads?$/i.test(group.label) && ((group.options || []).length <= 3 || (group.options || []).some((option) => /other heads?/i.test(option.label)))) return false;
  return true;
}

function normalizeOptionLabel(label) {
  return cleanText(String(label || "").replace(/^No Change$/i, "Factory default"));
}

function countOptionImages(groups) {
  return groups.reduce((total, group) => total + (group.options || []).filter((option) => option.imageUrl).length, 0);
}

function productTags(product) {
  return unique([
    product.brandSlug,
    slugify(product.brand || ""),
    product.stockStatus,
    product.customAvailable ? "customizable" : null,
    inferMaterial(product).toLowerCase().replace(/\s+/g, "-"),
    product.warehouseCountry ? `warehouse-${slugify(product.warehouseCountry)}` : null
  ]).filter(Boolean);
}

function productType(product) {
  const material = inferMaterial(product);
  return product.stockStatus === "ready_to_ship" ? `Ready-to-ship ${material} doll` : `Custom ${material} doll`;
}

function baseConfigurationLabel(product) {
  return product.stockStatus === "ready_to_ship" ? "Listed ready-to-ship configuration" : "Base custom build";
}

function inferMaterial(product) {
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  if (text.includes("silicone head")) return "Silicone head";
  if (text.includes("silicone")) return "Silicone";
  if (text.includes("tpe")) return "TPE";
  return "Adult doll";
}

function inventoryQty(product) {
  return product.stockStatus === "ready_to_ship" ? "1" : "0";
}

function gramsFor(product) {
  const pounds = Number(product.specs?.weightLb || 0);
  return pounds ? String(Math.round(pounds * 453.59237)) : "";
}

function skuFor(product) {
  return unique(["DW", product.brandSlug, product.handle])
    .join("-")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 64);
}

function seoTitle(product) {
  return `${product.title} | DollWow`;
}

function seoDescription(product) {
  return cleanText(product.description || `${product.title} from DollWow`).slice(0, 155);
}

function image(url, altText) {
  return { url, altText, width: null, height: null };
}

function isCatalogImage(url) {
  return (
    Boolean(url) &&
    !/logo|favicon|placeholder|payment|paypal|visa|mastercard|klarna|afterpay|trust|reward|timeline|fedex|certificate|authorization/i.test(url) &&
    !/\/(?:us|ca|eu|uk|jp|au-1|nz-1)\.(?:jpe?g|png|webp)$/i.test(url)
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "help") {
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
  npm run prepare:rosemary-import
  npm run prepare:rosemary-import -- --input data/imports/rosemary-zelex-example.json
  npm run prepare:rosemary-import -- --input data/imports/rosemary-zelex-example.json --status draft --publish false

Reads a normalized Rosemary scrape JSON and writes review artifacts to data/exports/:
- Shopify CSV for draft product import
- Storefront-shaped JSON preview
- Review report with warnings`);
}
