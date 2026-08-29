import { describe, expect, it } from "vitest";
import { productBodyType } from "@/lib/catalog/bodyType";
import { homepageNewArrivals, isHomepageMaleProduct } from "@/lib/catalog/homepage";
import type { Product } from "@/types/product";

function makeProduct(overrides: Partial<Product> & { extended?: Product["extended"] } = {}): Product {
  return {
    id: "gid://shopify/Product/1",
    handle: "test-doll",
    title: "Test doll",
    description: "",
    vendor: "Lusandy",
    productType: "Sex Dolls",
    tags: [],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "599", currencyCode: "USD" },
      maxVariantPrice: { amount: "599", currencyCode: "USD" }
    },
    extended: {},
    ...overrides
  };
}

describe("homepage catalog classification", () => {
  it.each([
    "lusandy-lsd-t01-pleasure-hip-silicone-torso-us-rts",
    "lusandy-lsd-t01-pleasure-hip-silicone-torso-eu-rts-599",
    "lusandy-lsd-t01-pleasure-hip-silicone-torso-eu-rts"
  ])("does not classify the T01 torso as male: %s", (handle) => {
    const product = makeProduct({ handle, title: "Lusandy LSD-T01 Pleasure Hip Silicone Torso" });

    expect(productBodyType(product)).toBe("unknown");
    expect(isHomepageMaleProduct(product)).toBe(false);
  });

  it("keeps explicit and inferred male dolls in the male rail", () => {
    expect(isHomepageMaleProduct(makeProduct({ extended: { bodyType: "male" } }))).toBe(true);
    expect(isHomepageMaleProduct(makeProduct({ tags: ["male-doll"] }))).toBe(true);
    expect(isHomepageMaleProduct(makeProduct({ title: "Masculine companion" }))).toBe(true);
  });

  it("keeps the heads options-sheet SKU out of New Arrivals only", () => {
    const heads = makeProduct({ id: "heads", handle: "lusandy-sex-doll-heads" });
    const doll = makeProduct({ id: "doll", handle: "published-doll" });

    expect(homepageNewArrivals([heads, doll])).toEqual([doll]);
  });
});
