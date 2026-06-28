import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductGrid";
import { filterProducts, shopifyQueryForFilters, type CatalogFilters } from "@/lib/catalog/filters";
import { catalogBrands, getCatalogBrand } from "@/lib/catalog/brands";
import { brandRelatedLinks, brandSeoProfile, buildBrandMetadata, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getProducts } from "@/lib/shopify/storefront";

export function generateStaticParams() {
  return catalogBrands.map((brand) => ({ brand: brand.collectionHandle }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: handle } = await params;
  const brand = getCatalogBrand(handle);
  if (!brand) return {};
  return buildBrandMetadata(brand);
}

export default async function BrandHubPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: handle } = await params;
  const brand = getCatalogBrand(handle);
  if (!brand) notFound();

  const filters: CatalogFilters = { brand: brand.value };
  const products = await getProducts({ query: shopifyQueryForFilters(filters), first: 600 });
  const filtered = filterProducts(products, filters);
  const profile = brandSeoProfile(brand);
  const relatedLinks = brandRelatedLinks(brand);
  const structuredData = buildBrandStructuredData(brand, filtered);

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {structuredData.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}

      <div className="shop-visual-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Brand hub</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">{brand.label} Dolls</h1>
          <p className="mt-3 max-w-3xl text-ivory-400">{profile.intro}</p>
          <p className="mt-3 text-sm font-semibold text-gold-200">{filtered.length} DollWow listings in this brand view</p>
        </div>
      </div>

      <nav aria-label={`${brand.label} related guides`} className="mb-8 flex flex-wrap gap-3">
        {relatedLinks.map((link) => (
          <Link key={`${link.href}-${link.label}`} href={link.href} className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
            {link.label}
          </Link>
        ))}
      </nav>

      <section className="mb-8 overflow-hidden rounded-[8px] border border-gold-500/14 bg-ink-900/64" aria-labelledby="brand-comparison-heading">
        <div className="border-b border-gold-500/12 p-5">
          <p className="text-sm uppercase tracking-[0.16em] text-gold-300">Brand comparison</p>
          <h2 id="brand-comparison-heading" className="mt-2 text-2xl font-semibold text-ivory-50">
            How to evaluate {brand.label}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-ink-950/60 text-ivory-100">
              <tr>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">Factor</th>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">What to check</th>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">DollWow path</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Model fit", "Compare height, weight, measurements, body type, and material before judging the photos.", "Use filters and product pages to compare facts across current listings."],
                ["Custom options", "Options can vary by body, head, material, and supplier rules.", "Ask support to confirm product-specific options and conflicts before checkout."],
                ["Final cost", "Base price can change with options, shipping path, stock status, and support-confirmed details.", "Use the price-match and cost guide paths before ordering."]
              ].map(([factor, check, path]) => (
                <tr key={factor} className="border-b border-gold-500/10 last:border-b-0">
                  <td className="px-5 py-4 font-semibold text-ivory-100">{factor}</td>
                  <td className="px-5 py-4 leading-6 text-ivory-400">{check}</td>
                  <td className="px-5 py-4 leading-6 text-ivory-300">{path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ProductGrid products={filtered} filters={filters} resetHref={`/brands/${brand.collectionHandle}`} />

      <section className="mt-10 border-t border-gold-500/12 pt-8" aria-labelledby="brand-buyer-notes-heading">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.16em] text-gold-300">Buyer notes</p>
          <h2 id="brand-buyer-notes-heading" className="mt-2 text-2xl font-semibold text-ivory-50">
            What to confirm before choosing {brand.label}
          </h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {profile.buyerNotes.map((item) => (
            <article key={item.title} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-gold-500/12 pt-8" aria-labelledby="brand-faq-heading">
        <h2 id="brand-faq-heading" className="text-2xl font-semibold text-ivory-50">
          {brand.label} buying questions
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {profile.faqs.map((item) => (
            <article key={item.question} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-6">
        <p className="text-sm uppercase tracking-[0.16em] text-gold-300">Browse more brands</p>
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
