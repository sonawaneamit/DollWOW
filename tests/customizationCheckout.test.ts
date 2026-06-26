import { afterEach, describe, expect, it, vi } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { defaultMultipleOptionId, nextMultipleSelection } from "@/lib/customization/resolve";
import type { CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";

describe("customization checkout support", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("breaks paid customizations into configured Shopify charge lines", async () => {
    vi.stubEnv(
      "SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS",
      JSON.stringify({
        "500": "gid://shopify/ProductVariant/500",
        "100": "gid://shopify/ProductVariant/100",
        "50": "gid://shopify/ProductVariant/50",
        "10": "gid://shopify/ProductVariant/10",
        "5": "gid://shopify/ProductVariant/5",
        "1": "gid://shopify/ProductVariant/1"
      })
    );
    vi.stubEnv("SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY", "USD");

    const { customizationChargeLines } = await import("@/lib/shopify/storefront");
    const lines = customizationChargeLines({
      amount: 665,
      currencyCode: "USD",
      title: "Test build options"
    });

    expect(lines.map((line) => [line.merchandiseId, line.quantity])).toEqual([
      ["gid://shopify/ProductVariant/500", 1],
      ["gid://shopify/ProductVariant/100", 1],
      ["gid://shopify/ProductVariant/50", 1],
      ["gid://shopify/ProductVariant/10", 1],
      ["gid://shopify/ProductVariant/5", 1]
    ]);
  });

  it("treats imported default choices as exclusive in multi-select groups", () => {
    const options: CustomizationOption[] = [
      { id: "factory-default", label: "Factory default" },
      { id: "implanted-human-hair", label: "Implanted human hair", priceDelta: 180 },
      { id: "extra-storage-case", label: "Flight case", priceDelta: 699 }
    ];
    const defaultId = defaultMultipleOptionId(options);

    expect(defaultId).toBe("factory-default");
    expect(nextMultipleSelection(defaultId, ["factory-default"], "implanted-human-hair")).toEqual(["implanted-human-hair"]);
    expect(nextMultipleSelection(defaultId, ["implanted-human-hair"], "factory-default")).toEqual(["factory-default"]);
  });

  it("normalizes duplicate imported option group ids before rendering the builder", () => {
    const product = {
      id: "gid://shopify/Product/1",
      handle: "test-doll",
      title: "Test Doll",
      description: "",
      vendor: "Test Brand",
      productType: "",
      tags: [],
      featuredImage: null,
      images: [],
      variants: [],
      priceRange: {
        minVariantPrice: { amount: "1000.0", currencyCode: "USD" },
        maxVariantPrice: { amount: "1000.0", currencyCode: "USD" }
      },
      extended: {
        customizationGroups: [
          {
            id: "hair-implanted-color",
            label: "Hair implanted color",
            options: [
              { id: "default", label: "Factory default" },
              { id: "black", label: "Black" }
            ]
          },
          {
            id: "hair-implanted-color",
            label: "Hair implanted color",
            options: [
              { id: "default", label: "Factory default" },
              { id: "brown", label: "Brown" }
            ]
          }
        ]
      }
    } satisfies Product;

    expect(getCustomizationConfig(product).groups.map((group) => group.id)).toEqual(["hair-implanted-color", "hair-implanted-color-2"]);
  });
});
