import type { Metadata } from "next";
import Link from "next/link";
import { getLearnAuthor, getLearningArticles } from "@/lib/learn/content";

export const metadata: Metadata = {
  title: "DollWow Learning Center",
  description: "Practical DollWow guides for comparing materials, pricing, shipping, privacy, customization, reviews, and product fit before buying.",
  alternates: { canonical: "/learn" }
};

export default function LearnPage() {
  const articles = getLearningArticles();
  const categories = Array.from(new Set(articles.map((article) => article.category)));

  return (
    <main>
      <section className="tone-section" data-tone="deep">
        <div className="tone-inner">
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Learning Center</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-ivory-50 sm:text-5xl">Private, practical buying guides for expensive decisions</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">
            Compare material, price, size, shipping, reviews, customization, and support before checkout. Every guide is written for buyers who want clear facts without fake reviews or pressure.
          </p>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full border border-gold-500/18 bg-ivory-50/[0.45] px-3 py-1 text-sm font-semibold text-ink-800">
                {category}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const author = getLearnAuthor(article.author);
              return (
                <article key={article.slug} className="tone-card rounded-[8px] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">{article.category}</p>
                  <h2 className="mt-3 text-xl font-semibold leading-tight text-ink-950">
                    <Link href={`/learn/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink-700">{article.excerpt}</p>
                  <div className="mt-5 border-t border-gold-500/14 pt-4 text-sm text-ink-700">
                    <p className="font-semibold text-ink-950">{article.authorDisplayName}</p>
                    <p>{author?.shortBio ?? article.authorTitle}</p>
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
