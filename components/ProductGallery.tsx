"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { clsx } from "clsx";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { Product, ProductImage, ProductMedia } from "@/types/product";

export function ProductGallery({ product }: { product: Product }) {
  const media = useMemo(() => productMedia(product), [product]);
  const [index, setIndex] = useState(0);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const active = media[index] ?? null;
  const hasControls = media.length > 1;
  const displayTitle = productPublicTitle(product);

  function move(direction: -1 | 1) {
    setIndex((current) => (current + direction + media.length) % media.length);
  }

  return (
    <section className="space-y-3">
      <div className="noir-media-wrap relative aspect-[4/5] overflow-hidden rounded-[18px] border border-gold-500/20 bg-surface-tint shadow-soft">
        {active?.type === "image" ? (
          <button type="button" onClick={() => setPreviewOpen(true)} className="relative block h-full w-full" aria-label="Open product image preview">
            <Image
              src={active.image.url}
              alt={displayTitle}
              fill
              sizes="(min-width: 1024px) 44vw, 94vw"
              priority
              className="object-cover noir-media"
            />
          </button>
        ) : active?.type === "video" ? (
          <video controls playsInline preload="metadata" poster={active.previewImage?.url} className="h-full w-full bg-black object-contain">
            <source src={active.url} type="video/mp4" />
          </video>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <ImageIcon className="mb-4 h-10 w-10 text-gold-300" />
            <p className="text-sm font-semibold text-ivory-50">{displayTitle}</p>
            <p className="mt-2 text-sm text-ivory-600">Product image appears when Shopify media is connected.</p>
          </div>
        )}

        {hasControls && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => move(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/25 bg-ink-950/72 text-ivory-50 shadow-soft transition hover:border-gold-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => move(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/25 bg-ink-950/72 text-ivory-50 shadow-soft transition hover:border-gold-300"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {media.length > 0 && (
          <div className="absolute bottom-3 right-3 rounded-full border border-gold-500/20 bg-ink-950/72 px-3 py-1 text-sm font-semibold text-ivory-100">
            {index + 1} / {media.length}
          </div>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {media.map((item, imageIndex) => (
            <button
              type="button"
              key={`${item.type === "image" ? item.image.url : item.url}-${imageIndex}`}
              onClick={() => setIndex(imageIndex)}
              aria-label={`View image ${imageIndex + 1}`}
              className={clsx(
                "noir-media-wrap relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-[10px] border bg-ink-900 transition sm:w-[84px]",
                imageIndex === index ? "border-gold-300" : "border-gold-500/14 hover:border-gold-300/70"
              )}
            >
              {item.type === "image" ? (
                <Image src={item.image.url} alt={displayTitle} fill sizes="96px" className="object-cover noir-media" loading="lazy" />
              ) : item.previewImage ? (
                <Image src={item.previewImage.url} alt={`${displayTitle} video`} fill sizes="96px" className="object-cover noir-media" loading="lazy" />
              ) : (
                <span className="flex h-full items-center justify-center text-sm font-semibold text-ivory-100">Video</span>
              )}
            </button>
          ))}
        </div>
      )}
      {isPreviewOpen && active?.type === "image" && (
        <ImagePreviewModal imageUrl={active.image.url} alt={displayTitle} onClose={() => setPreviewOpen(false)} />
      )}
    </section>
  );
}

function productMedia(product: Product): ProductMedia[] {
  if (product.media?.length) return product.media;
  return uniqueImages([product.featuredImage, ...product.images]).map((image) => ({ type: "image", image, altText: image.altText }));
}

function uniqueImages(images: Array<ProductImage | null>) {
  const seen = new Set<string>();
  return images.filter((image): image is ProductImage => {
    if (!image?.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}
