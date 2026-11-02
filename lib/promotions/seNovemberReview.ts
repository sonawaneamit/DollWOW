import { isSeNovemberWindow } from './seNovember2026';

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

type StockPriceSnapshot = {
  productId: string;
  variantId: string;
  currency: string;
  priceCents: number;
  compareAtPriceCents: number | null;
};

export type SeNovemberStockReviewInput = {
  baseline: StockPriceSnapshot;
  observed: StockPriceSnapshot;
  region: 'US' | 'EU';
  material: 'silicone-pro' | 'stpe';
  baselineReceiptSha256: string;
  sourceMappingSha256: string;
  sourcePriceAlreadyDiscounted: boolean;
  existingPromotionIds: readonly string[];
};

function validStockSnapshot(value: StockPriceSnapshot) {
  return /^gid:\/\/shopify\/Product\/\d+$/.test(value.productId)
    && /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(value.variantId)
    && value.currency === 'USD'
    && Number.isSafeInteger(value.priceCents) && value.priceCents > 0
    && value.priceCents <= Math.floor(Number.MAX_SAFE_INTEGER / 90)
    && (value.compareAtPriceCents === null
      || Number.isSafeInteger(value.compareAtPriceCents) && value.compareAtPriceCents >= value.priceCents);
}

function sameStockSnapshot(left: StockPriceSnapshot, right: StockPriceSnapshot) {
  return left.productId === right.productId && left.variantId === right.variantId
    && left.currency === right.currency && left.priceCents === right.priceCents
    && left.compareAtPriceCents === right.compareAtPriceCents;
}

// Digests bind retained evidence; they do not independently certify source eligibility.
export function seNovemberStockReviewPlan(input: SeNovemberStockReviewInput) {
  const { baseline, observed } = input;
  if (!validStockSnapshot(baseline) || !validStockSnapshot(observed)
    || !sameStockSnapshot(baseline, observed)
    || !['US', 'EU'].includes(input.region) || !['silicone-pro', 'stpe'].includes(input.material)
    || !/^[a-f0-9]{64}$/.test(input.baselineReceiptSha256)
    || !/^[a-f0-9]{64}$/.test(input.sourceMappingSha256)
    || input.sourcePriceAlreadyDiscounted !== false
    || !Array.isArray(input.existingPromotionIds) || input.existingPromotionIds.length !== 0
    || baseline.compareAtPriceCents !== null && baseline.compareAtPriceCents > baseline.priceCents) return null;

  const original = Object.freeze({ ...baseline });
  const promotional = Object.freeze({ ...baseline, priceCents: Math.round(baseline.priceCents * 90 / 100) });
  return Object.freeze({
    original, promotional,
    baselineReceiptSha256: input.baselineReceiptSha256,
    sourceMappingSha256: input.sourceMappingSha256,
    retailReductionPercent: 10 as const,
    checkoutReady: false as const,
    automaticWriteConfigured: false as const,
    costAndMarginVerified: false as const
  });
}

// Desired preview state only: restoration still requires fresh ownership/conflict checks.
export function seNovemberStockReviewTransition(
  plan: NonNullable<ReturnType<typeof seNovemberStockReviewPlan>>,
  observed: StockPriceSnapshot,
  now: Date
) {
  if (!Number.isFinite(now.getTime())) return null;
  const target = isSeNovemberWindow(now) ? plan.promotional : plan.original;
  if (sameStockSnapshot(observed, target)) return { action: 'none' as const, target };
  const expected = isSeNovemberWindow(now) ? plan.original : plan.promotional;
  if (!sameStockSnapshot(observed, expected)) return null;
  return { action: 'review-write' as const, expected, target, requiresCoordinatedWindow: true as const };
}
