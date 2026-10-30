import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductFilters } from "@/components/ProductFilters";
import { CatalogPagination } from "@/components/CatalogPagination";
import { BrandAuthorizationCard } from "@/components/BrandAuthorizationCard";
import { activeFilterCount, compactFilters, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, requiresCatalogWideFetch, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { catalogBrands, getCatalogBrand, isHiddenCatalogBrand } from "@/lib/catalog/brands";
import { brandHubTitle, brandRelatedLinks, brandSeoProfile, buildBrandMetadata, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getProducts } from "@/lib/shopify/storefront";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";
import { MobileHeroIntro } from "@/components/MobileHeroIntro";
import { SeDollBrandPromotionBanner } from "@/components/promotions/SeDollSeptemberPromotion";
import { BrandHubSection, usesCompactBrandLayout } from "@/components/BrandHubSection";
import { CollectionDisclosure } from "@/components/CollectionDisclosure";
import { GuideLinkRow } from "@/components/GuideLinkRow";
import { ContextualCatalogLinks } from '@/components/ContextualCatalogLinks';
import { catalogContextualLinks, contextualLinksEnabled } from '@/lib/catalog/contextualLinks';
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { moonvaleBuyerPreviewEnabled } from "@/lib/catalog/moonvaleBuyerPreview";

// Brand pages need to reflect newly published catalog items without a full-site redeploy.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return catalogBrands.map((brand) => ({ brand: brand.collectionHandle }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: handle } = await params;
  const brand = getCatalogBrand(handle);
  if (!brand || isHiddenCatalogBrand(brand.value)) return {};
  const metadata = buildBrandMetadata(brand);
  return moonvaleBuyerPreviewEnabled(brand.value) ? { ...metadata, robots: { index: false, follow: false } } : metadata;
}

export default async function BrandHubPage({
  params,
  searchParams
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { brand: handle } = await params;
  const rawSearchParams = await searchParams;
  const brand = getCatalogBrand(handle);
  if (!brand || isHiddenCatalogBrand(brand.value)) notFound();

  const requestedFilters = filtersFromSearchParams(rawSearchParams);
  const filters = compactFilters({ ...requestedFilters, brand: brand.value });
  const showBuyerSummary = moonvaleBuyerPreviewEnabled(brand.value);
  const products = await getProducts({
    query: shopifyQueryForFilters(filters),
    first: requiresCatalogWideFetch(filters) ? 2200 : 600,
    cacheKey: `${brand.value}-release-order-v1`,
    cache: "no-store",
    strict: showBuyerSummary
  });
  const filtered = filterProducts(products, filters);
  const orderedProducts = !filters.sort || filters.sort === "latest" ? orderBySourceRelease(filtered) : filtered;
  const catalogPage = paginateCatalog(orderedProducts, catalogPageFromValue(rawSearchParams.page));
  const profile = brandSeoProfile(brand);
  const compactBrowsing = usesCompactBrandLayout(brand.value);
  const relatedLinks = brandRelatedLinks(brand);
  const structuredData = buildBrandStructuredData(brand, showBuyerSummary ? catalogPage.items : orderedProducts, { visiblePage: showBuyerSummary });
  const activeFilterLabels = Object.entries(filters)
    .filter(([key, value]) => Boolean(value) && key !== "brand")
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => getCatalogFilterLabel(key as keyof typeof filters, value as string))
    .filter(Boolean) as string[];
  const hasActiveFilters = activeFilterCount(filters) > 1;
  const authorization = brand.value === "moonvale"
    ? <div>
        <p className="text-sm leading-6 text-text-dim">
          Moonvale is SY Doll&apos;s premium silicone line. DollWOW is an authorized SY Doll dealer.{" "}
          <a href="https://www.sydolls.com/collections/moonvale-doll" target="_blank" rel="noreferrer" className="underline underline-offset-4">Moonvale at SY Doll</a>.
        </p>
        {showBuyerSummary ? <p className="mt-2 text-sm leading-6 text-text-dim">Certificate shown: SY Doll. It does not name Moonvale separately.</p> : null}
        <BrandAuthorizationCard brand="sy" variant="brand" />
      </div>
    : <BrandAuthorizationCard brand={brand.value} variant="brand" />;

  const comparison = (
      <BrandHubSection compact={compactBrowsing} comparison id="brand-comparison-heading" eyebrow="Brand comparison" title={`How to evaluate ${brand.label}`}>
        {profile.comparisonBullets ? <ul className="space-y-4 pl-5 text-base leading-7 text-text-dim list-disc">
          {profile.comparisonBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul> : <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-ink-950/60 text-ivory-100">
              <tr>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">Factor</th>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">What to check</th>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">How DollWow helps</th>
              </tr>
            </thead>
            <tbody>
              {(profile.comparisonRows ?? [
                ["Model fit", "Compare height, weight, measurements, body type, and material before judging the photos.", "Use filters and product pages to compare facts across current listings."],
                ["Custom options", "Available choices can vary by body, head, and material.", "Each product page shows model-specific options, prices, and known conflicts."],
                ["Final cost", "The starting price can change when you add custom options or accessories.", "The configurator updates the price as you build, and our price-match team can check a competitor quote."]
              ]).map(([factor, check, path]) => (
                <tr key={factor} className="border-b border-gold-500/10 last:border-b-0">
                  <td className="px-5 py-4 font-semibold text-ivory-100">{factor}</td>
                  <td className="px-5 py-4 leading-6 text-ivory-400">{check}</td>
                  <td className="px-5 py-4 leading-6 text-ivory-300">{path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
        {profile.comparisonBullets && brand.value === "tantaly" ? <p className="mt-4 text-sm"><Link href="/care-for-life" className="text-accent underline underline-offset-4">Read the Care for Life coverage details.</Link></p> : null}
      </BrandHubSection>
  );

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {structuredData.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}

      <div className="shop-visual-hero brand-hero">
        <div>
          {!showBuyerSummary ? <p className="text-sm  text-gold-300">Brand hub</p> : null}
          <h1 className="brand-hero__title mt-2 text-4xl font-semibold text-ivory-50">{brandHubTitle(brand)}</h1>
          <MobileHeroIntro>{profile.intro}</MobileHeroIntro>
          {showBuyerSummary ? <CatalogSelectionSummary products={catalogPage.items} /> : null}
          <p className="mt-3 text-sm font-semibold text-gold-200">
            Current DollWow collection
            {compactBrowsing && authorization ? <Link href="#brand-authorization-heading" className="ml-3 inline-block whitespace-nowrap underline underline-offset-4">Seller authorization</Link> : null}
          </p>
        </div>
      </div>

      {brand.collectionHandle === "se-doll" ? <SeDollBrandPromotionBanner /> : null}

      {!compactBrowsing ? authorization : null}

      <GuideLinkRow label={`${brand.label} related guides`} className={`${compactBrowsing ? "collection-guide-links mb-6" : "mb-8"} flex flex-wrap gap-3`} tabIndex={compactBrowsing ? 0 : undefined} previewFocusScrolling={compactBrowsing && (["dolls-castle", "moonvale", "tantaly"].includes(brand.value) || process.env.VERCEL_ENV === "preview")}>
        {relatedLinks.map((link) => (
          <Link key={`${link.href}-${link.label}`} href={link.href} className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
            {link.label}
          </Link>
        ))}
      </GuideLinkRow>

      {!compactBrowsing ? comparison : null}

      <div className="shop-visual-layout">
        <aside className="shop-visual-sidebar">
          <ProductFilters
            filters={filters}
            action={`/brands/${brand.collectionHandle}`}
            resetHref={`/brands/${brand.collectionHandle}`}
            variant="sidebar"
            defaultSort="latest"
            lockedBrand
          />
        </aside>
        <div id="brand-products" className={`shop-visual-main scroll-mt-28 ${compactBrowsing ? "max-sm:[&_.catalog-product-card]:w-full" : ""}`}>
          {hasActiveFilters ? (
            <div className="shop-active-strip">
              {activeFilterLabels.map((label) => <span key={label}>{label}</span>)}
            </div>
          ) : null}
          <ProductGrid products={catalogPage.items} filters={filters} resetHref={`/brands/${brand.collectionHandle}`} />
          <CatalogPagination {...catalogPage} basePath={`/brands/${brand.collectionHandle}`} searchParams={rawSearchParams} />
        </div>
      </div>

      {compactBrowsing ? comparison : null}
      {contextualLinksEnabled(`/brands/${brand.collectionHandle}`) ? <ContextualCatalogLinks links={catalogContextualLinks(`/brands/${brand.collectionHandle}`, filtered)} label="Compare materials across brands" /> : null}

      <BrandHubSection compact={compactBrowsing} id="brand-buyer-notes-heading" eyebrow="Buyer notes" title={`What to confirm before choosing ${brand.label}`}>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {profile.buyerNotes.map((item) => (
            <article key={item.title} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.body}</p>
            </article>
          ))}
        </div>
      </BrandHubSection>

      <BrandHubSection compact={compactBrowsing} id="brand-faq-heading" title={`${brand.label} buying questions`}>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {profile.faqs.map((item) => (
            <article key={item.question} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.answer}</p>
            </article>
          ))}
        </div>
      </BrandHubSection>

      {compactBrowsing && authorization ? (
        <CollectionDisclosure id="brand-authorization-heading" title="Seller authorization">
          {authorization}
        </CollectionDisclosure>
      ) : null}

      <section className="mt-10 rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-6">
        <p className="text-sm  text-gold-300">Browse more brands</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {catalogBrands
            .filter((option) => option.value !== brand.value)
            .slice(0, 11)
            .map((option) => {
              const nextBrand = getCatalogBrand(option.value);
              if (!nextBrand) return null;
              return (
                <Link key={option.value} href={`/brands/${nextBrand.collectionHandle}`} className="rounded-full border border-gold-500/18 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
                  {option.label}
                </Link>
              );
            })}
        </div>
      </section>
    </section>
  );
}

function orderBySourceRelease<T extends { extended: { sourceReleaseRank?: number } }>(products: T[]) {
  return [...products].sort((left, right) => {
    const leftRank = left.extended.sourceReleaseRank;
    const rightRank = right.extended.sourceReleaseRank;

    if (leftRank === undefined && rightRank === undefined) return 0;
    if (leftRank === undefined) return 1;
    if (rightRank === undefined) return -1;
    return rightRank - leftRank;
  });
}
