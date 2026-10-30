import { SE_ELF_FACTS } from './se-oct27-preview';
import gynoidApproved from '@/data/catalog/gynoid-approved-configurations.json';

// FunWest/Top Fire previews keep the live listing structure: the step-by-step wizard stays
// inline under the preset picker, including after a preset is chosen.
const dealerPreviewHandle = /^(funwest-dolls-|top-fire-doll-)/;

export function keepsWizardOpen(handle: string) {
  return dealerPreviewHandle.test(handle);
}

/**
 * What a preset click does to the builder layout. Collapsing the wizard and auto-scrolling to the
 * purchase box shifts the page under the pointer, so a quick second click can land on a link that
 * scrolled into place (e.g. the header logo, which goes to the homepage). Dealer previews do neither.
 */
export function presetSelectLayout(handle: string, pendingChoiceCount: number) {
  const keepOpen = keepsWizardOpen(handle);
  return { collapseWizard: !keepOpen, scrollToPurchase: !keepOpen && pendingChoiceCount === 0 };
}

/**
 * PDP product fetch for dealer previews. `cache: "reload"` is not a Next.js fetch cache mode, so the
 * response landed in the shared Vercel Data Cache with no expiry and pages fetched before a Shopify
 * data change kept rendering the old product (no head model, preset fingerprint mismatch).
 */
export function dealerPreviewProductFetch(handle: string): { cache: RequestCache; revalidate?: number } {
  // Newly appended Elf galleries must not retain the initial three-photo response.
  return keepsWizardOpen(handle) || Object.hasOwn(SE_ELF_FACTS, handle) || gynoidApproved.products.some(product => product.handle === handle)
    ? { cache: "no-store" } : { cache: "reload", revalidate: 0 };
}

// Internal workflow tags never belong in the public page payload.
const internalTag = /^(dollwow-test|catalog-review-hold)$/i;
export function dealerPublicTags(tags: string[] | undefined) {
  return tags ? tags.filter((tag) => !internalTag.test(tag)) : undefined;
}

