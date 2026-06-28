import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { activeFilterCount, collectionPresets, compactFilters, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, requiresCatalogWideFetch, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { buildCollectionMetadata, buildCollectionStructuredData, collectionBuyerNotes, collectionComparisonRows, collectionFaqItems, collectionIntro, collectionRelatedLinks } from "@/lib/catalog/collectionSeo";
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
  const buyerNotes = collectionBuyerNotes(collection, preset);
  const comparisonRows = collectionComparisonRows(collection, preset);
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
      {comparisonRows.length ? (
        <section className="mb-8 overflow-hidden rounded-[8px] border border-gold-500/14 bg-ink-900/64" aria-labelledby="collection-comparison-heading">
          <div className="border-b border-gold-500/12 p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-gold-300">Buyer comparison</p>
            <h2 id="collection-comparison-heading" className="mt-2 text-2xl font-semibold text-ivory-50">
              Why compare this collection on DollWow
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-ink-950/60 text-ivory-100">
                <tr>
                  <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">Factor</th>
                  <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">Why it matters</th>
                  <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">DollWow advantage</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.factor} className="border-b border-gold-500/10 last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-ivory-100">{row.factor}</td>
                    <td className="px-5 py-4 leading-6 text-ivory-400">{row.whyItMatters}</td>
                    <td className="px-5 py-4 leading-6 text-ivory-300">{row.dollWowAdvantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
      {buyerNotes.length ? (
        <section className="mt-10 border-t border-gold-500/12 pt-8" aria-labelledby="collection-buyer-notes-heading">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.16em] text-gold-300">How to compare</p>
            <h2 id="collection-buyer-notes-heading" className="mt-2 text-2xl font-semibold text-ivory-50">
              What to check before choosing from this collection
            </h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {buyerNotes.map((item) => (
              <article key={item.title} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
                <h3 className="text-base font-semibold text-ivory-100">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ivory-400">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
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
