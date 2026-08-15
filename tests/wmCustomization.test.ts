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
    const included = config.groups.find((group) => group.id === "included-extra-head");
    const extra = config.groups.find((group) => group.id === "add-extra-head");
    expect(choose?.selectionMode).toBe("single");
    expect(choose?.options).toHaveLength(162);
    expect(choose?.options.find((option) => option.id === "head-418")?.priceDelta).toBe(0);
    expect(choose?.options.find((option) => option.id === "head-273a")?.label).toBe("Head 273A · TPE");
    expect(choose?.options.find((option) => option.id === "head-432-1")?.label).toBe("Head 432-1 · TPE");
    expect(choose?.options.find((option) => option.id === "head-496")?.swatch?.kind).toBe("image");
    expect(choose?.options.some((option) => /other head/i.test(option.label))).toBe(false);
    expect(included?.label).toBe("Included Extra Head");
    expect(included?.selectionMode).toBe("single");
    expect(included?.options).toHaveLength(162);
    expect(included?.options.slice(1).every((option) => option.priceDelta === 0)).toBe(true);
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options).toHaveLength(162);
    expect(extra?.options.find((option) => option.id === "extra-head-418")?.priceDelta).toBe(299);
    expect(extra?.options.slice(1).every((option) => option.priceDelta === 299)).toBe(true);
    expect(config.groups.some((group) => /extra free head/i.test(group.label))).toBe(false);
  });

  it("charges every selected extra head", () => {
    const config = getCustomizationConfig(wm(groups));
    const selections = getDefaultSelections(config);
    selections["add-extra-head"] = ["extra-head-159", "extra-head-418"];
    expect(resolveCustomization(config, selections, 1600).optionPriceDelta).toBe(598);
  });

  it("offers source-verified silicone heads as free replacements and paid extras", () => {
    const siliconeGroups: CustomizationGroup[] = [
      { id: "head-type", label: "Head Type", selectionMode: "single", display: "swatches", options: [
        { id: "hard", label: "Hard Silicone", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/hard.jpg" } },
        { id: "soft", label: "Soft Silicone", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/soft.jpg" } }
      ] },
      { id: "extra", label: "An Extra Head", selectionMode: "single", display: "swatches", options: [
        { id: "none", label: "No add-on" },
        { id: "198", label: "198", priceDelta: 399, swatch: { kind: "image", value: "https://example.com/198.jpg" } },
        { id: "201", label: "201", priceDelta: 399, swatch: { kind: "image", value: "https://example.com/201.jpg" } },
        { id: "202", label: "202", priceDelta: 399, swatch: { kind: "image", value: "https://example.com/202.jpg" } },
        { id: "other", label: "Other Head", priceDelta: 399, swatch: { kind: "image", value: "https://example.com/other.jpg" } }
      ] }
    ];
    const product = wm(siliconeGroups, { material: "Silicone" });
    product.title = "WM Clara Vale 163cm D-Cup Silicone";
    product.handle = "wm-head-201-163cm-d-cup-silicone-companion-doll";

    const config = getCustomizationConfig(product);
    const choose = config.groups.find((group) => group.id === "choose-head");
    const included = config.groups.find((group) => group.id === "included-extra-head");
    const extra = config.groups.find((group) => group.id === "add-extra-head");

    expect(choose?.selectionMode).toBe("single");
    expect(choose?.options.map((option) => option.label)).toEqual(["As shown in product photos", "198", "201", "202"]);
    expect(choose?.options.every((option) => option.priceDelta === 0)).toBe(true);
    expect(included?.selectionMode).toBe("single");
    expect(included?.options).toHaveLength(4);
    expect(included?.options.map((option) => option.label)).toEqual(["No included extra head", "198", "201", "202"]);
    expect(included?.options.slice(1).every((option) => option.priceDelta === 0)).toBe(true);
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options.map((option) => option.label)).toEqual(["No extra head", "198", "201", "202"]);
    expect(extra?.options.slice(1).every((option) => option.priceDelta === 399)).toBe(true);
  });

  it("uses the complete silicone-head library for silicone-head TPE builds", () => {
    const product = wm(groups, {
      material: "Silicone head",
    });
    product.title = "WM Weitta 175cm Silicone Head Doll";
    product.handle = "wm-weitta-175cm-silicone-head-s-tpe-doll";
    product.productType = "Custom silicone-head TPE doll";
    product.extended.customizationGroups = [
      { id: "material", label: "Material", selectionMode: "single", display: "swatches", options: [
        { id: "s-tpe", label: "S-TPE (Default)", priceDelta: 0 },
        { id: "ultra-soft", label: "Ultra-Soft TPE (FREE)", priceDelta: 0 },
      ] },
      ...groups,
    ];

    const config = getCustomizationConfig(product);
    const choose = config.groups.find((group) => group.id === "choose-head");
    const included = config.groups.find((group) => group.id === "included-extra-head");
    const extra = config.groups.find((group) => group.id === "add-extra-head");

    expect(choose?.selectionMode).toBe("single");
    expect(choose?.options).toHaveLength(165);
    expect(choose?.options.find((option) => option.id === "head-ss182")?.label).toBe("Head SS182 · Silicone");
    expect(choose?.options.some((option) => option.id === "head-120")).toBe(false);
    expect(choose?.options.some((option) => option.id === "head-400-1")).toBe(false);
    expect(included?.options).toHaveLength(165);
    expect(included?.selectionMode).toBe("single");
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options).toHaveLength(165);
    expect(extra?.options.find((option) => option.id === "extra-head-ss167")?.priceDelta).toBe(650);
    expect(choose?.options.find((option) => option.id === "head-ss167")?.dollVueEnabled).toBe(true);
  });

  it("keeps unknown paid functions out of checkout while retaining them in the factory record", () => {
    const product = wm(groups);
    const factory = getFactoryCustomizationConfig(product);
    const checkout = getCustomizationConfig(product);
    expect(factory.groups.find((group) => group.id === "functions")?.options.some((option) => option.id === "heating")).toBe(true);
    expect(checkout.groups.some((group) => group.id === "functions")).toBe(false);
  });

  it("marks image-backed appearance options as DollVue-enabled and keeps them single-select", () => {
    const config = getCustomizationConfig(wm(groups));
    const eye = config.groups.find((group) => group.id === "eye");
    expect(eye?.selectionMode).toBe("single");
    expect(eye?.options[0]?.label).toBe("As shown in product photos");
    expect(eye?.options[0]?.dollVueEnabled).toBe(false);
    expect(eye?.options.slice(1).every((option) => option.dollVueEnabled && option.priceDelta === 0)).toBe(true);
  });

  it("adds a photographed default to single selectors and no-add-on to multi-select groups", () => {
    const config = getCustomizationConfig(wm(groups));
    const eye = config.groups.find((group) => group.id === "eye");
    const functions = getFactoryCustomizationConfig(wm(groups)).groups.find((group) => group.id === "functions");

    expect(eye?.options[0]?.label).toBe("As shown in product photos");
    expect(eye?.options[0]?.priceDelta).toBe(0);
    expect(functions?.options[0]?.label).toBe("No add-on");
  });

  it("keeps anime, PVC, hybrid, and male families on their product-specific head choices", () => {
    const product = wm(groups, { material: "PVC head / TPE body", sourceTitle: "Anime doll Y007" });
    product.title = "WM Y007 Anime Doll";
    const choose = getCustomizationConfig(product).groups.find((group) => group.id === "choose-head");
    expect(choose?.options.map((option) => option.label)).toEqual(["As shown in product photos", "159"]);
    expect(choose?.options.some((option) => option.label === "Head 432-1 · TPE")).toBe(false);
    expect(getCustomizationConfig(product).groups.some((group) => group.id === "add-extra-head")).toBe(false);
  });

  it("keeps ready-to-ship units on their product-specific stock selector", () => {
    const stockGroups: CustomizationGroup[] = [
      { id: "head", label: "A Head", selectionMode: "single", display: "swatches", options: [
        { id: "minana", label: "Minana", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/minana.jpg" } },
        { id: "addison", label: "Addison", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/addison.jpg" } },
      ] },
      ...groups,
    ];
    const product = wm(stockGroups, { stockStatus: "ready_to_ship" });
    product.title = "WM Minana 162cm F-Cup TPE Ready-To-Ship Companion Doll";
    product.handle = "wm-minana-162cm-f-cup-tpe-ready-to-ship";

    const config = getCustomizationConfig(product);
    const choose = config.groups.find((group) => group.id === "choose-head");
    expect(choose?.options.map((option) => option.label)).toEqual(["As shown in product photos", "Minana", "Addison"]);
    expect(config.groups.find((group) => group.id === "add-extra-head")).toBeUndefined();
  });
});
