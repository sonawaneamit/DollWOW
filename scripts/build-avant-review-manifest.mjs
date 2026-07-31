import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(process.argv.slice(2).map((value, index, list) => [value, list[index + 1]]));
const auditPath = path.resolve(args.get("--audit") || path.join(ROOT, "data/exports/avant-source-audit.json"));
const priceWorkbook = path.resolve(args.get("--price-workbook") || "/tmp/avant-sheets-0731/AvantDoll Full Silicone Doll Price List.xlsx");
const specsWorkbook = path.resolve(args.get("--specs-workbook") || "/tmp/avant-sheets-0731/AvantDoll Silicone Doll Body Specifications.xlsx");
const outputPath = path.resolve(args.get("--output") || path.join(ROOT, "data/exports/avant-review-manifest.json"));

// Public listings are references only. Manufacturer files remain the authority
// for media, specifications, and product identity.
const PUBLIC_REFERENCE_OVERRIDES = {
  Clara: {
    source: "YourDoll",
    url: "https://www.yourdoll.com/product/sex-doll-avt007/",
    status: "media-count-mismatch",
    publicImageCount: 23,
    notes: [
      "The official Avant Clara gallery contains 33 images.",
      "The current YourDoll reference displays 23 images; retain the complete official gallery and review the public listing for any additional configuration detail."
    ]
  }
};

// The workbook's merged cells make rows 4-6 inconsistent in raw XML. These
// values are transcribed from Avant's supplied price and shipping workbook and
// retain the workbook as the commercial source of truth.
const WORKBOOK_PRICE_TIERS = [
  { heightCm: 157, cupSize: "E-Cup", supplierCostUsd: 850, minimumAdvertisedUsd: 2099 },
  { heightCm: 158, cupSize: "H-Cup", supplierCostUsd: 860, minimumAdvertisedUsd: 2099 },
  { heightCm: 165, cupSize: "F-Cup", supplierCostUsd: 850, minimumAdvertisedUsd: 2099 },
  { heightCm: 166, cupSize: "D-Cup", supplierCostUsd: 860, minimumAdvertisedUsd: 2099 }
];

const WORKBOOK_SHIPPING_USD = {
  157: { usStandard: 245, usAir: 450, ukAir: 530, euStandard: 245, euAir: 465 },
  158: { usStandard: 240, usAir: 460, ukAir: 540, euStandard: 255, euAir: 475 },
  165: { usStandard: 250, usAir: 470, ukAir: 550, euStandard: 265, euAir: 485 },
  166: { usStandard: 255, usAir: 480, ukAir: 560, euStandard: 279, euAir: 495 }
};

const audit = JSON.parse(await fs.readFile(auditPath, "utf8"));
const [priceRows, optionRows, shippingRows, bodyRows] = await Promise.all([
  readXlsxSheet(priceWorkbook, "sheet1.xml"),
  readXlsxSheet(priceWorkbook, "sheet2.xml"),
  readXlsxSheet(priceWorkbook, "sheet3.xml"),
  readXlsxSheet(specsWorkbook, "sheet1.xml")
]);

const bodySpecs = bodyRows
  .filter((row) => row.some((value) => /\d{3}cm.*(?:Cup)/i.test(value)))
  .map((row) => ({ sourceRow: row, key: parseBodySpecKey(row.find(Boolean)) }));

const priceTiers = priceRows
  .map((row) => ({ sourceRow: row, key: parsePriceKey(row) }))
  .filter((item) => item.key);

const products = audit.products.map((product) => {
  const bodySpec = bodySpecs.find((item) => item.key?.heightCm === product.heightCm && item.key?.cupSize === product.cupSize);
  const priceTier = priceTiers.find((item) => item.key?.heightCm === product.heightCm && item.key?.cupSize === product.cupSize);
  const workbookPriceTier = WORKBOOK_PRICE_TIERS.find((item) => item.heightCm === product.heightCm && item.cupSize === product.cupSize);
  const commercialTier = priceTier?.key ?? workbookPriceTier;
  const minimumAdvertisedUsd = commercialTier?.minimumAdvertisedUsd ?? null;
  const mediaAndSpecsReady = product.mediaState === "ready" && Boolean(bodySpec);

  return {
    ...product,
    officialMediaDirectory: path.join("1 Pictures", product.sourceFolder),
    officialBodySpecification: bodySpec?.sourceRow ?? null,
    officialPriceTier: priceTier?.sourceRow ?? workbookPriceTier ?? null,
    supplierCostUsd: commercialTier?.supplierCostUsd ?? null,
    minimumAdvertisedUsd,
    internalShippingUsd: WORKBOOK_SHIPPING_USD[product.heightCm] ?? null,
    publicReference: PUBLIC_REFERENCE_OVERRIDES[product.displayName] ?? {
      source: "YourDoll",
      url: null,
      status: "pending-match",
      notes: ["Match by name, height, cup size, material, head model, and photo count before using any public-page detail."]
    },
    launchState: mediaAndSpecsReady
      ? minimumAdvertisedUsd
        ? "ready-for-draft"
        : "ready-for-price-review"
      : "hold-for-review",
    reviewChecks: {
      officialGalleryComplete: product.mediaState === "ready",
      bodySpecificationFound: Boolean(bodySpec),
      priceTierFound: Boolean(minimumAdvertisedUsd),
      optionsNeedProductReview: true,
      publicReferenceMatched: false
    }
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  sourceOfTruth: "Avant manufacturer-provided catalog, pricing, specifications, product photos, and option assets",
  policy: "Create Shopify drafts only after the public-reference check and product-specific option review are complete. Do not substitute public-site imagery for official Avant assets.",
  totals: {
    configurations: products.length,
    readyForDraft: products.filter((product) => product.launchState === "ready-for-draft").length,
    readyForPriceReview: products.filter((product) => product.launchState === "ready-for-price-review").length,
    holdForReview: products.filter((product) => product.launchState === "hold-for-review").length
  },
  sourceTables: {
    dollPriceRows: priceTiers,
    bodySpecificationRows: bodySpecs,
    optionPriceRows: compactRows(optionRows),
    shippingRows: compactRows(shippingRows)
  },
  products
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, totals: report.totals }, null, 2));

function parseBodySpecKey(value = "") {
  const match = value.match(/(\d{3})cm.*?([A-Z])\s*Cup/i);
  return match ? { heightCm: Number(match[1]), cupSize: `${match[2].toUpperCase()}-Cup` } : null;
}

function parsePriceKey(row) {
  // The price sheet uses merged cells, so read the configuration cell directly
  // instead of depending on the surrounding columns being populated.
  const configuration = row.find((value) => /\d{3}cm/i.test(String(value ?? ""))) ?? "";
  const match = String(configuration).match(/(\d{3})cm\s*([A-Z])\b/i);
  const fallback = row.join(" ").match(/(\d{3})cm\s*([A-Z])\s*Cup/i);
  const dimensions = match || fallback;
  return dimensions
    ? {
        heightCm: Number(dimensions[1]),
        cupSize: `${dimensions[2].toUpperCase()}-Cup`,
        supplierCostUsd: asCurrency(row[4]),
        minimumAdvertisedUsd: asCurrency(row[5])
      }
    : null;
}

function asCurrency(value) {
  const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function compactRows(rows) {
  return rows.map((row) => row.filter(Boolean)).filter((row) => row.length > 0);
}

async function readXlsxSheet(workbookPath, sheetFile) {
  const [sharedXml, sheetXml] = await Promise.all([
    readZipEntry(workbookPath, "xl/sharedStrings.xml"),
    readZipEntry(workbookPath, `xl/worksheets/${sheetFile}`)
  ]);
  const sharedStrings = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => decodeXml([...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join("")));
  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const ref = attributes.match(/\br="([A-Z]+)\d+"/)?.[1];
      if (!ref) continue;
      const index = columnIndex(ref);
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      const contents = cellMatch[2];
      const raw = contents.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      const inline = [...contents.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join("");
      row[index] = type === "s" ? sharedStrings[Number(raw)] ?? "" : type === "inlineStr" ? decodeXml(inline) : decodeXml(raw);
    }
    rows.push(row);
  }
  return rows;
}

async function readZipEntry(workbookPath, entry) {
  const { stdout } = await run("unzip", ["-p", workbookPath, entry], { maxBuffer: 8 * 1024 * 1024 });
  return stdout;
}

function columnIndex(column) {
  return [...column].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0) - 1;
}

function decodeXml(value) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
