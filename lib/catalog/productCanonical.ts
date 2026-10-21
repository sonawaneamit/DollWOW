import type { Product } from "@/types/product";

// Individually reviewed exact copies; never infer aliases from a brand prefix,
// matching title or shared body. Warehouse/configuration offers remain separate.
const reviewedAliases: Readonly<Record<string, string>> = {
  "wm-joanna-158cm-m-cup-tpe-companion-doll-honjb": "yl-joanna-158cm-m-cup-tpe-companion-doll-honjb",
  "wm-frantiska-153cm-n-cup-tpe-companion-doll-kq0mz": "yl-frantiska-153cm-n-cup-tpe-companion-doll-kq0mz",
  "wm-alessia-154cm-i-cup-tpe-companion-doll-1ymco": "irontech-alessia-154cm-i-cup-tpe-companion-doll-1ymco"
};

export function productCanonicalHandle(product: Pick<Product, "handle">): string {
  return Object.hasOwn(reviewedAliases, product.handle) ? reviewedAliases[product.handle] : product.handle;
}
