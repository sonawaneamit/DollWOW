import type { Metadata } from "next";
import Link from "next/link";
import { CatalogPagination } from "@/components/CatalogPagination";
import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { compactFilters, filterProducts, filtersFromSearchParams, getCatalogFilterLabel } from "@/lib/catalog/filters";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";

export const metadata: Metadata = {
  title: "DollVue-enabled dolls | DollWOW",
  description: "Browse dolls currently enabled for DollVue appearance previews on DollWOW.",
  alternates: { canonical: "/shop/dollvue-enabled" },
  robots: { index: true, follow: true }
};

export default async function DollVueEnabledCollection({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = await searchParams;
  const selectedFilters = filtersFromSearchParams(rawSearchParams);
  const filters = compactFilters({
    ...selectedFilters,
    dollVue: "enabled",
    sort: selectedFilters.sort && selectedFilters.sort !== "featured" ? selectedFilters.sort : "latest"
  });
  const products = await getSeoCatalogProducts({ first: 5000 });
  const filtered = filterProducts(products, filters);
  const page = paginateCatalog(filtered, catalogPageFromValue(rawSearchParams.page));
  const activeFilterLabels = Object.entries(filters)
    .filter(([key, value]) => Boolean(value) && key !== "dollVue" && !(key === "sort" && value === "latest"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];
  const hasActiveFilters = activeFilterLabels.length > 0;

  return (
    <main className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-border pb-7">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-accent">DollVue™ enabled</p>
        <h1 className="mt-2 text-4xl font-semibold text-text sm:text-6xl">Dolls you can preview before you choose</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-dim">
          Browse the latest Irontech and Starpery dolls with supported DollVue appearance previews.
        </p>
        <Link
          href="/dollvue"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent underline decoration-accent/45 underline-offset-4 transition hover:decoration-accent"
        >
          What is DollVue? See how it works <span aria-hidden="true">→</span>
        </Link>
      </header>
      <div className="shop-visual-layout">
        <aside className="shop-visual-sidebar">
          <ProductFilters
            filters={filters}
            action="/shop/dollvue-enabled"
            resetHref="/shop/dollvue-enabled"
            variant="sidebar"
            defaultSort="latest"
            lockedDollVue
          />
        </aside>
        <div className="shop-visual-main">
          {hasActiveFilters ? (
            <div className="shop-active-strip">
              {activeFilterLabels.map((label) => <span key={label}>{label}</span>)}
            </div>
          ) : null}
          <ProductGrid products={page.items} filters={filters} resetHref="/shop/dollvue-enabled" />
          <CatalogPagination {...page} basePath="/shop/dollvue-enabled" searchParams={rawSearchParams} />
        </div>
      </div>
    </main>
  );
}
