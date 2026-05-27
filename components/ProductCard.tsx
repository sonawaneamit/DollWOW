import Link from "next/link";
import { Scale, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/utils/currency";
import type { Product } from "@/types/product";
import { ProductImageFrame } from "./ProductImageFrame";
import { WarehouseStatusBadge } from "./WarehouseStatusBadge";

export function ProductCard({ product }: { product: Product }) {
  const price = product.priceRange.minVariantPrice;
  return (
    <article className="group rounded-[18px] border border-gold-500/14 bg-ink-800/72 p-3 transition hover:border-gold-400/40">
      <Link href={`/products/${product.handle}`} aria-label={`View ${product.title}`}>
        <ProductImageFrame product={product} />
      </Link>
      <div className="space-y-3 p-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gold-300">{product.extended.brand ?? product.vendor}</p>
            <Link href={`/products/${product.handle}`} className="mt-1 block text-lg font-semibold text-ivory-50">
              {product.title}
            </Link>
          </div>
          <WarehouseStatusBadge status={product.extended.stockStatus} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-ivory-400">
          <span>{product.extended.heightCm ? `${product.extended.heightCm} cm` : "Height TBD"}</span>
          <span>{product.extended.weightLb ? `${product.extended.weightLb} lb` : "Weight TBD"}</span>
          <span>{product.extended.material ?? "Material TBD"}</span>
        </div>
        <div className="flex items-center justify-between border-t border-gold-500/12 pt-3">
          <strong className="text-xl text-gold-300">{formatMoney(price.amount, price.currencyCode)}</strong>
          <div className="flex gap-2">
            <Link href="/compare" className="rounded-full border border-gold-500/20 p-2 text-gold-300" aria-label="Compare prices">
              <Scale className="h-4 w-4" />
            </Link>
            <Link href={`/products/${product.handle}`} className="rounded-full bg-gold-400 p-2 text-ink-950" aria-label="View product">
              <ShoppingBag className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
