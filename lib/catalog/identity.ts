import { brandFromText, getCatalogBrand, normalizeBrandText } from "@/lib/catalog/brands";

type IdentityProduct = {
  handle?: string | null;
  title?: string | null;
  vendor?: string | null;
  productType?: string | null;
  tags?: string[] | null;
  sourceTitle?: string | null;
  sourceHandle?: string | null;
  extended?: {
    catalogBodyIdentityKey?: string | null;
    catalogIdentityKey?: string | null;
    brand?: string | null;
    headModel?: string | null;
    material?: string | null;
    heightCm?: number | string | null;
    cupSize?: string | null;
  } | null;
};

export type ProductIdentity = {
  key: string;
  bodyKey: string;
  brandValue?: string;
  brandLabel?: string;
  headModel?: string;
  modelSlug: string;
  modelName: string;
  heightCm?: number;
  cupSize?: string;
  material?: string;
  warnings: string[];
};

export function buildProductIdentity(product: IdentityProduct): ProductIdentity {
  const brand = getCatalogBrand(product.extended?.brand) ?? brandFromText(product.title, product.sourceTitle, product.vendor, ...(product.tags || []));
  const heightCm = normalizeNumber(product.extended?.heightCm) ?? extractHeightCm(product.title, product.sourceTitle, product.handle);
  const cupSize = normalizeCup(product.extended?.cupSize) ?? extractCupSize(product.title, product.sourceTitle, product.handle);
  const material = normalizeMaterial(product.extended?.material ?? product.productType ?? product.title ?? product.sourceTitle ?? product.handle ?? "");
  const modelName = extractModelName(product, brand?.label);
  const modelSlug = slugify(modelName || product.handle || product.sourceHandle || product.title || "unknown-model");
  const headModel = normalizeHeadModel(product.extended?.headModel) ?? extractHeadModel(product.title, product.sourceTitle, product.handle, product.sourceHandle);
  const bodyKeyParts = [
    brand?.value || "unknown-brand",
    modelSlug || "unknown-model",
    heightCm ? `${heightCm}cm` : "height-unknown",
    cupSize ? `${cupSize.toLowerCase()}-cup` : "cup-unknown",
    material || "material-unknown"
  ];
  const bodyKey = bodyKeyParts.map(slugify).join("__");
  const key = headModel ? `${bodyKey}__${slugify(headModel)}` : bodyKey;
  const warnings = [
    !brand ? "unknown_brand" : "",
    !modelSlug || modelSlug === "unknown-model" ? "unknown_model" : "",
    !heightCm ? "missing_height_cm" : "",
    !cupSize ? "missing_cup_size" : "",
    !material ? "missing_material" : ""
  ].filter(Boolean);

  return {
    key,
    bodyKey,
    brandValue: brand?.value,
    brandLabel: brand?.label,
    headModel,
    modelSlug,
    modelName,
    heightCm,
    cupSize,
    material,
    warnings
  };
}

export function slugify(value: string | number | undefined | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function extractHeightCm(...values: Array<string | undefined | null>) {
  const text = values.filter(Boolean).join(" ");
  const match = text.match(/\b(1[2-9]\d|20\d|21\d)\s*cm\b/i);
  return match ? Number(match[1]) : undefined;
}

export function extractCupSize(...values: Array<string | undefined | null>) {
  const text = values.filter(Boolean).join(" ");
  if (/\b(?:n\/?a|none|not\s+applicable|no\s+cup)\s*-?\s*cup\b/i.test(text)) return undefined;
  const match = text.match(/\b([a-z]{1,3})\s*-?\s*cup\b/i);
  return match ? normalizeCup(match[1]) : undefined;
}

export function normalizeMaterial(value: string | undefined | null) {
  const normalized = normalizeBrandText(value);
  if (!normalized) return undefined;
  if (normalized.includes("silicone head")) return "silicone-head";
  if (normalized.includes("silicone")) return "silicone";
  if (normalized.includes("tpe")) return "tpe";
  if (normalized.includes("hybrid")) return "hybrid";
  return undefined;
}

export function extractHeadModel(...values: Array<string | undefined | null>) {
  const text = values.filter(Boolean).join(" ");
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

  return undefined;
}

export function normalizeHeadModel(value: string | undefined | null) {
  const match = String(value || "")
    .trim()
    .replace(/^#/, "")
    .match(/^[a-z]{0,4}\d{1,4}$/i);
  return match ? `head-${match[0].toLowerCase()}` : undefined;
}

function normalizeNumber(value: string | number | undefined | null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : undefined;
}

function normalizeCup(value: string | undefined | null) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(?:-|\/|\s)*cup$/i, "")
    .replace(/[^a-z0-9]+/g, "");
  if (["na", "nacup", "none", "notapplicable", "nocup"].includes(normalized)) return undefined;
  const match = String(value || "").match(/[a-z]{1,3}/i);
  return match ? match[0].toUpperCase() : undefined;
}

function extractModelName(product: IdentityProduct, brandLabel?: string) {
  const candidates = [product.title, product.sourceTitle, product.handle, product.sourceHandle].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const model = cleanModelName(candidate, brandLabel);
    if (model && model.length > 1 && !isGenericModelName(model)) return titleCase(model);
  }
  return "Unknown model";
}

function cleanModelName(value: string, brandLabel?: string) {
  let cleaned = String(value)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b(1[2-9]\d|20\d|21\d)\s*cm\b/gi, " ")
    .replace(/\b\d+\s*ft\s*\d*\b/gi, " ")
    .replace(/\b[a-z]{1,3}\s*-?\s*cup\b/gi, " ")
    .replace(/\b(tpe|silicone head|silicone|hybrid)\b/gi, " ")
    .replace(/\b(customizable|custom|companion|adult|doll|dolls|sex|ready|ship|shipping|factory|order)\b/gi, " ")
    .replace(/\b(import|gid|shopify|product)\b/gi, " ")
    .replace(/\b[0-9a-f]{4,}\b/gi, " ");

  const brand = brandFromText(brandLabel, value);
  const brandPhrases = brand ? [brand.label, brand.value, brand.collectionHandle, ...brand.aliases, ...brand.tags] : [];
  for (const phrase of brandPhrases) {
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(phrase).replace(/\\ /g, "[\\s-]+")}\\b`, "gi"), " ");
  }

  cleaned = cleaned
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-z0-9\s.'’]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function isGenericModelName(value: string) {
  return ["doll", "custom doll", "companion doll", "unknown"].includes(value.toLowerCase());
}

function titleCase(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
