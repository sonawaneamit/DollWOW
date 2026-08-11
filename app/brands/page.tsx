import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MobileHeroIntro } from "@/components/MobileHeroIntro";
import { catalogBrands, getCatalogBrand } from "@/lib/catalog/brands";
import { filterProducts } from "@/lib/catalog/filters";
import { brandSeoProfile } from "@/lib/catalog/brandSeo";
import {
  brandDirectoryChecklist,
  brandDirectoryComparisonRows,
  brandDirectoryFaqs,
  brandDirectoryIntro,
  buildBrandDirectoryStructuredData
} from "@/lib/catalog/brandDirectorySeo";
import { productPublicTitle } from "@/lib/catalog/naming";
import { protectedProductImageUrlFor } from "@/lib/catalog/productImage";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "Sex Doll Brands: Compare Manufacturers",
  description:
    "Compare sex doll brands by material, size, weight, product form, customization, availability, and buyer support using current DollWow products.",
  alternates: { canonical: "/brands" }
};

export const revalidate = 3600;

export default async function BrandsPage() {
  const products = await getSeoCatalogProducts({ first: 5000 });
  const representativeProducts = representativeProductByBrand(products);
  const structuredData = buildBrandDirectoryStructuredData(catalogBrands);

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {structuredData.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}

      <div className="shop-visual-hero">
        <div>
          <p className="text-sm text-gold-300">Manufacturer directory</p>
          <h1 className="collection-hero__title mt-2 text-4xl font-semibold text-ivory-50">Compare sex doll brands</h1>
          <MobileHeroIntro>{brandDirectoryIntro}</MobileHeroIntro>
        </div>
      </div>

      <nav aria-label="Compare dolls by buying priority" className="mb-8 flex flex-wrap gap-3">
        <Link href="/shop/tpe" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">TPE dolls</Link>
        <Link href="/shop/silicone" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Silicone dolls</Link>
        <Link href="/shop/male-dolls" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Male dolls</Link>
        <Link href="/shop/lightweight-sex-dolls" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Lightweight dolls</Link>
        <Link href="/shop/ready-to-ship" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Ready to ship</Link>
        <Link href="/help-me-choose" className="rounded-full border border-gold-500/18 bg-ink-900/72 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">Help me choose</Link>
      </nav>

      <section aria-labelledby="brand-directory-heading">
        <div className="mb-5 max-w-3xl">
          <p className="text-sm text-gold-300">Current manufacturers</p>
          <h2 id="brand-directory-heading" className="mt-2 text-2xl font-semibold text-ivory-50">Open a brand to compare real products</h2>
          <p className="mt-3 leading-7 text-ivory-400">Each page combines current DollWow listings with brand-specific questions, construction details, customization boundaries, and support paths.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {catalogBrands.map((brand) => {
          const profile = brandSeoProfile(brand);
          const product = representativeProducts.get(brand.value);
          const image = product?.featuredImage ?? product?.images[0] ?? null;
          const imageUrl = product ? protectedProductImageUrlFor(product, image, "card") : null;
          const displayTitle = product ? productPublicTitle(product) : null;
          return (
            <article key={brand.value} className="overflow-hidden rounded-[8px] border border-gold-500/14 bg-ink-900/64">
              {imageUrl && displayTitle ? (
                <Link href={`/brands/${brand.collectionHandle}`} className="relative block aspect-[2/3] overflow-hidden bg-ink-950" aria-label={`Compare ${brand.label}`}>
                  <Image src={imageUrl} alt={`${displayTitle}, an example from the current ${brand.label} catalog`} fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 94vw" className="object-contain" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pb-4 pt-12 text-xs font-semibold text-white">Example: {displayTitle}</span>
                </Link>
              ) : null}
              <div className="p-6">
                <p className="text-sm font-semibold text-gold-300">{brand.label}</p>
                <h3 className="mt-2 text-2xl font-semibold text-ivory-50">{brandCardHeading(brand.label)}</h3>
                <p className="mt-3 text-sm leading-6 text-ivory-400">{profile.positioning}</p>
                <Link
                  href={`/brands/${brand.collectionHandle}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-200 hover:text-gold-100"
                >
                  View brand and products <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-[8px] border border-gold-500/14 bg-ink-900/64" aria-labelledby="brand-comparison-heading">
        <div className="border-b border-gold-500/12 p-5">
          <p className="text-sm text-gold-300">Buyer comparison</p>
          <h2 id="brand-comparison-heading" className="mt-2 text-2xl font-semibold text-ivory-50">How to compare sex doll manufacturers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-ink-950/60 text-ivory-100">
              <tr>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">Factor</th>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">What to compare</th>
                <th className="border-b border-gold-500/12 px-5 py-3 font-semibold">How DollWow helps</th>
              </tr>
            </thead>
            <tbody>
              {brandDirectoryComparisonRows.map((row) => (
                <tr key={row.factor} className="border-b border-gold-500/10 last:border-b-0">
                  <td className="px-5 py-4 font-semibold text-ivory-100">{row.factor}</td>
                  <td className="px-5 py-4 leading-6 text-ivory-400">{row.whatToCompare}</td>
                  <td className="px-5 py-4 leading-6 text-ivory-300">{row.dollWowPath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 border-t border-gold-500/12 pt-8" aria-labelledby="brand-checklist-heading">
        <p className="text-sm text-gold-300">Before choosing a brand</p>
        <h2 id="brand-checklist-heading" className="mt-2 text-2xl font-semibold text-ivory-50">A faster way to narrow the catalog</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {brandDirectoryChecklist.map((item) => (
            <article key={item.title} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-gold-500/12 pt-8" aria-labelledby="brand-faq-heading">
        <h2 id="brand-faq-heading" className="text-2xl font-semibold text-ivory-50">Sex doll brand questions</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {brandDirectoryFaqs.map((item) => (
            <article key={item.question} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-5">
              <h3 className="text-base font-semibold text-ivory-100">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-6">
        <p className="text-sm text-gold-300">Still deciding?</p>
        <h2 className="mt-2 text-2xl font-semibold text-ivory-50">Tell us what matters most</h2>
        <p className="mt-3 max-w-3xl leading-7 text-ivory-400">Share your preferred size, material, handling limit, appearance, budget, and delivery preference through live chat or hello@dollwow.com. We will help narrow the brands and products, or check whether an approved missing model can be added.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/help-me-choose" className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-5 py-3 text-sm font-semibold text-white hover:bg-coral-400">Use the DollWow finder <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/shop/sex-dolls" className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 px-5 py-3 text-sm font-semibold text-ivory-100 hover:border-gold-300/50">Browse all dolls <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>
    </section>
  );
}

function representativeProductByBrand(products: Product[]) {
  const representatives = new Map<string, Product>();

  for (const brand of catalogBrands) {
    const fullDolls = filterProducts(products, { brand: brand.value, productForm: "full-doll" }).filter(
      (product) => product.featuredImage || product.images[0]
    );
    const allBrandProducts = fullDolls.length
      ? fullDolls
      : products.filter((product) => getCatalogBrand(product.extended.brand ?? product.vendor)?.value === brand.value && (product.featuredImage || product.images[0]));
    const representative = allBrandProducts.find((product) => product.extended.bodyType === "female") ?? allBrandProducts[0];
    if (representative) representatives.set(brand.value, representative);
  }

  return representatives;
}

function brandCardHeading(label: string) {
  return /\bdolls?$/i.test(label) ? `Compare ${label}` : `Compare ${label} dolls`;
}
