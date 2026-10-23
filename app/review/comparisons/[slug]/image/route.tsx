import { getComparisonReview } from '@/lib/learn/comparisonReview';
import { articleSocialImage } from '@/lib/learn/socialImage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, article = getComparisonReview(slug);
  if (!article?.productCards) return new Response(null, { status: 404 });
  const response = await articleSocialImage(article);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
