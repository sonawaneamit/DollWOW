import { describe, expect, it } from "vitest";
import { buildPdpMetadata } from "@/lib/catalog/pdpSeo";
import { sampleProducts } from "@/lib/data/sample-products";
import { productPublicTitle } from "@/lib/catalog/naming";

describe("product metadata", () => {
  it("uses the concise public product name for the browser and search title", () => {
    const product = {
      ...sampleProducts[0],
      extended: {
        ...sampleProducts[0].extended,
        customAvailable: true,
        displayName: "Edith Irving",
        heightCm: 167,
        cupSize: "K",
        material: "silicone-head",
        headModel: "K419"
      }
    };

    const metadata = buildPdpMetadata(product);
    expect(metadata.title).toBe(productPublicTitle(product));
    expect(String(metadata.title)).not.toContain("Customizable Companion Doll");
  });

  it("uses Shopify SEO fields for a unique look's search and social snippet", () => {
    const product = {
      ...sampleProducts[0],
      title: "159cm H-Cup Silicone Customizable Companion Doll",
      seo: {
        title: "Adela - Rosy Allure | Real Lady",
        description: "Meet Adela - Rosy Allure, a distinctive Real Lady look with private DollWow ordering support."
      },
      extended: {
        ...sampleProducts[0].extended,
        brand: "Real Lady",
        displayName: "Adela - Rosy Allure",
        heightCm: 159,
        cupSize: "H",
        material: "Silicone"
      }
    };

    const metadata = buildPdpMetadata(product);
    expect(metadata.title).toBe(product.seo.title);
    expect(metadata.description).toBe(product.seo.description);
    expect(metadata.openGraph).toMatchObject({ title: product.seo.title, description: product.seo.description });
    expect(metadata.twitter).toMatchObject({ title: product.seo.title, description: product.seo.description });
  });

  it("omits no-cup placeholders and internal search language from metadata", () => {
    const product = {
      ...sampleProducts[0],
      title: "Climax 80cm TPE Torso",
      productType: "TPE torso",
      extended: {
        ...sampleProducts[0].extended,
        brand: "Climax Doll",
        displayName: "Climax",
        heightCm: 80,
        weightLb: 17.6,
        cupSize: "N/A",
        material: "TPE"
      }
    };

    const metadata = buildPdpMetadata(product);
    expect(metadata.description).not.toMatch(/-Cup|N\/A|NA-Cup/i);
    expect(metadata.description).not.toMatch(/useful for .* searches/i);
  });

  it("does not render a cup fragment for male products", () => {
    const product = {
      ...sampleProducts[0],
      title: "Irontech Kevin 170cm Silicone Male Doll",
      productType: "Male silicone doll",
      extended: {
        ...sampleProducts[0].extended,
        brand: "Irontech Dolls",
        displayName: "Kevin",
        bodyType: "male" as const,
        heightCm: 170,
        weightLb: 88,
        cupSize: "N/A",
        material: "Silicone"
      }
    };

    const metadata = buildPdpMetadata(product);
    expect(metadata.description).not.toMatch(/cup/i);
  });
});
