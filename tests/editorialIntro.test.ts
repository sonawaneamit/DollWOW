import { describe, expect, it } from "vitest";
import { hasEditorialIntro } from "@/lib/catalog/editorialIntro";

describe("hasEditorialIntro", () => {
  it("requires non-empty eyebrow, heading, and paragraph", () => {
    expect(hasEditorialIntro(undefined)).toBe(false);
    expect(hasEditorialIntro({ eyebrow: "", heading: "H", paragraph: "P" })).toBe(false);
    expect(hasEditorialIntro({ eyebrow: "E", heading: "H", paragraph: "P" })).toBe(true);
  });
});
