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
    expect(protectedProductImageUrlFor(product, product.images[1])).toBe("/product-media/sample-doll/1?v=2");
    expect(protectedProductImageUrlFor(product, product.images[1], "thumb")).toBe("/product-media/sample-doll/1?v=2&size=thumb");
  });

  it("removes source URLs from the public product payload", () => {
    const protectedProduct = withProtectedProductImages(product);
    expect(JSON.stringify(protectedProduct)).not.toContain("cdn.shopify.com");
    expect(protectedProduct.featuredImage?.url).toBe("/product-media/sample-doll/0?v=2");
    expect(protectedProduct.images[1].url).toBe("/product-media/sample-doll/1?v=2");
  });
});
