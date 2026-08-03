"use client";

import { useMemo, useState } from "react";
import type { CatalogFilters } from "@/lib/catalog/filters";
import type { Product } from "@/types/product";
import { ProductGrid } from "./ProductGrid";

type SortOption = "latest" | "price-low" | "price-high";

export function BrandProductGrid({
  products,
  filters,
  resetHref
}: {
  products: Product[];
  filters: CatalogFilters;
  resetHref: string;
}) {
  const [sort, setSort] = useState<SortOption>("latest");
  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);

  return (
    <section aria-label="Irontech product listings">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-gold-500/12 py-4">
        <p className="text-sm text-ivory-400">Showing newest releases first</p>
        <label className="flex items-center gap-3 text-sm font-semibold text-ivory-200">
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="min-h-10 rounded-[8px] border border-gold-500/30 bg-ink-950 px-3 text-sm font-semibold text-ivory-100 outline-none transition focus:border-gold-300"
          >
            <option value="latest">Latest releases</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>
      <ProductGrid products={sortedProducts} filters={filters} resetHref={resetHref} />
    </section>
  );
}

function sortProducts(products: Product[], sort: SortOption) {
  return [...products].sort((left, right) => {
    if (sort === "price-low" || sort === "price-high") {
      const priceDelta = Number(left.priceRange.minVariantPrice.amount) - Number(right.priceRange.minVariantPrice.amount);
      return sort === "price-low" ? priceDelta : -priceDelta;
    }

    const leftRank = left.extended.sourceReleaseRank;
    const rightRank = right.extended.sourceReleaseRank;
    if (leftRank === undefined && rightRank === undefined) return 0;
    if (leftRank === undefined) return 1;
    if (rightRank === undefined) return -1;
    return rightRank - leftRank;
  });
}
