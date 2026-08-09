import { describe, expect, it } from "vitest";
import { parseCatalogSearchQuery, productSearchScore, rankCatalogProducts } from "@/lib/search/catalog";
import { sampleProducts } from "@/lib/data/sample-products";
import { shopifyQueryForCatalogSearch } from "@/lib/catalog/filters";

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

  it("returns the catalog for broad stop-word-only queries", () => {
    expect(rankCatalogProducts(sampleProducts, "doll", 3)).toHaveLength(Math.min(3, sampleProducts.length));
    expect(rankCatalogProducts(sampleProducts, "sex dolls", 3)).toHaveLength(Math.min(3, sampleProducts.length));
  });

  it("matches a height typed without the cm suffix", () => {
    const product = {
      ...sampleProducts[0],
      title: "Irontech 161cm F-cup Evie",
      extended: { ...sampleProducts[0].extended, heightCm: 161 }
    };
    expect(productSearchScore(product, "161")).toBeGreaterThan(0);
  });

  it("tolerates the supplier's Evie and Eive transposed spelling", () => {
    const product = {
      ...sampleProducts[0],
      title: "Irontech 161cm T4 Eive ROS MAX Glow",
      description: "",
      images: [],
      tags: [],
      extended: { ...sampleProducts[0].extended, displayName: "", sourceTitle: "" }
    };
    expect(productSearchScore(product, "Evie")).toBeGreaterThan(0);
  });

  it("builds a safe Shopify candidate query and expands Evie/Eive", () => {
    expect(shopifyQueryForCatalogSearch("161 Evie!")).toBe("161 AND (evie OR eive)");
    expect(shopifyQueryForCatalogSearch("busty blonde")).toBe(
      "(busty OR curvy OR tag:shape-curvy OR tag:shape-fuller) AND (blonde OR blond OR platinum OR tag:hair-blonde)"
    );
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
