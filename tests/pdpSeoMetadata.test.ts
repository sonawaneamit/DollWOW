import { describe, expect, it } from "vitest";
import { buildPdpMetadata, buildProductStructuredData, buildProductFaqStructuredData, pdpFaqItems } from "@/lib/catalog/pdpSeo";
import { sampleProducts } from "@/lib/data/sample-products";
import { productPublicTitle } from "@/lib/catalog/naming";

describe("product metadata", () => {
  it("does not label an unconfirmed factory-order menu as a fixed warehouse configuration", () => {
    const product = { ...sampleProducts[0], extended: { ...sampleProducts[0].extended, stockStatus: "custom" as const, customAvailable: false, customizationGroups: undefined } };
    const faq = pdpFaqItems(product).find(item => item.question === "Can I customize this doll before checkout?");
    expect(faq?.answer).toContain("only selectable choices");
    expect(faq?.answer).not.toContain("fixed");
    expect(buildProductStructuredData(product).additionalProperty).toContainEqual(expect.objectContaining({ name: "Customization available", value: "Confirm available options with our team" }));
    expect(buildProductFaqStructuredData(product).mainEntity.find(item => item.name === faq?.question)?.acceptedAnswer.text).toBe(faq?.answer);
    expect(product.extended.customAvailable).toBe(false);
  });
  it("removes repeated imported brand suffixes, preserving the look title", () => {
    const product = { ...sampleProducts[0], seo: { title: "Irontech Lexi Sunset | DollWow | DollWow", description: "A complete description." } };
    expect(buildPdpMetadata(product).title).toBe("Irontech Lexi Sunset");
    expect(buildPdpMetadata(product).openGraph).toMatchObject({ title: "Irontech Lexi Sunset" });
  });

  it("repairs old sliced descriptions equally in metadata and Product schema", () => {
    const product = { ...sampleProducts[0], seo: { title: "Elena", description: "Compare Elena's photos and measurements. This model is ava" } };
    expect(buildPdpMetadata(product).description).toBe("Compare Elena's photos and measurements.");
    expect(buildProductStructuredData(product).description).toBe(buildPdpMetadata(product).description);
  });

  it("generates complete hybrid copy with rounded display weight, without inferring a TPE body", () => {
    const product = { ...sampleProducts[0], title: "Dolls Castle Lili 183cm Hybrid Doll", seo: undefined,
      extended: { ...sampleProducts[0].extended, displayName: "Lili", brand: "Dolls Castle", material: "silicone-head", heightCm: 183, cupSize: "E", weightLb: 93.6965, stockStatus: "custom" as const, customAvailable: true } };
    const description = String(buildPdpMetadata(product).description);
    expect(description).toContain("Hybrid");
    expect(description).toContain("93.7 lb");
    expect(description).not.toMatch(/silicone head female body|TPE|93\.6965/);
    expect(description).toMatch(/\.$/);
    expect(product.extended.weightLb).toBe(93.6965);
  });

  it("keeps RTS and unknown ordering states distinct", () => {
    const product = { ...sampleProducts[0], seo: undefined, extended: { ...sampleProducts[0].extended, stockStatus: "ready_to_ship" as const, customAvailable: false } };
    expect(buildPdpMetadata(product).description).toContain("Ready to ship.");
    const unknown = { ...product, extended: { ...product.extended, stockStatus: undefined, customAvailable: undefined } };
    expect(buildPdpMetadata(unknown).description).not.toMatch(/Ready to ship|Customizable build|made to order/);
  });
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
