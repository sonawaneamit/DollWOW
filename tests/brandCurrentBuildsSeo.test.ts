import { describe, expect, it } from "vitest";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { brandSeoProfile, brandRelatedLinks } from "@/lib/catalog/brandSeo";

describe("current-build brand guidance", () => {
  it("separates HR body and head materials without uniform-build promises", () => {
    const profile = brandSeoProfile(getCatalogBrand("hr-dolls")!);
    expect(profile.intro).toContain("A silicone head does not by itself establish a full-silicone body");
    expect(profile.faqs.find(item => item.question.includes("weight is missing"))?.answer).toContain("not a lightweight claim");
    expect(profile.comparisonRows?.length).toBe(3);
  });

  it("compares Jarliet proportions rather than equating height with construction", () => {
    const profile = brandSeoProfile(getCatalogBrand("jarliet-dolls")!);
    expect(profile.intro).toContain("bust, waist and hip proportions");
    expect(profile.faqs.find(item => item.question.includes("silicone-head"))?.answer).toMatch(/^No\./);
    expect(profile.comparisonRows?.length).toBe(3);
  });
  it("does not infer Ai-Tech hardware from its brand name", () => {
    const profile = brandSeoProfile(getCatalogBrand("ai-tech-dolls")!);
    expect(profile.intro).toContain("brand name alone does not establish");
    expect(profile.faqs.find(item => item.question.includes("interactive features"))?.answer).toContain("Do not assume so");
  });

  it("does not turn missing Avant weights into lightweight claims", () => {
    const profile = brandSeoProfile(getCatalogBrand("avant-dolls")!);
    expect(profile.intro).toContain("Where a usable weight is not listed");
    expect(profile.faqs.find(item => item.question.includes("missing weight"))?.answer).toMatch(/^No\./);
  });

  it("distinguishes FunWest product forms and materials", () => {
    const profile = brandSeoProfile(getCatalogBrand("funwest-dolls")!);
    expect(profile.intro).toContain("complete dolls and torso products");
    expect(profile.intro).toContain("TPE and silicone");
    expect(profile.faqs.map(item => item.answer).join(" ")).toContain("fixed warehouse build");
  });

  it("keeps current destinations without new sourcing or timing promises", () => {
    for (const handle of ["ai-tech-dolls", "avant-dolls", "funwest-dolls"]) {
      const brand = getCatalogBrand(handle)!, profile = brandSeoProfile(brand);
      expect(profile.faqs.length).toBe(5);
      expect(profile.comparisonRows?.length).toBe(3);
      expect(brandRelatedLinks(brand).map(link => link.href)).toEqual(["/shop/sex-dolls", "/learn/sex-doll-cost", "/learn/tpe-vs-silicone-sex-dolls", "/learn/ready-to-ship-vs-custom-sex-dolls", "/price-match"]);
      expect(JSON.stringify(profile)).not.toMatch(/4 to 6|free preview|guaranteed/i);
    }
  });
});
