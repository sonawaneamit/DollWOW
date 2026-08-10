import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import type { Product } from "@/types/product";

function starpery(material = "Full silicone", title = "Xue 171cm D-Cup Full Silicone Xue-4 Head Customizable Doll"): Product {
  return {
    id: "gid://shopify/Product/starpery-test",
    handle: "starpery-xue-171cm-xue-4-full-silicone-doll",
    title,
    description: "",
    vendor: "Starpery Dolls",
    productType: "Custom doll",
    tags: ["starpery", "custom"],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "2295", currencyCode: "USD" },
      maxVariantPrice: { amount: "2295", currencyCode: "USD" }
    },
    extended: { brand: "Starpery Dolls", material, heightCm: 171, cupSize: "D" }
  };
}

describe("Starpery factory customization", () => {
  it("keeps every eye color included", () => {
    const eyes = getCustomizationConfig(starpery()).groups.find((group) => group.id === "eye-color");
    expect(eyes?.options.map((option) => [option.label, option.priceDelta])).toEqual([
      ["Brown", 0],
      ["Blue", 0],
      ["Green", 0]
    ]);
  });

  it("offers head switching and a priced second head", () => {
    const groups = getCustomizationConfig(starpery()).groups;
    const head = groups.find((group) => group.id === "head-model");
    const extra = groups.find((group) => group.id === "additional-head");
    expect(head?.options.some((option) => option.label === "Xue-5" && option.priceDelta === 0)).toBe(true);
    expect(extra?.options.some((option) => option.label === "Xue-5" && option.priceDelta === 500)).toBe(true);
  });

  it("does not expose silicone-only construction choices on TPE products", () => {
    const body = getCustomizationConfig(starpery("TPE", "Starpery test TPE doll")).groups.find((group) => group.id === "body-construction");
    expect(body?.options.some((option) => option.id === "gel-butt")).toBe(false);
    expect(body?.options.some((option) => option.id === "hard-feet")).toBe(false);
  });
});
