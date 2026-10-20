import { describe, expect, it } from "vitest";
import { brandSeoProfile, buildBrandMetadata, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { catalogBrands } from "@/lib/catalog/brands";
import { env } from "@/lib/utils/env";

describe("Lusandy brand hub", () => {
  const brand = catalogBrands.find((candidate) => candidate.value === "lusandy")!;

  it("uses a dedicated canonical and model-specific guidance without blanket claims", () => {
    const profile = brandSeoProfile(brand);
    const metadata = buildBrandMetadata(brand);
    expect(metadata.alternates?.canonical).toBe(`${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/brands/lusandy-dolls`);
    expect(metadata.title).toBe("Lusandy Dolls: Silicone Models, Sizes & Options");
    expect(profile.comparisonRows).toHaveLength(3);
    expect(profile.faqs).toHaveLength(4);
    expect(profile.intro).toContain("warehouse region");
    expect(JSON.stringify(profile)).not.toMatch(/authorized|medical.grade|hypoallergenic|\b30kg\b|2026-10-31/i);
    const schema = buildBrandStructuredData(brand, []);
    expect(schema.find((entry) => entry["@type"] === "CollectionPage")?.url).toBe(metadata.alternates?.canonical);
    expect(schema.find((entry) => entry["@type"] === "FAQPage")?.mainEntity).toEqual(profile.faqs.map((item) => ({
      "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer }
    })));
  });
});

describe("Moonvale catalog-grounded brand copy", () => {
  const brand = catalogBrands.find((candidate) => candidate.value === "moonvale")!;
  it("identifies the model families without invented weights or blanket inclusions", () => {
    const profile = brandSeoProfile(brand);
    expect(buildBrandMetadata(brand).alternates?.canonical).toContain("/brands/moonvale-dolls");
    for (const model of ["Lyora", "Sorelle", "Velara", "Cerina"]) expect(profile.intro).toContain(model);
    const copy = JSON.stringify(profile);
    expect(copy).toContain("Confirm handling weight");
    expect(copy).not.toMatch(/\d+(?:\.\d+)?\s*(kg|lb)|platinum|heat-resistant|hypoallergenic/);
    expect(copy).toContain("does not by itself confirm");
  });
  it("keeps visible FAQs and schema answers identical", () => {
    const profile = brandSeoProfile(brand);
    const schema = buildBrandStructuredData(brand, []).find((entry) => entry["@type"] === "FAQPage");
    expect(schema?.mainEntity).toEqual(profile.faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })));
  });
});

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

describe("Tier 1 brand SEO", () => {
  const cases = [
    ["wm", "WM Dolls: TPE & Silicone Sex Dolls"],
    ["irontech", "Irontech Dolls: Silicone, TPE & Hybrid"],
    ["starpery", "Starpery Dolls: Silicone Models & Options"],
    ["sedoll", "SE Doll: TPE & Silicone Sex Dolls"],
    ["tantaly", "Tantaly Dolls: Torso & Compact Models"],
    ["erovenus", "Erovenus Dolls: Silicone Torso Models"]
  ] as const;

  it.each(cases)("gives %s a disambiguated commercial title", (value, title) => {
    const brand = catalogBrands.find((candidate) => candidate.value === value)!;
    const profile = brandSeoProfile(brand);
    const metadata = buildBrandMetadata(brand);
    const copy = `${profile.intro} ${profile.comparisonRows?.flat().join(" ")} ${profile.buyerNotes.flatMap((item) => [item.title, item.body]).join(" ")} ${profile.faqs.flatMap((item) => [item.question, item.answer]).join(" ")}`;

    expect(metadata.title).toBe(title);
    expect(profile.comparisonRows).toHaveLength(3);
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster|editorial process/i);
  });
});
