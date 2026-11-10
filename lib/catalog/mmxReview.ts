import type { Product } from '@/types/product';
import snapshot from '@/data/draft-previews/mmx-nov10.json';

export function mmxReviewEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.DOLLWOW_DOL261_PREVIEW === '1';
}

export function mmxReviewProducts(): Product[] {
  return structuredClone(snapshot.products) as unknown as Product[];
}

export function mmxReviewProduct(handle: string, environment: Record<string, string | undefined> = process.env): Product | null {
  if (!mmxReviewEnabled(environment)) return null;
  return mmxReviewProducts().find(product => product.handle === handle) ?? null;
}

export const mmxHeldReviews = snapshot.held;
export const mmxReviewDate = snapshot.reviewedAt;
