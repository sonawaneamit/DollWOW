import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { CatalogPagination } from "@/components/CatalogPagination";
import { activeFilterCount, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, requiresCatalogWideFetch, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = { title: "Shop Dolls" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = filtersFromSearchParams(params);
  const needsWideFetch = requiresCatalogWideFetch(filters);
  const products = await getProducts({
    query: shopifyQueryForFilters(filters),
    first: needsWideFetch ? 2200 : 600,
    includeCustomizationGroups: false
  });
  const filteredProducts = filterProducts(products, filters);
  const catalogPage = paginateCatalog(filteredProducts, catalogPageFromValue(params.page));
  const visibleProducts = catalogPage.items;
  const activeFilterLabels = Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];
  const hasActiveFilters = activeFilterCount(filters) > 0;

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="shop-visual-hero">
        <div>
          <p className="text-sm  text-gold-300">Shop Dolls</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Browse the catalog</h1>
          <p className="mt-3 max-w-2xl text-ivory-400">
            Filter by practical needs: delivery, material, size, weight, budget, and custom options.
            {filters.query ? ` Search: “${filters.query}”.` : ""}
          </p>
          <p className="mt-4 text-sm font-semibold text-gold-200">
            {filteredProducts.length} dolls in this view · showing {catalogPage.startItem}–{catalogPage.endItem}
          </p>
        </div>
      </div>

      <div className="shop-visual-layout">
        <aside className="shop-visual-sidebar">
          <ProductFilters filters={filters} variant="sidebar" />
        </aside>
        <div className="shop-visual-main">
          {hasActiveFilters ? (
            <div className="shop-active-strip">
              {activeFilterLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          ) : null}
          <ProductGrid products={visibleProducts} filters={filters} resetHref="/shop" />
          <CatalogPagination {...catalogPage} basePath="/shop" searchParams={params} />
        </div>
      </div>
    </section>
  );
}
