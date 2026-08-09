import type { Product } from "@/types/product";
import type { QuizAnswers, QuizRecommendation } from "@/types/quiz";

function budgetMax(budget: QuizAnswers["budget"]) {
  if (budget === "under-1500") return 1500;
  if (budget === "1500-2500") return 2500;
  if (budget === "2500-4000") return 4000;
  return Number.POSITIVE_INFINITY;
}

function budgetMin(budget: QuizAnswers["budget"]) {
  if (budget === "under-1500") return 0;
  if (budget === "1500-2500") return 1500;
  if (budget === "2500-4000") return 2500;
  return 4000;
}

function productForm(product: Product): QuizAnswers["productForm"] {
  const haystack = `${product.productType} ${product.tags.join(" ")} ${product.title}`.toLowerCase();
  if (/\bhips?\b|buttock/.test(haystack)) return "hips";
  if (/\btorsos?\b|torsr/.test(haystack)) return "torso";
  return "full";
}

function recommendationIdentity(product: Product) {
  const price = Number(product.priceRange.minVariantPrice.amount).toFixed(2);
  return `${product.title.trim().toLowerCase()}|${product.extended.material?.toLowerCase() ?? ""}|${product.extended.heightCm ?? ""}|${price}`;
}

export function recommendProducts(products: Product[], answers: QuizAnswers): QuizRecommendation[] {
  const min = budgetMin(answers.budget);
  const max = budgetMax(answers.budget);

  const eligible = products.filter((product) => {
    const price = Number(product.priceRange.minVariantPrice.amount);
    if (!Number.isFinite(price) || price < min || price > max) return false;
    if (answers.companionType === "male" && product.extended.bodyType !== "male") return false;
    if (answers.companionType === "female" && product.extended.bodyType === "male") return false;
    if (answers.productForm !== "any" && productForm(product) !== answers.productForm) return false;
    if (answers.material !== "either" && !product.extended.material?.toLowerCase().includes(answers.material)) return false;
    if (answers.delivery === "fast" && product.extended.stockStatus !== "ready_to_ship") return false;
    if (answers.customNeeds === "ready" && product.extended.stockStatus !== "ready_to_ship") return false;
    return true;
  });

  const seen = new Set<string>();
  const uniqueEligible = eligible.filter((product) => {
    const identity = recommendationIdentity(product);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });

  const scored = uniqueEligible.map((product) => {
    let score = 0;
    const reasons: string[] = [];
    const price = Number(product.priceRange.minVariantPrice.amount);
    const tags = product.tags.map((tag) => tag.toLowerCase());

    if (answers.companionType !== "any") {
      score += 5;
      reasons.push(answers.companionType === "male" ? "male doll preference" : "female doll preference");
    } else if (answers.companionType === "any") {
      score += 1;
    }

    if (price >= min && price <= max) {
      score += 3;
      reasons.push("fits your budget range");
    }

    if (answers.delivery === "fast" && product.extended.stockStatus === "ready_to_ship") {
      score += 5;
      reasons.push("ready-to-ship option");
    }
    if (answers.delivery === "custom" && product.extended.customAvailable) {
      score += 3;
      reasons.push("good for custom ordering");
    }
    if (answers.delivery === "balanced" && product.extended.stockStatus !== "check_stock") {
      score += 1;
    }
    if (answers.material !== "either" && product.extended.material?.toLowerCase().includes(answers.material)) {
      score += 4;
      reasons.push(`${answers.material.toUpperCase()} material match`);
    }
    if (answers.sizeComfort === "easy" && (product.extended.weightLb ?? 999) <= 68) {
      score += 3;
      reasons.push("easier weight to move and store");
    }
    if (answers.sizeComfort === "large" && (product.extended.heightCm ?? 0) >= 165) {
      score += 2;
      reasons.push("larger size profile");
    }
    if (answers.storage === "limited" && (product.extended.heightCm ?? 999) <= 158) {
      score += 2;
      reasons.push("better fit for limited storage");
    }
    if (answers.storage === "dedicated" && (product.extended.heightCm ?? 0) >= 160) {
      score += 1;
    }
    if (answers.bodyType !== "unsure" && tags.includes(answers.bodyType)) {
      score += 2;
      reasons.push("matches your build preference");
    }
    if (answers.customNeeds === "ready" && product.extended.stockStatus === "ready_to_ship") {
      score += 2;
    }
    if (answers.customNeeds !== "ready" && product.extended.customAvailable) {
      score += 2;
      reasons.push("custom choices available");
    }
    if (answers.experience === "first-time" && (product.extended.weightLb ?? 999) <= 85) {
      score += 1;
    }

    return { product, score, reasons };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ product, reasons }, index) => ({
      productId: product.id,
      badge: index === 0 ? "Best fit" : product.extended.stockStatus === "ready_to_ship" ? "Fast option" : "Good match",
      reason: reasons.slice(0, 3).join(", ") || "A practical match for your budget, handling, and ordering preferences."
    }));
}
