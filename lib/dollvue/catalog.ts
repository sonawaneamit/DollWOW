import type { Product } from "@/types/product";

export const DOLLVUE_PRODUCT_HANDLES = [
  "irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb",
  "irontech-penny-164cm-f-cup-silicone-head-companion-doll-1ttey",
  "irontech-dark-164cm-f-cup-silicone-companion-doll-1k1t7",
  "real-lady-shizuka-159cm-h-cup-silicone-companion-doll-1ldrw",
  "wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj",
  "lusandy-nadia-159cm-g-cup-silicone-companion-doll"
] as const;
const DOLLVUE_PRODUCT_HANDLE_PREFIXES: readonly string[] = ["irontech-", "starpery-", "lusandy-", "funwest-dolls-", "top-fire-doll-"];
const DOLLVUE_EXCLUDED_HANDLES = new Set([
  "lusandy-sex-doll-heads"
]);
export const DOLLVUE_DEFAULT_PRODUCT_HANDLE = DOLLVUE_PRODUCT_HANDLES[0];

export function isDollVueProduct(handle: string) {
  const normalizedHandle = handle.toLowerCase();
  if (isExcludedLusandyHandle(normalizedHandle)) return false;
  return DOLLVUE_PRODUCT_HANDLES.includes(normalizedHandle as (typeof DOLLVUE_PRODUCT_HANDLES)[number]) ||
    DOLLVUE_PRODUCT_HANDLE_PREFIXES.some((prefix) => normalizedHandle.startsWith(prefix));
}

export function isDollVueCatalogProduct(product: Product) {
  if (typeof product.dollVueAvailable === 'boolean') return product.dollVueAvailable;
  return isLegacyDollVueCatalogProduct(product);
}

export function isLegacyDollVueCatalogProduct(product: Product) {
  const handle = product.handle.toLowerCase();
  const excludedLusandyProduct = handle.startsWith("lusandy-") &&
    (isExcludedLusandyHandle(handle) || String(product.extended.bodyType).toLowerCase() === "torso");

  return DOLLVUE_PRODUCT_HANDLE_PREFIXES.some(prefix => handle.startsWith(prefix)) &&
    product.extended.stockStatus !== "ready_to_ship" &&
    !excludedLusandyProduct;
}

function isExcludedLusandyHandle(handle: string) {
  return DOLLVUE_EXCLUDED_HANDLES.has(handle) ||
    (handle.startsWith("lusandy-") && handle.includes("torso"));
}

export function dollVueUrl(handle: string) {
  return `/dollvue/${handle}`;
}
