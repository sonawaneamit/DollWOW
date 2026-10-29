import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { applyChikuPreview, CHIKU_ID, includedBuildItems, isChikuPreview } from "@/lib/customization/chiku-preview";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import type { Product } from "@/types/product";

const chiku: Product = {
  ...sampleProducts[4], id: CHIKU_ID,
  handle: "dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll",
  title: "Dolls Castle Chiku SZ25 160cm Q-Cup Silicone Character Doll", vendor: "Dolls Castle", tags: [],
  extended: { brand: "Dolls Castle", material: "silicone", customizationGroups: [
    { id: "included-teeth-tongue", label: "Included: Fixed teeth and tongue", required: true, display: "cards", options: [{ id: "teeth-tongue", label: "Fixed teeth and tongue", priceDelta: 0, priceVerified: true }] },
    { id: "body-functions", label: "Body functions", display: "cards", selectionMode: "multiple", options: [
      { id: "none", label: "No added functions", priceDelta: 0 },
      { id: "body-heating", label: "Body heating", priceDelta: 90 },
      { id: "vaginal-suction", label: "Vaginal suction", priceDelta: 75 }
    ] }
  ] }
};

describe("Chiku private pilot", () => {
  it("does nothing without explicit preview activation or for another identity", () => {
    expect(applyChikuPreview(chiku, false)).toBe(chiku);
    const other = { ...chiku, id: "another-product" };
    expect(applyChikuPreview(other, true)).toBe(other);
    expect(includedBuildItems(chiku)).toEqual([]);
  });
  it("preserves original data and prices and adds exactly four free eyes", () => {
    const before = JSON.stringify(chiku);
    const result = applyChikuPreview(chiku, true);
    expect(isChikuPreview(result)).toBe(true);
    expect(JSON.stringify(chiku)).toBe(before);
    expect(result.variants).toBe(chiku.variants);
    const config = getCustomizationConfig(result);
    const eyes = config.groups.find((g) => g.id === "eye-color")!;
    expect(eyes.options.map((o) => o.id)).toEqual(["purple", "blue", "amber", "green"]);
    for (const option of eyes.options) {
      const resolved = resolveCustomization(config, { ...getDefaultSelections(config), "eye-color": option.id, "body-functions": ["body-heating", "vaginal-suction"] }, 1999);
      expect(resolved.totalPrice).toBe(2164);
      expect(resolved.issues).toEqual([]);
      expect(resolved.cartAttributes.some((a) => a.value.includes(option.label))).toBe(true);
    }
    expect(config.groups.some((g) => /soft.belly|soft.thigh|jaw/i.test(g.label))).toBe(false);
  });
  it("shows only explicit verified zero-price required single facts", () => {
    const product = applyChikuPreview(chiku, true);
    expect(includedBuildItems(product)).toEqual([{ id: "included-teeth-tongue", label: "Fixed teeth and tongue" }]);
    for (const patch of [{ priceDelta: undefined }, { priceDelta: 90 }, { priceVerified: false }, { displayable: false }, { factoryExists: false }]) {
      const bad = structuredClone(product);
      Object.assign(bad.extended.customizationGroups![0].options[0], patch);
      expect(includedBuildItems(bad)).toEqual([]);
    }
  });
});
