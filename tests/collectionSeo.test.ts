import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { collectionFaqItems, collectionIntro } from "@/lib/catalog/collectionSeo";
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
