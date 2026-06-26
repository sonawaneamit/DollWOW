import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const brandData = JSON.parse(await fs.readFile(path.join(ROOT, "lib", "catalog", "brand-data.json"), "utf8"));

await loadLocalEnv();

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const products = args.shopify ? await fetchShopifyProducts(Number(args.limit || 1000)) : await readInputProducts(args.input);
if (!products.length) {
  throw new Error("No products found to audit.");
}

const findings = withTitleAuditMetadata(products.map(auditProduct));
const duplicates = duplicateGroups(findings);
const duplicateTitles = titleDuplicateGroups(findings, (finding) => normalizeTitleForExactMatch(finding.title));
const nearDuplicateTitles = titleDuplicateGroups(findings, (finding) => normalizePublicTitleForAudit(finding.title));
const titleReview = titleReviewRows(duplicateTitles, nearDuplicateTitles);
const summary = summarize(findings, duplicates);
const outputBase = path.resolve(ROOT, args.output || "data/exports/catalog-audit");

await fs.mkdir(path.dirname(outputBase), { recursive: true });
await fs.writeFile(`${outputBase}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), summary, duplicates, duplicateTitles, nearDuplicateTitles, titleReview, findings }, null, 2));
await fs.writeFile(`${outputBase}.csv`, toCsv(findings));
await fs.writeFile(`${outputBase}-title-review.csv`, toTitleReviewCsv(titleReview));

console.log(`Audited ${products.length} products.`);
console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${path.relative(ROOT, `${outputBase}.json`)}, ${path.relative(ROOT, `${outputBase}.csv`)}, and ${path.relative(ROOT, `${outputBase}-title-review.csv`)}`);

async function readInputProducts(input) {
  const inputPath = input ? path.resolve(ROOT, input) : await findLatestStorefrontExport();
  const parsed = JSON.parse(await fs.readFile(inputPath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`${path.relative(ROOT, inputPath)} must contain a product array.`);
  return parsed;
}

async function findLatestStorefrontExport() {
  const exportDir = path.join(ROOT, "data", "exports");
  const entries = await fs.readdir(exportDir);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.endsWith("-storefront-products.json"))
      .map(async (entry) => {
        const file = path.join(exportDir, entry);
        const stat = await fs.stat(file);
        return { file, mtimeMs: stat.mtimeMs };
      })
  );
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files[0]) throw new Error("No storefront export found. Pass --input or run prepare:rosemary-import first.");
  return files[0].file;
}

function auditProduct(product) {
  const identity = buildIdentity(product);
  const productKind = classifyProductKind(product);
  const imageCount = Array.isArray(product.images) ? product.images.length : product.featuredImage?.url ? 1 : 0;
  const imageSet = imageSetMetadata(product);
  const optionImageCount = countOptionImages(product.extended?.customizationGroups);
  const sourceLeakage = findSourceLeakage(product);
  const identityWarnings = filterSpecWarnings(identity.warnings, product, productKind);
  const warnings = [
    ...identityWarnings,
    imageCount < 4 ? "thin_product_media" : "",
    optionImageCount === 0 && hasCustomization(product) ? "custom_options_missing_images" : "",
    !product.seo?.title ? "missing_seo_title" : "",
    !product.seo?.description ? "missing_seo_description" : "",
    requiresMaterial(productKind) && !normalizeMaterial(product.extended?.material) ? "missing_material" : "",
    requiresBodySpecs(productKind) && !product.extended?.heightCm ? "missing_height_cm" : "",
    requiresBodySpecs(productKind) && !product.extended?.weightLb ? "missing_weight_lb" : "",
    requiresCupSpec(product, productKind) && !normalizeCup(product.extended?.cupSize) ? "missing_cup_size" : "",
    hasExclusiveSignals(product) ? "exclusive_or_restricted_signal" : "",
    sourceLeakage.length ? "source_store_leakage" : ""
  ].filter(Boolean);

  return {
    handle: product.handle || "",
    title: product.title || "",
    sourceUrl: product.sourceUrl || "",
    identityKey: product.extended?.catalogIdentityKey || identity.key,
    bodyIdentityKey: product.extended?.catalogBodyIdentityKey || identity.bodyKey,
    brand: identity.brandLabel || "",
    productKind,
    headModel: product.extended?.headModel || identity.headModel || "",
    modelName: identity.modelName,
    heightCm: identity.heightCm || "",
    cupSize: identity.cupSize || "",
    material: identity.material || "",
    price: product.priceRange?.minVariantPrice?.amount || "",
    imageCount,
    primaryImageKey: imageSet.primaryImageKey,
    imageSetKey: imageSet.imageSetKey,
    optionGroupCount: Array.isArray(product.extended?.customizationGroups) ? product.extended.customizationGroups.length : 0,
    optionImageCount,
    warnings,
    sourceLeakage,
    seoTitle: product.seo?.title || "",
    seoDescription: product.seo?.description || ""
  };
}

function summarize(findings, duplicates) {
  const warningCounts = {};
  for (const finding of findings) {
    for (const warning of finding.warnings) warningCounts[warning] = (warningCounts[warning] || 0) + 1;
  }
  const brands = {};
  for (const finding of findings) {
    const brand = finding.brand || "Unknown";
    brands[brand] = (brands[brand] || 0) + 1;
  }
  return {
    productCount: findings.length,
    brandCounts: brands,
    warningCounts,
    duplicateIdentityGroups: duplicates.length,
    duplicateTitleGroups: titleDuplicateGroups(findings, (finding) => normalizeTitleForExactMatch(finding.title)).length,
    nearDuplicateTitleGroups: titleDuplicateGroups(findings, (finding) => normalizePublicTitleForAudit(finding.title)).length,
    productsWithTitleWarnings: findings.filter((finding) => finding.titleWarnings?.length).length,
    productsWithWarnings: findings.filter((finding) => finding.warnings.length).length
  };
}

function withTitleAuditMetadata(findings) {
  const duplicateTitleKeys = new Set(titleDuplicateGroups(findings, (finding) => normalizeTitleForExactMatch(finding.title)).map((group) => group.titleKey));
  const nearDuplicateTitleKeys = new Set(titleDuplicateGroups(findings, (finding) => normalizePublicTitleForAudit(finding.title)).map((group) => group.titleKey));

  return findings.map((finding) => {
    const titleWarnings = [];
    if (duplicateTitleKeys.has(normalizeTitleForExactMatch(finding.title))) titleWarnings.push("duplicate_public_title");
    if (nearDuplicateTitleKeys.has(normalizePublicTitleForAudit(finding.title))) titleWarnings.push("near_duplicate_public_title");
    return { ...finding, titleWarnings };
  });
}

function titleDuplicateGroups(findings, keyForFinding) {
  const grouped = new Map();
  for (const finding of findings) {
    const titleKey = keyForFinding(finding);
    if (!titleKey) continue;
    if (!grouped.has(titleKey)) grouped.set(titleKey, []);
    grouped.get(titleKey).push({
      handle: finding.handle,
      title: finding.title,
      identityKey: finding.identityKey,
      bodyIdentityKey: finding.bodyIdentityKey,
      headModel: finding.headModel,
      brand: finding.brand,
      imageSetKey: finding.imageSetKey,
      primaryImageKey: finding.primaryImageKey
    });
  }
  return Array.from(grouped.entries())
    .filter(([, products]) => products.length > 1)
    .map(([titleKey, products]) => ({ titleKey, ...titleGroupRecommendation(products), products }));
}

function titleGroupRecommendation(products) {
  const identityKeys = uniqueValues(products.map((product) => product.identityKey).filter(Boolean));
  const bodyKeys = uniqueValues(products.map((product) => product.bodyIdentityKey).filter(Boolean));
  const imageSetKeys = uniqueValues(products.map((product) => product.imageSetKey).filter(Boolean));

  if (!identityKeys.length) {
    return {
      recommendedAction: "manual_review",
      reason: "No reliable product identity key is available for this title group."
    };
  }

  if (identityKeys.length === 1 && imageSetKeys.length <= 1) {
    return {
      recommendedAction: "merge_or_redirect_duplicate",
      reason: "Same exact catalog identity and same visible image set."
    };
  }

  if (identityKeys.length === 1 && imageSetKeys.length > 1) {
    return {
      recommendedAction: "keep_as_photo_set_but_rename",
      reason: "Same exact catalog identity, but the visible galleries differ."
    };
  }

  if (bodyKeys.length === 1 && identityKeys.length > 1) {
    return {
      recommendedAction: "rename_for_head_or_variant",
      reason: "Same body identity but different exact identity or head metadata."
    };
  }

  return {
    recommendedAction: "rename_for_distinct_specs",
    reason: "Public titles collide even though catalog identities differ."
  };
}

function titleReviewRows(duplicateTitles, nearDuplicateTitles) {
  const rows = [];
  const seenExactKeys = new Set();
  for (const group of duplicateTitles) {
    seenExactKeys.add(group.titleKey);
    rows.push(...titleReviewGroupRows("exact", group));
  }
  for (const group of nearDuplicateTitles) {
    if (seenExactKeys.has(group.titleKey)) continue;
    rows.push(...titleReviewGroupRows("near", group));
  }
  return rows;
}

function titleReviewGroupRows(kind, group) {
  return group.products.map((product) => ({
    kind,
    titleKey: group.titleKey,
    recommendedAction: group.recommendedAction,
    reason: group.reason,
    groupSize: group.products.length,
    handle: product.handle,
    title: product.title,
    brand: product.brand,
    identityKey: product.identityKey,
    bodyIdentityKey: product.bodyIdentityKey,
    headModel: product.headModel,
    imageSetKey: product.imageSetKey,
    primaryImageKey: product.primaryImageKey
  }));
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeTitleForExactMatch(title) {
  return normalizeText(title);
}

function normalizePublicTitleForAudit(title) {
  return normalizeText(title)
    .replace(/\b(customizable|ready\s*to\s*ship|companion|doll|dolls)\b/g, " ")
    .replace(/\b(?:n\/?a|na)\s*-?\s*cup\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function duplicateGroups(findings) {
  const grouped = new Map();
  for (const finding of findings) {
    if (!grouped.has(finding.identityKey)) grouped.set(finding.identityKey, []);
    grouped.get(finding.identityKey).push({ handle: finding.handle, title: finding.title, sourceUrl: finding.sourceUrl });
  }
  return Array.from(grouped.entries())
    .filter(([, products]) => products.length > 1)
    .map(([identityKey, products]) => ({ identityKey, products }));
}

function classifyProductKind(product) {
  const text = [product.title, product.sourceTitle, product.handle, product.productType, ...(product.tags || [])].filter(Boolean).join(" ");
  if (/\b(extra\s+)?heads?\b/i.test(text)) return "head";
  if (/\b(torso|half\s+body|masturbator|tantabosom|removable\s+vaginal|pocket|mini)\b/i.test(text)) return "torso";
  return "full_doll";
}

function filterSpecWarnings(warnings, product, productKind) {
  return warnings.filter((warning) => {
    if (productKind === "head" && ["identity_missing_height_cm", "identity_missing_cup_size", "identity_missing_material"].includes(warning)) return false;
    if (warning === "identity_missing_cup_size" && !requiresCupSpec(product, productKind)) return false;
    return true;
  });
}

function requiresBodySpecs(productKind) {
  return productKind !== "head";
}

function requiresMaterial(productKind) {
  return productKind !== "head";
}

function requiresCupSpec(product, productKind) {
  if (productKind === "head") return false;
  return !isCupNotApplicable(product.extended?.cupSize, product.title, product.sourceTitle, product.handle);
}

function isCupNotApplicable(...values) {
  return values.filter(Boolean).some((value) => {
    const text = String(value);
    const normalized = normalizeText(text).replace(/\s+/g, "");
    return /\b(?:n\/?a|none|not\s+applicable|no\s+cup)\s*-?\s*cup\b/i.test(text) || ["na", "none", "notapplicable", "nocup"].includes(normalized);
  });
}

function buildIdentity(product) {
  const brand = brandForProduct(product);
  const heightCm = numberValue(product.extended?.heightCm) || extractHeightCm(product.title, product.sourceTitle, product.handle);
  const cupSize = normalizeCup(product.extended?.cupSize) || extractCupSize(product.title, product.sourceTitle, product.handle);
  const material = normalizeMaterial(product.extended?.material || product.productType || product.title || product.sourceTitle || "");
  const modelName = extractModelName(product, brand);
  const modelSlug = slugify(modelName || product.handle || "unknown-model");
  const headModel = normalizeHeadModel(product.extended?.headModel) || extractHeadModel(product);
  const bodyKey = [brand?.value || "unknown-brand", modelSlug || "unknown-model", heightCm ? `${heightCm}cm` : "height-unknown", cupSize ? `${cupSize.toLowerCase()}-cup` : "cup-unknown", material || "material-unknown"]
    .map(slugify)
    .join("__");
  const warnings = [
    !brand ? "unknown_brand" : "",
    !modelSlug || modelSlug === "unknown-model" ? "unknown_model" : "",
    !heightCm ? "identity_missing_height_cm" : "",
    !cupSize ? "identity_missing_cup_size" : "",
    !material ? "identity_missing_material" : ""
  ].filter(Boolean);

  return {
    key: headModel ? `${bodyKey}__${slugify(headModel)}` : bodyKey,
    bodyKey,
    brandLabel: brand?.label,
    headModel,
    modelName,
    heightCm,
    cupSize,
    material,
    warnings
  };
}

function extractHeadModel(product) {
  const text = [product.title, product.sourceTitle, product.description, product.handle, product.sourceHandle].filter(Boolean).join(" ");
  const patterns = [
    /\b(?:has|with)\s+[a-z0-9\s-]*?head\s*#?\s*([a-z]{0,4}\d{1,4})\b/i,
    /\bhead\s*(?:#|no\.?|number)?\s*([a-z]{0,4}\d{1,4})\b/i,
    /\bsilicone\s+head\s+([a-z]{1,4}\d{1,4})\b/i,
    /\bhead\s+([a-z]{1,4}\d{1,4})\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const normalized = normalizeHeadModel(match?.[1]);
    if (normalized) return normalized;
  }

  return "";
}

function normalizeHeadModel(value) {
  const match = String(value || "")
    .trim()
    .replace(/^#/, "")
    .match(/^[a-z]{0,4}\d{1,4}$/i);
  return match ? `head-${match[0].toLowerCase()}` : "";
}

function brandForProduct(product) {
  return getBrand(product.extended?.brand) || brandFromText(product.title, product.sourceTitle, product.vendor, ...(product.tags || []));
}

function getBrand(value) {
  if (!value) return null;
  const normalized = normalizeText(value);
  return brandData.find((brand) => [brand.value, brand.label, brand.collectionHandle, ...brand.tags, ...brand.aliases].some((alias) => normalizeText(alias) === normalized)) || null;
}

function brandFromText(...values) {
  const haystack = normalizeText(values.filter(Boolean).join(" "));
  if (!haystack) return null;
  const matches = brandData
    .map((brand) => ({
      brand,
      score: [brand.label, brand.value, brand.collectionHandle, ...brand.tags, ...brand.aliases].some((alias) => containsAlias(haystack, normalizeText(alias))) ? normalizeText(brand.label).length : 0
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
  return matches[0]?.brand || null;
}

function extractModelName(product, brand) {
  for (const candidate of [product.title, product.sourceTitle, product.handle, product.sourceHandle].filter(Boolean)) {
    let cleaned = String(candidate)
      .replace(/\b(1[2-9]\d|20\d|21\d)\s*cm\b/gi, " ")
      .replace(/\b\d+\s*ft\s*\d*\b/gi, " ")
      .replace(/\b[a-z]{1,3}\s*-?\s*cup\b/gi, " ")
      .replace(/\b(tpe|silicone head|silicone|hybrid)\b/gi, " ")
      .replace(/\b(customizable|custom|companion|adult|doll|dolls|sex|ready|ship|shipping|factory|order)\b/gi, " ")
      .replace(/\b(import|gid|shopify|product)\b/gi, " ")
      .replace(/\b[0-9a-f]{4,}\b/gi, " ");

    for (const phrase of brand ? [brand.label, brand.value, brand.collectionHandle, ...brand.aliases, ...brand.tags] : []) {
      cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(phrase).replace(/\\ /g, "[\\s-]+")}\\b`, "gi"), " ");
    }

    cleaned = titleCase(
      cleaned
        .replace(/[-_/]+/g, " ")
        .replace(/[^a-z0-9\s.'’]+/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    );
    if (cleaned && cleaned.toLowerCase() !== "doll") return cleaned;
  }
  return "Unknown model";
}

function hasCustomization(product) {
  return Boolean(product.extended?.customAvailable || product.extended?.customizationGroups?.length || (product.tags || []).some((tag) => /custom/i.test(tag)));
}

function countOptionImages(groups = []) {
  if (!Array.isArray(groups)) return 0;
  return groups.reduce((count, group) => count + (group.options || []).filter((option) => option.swatch?.kind === "image" && option.swatch.value).length, 0);
}

function imageSetMetadata(product) {
  const keys = imageUrlsForProduct(product).map(imageUrlKey).filter(Boolean);
  const uniqueKeys = uniqueValues(keys);
  const imageSetKey = uniqueKeys.length ? stableHash(uniqueKeys.join("|")) : "";
  return {
    primaryImageKey: uniqueKeys[0] || "",
    imageSetKey
  };
}

function imageUrlsForProduct(product) {
  const urls = [];
  if (product.featuredImage?.url) urls.push(product.featuredImage.url);
  if (Array.isArray(product.images)) {
    for (const image of product.images) {
      const url = typeof image === "string" ? image : image?.url;
      if (url) urls.push(url);
    }
  }
  return urls;
}

function imageUrlKey(url) {
  const text = String(url || "").trim();
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return path
      .basename(parsed.pathname)
      .toLowerCase()
      .replace(/_[0-9]+x[0-9]+(?=\.)/i, "")
      .replace(/\?.*$/, "");
  } catch {
    return path.basename(text.split("?")[0]).toLowerCase();
  }
}

function findSourceLeakage(product) {
  const optionText = Array.isArray(product.extended?.customizationGroups)
    ? product.extended.customizationGroups
        .flatMap((group) => [group.label, group.description, ...(group.options || []).flatMap((option) => [option.label, option.description])])
        .filter(Boolean)
        .join(" ")
    : "";
  const text = [product.title, product.description, product.seo?.title, product.seo?.description, product.extended?.qcNote, optionText]
    .filter(Boolean)
    .join(" ");
  const matches = [];
  if (/rosemary/i.test(text)) matches.push("rosemary_text");
  if (/joy\s*love/i.test(text)) matches.push("joylove_text");
  if (/same\s+as\s+website\s+picture/i.test(text)) matches.push("source_option_label");
  return matches;
}

function hasExclusiveSignals(product) {
  const text = [
    product.title,
    product.sourceTitle,
    product.description,
    product.sourceUrl,
    ...(product.tags || []),
    ...(product.reviewFlags?.exclusiveSignals || [])
  ]
    .filter(Boolean)
    .join(" ");
  return /\b(exclusive|celebrity|likeness|rosemary)\b/i.test(text) && !/rosemarydoll\.com\/product/i.test(String(product.sourceUrl || ""));
}

async function fetchShopifyProducts(limit) {
  const domain = requireEnv("SHOPIFY_STORE_DOMAIN").replace(/^https?:\/\//, "");
  const token = requireEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  const products = [];
  let after = null;

  while (products.length < limit) {
    const first = Math.min(250, limit - products.length);
    const data = await storefrontFetch(
      domain,
      token,
      `query Products($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          edges {
            node {
              handle title description vendor productType tags
              seo { title description }
              featuredImage { url altText width height }
              images(first: 20) { edges { node { url altText width height } } }
              priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
              brand: metafield(namespace: "custom", key: "brand") { value }
              catalogIdentityKey: metafield(namespace: "custom", key: "catalog_identity_key") { value }
              catalogBodyIdentityKey: metafield(namespace: "custom", key: "catalog_body_identity_key") { value }
              headModel: metafield(namespace: "custom", key: "head_model") { value }
              material: metafield(namespace: "custom", key: "material") { value }
              heightCm: metafield(namespace: "custom", key: "height_cm") { value }
              weightLb: metafield(namespace: "custom", key: "weight_lb") { value }
              cupSize: metafield(namespace: "custom", key: "cup_size") { value }
              stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
              customAvailable: metafield(namespace: "custom", key: "custom_available") { value }
              customizationGroups: metafield(namespace: "custom", key: "customization_groups") { value }
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first, after }
    );
    products.push(...data.products.edges.map((edge) => mapShopifyNode(edge.node)));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function storefrontFetch(domain, token, query, variables = {}) {
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || `Shopify Storefront API failed with HTTP ${response.status}.`);
  }
  return payload.data;
}

function mapShopifyNode(node) {
  const customizationGroups = parseJson(node.customizationGroups?.value) || [];
  return {
    handle: node.handle,
    title: node.title,
    description: node.description,
    vendor: node.vendor,
    productType: node.productType,
    tags: node.tags || [],
    seo: node.seo,
    featuredImage: node.featuredImage,
    images: (node.images?.edges || []).map((edge) => edge.node),
    priceRange: node.priceRange,
    extended: {
      catalogIdentityKey: node.catalogIdentityKey?.value,
      catalogBodyIdentityKey: node.catalogBodyIdentityKey?.value,
      headModel: node.headModel?.value,
      brand: node.brand?.value,
      material: node.material?.value,
      heightCm: numberValue(node.heightCm?.value),
      weightLb: numberValue(node.weightLb?.value),
      cupSize: node.cupSize?.value,
      stockStatus: node.stockStatus?.value,
      customAvailable: node.customAvailable?.value === "true",
      customizationGroups
    }
  };
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toCsv(findings) {
  const headers = [
    "handle",
    "title",
    "brand",
    "productKind",
    "modelName",
    "identityKey",
    "bodyIdentityKey",
    "headModel",
    "heightCm",
    "cupSize",
    "material",
    "price",
    "imageCount",
    "primaryImageKey",
    "imageSetKey",
    "optionGroupCount",
    "optionImageCount",
    "warnings",
    "titleWarnings",
    "sourceLeakage",
    "sourceUrl"
  ];
  const rows = findings.map((finding) =>
    headers.map((header) => csvCell(Array.isArray(finding[header]) ? finding[header].join("|") : finding[header])).join(",")
  );
  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

function toTitleReviewCsv(rows) {
  const headers = [
    "kind",
    "titleKey",
    "recommendedAction",
    "reason",
    "groupSize",
    "handle",
    "title",
    "brand",
    "identityKey",
    "bodyIdentityKey",
    "headModel",
    "imageSetKey",
    "primaryImageKey"
  ];
  const lines = rows.map((row) => headers.map((header) => csvCell(row[header])).join(","));
  return `${headers.join(",")}\n${lines.join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function extractHeightCm(...values) {
  const match = values.filter(Boolean).join(" ").match(/\b(1[2-9]\d|20\d|21\d)\s*cm\b/i);
  return match ? Number(match[1]) : undefined;
}

function extractCupSize(...values) {
  const text = values.filter(Boolean).join(" ");
  if (/\b(?:n\/?a|none|not\s+applicable|no\s+cup)\s*-?\s*cup\b/i.test(text)) return undefined;
  const match = text.match(/\b([a-z]{1,3})\s*-?\s*cup\b/i);
  return match ? normalizeCup(match[1]) : undefined;
}

function normalizeCup(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(?:-|\/|\s)*cup$/i, "")
    .replace(/[^a-z0-9]+/g, "");
  if (["na", "nacup", "none", "notapplicable", "nocup"].includes(normalized)) return undefined;
  const match = String(value || "").match(/[a-z]{1,3}/i);
  return match ? match[0].toUpperCase() : undefined;
}

function normalizeMaterial(value) {
  const normalized = normalizeText(value);
  if (normalized.includes("silicone head")) return "silicone-head";
  if (normalized.includes("silicone")) return "silicone";
  if (normalized.includes("tpe")) return "tpe";
  if (normalized.includes("hybrid")) return "hybrid";
  return undefined;
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : undefined;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function containsAlias(haystack, alias) {
  if (!alias) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`).test(haystack);
}

function titleCase(value) {
  return String(value || "").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stableHash(value) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required for --shopify.`);
  return value;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "help" || key === "shopify") {
      parsed[key] = true;
    } else {
      parsed[key] = values[index + 1];
      index += 1;
    }
  }
  return parsed;
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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] ||= value;
    }
  } catch {
    // Local env is optional unless --shopify is used.
  }
}

function printHelp() {
  console.log(`Usage:
  npm run catalog:audit
  npm run catalog:audit -- --input data/exports/rosemary-wm-all-2026-06-05-storefront-products.json
  npm run catalog:audit -- --shopify --limit 1000
  npm run catalog:audit -- --input data/exports/file.json --output data/exports/catalog-audit-wm

Writes a JSON summary and CSV findings file. Use this before and after imports to catch duplicate product identities, missing specs, thin media, missing SEO, source leakage, and restricted-product signals.`);
}
