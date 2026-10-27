import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MarkdownContent } from '@/components/MarkdownContent';
import { getHeadCompatibilityPreviewArticle } from '@/lib/learn/headCompatibilityPreview';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Head Compatibility Review',
  robots: { index: false, follow: false },
};

export default function HeadCompatibilityReview() {
  const article = getHeadCompatibilityPreviewArticle();
  if (!article) notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="mb-4 text-sm text-muted">Alex</p>
      <h1 className="mb-6 text-3xl font-semibold">{article.title}</h1>
      <Image src={article.featuredImage} alt={article.featuredImageAlt} width={1200} height={675} className="mb-8 h-auto w-full" />
      <MarkdownContent markdown={article.body} />
    </main>
  );
}
