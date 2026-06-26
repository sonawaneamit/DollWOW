import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { activeFilterCount, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, requiresCatalogWideFetch, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = { title: "Shop Dolls" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = filtersFromSearchParams(params);
  const needsWideFetch = requiresCatalogWideFetch(filters);
  const products = await getProducts({
    query: shopifyQueryForFilters(filters),
    first: needsWideFetch ? 2200 : 600,
    includeCustomizationGroups: Boolean(filters.query)
  });
  const filteredProducts = filterProducts(products, filters);
  const visibleProducts = needsWideFetch ? filteredProducts.slice(0, 96) : filteredProducts;
  const activeFilterLabels = Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];
  const hasActiveFilters = activeFilterCount(filters) > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Shop Dolls</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Browse the catalog</h1>
          <p className="mt-3 max-w-2xl text-ivory-400">
            Filter by practical needs: delivery, material, size, weight, budget, and custom options.
            {filters.query ? ` Search: “${filters.query}”.` : ""}
          </p>
          <p className="mt-3 text-sm font-semibold text-gold-200">
            {filteredProducts.length} dolls in this view
            {visibleProducts.length < filteredProducts.length ? ` · showing first ${visibleProducts.length}` : ""}
          </p>
          {hasActiveFilters ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <span key={label} className="rounded-full border border-gold-500/16 bg-gold-500/8 px-3 py-1 text-xs font-semibold text-ivory-200">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {visibleProducts.length < filteredProducts.length ? (
            <div className="mt-4 max-w-2xl rounded-[18px] border border-gold-500/16 bg-ink-900/55 px-4 py-3 text-sm text-ivory-300">
              This search is broad, so we are showing the first {visibleProducts.length} matches. Add a brand, height, body type, or price filter to narrow the list and surface the best fits faster.
            </div>
          ) : null}
        </div>
        <ProductFilters filters={filters} />
      </div>
      <ProductGrid products={visibleProducts} filters={filters} resetHref="/shop" />
    </section>
  );
}
