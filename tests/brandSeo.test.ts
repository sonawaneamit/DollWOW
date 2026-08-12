import { describe, expect, it } from "vitest";
import { brandSeoProfile, buildBrandMetadata } from "@/lib/catalog/brandSeo";
import { catalogBrands } from "@/lib/catalog/brands";

describe("Angelkiss brand SEO", () => {
  const brand = catalogBrands.find((candidate) => candidate.value === "angelkiss")!;

  it("owns both Angelkiss spellings without targeting unrelated angelic-doll intent", () => {
    const profile = brandSeoProfile(brand);
    const metadata = buildBrandMetadata(brand);
    const copy = `${profile.intro} ${profile.positioning} ${profile.buyerNotes.map((item) => `${item.title} ${item.body}`).join(" ")} ${profile.faqs
      .map((item) => `${item.question} ${item.answer}`)
      .join(" ")}`;

    expect(metadata.title).toContain("Angelkiss Dolls");
    expect(metadata.description).toContain("Angel Kiss dolls");
    expect(profile.faqs).toHaveLength(6);
    expect(profile.comparisonRows).toHaveLength(3);
    expect(copy).toContain("silicone head does not automatically mean a full-silicone body");
    expect(copy).toContain("Most approved requests can be added within 4 to 6 hours");
    expect(copy).not.toMatch(/angelic doll|PDP|SERP|crawlable|keyword cluster/i);
  });
});
