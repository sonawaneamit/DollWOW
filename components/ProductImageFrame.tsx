import Image from "next/image";
import type { Product } from "@/types/product";

export function ProductImageFrame({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.featuredImage ?? product.images[0] ?? null;

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-gold-500/14 bg-[linear-gradient(145deg,#1a1713,#050505)]">
      {image ? (
        <Image
          src={image.url}
          alt={image.altText ?? product.title}
          fill
          sizes="(min-width: 1024px) 33vw, 90vw"
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-5 h-24 w-24 rounded-full border border-gold-500/30 bg-gold-500/10" />
          <p className="text-sm font-semibold text-ivory-50">{product.title}</p>
          <p className="mt-2 text-xs text-ivory-600">Product image appears when Shopify media is connected.</p>
        </div>
      )}
    </div>
  );
}
