import { productBodyType } from "@/lib/catalog/bodyType";
import { storefrontFeatureProducts } from "@/lib/catalog/featured";
import type { Product } from "@/types/product";

export function isHomepageMaleProduct(product: Product) {
  return productBodyType(product) === "male";
}

export function homepageNewArrivals(products: Product[]) {
  return storefrontFeatureProducts(products);
}
