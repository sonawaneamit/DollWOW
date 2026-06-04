import { describe, expect, it } from "vitest";
import { cartCreateRequestSchema, normalizeDiscountCodes, normalizeLineAttributes } from "@/lib/cart/input";

describe("cart create input", () => {
  it("normalizes line-item attributes and discount codes before checkout", () => {
    const parsed = cartCreateRequestSchema.parse({
      merchandiseId: "gid://shopify/ProductVariant/123",
      quantity: 1,
      attributes: [
        { key: " DollWow Skin tone ", value: "  Tan   skin  " },
        { key: "DollWow Skin tone", value: "Duplicate is ignored" },
        { key: "Empty", value: "   " }
      ],
      discountCodes: [" save-10 ", "SAVE-10", "bad code!!!"]
    });

    expect(parsed.attributes).toEqual([{ key: "DollWow Skin tone", value: "Tan skin" }]);
    expect(parsed.discountCodes).toEqual(["SAVE-10", "BADCODE"]);
  });

  it("requires a Shopify product variant ID", () => {
    expect(() =>
      cartCreateRequestSchema.parse({
        merchandiseId: "gid://shopify/Product/123",
        quantity: 1
      })
    ).toThrow("A Shopify product variant ID is required.");
  });

  it("caps normalized arrays to Shopify-safe limits", () => {
    const attributes = Array.from({ length: 30 }, (_, index) => ({ key: `Option ${index}`, value: "Selected" }));
    const discountCodes = Array.from({ length: 8 }, (_, index) => `CODE${index}`);

    expect(normalizeLineAttributes(attributes)).toHaveLength(20);
    expect(normalizeDiscountCodes(discountCodes)).toHaveLength(5);
  });
});
