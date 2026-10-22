import { describe, expect, it } from "vitest";
import { collectionPresets } from "@/lib/catalog/filters";
import { buildCollectionMetadata, collectionFaqItems, collectionIntro } from "@/lib/catalog/collectionSeo";

describe("height and tone collection accuracy", () => {
  it("qualifies tone without changing appearance membership", () => {
    const handle = "fair-skin-dolls", preset = collectionPresets[handle];
    expect(preset.filters).toEqual({ look: "skin-fair" });
    expect(collectionIntro(preset, handle)).toContain("does not identify ethnicity");
    expect(collectionFaqItems(handle, preset).map(item => item.answer).join(" ")).toContain("different materials and product forms");
  });

  it("describes the exact inclusive band without imposing full-body membership", () => {
    const handle = "height-160-164", preset = collectionPresets[handle];
    expect(preset.filters).toEqual({ height: "160-164" });
    expect(collectionIntro(preset, handle)).toContain("160 to 164 cm inclusive");
    expect(collectionIntro(preset, handle)).toContain("not a guarantee that every result is a complete doll");
    expect(collectionFaqItems(handle, preset).find(item => item.question.includes("164.5"))?.answer).toMatch(/^No\./);
  });

  it("separates broad listed height from petite and mini complete dolls", () => {
    const handle = "height-under-155", preset = collectionPresets[handle];
    expect(preset.filters).toEqual({ height: "0-154" });
    expect(collectionIntro(preset, handle)).toContain("torsos and hips products");
    const copy = collectionFaqItems(handle, preset).map(item => item.answer).join(" ");
    expect(copy).toContain("complete dolls from 121 to 154 cm");
    expect(copy).toContain("not a continuous less-than-155 rule");
    expect(copy).toContain("unknown weight is not a lightweight claim");
  });

  it("keeps unique titles and source-backed FAQs free of new service promises", () => {
    const handles = ["fair-skin-dolls", "height-160-164", "height-under-155"];
    const titles = handles.map(handle => buildCollectionMetadata(handle, collectionPresets[handle]).title);
    expect(new Set(titles).size).toBe(handles.length);
    for (const handle of handles) {
      const preset = collectionPresets[handle];
      expect(collectionFaqItems(handle, preset).length).toBeGreaterThanOrEqual(4);
      expect(JSON.stringify([collectionIntro(preset, handle), collectionFaqItems(handle, preset)])).not.toMatch(/4 to 6|guaranteed|free preview/i);
    }
  });
});
