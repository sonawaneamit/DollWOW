import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLearnAuthor, getLearningArticles } from "@/lib/learn/content";

export const metadata: Metadata = {
  title: "DollWow Learning Center",
  description: "Practical DollWow guides for comparing materials, pricing, shipping, privacy, customization, reviews, and product fit before buying.",
  alternates: { canonical: "/learn" }
};

export default async function LearnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const articles = getLearningArticles();
  const categories = Array.from(new Set(articles.map((article) => article.category)));
  const params = await searchParams;
  const selectedCategory = categoryFromParam(params.category, categories);
  const visibleArticles = selectedCategory ? articles.filter((article) => article.category === selectedCategory) : articles;

  return (
    <main>
      <section className="tone-section" data-tone="deep">
        <div className="tone-inner">
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Learning Center</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">Private, practical buying guides for expensive decisions</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">
            Compare material, price, size, shipping, reviews, customization, and support before checkout. Every guide is written for buyers who want clear facts without fake reviews or pressure.
          </p>
          <div className="mt-7">
            <Link href="#guides" className="rounded-[12px] bg-gold-300 px-4 py-2.5 text-sm font-semibold text-[#1f120b] transition hover:bg-gold-200">
              See guides
            </Link>
          </div>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <div className="flex flex-wrap gap-2" aria-label="Learning Center categories">
            <Link
              href="/learn#guides"
              className={categoryPillClass(!selectedCategory)}
            >
              All guides
            </Link>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/learn?category=${encodeURIComponent(category)}#guides`}
                className={categoryPillClass(selectedCategory === category)}
              >
                {category}
              </Link>
            ))}
          </div>

          <div id="guides" className="mt-8 scroll-mt-28">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-gold-700">{selectedCategory || "All guides"}</p>
                <h2 className="mt-2 text-3xl font-semibold text-ink-950">{visibleArticles.length} guides</h2>
              </div>
              {selectedCategory ? (
                <Link href="/learn#guides" className="text-sm font-semibold text-ink-700 underline underline-offset-4 transition hover:text-gold-700">
                  Clear filter
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleArticles.map((article) => {
              const author = getLearnAuthor(article.author);
              return (
                <article key={article.slug} className="tone-card overflow-hidden rounded-[8px]">
                  {article.featuredImage ? (
                    <Link href={`/learn/${article.slug}`} className="relative block aspect-[3/2] bg-ink-900">
                      <Image src={article.featuredImage} alt={article.featuredImageAlt} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                    </Link>
                  ) : null}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">{article.category}</p>
                    <h2 className="mt-3 text-xl font-semibold leading-tight text-ink-950">
                      <Link href={`/learn/${article.slug}`}>{article.title}</Link>
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-ink-700">{article.excerpt}</p>
                    <Link href={`/learn/${article.slug}`} className="mt-5 inline-flex rounded-[12px] bg-ink-950 px-4 py-2 text-sm font-semibold text-ivory-50 transition hover:bg-ink-800">
                      Read guide
                    </Link>
                    <div className="mt-5 border-t border-gold-500/14 pt-4 text-sm text-ink-700">
                      <p className="font-semibold text-ink-950">
                        <Link href={`/editorial-policy#${article.author}`} className="transition hover:text-gold-700">
                          {article.authorDisplayName}
                        </Link>
                      </p>
                      <p>{author?.shortBio ?? article.authorTitle}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function categoryFromParam(value: string | string[] | undefined, categories: string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  const decoded = decodeURIComponent(raw);
  return categories.includes(decoded) ? decoded : "";
}

function categoryPillClass(active: boolean) {
  const base = "rounded-full border px-3 py-1 text-sm font-semibold transition";
  return active
    ? `${base} border-[#6f3a22] bg-[#6f3a22] text-[#fff7ef] shadow-[0_8px_20px_rgba(111,58,34,0.18)] hover:bg-[#5c2f1d]`
    : `${base} border-[#d8bfb0] bg-[#fff7ef]/50 text-[#24120d] hover:border-[#b98967] hover:bg-[#fff7ef]/72`;
}
