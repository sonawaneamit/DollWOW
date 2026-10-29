import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { CHIKU_ID, CHIKU_EYE_IMAGES, applyChikuPreview, chikuCustomizationGroups, isChikuEyeImage } from "@/lib/customization/chiku-preview";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { templateConfigSignature } from "@/lib/customization/template-config-signature";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import type { Product } from "@/types/product";

const product: Product = { ...sampleProducts[4], id: CHIKU_ID, handle: "dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll", vendor: "Dolls Castle", tags: [], extended: { brand: "Dolls Castle", customizationGroups: [
  { id: "body-functions", label: "Body functions", display: "cards", selectionMode: "multiple", options: [
    { id: "none", label: "No added functions", priceDelta: 0 },
    { id: "body-heating", label: "Body heating", priceDelta: 90 },
    { id: "vaginal-suction", label: "Vaginal suction", priceDelta: 75 }
  ] }
] } };
const hashes = {
  blue: "29bafc989aa6c7bce48717e8d8d9f488a35f7a12797d9a4a22efb1fe61f3a118",
  purple: "c592ed1e943ccb1374f260705bd717fe6e779529264600c3b7414ca66a83310e",
  amber: "143f11e932a06e44293ae31cc9ae3f16d490a734343dea7a9e6cab4e6763fa8c",
  green: "4b775c1b8e43350b0da38540386aec3ee48862452bba50d8240c69b1bf6f2587"
};

describe("exact Chiku supplier eye crops, private preview only", () => {
  it.each(Object.entries(CHIKU_EYE_IMAGES))("retains the exact received %s bytes", (id, path) => {
    const bytes = readFileSync(`public${path}`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(hashes[id as keyof typeof hashes]);
  });
  it("does not change production eyes or other product identities", () => {
    expect(chikuCustomizationGroups(product, [])[0].options.every(option => !option.swatch)).toBe(true);
    expect(applyChikuPreview(product, false)).toBe(product);
    const other = { ...product, id: "other" };
    expect(applyChikuPreview(other, true)).toBe(other);
  });
  it("keeps purple first, all four free identities, menu signatures and prices unchanged", () => {
    const before = JSON.stringify(product);
    const live = getCustomizationConfig(product);
    const preview = getCustomizationConfig(applyChikuPreview(product, true));
    const eyes = preview.groups.find(group => group.id === "eye-color")!;
    expect(eyes.options.map(option => option.id)).toEqual(["purple", "blue", "amber", "green"]);
    expect(eyes.options.every(isChikuEyeImage)).toBe(true);
    expect(templateConfigSignature(preview)).toBe(templateConfigSignature(live));
    for (const eye of eyes.options) {
      const selections = { ...getDefaultSelections(live), "eye-color": eye.id, "body-functions": ["body-heating", "vaginal-suction"] };
      expect(resolveCustomization(preview, selections, 1999)).toEqual(resolveCustomization(live, selections, 1999));
      expect(resolveCustomization(preview, selections, 1999).totalPrice).toBe(2164);
    }
    expect(JSON.stringify(product)).toBe(before);
  });
  it("does not apply the wide contained layout to unrelated image options", () => {
    expect(isChikuEyeImage({ id: "other", label: "Other", swatch: { kind: "image", value: CHIKU_EYE_IMAGES.blue } })).toBe(false);
    expect(isChikuEyeImage({ id: "blue", label: "Blue", swatch: { kind: "image", value: "/images/other.png" } })).toBe(false);
  });
});
