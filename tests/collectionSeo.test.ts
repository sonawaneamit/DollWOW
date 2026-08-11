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
