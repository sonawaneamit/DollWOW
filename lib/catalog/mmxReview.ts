import type { Product } from '@/types/product';
import snapshot from '@/data/draft-previews/mmx-nov10.json';

export function mmxReviewEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.DOLLWOW_DOL261_PREVIEW === '1';
}

export function mmxReviewProducts(): Product[] {
  return structuredClone(snapshot.products) as unknown as Product[];
}

export const mmxHeldReviews = snapshot.held;
export const mmxReviewDate = snapshot.reviewedAt;
