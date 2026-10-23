import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleProductCards, ArticleProductHero } from '@/components/ArticleProductCards';
import { MarkdownContent } from '@/components/MarkdownContent';
import { getComparisonReview } from '@/lib/learn/comparisonReview';
import { articleProductHandles, articleProducts, articleProductInsertionHeading } from '@/lib/learn/productCards';
import { getProductsByHandles } from '@/lib/shopify/storefront';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params, article = getComparisonReview(slug);
  return article ? {
    title: article.title, description: article.description, robots: { index: false, follow: false },
    alternates: { canonical: `https://dollwow.com/learn/${slug}` },
    openGraph: { images: [`/review/comparisons/${slug}/image`] },
    twitter: { card: 'summary_large_image', images: [`/review/comparisons/${slug}/image`] }
  } : { robots: { index: false, follow: false } };
}

export default async function ComparisonReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, article = getComparisonReview(slug);
  if (!article) notFound();
  const handles = articleProductHandles(article.body);
  const products = articleProducts(handles, await getProductsByHandles(handles, { revalidate: 120 }));
  const heading = articleProductInsertionHeading(article.body);
  return <>
    <section className="tone-section" data-tone="deep"><div className="tone-inner">
      <p className="text-sm text-gold-300">{article.category}</p>
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">{article.title}</h1>
      <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">{article.description}</p>
      <ArticleProductHero products={products} />
    </div></section>
    <section className="tone-section" data-tone="blush"><div className="tone-inner">
      <article className="mx-auto max-w-3xl">
        <ArticleProductCards products={products} label="Dolls in this guide" />
        <MarkdownContent markdown={article.body} sectionInsertions={heading ? [{
          afterHeading: heading, placement: 'after-section',
          content: <ArticleProductCards products={products} label="Compare these dolls" />
        }] : []} />
        <ArticleProductCards products={products} label="Explore these dolls" />
      </article>
    </div></section>
  </>;
}
