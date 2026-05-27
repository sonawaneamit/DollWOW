import type { ParsedListing } from "@/types/comparison";
import type { Product } from "@/types/product";

export function matchCatalog(parsed: ParsedListing | null, products: Product[]) {
  if (!parsed?.title) return { product: null, confidence: "low" as const };
  const terms = parsed.title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const scored = products.map((product) => {
    const haystack = [product.title, product.vendor, product.extended.brand, product.extended.material, product.extended.heightCm]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const score = terms.filter((term) => haystack.includes(term)).length;
    return { product, score };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 2) return { product: null, confidence: "low" as const };
  return { product: best.product, confidence: best.score >= 4 ? ("high" as const) : ("medium" as const) };
}
