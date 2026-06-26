import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { activeFilterCount, collectionPresets, compactFilters, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, requiresCatalogWideFetch, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/shopify/storefront";

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { collection } = await params;
  const paramsFilters = filtersFromSearchParams(await searchParams);
  const preset = collectionPresets[collection] || { title: collection.replace(/-/g, " "), filters: { brand: collection } };
  const filters = compactFilters({ ...preset.filters, ...paramsFilters });
  const products = await getProducts({
    query: shopifyQueryForFilters(filters),
    first: requiresCatalogWideFetch(filters) ? 2200 : 600,
    includeCustomizationGroups: Boolean(filters.query)
  });
  const filtered = filterProducts(products, filters);
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
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Collection</p>
          <h1 className="mt-2 text-4xl font-semibold capitalize text-ivory-50">{preset.title}</h1>
          <p className="mt-3 text-sm font-semibold text-gold-200">{filtered.length} dolls in this collection view</p>
          {hasActiveFilters ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <span key={label} className="rounded-full border border-gold-500/16 bg-gold-500/8 px-3 py-1 text-xs font-semibold text-ivory-200">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <ProductFilters filters={filters} action={`/shop/${collection}`} resetHref={`/shop/${collection}`} />
      </div>
      <ProductGrid products={filtered} filters={filters} resetHref={`/shop/${collection}`} />
    </section>
  );
}
