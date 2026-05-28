"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { clsx } from "clsx";
import type { Product, ProductImage } from "@/types/product";

export function ProductGallery({ product }: { product: Product }) {
  const images = useMemo(() => uniqueImages([product.featuredImage, ...product.images]), [product]);
  const [index, setIndex] = useState(0);
  const active = images[index] ?? null;
  const hasControls = images.length > 1;

  function move(direction: -1 | 1) {
    setIndex((current) => (current + direction + images.length) % images.length);
  }

  return (
    <section className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-gold-500/14 bg-[linear-gradient(145deg,#1a1713,#050505)]">
        {active ? (
          <Image
            src={active.url}
            alt={active.altText ?? product.title}
            fill
            sizes="(min-width: 1024px) 44vw, 94vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <ImageIcon className="mb-4 h-10 w-10 text-gold-300" />
            <p className="text-sm font-semibold text-ivory-50">{product.title}</p>
            <p className="mt-2 text-xs text-ivory-600">Product image appears when Shopify media is connected.</p>
          </div>
        )}

        {hasControls && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => move(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/25 bg-ink-950/72 text-ivory-50 shadow-soft backdrop-blur transition hover:border-gold-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => move(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/25 bg-ink-950/72 text-ivory-50 shadow-soft backdrop-blur transition hover:border-gold-300"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {images.length > 0 && (
          <div className="absolute bottom-3 right-3 rounded-full border border-gold-500/20 bg-ink-950/72 px-3 py-1 text-xs font-semibold text-ivory-100 backdrop-blur">
            {index + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
          {images.slice(0, 10).map((image, imageIndex) => (
            <button
              type="button"
              key={`${image.url}-${imageIndex}`}
              onClick={() => setIndex(imageIndex)}
              aria-label={`View image ${imageIndex + 1}`}
              className={clsx(
                "relative aspect-square overflow-hidden rounded-[10px] border bg-ink-900 transition",
                imageIndex === index ? "border-gold-300" : "border-gold-500/14 hover:border-gold-300/70"
              )}
            >
              <Image src={image.url} alt={image.altText ?? product.title} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function uniqueImages(images: Array<ProductImage | null>) {
  const seen = new Set<string>();
  return images.filter((image): image is ProductImage => {
    if (!image?.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}
