import { describe, expect, it } from "vitest";
import { parseCatalogSearchQuery, productSearchScore, rankCatalogProducts } from "@/lib/search/catalog";
import { sampleProducts } from "@/lib/data/sample-products";

describe("catalog search", () => {
  it("parses practical shopping filters from natural queries", () => {
    expect(parseCatalogSearchQuery("WM 165 cm silicone ready to ship")).toMatchObject({
      brand: "wm",
      material: "silicone",
      availability: "ready_to_ship",
      heightCm: 165
    });
  });

  it("expands shopper-language appearance queries into customization intents", () => {
    expect(parseCatalogSearchQuery("blonde").expandedTerms).toEqual(
      expect.arrayContaining(["blonde", "hair", "hairstyle", "wig"])
    );
  });

  it("scores products from separate query terms instead of exact phrase only", () => {
    const product = sampleProducts[0];
    expect(productSearchScore(product, `${product.extended.brand} ${product.extended.heightCm} cm`)).toBeGreaterThan(0);
  });

  it("returns ranked product matches", () => {
    const ranked = rankCatalogProducts(sampleProducts, "ready silicone", 3);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[ranked.length - 1].score);
  });

  it("matches customization option labels such as hair color", () => {
    const product = {
      ...sampleProducts[0],
      title: "Neutral catalog title",
      description: "",
      tags: [],
      extended: {
        ...sampleProducts[0].extended,
        customizationGroups: [
          {
            id: "hair-color",
            label: "Hair color",
            display: "cards" as const,
            options: [{ id: "blonde", label: "Blonde", swatch: { kind: "text" as const, value: "Blonde" } }]
          }
        ]
      }
    };

    expect(productSearchScore(product, "blonde")).toBeGreaterThan(0);
  });

  it("matches hair-related searches against products that expose hairstyle customization even when the title lacks the color term", () => {
    const product = {
      ...sampleProducts[0],
      title: "Neutral catalog title",
      description: "",
      tags: [],
      images: [],
      extended: {
        ...sampleProducts[0].extended,
        sourceTitle: "",
        displayName: "",
        customizationGroups: [
          {
            id: "hairstyle",
            label: "Hairstyle",
            display: "cards" as const,
            options: [{ id: "style-01", label: "No.1" }]
          }
        ]
      }
    };

    expect(productSearchScore(product, "blonde")).toBeGreaterThan(0);
  });
});
