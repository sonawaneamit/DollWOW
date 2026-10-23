import { getLearningArticle } from '@/lib/learn/content';

const reviewSlugs = new Set([
  'se-doll-vs-starpery-build-comparison', 'irontech-vs-wm-build-comparison',
  'md-vs-ido-doll-build-comparison', 'funwest-vs-dolls-castle-build-comparison'
]);

export function getComparisonReview(slug: string) {
  if (process.env.VERCEL_ENV !== 'preview' || !reviewSlugs.has(slug)) return null;
  // Only this isolated preview route may read the four drafts past their release clock.
  return getLearningArticle(slug, Date.parse('2030-01-01T00:00:00Z'));
}
