import { productBodyType } from "@/lib/catalog/bodyType";
import { storefrontFeatureProducts } from "@/lib/catalog/featured";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { Product } from "@/types/product";

export function isHomepageMaleProduct(product: Product) {
  return productBodyType(product) === "male";
}

export function homepageNewArrivals(products: Product[]) {
  return storefrontFeatureProducts(products);
}

export function uniqueHomepageModels(products: Product[]) {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = productPublicTitle(product).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
