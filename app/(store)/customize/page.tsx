import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { CatalogPagination } from "@/components/CatalogPagination";
import { compactFilters, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/shopify/storefront";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";

export const metadata = {
  title: "Custom Sex Dolls",
  description: "Shop customizable sex dolls with clear option pricing for material, skin tone, hair, eyes, skeleton features, heating, standing feet, and accessories."
};

export default async function CustomizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const rawSearchParams = await searchParams;
  const filters = compactFilters({ ...filtersFromSearchParams(rawSearchParams), availability: "custom" });
  const products = await getProducts({ query: shopifyQueryForFilters(filters), first: 3000, imageFirst: 1 });
  const filteredProducts = filterProducts(products, filters).filter((product) => product.extended.customAvailable);
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
          <p className="text-sm text-gold-300">Custom Dolls</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Choose a doll, then make it yours</h1>
          <p className="mt-3 max-w-2xl text-ivory-400">
            Browse made-to-order dolls with visual options for materials, appearance, body features, and accessories. Every build is reviewed before production.
          </p>
          <p className="mt-3 text-sm font-semibold text-gold-200">
            {filteredProducts.length} customizable dolls · showing {catalogPage.startItem}–{catalogPage.endItem}
          </p>
        </div>
      </div>

      <div className="shop-visual-layout">
        <aside className="shop-visual-sidebar">
          <ProductFilters filters={filters} action="/customize" resetHref="/customize" variant="sidebar" defaultSort="latest" />
        </aside>
        <div className="shop-visual-main">
          <div className="shop-active-strip">
            {activeFilterLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <ProductGrid products={catalogPage.items} filters={filters} resetHref="/customize" />
          <CatalogPagination {...catalogPage} basePath="/customize" searchParams={rawSearchParams} />
        </div>
      </div>
    </section>
  );
}
