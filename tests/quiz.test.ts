import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { recommendProducts } from "@/lib/quiz/recommendProducts";

describe("recommendProducts", () => {
  it("returns up to five practical recommendations", () => {
    const results = recommendProducts(sampleProducts, {
      companionType: "any",
      productForm: "full",
      budget: "1500-2500",
      delivery: "fast",
      material: "either",
      bodyType: "lighter",
      sizeComfort: "easy",
      storage: "limited",
      customNeeds: "ready",
      experience: "first-time"
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results.every((result) => !sampleProducts.find((product) => product.id === result.productId)?.title.toLowerCase().includes("torso"))).toBe(true);
  });

  it("treats budget and product form as strict constraints", () => {
    const results = recommendProducts(sampleProducts, {
      companionType: "female",
      productForm: "full",
      budget: "1500-2500",
      delivery: "balanced",
      material: "either",
      bodyType: "unsure",
      sizeComfort: "standard",
      storage: "normal",
      customNeeds: "some-options",
      experience: "first-time"
    });

    const selected = results.map((result) => sampleProducts.find((product) => product.id === result.productId)).filter(Boolean);
    expect(selected.length).toBeGreaterThan(0);
    expect(selected.every((product) => Number(product?.priceRange.minVariantPrice.amount) >= 1500 && Number(product?.priceRange.minVariantPrice.amount) <= 2500)).toBe(true);
    expect(selected.every((product) => !/\btorso(?:s)?\b|\bhips?\b/i.test(`${product?.productType} ${product?.title}`))).toBe(true);
  });
});
