import type { Product } from "@/types/product";
import Link from "next/link";
import type { CatalogFilters } from "@/lib/catalog/filters";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  filters,
  resetHref = "/shop/sex-dolls"
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
      <div className="rounded-lg bg-surface p-10 text-center text-text-dim shadow-card">
        <p className="text-xl font-semibold text-text">No dolls matched this view yet.</p>
        <p className="mt-2">
          {filters?.query
            ? `We could not find a close match for “${filters.query}” with the current filters.`
            : "Try a broader filter mix and check again."}
        </p>
        <p className="mt-2 text-[15px] text-text-dim">
          Try fewer filters, swap the brand, or search by core facts like height, material, cup size, or ready-to-ship status.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {hasActiveFilters ? (
            <Link href={resetHref} className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-[15px] font-semibold text-text hover:border-accent">
              Reset filters
            </Link>
          ) : null}
          <Link href="/shop/sex-dolls?material=silicone" className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-[15px] font-semibold text-text hover:border-accent">
            Silicone dolls
          </Link>
          <Link href="/shop/sex-dolls?price=1500-1999" className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-[15px] font-semibold text-text hover:border-accent">
            $1,500-$1,999
          </Link>
          <Link href="/shop/ready-to-ship" className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-[15px] font-semibold text-text hover:border-accent">
            Ready to ship
          </Link>
          <Link href="/shop/female-dolls" className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-[15px] font-semibold text-text hover:border-accent">
            Female dolls
          </Link>
          <Link href="/shop/male-dolls" className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-[15px] font-semibold text-text hover:border-accent">
            Male dolls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-grid grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 3} />
      ))}
    </div>
  );
}
