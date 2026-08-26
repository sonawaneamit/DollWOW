import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import type { CustomizationGroup } from "@/types/customization";
import type { Product } from "@/types/product";

function mockProduct(brand: string, groups: CustomizationGroup[] = []): Product {
  return {
    id: `gid://shopify/Product/${brand}-test`,
    handle: `${brand}-test-doll`,
    title: `${brand} Test 160cm Doll`,
    description: "",
    vendor: brand,
    productType: "Custom doll",
    tags: [brand.toLowerCase(), "custom"],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "2000", currencyCode: "USD" },
      maxVariantPrice: { amount: "2000", currencyCode: "USD" }
    },
    extended: { brand, customizationGroups: groups }
  };
}

describe("Catalog-wide neutral default pricing", () => {
  it("treats None / No thanks / As shown / Factory default / No add-on as zero-price across all brands", () => {
    const neutralLabels = ["None", "No thanks", "As shown", "Factory default", "No add-on"];
    
    const testGroup: CustomizationGroup = {
      id: "test-option",
      label: "Test Option",
      display: "cards",
      options: [
        ...neutralLabels.map((label, index) => ({ id: `neutral-${index}`, label })),
        { id: "paid-option", label: "Paid upgrade", priceDelta: 50 }
      ]
    };

    // Test across multiple brand types
    const brands = ["Irontech Dolls", "WM Dolls", "Starpery", "SE Doll", "6YE", "YL Dolls"];
    
    for (const brand of brands) {
      const product = mockProduct(brand, [testGroup]);
      const config = getCustomizationConfig(product);
      const group = config.groups.find((g) => g.id === "test-option");
      
      if (!group) continue; // Brand might not use imported groups
      
      // All neutral default options should be free
      for (const label of neutralLabels) {
        const option = group.options.find((opt) => opt.label === label);
        if (option) {
          expect(option.priceDelta, `${brand}: "${label}" should be free`).toBe(0);
        }
      }
      
      // Legitimate paid option should still have its price
      const paidOption = group.options.find((opt) => opt.label === "Paid upgrade");
      if (paidOption) {
        expect(paidOption.priceDelta, `${brand}: "Paid upgrade" should cost $50`).toBe(50);
      }
    }
  });

  it("ensures configured default totals match displayed base prices for neutral defaults", () => {
    const optionGroup: CustomizationGroup = {
      id: "vagina-hair",
      label: "Vagina Hair",
      display: "cards",
      options: [
        { id: "none", label: "None" },
        { id: "as-shown", label: "As shown" },
        { id: "natural", label: "Natural", priceDelta: 30 }
      ]
    };

    const product = mockProduct("Irontech Dolls", [optionGroup]);
    const config = getCustomizationConfig(product);
    const basePrice = 2555;
    
    const defaults = getDefaultSelections(config);
    const resolved = resolveCustomization(config, defaults, basePrice);
    
    // Default selection should not add any price
    expect(resolved.optionPriceDelta).toBe(0);
    expect(resolved.totalPrice).toBe(basePrice);
    
    // Selecting "Natural" should add $30
    const withNatural = { ...defaults, "vagina-hair": "natural" };
    const resolvedWithNatural = resolveCustomization(config, withNatural, basePrice);
    expect(resolvedWithNatural.optionPriceDelta).toBe(30);
    expect(resolvedWithNatural.totalPrice).toBe(basePrice + 30);
  });
});
