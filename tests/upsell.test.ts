import { describe, expect, it } from "vitest";
import { rankUpsells, toUpsellSnapshot, upsellScore } from "@/lib/cart/upsell";
import type { Product } from "@/types/product";

function makeProduct(overrides: {
  id?: string;
  handle?: string;
  title?: string;
  productType?: string;
  tags?: string[];
  price?: string;
  stockStatus?: "ready_to_ship" | "custom" | "check_stock";
  available?: boolean;
}): Product {
  const available = overrides.available ?? true;
  return {
    id: overrides.id ?? "gid://shopify/Product/1",
    handle: overrides.handle ?? "product",
    title: overrides.title ?? "Product",
    description: "",
    vendor: "Vendor",
    productType: overrides.productType ?? "Sex Dolls",
    tags: overrides.tags ?? [],
    featuredImage: null,
    images: [],
    variants: [
      {
        id: `gid://shopify/ProductVariant/${overrides.id ?? "1"}`,
        title: "Default",
        availableForSale: available,
        price: { amount: overrides.price ?? "2000", currencyCode: "USD" },
        selectedOptions: []
      }
    ],
    priceRange: {
      minVariantPrice: { amount: overrides.price ?? "2000", currencyCode: "USD" },
      maxVariantPrice: { amount: overrides.price ?? "2000", currencyCode: "USD" }
    },
    extended: { stockStatus: overrides.stockStatus ?? "custom" }
  };
}

describe("upsell ranking", () => {
  it("ranks in-stock accessories ahead of dolls", () => {
    const careKit = makeProduct({
      id: "care",
      handle: "care-kit",
      title: "Deluxe Care Kit",
      productType: "Accessories",
      price: "49",
      stockStatus: "ready_to_ship"
    });
    const doll = makeProduct({ id: "doll", handle: "doll", title: "165cm Doll", price: "2200", stockStatus: "custom" });

    expect(upsellScore(careKit)).toBeGreaterThan(upsellScore(doll));
    expect(rankUpsells([doll, careKit], 4)[0]?.handle).toBe("care-kit");
  });

  it("excludes products with no upsell signal", () => {
    const staleDoll = makeProduct({
      id: "stale",
      handle: "stale-doll",
      price: "2500",
      stockStatus: "custom",
      available: false
    });
    expect(upsellScore(staleDoll)).toBe(0);
    expect(rankUpsells([staleDoll], 4)).toHaveLength(0);
  });

  it("respects the limit", () => {
    const accessories = Array.from({ length: 12 }, (_, index) =>
      makeProduct({
        id: `acc-${index}`,
        handle: `acc-${index}`,
        title: `Care Kit ${index}`,
        productType: "Accessories",
        price: "39",
        stockStatus: "ready_to_ship"
      })
    );
    expect(rankUpsells(accessories, 8)).toHaveLength(8);
  });

  it("builds a bag-ready snapshot from the first available variant", () => {
    const careKit = makeProduct({ id: "care", handle: "care-kit", title: "Care Kit", productType: "Accessories", price: "49" });
    const snapshot = toUpsellSnapshot(careKit);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.merchandiseId).toBe("gid://shopify/ProductVariant/care");
    expect(snapshot?.unitPrice).toBe(49);
    expect(snapshot?.currencyCode).toBe("USD");
  });
});
