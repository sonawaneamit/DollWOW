// Comparison-only quotes. No cart, charge binding or live promotion imports this module.
export type SeNovemberCohort = 'tpe-custom' | 'silicone-pro-custom' | 'silicone-torso-custom' | 'warehouse' | 'held';
type OptionFacts = { id: string; label: string; priceDelta?: number; factoryExists?: boolean; purchasable?: boolean; priceVerified?: boolean; displayable?: boolean };
type GroupFacts = { id: string; visibleWhen?: unknown };
type ParentFacts = { cohort: SeNovemberCohort; bodyCode?: string; menuSha256: string };
type Rule = readonly [group: string, option: string, label: string, reductionPercent: number];

const tpe: readonly Rule[] = [
  ['material', 'stpe-free', 'STPE', 100],
  ['skeleton-type', 'evo-free', 'EVO', 100],
  ['breast-options', 'gel-free', 'Gel', 100],
  ['enhanced-mouth-add-on', 'with-tongue-free', 'With Tongue', 100],
  ['premium-head-body-options-multiple', 'lubricant-free-free', 'Lubricant-free', 100],
  ['premium-head-body-options-multiple', 'hyper-realism-body-painting-free', 'Hyper-realism Body Painting', 100],
  ['skin-tone', 'custom-color', 'Custom Color', 50]
];
const silicone: readonly Rule[] = [
  ['body-makeup', 'master-body-makeup', 'Master Body Makeup', 10],
  ['premium-head-body-options-multiple', 'real-skin-texture', 'Real Skin Texture', 100],
  ['premium-head-body-options-multiple', 'gel-butt-free', 'Gel', 50],
  ['premium-head-body-options-multiple', 'articulated-fingers-free', 'Articulated Fingers', 100],
  ['premium-head-body-options-multiple', 'ultra-flex-fingers', 'Ultra-flex Fingers', 100]
];

export function seNovemberReviewQuote(parent: ParentFacts, group: GroupFacts, option: OptionFacts) {
  const current = option.priceDelta;
  if (!parent.menuSha256 || typeof current !== 'number' || !Number.isFinite(current) || current < 0
    || group.visibleWhen != null || option.factoryExists === false || option.purchasable === false
    || option.priceVerified === false || option.displayable === false) return null;
  const rules = parent.cohort === 'tpe-custom' ? tpe : parent.cohort === 'silicone-pro-custom' ? silicone : [];
  let rule = rules.find(([groupId, optionId, label]) => group.id === groupId && option.id === optionId && option.label === label);
  if (parent.cohort === 'silicone-torso-custom'
    && ['ST1', 'ST2', 'ST3', 'ST4', 'ST8'].includes(parent.bodyCode ?? '')
    && group.id === 'premium-head-body-options-multiple' && option.id === 'gel-butt-free' && option.label === 'Gel') {
    rule = ['premium-head-body-options-multiple', 'gel-butt-free', 'Gel', 50];
  }
  if (!rule) return null;
  return { current, proposed: Math.round(current * (100 - rule[3])) / 100,
    reductionPercent: rule[3], menuSha256: parent.menuSha256, checkoutReady: false as const };
}

export function seNovemberLightweightReviewQuote(parent: ParentFacts, group: GroupFacts & { label: string }, option: OptionFacts,
  selections: { materialId: string; headMaterial: 'tpe' | 'silicone'; skinTone: string }) {
  if (parent.cohort !== 'tpe-custom' || !['157H', '161F', '163E'].includes(parent.bodyCode ?? '')
    || !parent.menuSha256 || group.visibleWhen != null || group.id !== 'body-weight' || group.label !== 'Body Weight'
    || option.id !== 'lstpe-lightweight' || option.label !== 'LSTPE Lightweight Upgrade' || option.priceDelta !== 100
    || option.factoryExists !== true || option.priceVerified !== true || option.purchasable !== true || option.displayable === false
    || selections.materialId !== 'stpe-free'
    || !['tpe', 'silicone'].includes(selections.headMaterial)
    || selections.headMaterial === 'silicone' && selections.skinTone !== 'Light Tan') return null;
  return { current: 100, proposed: 90, reductionPercent: 10, menuSha256: parent.menuSha256, checkoutReady: false as const };
}
