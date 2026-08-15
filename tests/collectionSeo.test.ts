import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { buildCollectionMetadata, collectionFaqItems, collectionIntro } from "@/lib/catalog/collectionSeo";
import { collectionPresets } from "@/lib/catalog/filters";

describe("ready-to-ship collection SEO", () => {
  const preset = collectionPresets["ready-to-ship"];

  it("keeps in-stock and fast-shipping intent on one canonical collection", async () => {
    expect(preset.title).toBe("Ready-to-ship sex dolls");
    expect(preset.filters).toEqual({ availability: "ready_to_ship" });

    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/shop/in-stock-sex-dolls",
          destination: "/shop/ready-to-ship",
          permanent: true
        }),
        expect.objectContaining({
          source: "/shop/fast-shipping-sex-dolls",
          destination: "/shop/ready-to-ship",
          permanent: true
        })
      ])
    );
  });

  it("explains stock and timing without promising a universal delivery window", () => {
    const intro = collectionIntro(preset, "ready-to-ship");
    const faqs = collectionFaqItems("ready-to-ship", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(faqs).toHaveLength(6);
    expect(copy).toContain("not a guaranteed delivery date");
    expect(copy).toContain("warehouse region");
    expect(copy).not.toMatch(/\b\d+\s*(?:-|to)\s*\d+\s*(?:day|week)s?\b/i);
  });
});

describe("Wave 1 head collection SEO", () => {
  it("gives the broad commercial owner a descriptive title and proactive missing-product path", () => {
    const preset = collectionPresets["sex-dolls"];
    const metadata = buildCollectionMetadata("sex-dolls", preset);
    const intro = collectionIntro(preset, "sex-dolls");
    const faqs = collectionFaqItems("sex-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(metadata.title).toBe("Sex Dolls for Sale | TPE, Silicone & Custom Dolls");
    expect(intro).toContain("complete current DollWow sex doll catalog");
    expect(copy).toContain("live chat or hello@dollwow.com");
    expect(copy).toContain("4 to 6 hours");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });

  it("keeps full silicone distinct from silicone-head hybrids", () => {
    const preset = collectionPresets.silicone;
    const metadata = buildCollectionMetadata("silicone", preset);
    const intro = collectionIntro(preset, "silicone");
    const faqs = collectionFaqItems("silicone", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(metadata.title).toBe("Silicone Sex Dolls for Sale | Full Silicone Dolls");
    expect(intro).toContain("Every product in this collection has a full silicone body");
    expect(intro).toContain("hybrid build");
    expect(copy).toContain("live chat or hello@dollwow.com");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("Wave 2 collection SEO", () => {
  it("gives TPE and male collections descriptive commercial titles and qualified support copy", () => {
    const tpe = collectionPresets.tpe;
    const male = collectionPresets["male-dolls"];
    expect(buildCollectionMetadata("tpe", tpe).title).toBe("TPE Sex Dolls for Sale | Full-Body TPE Dolls");
    expect(buildCollectionMetadata("male-dolls", male).title).toBe("Male Sex Dolls for Sale | TPE, Silicone & Custom");
    expect(collectionFaqItems("tpe", tpe).map((item) => item.answer).join(" ")).toContain("Care 365");
    expect(collectionFaqItems("male-dolls", male).map((item) => item.answer).join(" ")).toContain("lifetime repair concierge");
  });

  it("keeps the mini boundary honest when no matching inventory is available", () => {
    const preset = collectionPresets["mini-sex-dolls"];
    const copy = `${collectionIntro(preset, "mini-sex-dolls")} ${collectionFaqItems("mini-sex-dolls", preset).map((item) => item.answer).join(" ")}`;
    expect(buildCollectionMetadata("mini-sex-dolls", preset).title).toBe("Mini Sex Dolls for Sale | Full Dolls Up to 120 cm");
    expect(copy).toContain("up to 120 cm / 3 ft 11 in");
    expect(copy).toContain("will not fill this collection");
    expect(copy).toContain("live chat or hello@dollwow.com");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("Wave 3 collection SEO", () => {
  it("aligns affordable intent with the live price boundary and ownership support", () => {
    const preset = collectionPresets["cheap-sex-dolls"];
    const metadata = buildCollectionMetadata("cheap-sex-dolls", preset);
    const copy = `${collectionIntro(preset, "cheap-sex-dolls")} ${collectionFaqItems("cheap-sex-dolls", preset).map((item) => item.answer).join(" ")}`;

    expect(metadata.title).toBe("Affordable Sex Dolls for Sale | Options Under $1,000");
    expect(copy).toContain("$1,000 or less");
    expect(copy).toContain("Care 365");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });

  it("adds decision support to realistic and custom pages without promising an exact preview", () => {
    const realistic = collectionPresets["realistic-sex-dolls"];
    const custom = collectionPresets.custom;
    const realisticCopy = collectionFaqItems("realistic-sex-dolls", realistic).map((item) => item.answer).join(" ");
    const customCopy = collectionFaqItems("custom", custom).map((item) => item.answer).join(" ");

    expect(buildCollectionMetadata("realistic-sex-dolls", realistic).title).toBe("Most Realistic Sex Dolls for Sale | Compare Realism");
    expect(buildCollectionMetadata("custom", custom).title).toBe("Custom Sex Dolls for Sale | Build & Compare Options");
    expect(realisticCopy).toContain("DollVue™");
    expect(customCopy).toContain("approximate visual preview");
    expect(`${realisticCopy} ${customCopy}`).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("anime collection SEO", () => {
  const preset = collectionPresets["anime-dolls"];

  it("uses one adult-only collection for anime, manga, cosplay, and fantasy styling", () => {
    const intro = collectionIntro(preset, "anime-dolls");
    const faqs = collectionFaqItems("anime-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(preset.title).toBe("Anime sex dolls");
    expect(preset.filters).toEqual({ look: "look-anime" });
    expect(faqs).toHaveLength(6);
    expect(copy).toContain("visual category for adults");
    expect(copy).toContain("ft/in and cm");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("futa collection SEO", () => {
  const preset = collectionPresets["futa-sex-dolls"];

  it("uses one respectful canonical collection backed by a verified product option", () => {
    const intro = collectionIntro(preset, "futa-sex-dolls");
    const faqs = collectionFaqItems("futa-sex-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(preset.title).toBe("Futa sex dolls by brand");
    expect(faqs).toHaveLength(6);
    expect(copy).toContain("Futa is short for futanari");
    expect(copy).toContain("does not currently list FutaDoll products");
    expect(copy).toContain("actual manufacturers named on each card");
    expect(copy).toContain("the standard build may not include it");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("new sex dolls collection SEO", () => {
  const preset = collectionPresets["new-sex-dolls"];

  it("owns new, newest, and latest arrival intent without overstating release facts", () => {
    const intro = collectionIntro(preset, "new-sex-dolls");
    const faqs = collectionFaqItems("new-sex-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(preset.title).toBe("New sex dolls and latest arrivals");
    expect(faqs).toHaveLength(6);
    expect(copy).toContain("available supplier release ordering");
    expect(copy).toContain("New does not automatically mean more realistic");
    expect(copy).toContain("4 to 6 hours");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("body-style collection SEO", () => {
  it("keeps fuller intent on one female collection with measurement-first guidance", () => {
    const preset = collectionPresets["fuller-dolls"];
    const intro = collectionIntro(preset, "fuller-dolls");
    const faqs = collectionFaqItems("fuller-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(preset).toEqual({
      title: "Fuller and curvy sex dolls",
      filters: { look: "shape-fuller", bodyType: "female" }
    });
    expect(faqs).toHaveLength(6);
    expect(copy).toContain("bust, waist, hips");
    expect(copy).toMatch(/not always/i);
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });

  it("keeps slim intent separate from lightweight claims", () => {
    const preset = collectionPresets["slim-dolls"];
    const intro = collectionIntro(preset, "slim-dolls");
    const faqs = collectionFaqItems("slim-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(preset).toEqual({
      title: "Slim sex dolls",
      filters: { look: "shape-slim", bodyType: "female" }
    });
    expect(faqs).toHaveLength(6);
    expect(copy).toContain("Slim does not mean short, lightweight");
    expect(copy).toContain("Body traits can overlap");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("Asian and Japanese-style collection SEO", () => {
  const preset = collectionPresets["asian-dolls"];

  it("consolidates overlapping style intent without assigning nationality", () => {
    const intro = collectionIntro(preset, "asian-dolls");
    const faqs = collectionFaqItems("asian-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(faqs).toHaveLength(6);
    expect(copy).toContain("Japanese-inspired styles");
    expect(copy).toContain("does not assign a nationality or manufacturing origin");
    expect(copy).toContain("4 to 6 hours");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});

describe("Black dolls collection SEO", () => {
  const preset = collectionPresets["black-dolls"];

  it("consolidates skin-tone synonyms without assigning identity", () => {
    const intro = collectionIntro(preset, "black-dolls");
    const faqs = collectionFaqItems("black-dolls", preset);
    const copy = `${intro} ${faqs.map((item) => `${item.question} ${item.answer}`).join(" ")}`;

    expect(faqs).toHaveLength(6);
    expect(copy).toContain("ebony as a search synonym");
    expect(copy).toContain("not an assigned ethnicity, nationality");
    expect(copy).toContain("4 to 6 hours");
    expect(copy).not.toMatch(/PDP|SERP|crawlable|keyword cluster/i);
  });
});
