import type { Product } from "@/types/product";

/**
 * Scores catalog products as "similar dolls" for the PDP rail. Factual
 * signals only: brand, material, body type, size, cup profile, price band,
 * and availability. Replaces the previous "first few catalog products"
 * selection, which often showed unrelated dolls.
 */
export function scoreSimilarProducts(reference: Product, candidates: Product[], limit = 4): Product[] {
  return candidates
    .filter((candidate) => candidate.id !== reference.id)
    .map((candidate) => ({ candidate, score: similarityScore(reference, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function similarityScore(reference: Product, candidate: Product): number {
  let score = 0;
  const refBrand = normalize(reference.extended.brand ?? reference.vendor);
  const candBrand = normalize(candidate.extended.brand ?? candidate.vendor);
  const refMaterial = normalize(reference.extended.material);
  const candMaterial = normalize(candidate.extended.material);

  if (refBrand && candBrand && refBrand === candBrand) score += 3;
  if (refMaterial && candMaterial && refMaterial === candMaterial) score += 2;
  if (reference.extended.bodyType && candidate.extended.bodyType && reference.extended.bodyType === candidate.extended.bodyType) score += 2;

  if (reference.extended.heightCm && candidate.extended.heightCm) {
    const delta = Math.abs(reference.extended.heightCm - candidate.extended.heightCm);
    if (delta <= 3) score += 3;
    else if (delta <= 8) score += 2;
    else if (delta <= 15) score += 1;
  }

  if (reference.extended.cupSize && candidate.extended.cupSize && normalize(reference.extended.cupSize) === normalize(candidate.extended.cupSize)) {
    score += 1;
  }

  const refPrice = Number(reference.priceRange.minVariantPrice.amount);
  const candPrice = Number(candidate.priceRange.minVariantPrice.amount);
  if (refPrice > 0 && candPrice > 0 && Math.abs(refPrice - candPrice) / refPrice <= 0.25) score += 1;

  if (candidate.extended.stockStatus === "ready_to_ship") score += 1;

  return score;
}

function normalize(value?: string): string {
  return String(value ?? "").trim().toLowerCase();
}
