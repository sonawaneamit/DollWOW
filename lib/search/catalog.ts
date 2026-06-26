import type { Product } from "@/types/product";
import { getCatalogBrand } from "@/lib/catalog/brands";

export type ParsedCatalogSearch = {
  normalizedQuery: string;
  terms: string[];
  expandedTerms: string[];
  brand?: string;
  bodyType?: "male" | "female";
  material?: string;
  availability?: "ready_to_ship" | "custom";
  heightCm?: number;
  cupSize?: string;
};

const stopWords = new Set(["doll", "dolls", "sex", "realistic", "customizable", "companion", "with", "and", "the", "for"]);

export function parseCatalogSearchQuery(query = ""): ParsedCatalogSearch {
  const normalizedQuery = normalizeSearchText(query);
  const terms = normalizedQuery.split(" ").filter((term) => term && !stopWords.has(term));
  const expandedTerms = expandCatalogSearchTerms(normalizedQuery, terms);
  const brand = parseBrand(normalizedQuery, terms);
  const bodyType = parseBodyType(normalizedQuery);
  const material = parseMaterial(normalizedQuery);
  const availability = parseAvailability(normalizedQuery);
  const heightCm = parseHeightCm(normalizedQuery);
  const cupSize = parseCupSize(normalizedQuery);

  return {
    normalizedQuery,
    terms,
    expandedTerms,
    brand,
    bodyType,
    material,
    availability,
    heightCm,
    cupSize
  };
}

export function productSearchScore(product: Product, query: string | ParsedCatalogSearch) {
  const parsed = typeof query === "string" ? parseCatalogSearchQuery(query) : query;
  if (!parsed.normalizedQuery) return 1;

  let score = 0;
  const text = productSearchText(product);
  const title = normalizeSearchText(product.title);
  const brandText = normalizeSearchText(`${product.extended.brand || ""} ${product.vendor}`);
  const materialText = normalizeSearchText(`${product.extended.material || ""} ${product.productType}`);
  const customizationText = normalizeSearchText(customizationSearchTerms(product).join(" "));
  const sourceText = normalizeSearchText(
    [product.extended.displayName, product.extended.sourceTitle, ...product.images.map((image) => image.altText || "")]
      .filter(Boolean)
      .join(" ")
  );
  const expandedTermSet = new Set(parsed.expandedTerms);

  for (const term of parsed.expandedTerms) {
    const isExpandedOnly = !parsed.terms.includes(term);

    if (title.includes(term)) score += isExpandedOnly ? 2 : 4;
    else if (brandText.includes(term)) score += isExpandedOnly ? 1 : 3;
    else if (materialText.includes(term)) score += isExpandedOnly ? 1 : 3;
    else if (customizationText.includes(term)) score += isExpandedOnly ? 2 : 3;
    else if (sourceText.includes(term)) score += isExpandedOnly ? 1 : 2;
    else if (text.includes(term)) score += 1;
  }

  if (expandedTermSet.has("hair") && productHasCustomizationIntent(product, ["hair", "wig", "hairstyle"])) {
    score += 4;
  }
  if (expandedTermSet.has("skin") && productHasCustomizationIntent(product, ["skin", "tone", "complexion"])) {
    score += 4;
  }
  if (expandedTermSet.has("eye") && productHasCustomizationIntent(product, ["eye", "iris"])) {
    score += 4;
  }

  if (parsed.brand && productMatchesBrandValue(product, parsed.brand)) score += 8;
  if (parsed.bodyType && productMatchesBodyTypeValue(product, parsed.bodyType)) score += 8;
  if (parsed.material && productMatchesMaterialValue(product, parsed.material)) score += 6;
  if (parsed.availability && product.extended.stockStatus === parsed.availability) score += 5;
  if (parsed.heightCm && product.extended.heightCm) {
    const diff = Math.abs(product.extended.heightCm - parsed.heightCm);
    if (diff === 0) score += 8;
    else if (diff <= 2) score += 4;
    else if (diff <= 5) score += 2;
  }
  if (parsed.cupSize && product.extended.cupSize?.toLowerCase() === parsed.cupSize.toLowerCase()) score += 4;

  return score;
}

export function rankCatalogProducts(products: Product[], query: string, limit = 24) {
  const parsed = parseCatalogSearchQuery(query);
  return products
    .map((product) => ({ product, score: productSearchScore(product, parsed) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.product.priceRange.minVariantPrice.amount) - Number(b.product.priceRange.minVariantPrice.amount))
    .slice(0, limit);
}

export function productMatchesCatalogSearch(product: Product, query: string) {
  return productSearchScore(product, query) > 0;
}

function productSearchText(product: Product) {
  return normalizeSearchText(
    [
      product.title,
      product.vendor,
      product.productType,
      product.description,
      product.extended.brand,
      product.extended.displayName,
      product.extended.sourceTitle,
      product.extended.material,
      product.extended.cupSize,
      product.extended.heightCm ? `${product.extended.heightCm} cm` : "",
      product.extended.weightLb ? `${product.extended.weightLb} lb` : "",
      product.extended.stockStatus,
      product.extended.warehouseCountry,
      ...product.images.map((image) => image.altText || ""),
      ...customizationSearchTerms(product),
      ...product.tags
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function customizationSearchTerms(product: Product) {
  return (product.extended.customizationGroups || []).flatMap((group) => [
    group.label,
    group.description,
    group.id,
    ...(group.options || []).flatMap((option) => [
      option.label,
      option.description,
      option.productionNote,
      option.swatch?.label,
      option.swatch?.kind === "text" ? option.swatch.value : "",
      option.swatch?.kind === "image" ? option.swatch.value.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") : ""
    ])
  ]);
}

function productHasCustomizationIntent(product: Product, keywords: string[]) {
  const searchableGroups = product.extended.customizationGroups || [];
  return searchableGroups.some((group) => {
    const groupText = normalizeSearchText([group.id, group.label, group.description].filter(Boolean).join(" "));
    return keywords.some((keyword) => groupText.includes(keyword));
  });
}

function expandCatalogSearchTerms(normalizedQuery: string, terms: string[]) {
  const expanded = new Set(terms);
  const addTerms = (values: string[]) => values.forEach((value) => expanded.add(value));

  if (/(blonde|brunette|brown hair|black hair|red hair|ginger|platinum|silver hair|pink hair)\b/.test(normalizedQuery)) {
    addTerms(["hair", "hairstyle", "wig"]);
  }
  if (/(blue eyes|green eyes|brown eyes|grey eyes|gray eyes|hazel eyes|eye color)\b/.test(normalizedQuery)) {
    addTerms(["eye", "eyes", "iris"]);
  }
  if (/(tan|deep skin|dark skin|light skin|pale skin|ivory skin|brown skin|black skin|skin tone)\b/.test(normalizedQuery)) {
    addTerms(["skin", "tone", "complexion"]);
  }
  if (/(short hair|long hair|curly hair|straight hair|bob cut)\b/.test(normalizedQuery)) {
    addTerms(["hair", "hairstyle"]);
  }

  return Array.from(expanded);
}

function productMatchesBrandValue(product: Product, brand: string) {
  const canonical = getCatalogBrand(brand);
  const value = canonical?.value || brand;
  const tags = canonical?.tags || [value];
  const brandText = normalizeSearchText(`${product.extended.brand || ""} ${product.vendor}`);
  return tags.some((tag) => product.tags.includes(tag)) || brandText.includes(normalizeSearchText(value));
}

function productMatchesMaterialValue(product: Product, material: string) {
  const normalized = normalizeSearchText(material).replace(/\s+/g, "-");
  const materialText = normalizeSearchText(`${product.extended.material || ""} ${product.productType}`).replace(/\s+/g, "-");
  return product.tags.includes(normalized) || materialText.includes(normalized);
}

function productMatchesBodyTypeValue(product: Product, bodyType: "male" | "female") {
  if (product.extended.bodyType === bodyType) return true;
  return product.tags.includes(`${bodyType}-doll`);
}

function parseBrand(normalizedQuery: string, terms: string[]) {
  for (const term of terms) {
    const brand = getCatalogBrand(term);
    if (brand) return brand.value;
  }

  for (const phrase of ["wm dolls", "se doll", "piper dolls", "yl dolls", "6ye dolls", "dolls castle"]) {
    if (normalizedQuery.includes(phrase)) return getCatalogBrand(phrase)?.value;
  }

  return undefined;
}

function parseMaterial(normalizedQuery: string) {
  if (normalizedQuery.includes("silicone head")) return "silicone-head";
  if (normalizedQuery.includes("silicone")) return "silicone";
  if (/\btpe\b/.test(normalizedQuery)) return "tpe";
  return undefined;
}

function parseBodyType(normalizedQuery: string) {
  if (/\b(male|man|men|guy|guys|boyfriend|husband)\b/.test(normalizedQuery)) return "male";
  if (/\b(female|woman|women|girl|girls|girlfriend|wife)\b/.test(normalizedQuery)) return "female";
  return undefined;
}

function parseAvailability(normalizedQuery: string) {
  if (/(ready|warehouse|in stock|ships|ship tomorrow|usa stock)/.test(normalizedQuery)) return "ready_to_ship";
  if (/(custom|factory|made to order|build)/.test(normalizedQuery)) return "custom";
  return undefined;
}

function parseHeightCm(normalizedQuery: string) {
  const match = normalizedQuery.match(/\b(1[2-9]\d|20\d|21\d)\s*cm\b/);
  return match ? Number(match[1]) : undefined;
}

function parseCupSize(normalizedQuery: string) {
  const match = normalizedQuery.match(/\b([a-z]{1,3})\s*cup\b/);
  return match ? match[1].toUpperCase() : undefined;
}

function normalizeSearchText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
