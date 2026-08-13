import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoldButton } from "@/components/GoldButton";
import { absoluteUrl, getLearnAuthor, getLearningArticles, learnArticleUrl } from "@/lib/learn/content";

export const metadata: Metadata = {
  title: "Sex Doll Buying Guides, Care & Comparisons",
  description: "Research sex doll materials, cost, size, care, shipping, customization, brands, reviews, and buyer protection in the DollWow Learning Center.",
  alternates: { canonical: "/learn" }
};

export default async function LearnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const articles = getLearningArticles();
  const categories = Array.from(new Set(articles.map((article) => article.category)));
  const params = await searchParams;
  const selectedCategory = categoryFromParam(params.category, categories);
  const visibleArticles = selectedCategory ? articles.filter((article) => article.category === selectedCategory) : articles;
  const learningCenterUrl = absoluteUrl("/learn");
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "DollWow Learning Center",
      description: metadata.description,
      url: learningCenterUrl,
      inLanguage: "en-US",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: articles.length,
        itemListElement: articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: article.title,
          url: learnArticleUrl(article.slug)
        }))
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Learning Center", item: learningCenterUrl }
      ]
    }
  ];

  return (
    <div>
      {schema.map((entry) => (
        <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}
      <section className="tone-section" data-tone="deep">
        <div className="tone-inner">
          <p className="text-sm  text-gold-300">Learning Center</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">Private, practical buying guides for expensive decisions</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">
            Compare material, price, size, shipping, reviews, customization, and support before checkout. Every guide is written for buyers who want clear facts without fake reviews or pressure.
          </p>
          <div className="mt-7">
            <Link href="#guides" className="rounded-[12px] bg-gold-300 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gold-200">
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
                <p className="text-sm  text-gold-700">{selectedCategory || "All guides"}</p>
                <h2 className="mt-2 text-3xl font-semibold text-text">{visibleArticles.length} guides</h2>
              </div>
              {selectedCategory ? (
                <Link href="/learn#guides" className="text-sm font-semibold text-ink-700 underline underline-offset-4 transition hover:text-gold-700">
                  Clear filter
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleArticles.map((article, index) => {
              const author = getLearnAuthor(article.author);
              const cardImage = article.slug === "piper-dolls-buying-guide"
                ? "/images/learn/piper-dolls-buying-guide-card.webp"
                : article.slug === "how-silicone-sex-dolls-are-made"
                  ? "/images/learn/how-silicone-sex-dolls-are-made-card.webp"
                : article.featuredImage;
              return (
                <article key={article.slug} className="tone-card overflow-hidden rounded-[8px]">
                  {cardImage ? (
                    <Link href={`/learn/${article.slug}`} className="relative block aspect-[3/2] bg-ink-900">
                      <Image src={cardImage} alt={article.featuredImageAlt} fill priority={index === 0} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                    </Link>
                  ) : null}
                  <div className="p-5">
                    <p className="text-sm font-semibold  text-gold-400">{article.category}</p>
                    <h2 className="mt-3 text-xl font-semibold leading-tight text-text">
                      <Link href={`/learn/${article.slug}`}>{article.title}</Link>
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-ink-700">{article.excerpt}</p>
                    <GoldButton href={`/learn/${article.slug}`} variant="primary" className="mt-5 min-h-0 px-4 py-2">
                      Read guide
                    </GoldButton>
                    <div className="mt-5 border-t border-gold-500/14 pt-4 text-sm text-ink-700">
                      <p className="font-semibold text-text">
                        {article.authorDisplayName}
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
    </div>
  );
}

function categoryFromParam(value: string | string[] | undefined, categories: string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";
  const decoded = decodeURIComponent(raw);
  return categories.includes(decoded) ? decoded : "";
}

function categoryPillClass(active: boolean) {
  return `learn-category-pill${active ? " is-active" : ""}`;
}
