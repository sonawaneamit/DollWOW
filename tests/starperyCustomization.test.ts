import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import type { CustomizationGroup } from "@/types/customization";
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
    expect(head?.selectionMode).toBe("single");
    expect(head?.options).toHaveLength(176);
    expect(extra?.selectionMode).toBe("multiple");
    expect(extra?.options).toHaveLength(176);
    expect(extra?.options.some((option) => option.label === "Jane Bennet ROS" && option.priceDelta === 600)).toBe(true);
  });

  it("charges each distinct extra head in a multi-select order", () => {
    const config = getCustomizationConfig(starpery());
    const selections = getDefaultSelections(config);
    selections["additional-head"] = ["extra-xue-5", "extra-jane-bennet-ros"];
    const resolved = resolveCustomization(config, selections, 2000);
    expect(resolved.optionPriceDelta).toBe(1100);
    expect(resolved.requiresPriceConfirmation).toBe(false);
  });

  it("requires a matching ROS construction for ROS-listed heads", () => {
    const config = getCustomizationConfig(starpery());
    const selections = getDefaultSelections(config);
    selections["head-model"] = "jane-bennet-ros";
    let resolved = resolveCustomization(config, selections, 2000);
    expect(resolved.issues.some((issue) => /select the ros movable-jaw head type/i.test(issue.message))).toBe(true);

    selections["head-construction"] = "ros";
    resolved = resolveCustomization(config, selections, 2000);
    expect(resolved.issues).toEqual([]);
    expect(resolved.optionPriceDelta).toBe(100);
  });

  it("does not sell ROS construction against a standard-only head", () => {
    const config = getCustomizationConfig(starpery());
    const selections = getDefaultSelections(config);
    selections["head-model"] = "xue-5";
    selections["head-construction"] = "ros";
    const resolved = resolveCustomization(config, selections, 2000);
    expect(resolved.issues.some((issue) => /choose a head marked ros/i.test(issue.message))).toBe(true);
  });

  it("overrides dealer promotions with official factory pricing and keeps included visual references purchasable", () => {
    const imported: CustomizationGroup[] = [
      {
        id: "head-type",
        label: "Head Type",
        display: "swatches",
        options: [
          { id: "hard", label: "Hard Silicone", priceDelta: 0 },
          { id: "ros", label: "Real Oral Sex (ROS FREE)", priceDelta: 0 }
        ]
      },
      {
        id: "hair-implanted",
        label: "Hair Implanted",
        display: "swatches",
        options: [
          { id: "none", label: "No Thanks", priceDelta: 0 },
          { id: "synthetic", label: "Implanted Synthetic Hair (FREE)", priceDelta: 0 }
        ]
      },
      {
        id: "areola-color",
        label: "Areola Color",
        display: "swatches",
        options: [
          { id: "factory", label: "Factory default", swatch: { kind: "image", value: "https://example.com/default.jpg" } },
          { id: "no-6", label: "No.6", swatch: { kind: "image", value: "https://example.com/6.jpg" } }
        ]
      },
      {
        id: "an-extra-free-head",
        label: "An Extra Free Head",
        display: "swatches",
        options: [
          { id: "none", label: "No Thanks", priceDelta: 0 },
          { id: "xue", label: "Xue-5", priceDelta: 0 }
        ]
      }
    ];
    const product = starpery();
    product.extended.customizationGroups = imported;
    const groups = getCustomizationConfig(product).groups;
    expect(groups.find((group) => group.id === "head-type")?.options.find((option) => option.id === "ros")?.priceDelta).toBe(100);
    expect(groups.find((group) => group.id === "hair-implanted")?.options.find((option) => option.id === "synthetic")?.priceDelta).toBe(150);
    expect(groups.find((group) => group.id === "areola-color")?.options.find((option) => option.id === "no-6")).toMatchObject({
      priceDelta: 0,
      purchasable: true,
      visualizable: true
    });
    expect(groups.some((group) => group.label === "An Extra Free Head")).toBe(false);
    expect(groups.find((group) => group.id === "additional-head")?.selectionMode).toBe("multiple");
  });

  it("never marks an option Visualizer-ready without a real image reference", () => {
    const groups = getCustomizationConfig(starpery()).groups;
    const visualizable = groups.flatMap((group) => group.options.filter((option) => option.visualizable));
    expect(visualizable.length).toBeGreaterThan(0);
    expect(visualizable.every((option) => option.swatch?.kind === "image" && /^https:\/\//.test(option.swatch.value))).toBe(true);
    expect(groups.find((group) => group.id === "head-model")?.options.every((option) => option.visualizable === false)).toBe(true);
  });

  it("merges duplicate supplier groups without repeating configurator steps", () => {
    const duplicate: CustomizationGroup[] = [
      {
        id: "hair-color-a",
        label: "Hair Implanted Color",
        display: "swatches",
        options: [
          { id: "factory-a", label: "Factory default", swatch: { kind: "image", value: "https://example.com/default.jpg" } },
          { id: "black-a", label: "Black", priceDelta: 0, swatch: { kind: "image", value: "https://example.com/black.jpg" } }
        ]
      },
      {
        id: "hair-color-b",
        label: "Hair Implanted Color",
        display: "swatches",
        options: [
          { id: "factory-b", label: "Factory default", swatch: { kind: "image", value: "https://example.com/default-2.jpg" } },
          { id: "white-b", label: "White", swatch: { kind: "image", value: "https://example.com/white.jpg" } }
        ]
      }
    ];
    const product = starpery();
    product.extended.customizationGroups = duplicate;
    const groups = getCustomizationConfig(product).groups;
    const hairGroups = groups.filter((group) => group.label === "Hair Implanted Color");
    expect(hairGroups).toHaveLength(1);
    expect(hairGroups[0]?.options.map((option) => option.label)).toEqual(["Factory default", "Black", "White"]);
  });

  it("does not expose silicone-only construction choices on TPE products", () => {
    const body = getCustomizationConfig(starpery("TPE", "Starpery test TPE doll")).groups.find((group) => group.id === "body-construction");
    expect(body?.options.some((option) => option.id === "gel-butt")).toBe(false);
    expect(body?.options.some((option) => option.id === "hard-feet")).toBe(false);
  });
});
