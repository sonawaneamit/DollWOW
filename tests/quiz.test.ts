import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { recommendProducts } from "@/lib/quiz/recommendProducts";
import { quizAnswerSummary } from "@/lib/quiz/answers";

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

  it("does not substitute the wrong material, form, price, or customization path", () => {
    const base = sampleProducts[4];
    const silicone = {
      ...base,
      id: "silicone-match",
      title: "Silicone Match 165cm Doll",
      productType: "Full silicone doll",
      tags: ["silicone", "custom", "female-doll"],
      priceRange: {
        minVariantPrice: { amount: "3000", currencyCode: "USD" },
        maxVariantPrice: { amount: "3000", currencyCode: "USD" }
      },
      extended: { ...base.extended, material: "Silicone", bodyType: "female" as const, customAvailable: true }
    };
    const wrongMaterial = { ...silicone, id: "wrong-material", extended: { ...silicone.extended, material: "TPE" } };
    const wrongForm = { ...silicone, id: "wrong-form", title: "Silicone Torso", productType: "Torso" };
    const fixedStock = { ...silicone, id: "fixed-stock", extended: { ...silicone.extended, customAvailable: false } };
    const results = recommendProducts([silicone, wrongMaterial, wrongForm, fixedStock], {
      companionType: "female",
      productForm: "full",
      budget: "2500-4000",
      delivery: "balanced",
      material: "silicone",
      bodyType: "lighter",
      sizeComfort: "standard",
      storage: "normal",
      customNeeds: "some-options",
      experience: "first-time"
    });

    expect(results.map((result) => result.productId)).toEqual(["silicone-match"]);
  });

  it("shows every answer in the results summary", () => {
    const summary = quizAnswerSummary({
      companionType: "female",
      productForm: "full",
      budget: "2500-4000",
      delivery: "balanced",
      material: "silicone",
      bodyType: "lighter",
      sizeComfort: "standard",
      storage: "normal",
      customNeeds: "some-options",
      experience: "first-time"
    });

    expect(summary.map((item) => item.label)).toEqual(["Dolls", "Form", "Budget", "Timing", "Material", "Build", "Size", "Storage", "Options", "Experience"]);
  });
});
