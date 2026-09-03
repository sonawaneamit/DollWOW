import { describe, expect, it } from "vitest";
import { mapShopifyProduct } from "@/lib/shopify/mappers";
import { isNeutralDefaultOption, isOptionPriceVerified } from "@/lib/customization/resolve";

function mapProductWithProductionNotes(productionNotes: string[]) {
  return mapShopifyProduct({
    id: "gid://shopify/Product/production-notes",
    handle: "test-production-notes",
    title: "Test customization product",
    description: "",
    vendor: "Test brand",
    productType: "Doll",
    tags: [],
    featuredImage: null,
    images: { edges: [] },
    variants: { edges: [] },
    priceRange: {
      minVariantPrice: { amount: "2000", currencyCode: "USD" },
      maxVariantPrice: { amount: "2000", currencyCode: "USD" }
    },
    customizationGroups: {
      value: JSON.stringify([{
        id: "test-group",
        label: "Test group",
        display: "cards",
        options: productionNotes.map((productionNote, index) => ({
          id: `option-${index}`,
          label: `Option ${index}`,
          productionNote
        }))
      }])
    }
  });
}

describe("Shopify product metadata mapping", () => {
  it.each([
    "Reseller price $50. Suggested retail $100. Factory URL: https://www.sedoll.com/options/loose-joint",
    "Phoebe autumn list",
    "Default supplier selection. This upgrade is opt-in.",
    "Do not also add IronAI TalkX",
    "See DOL-39 before publishing.",
    "Internal launch date: 2026-09-15."
  ])("drops an unsafe imported production note: %s", (productionNote) => {
    const product = mapProductWithProductionNotes([productionNote]);
    const option = product.extended.customizationGroups?.[0]?.options[0];

    expect(option?.productionNote).toBeUndefined();
    expect(JSON.stringify(product)).not.toContain(productionNote);
  });

  it.each([
    "Adds approximately 3 kg.",
    "Additional shipping may apply.",
    "Requires a fixed vagina.",
    "Electronic systems are not covered by factory after-sales support once shipped.",
    "Default selection."
  ])("preserves a customer-safe imported production note: %s", (productionNote) => {
    const product = mapProductWithProductionNotes([productionNote]);
    expect(product.extended.customizationGroups?.[0]?.options[0]?.productionNote).toBe(productionNote);
  });

  it.each([
    "Default supplier selection.",
    "No paid add-on selected."
  ])("preserves default/free classification without retaining the raw imported note: %s", (productionNote) => {
    const product = mapProductWithProductionNotes([productionNote]);
    const option = product.extended.customizationGroups?.[0]?.options[0];

    expect(option?.productionNote).toBeUndefined();
    expect(JSON.stringify(option)).not.toContain(productionNote);
    expect(isNeutralDefaultOption(option!.id, option!.label, option!.productionNote, option!.sourceProductionNoteSignals)).toBe(true);
    expect(isOptionPriceVerified(option!)).toBe(true);
  });

  it("preserves Shopify SEO title and description for storefront rendering", () => {
    const product = mapShopifyProduct({
      id: "gid://shopify/Product/adela-look",
      handle: "real-lady-adela-159cm-rosy-allure-honey-bronze",
      title: "159cm H-Cup Silicone Customizable Companion Doll",
      description: "",
      seo: {
        title: "Adela - Rosy Allure | Real Lady",
        description: "Meet Adela - Rosy Allure."
      },
      vendor: "Real Lady",
      productType: "Doll",
      tags: ["real-lady"],
      featuredImage: null,
      images: { edges: [] },
      variants: { edges: [] },
      priceRange: {
        minVariantPrice: { amount: "2000", currencyCode: "USD" },
        maxVariantPrice: { amount: "2000", currencyCode: "USD" }
      },
      displayName: { value: "Adela - Rosy Allure" }
    });

    expect(product.seo).toEqual({
      title: "Adela - Rosy Allure | Real Lady",
      description: "Meet Adela - Rosy Allure."
    });
    expect(product.extended.displayName).toBe("Adela - Rosy Allure");
  });

  it("maps body-specific Irontech ULW eligibility JSON", () => {
    const product = mapShopifyProduct({
      id: "gid://shopify/Product/1",
      handle: "irontech-verified-body",
      title: "Irontech verified body",
      description: "",
      vendor: "Irontech Dolls",
      productType: "Doll",
      tags: ["irontech"],
      featuredImage: null,
      images: { edges: [] },
      variants: { edges: [] },
      priceRange: {
        minVariantPrice: { amount: "2000", currencyCode: "USD" },
        maxVariantPrice: { amount: "2000", currencyCode: "USD" }
      },
      irontechUlwEligibility: {
        value: JSON.stringify({
          status: "verified",
          bodyModel: "Irontech 165F",
          source: "irontech-production-data",
          verifiedAt: "2026-08-20"
        })
      }
    });

    expect(product.extended.irontechUlwEligibility).toEqual({
      status: "verified",
      bodyModel: "Irontech 165F",
      source: "irontech-production-data",
      verifiedAt: "2026-08-20"
    });
  });

  it("maps direct Irontech confirmation without relabeling its provenance", () => {
    const product = mapShopifyProduct({
      id: "gid://shopify/Product/2",
      handle: "irontech-directly-confirmed-body",
      title: "Irontech directly confirmed body",
      description: "",
      vendor: "Irontech Dolls",
      productType: "Doll",
      tags: ["irontech"],
      featuredImage: null,
      images: { edges: [] },
      variants: { edges: [] },
      priceRange: {
        minVariantPrice: { amount: "2000", currencyCode: "USD" },
        maxVariantPrice: { amount: "2000", currencyCode: "USD" }
      },
      irontechUlwEligibility: {
        value: JSON.stringify({
          status: "verified",
          bodyModel: " Irontech 165F ",
          source: "irontech-direct-confirmation",
          verifiedAt: "2026-08-21"
        })
      }
    });

    expect(product.extended.irontechUlwEligibility).toEqual({
      status: "verified",
      bodyModel: "Irontech 165F",
      source: "irontech-direct-confirmation",
      verifiedAt: "2026-08-21"
    });
  });

  it("fails closed on malformed Irontech ULW eligibility JSON", () => {
    const product = mapShopifyProduct({
      id: "gid://shopify/Product/2",
      handle: "irontech-unverified-body",
      title: "Irontech unverified body",
      description: "",
      vendor: "Irontech Dolls",
      productType: "Doll",
      tags: ["irontech"],
      featuredImage: null,
      images: { edges: [] },
      variants: { edges: [] },
      priceRange: {
        minVariantPrice: { amount: "2000", currencyCode: "USD" },
        maxVariantPrice: { amount: "2000", currencyCode: "USD" }
      },
      irontechUlwEligibility: { value: "not-json" }
    });

    expect(product.extended.irontechUlwEligibility).toBeUndefined();
  });

  it.each([
    ["wrong source", { status: "verified", bodyModel: "165F", source: "client" }],
    ["wrong status", { status: "pending", bodyModel: "165F", source: "irontech-production-data" }],
    ["blank body model", { status: "verified", bodyModel: "   ", source: "irontech-production-data" }],
    ["array JSON", [{ status: "verified", bodyModel: "165F", source: "irontech-production-data" }]],
    ["non-object JSON", "verified"]
  ])("fails closed on %s eligibility metadata", (_label, eligibility) => {
    const product = mapShopifyProduct({
      id: "gid://shopify/Product/3",
      handle: "irontech-invalid-eligibility",
      title: "Irontech invalid eligibility",
      description: "",
      vendor: "Irontech Dolls",
      productType: "Doll",
      tags: ["irontech"],
      featuredImage: null,
      images: { edges: [] },
      variants: { edges: [] },
      priceRange: {
        minVariantPrice: { amount: "2000", currencyCode: "USD" },
        maxVariantPrice: { amount: "2000", currencyCode: "USD" }
      },
      irontechUlwEligibility: { value: JSON.stringify(eligibility) }
    });

    expect(product.extended.irontechUlwEligibility).toBeUndefined();
  });

  it("forces customAvailable to false for ready-to-ship warehouse products", () => {
    const product = mapShopifyProduct({
      id: "gid://shopify/Product/100",
      handle: "irontech-len-stilwell-158cm-l-cup-tpe-companion-doll-1g8uu",
      title: "Irontech Len Stilwell 158cm L-Cup TPE Companion Doll",
      description: "Ready to ship from US warehouse",
      vendor: "Irontech Dolls",
      productType: "Custom TPE Doll",
      tags: ["irontech", "warehouse", "ready-to-ship"],
      featuredImage: null,
      images: { edges: [] },
      variants: { edges: [] },
      priceRange: {
        minVariantPrice: { amount: "1899", currencyCode: "USD" },
        maxVariantPrice: { amount: "1899", currencyCode: "USD" }
      },
      stockStatus: { value: "ready_to_ship" },
      warehouseCountry: { value: "US" },
      customAvailable: { value: "true" }
    });

    expect(product.extended.stockStatus).toBe("ready_to_ship");
    expect(product.extended.customAvailable).toBe(false);
  });

  it("preserves customAvailable for custom-order products even when explicitly set", () => {
    const product = mapShopifyProduct({
      id: "gid://shopify/Product/101",
      handle: "irontech-fenny-162cm-g-cup-hybrid-companion-doll-1if4v",
      title: "Irontech Fenny 162cm G-Cup Hybrid Companion Doll",
      description: "Made to order",
      vendor: "Irontech Dolls",
      productType: "Custom Hybrid Doll",
      tags: ["irontech", "custom"],
      featuredImage: null,
      images: { edges: [] },
      variants: { edges: [] },
      priceRange: {
        minVariantPrice: { amount: "2555", currencyCode: "USD" },
        maxVariantPrice: { amount: "2555", currencyCode: "USD" }
      },
      stockStatus: { value: "custom" },
      customAvailable: { value: "true" }
    });

    expect(product.extended.stockStatus).toBe("custom");
    expect(product.extended.customAvailable).toBe(true);
  });
});
