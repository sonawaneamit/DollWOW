import { describe, expect, it } from "vitest";
import { productImageSources, protectedProductImageUrlFor, withProtectedProductImages } from "@/lib/catalog/productImage";
import type { Product } from "@/types/product";

const product = {
  id: "1",
  handle: "sample-doll",
  title: "Sample",
  description: "",
  vendor: "DollWow",
  productType: "Doll",
  tags: [],
  featuredImage: { url: "https://cdn.shopify.com/one.jpg", altText: "One" },
  images: [
    { url: "https://cdn.shopify.com/one.jpg", altText: "One" },
    { url: "https://cdn.shopify.com/two.jpg", altText: "Two" }
  ],
  variants: [],
  priceRange: {
    minVariantPrice: { amount: "1", currencyCode: "USD" },
    maxVariantPrice: { amount: "1", currencyCode: "USD" }
  },
  extended: {}
} satisfies Product;

describe("protected product images", () => {
  it("deduplicates sources and assigns stable positions", () => {
    expect(productImageSources(product).map((image) => image.url)).toEqual([
      "https://cdn.shopify.com/one.jpg",
      "https://cdn.shopify.com/two.jpg"
    ]);
    expect(protectedProductImageUrlFor(product, product.images[1])).toBe("/product-media/v4/sample-doll/1");
    expect(protectedProductImageUrlFor(product, product.images[1], "thumb")).toBe("/product-media/v4/sample-doll/1?size=thumb");
  });

  it("removes source URLs from the public product payload", () => {
    const protectedProduct = withProtectedProductImages(product);
    expect(JSON.stringify(protectedProduct)).not.toContain("cdn.shopify.com");
    expect(protectedProduct.featuredImage?.url).toBe("/product-media/v4/sample-doll/0");
    expect(protectedProduct.images[1].url).toBe("/product-media/v4/sample-doll/1");
  });

  it("revises the Himari proxy URL when its approved card still changes", () => {
    const himari = { ...product, handle: "lusandy-himari-157cm-b-cup-silicone-companion-doll" };

    expect(protectedProductImageUrlFor(himari, himari.featuredImage, "card")).toBe(
      "/product-media/v4/lusandy-himari-157cm-b-cup-silicone-companion-doll/0?size=card&rev=adult-factory-still-20260829"
    );
  });

  it("revises gallery-qa Sophia/Nadia/Belle proxy URLs after studio-first reorder", () => {
    const handles = [
      "lusandy-sophia-170cm-g-cup-silicone-companion-doll-gallery-qa",
      "lusandy-nadia-159cm-g-cup-silicone-companion-doll-gallery-qa",
      "lusandy-belle-165cm-d-cup-silicone-companion-doll-gallery-qa"
    ] as const;

    for (const handle of handles) {
      const doll = { ...product, handle };
      expect(protectedProductImageUrlFor(doll, doll.featuredImage)).toBe(
        `/product-media/v4/${handle}/0?rev=studio-first-20260904`
      );
    }
  });
});
