import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { generateMetadata as generateCompareMetadata } from "@/app/compare/page";
import { getLearningArticle } from "@/lib/learn/content";
import { productLockedPdpTitle, productPublicTitle } from "@/lib/catalog/naming";
import { buildPdpMetadata } from "@/lib/catalog/pdpSeo";
import { sampleProducts } from "@/lib/data/sample-products";

describe("GSC P0 locked copy", () => {
  it("ships the locked guide H1s and descriptions", () => {
    const buyingGuide = getLearningArticle("sex-doll-guide");
    expect(buyingGuide).toMatchObject({
      title: "Sex Doll Buying Guide: Size, Weight, Material, and Cost",
      description: "Compare sex doll size, weight, TPE vs silicone, and discreet shipping to the US, UK, Canada, Australia, and EU before choosing."
    });

    const heatingGuide = getLearningArticle("body-heating-sex-doll-guide");
    expect(heatingGuide).toMatchObject({
      title: "Sex Doll Body Heating: Zones, Power, and Safety | DollWow",
      description: "Compare sex doll heating zones, power and plug requirements by country (US/UK/CA/AU/EU), compatibility, controls, and safety."
    });
  });

  it.each([
    ["thia", "110", "J", "ex5hm", "Thia"],
    ["hailey", "106", "F", "jwi54", "Hailey"],
    ["hazel", "106", "F", "c3k5y", "Hazel"]
  ])("locks the %s custom and regional RTS H1s", (slugName, height, cup, suffix, displayName) => {
    const baseHandle = `erovenus-${slugName}-${height}cm-${cup.toLowerCase()}-cup-silicone-companion-doll-${suffix}`;
    const expected = `Erovenus ${displayName} ${height}cm ${cup}-Cup Silicone Companion Doll`;

    for (const handle of [baseHandle, ...["au", "ca", "eu", "us"].map((region) => `${baseHandle}-rts-${region}`)]) {
      const product = {
        ...sampleProducts[0],
        handle,
        vendor: "Erovenus",
        productType: "Silicone companion doll",
        extended: {
          ...sampleProducts[0].extended,
          brand: "Erovenus",
          displayName,
          heightCm: Number(height),
          cupSize: cup,
          material: "Silicone"
        }
      };

      expect(productLockedPdpTitle(product)).toBe(expected);
      const metadata = buildPdpMetadata(product);
      expect(metadata.title).toBe(productPublicTitle(product));
      expect(metadata.description).toBe(`${expected}. Compare specs and availability with discreet US/UK/CA/AU/EU shipping.`);
    }
  });

  it("does not apply the Erovenus lock to another product", () => {
    expect(productLockedPdpTitle(sampleProducts[0])).toBeNull();
  });
});

describe("GSC P0 indexing rules", () => {
  it("redirects only the three legacy learning URLs to their live owners", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/learn/sex-doll-storage-1", destination: "/learn/sex-doll-storage", permanent: true },
        { source: "/learn/most-realistic-sex-dolls-1", destination: "/learn/most-realistic-sex-dolls", permanent: true },
        { source: "/learn/sex-doll-body-heating", destination: "/learn/body-heating-sex-doll-guide", permanent: true }
      ])
    );
  });

  it("keeps the apex compare page canonical and noindexes product query URLs", async () => {
    const apex = await generateCompareMetadata({ searchParams: Promise.resolve({}) });
    expect(apex.alternates).toEqual({ canonical: "/compare" });
    expect(apex.robots).toEqual({ index: true, follow: true });

    const productQuery = await generateCompareMetadata({ searchParams: Promise.resolve({ product: "one,two" }) });
    expect(productQuery.alternates).toEqual({ canonical: "/compare" });
    expect(productQuery.robots).toEqual({ index: false, follow: true });
  });
});
