import { describe, expect, it } from "vitest";
import { scoreSimilarProducts, similarityScore } from "@/lib/catalog/similar";
import type { Product } from "@/types/product";

function makeProduct(overrides: {
  id?: string;
  handle?: string;
  vendor?: string;
  price?: string;
  extended?: Product["extended"];
}): Product {
  return {
    id: overrides.id ?? "gid://shopify/Product/1",
    handle: overrides.handle ?? "doll",
    title: "Test doll",
    description: "",
    vendor: overrides.vendor ?? "Vendor",
    productType: "Sex Dolls",
    tags: [],
    featuredImage: { url: "https://cdn.example.com/doll.jpg", altText: "Test doll" },
    images: [],
    variants: [{ id: `${overrides.id ?? "1"}-variant`, title: "Default", availableForSale: true, price: { amount: overrides.price ?? "2000", currencyCode: "USD" }, selectedOptions: [] }],
    priceRange: {
      minVariantPrice: { amount: overrides.price ?? "2000", currencyCode: "USD" },
      maxVariantPrice: { amount: overrides.price ?? "2000", currencyCode: "USD" }
    },
    extended: overrides.extended ?? {}
  };
}

const reference = makeProduct({
  id: "ref",
  handle: "reference-doll",
  vendor: "WM Dolls",
  price: "2000",
  extended: { brand: "WM Doll", material: "TPE", bodyType: "female", heightCm: 165, cupSize: "D", stockStatus: "custom" }
});

describe("similar products", () => {
  it("excludes the reference product itself", () => {
    const results = scoreSimilarProducts(reference, [reference], 4);
    expect(results).toHaveLength(0);
  });

  it("ranks same-brand, same-material, close-height dolls first", () => {
    const closeMatch = makeProduct({
      id: "close",
      handle: "close-match",
      vendor: "WM Dolls",
      price: "1900",
      extended: { brand: "WM Doll", material: "TPE", bodyType: "female", heightCm: 163, cupSize: "D", stockStatus: "ready_to_ship" }
    });
    const unrelated = makeProduct({
      id: "far",
      handle: "unrelated",
      vendor: "Other Brand",
      price: "3900",
      extended: { brand: "Other", material: "Silicone", bodyType: "male", heightCm: 100, cupSize: "A", stockStatus: "custom" }
    });

    const results = scoreSimilarProducts(reference, [unrelated, closeMatch], 4);
    expect(results[0]?.handle).toBe("close-match");
    expect(similarityScore(reference, closeMatch)).toBeGreaterThan(similarityScore(reference, unrelated));
  });

  it("drops candidates with an incompatible body type", () => {
    const unrelated = makeProduct({
      id: "far",
      handle: "unrelated",
      vendor: "Other Brand",
      price: "9000",
      extended: { brand: "Other", material: "Silicone", bodyType: "male", heightCm: 100, stockStatus: "custom" }
    });
    expect(scoreSimilarProducts(reference, [unrelated], 4)).toHaveLength(0);
  });

  it("respects the limit", () => {
    const candidates = Array.from({ length: 10 }, (_, index) =>
      makeProduct({
        id: `cand-${index}`,
        handle: `cand-${index}`,
        vendor: "WM Dolls",
        price: "2000",
        extended: { brand: "WM Doll", material: "TPE", bodyType: "female", heightCm: 165, stockStatus: "ready_to_ship" }
      })
    );
    expect(scoreSimilarProducts(reference, candidates, 4)).toHaveLength(4);
  });

  it("prefers products in the same delivery lane", () => {
    const base = { brand: "WM Doll", material: "TPE", bodyType: "female" as const };
    const ready = makeProduct({ id: "r", handle: "r", vendor: "WM Dolls", extended: { ...base, stockStatus: "ready_to_ship" } });
    const madeToOrder = makeProduct({ id: "m", handle: "m", vendor: "WM Dolls", extended: { ...base, stockStatus: "custom" } });
    expect(similarityScore(reference, madeToOrder)).toBeGreaterThan(similarityScore(reference, ready));
  });

  it("does not mix full dolls with torsos", () => {
    const torso = { ...makeProduct({ id: "torso", handle: "torso" }), productType: "Torso" };
    expect(scoreSimilarProducts(reference, [torso], 4)).toHaveLength(0);
  });
});
