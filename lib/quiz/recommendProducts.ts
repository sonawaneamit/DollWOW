import type { Product } from "@/types/product";
import type { QuizAnswers, QuizRecommendation } from "@/types/quiz";

function budgetMax(budget: QuizAnswers["budget"]) {
  if (budget === "under-1500") return 1500;
  if (budget === "1500-2500") return 2500;
  if (budget === "2500-4000") return 4000;
  return Number.POSITIVE_INFINITY;
}

export function recommendProducts(products: Product[], answers: QuizAnswers): QuizRecommendation[] {
  const max = budgetMax(answers.budget);

  const scored = products.map((product) => {
    let score = 0;
    const price = Number(product.priceRange.minVariantPrice.amount);
    const tags = product.tags.map((tag) => tag.toLowerCase());

    if (price <= max) score += 3;
    if (answers.delivery === "fast" && product.extended.stockStatus === "ready_to_ship") score += 4;
    if (answers.delivery === "custom" && product.extended.customAvailable) score += 3;
    if (answers.material !== "either" && product.extended.material?.toLowerCase().includes(answers.material)) score += 3;
    if (answers.sizeComfort === "easy" && (product.extended.weightLb ?? 999) <= 68) score += 3;
    if (answers.sizeComfort === "large" && (product.extended.heightCm ?? 0) >= 165) score += 2;
    if (answers.bodyType !== "unsure" && tags.includes(answers.bodyType)) score += 2;
    if (answers.customNeeds === "ready" && product.extended.stockStatus === "ready_to_ship") score += 2;
    if (answers.customNeeds !== "ready" && product.extended.customAvailable) score += 2;

    return { product, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ product }, index) => ({
      productId: product.id,
      badge: index === 0 ? "Best fit" : product.extended.stockStatus === "ready_to_ship" ? "Fast option" : "Good match",
      reason:
        product.extended.stockStatus === "ready_to_ship"
          ? "Ready-to-ship with clear delivery timing."
          : product.extended.customAvailable
            ? "Custom options are available without a confusing form."
            : "A practical match for your budget and handling needs."
    }));
}
