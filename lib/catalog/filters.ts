import type { Product } from "@/types/product";
import { brandFilterOptions, brandFromText, catalogBrands, getCatalogBrand } from "@/lib/catalog/brands";
import { getCatalogLook, lookCollectionPresets, lookFilterOptions, productMatchesLook } from "@/lib/catalog/lookTags";
import { productMatchesCatalogSearch, productSearchScore } from "@/lib/search/catalog";

export type CatalogFilters = {
  query?: string;
  brand?: string;
  look?: string;
  bodyType?: "male" | "female";
  availability?: "ready_to_ship" | "custom";
  material?: string;
  height?: string;
  weight?: string;
  cup?: string;
  price?: string;
  sort?: string;
};

export const catalogFilterOptions = {
  brands: brandFilterOptions(),
  looks: lookFilterOptions(),
  bodyTypes: [
    { label: "Female dolls", value: "female" },
    { label: "Male dolls", value: "male" }
  ],
  availability: [
    { label: "Ready to ship", value: "ready_to_ship" },
    { label: "Factory order", value: "custom" }
  ],
  materials: [
    { label: "TPE", value: "tpe" },
    { label: "Silicone", value: "silicone" },
    { label: "Silicone head", value: "silicone-head" }
  ],
  heights: [
    { label: "Under 155 cm", value: "0-154" },
    { label: "155-159 cm", value: "155-159" },
    { label: "160-164 cm", value: "160-164" },
    { label: "165-169 cm", value: "165-169" },
    { label: "170 cm+", value: "170-999" }
  ],
  weights: [
    { label: "Under 75 lb", value: "0-74" },
    { label: "75-89 lb", value: "75-89" },
    { label: "90-109 lb", value: "90-109" },
    { label: "110 lb+", value: "110-999" }
  ],
  cups: [
    { label: "A-C cup", value: "A-C" },
    { label: "D-F cup", value: "D-F" },
    { label: "G-I cup", value: "G-I" },
    { label: "J-L cup", value: "J-L" },
    { label: "M+ cup", value: "M-Z" }
  ],
  prices: [
    { label: "Under $1,500", value: "0-1499" },
    { label: "$1,500-$1,999", value: "1500-1999" },
    { label: "$2,000-$2,499", value: "2000-2499" },
    { label: "$2,500-$2,999", value: "2500-2999" },
    { label: "$3,000+", value: "3000-999999" }
  ],
  sorts: [
    { label: "Featured", value: "featured" },
    { label: "Price: low to high", value: "price-asc" },
    { label: "Price: high to low", value: "price-desc" },
    { label: "Height: short to tall", value: "height-asc" },
    { label: "Height: tall to short", value: "height-desc" }
  ]
} as const;

const filterLabelMaps: Partial<Record<keyof CatalogFilters, Map<string, string>>> = {
  brand: new Map(catalogFilterOptions.brands.map((option) => [option.value, option.label])),
  look: new Map(catalogFilterOptions.looks.map((option) => [option.value, option.label])),
  bodyType: new Map(catalogFilterOptions.bodyTypes.map((option) => [option.value, option.label])),
  availability: new Map(catalogFilterOptions.availability.map((option) => [option.value, option.label])),
  material: new Map(catalogFilterOptions.materials.map((option) => [option.value, option.label])),
  height: new Map(catalogFilterOptions.heights.map((option) => [option.value, option.label])),
  weight: new Map(catalogFilterOptions.weights.map((option) => [option.value, option.label])),
  cup: new Map(catalogFilterOptions.cups.map((option) => [option.value, option.label])),
  price: new Map(catalogFilterOptions.prices.map((option) => [option.value, option.label])),
  sort: new Map(catalogFilterOptions.sorts.map((option) => [option.value, option.label]))
} satisfies Record<string, Map<string, string>>;

export const collectionPresets: Record<string, { title: string; filters: CatalogFilters }> = {
  "ready-to-ship": { title: "Ready-to-ship dolls", filters: { availability: "ready_to_ship" } },
  custom: { title: "Factory-order custom dolls", filters: { availability: "custom" } },
  customizable: { title: "Factory-order custom dolls", filters: { availability: "custom" } },
  "female-dolls": { title: "Female dolls", filters: { bodyType: "female" } },
  "male-dolls": { title: "Male dolls", filters: { bodyType: "male" } },
  ...lookCollectionPresets(),
  ...brandCollectionPresets(),
  tpe: { title: "TPE dolls", filters: { material: "tpe" } },
  silicone: { title: "Silicone dolls", filters: { material: "silicone" } },
  "silicone-head": { title: "Silicone-head dolls", filters: { material: "silicone-head" } },
  "height-under-155": { title: "Dolls under 155 cm", filters: { height: "0-154" } },
  "height-155-159": { title: "Dolls 155-159 cm", filters: { height: "155-159" } },
  "height-160-164": { title: "Dolls 160-164 cm", filters: { height: "160-164" } },
  "height-165-169": { title: "Dolls 165-169 cm", filters: { height: "165-169" } },
  "height-170-plus": { title: "Dolls 170 cm+", filters: { height: "170-999" } },
  "lighter": { title: "Lighter dolls", filters: { weight: "0-74" } }
};

export function filtersFromSearchParams(params: Record<string, string | string[] | undefined> = {}): CatalogFilters {
  const valueFor = (key: keyof CatalogFilters) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return compactFilters({
    query: valueFor("query"),
    brand: valueFor("brand"),
    look: valueFor("look"),
    bodyType: valueFor("bodyType") as CatalogFilters["bodyType"],
    availability: valueFor("availability") as CatalogFilters["availability"],
    material: valueFor("material"),
    height: valueFor("height"),
    weight: valueFor("weight"),
    cup: valueFor("cup"),
    price: valueFor("price"),
    sort: valueFor("sort") || "featured"
  });
}

export function compactFilters(filters: CatalogFilters): CatalogFilters {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value) && value !== "featured")) as CatalogFilters;
}

export function shopifyQueryForFilters(filters: CatalogFilters) {
  const parts = [];
  if (filters.brand) parts.push(shopifyBrandQuery(filters.brand));
  if (filters.look) parts.push(shopifyLookQuery(filters.look));
  if (filters.bodyType) parts.push(`tag:${filters.bodyType}-doll`);
  if (filters.availability) parts.push(`tag:${filters.availability}`);
  if (filters.material) parts.push(`tag:${tagForFilter(filters.material)}`);
  return parts.join(" AND ") || undefined;
}

export function filterProducts(products: Product[], filters: CatalogFilters) {
  const filtered = products.filter((product) => {
    if (filters.query && !productMatchesCatalogSearch(product, filters.query)) return false;
    if (filters.brand && !productMatchesBrand(product, filters.brand)) return false;
    if (filters.look && !productMatchesLook(product, filters.look)) return false;
    if (filters.bodyType && !productMatchesBodyType(product, filters.bodyType)) return false;
    if (filters.availability && product.extended.stockStatus !== filters.availability) return false;
    if (filters.material && !productMatchesMaterial(product, filters.material)) return false;
    if (filters.height && !inRange(product.extended.heightCm, filters.height)) return false;
    if (filters.weight && !inRange(product.extended.weightLb, filters.weight)) return false;
    if (filters.cup && !cupMatches(product.extended.cupSize, filters.cup)) return false;
    if (filters.price && !inRange(price(product), filters.price)) return false;
    return true;
  });

  return sortProducts(filtered, filters.sort, filters.query);
}

export function activeFilterCount(filters: CatalogFilters) {
  return Object.keys(compactFilters(filters)).length;
}

export function getCatalogFilterLabel(key: keyof CatalogFilters, value?: string) {
  if (!value) return undefined;
  if (key === "query") return `Search: ${value}`;
  const label = filterLabelMaps[key]?.get(value);
  if (label) return label;
  return value;
}

export function requiresCatalogWideFetch(filters: CatalogFilters) {
  return Boolean(
    filters.query ||
      filters.look ||
      filters.height ||
      filters.weight ||
      filters.cup ||
      filters.price ||
      (filters.sort && filters.sort !== "featured")
  );
}

function productMatchesBrand(product: Product, brand: string) {
  const canonical = getCatalogBrand(brand);
  const target = canonical?.value || tagForFilter(brand);
  const declaredBrand = getCatalogBrand(product.extended.brand) ?? brandFromText(product.extended.brand, product.vendor);

  if (declaredBrand) {
    return declaredBrand.value === target;
  }

  const sourceBrand = brandFromText(product.title, product.extended.sourceTitle);
  if (sourceBrand) {
    return sourceBrand.value === target;
  }

  const tags = canonical?.tags || [target];
  return tags.some((tag) => product.tags.includes(tag));
}

function productMatchesMaterial(product: Product, material: string) {
  const target = tagForFilter(material);
  const materialText = `${product.extended.material || ""} ${product.productType}`.toLowerCase().replace(/\s+/g, "-");
  return product.tags.includes(target) || materialText.includes(target);
}

function productMatchesBodyType(product: Product, bodyType: NonNullable<CatalogFilters["bodyType"]>) {
  if (product.extended.bodyType === bodyType) return true;
  return product.tags.includes(`${bodyType}-doll`);
}

function tagForFilter(value: string) {
  if (value === "ready-to-ship") return "ready_to_ship";
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, "-").replace(/^-|-$/g, "");
}

function shopifyBrandQuery(brand: string) {
  const canonical = getCatalogBrand(brand);
  const target = tagForFilter(canonical?.value || brand);
  if (target === "yl") {
    return "tag:yl AND -tag:wm AND -tag:irontech AND -tag:sedoll";
  }
  const tags = canonical?.tags?.length ? canonical.tags : [target];
  return tags.length === 1 ? `tag:${tags[0]}` : `(${tags.map((tag) => `tag:${tag}`).join(" OR ")})`;
}

function shopifyLookQuery(look: string) {
  const catalogLook = getCatalogLook(look);
  return `tag:${tagForFilter(catalogLook?.value || look)}`;
}

function brandCollectionPresets() {
  return Object.fromEntries(
    catalogBrands.flatMap((brand) => [
      [brand.collectionHandle, { title: brand.label, filters: { brand: brand.value } }],
      [brand.value, { title: brand.label, filters: { brand: brand.value } }]
    ])
  ) as Record<string, { title: string; filters: CatalogFilters }>;
}

function inRange(value: number | undefined, range: string) {
  if (value === undefined || value === null || Number.isNaN(value)) return false;
  const [min, max] = range.split("-").map(Number);
  return Number.isFinite(min) && Number.isFinite(max) && value >= min && value <= max;
}

function cupMatches(cupSize: string | undefined, range: string) {
  if (!cupSize) return false;
  const normalizedCup = cupSize.trim().toUpperCase();
  const [min, max] = range.split("-");
  if (!normalizedCup || !min || !max) return false;
  const code = normalizedCup.charCodeAt(0);
  return code >= min.charCodeAt(0) && code <= max.charCodeAt(0);
}

function sortProducts(products: Product[], sort = "featured", query?: string) {
  const sorted = [...products];
  if ((!sort || sort === "featured") && query) sorted.sort((a, b) => productSearchScore(b, query) - productSearchScore(a, query));
  if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
  if (sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
  if (sort === "height-asc") sorted.sort((a, b) => (a.extended.heightCm || 0) - (b.extended.heightCm || 0));
  if (sort === "height-desc") sorted.sort((a, b) => (b.extended.heightCm || 0) - (a.extended.heightCm || 0));
  return sorted;
}

function price(product: Product) {
  return Number(product.priceRange.minVariantPrice.amount || 0);
}
