import { describe, expect, it } from "vitest";
import { getCustomizationConfig, getFactoryCustomizationConfig } from "@/lib/customization/configs";
import { resolveCustomization } from "@/lib/customization/resolve";
import type { CustomizationGroup } from "@/types/customization";
import type { Product } from "@/types/product";

function product(brand: string, material: string, groups: CustomizationGroup[]): Product {
  return {
    id: `gid://shopify/Product/${brand}`, handle: `${brand.toLowerCase().replace(/\s+/g, "-")}-test`,
    title: `${brand} Test 165cm`, vendor: brand, productType: "Custom doll", tags: [brand, material],
    description: "", descriptionHtml: "", price: 1800, currencyCode: "USD", availableForSale: true,
    featuredImage: undefined, priceRange: { minVariantPrice: { amount: "1800", currencyCode: "USD" }, maxVariantPrice: { amount: "1800", currencyCode: "USD" } },
    images: [], variants: [], options: [],
    extended: { brand, material, customizationGroups: groups }
  } as unknown as Product;
}

const headLibrary: CustomizationGroup = {
  id: "an-extra-free-head", label: "An Extra Free Head", selectionMode: "single", display: "swatches", options: [
    { id: "none", label: "No add-on" },
    { id: "h1", label: "H1", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/h1.jpg" } },
    { id: "h2", label: "H2", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/h2.jpg" } }
  ]
};

describe("dealer brand head normalization", () => {
  it("separates the included SE head switch from paid $399 TPE extra heads", () => {
    const config = getCustomizationConfig(product("SE Doll", "TPE", [headLibrary]));
    const choose = config.groups.find((group) => group.id === "choose-head");
    const extra = config.groups.find((group) => group.id === "add-extra-head");
    expect(choose?.selectionMode).toBe("single");
    expect(choose?.options.map((option) => option.priceDelta)).toEqual([0, 0, 0]);
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options.slice(1).map((option) => option.priceDelta)).toEqual([399, 399]);
    const resolved = resolveCustomization(config, { "choose-head": "choose-h2", "add-extra-head": ["extra-h1", "extra-h2"] }, 1800);
    expect(resolved.optionPriceDelta).toBe(798);
  });

  it("does not invent a $399 extra-head price for full-silicone SE builds", () => {
    const config = getFactoryCustomizationConfig(product("SE Doll", "Full silicone", [headLibrary]));
    expect(config.groups.some((group) => group.id === "choose-head")).toBe(true);
    expect(config.groups.some((group) => group.id === "add-extra-head")).toBe(false);
  });

  it("uses the documented $299 value for additional 6YE TPE heads", () => {
    const config = getCustomizationConfig(product("6YE Dolls", "TPE", [headLibrary]));
    expect(config.groups.find((group) => group.id === "add-extra-head")?.options[1].priceDelta).toBe(299);
  });

  it("preserves the verified surcharge for a special replacement head", () => {
    const specialLibrary: CustomizationGroup = {
      ...headLibrary,
      options: [
        ...headLibrary.options,
        { id: "premium", label: "Premium ROS head", priceDelta: 180, swatch: { kind: "image", value: "https://example.com/premium.jpg" } }
      ]
    };
    const config = getCustomizationConfig(product("SE Doll", "TPE", [specialLibrary]));
    expect(config.groups.find((group) => group.id === "choose-head")?.options.find((option) => option.id === "choose-premium")?.priceDelta).toBe(180);
  });

  it("keeps Angelkiss extra heads hidden until a compatible price is verified", () => {
    const config = getFactoryCustomizationConfig(product("Angelkiss", "Silicone", [headLibrary]));
    expect(config.groups.some((group) => group.id === "choose-head")).toBe(true);
    expect(config.groups.some((group) => group.id === "add-extra-head")).toBe(false);
  });

  it("marks image-backed appearance choices visualizer-ready while keeping head swaps gated", () => {
    const appearance: CustomizationGroup = {
      id: "eye-color", label: "Eye Color", required: true, display: "swatches", options: [
        { id: "default", label: "Factory default", productionNote: "Default supplier selection." },
        { id: "green", label: "Green", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/green.jpg" } }
      ]
    };
    const config = getFactoryCustomizationConfig(product("6YE Dolls", "TPE", [headLibrary, appearance]));
    expect(config.groups.find((group) => group.id === "eye-color")?.options[1].visualizable).toBe(true);
    expect(config.groups.find((group) => group.id === "choose-head")?.options[1].visualizable).toBe(false);
  });

  it("does not mistake YL's yes/no promotion control for a head catalog", () => {
    const yesNo: CustomizationGroup = {
      id: "an-extra-free-head", label: "An Extra Free Head", display: "swatches", options: [
        { id: "no", label: "No Thanks" },
        { id: "yes", label: "Yes I Need (FREE)", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/yes.jpg" } }
      ]
    };
    const config = getFactoryCustomizationConfig(product("YL Dolls", "TPE", [yesNo]));
    expect(config.groups.some((group) => group.id === "choose-head")).toBe(false);
    expect(config.groups.some((group) => group.id === "add-extra-head")).toBe(false);
  });

  it("preserves Erovenus' exact paid extra-head choices as multi-select", () => {
    const paid: CustomizationGroup = {
      id: "an-extra-head", label: "An Extra Head", display: "swatches", options: [
        { id: "none", label: "No add-on" },
        { id: "charlotte", label: "Charlotte", priceDelta: 275, swatch: { kind: "image", value: "https://example.com/charlotte.jpg" } },
        { id: "hailey", label: "Hailey", priceDelta: 275, swatch: { kind: "image", value: "https://example.com/hailey.jpg" } }
      ]
    };
    const config = getCustomizationConfig(product("Erovenus", "Silicone", [paid]));
    const extra = config.groups.find((group) => group.id === "add-extra-head");
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options.slice(1).map((option) => option.priceDelta)).toEqual([275, 275]);
  });

  it("keeps HR's free promotional head distinct from paid additional heads", () => {
    const paid: CustomizationGroup = {
      id: "an-extra-head", label: "An Extra Head", display: "swatches", options: [
        { id: "none", label: "No add-on" },
        { id: "h1-paid", label: "H1", priceDelta: 299, swatch: { kind: "image", value: "https://example.com/h1.jpg" } }
      ]
    };
    const config = getCustomizationConfig(product("HR Dolls", "TPE", [headLibrary, paid]));
    const included = config.groups.find((group) => group.id === "included-extra-head");
    const extra = config.groups.find((group) => group.id === "add-extra-head");
    expect(config.groups.some((group) => group.id === "choose-head")).toBe(false);
    expect(included?.selectionMode).toBe("single");
    expect(included?.options.slice(1).map((option) => option.priceDelta)).toEqual([0, 0]);
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options[1].priceDelta).toBe(299);
  });

  it("keeps Jarliet's source-listed free extra head as a single optional choice", () => {
    const config = getCustomizationConfig(product("Jarliet Dolls", "Silicone", [headLibrary]));
    const included = config.groups.find((group) => group.id === "included-extra-head");
    expect(included?.selectionMode).toBe("single");
    expect(included?.options[0].label).toBe("No extra head");
    expect(config.groups.some((group) => group.id === "add-extra-head")).toBe(false);
  });

  it.each(["Climax Doll", "Dolls Castle"])("keeps %s's advertised free extra head single-select", (brand) => {
    const config = getCustomizationConfig(product(brand, "Silicone", [headLibrary]));
    expect(config.groups.find((group) => group.id === "included-extra-head")?.selectionMode).toBe("single");
    expect(config.groups.some((group) => group.id === "choose-head")).toBe(false);
  });

  it("preserves IL Doll's exact paid heads as independent multi-select add-ons", () => {
    const paid: CustomizationGroup = {
      id: "an-extra-head", label: "An Extra Head", display: "swatches", options: [
        { id: "none", label: "No add-on" },
        { id: "c13", label: "C13", priceDelta: 449, swatch: { kind: "image", value: "https://example.com/c13.jpg" } }
      ]
    };
    const config = getCustomizationConfig(product("IL Doll", "Silicone", [paid]));
    expect(config.groups.find((group) => group.id === "add-extra-head")?.options[1].priceDelta).toBe(449);
    expect(config.groups.find((group) => group.id === "add-extra-head")?.selectionMode).toBe("multiple");
  });

  it("retains Real Lady's included extra-head promotion without exposing dependent duplicate groups", () => {
    const config = getCustomizationConfig(product("Real Lady", "Silicone", [
      headLibrary,
      { id: "eye-color-for-extra-head", label: "Eye Color For Extra Head", display: "swatches", options: [
        { id: "default", label: "Factory default" }, { id: "blue", label: "Blue", priceDelta: 0 }
      ] }
    ]));
    expect(config.groups.some((group) => group.id === "included-extra-head")).toBe(true);
    expect(config.groups.some((group) => /extra head/i.test(group.label) && group.id !== "included-extra-head")).toBe(false);
  });
});
