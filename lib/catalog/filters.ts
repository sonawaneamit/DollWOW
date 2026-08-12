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
  region?: "us" | "eu" | "ca" | "au";
  material?: string;
  productForm?: "full-doll" | "torso" | "hips";
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
    { label: "Female", value: "female" },
    { label: "Male", value: "male" }
  ],
  availability: [
    { label: "Ready to ship", value: "ready_to_ship" },
    { label: "Factory order", value: "custom" }
  ],
  regions: [
    { label: "United States", shortLabel: "US", value: "us", flag: "🇺🇸" },
    { label: "European Union", shortLabel: "EU", value: "eu", flag: "🇪🇺" },
    { label: "Canada", shortLabel: "Canada", value: "ca", flag: "🇨🇦" },
    { label: "Australia", shortLabel: "Australia", value: "au", flag: "🇦🇺" }
  ],
  materials: [
    { label: "TPE", value: "tpe" },
    { label: "Full silicone", value: "silicone" },
    { label: "Hybrid (silicone head + TPE body)", value: "hybrid" }
  ],
  productForms: [
    { label: "Full dolls", value: "full-doll" },
    { label: "Torsos", value: "torso" },
    { label: "Hips", value: "hips" }
  ],
  heights: [
    { label: "Up to 120 cm", value: "0-120" },
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
    { label: "Up to $1,000", value: "0-1000" },
    { label: "Under $1,500", value: "0-1499" },
    { label: "$1,500-$1,999", value: "1500-1999" },
    { label: "$2,000-$2,499", value: "2000-2499" },
    { label: "$2,500-$2,999", value: "2500-2999" },
    { label: "$3,000+", value: "3000-999999" }
  ],
  sorts: [
    { label: "Featured", value: "featured" },
    { label: "Latest arrivals", value: "latest" },
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
  region: new Map(catalogFilterOptions.regions.map((option) => [option.value, option.label])),
  material: new Map(catalogFilterOptions.materials.map((option) => [option.value, option.label])),
  productForm: new Map(catalogFilterOptions.productForms.map((option) => [option.value, option.label])),
  height: new Map(catalogFilterOptions.heights.map((option) => [option.value, option.label])),
  weight: new Map(catalogFilterOptions.weights.map((option) => [option.value, option.label])),
  cup: new Map(catalogFilterOptions.cups.map((option) => [option.value, option.label])),
  price: new Map(catalogFilterOptions.prices.map((option) => [option.value, option.label])),
  sort: new Map(catalogFilterOptions.sorts.map((option) => [option.value, option.label]))
} satisfies Record<string, Map<string, string>>;

export const collectionPresets: Record<string, { title: string; filters: CatalogFilters }> = {
  "sex-dolls": { title: "Sex dolls", filters: {} },
  "realistic-sex-dolls": { title: "Most realistic sex dolls", filters: { material: "silicone", productForm: "full-doll" } },
  "ready-to-ship": { title: "Ready-to-ship sex dolls", filters: { availability: "ready_to_ship" } },
  custom: { title: "Custom sex dolls", filters: { availability: "custom", productForm: "full-doll" } },
  customizable: { title: "Custom sex dolls", filters: { availability: "custom", productForm: "full-doll" } },
  "female-dolls": { title: "Female dolls", filters: { bodyType: "female" } },
  "male-dolls": { title: "Male dolls", filters: { bodyType: "male" } },
  ...lookCollectionPresets(),
  "asian-dolls": { title: "Asian sex dolls", filters: { look: "look-asian" } },
  "black-dolls": { title: "Black sex dolls", filters: { look: "skin-black" } },
  "anime-dolls": { title: "Anime sex dolls", filters: { look: "look-anime" } },
  "fuller-dolls": { title: "Fuller and curvy sex dolls", filters: { look: "shape-fuller", bodyType: "female" } },
  "slim-dolls": { title: "Slim sex dolls", filters: { look: "shape-slim", bodyType: "female" } },
  ...brandCollectionPresets(),
  tpe: { title: "TPE sex dolls", filters: { material: "tpe", productForm: "full-doll" } },
  silicone: { title: "Silicone sex dolls", filters: { material: "silicone" } },
  hybrid: { title: "Hybrid dolls", filters: { material: "hybrid" } },
  "silicone-head": { title: "Hybrid dolls", filters: { material: "hybrid" } },
  torsos: { title: "Torso sex dolls", filters: { productForm: "torso" } },
  hips: { title: "Hips", filters: { productForm: "hips" } },
  "mini-sex-dolls": { title: "Mini sex dolls", filters: { productForm: "full-doll", height: "0-120" } },
  "petite-dolls": { title: "Petite sex dolls", filters: { productForm: "full-doll", height: "121-154" } },
  "cheap-sex-dolls": { title: "Affordable sex dolls", filters: { price: "0-1000", sort: "price-asc" } },
  "height-under-155": { title: "Dolls under 155 cm", filters: { height: "0-154" } },
  "height-155-159": { title: "Dolls 155-159 cm", filters: { height: "155-159" } },
  "height-160-164": { title: "Dolls 160-164 cm", filters: { height: "160-164" } },
  "height-165-169": { title: "Dolls 165-169 cm", filters: { height: "165-169" } },
  "height-170-plus": { title: "Dolls 170 cm+", filters: { height: "170-999" } },
  "lightweight-sex-dolls": { title: "Lightweight sex dolls", filters: { productForm: "full-doll", weight: "0-74" } },
  "new-sex-dolls": { title: "New sex dolls", filters: { sort: "latest" } }
};

const collectionAliases: Record<string, string> = {
  customizable: "custom",
  "silicone-head": "hybrid"
};

export function canonicalShopCollectionHandle(handle: string) {
  const look = getCatalogLook(handle);
  if (look && handle !== look.collectionHandle) return look.collectionHandle;
  return collectionAliases[handle] || handle;
}

export function isIndexableShopCollectionHandle(handle: string) {
  return canonicalShopCollectionHandle(handle) === handle;
}

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
    region: valueFor("region") as CatalogFilters["region"],
    material: valueFor("material"),
    productForm: valueFor("productForm") as CatalogFilters["productForm"],
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
  if (filters.query) {
    const textQuery = shopifyQueryForCatalogSearch(filters.query);
    if (textQuery) parts.push(textQuery);
  }
  if (filters.brand) parts.push(shopifyBrandQuery(filters.brand));
  if (filters.look) parts.push(shopifyLookQuery(filters.look));
  if (filters.bodyType) parts.push(`tag:${filters.bodyType}-doll`);
  if (filters.availability) parts.push(`tag:${filters.availability}`);
  if (filters.material) parts.push(shopifyMaterialQuery(filters.material));
  if (filters.productForm) parts.push(shopifyProductFormQuery(filters.productForm));
  return parts.join(" AND ") || undefined;
}

export function shopifyQueryForCatalogSearch(query: string) {
  const terms = String(query || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  if (!terms.length) return undefined;

  const expanded = terms.map((term) => {
    if (term === "evie" || term === "eive") return "(evie OR eive)";
    if (["busty", "buxom"].includes(term)) return "(busty OR curvy OR tag:shape-curvy OR tag:shape-fuller)";
    if (["blonde", "blond", "platinum"].includes(term)) return "(blonde OR blond OR platinum OR tag:hair-blonde)";
    if (["brunette"].includes(term)) return "(brunette OR tag:hair-brunette)";
    if (["petite", "compact"].includes(term)) return `(${term} OR tag:shape-petite)`;
    return term;
  });
  return expanded.join(" AND ");
}

export function filterProducts(products: Product[], filters: CatalogFilters) {
  const filtered = products.filter((product) => {
    if (filters.query && !productMatchesCatalogSearch(product, filters.query)) return false;
    if (filters.brand && !productMatchesBrand(product, filters.brand)) return false;
    if (filters.look && !productMatchesLook(product, filters.look)) return false;
    if (filters.bodyType && !productMatchesBodyType(product, filters.bodyType)) return false;
    if (filters.availability && product.extended.stockStatus !== filters.availability) return false;
    if (filters.region && !productMatchesWarehouseRegion(product, filters.region)) return false;
    if (filters.material && !productMatchesMaterial(product, filters.material)) return false;
    if (filters.productForm && !productMatchesProductForm(product, filters.productForm)) return false;
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
    filters.look ||
      filters.height ||
      filters.weight ||
      filters.cup ||
      filters.price ||
      filters.region ||
      (filters.sort && filters.sort !== "featured")
  );
}

function productMatchesWarehouseRegion(product: Product, region: NonNullable<CatalogFilters["region"]>) {
  const values = [...(product.extended.warehouseRegions || []), product.extended.warehouseCountry || ""]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const aliases: Record<NonNullable<CatalogFilters["region"]>, string[]> = {
    us: ["united states", "united states of america", "usa", "us", "u.s."],
    eu: ["european union", "eu", "europe"],
    ca: ["canada"],
    au: ["australia"]
  };
  return values.some((value) => aliases[region].includes(value));
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
  const tags = new Set(product.tags.map(tagForFilter));
  const text = `${product.title} ${product.extended.sourceTitle || ""} ${product.extended.material || ""} ${product.productType}`.toLowerCase();
  const isHybrid = tags.has("hybrid") || tags.has("silicone-head") || /silicone\s*head|hybrid|tpe\s*body.*silicone\s*head/.test(text);
  if (material === "hybrid") return isHybrid;
  if (material === "silicone") return !isHybrid && (tags.has("silicone") || /\bsilicone\b/.test(text));
  if (material === "tpe") return !isHybrid && (tags.has("tpe") || /\btpe\b/.test(text));
  return tags.has(tagForFilter(material));
}

function productMatchesProductForm(product: Product, form: NonNullable<CatalogFilters["productForm"]>) {
  const tags = new Set(product.tags.map(tagForFilter));
  const text = [
    product.productType,
    product.title,
    product.extended.sourceTitle,
    product.extended.catalogIdentityKey,
    product.extended.catalogBodyIdentityKey,
    product.featuredImage?.altText,
    product.featuredImage?.url
  ].filter(Boolean).join(" ").toLowerCase();
  const inferredCompactForm = compactPartialProductForm(product);
  const isHips = inferredCompactForm === "hips" || /\b(hips?|hip torso|lower body|butt(?:ocks?)?|big[\s_-]+ass)\b/.test(text);
  const isTorso = !isHips && (inferredCompactForm === "torso" || /\b(torsos?|upper body|half body|partial body|body only|body profile)\b/.test(text));
  const isStandaloneHead = /\b(replacement head|standalone head|doll head|head only)\b/.test(text);
  if (isStandaloneHead) return false;
  if (isHips || tags.has("hips")) return form === "hips";
  if (isTorso || tags.has("torso")) return form === "torso";
  if (tags.has("full-doll")) return form === "full-doll";
  if (form === "hips") return isHips;
  if (form === "torso") return isTorso;
  return !isHips && !isTorso;
}

function compactPartialProductForm(product: Product): "torso" | "hips" | null {
  const heightCm = Number(product.extended.heightCm || 0);
  const measurements = product.extended.measurements;
  if (!measurements || heightCm <= 0 || heightCm > 120) return null;

  const normalized = new Map(
    Object.entries(measurements).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]+/g, ""), String(value || "").trim()])
  );
  const limbKeys = ["feetlength", "legslength", "armslength"];
  const hasCompleteLimbProfile = limbKeys.every((key) => normalized.has(key));
  const unavailableLimbMeasurements = limbKeys.filter((key) => isUnavailableMeasurement(normalized.get(key))).length;
  if (!hasCompleteLimbProfile || unavailableLimbMeasurements < 2) return null;

  const hasBust = ["bust", "upperbust", "upperchest"].some((key) => isAvailableMeasurement(normalized.get(key)));
  const hasWaistOrHip = ["waist", "hip", "hipcircumference"].some((key) => isAvailableMeasurement(normalized.get(key)));
  if (!hasWaistOrHip) return null;
  return hasBust ? "torso" : "hips";
}

function isAvailableMeasurement(value: string | undefined) {
  return Boolean(value) && !isUnavailableMeasurement(value);
}

function isUnavailableMeasurement(value: string | undefined) {
  return !value || /^(?:n\/?a|none|unknown|not available|-|0)$/i.test(value.trim());
}

function shopifyMaterialQuery(material: string) {
  if (material === "hybrid") return "(tag:hybrid OR tag:silicone-head)";
  if (material === "silicone") return "tag:silicone AND -tag:silicone-head AND -tag:hybrid";
  if (material === "tpe") return "tag:tpe AND -tag:silicone-head AND -tag:hybrid";
  return `tag:${tagForFilter(material)}`;
}

function shopifyProductFormQuery(form: NonNullable<CatalogFilters["productForm"]>) {
  if (form === "hips") return "tag:hips";
  if (form === "torso") return "tag:torso AND -tag:hips";
  return "-tag:torso AND -tag:hips";
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
  if (value === undefined || value === null || Number.isNaN(value) || value <= 0) return false;
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
  if (sort === "latest") sorted.sort((a, b) => (b.extended.sourceReleaseRank || 0) - (a.extended.sourceReleaseRank || 0));
  if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
  if (sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
  if (sort === "height-asc") sorted.sort((a, b) => (a.extended.heightCm || 0) - (b.extended.heightCm || 0));
  if (sort === "height-desc") sorted.sort((a, b) => (b.extended.heightCm || 0) - (a.extended.heightCm || 0));
  return sorted;
}

function price(product: Product) {
  return Number(product.priceRange.minVariantPrice.amount || 0);
}
