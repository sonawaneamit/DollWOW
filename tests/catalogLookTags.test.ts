import { describe, expect, it } from "vitest";
import { filterProducts } from "@/lib/catalog/filters";
import { productLookTags, productMatchesLook } from "@/lib/catalog/lookTags";
import type { Product } from "@/types/product";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "gid://shopify/Product/test",
    handle: "test-doll",
    title: "Neutral product",
    description: "",
    vendor: "WM Dolls",
    productType: "Custom doll",
    tags: [],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "1999", currencyCode: "USD" },
      maxVariantPrice: { amount: "1999", currencyCode: "USD" }
    },
    extended: {},
    ...overrides
  };
}

describe("catalog look tags", () => {
  it("uses Shopify look-tag metafields before weak text matching", () => {
    const item = product({
      title: "Custom companion doll",
      extended: { lookTags: ["hair-blonde", "skin-tan"] }
    });

    expect(productLookTags(item)).toEqual(["hair-blonde", "skin-tan"]);
    expect(productMatchesLook(item, "blonde-dolls")).toBe(true);
    expect(productMatchesLook(item, "skin-tan")).toBe(true);
  });

  it("filters products by look tags", () => {
    const blonde = product({
      id: "1",
      handle: "blonde",
      extended: { lookTags: ["hair-blonde"] }
    });
    const brunette = product({
      id: "2",
      handle: "brunette",
      extended: { lookTags: ["hair-brunette"] }
    });

    expect(filterProducts([blonde, brunette], { look: "hair-blonde" }).map((item) => item.handle)).toEqual(["blonde"]);
  });
});
