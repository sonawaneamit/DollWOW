import { getLearningArticle } from '@/lib/learn/content';

export function isHeadCompatibilityPreviewEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.DOLLWOW_HEAD_FIT_PREVIEW === '1';
}

export function getHeadCompatibilityPreviewArticle() {
  if (!isHeadCompatibilityPreviewEnabled()) return null;
  // Only this review route may read the existing scheduled article early.
  return getLearningArticle('doll-replacement-head-compatibility', Date.parse('2026-10-30T10:00:00.000Z'));
}
