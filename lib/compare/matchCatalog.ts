import { buildProductIdentity, slugify } from "@/lib/catalog/identity";
import type { ParsedListing } from "@/types/comparison";
import type { Product } from "@/types/product";

export function matchCatalog(parsed: ParsedListing | null, products: Product[]) {
  if (!parsed?.title) return { product: null, confidence: "low" as const };
  const parsedIdentity = buildProductIdentity({
    title: parsed.title,
    sourceTitle: parsed.title,
    vendor: parsed.vendor,
    productType: parsed.description,
    extended: {
      material: parsed.description,
      headModel: parsed.description
    }
  });
  const terms = `${parsed.title} ${parsed.description || ""}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const scored = products.map((product) => {
    const identity = buildProductIdentity(product);
    const haystack = [
      product.title,
      product.vendor,
      product.extended.brand,
      product.extended.material,
      product.extended.heightCm,
      product.extended.sourceTitle,
      product.extended.displayName,
      product.extended.headModel,
      product.extended.catalogIdentityKey,
      product.extended.catalogBodyIdentityKey
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    let score = terms.filter((term) => haystack.includes(term)).length;

    if (parsedIdentity.brandValue && identity.brandValue === parsedIdentity.brandValue) score += 8;
    if (parsedIdentity.heightCm && identity.heightCm === parsedIdentity.heightCm) score += 8;
    if (parsedIdentity.cupSize && identity.cupSize === parsedIdentity.cupSize) score += 6;
    if (parsedIdentity.material && identity.material === parsedIdentity.material) score += 6;
    if (parsedIdentity.headModel && identity.headModel === parsedIdentity.headModel) score += 10;
    if (parsedIdentity.modelSlug && identity.modelSlug === parsedIdentity.modelSlug) score += 14;
    if (parsedIdentity.bodyKey && identity.bodyKey === parsedIdentity.bodyKey) score += 20;
    if (parsedIdentity.key && identity.key === parsedIdentity.key) score += 28;

    const sourceSlug = slugify(product.extended.sourceTitle || "");
    if (sourceSlug && parsedIdentity.modelSlug && sourceSlug.includes(parsedIdentity.modelSlug)) score += 10;

    return { product, score, identity };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 12) return { product: null, confidence: "low" as const };
  return { product: best.product, confidence: best.score >= 38 ? ("high" as const) : ("medium" as const) };
}
