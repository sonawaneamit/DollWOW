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
