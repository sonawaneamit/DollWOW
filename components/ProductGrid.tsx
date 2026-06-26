import type { Product } from "@/types/product";
import Link from "next/link";
import type { CatalogFilters } from "@/lib/catalog/filters";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  filters,
  resetHref = "/shop"
}: {
  products: Product[];
  filters?: CatalogFilters;
  resetHref?: string;
}) {
  if (!products.length) {
    const hasActiveFilters = Boolean(
      filters?.query ||
        filters?.brand ||
        filters?.bodyType ||
        filters?.availability ||
        filters?.material ||
        filters?.height ||
        filters?.weight ||
        filters?.cup ||
        filters?.price
    );

    return (
      <div className="rounded-[20px] border border-gold-500/16 bg-ink-800/60 p-10 text-center text-ivory-400">
        <p className="text-lg font-semibold text-ivory-100">No dolls matched this view yet.</p>
        <p className="mt-2">
          {filters?.query
            ? `We could not find a close match for “${filters.query}” with the current filters.`
            : "Try a broader filter mix and check again."}
        </p>
        <p className="mt-2 text-sm text-ivory-500">
          Try fewer filters, swap the brand, or search by core facts like height, material, cup size, or ready-to-ship status.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {hasActiveFilters ? (
            <Link href={resetHref} className="rounded-full border border-gold-500/22 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
              Reset filters
            </Link>
          ) : null}
          <Link href="/shop?material=silicone" className="rounded-full border border-gold-500/22 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
            Silicone dolls
          </Link>
          <Link href="/shop?price=1500-1999" className="rounded-full border border-gold-500/22 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
            $1,500-$1,999
          </Link>
          <Link href="/shop/ready-to-ship" className="rounded-full border border-gold-500/22 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
            Ready to ship
          </Link>
          <Link href="/shop/female-dolls" className="rounded-full border border-gold-500/22 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
            Female dolls
          </Link>
          <Link href="/shop/male-dolls" className="rounded-full border border-gold-500/22 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
            Male dolls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-grid grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
