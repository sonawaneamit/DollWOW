import { describe, expect, it } from "vitest";
import { mapShopifyProduct } from "@/lib/shopify/mappers";

describe("Shopify product metadata mapping", () => {
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
});
