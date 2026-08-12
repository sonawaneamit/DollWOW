import { describe, expect, it } from "vitest";
import { buildVisualizerPrompt, resolveVisualizerSelections, visualizerConfigForProduct, visualizerGroups } from "@/lib/doll-visualizer/config";
import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";

const config: BrandCustomizationConfig = {
  id: "pilot",
  brandLabel: "Pilot",
  leadTimeNote: "",
  rules: [],
  groups: [
    { id: "skin-tone", label: "Skin Tone", display: "swatches", options: [
      { id: "tan", label: "Tan", swatch: { kind: "image", value: "https://example.com/tan.jpg" } },
      { id: "unsupported", label: "Unsupported", swatch: { kind: "color", value: "#fff" } }
    ] },
    { id: "body-heating", label: "Heating", display: "cards", options: [{ id: "yes", label: "Heating" }] },
    { id: "premium-head-options", label: "Premium", display: "swatches", options: [
      { id: "add-moles-freckles", label: "Add Moles & Freckles", swatch: { kind: "image", value: "https://example.com/freckles.jpg" } }
    ] }
  ]
};

const product = {
  title: "Pilot doll",
  extended: { displayName: "Vivian" }
} as Product;

describe("Doll Visualizer™ option safety", () => {
  it("keeps supplier visual references even when checkout pricing is not verified", () => {
    const supplierGroup = {
      id: "eye-color",
      label: "Eye color",
      display: "swatches" as const,
      options: [{ id: "blue", label: "Blue", swatch: { kind: "image" as const, value: "https://supplier.test/blue.jpg" } }]
    };
    const productWithSupplierGroups = { ...product, extended: { ...product.extended, customizationGroups: [supplierGroup] } };
    const resolved = visualizerConfigForProduct(productWithSupplierGroups, config);
    expect(resolved.groups).toEqual([supplierGroup]);
  });

  it("exposes only visual supplier references and freckles", () => {
    expect(visualizerGroups(config).map((group) => group.id)).toEqual(["skin-tone", "premium-head-options"]);
    expect(visualizerGroups(config)[0].options.map((option) => option.id)).toEqual(["tan"]);
  });

  it("drops unknown and non-visual selections", () => {
    expect(resolveVisualizerSelections(config, [
      { groupId: "skin-tone", optionId: "tan" },
      { groupId: "body-heating", optionId: "yes" },
      { groupId: "skin-tone", optionId: "not-real" }
    ])).toHaveLength(1);
  });

  it("builds an identity-preserving prompt without customer free text", () => {
    const selections = resolveVisualizerSelections(config, [{ groupId: "skin-tone", optionId: "tan" }]);
    const prompt = buildVisualizerPrompt(product, selections);
    expect(prompt).toContain("SKIN TONE: Tan");
    expect(prompt).toContain("Image 2: Skin Tone reference only");
    expect(prompt).toContain("Do not change anatomy");
    expect(prompt).toContain("DO NOT ADD OR INVENT ANYTHING");
    expect(prompt).toContain("exact original geometry, boundaries, scale, placement, and proportions");
    expect(prompt).toContain("same exact adult-proportioned DollWOW catalog doll");
    expect(prompt).toContain("Keep every unselected attribute unchanged");
    expect(prompt).toContain("Adapt it naturally to Image 1's original product");
  });

  it("locks all unselected product attributes without adding area-specific prompt logic", () => {
    const selections = resolveVisualizerSelections(config, [{ groupId: "premium-head-options", optionId: "add-moles-freckles" }]);
    const prompt = buildVisualizerPrompt(product, selections);
    expect(prompt).toContain("Apply only this named selected attribute");
    expect(prompt).toContain("Verify no unselected attribute changed");
    expect(prompt).not.toContain("SKIN-TONE AUTHORITY");
  });

});
