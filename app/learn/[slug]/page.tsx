import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import {
  buildArticleBreadcrumbStructuredData,
  buildArticleFaqStructuredData,
  buildArticleStructuredData,
  getLearnAuthor,
  getLearningArticle,
  getLearningArticles,
  learnArticleUrl
} from "@/lib/learn/content";

export function generateStaticParams() {
  return getLearningArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: [article.primaryKeyword, ...article.secondaryKeywords],
    alternates: { canonical: learnArticleUrl(article.slug) },
    openGraph: {
      title: article.title,
      description: article.description,
      url: learnArticleUrl(article.slug),
      type: "article",
      siteName: "DollWow"
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.description
    }
  };
}

export default async function LearnArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) notFound();
  const author = getLearnAuthor(article.author);
  const schema = [buildArticleStructuredData(article), buildArticleBreadcrumbStructuredData(article), buildArticleFaqStructuredData(article)].filter(Boolean);

  return (
    <main>
      {schema.map((entry) => (
        <script key={entry?.["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
      ))}

      <section className="tone-section" data-tone="deep">
        <div className="tone-inner">
          <Link href="/learn" className="text-sm font-semibold text-gold-300">
            Learning Center
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.18em] text-gold-300">{article.category}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">{article.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">{article.description}</p>
          <div className="mt-8 max-w-3xl rounded-[8px] border border-gold-500/18 bg-ivory-50/[0.05] p-5">
            <p className="text-sm font-semibold text-ivory-50">
              By {article.authorDisplayName}, {article.authorTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-ivory-300">{author?.bio}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-gold-300">Last reviewed {article.lastReviewed}</p>
          </div>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <article className="mx-auto max-w-3xl">
            <MarkdownContent markdown={article.body} />
          </article>
        </div>
      </section>
    </main>
  );
}
