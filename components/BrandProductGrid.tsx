"use client";

import { useMemo, useState } from "react";
import type { CatalogFilters } from "@/lib/catalog/filters";
import type { Product } from "@/types/product";
import { ProductGrid } from "./ProductGrid";
import { StyledSelect } from "./StyledSelect";

type SortOption = "latest" | "price-low" | "price-high";

export function BrandProductGrid({
  brandLabel,
  products,
  filters,
  resetHref
}: {
  brandLabel: string;
  products: Product[];
  filters: CatalogFilters;
  resetHref: string;
}) {
  const [sort, setSort] = useState<SortOption>("latest");
  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);

  return (
    <section aria-label={`${brandLabel} product listings`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-gold-500/12 py-4">
        <p className="text-sm text-ivory-400">Showing newest releases first</p>
        <div className="flex items-center gap-3 text-sm font-semibold text-ivory-200">
          <span>Sort by</span>
          <StyledSelect value={sort} onValueChange={(value) => setSort(value as SortOption)} ariaLabel="Sort products" className="min-w-44" options={[
            { label: "Latest releases", value: "latest" },
            { label: "Price: low to high", value: "price-low" },
            { label: "Price: high to low", value: "price-high" }
          ]} />
        </div>
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
