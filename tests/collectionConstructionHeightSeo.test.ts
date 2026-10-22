import { describe, expect, it } from "vitest";
import { collectionPresets } from "@/lib/catalog/filters";
import { buildCollectionMetadata, collectionFaqItems, collectionIntro } from "@/lib/catalog/collectionSeo";

describe("remaining construction, height and styling collection copy", () => {
  it("preserves 170+ native bounds without promising full-body standing heights", () => {
    const handle = "height-170-plus", preset = collectionPresets[handle];
    expect(preset.filters).toEqual({ height: "170-999" });
    expect(collectionIntro(preset, handle)).toContain("170 cm or more");
    expect(collectionIntro(preset, handle)).toContain("partial-body product");
    expect(collectionFaqItems(handle, preset).map(item => item.answer).join(" ")).toContain("permanent catalog maximum");
  });

  it("requires exact head and body materials without changing hybrid membership", () => {
    const handle = "hybrid", preset = collectionPresets[handle];
    expect(preset.filters).toEqual({ material: "hybrid" });
    expect(collectionIntro(preset, handle)).toContain("does not verify every component's material");
    const faqs = collectionFaqItems(handle, preset);
    expect(faqs.find(item => item.question.includes("TPE body"))?.answer).toMatch(/^Do not assume/);
    expect(faqs.map(item => item.answer).join(" ")).toContain("Missing weight is not a lightness claim");
  });

  it("keeps the existing styling category separate from ancestry and build", () => {
    const handle = "latina-dolls", preset = collectionPresets[handle];
    expect(preset.filters).toEqual({ look: "look-latina" });
    expect(collectionIntro(preset, handle)).toContain("not verified nationality, ancestry");
    expect(collectionFaqItems(handle, preset).map(item => item.answer).join(" ")).toContain("different product forms and material labels");
  });

  it("uses unique metadata and visible factual FAQs without service or ranking promises", () => {
    const handles = ["height-170-plus", "hybrid", "latina-dolls"];
    expect(new Set(handles.map(handle => buildCollectionMetadata(handle, collectionPresets[handle]).title)).size).toBe(3);
    for (const handle of handles) {
      const preset = collectionPresets[handle];
      expect(String(buildCollectionMetadata(handle, preset).description).length).toBeLessThanOrEqual(155);
      expect(collectionFaqItems(handle, preset).length).toBeGreaterThanOrEqual(4);
      expect(JSON.stringify([collectionIntro(preset, handle), collectionFaqItems(handle, preset)])).not.toMatch(/4 to 6|guaranteed|free preview|best of both/i);
    }
  });
});
