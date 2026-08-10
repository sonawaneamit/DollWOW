import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { CatalogPagination } from "@/components/CatalogPagination";
import {
  catalogFilterOptions,
  compactFilters,
  filterProducts,
  filtersFromSearchParams,
  getCatalogFilterLabel,
  shopifyQueryForFilters,
  type CatalogFilters
} from "@/lib/catalog/filters";
import { getProducts } from "@/lib/shopify/storefront";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";
import Link from "next/link";

export const metadata = {
  title: "Ready-to-Ship Sex Dolls",
  description: "Shop ready-to-ship sex dolls from DollWow warehouses with clear location, availability, and dispatch information."
};

export default async function WarehousePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const rawSearchParams = await searchParams;
  const filters = compactFilters({ ...filtersFromSearchParams(rawSearchParams), availability: "ready_to_ship" });
  const products = await getProducts({ query: shopifyQueryForFilters(filters), first: 600 });
  const filtersWithoutRegion = compactFilters({ ...filters, region: undefined });
  const locationEligibleProducts = filterProducts(products, filtersWithoutRegion);
  const filteredProducts = filterProducts(products, filters);
  const catalogPage = paginateCatalog(filteredProducts, catalogPageFromValue(rawSearchParams.page));
  const activeFilterLabels = Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="shop-visual-hero">
        <div>
          <p className="text-sm  text-gold-300">Doll Warehouse</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Ready-to-ship inventory</h1>
          <p className="mt-3 max-w-2xl text-ivory-400">Browse dolls already held in a warehouse for faster dispatch. We show the warehouse location and confirm availability before payment.</p>
          <p className="mt-3 text-sm font-semibold text-gold-200">{filteredProducts.length} ready-to-ship dolls · showing {catalogPage.startItem}–{catalogPage.endItem}</p>
        </div>
      </div>

      <nav className="warehouse-region-switcher" aria-label="Filter ready-to-ship dolls by warehouse location">
        <div className="warehouse-region-switcher__intro">
          <p>Ship from</p>
          <span>Choose the warehouse closest to you</span>
        </div>
        <div className="warehouse-region-switcher__options">
          <Link href={warehouseRegionHref(rawSearchParams)} className={!filters.region ? "is-active" : ""} aria-current={!filters.region ? "page" : undefined}>
            <span className="warehouse-region-switcher__globe" aria-hidden="true">◎</span>
            <span>All locations</span>
            <strong>{locationEligibleProducts.length}</strong>
          </Link>
          {catalogFilterOptions.regions.map((region) => {
            const regionFilters = compactFilters({ ...filtersWithoutRegion, region: region.value as CatalogFilters["region"] });
            const count = filterProducts(products, regionFilters).length;
            const active = filters.region === region.value;
            return (
              <Link key={region.value} href={warehouseRegionHref(rawSearchParams, region.value)} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
                <span className="warehouse-region-switcher__flag" aria-hidden="true">{region.flag}</span>
                <span>{region.shortLabel}</span>
                <strong>{count}</strong>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shop-visual-layout">
        <aside className="shop-visual-sidebar">
          <ProductFilters filters={filters} action="/warehouse" resetHref="/warehouse" variant="sidebar" defaultSort="latest" />
        </aside>
        <div className="shop-visual-main">
          <div className="shop-active-strip">
            {activeFilterLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <ProductGrid products={catalogPage.items} filters={filters} resetHref="/warehouse" />
          <CatalogPagination {...catalogPage} basePath="/warehouse" searchParams={rawSearchParams} />
        </div>
      </div>
    </section>
  );
}

function warehouseRegionHref(params: Record<string, string | string[] | undefined>, region?: string) {
  const next = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    if (key === "region" || key === "page") continue;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value) next.set(key, value);
  }
  if (region) next.set("region", region);
  return next.size ? `/warehouse?${next.toString()}` : "/warehouse";
}
