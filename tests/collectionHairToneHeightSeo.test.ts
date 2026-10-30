import { describe, expect, it } from "vitest";
import { collectionPresets } from "@/lib/catalog/filters";
import { buildCollectionMetadata, collectionFaqItems, collectionIntro } from "@/lib/catalog/collectionSeo";

describe("hair, brown tone and remaining middle height bands", () => {
  it("keeps hair presentation separate from included construction", () => {
    const preset = collectionPresets["black-hair-dolls"];
    expect(preset.filters).toEqual({ look: "hair-black" });
    expect(collectionIntro(preset, "black-hair-dolls")).toContain("does not establish an included wig");
    expect(collectionFaqItems("black-hair-dolls", preset).map(item => item.answer).join(" ")).toContain("different product forms");
  });

  it("qualifies brown shade rather than assigning ethnicity or material", () => {
    const preset = collectionPresets["brown-skin-dolls"];
    expect(preset.filters).toEqual({ look: "skin-brown" });
    expect(collectionIntro(preset, "brown-skin-dolls")).toContain("does not identify ethnicity");
    expect(collectionFaqItems("brown-skin-dolls", preset).map(item => item.answer).join(" ")).toContain("different materials and product forms");
  });

  it.each(["155-159", "165-169"])("preserves the exact native %s height band and form limits", band => {
    const handle = `height-${band}`, preset = collectionPresets[handle];
    expect(preset.filters).toEqual({ height: band });
    const [min, max] = band.split("-");
    const intro = collectionIntro(preset, handle);
    expect(intro).toContain(`${min} to ${max} cm inclusive`);
    expect(intro).toContain("partial-body products");
    const copy = collectionFaqItems(handle, preset).map(item => item.answer).join(" ");
    expect(copy).toContain(`${min} through ${max} cm inclusive`);
    expect(copy).toMatch(/unknown weight|Missing weight/);
  });

  it("uses distinct metadata and supported FAQs without new service promises", () => {
    const handles = ["black-hair-dolls", "brown-skin-dolls", "height-155-159", "height-165-169"];
    expect(new Set(handles.map(handle => buildCollectionMetadata(handle, collectionPresets[handle]).title)).size).toBe(4);
    for (const handle of handles) {
      const preset = collectionPresets[handle];
      const metadata = buildCollectionMetadata(handle, preset);
      expect(String(metadata.description).length).toBeLessThanOrEqual(155);
      expect(collectionFaqItems(handle, preset).length).toBeGreaterThanOrEqual(4);
      expect(JSON.stringify([collectionIntro(preset, handle), collectionFaqItems(handle, preset)])).not.toMatch(/4 to 6|guaranteed|free preview/i);
    }
  });
});
