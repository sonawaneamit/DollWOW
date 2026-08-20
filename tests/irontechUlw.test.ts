import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import { sampleProducts } from "@/lib/data/sample-products";
import type { CustomizationGroup } from "@/types/customization";
import type { Product } from "@/types/product";

const CONSERVATIVE_ULW_COPY =
  "Weight reduction varies by body and configuration. Compatibility and expected finished weight are confirmed before production.";

function irontech(overrides: {
  material?: string;
  productType?: string;
  stockStatus?: Product["extended"]["stockStatus"];
  verified?: boolean;
  groups?: CustomizationGroup[];
} = {}): Product {
  const source = sampleProducts[0];
  return {
    ...source,
    title: "Irontech 165cm full body doll",
    handle: "irontech-165cm-full-body-doll",
    vendor: "Irontech Dolls",
    productType: overrides.productType ?? "Doll",
    tags: ["irontech", "customizable"],
    extended: {
      ...source.extended,
      brand: "Irontech Dolls",
      material: overrides.material ?? "Full silicone",
      stockStatus: overrides.stockStatus ?? "custom",
      customizationGroups: overrides.groups,
      irontechUlwEligibility: overrides.verified
        ? {
            status: "verified",
            bodyModel: "Irontech 165F",
            source: "irontech-production-data",
            verifiedAt: "2026-08-20"
          }
        : undefined
    }
  };
}

function bodyWeightGroups(product: Product) {
  return getCustomizationConfig(product).groups.filter((group) => group.id === "body-weight");
}

describe("Irontech Ultra Light Weight customization", () => {
  it("offers one canonical $195 ULW choice only for a production-verified body", () => {
    const [group] = bodyWeightGroups(irontech({ verified: true }));

    expect(bodyWeightGroups(irontech({ verified: true }))).toHaveLength(1);
    expect(group?.options.filter((option) => option.id === "ultra-lightweight")).toHaveLength(1);
    expect(group?.options.find((option) => option.id === "ultra-lightweight")?.priceDelta).toBe(195);
    expect(group?.options.find((option) => option.id === "ultra-lightweight")?.description).toBe(CONSERVATIVE_ULW_COPY);
    expect(group?.resources?.map((resource) => resource.kind)).toEqual(["video", "document", "web"]);
    expect(group?.resources?.some((resource) => /sgs|factory audit/i.test(`${resource.label} ${resource.href}`))).toBe(false);
  });

  it("fails closed when an Irontech silicone body's ULW eligibility is unverified", () => {
    expect(bodyWeightGroups(irontech())).toHaveLength(0);
  });

  it("removes stale imported $150 ULW choices and replaces them with the canonical option", () => {
    const imported: CustomizationGroup = {
      id: "body-weight",
      label: "Body Weight",
      display: "cards",
      options: [
        { id: "regular", label: "Regular Version", priceDelta: 0 },
        { id: "ulw", label: "Ultra Lightweight Version", priceDelta: 150 }
      ]
    };
    const groups = getCustomizationConfig(irontech({ verified: true, groups: [imported] })).groups;
    const ulwOptions = groups.flatMap((group) => group.options).filter((option) => /ultra light|\bulw\b/i.test(`${option.id} ${option.label}`));

    expect(groups.filter((group) => /weight reduction|body weight technology/i.test(group.label))).toHaveLength(1);
    expect(ulwOptions).toHaveLength(1);
    expect(ulwOptions[0]?.id).toBe("ultra-lightweight");
    expect(ulwOptions[0]?.priceDelta).toBe(195);
  });

  it("preserves legitimate sibling options when removing stale ULW from a mixed imported group", () => {
    const mixedGroup: CustomizationGroup = {
      id: "weight-reduction",
      label: "Weight reduction",
      display: "cards",
      options: [
        { id: "standard", label: "Standard body", priceDelta: 0 },
        { id: "ulw", label: "Ultra Light Weight", priceDelta: 150 },
        { id: "soft-butt", label: "Soft butt", priceDelta: 120 }
      ]
    };

    const groups = getCustomizationConfig(irontech({ verified: true, groups: [mixedGroup] })).groups;
    const preserved = groups.find((group) => group.id === "weight-reduction");

    expect(preserved?.options.map((option) => option.id)).toEqual(["standard", "soft-butt"]);
    expect(groups.flatMap((group) => group.options).filter((option) => /ultra light|\bulw\b/i.test(`${option.id} ${option.label}`))).toHaveLength(1);
  });

  it("removes stale Ultra Light Version only in body-weight context and preserves unrelated ultra-light wording", () => {
    const staleBodyWeightGroup: CustomizationGroup = {
      id: "body-weight",
      label: "Body Weight",
      display: "cards",
      options: [
        { id: "regular", label: "Regular Version", priceDelta: 0 },
        { id: "ultra-light", label: "Ultra Light Version", priceDelta: 150 }
      ]
    };
    const skinToneGroup: CustomizationGroup = {
      id: "skin-tone",
      label: "Skin tone",
      display: "cards",
      options: [
        { id: "standard-tone", label: "Standard skin tone", priceDelta: 0 },
        { id: "ultra-light-skin", label: "Ultra light skin tone", priceDelta: 45 }
      ]
    };

    const groups = getCustomizationConfig(irontech({ verified: true, groups: [staleBodyWeightGroup, skinToneGroup] })).groups;
    const ulwOptions = groups
      .filter((group) => /body[ -]?weight|weight[ -]?reduction/i.test(`${group.id} ${group.label}`))
      .flatMap((group) => group.options)
      .filter((option) => /ultra light|\bulw\b/i.test(`${option.id} ${option.label}`));

    expect(ulwOptions.map((option) => [option.id, option.priceDelta])).toEqual([["ultra-lightweight", 195]]);
    expect(groups.find((group) => group.id === "skin-tone")?.options.map((option) => option.id)).toEqual([
      "standard-tone",
      "ultra-light-skin"
    ]);
  });

  it.each([
    ["body-weight", "Body weight technology"],
    ["weight-reduction", "Weight Reduction"]
  ])("preserves non-ULW siblings from canonical imported group %s", (id, label) => {
    const imported: CustomizationGroup = {
      id,
      label,
      display: "cards",
      options: [
        { id: "regular", label: "Regular Version", priceDelta: 0 },
        { id: "ulw", label: "Ultra Lightweight Version", priceDelta: 150 },
        { id: "soft-butt", label: "Soft butt", priceDelta: 120 }
      ]
    };

    const groups = getCustomizationConfig(irontech({ verified: true, groups: [imported] })).groups;
    const preserved = groups.find((group) => group.options.some((option) => option.id === "soft-butt"));
    const canonicalUlwGroup = groups.find((group) => group.options.some((option) => option.id === "ultra-lightweight"));
    const ulwOptions = groups.flatMap((group) => group.options).filter((option) => /ultra light|\bulw\b/i.test(`${option.id} ${option.label}`));

    expect(preserved?.options.map((option) => option.id)).toEqual(
      id === "body-weight" ? ["regular", "soft-butt", "ultra-lightweight"] : ["regular", "soft-butt"]
    );
    expect(canonicalUlwGroup?.id).toBe("body-weight");
    expect(ulwOptions.map((option) => [option.id, option.priceDelta])).toEqual([["ultra-lightweight", 195]]);
  });

  it("preserves a lone meaningful non-ULW sibling through the full Irontech checkout path", () => {
    const imported: CustomizationGroup = {
      id: "weight-reduction",
      label: "Weight Reduction",
      display: "cards",
      options: [
        { id: "ulw", label: "Ultra-Light Weight", priceDelta: 150 },
        { id: "soft-butt", label: "Soft butt", priceDelta: 120 }
      ]
    };

    const groups = getCustomizationConfig(irontech({ groups: [imported] })).groups;

    expect(groups.find((group) => group.id === "weight-reduction")?.options.map((option) => option.id)).toEqual(["soft-butt"]);
  });

  it("does not rewrite another brand's product-specific lightweight option", () => {
    const imported: CustomizationGroup = {
      id: "body-weight",
      label: "Body Weight",
      display: "cards",
      options: [
        { id: "regular", label: "Regular Version", priceDelta: 0 },
        { id: "brand-lightweight", label: "Brand Lightweight", priceDelta: 150 }
      ]
    };
    const product = irontech({ groups: [imported] });
    product.title = "Other Brand full body doll";
    product.handle = "other-brand-full-body-doll";
    product.vendor = "Other Brand";
    product.tags = ["other-brand"];
    product.extended.brand = "Other Brand";

    expect(getCustomizationConfig(product).groups.find((group) => group.id === "body-weight")?.options).toEqual(imported.options);
  });

  it.each(["TPE", "Silicone head", "Hybrid"])("does not offer ULW for %s bodies even with eligibility metadata", (material) => {
    expect(bodyWeightGroups(irontech({ material, verified: true }))).toHaveLength(0);
  });

  it.each(["Torso", "Hips"])("does not offer ULW for %s products even with eligibility metadata", (productType) => {
    expect(bodyWeightGroups(irontech({ productType, verified: true }))).toHaveLength(0);
  });

  it("does not offer ULW for ready-to-ship products even with eligibility metadata", () => {
    expect(bodyWeightGroups(irontech({ stockStatus: "ready_to_ship", verified: true }))).toHaveLength(0);
  });

  it("propagates the canonical ULW label and $195 charge into cart resolution", () => {
    const config = getCustomizationConfig(irontech({ verified: true }));
    const resolved = resolveCustomization(
      config,
      { ...getDefaultSelections(config), "body-weight": "ultra-lightweight" },
      2000
    );

    expect(resolved.optionPriceDelta).toBe(195);
    expect(resolved.totalPrice).toBe(2195);
    expect(resolved.cartAttributes).toContainEqual({
      key: "DollWow Body weight technology",
      value: "Ultra Light Weight (ULW) (+$195)"
    });
  });
});
