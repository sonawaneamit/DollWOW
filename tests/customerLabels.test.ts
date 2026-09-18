import { describe, expect, it } from "vitest";
import { normalizeCustomerFacingCustomizationConfig, normalizeCustomerFacingLabel } from "@/lib/customization/customer-labels";
import { getCustomizationConfig } from "@/lib/customization/configs";
import type { BrandCustomizationConfig, CustomizationGroup } from "@/types/customization";
import type { Product } from "@/types/product";

const sourceGroups: CustomizationGroup[] = [
  {
    id: "selec-ttattoo",
    label: "Selec Ttattoo",
    display: "cards",
    options: [
      { id: "no-thanks", label: "No thanks", priceDelta: 0 },
      { id: "small", label: "Small tattoo", priceDelta: 45, productionNote: "May add production time." }
    ]
  },
  {
    id: "selec-tattoo-position",
    label: "Selec Tattoo Position",
    display: "cards",
    options: [
      { id: "lower-belly", label: "Lower belly", priceDelta: 0 },
      { id: "upper-arm", label: "Upper arm", priceDelta: 0 }
    ]
  }
];

function product(groups: CustomizationGroup[]): Product {
  return {
    id: "gid://shopify/Product/customer-label-test",
    handle: "custom-label-test",
    title: "Custom Label Test Doll",
    description: "",
    vendor: "Test Factory",
    productType: "Custom Doll",
    tags: [],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "2000", currencyCode: "USD" },
      maxVariantPrice: { amount: "2000", currencyCode: "USD" }
    },
    extended: { customizationGroups: groups }
  };
}

describe("customer-facing customization labels", () => {
  it("corrects only allowlisted factory labels", () => {
    expect(normalizeCustomerFacingLabel("Selec Tattoo")).toBe("Tattoo");
    expect(normalizeCustomerFacingLabel("Selec Ttattoo Position")).toBe("Tattoo position");
    expect(normalizeCustomerFacingLabel("ULTRA Light Weight (ULW)")).toBe("ULTRA Light Weight (ULW)");
  });

  it("preserves raw labels and all non-label customization data", () => {
    const raw: BrandCustomizationConfig = {
      id: "source-config",
      brandLabel: "Test Factory",
      leadTimeNote: "Source timing.",
      groups: sourceGroups,
      rules: [{ id: "rule", type: "incompatible", when: { groupId: "selec-ttattoo", optionId: "small" }, conflictsWith: { groupId: "other", optionId: "x" }, message: "Source rule." }]
    };

    const normalized = normalizeCustomerFacingCustomizationConfig(raw);

    expect(normalized).not.toBe(raw);
    expect(normalized.groups.map((group) => group.id)).toEqual(raw.groups.map((group) => group.id));
    expect(normalized.groups.map((group) => group.label)).toEqual(["Tattoo", "Tattoo position"]);
    expect(normalized.groups.map((group) => group.sourceLabel)).toEqual(["Selec Ttattoo", "Selec Tattoo Position"]);
    expect(normalized.groups[0].options).toEqual(raw.groups[0].options);
    expect(normalized.rules).toBe(raw.rules);
  });

  it("normalizes imported labels at the customer config boundary without mutating source groups", () => {
    const config = getCustomizationConfig(product(sourceGroups));

    expect(config.groups.map((group) => group.label)).toEqual(["Tattoo", "Tattoo position"]);
    expect(config.groups.map((group) => group.sourceLabel)).toEqual(["Selec Ttattoo", "Selec Tattoo Position"]);
    expect(sourceGroups.map((group) => group.label)).toEqual(["Selec Ttattoo", "Selec Tattoo Position"]);
    expect(config.groups[0].options.find((option) => option.id === "small")?.priceDelta).toBe(45);
  });
});
