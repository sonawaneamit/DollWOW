import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_BASE = path.join(ROOT, "data", "exports", "import-duplicate-review");
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const inputPath = path.resolve(ROOT, args.input || (await findLatestStorefrontPreview()));
const auditPath = path.resolve(ROOT, args.audit || (await findLatestLiveAudit()));
const outputBase = path.resolve(ROOT, args.output || `${DEFAULT_OUTPUT_BASE}-${timestamp()}`);

const importProducts = JSON.parse(await fs.readFile(inputPath, "utf8"));
const audit = JSON.parse(await fs.readFile(auditPath, "utf8"));
const liveFindings = Array.isArray(audit.findings) ? audit.findings : [];

if (!Array.isArray(importProducts) || !importProducts.length) {
  throw new Error(`No import products found in ${path.relative(ROOT, inputPath)}.`);
}

if (!liveFindings.length) {
  throw new Error(`No live catalog findings found in ${path.relative(ROOT, auditPath)}.`);
}

const indexes = buildIndexes(liveFindings);
const rows = importProducts.map((product) => reviewProduct(product, indexes));

const summary = summarize(rows);
const payload = {
  generatedAt: new Date().toISOString(),
  input: path.relative(ROOT, inputPath),
  audit: path.relative(ROOT, auditPath),
  summary,
  reviews: rows
};

await fs.mkdir(path.dirname(outputBase), { recursive: true });
await fs.writeFile(`${outputBase}.json`, JSON.stringify(payload, null, 2), "utf8");
await fs.writeFile(`${outputBase}.csv`, toCsv(rows), "utf8");

console.log(JSON.stringify({
  summary,
  json: path.relative(ROOT, `${outputBase}.json`),
  csv: path.relative(ROOT, `${outputBase}.csv`)
}, null, 2));

function buildIndexes(findings) {
  return {
    byIdentityKey: groupBy(findings, (item) => item.identityKey),
    byBodyIdentityKey: groupBy(findings, (item) => item.bodyIdentityKey),
    bySourceHandle: groupBy(findings, (item) => normalizeText(item.sourceHandle || sourceHandleFromUrl(item.sourceUrl))),
    bySourceUrl: groupBy(findings, (item) => normalizeUrl(item.sourceUrl)),
    byNormalizedTitle: groupBy(findings, (item) => normalizePublicTitle(item.title)),
    byImageSetKey: groupBy(findings, (item) => item.imageSetKey),
    byPrimaryImageKey: groupBy(findings, (item) => item.primaryImageKey)
  };
}

function reviewProduct(product, indexes) {
  const derivedIdentity = buildFallbackIdentity(product);
  const identityKey = product.extended?.catalogIdentityKey || derivedIdentity.key;
  const bodyIdentityKey = product.extended?.catalogBodyIdentityKey || derivedIdentity.bodyKey;
  const sourceHandle = normalizeText(product.sourceHandle || sourceHandleFromUrl(product.sourceUrl));
  const sourceUrl = normalizeUrl(product.sourceUrl);
  const normalizedTitle = normalizePublicTitle(product.title);
  const imageSetKey = imageSetHash(product.images || []);
  const primaryImageKey = assetKey(product.featuredImage?.url || product.images?.[0]?.url || "");

  const matches = {
    exactIdentity: dedupeMatches(indexes.byIdentityKey.get(identityKey) || []),
    sameBody: dedupeMatches(indexes.byBodyIdentityKey.get(bodyIdentityKey) || []),
    sameSourceHandle: dedupeMatches(indexes.bySourceHandle.get(sourceHandle) || []),
    sameSourceUrl: dedupeMatches(indexes.bySourceUrl.get(sourceUrl) || []),
    exactTitle: dedupeMatches(indexes.byNormalizedTitle.get(normalizedTitle) || []),
    sameImageSet: dedupeMatches(indexes.byImageSetKey.get(imageSetKey) || []),
    samePrimaryImage: dedupeMatches(indexes.byPrimaryImageKey.get(primaryImageKey) || [])
  };

  const recommendation = recommendAction(product, matches);

  return {
    handle: product.handle,
    title: product.title,
    sourceTitle: product.sourceTitle || "",
    sourceHandle: product.sourceHandle || sourceHandle,
    sourceUrl: product.sourceUrl || "",
    identityKey,
    bodyIdentityKey,
    exactIdentityCount: matches.exactIdentity.length,
    sameBodyCount: matches.sameBody.length,
    sameSourceHandleCount: matches.sameSourceHandle.length,
    sameSourceUrlCount: matches.sameSourceUrl.length,
    exactTitleCount: matches.exactTitle.length,
    sameImageSetCount: matches.sameImageSet.length,
    samePrimaryImageCount: matches.samePrimaryImage.length,
    recommendation: recommendation.code,
    priority: recommendation.priority,
    notes: recommendation.notes,
    liveCandidates: uniqueCandidateList([
      ...matches.sameSourceHandle,
      ...matches.sameSourceUrl,
      ...matches.exactIdentity,
      ...matches.sameImageSet,
      ...matches.exactTitle,
      ...matches.sameBody,
      ...matches.samePrimaryImage
    ]).slice(0, 12)
  };
}

function recommendAction(product, matches) {
  if (matches.sameSourceHandle.length || matches.sameSourceUrl.length) {
    return {
      code: "update_existing_source_match",
      priority: "high",
      notes: "Source handle/URL already exists in live catalog. Treat this as an update or alias case, not a new product."
    };
  }

  if (matches.exactIdentity.length) {
    return {
      code: "review_exact_identity_duplicate",
      priority: "high",
      notes: "Exact catalog identity already exists live. This may be a duplicate listing, alternate photo set, or naming collision that needs manual review."
    };
  }

  if (matches.sameImageSet.length) {
    return {
      code: "review_same_image_set",
      priority: "high",
      notes: "Image set appears to match an existing live product. Confirm whether this is the same doll under another title or a deliberate alternate listing."
    };
  }

  if (matches.exactTitle.length) {
    return {
      code: "rename_or_alias_before_import",
      priority: "medium",
      notes: "A near-identical public title already exists live. Keep source alias privately, but avoid creating a duplicate public title."
    };
  }

  if (matches.sameBody.length) {
    const sameHead = matches.sameBody.some((item) => normalizeHead(item.headModel) && normalizeHead(item.headModel) === normalizeHead(product.extended?.headModel));
    return {
      code: sameHead ? "review_body_plus_head_collision" : "allow_body_variant_review",
      priority: sameHead ? "medium" : "low",
      notes: sameHead
        ? "Same body and head family already exist live. Confirm whether this is a duplicate or a meaningful alternate photo set."
        : "Same body appears live with different head or presentation. Usually okay, but still worth a quick review before import."
    };
  }

  if (matches.samePrimaryImage.length) {
    return {
      code: "review_primary_image_overlap",
      priority: "medium",
      notes: "Primary image overlaps with an existing live product. Quick manual check recommended."
    };
  }

  return {
    code: "likely_safe_new_listing",
    priority: "low",
    notes: "No strong duplicate signals found against the live audited catalog."
  };
}

function summarize(rows) {
  const counts = Object.create(null);
  for (const row of rows) {
    counts[row.recommendation] = (counts[row.recommendation] || 0) + 1;
  }

  return {
    totalImports: rows.length,
    likelySafeNewListings: rows.filter((row) => row.recommendation === "likely_safe_new_listing").length,
    needsManualReview: rows.filter((row) => row.recommendation !== "likely_safe_new_listing").length,
    byRecommendation: counts
  };
}

function toCsv(rows) {
  const headers = [
    "handle",
    "title",
    "sourceHandle",
    "sourceUrl",
    "recommendation",
    "priority",
    "exactIdentityCount",
    "sameBodyCount",
    "sameSourceHandleCount",
    "sameSourceUrlCount",
    "exactTitleCount",
    "sameImageSetCount",
    "samePrimaryImageCount",
    "notes",
    "liveCandidates"
  ];

  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = header === "liveCandidates"
            ? row.liveCandidates.map((candidate) => `${candidate.handle} (${candidate.title})`).join(" | ")
            : row[header];
          return csvCell(value);
        })
        .join(",")
    )
  ].join("\n");
}

function uniqueCandidateList(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.handle}::${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeMatches(items) {
  return uniqueCandidateList(
    items.map((item) => ({
      handle: item.handle,
      title: item.title,
      sourceUrl: item.sourceUrl || "",
      headModel: item.headModel || ""
    }))
  );
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

function normalizePublicTitle(value) {
  return normalizeText(value)
    .replace(/\b(customizable|ready\s*to\s*ship|companion|doll|dolls)\b/g, " ")
    .replace(/\b(?:n\/?a|na)\s*-?\s*cup\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHead(value) {
  return normalizeText(value).replace(/^head[-_\s]*/i, "");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(String(value));
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return "";
  }
}

function sourceHandleFromUrl(url) {
  try {
    const parsed = new URL(String(url));
    const match = parsed.pathname.match(/\/product\/([^/]+)/i);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

function assetKey(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.at(-1)?.toLowerCase() || "";
  } catch {
    return "";
  }
}

function imageSetHash(images) {
  const keys = images
    .map((image) => assetKey(image?.url || ""))
    .filter(Boolean)
    .sort();
  return keys.join("|");
}

function buildFallbackIdentity(product) {
  const brand = slugify(product.extended?.brand || product.vendor || "unknown-brand");
  const heightCm = extractHeightCm(product.extended?.heightCm, product.sourceTitle, product.title, product.handle);
  const cupSize = extractCupSize(product.extended?.cupSize, product.sourceTitle, product.title, product.handle);
  const material = normalizeMaterial(product.extended?.material || product.productType || product.sourceTitle || product.title || product.handle);
  const headModel = extractHeadModel(product.extended?.headModel, product.sourceTitle, product.title, product.handle, product.sourceHandle);
  const modelSlug = slugify(extractModelName(product.sourceTitle || product.title || "", product.handle || "", brand) || product.handle || "unknown-model");
  const bodyKey = [
    brand || "unknown-brand",
    modelSlug || "unknown-model",
    heightCm ? `${heightCm}cm` : "height-unknown",
    cupSize ? `${cupSize.toLowerCase()}-cup` : "cup-unknown",
    material || "material-unknown"
  ].join("__");
  return {
    bodyKey,
    key: headModel ? `${bodyKey}__${slugify(headModel)}` : bodyKey
  };
}

function extractHeightCm(...values) {
  const text = values.filter(Boolean).join(" ");
  const match = text.match(/\b(1[2-9]\d|20\d|21\d)\s*cm\b/i);
  return match ? Number(match[1]) : undefined;
}

function extractCupSize(...values) {
  const text = values.filter(Boolean).join(" ");
  if (/\b(?:n\/?a|none|not\s+applicable|no\s+cup)\s*-?\s*cup\b/i.test(text)) return undefined;
  const match = text.match(/\b([a-z]{1,3})\s*-?\s*cup\b/i);
  return match ? match[1].toUpperCase() : undefined;
}

function normalizeMaterial(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized.includes("silicone head")) return "silicone-head";
  if (normalized.includes("silicone")) return "silicone";
  if (normalized.includes("tpe")) return "tpe";
  if (normalized.includes("hybrid")) return "hybrid";
  return "";
}

function extractHeadModel(...values) {
  const text = values.filter(Boolean).join(" ");
  const patterns = [
    /\b(?:has|with)\s+[a-z0-9\s-]*?head\s*#?\s*([a-z]{0,4}\d{1,4})\b/i,
    /\bhead\s*(?:#|no\.?|number)?\s*([a-z]{0,4}\d{1,4})\b/i,
    /\bsilicone\s+head\s+([a-z]{1,4}\d{1,4})\b/i,
    /\bhead\s+([a-z]{1,4}\d{1,4})\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return `head-${match[1].toLowerCase()}`;
  }
  return "";
}

function extractModelName(...values) {
  const text = values.filter(Boolean).join(" ");
  return text
    .replace(/\b(1[2-9]\d|20\d|21\d)\s*cm\b/gi, " ")
    .replace(/\b\d+\s*ft\s*\d*\b/gi, " ")
    .replace(/\b[a-z]{1,3}\s*-?\s*cup\b/gi, " ")
    .replace(/\b(tpe|silicone head|silicone|hybrid|customizable|custom|companion|adult|doll|dolls|sex|ready|ship|shipping|factory|order|wm|angelkiss|irontech|starpery|sedoll|6ye|piper|tantaly|yl|erovenus)\b/gi, " ")
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-z0-9\s.'’]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

async function findLatestStorefrontPreview() {
  const exportDir = path.join(ROOT, "data", "exports");
  const entries = await fs.readdir(exportDir);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.startsWith("rosemary-") && entry.endsWith("-storefront-products.json"))
      .map(async (entry) => {
        const file = path.join(exportDir, entry);
        const stat = await fs.stat(file);
        return { file, mtimeMs: stat.mtimeMs };
      })
  );
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files[0]) throw new Error("No storefront preview JSON found. Run npm run prepare:rosemary-import first.");
  return files[0].file;
}

async function findLatestLiveAudit() {
  const exportDir = path.join(ROOT, "data", "exports");
  const entries = await fs.readdir(exportDir);
  const files = await Promise.all(
    entries
      .filter((entry) => /^catalog-audit-live.*\.json$/i.test(entry))
      .map(async (entry) => {
        const file = path.join(exportDir, entry);
        const stat = await fs.stat(file);
        return { file, mtimeMs: stat.mtimeMs };
      })
  );
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files[0]) throw new Error("No live catalog audit JSON found. Run npm run catalog:audit first.");
  return files[0].file;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function printHelp() {
  console.log(`
Review a prepared Rosemary import against the live audited catalog.

Usage:
  node scripts/review-import-duplicates.mjs --input data/exports/rosemary-brand-storefront-products.json

Options:
  --input <file>   Prepared storefront import JSON to review.
  --audit <file>   Live catalog audit JSON. Defaults to latest catalog-audit-live*.json.
  --output <base>  Output base path without extension.
  --help           Show this help.

Outputs:
  <base>.json
  <base>.csv
`);
}
