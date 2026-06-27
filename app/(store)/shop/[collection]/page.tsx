import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { activeFilterCount, collectionPresets, compactFilters, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, requiresCatalogWideFetch, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { buildCollectionMetadata, buildCollectionStructuredData, collectionFaqItems, collectionIntro, collectionRelatedLinks } from "@/lib/catalog/collectionSeo";
import { getProducts } from "@/lib/shopify/storefront";
import Link from "next/link";

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { collection } = await params;
  const preset = collectionPresets[collection] || { title: collection.replace(/-/g, " "), filters: { brand: collection } };
  return buildCollectionMetadata(collection, preset, await searchParams);
}

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
  const structuredData = buildCollectionStructuredData({ handle: collection, preset, products: filtered });
  const relatedLinks = collectionRelatedLinks(collection, preset);
  const faqItems = collectionFaqItems(collection, preset);
  const activeFilterLabels = Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];
  const hasActiveFilters = activeFilterCount(filters) > 0;

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {structuredData.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}
      <div className="shop-visual-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Collection</p>
          <h1 className="mt-2 text-4xl font-semibold capitalize text-ivory-50">{preset.title}</h1>
          <p className="mt-3 max-w-3xl text-ivory-400">{collectionIntro(preset, collection)}</p>
          <p className="mt-3 text-sm font-semibold text-gold-200">{filtered.length} dolls in this collection view</p>
        </div>
      </div>
      {relatedLinks.length ? (
        <nav aria-label={`${preset.title} buying guides`} className="mb-6 flex flex-wrap gap-3">
          {relatedLinks.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="shop-visual-layout">
        <aside className="shop-visual-sidebar">
          <ProductFilters filters={filters} action={`/shop/${collection}`} resetHref={`/shop/${collection}`} variant="sidebar" />
        </aside>
        <div className="shop-visual-main">
          {hasActiveFilters ? (
            <div className="shop-active-strip">
              {activeFilterLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          ) : null}
          <ProductGrid products={filtered} filters={filters} resetHref={`/shop/${collection}`} />
        </div>
      </div>
      {faqItems.length ? (
        <section className="mt-10 border-t border-gold-500/12 pt-8" aria-labelledby="collection-faq-heading">
          <h2 id="collection-faq-heading" className="text-2xl font-semibold text-ivory-50">
            Buying questions
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
                <h3 className="text-base font-semibold text-ivory-100">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-ivory-400">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
