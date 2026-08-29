import type { Product } from "@/types/product";

const STOREFRONT_FEATURE_EXCLUDED_HANDLES = new Set([
  "lusandy-sex-doll-heads"
]);

export function isStorefrontFeatureEligible(product: Product) {
  return !STOREFRONT_FEATURE_EXCLUDED_HANDLES.has(product.handle);
}

export function storefrontFeatureProducts(products: Product[]) {
  return products.filter(isStorefrontFeatureEligible);
}
