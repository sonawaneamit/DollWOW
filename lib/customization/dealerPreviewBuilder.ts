import { SE_ELF_FACTS } from './se-oct27-preview';
import gynoidApproved from '@/data/catalog/gynoid-approved-configurations.json';

// FunWest and Top Fire listings start with the step-by-step wizard expanded.
const dealerPreviewHandle = /^(funwest-dolls-|top-fire-doll-)/;

export function keepsWizardOpen(handle: string) {
  return dealerPreviewHandle.test(handle);
}

/**
 * PDP product fetch: revalidate every 60 seconds to match page-level ISR.
 * Previous { cache: "reload", revalidate: 0 } cached responses in Vercel Data Cache
 * with no expiry, causing stale prices after Shopify updates.
 */
export function dealerPreviewProductFetch(handle: string): { cache?: RequestCache; revalidate?: number } {
  return { revalidate: 60 };
}

// Internal workflow tags never belong in the public page payload.
const internalTag = /^(dollwow-test|catalog-review-hold)$/i;
export function dealerPublicTags(tags: string[] | undefined) {
  return tags ? tags.filter((tag) => !internalTag.test(tag)) : undefined;
}

