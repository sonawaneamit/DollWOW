import type { Product, ProductImage } from "@/types/product";

export function productImageSources(product: Product) {
  const sources: ProductImage[] = [];
  const seen = new Set<string>();
  const add = (image?: ProductImage | null) => {
    if (!image?.url || seen.has(image.url)) return;
    seen.add(image.url);
    sources.push(image);
  };

  add(product.featuredImage);
  product.images.forEach(add);
  product.media?.forEach((media) => {
    if (media.type === "image") add(media.image);
    else add(media.previewImage);
  });
  return sources;
}

export type ProtectedImageSize = "full" | "card" | "thumb";

export function protectedProductImageUrl(handle: string, position = 0, size: ProtectedImageSize = "full") {
  return `/product-media/${encodeURIComponent(handle)}/${Math.max(0, position)}${size === "full" ? "" : `?size=${size}`}`;
}

export function protectedProductImageUrlFor(product: Product, image?: ProductImage | null, size: ProtectedImageSize = "full") {
  if (!image?.url) return undefined;
  const position = productImageSources(product).findIndex((source) => source.url === image.url);
  return protectedProductImageUrl(product.handle, position < 0 ? 0 : position, size);
}

export function withProtectedProductImages(product: Product): Product {
  const sources = productImageSources(product);
  const protect = (image?: ProductImage | null) => {
    if (!image) return null;
    const position = sources.findIndex((source) => source.url === image.url);
    return { ...image, url: protectedProductImageUrl(product.handle, position < 0 ? 0 : position) };
  };

  return {
    ...product,
    featuredImage: protect(product.featuredImage),
    images: product.images.map((image) => protect(image)!),
    media: product.media?.map((media) => media.type === "image"
      ? { ...media, image: protect(media.image)! }
      : { ...media, previewImage: protect(media.previewImage) })
  };
}
