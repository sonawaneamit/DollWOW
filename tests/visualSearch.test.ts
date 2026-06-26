import { describe, expect, it } from "vitest";
import { selectVisualCandidateImages } from "@/lib/search/openaiVisualSearch";
import { buildCatalogSuggestions, buildImageUrlCatalogSuggestions, normalizeApifyVisualSearchPayload } from "@/lib/search/visualSearch";

describe("visual search normalization", () => {
  it("flattens visual/exact/product matches into storefront-friendly results", () => {
    const results = normalizeApifyVisualSearchPayload([
      {
        visualMatches: [
          {
            title: "WM 156cm H-Cup Doll",
            link: "https://example.com/wm-156",
            thumbnail: "https://images.example.com/wm-156.jpg",
            snippet: "Visual match"
          }
        ],
        exactMatches: [
          {
            sourceTitle: "Same doll other retailer",
            sourceUrl: "https://another.example.com/wm-156",
            imageUrl: "https://another.example.com/image.jpg"
          }
        ]
      }
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      rank: 1,
      resultDomain: "example.com",
      title: "WM 156cm H-Cup Doll"
    });
    expect(results[1]).toMatchObject({
      rank: 2,
      resultDomain: "another.example.com",
      title: "Same doll other retailer"
    });
  });

  it("drops unusable links during normalization", () => {
    const results = normalizeApifyVisualSearchPayload([
      {
        products: [
          { title: "Bad item", url: "javascript:alert(1)" },
          { title: "Good item", url: "https://shop.example.com/product-1" }
        ]
      }
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]?.resultUrl).toBe("https://shop.example.com/product-1");
  });

  it("can fall back to image-url tokens for lightweight catalog suggestions", () => {
    const suggestions = buildImageUrlCatalogSuggestions(
      [
        {
          id: "1",
          handle: "wm-ava-156cm-h-cup-tpe-companion-doll",
          title: "WM Ava 156cm H-Cup TPE Companion Doll",
          description: "",
          vendor: "WM Dolls",
          productType: "Companion Doll",
          tags: ["wm-dolls", "tpe", "female-doll"],
          featuredImage: null,
          images: [],
          variants: [],
          priceRange: {
            minVariantPrice: { amount: "1000", currencyCode: "USD" },
            maxVariantPrice: { amount: "1000", currencyCode: "USD" }
          },
          extended: {
            brand: "WM Dolls",
            material: "TPE",
            bodyType: "female",
            stockStatus: "custom"
          }
        }
      ],
      "https://cdn.example.com/uploads/wm-ava-156cm-h-cup.jpg"
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.handle).toBe("wm-ava-156cm-h-cup-tpe-companion-doll");
  });

  it("uses local DollWow visual matches before text ranking", () => {
    const suggestions = buildCatalogSuggestions(
      [
        {
          id: "carry",
          handle: "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
          title: "SE Doll Carry 150cm G-Cup TPE",
          description: "",
          vendor: "SE Doll",
          productType: "Companion Doll",
          tags: ["se-doll", "tpe", "female-doll"],
          featuredImage: null,
          images: [],
          variants: [],
          priceRange: {
            minVariantPrice: { amount: "1000", currencyCode: "USD" },
            maxVariantPrice: { amount: "1000", currencyCode: "USD" }
          },
          extended: {
            brand: "SE Doll",
            material: "TPE",
            bodyType: "female",
            stockStatus: "custom"
          }
        }
      ],
      [
        {
          rank: 1,
          resultUrl: "https://dollwow.com/products/sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
          resultDomain: "dollwow.com",
          title: "SE Doll Carry 150cm G-Cup TPE",
          confidence: 1,
          rawResult: {
            provider: "dollwow_local_visual_index",
            handle: "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o"
          }
        }
      ]
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.score).toBe(100);
    expect(suggestions[0]?.handle).toBe("sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o");
  });

  it("uses OpenAI visual rerank handles as catalog matches", () => {
    const suggestions = buildCatalogSuggestions(
      [
        {
          id: "carry",
          handle: "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
          title: "SE Doll Carry 150cm G-Cup TPE",
          description: "",
          vendor: "SE Doll",
          productType: "Companion Doll",
          tags: ["se-doll", "tpe", "female-doll"],
          featuredImage: null,
          images: [],
          variants: [],
          priceRange: {
            minVariantPrice: { amount: "1000", currencyCode: "USD" },
            maxVariantPrice: { amount: "1000", currencyCode: "USD" }
          },
          extended: {
            brand: "SE Doll",
            material: "TPE",
            bodyType: "female",
            stockStatus: "custom"
          }
        }
      ],
      [
        {
          rank: 1,
          resultUrl: "https://dollwow.com/products/sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
          resultDomain: "dollwow.com",
          title: "SE Doll Carry 150cm G-Cup TPE",
          confidence: 0.91,
          rawResult: {
            provider: "openai_visual_rerank",
            handle: "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o"
          }
        }
      ]
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.handle).toBe("sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o");
  });

  it("prioritizes DollWow homepage visual assets for AI matching", () => {
    const candidates = selectVisualCandidateImages(
      [
        {
          id: "carry",
          handle: "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
          title: "SE Doll Carry 150cm G-Cup TPE",
          description: "",
          vendor: "SE Doll",
          productType: "Companion Doll",
          tags: ["se-doll", "tpe", "female-doll"],
          featuredImage: { url: "https://cdn.example.com/carry.jpg", altText: null },
          images: [],
          variants: [],
          priceRange: {
            minVariantPrice: { amount: "1000", currencyCode: "USD" },
            maxVariantPrice: { amount: "1000", currencyCode: "USD" }
          },
          extended: {
            brand: "SE Doll",
            material: "TPE",
            bodyType: "female",
            stockStatus: "custom"
          }
        }
      ],
      3
    );

    expect(candidates[0]?.product.handle).toBe("sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o");
    expect(candidates[0]?.source).toBe("homepage");
    expect(candidates[0]?.imageUrl).toContain("/images/home-hero/portraits-new/sedoll-carry-home.png");
  });
});
