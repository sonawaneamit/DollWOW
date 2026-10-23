import { getLearningArticle } from '@/lib/learn/content';
import { articleSocialImage } from '@/lib/learn/socialImage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article?.productCards) return new Response(null, { status: 404 });
  return articleSocialImage(article);
}
