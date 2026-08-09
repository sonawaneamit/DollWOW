import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";

function realLadyProduct(productType = "Doll"): Product {
  const source = sampleProducts[0];
  return {
    ...source,
    title: "Real Lady Celeste 168cm silicone doll",
    handle: "real-lady-celeste-168cm-silicone-doll",
    vendor: "Real Lady",
    productType,
    tags: ["real-lady", "customizable"],
    extended: { ...source.extended, brand: "Real Lady", material: "Silicone", customizationGroups: undefined }
  };
}

describe("Real Lady IronAI customization", () => {
  it("offers the $119 IronAI upgrade on compatible Real Lady full dolls", () => {
    const config = getCustomizationConfig(realLadyProduct());
    const group = config.groups.find((item) => item.id === "ironai-head-upgrade");

    expect(group?.resources?.[0]?.href).toContain("real-lady.com/products/sex-doll-ironai-heads");
    expect(group?.description).toContain("long-term memory");

    const resolved = resolveCustomization(
      config,
      { ...getDefaultSelections(config), "ironai-head-upgrade": "ironai-head" },
      2999
    );
    expect(group?.options.find((option) => option.id === "ironai-head")?.priceDelta).toBe(119);
    expect(resolved.requiresPriceConfirmation).toBe(false);
    expect(resolved.optionPriceDelta).toBe(119);
  });

  it.each(["Torso", "Hips"])("does not offer IronAI on %s products", (productType) => {
    expect(getCustomizationConfig(realLadyProduct(productType)).groups.some((group) => group.id === "ironai-head-upgrade")).toBe(false);
  });

  it("limits the standalone IronAI product to the five manufacturer-listed head models", () => {
    const product = realLadyProduct("Head");
    product.title = "IronAI Head";
    product.handle = "irontech-ironai-head";
    product.vendor = "Irontech Dolls";
    product.tags = ["irontech", "ironai", "head"];
    product.extended = {
      ...product.extended,
      brand: "Irontech Doll",
      customizationGroups: [
        {
          id: "head",
          label: "Head",
          display: "swatches",
          options: [
            { id: "unsupported-one", label: "Unsupported one" },
            { id: "unsupported-two", label: "Unsupported two" }
          ]
        },
        {
          id: "sex-doll-head-stand",
          label: "Sex Doll Head Stand",
          display: "cards",
          options: [
            { id: "none", label: "No stand", priceDelta: 0 },
            { id: "tall", label: "Tall display stand", priceDelta: 350 }
          ]
        }
      ]
    };

    const config = getCustomizationConfig(product);
    expect(config.groups.map((group) => group.id)).toEqual(["head", "sex-doll-head-stand"]);
    expect(config.groups[0]?.options.map((option) => option.label)).toEqual([
      "R4 Celeste",
      "R8 Lena",
      "R10 Viki",
      "R11 Alara",
      "R12 Hailey"
    ]);
  });

  it("removes legacy extra-head promotions and uses current manufacturer upgrade prices", () => {
    const product = realLadyProduct();
    product.extended = {
      ...product.extended,
      customizationGroups: [
        {
          id: "weight-reduction",
          label: "Weight Reduction",
          display: "cards",
          options: [
            { id: "regular", label: "Regular Version" },
            { id: "ulw", label: "Ultra Lightweight Version", priceDelta: 150 }
          ]
        },
        {
          id: "premium-head-body",
          label: "Premium Head & Body Options (Multiple)",
          display: "cards",
          options: [
            { id: "included", label: "Implanted eyebrows" },
            { id: "ironai", label: "IronAI", priceDelta: 60 }
          ]
        },
        {
          id: "extra-head",
          label: "An Extra Free Head",
          display: "cards",
          options: [
            { id: "s22", label: "S22" },
            { id: "s23", label: "S23" }
          ]
        },
        {
          id: "robot-option",
          label: "Robot Option",
          display: "cards",
          options: [
            { id: "none", label: "No add-on" },
            { id: "old-hips", label: "Electric Hip and Waist", priceDelta: 250 }
          ]
        }
      ]
    };

    const config = getCustomizationConfig(product);
    expect(config.groups.some((group) => /extra free head/i.test(group.label))).toBe(false);
    expect(config.groups.flatMap((group) => group.options).filter((option) => option.id === "ironai")).toHaveLength(0);
    expect(config.groups.find((group) => group.id === "weight-reduction")?.options.find((option) => option.id === "ulw")?.priceDelta).toBe(265);
    expect(config.groups.find((group) => group.id === "robot-option")?.options.map((option) => option.priceDelta)).toEqual([0, 180, 280, 280]);
  });
});
