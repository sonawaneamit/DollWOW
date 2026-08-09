import { describe, expect, it } from "vitest";
import { cartCheckoutRequestSchema } from "@/lib/cart/input";

const VALID_VARIANT = "gid://shopify/ProductVariant/123";

describe("cart checkout input", () => {
  it("parses a multi-line request and normalizes attributes and discounts", () => {
    const parsed = cartCheckoutRequestSchema.parse({
      lines: [
        {
          merchandiseId: VALID_VARIANT,
          quantity: 2,
          attributes: [
            { key: " DollWow Build ", value: "  Buy as  shown " },
            { key: "DollWow Build", value: "Duplicate is ignored" },
            { key: "Empty", value: "   " }
          ]
        },
        { merchandiseId: "gid://shopify/ProductVariant/456", quantity: 1 }
      ],
      discountCodes: [" save-10 ", "SAVE-10", "bad code!!!"]
    });

    expect(parsed.lines).toHaveLength(2);
    expect(parsed.lines[0].attributes).toEqual([{ key: "DollWow Build", value: "Buy as shown" }]);
    expect(parsed.lines[1].quantity).toBe(1);
    expect(parsed.discountCodes).toEqual(["SAVE-10", "BADCODE"]);
  });

  it("requires at least one line", () => {
    expect(() => cartCheckoutRequestSchema.parse({ lines: [] })).toThrow();
  });

  it("rejects more than 20 lines", () => {
    const lines = Array.from({ length: 21 }, (_, index) => ({
      merchandiseId: `gid://shopify/ProductVariant/${index}`,
      quantity: 1
    }));
    expect(() => cartCheckoutRequestSchema.parse({ lines })).toThrow();
  });

  it("requires Shopify product variant IDs and caps quantity at 10", () => {
    expect(() =>
      cartCheckoutRequestSchema.parse({ lines: [{ merchandiseId: "gid://shopify/Product/123", quantity: 1 }] })
    ).toThrow("A Shopify product variant ID is required.");

    expect(() =>
      cartCheckoutRequestSchema.parse({ lines: [{ merchandiseId: VALID_VARIANT, quantity: 11 }] })
    ).toThrow();
  });
});
