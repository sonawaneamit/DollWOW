import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { ActiveCatalogFilters } from "@/components/ActiveCatalogFilters";
import { CatalogPagination } from "@/components/CatalogPagination";
import { LocationFilter } from "@/components/LocationFilter";
import { activeFilterCount, canonicalShopCollectionHandle, collectionPresets, compactFilters, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, isStandaloneHeadCatalogProduct } from "@/lib/catalog/filters";
import { buildCollectionMetadata, buildCollectionStructuredData, collectionBuyerNotes, collectionComparisonRows, collectionFaqItems, collectionIntro, collectionRelatedLinks, collectionUsesPlainGuidance } from "@/lib/catalog/collectionSeo";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";
import Link from "next/link";
import { CareForLifePanel } from "@/components/care/CareForLifePanel";
import { MobileHeroIntro } from "@/components/MobileHeroIntro";
import { brandCollectionRedirectHref } from "@/lib/catalog/brands";
import { notFound, permanentRedirect } from "next/navigation";
import { storefrontFeatureProducts } from "@/lib/catalog/featured";
import { TpeMaterialLabels } from "@/components/TpeMaterialLabels";
import { CollectionDisclosure } from "@/components/CollectionDisclosure";
import { GuideLinkRow } from "@/components/GuideLinkRow";
import { ContextualCatalogLinks } from '@/components/ContextualCatalogLinks';
import { catalogContextualLinks, contextualLinksEnabled } from '@/lib/catalog/contextualLinks';
import { CatalogSelectionSummary, batchCSelectionSummaryEnabled } from '@/components/CatalogSelectionSummary';

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { collection } = await params;
  const canonicalCollection = canonicalShopCollectionHandle(collection);
  const preset = collectionPresets[canonicalCollection];
  if (!preset) notFound();
  const metadata = buildCollectionMetadata(canonicalCollection, preset, await searchParams);
  return batchCSelectionSummaryEnabled(`/shop/${canonicalCollection}`)
    ? { ...metadata, robots: { index: false, follow: false } }
    : metadata;
}

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { collection } = await params;
  const brandDestination = brandCollectionRedirectHref(collection);
  if (brandDestination) permanentRedirect(brandDestination);
  const canonicalCollection = canonicalShopCollectionHandle(collection);
  if (canonicalCollection !== collection) permanentRedirect(`/shop/${canonicalCollection}`);
  const rawSearchParams = await searchParams;
  const paramsFilters = filtersFromSearchParams(rawSearchParams);
  const preset = collectionPresets[collection];
  if (!preset) notFound();
  const filters = compactFilters({ ...preset.filters, ...paramsFilters });
  const showSelectionSummary = batchCSelectionSummaryEnabled(`/shop/${canonicalCollection}`);
  const products = await getSeoCatalogProducts({ first: 5000, includeDollVueEligibility: filters.dollVue === 'enabled', strict: showSelectionSummary });
  const collectionProducts = collection === "silicone" ? products.filter(product => !isStandaloneHeadCatalogProduct(product)) : products;
  const filteredProducts = filterProducts(collectionProducts, filters);
  const filtered = collection === "new-sex-dolls" ? storefrontFeatureProducts(filteredProducts) : filteredProducts;
  const catalogPage = paginateCatalog(filtered, catalogPageFromValue(rawSearchParams.page));
  const structuredData = buildCollectionStructuredData({ handle: collection, preset, products: showSelectionSummary ? catalogPage.items : filtered }, { visiblePage: showSelectionSummary });
  const relatedLinks = collectionRelatedLinks(collection, preset);
  const buyerNotes = collectionBuyerNotes(collection, preset);
  const comparisonRows = collectionComparisonRows(collection, preset);
  const faqItems = collectionFaqItems(collection, preset);
  const plainGuidance = collectionUsesPlainGuidance(collection);
  const activeFilterLabels = Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];
  const hasActiveFilters = activeFilterCount(filters) > 0;
  const isReadyToShip = collection === "ready-to-ship";

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {structuredData.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}
      <div className="shop-visual-hero collection-hero">
        <div>
          <p className="text-sm  text-gold-300">Collection</p>
          <h1 className="collection-hero__title mt-2 text-4xl font-semibold capitalize text-ivory-50">{preset.title}</h1>
          <MobileHeroIntro>{collectionIntro(preset, collection)}</MobileHeroIntro>
          {showSelectionSummary ? <CatalogSelectionSummary products={catalogPage.items} /> : null}
          <p className="mt-3 text-sm font-semibold text-gold-200">{filtered.length} dolls · showing {catalogPage.startItem}–{catalogPage.endItem}</p>
        </div>
      </div>
      {relatedLinks.length ? (
        <GuideLinkRow label={`${preset.title} buying guides`} className="collection-guide-links mb-6 flex flex-wrap gap-3" tabIndex={0} wrapWithoutJavaScript={["curvy-dolls", "brunette-dolls", "anime-dolls"].includes(canonicalCollection)} previewFocusScrolling={plainGuidance || process.env.VERCEL_ENV === "preview"}>
          {relatedLinks.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
              {link.label}
            </Link>
          ))}
        </GuideLinkRow>
      ) : null}
      {isReadyToShip ? (
        <div className="mb-6">
          <LocationFilter currentRegion={filters.region} basePath={`/shop/${collection}`} />
        </div>
      ) : null}
      <div className="shop-visual-layout">
        <aside className="shop-visual-sidebar">
          <ProductFilters filters={filters} action={`/shop/${collection}`} resetHref={`/shop/${collection}`} variant="sidebar" defaultSort="latest" />
        </aside>
        <div id="collection-products" className="shop-visual-main scroll-mt-28">
          {showSelectionSummary && collection === "curvy-dolls" ? (
            <ActiveCatalogFilters filters={filters} preset={preset.filters} raw={rawSearchParams} basePath="/shop/curvy-dolls" />
          ) : hasActiveFilters ? (
            <div className="shop-active-strip">
              {activeFilterLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          ) : null}
          <ProductGrid products={catalogPage.items} filters={filters} resetHref={`/shop/${collection}`} showListedWeight={showSelectionSummary} />
          <CatalogPagination {...catalogPage} basePath={`/shop/${collection}`} searchParams={rawSearchParams} />
        </div>
      </div>
      {contextualLinksEnabled(`/shop/${collection}`) ? <ContextualCatalogLinks links={catalogContextualLinks(`/shop/${collection}`, filtered)} /> : null}
      <CollectionDisclosure id="collection-comparison-heading" eyebrow="Buyer comparison" title="Why compare this collection on DollWow">
        {plainGuidance ? (
          <ul className="space-y-4 pl-5 text-base leading-7 text-text-dim list-disc">
            {comparisonRows.map((row) => <li key={row.factor}><strong className="text-text">{row.factor}.</strong> {row.whyItMatters} {row.dollWowAdvantage}</li>)}
          </ul>
        ) : comparisonRows.length ? (
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
        ) : null}
        <div className="mt-6">
          {plainGuidance ? <p className="text-sm leading-6 text-text-dim">Care for Life includes a year of ownership support and ongoing repair guidance. <Link href="/care-for-life" className="text-accent underline underline-offset-4">Read the coverage details.</Link></p> : <CareForLifePanel compact />}
        </div>
      </CollectionDisclosure>
      {buyerNotes.length ? (
        <CollectionDisclosure id="collection-buyer-notes-heading" eyebrow="How to compare" title="What to check before choosing from this collection">
          {collection === "tpe" ? <TpeMaterialLabels /> : null}
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {buyerNotes.map((item) => (
              <article key={item.title} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
                <h3 className="text-base font-semibold text-ivory-100">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ivory-400">{item.body}</p>
              </article>
            ))}
          </div>
        </CollectionDisclosure>
      ) : null}
      {faqItems.length ? (
        <CollectionDisclosure id="collection-faq-heading" title="Buying questions">
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
                <h3 className="text-base font-semibold text-ivory-100">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-ivory-400">{item.answer}</p>
              </article>
            ))}
          </div>
        </CollectionDisclosure>
      ) : null}
    </section>
  );
}
