import { expect, it } from "vitest";
import { productImageSources, productStillImagePositions } from "@/lib/catalog/productImage";
import type { Product, ProductImage } from "@/types/product";

it("retains late gallery photo positions while excluding video-only posters", () => {
  const photo = (name: string): ProductImage => ({ url: `https://cdn.shopify.com/${name}.jpg`, altText: null });
  const images = Array.from({ length: 10 }, (_, i) => photo(`photo-${i}`));
  const galleryStill = photo("gallery-still");
  const product = {
    featuredImage: images[0],
    images,
    media: [
      { type: "video", url: "video.mp4", previewImage: photo("poster"), altText: null },
      { type: "image", image: galleryStill, altText: null },
    ],
  } as Product;

  const sources = productImageSources(product);
  const positions = productStillImagePositions(product, sources);
  expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11]);
  expect(sources[positions.at(-1)!]).toBe(galleryStill);
});
