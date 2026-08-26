import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import type { CustomizationGroup } from "@/types/customization";
import type { Product } from "@/types/product";

function irontech(groups: CustomizationGroup[] = []): Product {
  return {
    id: "gid://shopify/Product/irontech-test",
    handle: "irontech-penny-164cm-f-cup-silicone-head-companion-doll-test",
    title: "Irontech Penny 164cm F-Cup Silicone Head Doll",
    description: "",
    vendor: "Irontech Dolls",
    productType: "Custom doll",
    tags: ["irontech", "custom"],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "2100", currencyCode: "USD" },
      maxVariantPrice: { amount: "2100", currencyCode: "USD" }
    },
    extended: { brand: "Irontech Dolls", material: "Silicone head / TPE body", heightCm: 164, cupSize: "F", customizationGroups: groups }
  };
}

const sourceGroups: CustomizationGroup[] = [
  {
    id: "head-type",
    label: "Head Type",
    display: "swatches",
    options: [
      { id: "tpe", label: "TPE Head" },
      { id: "silicone", label: "Silicone Head", priceDelta: 299 }
    ]
  },
  {
    id: "tpe-head",
    label: "Your Custom Tpe Head",
    display: "swatches",
    options: [
      { id: "31", label: "31", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/31.png" } },
      { id: "32", label: "32", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/32.png" } }
    ]
  },
  {
    id: "silicone-head",
    label: "Your Custom Silicone Head",
    display: "swatches",
    options: [
      { id: "s1", label: "S1", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/s1.jpg" } },
      { id: "s2", label: "S2", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/s2.jpg" } }
    ]
  },
  {
    id: "extra-free",
    label: "An Extra Free Head",
    display: "swatches",
    options: [
      { id: "none", label: "No Thanks", priceDelta: 0 },
      { id: "31", label: "31", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/31.png" } }
    ]
  },
  {
    id: "eye-color",
    label: "Eye Color",
    display: "swatches",
    options: [
      { id: "factory", label: "Factory default", swatch: { kind: "image", value: "https://example.com/default.jpg" } },
      { id: "green", label: "Green", swatch: { kind: "image", value: "https://example.com/green.jpg" } }
    ]
  },
  {
    id: "premium",
    label: "Premium Head & Body Options (Multiple)",
    selectionMode: "multiple",
    display: "cards",
    options: [
      { id: "none", label: "No add-on" },
      { id: "ironai", label: "IronAI", priceDelta: 60 },
      { id: "heating", label: "Body Heating", priceDelta: 150 }
    ]
  },
  {
    id: "weight",
    label: "Weight Reduction",
    display: "cards",
    options: [
      { id: "regular", label: "Regular Version", priceDelta: 0 },
      { id: "ulw", label: "Ultra Lightweight Version", priceDelta: 150 },
      { id: "soft-butt", label: "Soft butt", priceDelta: 120 }
    ]
  }
];

describe("Irontech dealer-guided customization", () => {
  it("separates one chosen head from paid multi-select extra heads", () => {
    const groups = getCustomizationConfig(irontech(sourceGroups)).groups;
    const head = groups.find((group) => group.id === "choose-head");
    const extra = groups.find((group) => group.id === "add-extra-head");
    expect(head?.selectionMode).toBe("single");
    expect(head?.options[0]?.label).toBe("As shown");
    expect(head?.options.filter((option) => / · TPE$/.test(option.label))).toHaveLength(65);
    expect(head?.options.find((option) => option.id === "tpe-31")?.priceDelta).toBe(0);
    expect(head?.options.find((option) => option.id === "silicone-s1")?.priceDelta).toBe(299);
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options.find((option) => option.id === "tpe-31")?.priceDelta).toBe(375);
    expect(extra?.options.find((option) => option.id === "silicone-s1")?.priceDelta).toBe(299);
    expect(groups.some((group) => /extra free head/i.test(group.label))).toBe(false);
  });

  it("expands legacy numeric TPE selectors to the current comprehensive library", () => {
    const groups = sourceGroups.filter((group) => !/^your custom (tpe|silicone) head$/i.test(group.label));
    const promotional = groups.find((group) => group.id === "extra-free")!;
    promotional.options = [
      { id: "31", label: "31", swatch: { kind: "image", value: "https://example.com/31.png" } },
      { id: "32", label: "32", swatch: { kind: "image", value: "https://example.com/32.png" } }
    ];
    const head = getCustomizationConfig(irontech(groups)).groups.find((group) => group.id === "choose-head");
    const extra = getCustomizationConfig(irontech(groups)).groups.find((group) => group.id === "add-extra-head");
    expect(head?.options).toHaveLength(66);
    expect(head?.options.some((option) => option.id === "tpe-102")).toBe(true);
    expect(extra?.options).toHaveLength(66);
    expect(extra?.options.filter((option) => /(^|-)31$/.test(option.id))).toHaveLength(1);
  });

  it("does not mix special named head families into the standard TPE catalog", () => {
    const groups = sourceGroups.filter((group) => !/^your custom (tpe|silicone) head$/i.test(group.label));
    const promotional = groups.find((group) => group.id === "extra-free")!;
    promotional.options = [
      { id: "a3", label: "A3 ROS MAX", swatch: { kind: "image", value: "https://example.com/a3.jpg" } },
      { id: "a4", label: "A4 ROS MAX", swatch: { kind: "image", value: "https://example.com/a4.jpg" } }
    ];
    const normalized = getCustomizationConfig(irontech(groups)).groups;
    const chosen = normalized.find((group) => group.id === "choose-head");
    expect(chosen?.options.map((option) => option.label)).toEqual(["As shown", "A3 ROS MAX", "A4 ROS MAX"]);
    expect(normalized.some((group) => group.id === "add-extra-head")).toBe(true);
    const extra = normalized.find((group) => group.id === "add-extra-head");
    expect(extra?.options.map((option) => option.label)).toEqual(["No extra head", "A3 ROS MAX", "A4 ROS MAX"]);
  });

  it("charges every distinct additional head", () => {
    const config = getCustomizationConfig(irontech(sourceGroups));
    const selections = getDefaultSelections(config);
    selections["add-extra-head"] = ["tpe-31", "silicone-s1"];
    const resolved = resolveCustomization(config, selections, 2100);
    expect(resolved.optionPriceDelta).toBe(674);
    expect(resolved.requiresPriceConfirmation).toBe(false);
  });

  it("adds the comprehensive silicone library to compatible female builds whose old source omitted the head selector", () => {
    const product = irontech(sourceGroups.filter((group) => !/head/i.test(group.label)));
    product.extended.customizationGroups = [
      ...product.extended.customizationGroups!,
      {
        id: "breast-options",
        label: "Breast Options",
        display: "cards",
        options: [
          { id: "gel", label: "Gel (FREE)" },
          { id: "solid", label: "Solid" }
        ]
      }
    ];
    product.extended.material = "Silicone";
    product.extended.bodyType = "female";
    const config = getCustomizationConfig(product);
    expect(config.groups.find((group) => group.id === "choose-head")?.options).toHaveLength(38);
    expect(config.groups.find((group) => group.id === "choose-head")?.options.find((option) => option.id === "silicone-s48")?.priceDelta).toBe(0);
    expect(config.groups.find((group) => group.id === "add-extra-head")?.options.find((option) => option.id === "silicone-s48")?.priceDelta).toBe(299);
  });

  it("keeps approved DollWOW IronAI and ULW pricing instead of dealer promos", () => {
    const groups = getCustomizationConfig(irontech(sourceGroups)).groups;
    expect(groups.find((group) => group.id === "premium")?.options.find((option) => option.id === "ironai")?.priceDelta).toBe(119);
    expect(groups.some((group) => group.id === "body-weight")).toBe(false);
    expect(groups.find((group) => group.id === "weight")?.options.map((option) => option.id)).toEqual(["regular", "soft-butt"]);
  });

  it("marks only image-backed superficial options DollVue-ready", () => {
    const groups = getCustomizationConfig(irontech(sourceGroups)).groups;
    expect(groups.find((group) => group.id === "eye-color")?.options.every((option) => option.dollVueEnabled)).toBe(true);
    expect(groups.find((group) => group.id === "eye-color")?.options.find((option) => option.id === "green")?.priceDelta).toBe(0);
    expect(groups.find((group) => group.id === "choose-head")?.options.every((option) => option.dollVueEnabled === false)).toBe(true);
  });

  it("corrects the supplier's Natural Skin spelling across Irontech configurators", () => {
    const product = irontech([
      {
        id: "skin-tone",
        label: "Skin Tone",
        display: "swatches",
        options: [
          { id: "default", label: "Factory default" },
          { id: "natural", label: "Natrual Skin", swatch: { kind: "image", value: "https://example.com/natural.jpg" } }
        ]
      }
    ]);

    const skinTone = getCustomizationConfig(product).groups.find((group) => group.id === "skin-tone");
    expect(skinTone?.options.find((option) => option.id === "natural")?.label).toBe("Natural Skin");
  });

  it("enables image-backed freckles and makeup without exposing non-visual upgrades", () => {
    const product = irontech([
      ...sourceGroups,
      {
        id: "appearance-details",
        label: "Premium Head & Body Options (Multiple)",
        selectionMode: "multiple",
        display: "swatches",
        options: [
          { id: "freckles", label: "Moles & Freckles", swatch: { kind: "image", value: "https://example.com/freckles.jpg" } },
          { id: "heating", label: "Body Heating", swatch: { kind: "image", value: "https://example.com/heating.jpg" } }
        ]
      },
      {
        id: "makeup",
        label: "Makeup Options",
        display: "swatches",
        options: [
          { id: "default", label: "Factory default", swatch: { kind: "image", value: "https://example.com/default-makeup.jpg" } },
          { id: "realism", label: "Hyper-realism Painting", swatch: { kind: "image", value: "https://example.com/painting.jpg" } }
        ]
      }
    ]);
    const groups = getCustomizationConfig(product).groups;
    const premium = groups.find((group) => /^premium head/i.test(group.label));
    expect(premium?.options.find((option) => option.id === "freckles")?.dollVueEnabled).toBe(true);
    expect(premium?.options.find((option) => option.id === "heating")?.dollVueEnabled).toBe(false);
    expect(groups.find((group) => group.id === "makeup")?.options.find((option) => option.id === "realism")?.dollVueEnabled).toBe(true);
  });

  it("uses the shared silicone family profile when a female SKU has no imported groups", () => {
    const product = irontech();
    product.extended.material = "Full silicone";
    product.extended.bodyType = "female";
    const config = getCustomizationConfig(product);
    expect(config.id).toBe("irontech-family-profile");
    expect(config.groups.find((group) => group.id === "choose-head")?.options).toHaveLength(38);
    expect(config.groups.find((group) => group.id === "add-extra-head")?.options).toHaveLength(38);
    expect(config.groups.find((group) => group.id === "choose-head")?.options.find((option) => option.id === "silicone-s48")?.priceDelta).toBe(0);
  });

  it("uses the shared TPE family profile when a female SKU has no imported groups", () => {
    const product = irontech();
    product.title = "Irontech test 164cm TPE doll";
    product.handle = "irontech-test-164cm-tpe-doll";
    product.extended.material = "TPE";
    product.extended.bodyType = "female";
    const config = getCustomizationConfig(product);
    expect(config.id).toBe("irontech-family-profile");
    expect(config.groups.find((group) => group.id === "choose-head")?.options).toHaveLength(66);
    expect(config.groups.find((group) => group.id === "add-extra-head")?.options).toHaveLength(66);
    expect(config.groups.find((group) => group.id === "choose-head")?.options.find((option) => option.id === "tpe-102")?.priceDelta).toBe(0);
  });

  it("does not leak standard female head libraries onto male products", () => {
    const product = irontech();
    product.title = "Irontech Drake Von 175cm Male Silicone Doll";
    product.handle = "irontech-drake-von-175cm-male-silicone-doll";
    product.extended.material = "Silicone";
    product.extended.bodyType = "male";
    const config = getCustomizationConfig(product);
    expect(config.id).toBe("irontech-family-profile");
    expect(config.groups.some((group) => group.id === "choose-head" || group.id === "add-extra-head")).toBe(false);
  });

  it("does not charge for vagina hair neutral default options like None or No thanks", () => {
    const product = irontech([
      {
        id: "vagina-hair",
        label: "Vagina Hair",
        display: "cards",
        options: [
          { id: "none", label: "None" },
          { id: "no-thanks", label: "No thanks" },
          { id: "factory-default", label: "Factory default" },
          { id: "as-shown", label: "As shown" },
          { id: "natural", label: "Natural pubic hair" },
          { id: "trimmed", label: "Trimmed" }
        ]
      }
    ]);
    
    const config = getCustomizationConfig(product);
    const vaginaHair = config.groups.find((group) => /vagina hair/i.test(group.label));
    
    expect(vaginaHair?.options.find((option) => option.id === "none")?.priceDelta).toBe(0);
    expect(vaginaHair?.options.find((option) => option.id === "no-thanks")?.priceDelta).toBe(0);
    expect(vaginaHair?.options.find((option) => option.id === "factory-default")?.priceDelta).toBe(0);
    expect(vaginaHair?.options.find((option) => option.id === "as-shown")?.priceDelta).toBe(0);
    expect(vaginaHair?.options.find((option) => option.id === "natural")?.priceDelta).toBe(30);
    expect(vaginaHair?.options.find((option) => option.id === "trimmed")?.priceDelta).toBe(30);
  });
});
