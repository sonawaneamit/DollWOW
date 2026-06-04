import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, getOptionConflict, nextMultipleSelection, resolveCustomization } from "@/lib/customization/resolve";
import type { BrandCustomizationConfig } from "@/types/customization";
import { sampleProducts } from "@/lib/data/sample-products";

describe("customization config", () => {
  it("loads Zelex rules for Zelex products", () => {
    const config = getCustomizationConfig(sampleProducts[0]);

    expect(config.id).toBe("zelex");
    expect(config.groups.some((group) => group.id === "head-function")).toBe(true);
    expect(config.rules.length).toBeGreaterThan(0);
  });

  it("detects electronic head and implanted hair conflicts", () => {
    const config = getCustomizationConfig(sampleProducts[0]);
    const selections = {
      ...getDefaultSelections(config),
      "hair-finish": "implanted",
      "head-function": "eye-movement"
    };
    const resolved = resolveCustomization(config, selections, 2000);

    expect(resolved.issues.map((issue) => issue.message).join(" ")).toContain("wiring");
  });

  it("reports conflicts before a disabled option is selected", () => {
    const config = getCustomizationConfig(sampleProducts[0]);
    const selections = {
      ...getDefaultSelections(config),
      "hair-finish": "implanted"
    };

    expect(getOptionConflict(config, selections, "head-function", "oral-function")).toContain("Implanted hair");
  });

  it("calculates option price deltas and cart attributes", () => {
    const config = getCustomizationConfig(sampleProducts[4]);
    const resolved = resolveCustomization(
      config,
      {
        ...getDefaultSelections(config),
        "skin-tone": "tan",
        "body-upgrade": "body-heating",
        "care-addons": "care-kit"
      },
      1599
    );

    expect(resolved.issues).toHaveLength(0);
    expect(resolved.optionPriceDelta).toBe(274);
    expect(resolved.totalPrice).toBe(1873);
    expect(resolved.cartAttributes.some((attribute) => attribute.key === "DollWow Skin tone")).toBe(true);
  });

  it("supports multi-select add-on groups with no-add-on exclusivity", () => {
    const config: BrandCustomizationConfig = {
      id: "wm-imported-test",
      brandLabel: "WM Dolls",
      leadTimeNote: "Imported add-ons are verified before fulfillment.",
      rules: [],
      groups: [
        {
          id: "accessories",
          label: "Accessories",
          description: "Optional accessories.",
          display: "cards",
          selectionMode: "multiple",
          options: [
            { id: "no-add-on", label: "No add-on" },
            { id: "care-kit", label: "Care Kit", priceDelta: 99 },
            { id: "head-stand", label: "Head Stand", priceDelta: 50 }
          ]
        }
      ]
    };

    const defaults = getDefaultSelections(config);
    const withCareKit = nextMultipleSelection("no-add-on", defaults.accessories, "care-kit");
    const withTwoAddOns = nextMultipleSelection("no-add-on", withCareKit, "head-stand");
    const resolved = resolveCustomization(config, { accessories: withTwoAddOns }, 1666);

    expect(withTwoAddOns).toEqual(["care-kit", "head-stand"]);
    expect(resolved.optionPriceDelta).toBe(149);
    expect(resolved.cartAttributes.find((attribute) => attribute.key === "DollWow Accessories")?.value).toBe("Care Kit (+$99), Head Stand (+$50)");
  });
});
