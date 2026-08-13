import { describe, expect, it } from "vitest";
import { getCustomizationConfig, getFactoryCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import type { CustomizationGroup } from "@/types/customization";
import type { Product } from "@/types/product";

function wm(groups: CustomizationGroup[], overrides: Partial<Product["extended"]> = {}): Product {
  return {
    id: "gid://shopify/Product/wm-test", handle: "wm-anae-156cm-tpe-test", title: "WM Anae 156cm TPE Doll",
    description: "", vendor: "DollWow", productType: "Custom TPE doll", tags: ["wm", "female-doll", "tpe", "full-doll"],
    featuredImage: null, images: [], variants: [],
    priceRange: { minVariantPrice: { amount: "1600", currencyCode: "USD" }, maxVariantPrice: { amount: "1600", currencyCode: "USD" } },
    extended: { brand: "WM Dolls", material: "TPE", bodyType: "female", customizationGroups: groups, ...overrides }
  };
}

const groups: CustomizationGroup[] = [
  { id: "skin", label: "Skin Tone", required: true, display: "swatches", options: [
    { id: "default", label: "Factory default", swatch: { kind: "image", value: "https://example.com/default.jpg" } },
    { id: "tan", label: "Tan", swatch: { kind: "image", value: "https://example.com/tan.jpg" } }
  ] },
  { id: "eye", label: "Eye Color", required: true, display: "swatches", options: [
    { id: "brown", label: "Brown", swatch: { kind: "image", value: "https://example.com/brown.jpg" } },
    { id: "blue", label: "Blue", swatch: { kind: "image", value: "https://example.com/blue.jpg" } }
  ] },
  { id: "extra", label: "An Extra Free Head", display: "swatches", options: [
    { id: "none", label: "No thanks" }, { id: "159", label: "159", swatch: { kind: "image", value: "https://example.com/159.jpg" } }
  ] },
  { id: "functions", label: "Premium Functions (Multiple)", selectionMode: "multiple", display: "cards", options: [
    { id: "none", label: "No add-on" }, { id: "heating", label: "Body heating" }
  ] }
];

describe("WM source-guided customization", () => {
  it("uses one free standard TPE head switch and separately paid multi-select extra heads", () => {
    const config = getCustomizationConfig(wm(groups));
    const choose = config.groups.find((group) => group.id === "choose-head");
    const extra = config.groups.find((group) => group.id === "add-extra-head");
    expect(choose?.selectionMode).toBe("single");
    expect(choose?.options).toHaveLength(23);
    expect(choose?.options.find((option) => option.id === "head-418")?.priceDelta).toBe(0);
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options).toHaveLength(23);
    expect(extra?.options.find((option) => option.id === "extra-head-418")?.priceDelta).toBe(299);
    expect(config.groups.some((group) => /extra free head/i.test(group.label))).toBe(false);
  });

  it("charges every selected extra head", () => {
    const config = getCustomizationConfig(wm(groups));
    const selections = getDefaultSelections(config);
    selections["add-extra-head"] = ["extra-head-159", "extra-head-418"];
    expect(resolveCustomization(config, selections, 1600).optionPriceDelta).toBe(598);
  });

  it("keeps unknown paid functions out of checkout while retaining them in the factory record", () => {
    const product = wm(groups);
    const factory = getFactoryCustomizationConfig(product);
    const checkout = getCustomizationConfig(product);
    expect(factory.groups.find((group) => group.id === "functions")?.options.some((option) => option.id === "heating")).toBe(true);
    expect(checkout.groups.some((group) => group.id === "functions")).toBe(false);
  });

  it("marks image-backed appearance options visualizable and keeps them single-select", () => {
    const config = getCustomizationConfig(wm(groups));
    const eye = config.groups.find((group) => group.id === "eye");
    expect(eye?.selectionMode).toBe("single");
    expect(eye?.options.every((option) => option.visualizable && option.priceDelta === 0)).toBe(true);
  });

  it("does not mix the TPE catalog into anime, PVC, hybrid, silicone-head, or male families", () => {
    const product = wm(groups, { material: "PVC head / TPE body", sourceTitle: "Anime doll Y007" });
    product.title = "WM Y007 Anime Doll";
    expect(getCustomizationConfig(product).groups.some((group) => group.id === "choose-head")).toBe(false);
    expect(getCustomizationConfig(product).groups.some((group) => group.id === "add-extra-head")).toBe(false);
  });
});
