import type { Product } from "@/types/product";

type RankedProduct = {
  candidate: Product;
  score: number;
  price: number;
};

/**
 * Builds a deliberately varied PDP rail from genuinely compatible products.
 * Product form and body type are eligibility rules; price, construction,
 * proportions, appearance, delivery lane, and brand determine ranking.
 */
export function scoreSimilarProducts(reference: Product, candidates: Product[], limit = 5): Product[] {
  const referencePrice = productPrice(reference);
  const ranked = candidates
    .filter((candidate) => isEligibleAlternative(reference, candidate))
    .map((candidate) => ({ candidate, score: similarityScore(reference, candidate), price: productPrice(candidate) }))
    .filter((entry) => entry.score >= 18)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return [];

  // Keep the rail useful rather than filling every slot with near-identical
  // products: closest choices first, then price/delivery alternatives.
  const selected: RankedProduct[] = [];
  addFirst(selected, ranked);
  addFirst(selected, ranked);
  addFirst(selected, ranked, (entry) => referencePrice > 0 && entry.price > 0 && entry.price < referencePrice * 0.92);
  addFirst(
    selected,
    ranked,
    (entry) => reference.extended.stockStatus !== "ready_to_ship" && entry.candidate.extended.stockStatus === "ready_to_ship"
  );
  addFirst(selected, ranked, (entry) => referencePrice > 0 && entry.price > referencePrice * 1.08);

  for (const entry of ranked) {
    if (selected.length >= limit) break;
    if (!selected.some((item) => item.candidate.id === entry.candidate.id)) selected.push(entry);
  }

  return selected.slice(0, limit).map((entry) => entry.candidate);
}

export function similarityScore(reference: Product, candidate: Product): number {
  let score = 0;
  const refPrice = productPrice(reference);
  const candPrice = productPrice(candidate);
  const refMaterial = normalize(reference.extended.material);
  const candMaterial = normalize(candidate.extended.material);

  // Price is a central comparison-shopping signal, but never makes an
  // incompatible product eligible by itself.
  if (refPrice > 0 && candPrice > 0) {
    const delta = Math.abs(refPrice - candPrice) / refPrice;
    score += Math.max(0, 22 * (1 - Math.min(delta, 0.65) / 0.65));
  }

  if (refMaterial && candMaterial) {
    if (refMaterial === candMaterial) score += 18;
    else if (isRelatedMaterial(refMaterial, candMaterial)) score += 7;
  }

  score += proximityScore(reference.extended.heightCm, candidate.extended.heightCm, 16, 25);
  score += proximityScore(reference.extended.weightLb, candidate.extended.weightLb, 10, 45);

  const sharedLooks = intersectionCount(reference.extended.lookTags, candidate.extended.lookTags);
  score += Math.min(14, sharedLooks * 5);

  if (
    reference.extended.stockStatus &&
    candidate.extended.stockStatus &&
    reference.extended.stockStatus === candidate.extended.stockStatus
  ) {
    score += 10;
  }

  if (sameCupBand(reference.extended.cupSize, candidate.extended.cupSize)) score += 6;

  const refBrand = normalize(reference.extended.brand ?? reference.vendor);
  const candBrand = normalize(candidate.extended.brand ?? candidate.vendor);
  if (refBrand && candBrand && refBrand === candBrand) score += 4;

  return score;
}

function isEligibleAlternative(reference: Product, candidate: Product): boolean {
  if (candidate.id === reference.id || candidate.handle === reference.handle) return false;
  if (!candidate.featuredImage && !candidate.images.length) return false;
  if (!candidate.variants.some((variant) => variant.availableForSale)) return false;

  const refForm = productForm(reference);
  const candForm = productForm(candidate);
  if (refForm !== "unknown" && candForm !== "unknown" && refForm !== candForm) return false;

  const refBodyType = reference.extended.bodyType;
  const candBodyType = candidate.extended.bodyType;
  if (refBodyType && candBodyType && refBodyType !== "unknown" && candBodyType !== "unknown" && refBodyType !== candBodyType) return false;

  const refIdentity = normalize(reference.extended.catalogIdentityKey);
  const candIdentity = normalize(candidate.extended.catalogIdentityKey);
  // The same photography can legitimately represent distinct material or
  // technology configurations. Suppress only the same normalized listing.
  if (
    refIdentity &&
    candIdentity &&
    refIdentity === candIdentity &&
    normalize(reference.extended.material) === normalize(candidate.extended.material)
  ) return false;

  return true;
}

function productForm(product: Product): "full" | "torso" | "hips" | "head" | "unknown" {
  const haystack = normalize([product.productType, product.title, ...product.tags].join(" "));
  if (/\b(hips?|buttocks?)\b/.test(haystack)) return "hips";
  if (/\btorso\b/.test(haystack)) return "torso";
  if (/\bhead\b/.test(haystack) && !/\b(full|doll|companion)\b/.test(normalize(product.productType))) return "head";
  if (/\b(doll|companion|full)\b/.test(haystack)) return "full";
  return "unknown";
}

function proximityScore(a: number | undefined, b: number | undefined, maximum: number, usefulRange: number): number {
  if (!a || !b) return 0;
  return Math.max(0, maximum * (1 - Math.min(Math.abs(a - b), usefulRange) / usefulRange));
}

function sameCupBand(a?: string, b?: string): boolean {
  const cupA = normalize(a).match(/[a-z]+/)?.[0];
  const cupB = normalize(b).match(/[a-z]+/)?.[0];
  return Boolean(cupA && cupB && cupA === cupB);
}

function intersectionCount(a?: string[], b?: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const right = new Set(b.map(normalize).filter(Boolean));
  return new Set(a.map(normalize).filter((value) => value && right.has(value))).size;
}

function isRelatedMaterial(a: string, b: string): boolean {
  return (a.includes("silicone") && b.includes("silicone")) || (a.includes("tpe") && b.includes("tpe"));
}

function productPrice(product: Product): number {
  return Number(product.priceRange.minVariantPrice.amount) || 0;
}

function addFirst(selected: RankedProduct[], ranked: RankedProduct[], predicate: (entry: RankedProduct) => boolean = () => true) {
  const entry = ranked.find((item) => predicate(item) && !selected.some((chosen) => chosen.candidate.id === item.candidate.id));
  if (entry) selected.push(entry);
}

function normalize(value?: string): string {
  return String(value ?? "").trim().toLowerCase();
}
