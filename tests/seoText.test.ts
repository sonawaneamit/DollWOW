import { describe, expect, it } from "vitest";
import { brandedSeoTitle, unbrandedSeoTitle, conciseSeoDescription } from "@/lib/catalog/seoText.mjs";

describe("shared import and storefront SEO text", () => {
  it("leaves Next's title template only one suffix to add", () => {
    expect(unbrandedSeoTitle("Lexi | DollWow | DOLLWOW!")).toBe("Lexi");
    expect(brandedSeoTitle("Lexi | DollWow")).toBe("Lexi | DollWow");
    expect(unbrandedSeoTitle("Vera | Real Lady")).toBe("Vera | Real Lady");
  });
  it("drops incomplete imported tails without cutting decimals", () => {
    expect(conciseSeoDescription("Lili weighs 93.7 lb. Compare the available photos and"))
      .toBe("Lili weighs 93.7 lb.");
  });
  it("does not cut a long first sentence in half", () => {
    const sentence = `Compare ${"verified measurements and ".repeat(8)}photos.`;
    expect(conciseSeoDescription(sentence)).toBe(sentence);
  });
  it("uses a factual fallback when a long fragment has no whole sentence", () => {
    expect(conciseSeoDescription("unfinished ".repeat(20), "Compare Lili's photos."))
      .toBe("Compare Lili's photos.");
    expect(conciseSeoDescription("A short authored description")).toBe("A short authored description");
  });
});
