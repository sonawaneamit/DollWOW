import { afterEach, describe, expect, it, vi } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { defaultMultipleOptionId, getDefaultSelections, nextMultipleSelection } from "@/lib/customization/resolve";
import type { BrandCustomizationConfig, CustomizationOption } from "@/types/customization";
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
      title: "Test doll",
      items: [
        { group: "Body", label: "Premium finish", amount: 600 },
        { group: "Accessories", label: "Care kit", amount: 65 }
      ]
    });

    expect(lines.map((line) => [line.merchandiseId, line.quantity])).toEqual([
      ["gid://shopify/ProductVariant/500", 1],
      ["gid://shopify/ProductVariant/100", 1],
      ["gid://shopify/ProductVariant/50", 1],
      ["gid://shopify/ProductVariant/10", 1],
      ["gid://shopify/ProductVariant/5", 1]
    ]);
    expect(lines[0]?.attributes).toEqual([
      { key: "Applies to", value: "Test doll" },
      { key: "Customization", value: "Body — Premium finish" }
    ]);
    expect(lines[2]?.attributes?.find((attribute) => attribute.key === "Customization")?.value).toBe("Accessories — Care kit");
  });

  it("uses one readable checkout line when an exact option-price variant exists", async () => {
    vi.stubEnv(
      "SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS",
      JSON.stringify({
        "180": "gid://shopify/ProductVariant/180",
        "50": "gid://shopify/ProductVariant/50",
        "10": "gid://shopify/ProductVariant/10",
        "5": "gid://shopify/ProductVariant/5",
        "1": "gid://shopify/ProductVariant/1"
      })
    );
    vi.stubEnv("SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY", "USD");

    const { customizationChargeLines } = await import("@/lib/shopify/storefront");
    expect(customizationChargeLines({
      amount: 180,
      currencyCode: "USD",
      title: "Xue",
      items: [{ group: "Hair finish", label: "Implanted hair", amount: 180 }]
    })).toEqual([{
      merchandiseId: "gid://shopify/ProductVariant/180",
      quantity: 1,
      attributes: [
        { key: "Applies to", value: "Xue" },
        { key: "Customization", value: "Hair finish — Implanted hair" }
      ]
    }]);
  });

  it("treats imported default choices as exclusive in multi-select groups", () => {
    const options: CustomizationOption[] = [
      { id: "supplier-choice", label: "Standard accessory package", productionNote: "Default supplier selection" },
      { id: "implanted-human-hair", label: "Implanted human hair", priceDelta: 180 },
      { id: "extra-storage-case", label: "Flight case", priceDelta: 699 }
    ];
    const defaultId = defaultMultipleOptionId(options);

    expect(defaultId).toBe("supplier-choice");
    expect(nextMultipleSelection(options, ["supplier-choice"], "implanted-human-hair")).toEqual(["implanted-human-hair"]);
    expect(nextMultipleSelection(options, ["implanted-human-hair"], "supplier-choice")).toEqual(["supplier-choice"]);
  });

  it("initializes one deterministic neutral and removes every neutral when a paid option is selected", () => {
    const options: CustomizationOption[] = [
      { id: "none", label: "No add-on", priceDelta: 0 },
      { id: "supplier-choice", label: "Standard accessory package", productionNote: "Default supplier selection", priceDelta: 0 },
      { id: "factory-selection", label: "Factory default", priceDelta: 0 },
      { id: "implanted-human-hair", label: "Implanted human hair", priceDelta: 180 }
    ];
    const config: BrandCustomizationConfig = {
      id: "multiple-neutral-defaults",
      brandLabel: "Test",
      leadTimeNote: "",
      rules: [],
      groups: [{
        id: "accessories",
        label: "Accessories",
        display: "cards",
        selectionMode: "multiple",
        options
      }]
    };

    expect(getDefaultSelections(config).accessories).toEqual(["none"]);
    expect(nextMultipleSelection(
      options,
      ["none", "supplier-choice", "factory-selection"],
      "implanted-human-hair"
    )).toEqual(["implanted-human-hair"]);
    expect(nextMultipleSelection(
      [...options, { id: "flight-case", label: "Flight case", priceDelta: 699 }],
      ["none", "implanted-human-hair", "flight-case"],
      "flight-case"
    )).toEqual(["implanted-human-hair"]);
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
            display: "cards",
            options: [
              { id: "default", label: "Factory default", priceDelta: 0 },
              { id: "black", label: "Black", priceDelta: 0 }
            ]
          },
          {
            id: "hair-implanted-color",
            label: "Hair implanted color",
            display: "cards",
            options: [
              { id: "default", label: "Factory default", priceDelta: 0 },
              { id: "brown", label: "Brown", priceDelta: 0 }
            ]
          }
        ]
      }
    } satisfies Product;

    expect(getCustomizationConfig(product).groups.map((group) => group.id)).toEqual(["hair-implanted-color", "hair-implanted-color-2"]);
  });
});
