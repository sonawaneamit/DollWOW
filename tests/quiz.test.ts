import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { recommendProducts } from "@/lib/quiz/recommendProducts";

describe("recommendProducts", () => {
  it("returns up to five practical recommendations", () => {
    const results = recommendProducts(sampleProducts, {
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
  });
});
