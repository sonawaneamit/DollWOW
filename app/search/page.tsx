import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { productSearchScore } from "@/lib/search/catalog";
import { searchSiteContent } from "@/lib/search/content";
import { getSearchProducts } from "@/lib/shopify/storefront";
import { shopifyQueryForCatalogSearch } from "@/lib/catalog/filters";

export const metadata: Metadata = {
  title: "Search DollWow",
  description: "Search DollWow products, buying guides, care information, and customer help pages.",
  robots: { index: false, follow: true }
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const contentResults = query ? searchSiteContent(query, 100) : [];
  const productCandidates = query
    ? await getSearchProducts({ first: 250, query: shopifyQueryForCatalogSearch(query), revalidate: 86_400 })
    : [];
  const products = productCandidates
    .map((product) => ({ product, score: productSearchScore(product, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);
  const totalResults = contentResults.length + products.length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-accent">Site search</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-text sm:text-5xl">Find dolls, guides, and answers</h1>
        <form action="/search" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Search DollWow</span>
            <input name="q" defaultValue={query} placeholder="Try silicone care, Irontech, shipping..." className="h-14 w-full rounded-sm border border-border bg-surface px-4 text-lg text-text placeholder:text-text-faint focus:border-accent focus:ring-accent" />
          </label>
          <button type="submit" className="min-h-14 rounded-button bg-accent px-7 text-[17px] font-semibold text-white hover:bg-accent-hover">Search</button>
        </form>
        {query ? <p className="mt-4 text-[15px] text-text-dim">{totalResults ? `${totalResults} matches for “${query}”` : `No matches for “${query}”`}</p> : <p className="mt-4 text-[15px] text-text-dim">Search product names, brands, specifications, buying questions, care topics, and policies.</p>}
      </header>

      {contentResults.length ? (
        <section className="mt-10" aria-labelledby="site-results-heading">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
            <h2 id="site-results-heading" className="font-display text-2xl font-semibold text-text">Guides & pages</h2>
            <span className="text-sm text-text-dim">{contentResults.length} matches</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {contentResults.map((result) => (
              <Link key={result.id} href={result.href} className="group border border-border bg-surface p-5 shadow-card transition hover:border-accent">
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">{result.kind}</span>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-text group-hover:text-accent">{result.title}</h3>
                <p className="mt-2 line-clamp-3 text-[15px] leading-6 text-text-dim">{result.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {products.length ? (
        <section className="mt-12" aria-labelledby="product-results-heading">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
            <h2 id="product-results-heading" className="font-display text-2xl font-semibold text-text">Dolls</h2>
            <span className="text-sm text-text-dim">{products.length} matches</span>
          </div>
          <div className="catalog-grid mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 3} />)}
          </div>
        </section>
      ) : null}

      {query && !totalResults ? (
        <section className="mt-10 border border-border bg-surface p-6 shadow-card">
          <h2 className="text-xl font-semibold text-text">Try a broader phrase</h2>
          <p className="mt-2 text-text-dim">Search by a brand, model name, material, measurement, delivery question, or care topic.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/shop/sex-dolls" className="inline-flex min-h-11 items-center border border-border px-4 font-semibold text-text hover:border-accent">Browse all dolls</Link>
            <Link href="/learn" className="inline-flex min-h-11 items-center border border-border px-4 font-semibold text-text hover:border-accent">Browse Learning Center</Link>
            <Link href="/support" className="inline-flex min-h-11 items-center border border-border px-4 font-semibold text-text hover:border-accent">Ask DollWow</Link>
          </div>
        </section>
      ) : null}
    </main>
  );
}
