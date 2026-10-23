import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { CatalogPagination } from "@/components/CatalogPagination";
import {
  catalogFilterOptions,
  compactFilters,
  filterProducts,
  filtersFromSearchParams,
  getCatalogFilterLabel,
  type CatalogFilters
} from "@/lib/catalog/filters";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";
import Link from "next/link";
import { CareForLifePanel } from "@/components/care/CareForLifePanel";
import { MobileHeroIntro } from "@/components/MobileHeroIntro";
import { CollectionDisclosure } from "@/components/CollectionDisclosure";
import { buildWarehouseMetadata, buildWarehouseStructuredData, warehouseBuyerNotes, warehouseFaqItems, warehouseIntro } from "@/lib/catalog/warehouseSeo";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return buildWarehouseMetadata(await searchParams);
}

export default async function WarehousePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const rawSearchParams = await searchParams;
  const filters = compactFilters({ ...filtersFromSearchParams(rawSearchParams), availability: "ready_to_ship" });
  const products = await getSeoCatalogProducts({ first: 5000 });
  const filtersWithoutRegion = compactFilters({ ...filters, region: undefined });
  const locationEligibleProducts = filterProducts(products, filtersWithoutRegion);
  const filteredProducts = filterProducts(products, filters);
  const catalogPage = paginateCatalog(filteredProducts, catalogPageFromValue(rawSearchParams.page));
  const structuredData = buildWarehouseStructuredData(filteredProducts);
  const activeFilterLabels = Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {structuredData.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}
      <div className="shop-visual-hero collection-hero">
        <div>
          <p className="text-sm text-gold-300">Ready inventory by region</p>
          <h1 className="collection-hero__title mt-2 text-4xl font-semibold text-ivory-50">US warehouse sex dolls and global ready stock</h1>
          <MobileHeroIntro>{warehouseIntro}</MobileHeroIntro>
          <p className="mt-3 text-sm font-semibold text-gold-200">{filteredProducts.length} ready-to-ship dolls · showing {catalogPage.startItem}–{catalogPage.endItem}</p>
        </div>
      </div>

      <nav aria-label="Warehouse buying guides" className="collection-guide-links mb-6 flex flex-wrap gap-3" tabIndex={0}>
        <Link href="/shop/ready-to-ship" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">All ready-to-ship dolls</Link>
        <Link href="/learn/ready-to-ship-vs-custom-sex-dolls" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Ready stock or custom build</Link>
        <Link href="/learn/discreet-sex-doll-shipping" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Discreet delivery guide</Link>
        <Link href="/shipping" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Shipping information</Link>
      </nav>

      <nav className="warehouse-region-switcher" aria-label="Filter ready-to-ship dolls by warehouse location">
        <div className="warehouse-region-switcher__intro">
          <p>Ship from</p>
          <span>Choose the warehouse closest to you</span>
        </div>
        <div className="warehouse-region-switcher__options" role="group" aria-label="Warehouse locations" tabIndex={0}>
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
        <div id="collection-products" className="shop-visual-main scroll-mt-28">
          <div className="shop-active-strip">
            {activeFilterLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <ProductGrid products={catalogPage.items} filters={filters} resetHref="/warehouse" />
          <CatalogPagination {...catalogPage} basePath="/warehouse" searchParams={rawSearchParams} />
        </div>
      </div>

      <CollectionDisclosure id="warehouse-checks-heading" eyebrow="Before you choose" title="Three checks for warehouse inventory">
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {warehouseBuyerNotes.map((item) => (
            <article key={item.title} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6"><CareForLifePanel compact /></div>
      </CollectionDisclosure>

      <CollectionDisclosure id="warehouse-faq-heading" title="Warehouse buying questions">
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {warehouseFaqItems.map((item) => (
            <article key={item.question} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.answer}</p>
            </article>
          ))}
        </div>
      </CollectionDisclosure>
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
