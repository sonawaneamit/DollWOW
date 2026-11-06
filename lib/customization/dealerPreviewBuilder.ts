import { SE_ELF_FACTS } from './se-oct27-preview';
import greenbackApproved from '@/data/pricing/dol255-approved-prices.json';
import gynoidApproved from '@/data/catalog/gynoid-approved-configurations.json';

// FunWest and Top Fire listings start with the step-by-step wizard expanded.
const dealerPreviewHandle = /^(funwest-dolls-|top-fire-doll-)/;

export function keepsWizardOpen(handle: string) {
  return dealerPreviewHandle.test(handle);
}

/**
 * PDP product fetch for dealer previews. `cache: "reload"` is not a Next.js fetch cache mode, so the
 * response landed in the shared Vercel Data Cache with no expiry and pages fetched before a Shopify
 * data change kept rendering the old product (no head model, preset fingerprint mismatch).
 */
const greenbackChangedHandles = new Set(greenbackApproved.rows
  .filter(row => !row.hold && row.before !== row.after)
  .map(row => row.handle));

export function dealerPreviewProductFetch(handle: string): { cache: RequestCache; revalidate?: number } {
  // Newly appended Elf galleries must not retain the initial three-photo response.
  return greenbackChangedHandles.has(handle) || keepsWizardOpen(handle) || Object.hasOwn(SE_ELF_FACTS, handle) || gynoidApproved.products.some(product => product.handle === handle)
    ? { cache: "no-store" } : { cache: "reload", revalidate: 0 };
}

// Internal workflow tags never belong in the public page payload.
const internalTag = /^(dollwow-test|catalog-review-hold)$/i;
export function dealerPublicTags(tags: string[] | undefined) {
  return tags ? tags.filter((tag) => !internalTag.test(tag)) : undefined;
}

