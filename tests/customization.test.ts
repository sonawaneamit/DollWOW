import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, getOptionConflict, resolveCustomization } from "@/lib/customization/resolve";
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
});
