import type { Product } from "@/types/product";

export type CatalogFilters = {
  brand?: string;
  availability?: "ready_to_ship" | "custom";
  material?: string;
  height?: string;
  weight?: string;
  sort?: string;
};

export const catalogFilterOptions = {
  brands: [{ label: "WM Dolls", value: "wm" }],
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
  sorts: [
    { label: "Featured", value: "featured" },
    { label: "Price: low to high", value: "price-asc" },
    { label: "Price: high to low", value: "price-desc" },
    { label: "Height: short to tall", value: "height-asc" },
    { label: "Height: tall to short", value: "height-desc" }
  ]
} as const;

export const collectionPresets: Record<string, { title: string; filters: CatalogFilters }> = {
  "ready-to-ship": { title: "Ready-to-ship dolls", filters: { availability: "ready_to_ship" } },
  custom: { title: "Factory-order custom dolls", filters: { availability: "custom" } },
  customizable: { title: "Factory-order custom dolls", filters: { availability: "custom" } },
  "wm-dolls": { title: "WM Dolls", filters: { brand: "wm" } },
  wm: { title: "WM Dolls", filters: { brand: "wm" } },
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
    brand: valueFor("brand"),
    availability: valueFor("availability") as CatalogFilters["availability"],
    material: valueFor("material"),
    height: valueFor("height"),
    weight: valueFor("weight"),
    sort: valueFor("sort") || "featured"
  });
}

export function compactFilters(filters: CatalogFilters): CatalogFilters {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value) && value !== "featured")) as CatalogFilters;
}

export function shopifyQueryForFilters(filters: CatalogFilters) {
  const parts = [];
  if (filters.brand) parts.push(`tag:${tagForFilter(filters.brand)}`);
  if (filters.availability) parts.push(`tag:${filters.availability}`);
  if (filters.material) parts.push(`tag:${tagForFilter(filters.material)}`);
  return parts.join(" AND ") || undefined;
}

export function filterProducts(products: Product[], filters: CatalogFilters) {
  const filtered = products.filter((product) => {
    if (filters.brand && !productMatchesBrand(product, filters.brand)) return false;
    if (filters.availability && product.extended.stockStatus !== filters.availability) return false;
    if (filters.material && !productMatchesMaterial(product, filters.material)) return false;
    if (filters.height && !inRange(product.extended.heightCm, filters.height)) return false;
    if (filters.weight && !inRange(product.extended.weightLb, filters.weight)) return false;
    return true;
  });

  return sortProducts(filtered, filters.sort);
}

export function activeFilterCount(filters: CatalogFilters) {
  return Object.keys(compactFilters(filters)).length;
}

function productMatchesBrand(product: Product, brand: string) {
  const target = tagForFilter(brand);
  const brandText = `${product.extended.brand || ""} ${product.vendor}`.toLowerCase();
  return product.tags.includes(target) || brandText.includes(target.replace(/-/g, " "));
}

function productMatchesMaterial(product: Product, material: string) {
  const target = tagForFilter(material);
  const materialText = `${product.extended.material || ""} ${product.productType}`.toLowerCase().replace(/\s+/g, "-");
  return product.tags.includes(target) || materialText.includes(target);
}

function tagForFilter(value: string) {
  if (value === "ready-to-ship") return "ready_to_ship";
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, "-").replace(/^-|-$/g, "");
}

function inRange(value: number | undefined, range: string) {
  if (!value) return false;
  const [min, max] = range.split("-").map(Number);
  return Number.isFinite(min) && Number.isFinite(max) && value >= min && value <= max;
}

function sortProducts(products: Product[], sort = "featured") {
  const sorted = [...products];
  if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
  if (sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
  if (sort === "height-asc") sorted.sort((a, b) => (a.extended.heightCm || 0) - (b.extended.heightCm || 0));
  if (sort === "height-desc") sorted.sort((a, b) => (b.extended.heightCm || 0) - (a.extended.heightCm || 0));
  return sorted;
}

function price(product: Product) {
  return Number(product.priceRange.minVariantPrice.amount || 0);
}
