import { getCatalogBrand } from "@/lib/catalog/brands";
import type { Product } from "@/types/product";

export type CatalogNamingInput = {
  brand?: string | null;
  modelName?: string | null;
  heightCm?: number | string | null;
  cupSize?: string | null;
  material?: string | null;
  productKind?: "full_doll" | "torso" | "head" | "accessory" | string | null;
  stockStatus?: string | null;
  customAvailable?: boolean | null;
};

export type CatalogNameParts = {
  title: string;
  handleBase: string;
  facts: string[];
};

const MATERIAL_LABELS: Record<string, string> = {
  tpe: "TPE",
  silicone: "Silicone",
  "silicone-head": "Silicone Head",
  hybrid: "Hybrid"
};

export function buildDollWowCatalogName(input: CatalogNamingInput): CatalogNameParts {
  const brand = getCatalogBrand(input.brand)?.label ?? cleanText(input.brand);
  const model = safeModelName(input.modelName) || brand || "DollWow";
  const height = normalizeHeight(input.heightCm);
  const cup = normalizeCup(input.cupSize);
  const material = normalizeMaterial(input.material);
  const productKind = normalizeProductKind(input.productKind);
  const availability = availabilityLabel(input);

  const specParts = [height, cup ? `${cup}-Cup` : "", material, availability, productKindLabel(productKind)].filter(Boolean);
  const title = preserveAcronyms(cleanText(`${model} ${specParts.join(" ")}`));

  return {
    title,
    handleBase: slugify(title),
    facts: specParts
  };
}

export function normalizePublicTitleForAudit(title: string | undefined | null) {
  return cleanText(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(customizable|ready\s*to\s*ship|companion|doll|dolls)\b/g, " ")
    .replace(/\b(na|n\/a)\s*-?\s*cup\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function productPublicTitle(product: Product) {
  return buildProductTitle(product, { seo: false });
}

export function productSeoTitle(product: Product) {
  return buildProductTitle(product, { seo: true });
}

export function productPdpTitle(product: Product) {
  const { height, cup, material, headTitlePart, kind, availability, includeVisibleHead } = buildProductNamingData(product);
  const baseParts = [height, cup ? `${cup}-Cup` : "", material, includeVisibleHead ? headTitlePart : ""].filter(Boolean);
  const suffixParts = [availability, shouldAppendKind(baseParts.join(" "), kind) ? kind : ""].filter(Boolean);
  return preserveAcronyms(cleanText([...baseParts, ...suffixParts].join(" "))) || productPublicTitle(product);
}

function buildProductTitle(product: Product, { seo }: { seo: boolean }) {
  const { brand, series, model, height, cup, material, kind, availability, headTitlePart, includeSeoHead, includeVisibleHead } = buildProductNamingData(product);
  const publicModel = isReferenceLikeName(model) && !seo ? "" : model;
  const normalizedSeries = cleanText(series).toLowerCase();
  const normalizedModel = cleanText(publicModel).toLowerCase();
  const baseParts = [
    brand,
    publicModel,
    normalizedSeries && normalizedSeries === normalizedModel ? "" : series,
    height,
    cup ? `${cup}-Cup` : "",
    material,
    seo ? (includeSeoHead ? headTitlePart : "") : includeVisibleHead ? headTitlePart : ""
  ].filter(Boolean);
  const suffixParts = seo ? [availability, shouldAppendKind(baseParts.join(" "), kind) ? kind : ""].filter(Boolean) : [];
  const parts = [...baseParts, ...suffixParts];

  return preserveAcronyms(cleanText(parts.join(" "))) || product.title;
}

function buildProductNamingData(product: Product) {
  const brand = shortBrandLabel(product.extended.brand || product.vendor);
  const series = sourceSeries(product.title);
  const model = productDisplayName(product);
  const height = normalizeHeight(product.extended.heightCm);
  const cup = normalizeCup(product.extended.cupSize);
  const material = normalizeMaterial(product.extended.material || product.productType);
  const inferredKind = inferProductKind(product);
  const kind = material === MATERIAL_LABELS["silicone-head"] && inferredKind === "head" ? "" : productKindLabel(inferredKind);
  const availability = product.extended.stockStatus === "ready_to_ship" ? "Ready-To-Ship" : product.extended.customAvailable ? "Customizable" : "";
  const head = product.extended.headModel ? readableHeadModel(product.extended.headModel) : "";
  const headTitlePart = formatHeadTitlePart(material, head);
  const includeHead = !hasSameHeadReference(model, head) && !hasSameHeadReference(series, head);
  const includeVisibleHead = includeHead && inferredKind === "head";
  const includeSeoHead = includeHead;

  return { brand, series, model, height, cup, material, kind, availability, head, headTitlePart, includeHead, includeVisibleHead, includeSeoHead };
}

export function productDisplayName(product: Product) {
  if (product.extended.displayName) return cleanText(product.extended.displayName);

  const brand = shortBrandLabel(product.extended.brand || product.vendor);
  const sourceOrTitle = product.extended.sourceTitle || product.title;
  const handle = product.extended.sourceHandle || product.handle;
  const series = sourceSeries(sourceOrTitle);
  const model = publicModelName(sourceOrTitle, handle, series, brand);
  if (model) return model;
  if (series) return series;
  if (product.extended.headModel) return readableHeadModel(product.extended.headModel);
  return "";
}

export function productDisplayNameForUi(product: Product) {
  const name = productDisplayName(product);
  return isReferenceLikeName(name) ? "" : name;
}

export function productSeoAliases(product: Product) {
  return Array.from(
    new Set(
      [
        product.extended.displayName,
        product.title,
        product.extended.sourceTitle,
        product.extended.sourceHandle?.replace(/-/g, " "),
        product.handle.replace(/-/g, " "),
        product.extended.catalogIdentityKey?.replace(/__/g, " ").replace(/_/g, " "),
        product.extended.catalogBodyIdentityKey?.replace(/__/g, " ").replace(/_/g, " "),
        product.extended.headModel
      ]
        .filter(Boolean)
        .map((value) => cleanText(value))
    )
  );
}

export function normalizeCup(value: string | undefined | null) {
  const text = cleanText(value);
  const normalized = text
    .toLowerCase()
    .replace(/(?:-|\/|\s)*cup$/i, "")
    .replace(/[^a-z0-9]+/g, "");
  if (!normalized || ["na", "nacup", "none", "notapplicable", "nocup"].includes(normalized)) return "";
  const match = text.match(/[a-z]{1,3}/i);
  return match ? match[0].toUpperCase() : "";
}

export function normalizeMaterial(value: string | undefined | null) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized.includes("silicone head")) return MATERIAL_LABELS["silicone-head"];
  if (normalized.includes("silicone")) return MATERIAL_LABELS.silicone;
  if (normalized.includes("tpe")) return MATERIAL_LABELS.tpe;
  if (normalized.includes("hybrid")) return MATERIAL_LABELS.hybrid;
  return "";
}

function safeModelName(value: string | undefined | null) {
  const cleaned = cleanText(value)
    .replace(/\b(rosemary|rosemarydoll|joy\s*love|joylovedolls?)\b/gi, "")
    .replace(/\b(customizable|ready\s*to\s*ship|companion|doll|dolls|sex)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return titleCase(cleaned);
}

function publicModelName(title: string | undefined | null, handle: string | undefined | null, series: string, brand: string) {
  const candidates = [
    extractBrandQualifiedName(title, brand),
    extractNamedSuffix(title),
    extractLeadingName(title),
    extractBrandQualifiedName(handle?.replace(/-/g, " "), brand),
    extractLeadingName(handle?.replace(/-/g, " "))
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const cleaned = sanitizePublicModelName(stripLeadingBrand(candidate, brand), series);
    if (cleaned) return cleaned;
  }

  return "";
}

function normalizeHeight(value: string | number | undefined | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return `${Math.round(parsed)}cm`;
}

function normalizeProductKind(value: CatalogNamingInput["productKind"]) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "head") return "head";
  if (normalized === "torso") return "torso";
  if (normalized === "accessory") return "accessory";
  return "full_doll";
}

function inferProductKind(product: Product) {
  const productType = cleanText(product.productType).toLowerCase();
  const text = cleanText(`${productType} ${product.tags.join(" ")}`).toLowerCase();
  if (/\bsilicone[-\s]?head\s+doll\b/.test(productType) || /\bsilicone[-\s]?head\s+companion\b/.test(productType)) return "full_doll";
  if (/\b(replacement\s+head|standalone\s+head|doll\s+head|heads?)\b/.test(productType)) return "head";
  if (/\btorso\b/.test(text)) return "torso";
  if (/\b(accessory|care kit|stand|wig)\b/.test(text)) return "accessory";
  return "full_doll";
}

function productKindLabel(productKind: string) {
  if (productKind === "head") return "Head";
  if (productKind === "torso") return "Torso";
  if (productKind === "accessory") return "Accessory";
  return "Companion Doll";
}

function availabilityLabel(input: CatalogNamingInput) {
  if (input.stockStatus === "ready_to_ship") return "Ready-To-Ship";
  if (input.customAvailable) return "Customizable";
  return "";
}

function sourceSeries(title: string) {
  const match = title.match(/\b(zelex\s+)?(sle|evo|gynoid|zen|ros|ai)\s*\d+(?:\.\d+)?\b/i);
  return match ? match[0].replace(/^zelex\s+/i, "").toUpperCase() : "";
}

function readableHeadModel(value: string) {
  const match = value.match(/(?:head[-_\s]*)?([a-z]?\d+[a-z]?)/i);
  return match ? `Head ${match[1].toUpperCase()}` : "";
}

function formatHeadTitlePart(material: string, head: string) {
  const normalizedMaterial = cleanText(material).toLowerCase();
  if (normalizedMaterial !== "silicone head") return head;
  const match = cleanText(head).match(/^Head\s+(.+)$/i);
  return match ? match[1].toUpperCase() : head;
}

function hasSameHeadReference(left: string | undefined | null, right: string | undefined | null) {
  const a = normalizeHeadReference(left);
  const b = normalizeHeadReference(right);
  return Boolean(a && b && a === b);
}

function normalizeHeadReference(value: string | undefined | null) {
  const cleaned = cleanText(value).toLowerCase();
  if (!cleaned) return "";
  const match = cleaned.match(/(?:head[-_\s#]*)?([a-z]?\d+[a-z]?)/i);
  return match ? match[1].toUpperCase() : "";
}

function isReferenceLikeName(value: string | undefined | null) {
  const cleaned = cleanText(value);
  if (!cleaned) return false;
  if (/^Head\s+[A-Z]?\d+[A-Z]?$/i.test(cleaned)) return true;
  if (/^(SLE|EVO|AI|ROS|ZEN|GYNOID)\s*\d+(?:\.\d+)?$/i.test(cleaned)) return true;
  return false;
}

function shouldAppendKind(title: string, kind: string) {
  if (!kind) return false;
  const normalizedTitle = cleanText(title).toLowerCase();
  const normalizedKind = cleanText(kind).toLowerCase();
  if (!normalizedKind) return false;
  if (normalizedTitle.includes(normalizedKind)) return false;
  if (normalizedKind === "companion doll") return true;
  return true;
}

function shortBrandLabel(value: string | undefined | null) {
  const brand = getCatalogBrand(value);
  const label = brand?.label ?? cleanText(value);
  if (!label) return "";
  if (brand?.value === "wm") return "WM";
  return label.replace(/\s+dolls$/i, "");
}

function extractNamedSuffix(value: string | undefined | null) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const match = cleaned.match(/\s[-–]\s([^()]+?)(?:\s*\([^)]*\))?$/);
  return match ? cleanText(match[1]) : "";
}

function extractLeadingName(value: string | undefined | null) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  const match = cleaned.match(/^([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*){0,2})\s+\d{2,3}\s*cm\b/i);
  return match ? cleanText(match[1]) : "";
}

function extractBrandQualifiedName(value: string | undefined | null, brand: string) {
  const cleaned = cleanText(value);
  const brandLabel = cleanText(brand);
  if (!cleaned || !brandLabel) return "";

  const compactBrand = escapeRegExp(brandLabel.replace(/\s+dolls$/i, "").trim());
  if (!compactBrand) return "";

  const match = cleaned.match(new RegExp(`^${compactBrand}\\s+([A-Za-z][A-Za-z'\\-]*(?:\\s+[A-Za-z][A-Za-z'\\-]*){0,1})\\s+\\d{2,3}\\s*cm\\b`, "i"));
  return match ? cleanText(match[1]) : "";
}

function sanitizePublicModelName(value: string, series: string) {
  const cleaned = cleanText(value)
    .replace(/[._]+/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(rosemary|rosemarydoll|joy\s*love|joylovedolls?)\b/gi, "")
    .replace(/\b(ready[-\s]?to[-\s]?ship|customizable|companion|doll|dolls|sex|adult|silicone|tpe|hybrid|head|torso)\b/gi, "")
    .replace(/\b\d{2,3}\s*cm\b/gi, "")
    .replace(/\b\d+\s*ft\s*\d*\b/gi, "")
    .replace(/\b[a-z]{1,3}\s*-?\s*cup\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  const numericHead = cleaned.match(/^#?\s*([a-z]?\d+[a-z]?)$/i);
  if (numericHead) return `Head ${numericHead[1].toUpperCase()}`;

  const words = cleaned.split(" ").filter(Boolean);
  if (!words.length || words.length > 2) return "";
  if (series && words.length > 1) return "";
  if (words.every((word) => word.length <= 2)) return "";

  const normalized = titleCase(cleaned);
  const generic = normalized.toLowerCase();
  if (["heads", "head", "realistic ai companion"].includes(generic)) return "";
  return normalized;
}

function stripLeadingBrand(value: string, brand: string) {
  const cleaned = cleanText(value);
  const shortBrand = cleanText(brand).replace(/\s+dolls$/i, "");
  if (!cleaned || !shortBrand) return cleaned;
  return cleaned.replace(new RegExp(`^${escapeRegExp(shortBrand)}\\s+`, "i"), "").trim();
}

function cleanText(value: string | number | undefined | null) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function preserveAcronyms(value: string) {
  return value
    .replace(/\bTpe\b/g, "TPE")
    .replace(/\bNa\b/g, "N/A")
    .replace(/\bUsa\b/g, "USA")
    .replace(/\bUk\b/g, "UK")
    .replace(/\bEu\b/g, "EU");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
