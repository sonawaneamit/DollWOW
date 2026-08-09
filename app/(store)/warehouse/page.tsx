import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { compactFilters, filterProducts, filtersFromSearchParams, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = {
  title: "Ready-to-Ship Sex Dolls",
  description: "Shop ready-to-ship sex dolls from DollWow warehouses with clear location, availability, and dispatch information."
};

export default async function WarehousePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = compactFilters({ ...filtersFromSearchParams(await searchParams), availability: "ready_to_ship" });
  const products = await getProducts({ query: shopifyQueryForFilters(filters), first: 600 });
  const filteredProducts = filterProducts(products, filters);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm  text-gold-300">Doll Warehouse</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Ready-to-ship inventory</h1>
          <p className="mt-3 max-w-2xl text-ivory-400">Browse dolls already held in a warehouse for faster dispatch. We show the warehouse location and confirm availability before payment.</p>
          <p className="mt-3 text-sm font-semibold text-gold-200">{filteredProducts.length} ready-to-ship dolls</p>
        </div>
        <ProductFilters filters={filters} action="/warehouse" resetHref="/warehouse" />
      </div>
      <div className="mt-8">
        <ProductGrid products={filteredProducts} filters={filters} resetHref="/warehouse" />
      </div>
    </section>
  );
}
