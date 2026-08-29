import { productBodyType } from "@/lib/catalog/bodyType";
import type { Product } from "@/types/product";

const NEW_ARRIVALS_EXCLUDED_HANDLES = new Set([
  "lusandy-sex-doll-heads"
]);

export function isHomepageMaleProduct(product: Product) {
  return productBodyType(product) === "male";
}

export function homepageNewArrivals(products: Product[]) {
  return products.filter((product) => !NEW_ARRIVALS_EXCLUDED_HANDLES.has(product.handle));
}
