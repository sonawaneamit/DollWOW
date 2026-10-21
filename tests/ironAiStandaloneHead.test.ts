import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { withIronAiHeadClassification } from "@/lib/catalog/ironAiStandaloneHead";
import { productPdpHeading, productPublicTitle } from "@/lib/catalog/naming";
import { primaryProductSpecs } from "@/lib/catalog/productSpecs";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { configurationPresets } from "@/lib/customization/presets";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import { isDollVueExcluded } from "@/lib/dollvue/eligibility";
import type { Product } from "@/types/product";

function legacyHead(): Product {
  return {
    ...sampleProducts[0],
    id: "gid://shopify/Product/10518042575032",
    handle: "irontech-ironai-head-companion-doll-1v3pz",
    title: "Ironai Head Customizable Companion Doll",
    description: "Full doll with body options",
    productType: "Custom Adult doll doll",
    tags: ["irontech", "full-doll", "customizable"],
    priceRange: {
      minVariantPrice: { amount: "552.00", currencyCode: "USD" },
      maxVariantPrice: { amount: "552.00", currencyCode: "USD" }
    },
    extended: {
      brand: "Irontech Doll", material: "Adult doll", heightCm: 0,
      customAvailable: true, stockStatus: "custom",
      customizationGroups: [
        { id: "head", label: "Head", display: "cards", options: [{ id: "one", label: "One" }, { id: "two", label: "Two" }] },
        { id: "sex-doll-head-stand", label: "Head stand", display: "cards", options: [
          { id: "no-add-on", label: "No add-on", priceDelta: 0 },
          { id: "tall-display-stand", label: "Tall Display Stand", priceDelta: 300 },
          { id: "bust", label: "Realistic Bust Stand", priceDelta: 420 }
        ] },
        { id: "accessories", label: "Body accessories", display: "cards", options: [{ id: "body", label: "Body" }] }
      ]
    }
  };
}

describe("reviewed IronAI standalone head", () => {
  it("corrects the legacy type/copy without replacing commercial or image identity", () => {
    const original = legacyHead();
    const result = withIronAiHeadClassification(original);
    expect(result.productType).toBe("Head only");
    expect(result.tags).toContain("head-only");
    expect(result.tags).not.toContain("full-doll");
    expect(result.description).toContain("a doll body is not included");
    expect(result.extended.heightCm).toBeUndefined();
    expect(result.extended.material).toBeUndefined();
    expect(result.priceRange).toBe(original.priceRange);
    expect(result.variants).toBe(original.variants);
    expect(result.featuredImage).toBe(original.featuredImage);
    expect(result.images).toBe(original.images);
    expect(result.extended.customizationGroups).toEqual(original.extended.customizationGroups?.slice(0, 2));
    expect(original.tags).toContain("full-doll");
  });

  it("has head-only headings, specs and no body presets or DollVue badge", () => {
    const result = withIronAiHeadClassification(legacyHead());
    expect(productPublicTitle(result)).toContain("IronAI Smart Head");
    expect(productPdpHeading(result)).toContain("IronAI Smart Head");
    expect(productPdpHeading(result)).not.toMatch(/companion|0cm|cup/i);
    expect(primaryProductSpecs(result).find(spec => spec.label === "Includes")?.value).toBe("Head only (no body)");
    expect(primaryProductSpecs(result).some(spec => /height|waist|hip|bust/i.test(spec.label))).toBe(false);
    const config = getCustomizationConfig(result);
    expect(config.groups.map(group => group.id)).toEqual(["head", "sex-doll-head-stand"]);
    const selections = getDefaultSelections(config);
    expect(configurationPresets(result.handle, config, 552, selections)).toEqual([]);
    expect(isDollVueExcluded(result)).toBe(true);
    expect(resolveCustomization(config, selections, 552).optionPriceDelta).toBe(0);
    const selectedStand = { ...selections, "sex-doll-head-stand": "tall-display-stand" };
    expect(resolveCustomization(config, selectedStand, 552).optionPriceDelta).toBe(300);
  });

  it("does not overwrite an unrelated or subsequently corrected product", () => {
    for (const patch of [
      { id: "gid://shopify/Product/other" },
      { handle: "different-head" },
      { productType: "Standalone Head", title: "Factory reviewed title" }
    ]) {
      const original = { ...legacyHead(), ...patch };
      expect(withIronAiHeadClassification(original)).toBe(original);
    }
    const repaired = withIronAiHeadClassification(legacyHead());
    expect(withIronAiHeadClassification(repaired)).toBe(repaired);
  });
});
