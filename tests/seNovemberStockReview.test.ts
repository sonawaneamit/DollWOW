import { describe, expect, it } from 'vitest';
import { seNovemberStockReviewPlan as makePlan, seNovemberStockReviewTransition as transition,
  type SeNovemberStockReviewInput } from '@/lib/promotions/seNovemberReview';

const baseline = {
  productId: 'gid://shopify/Product/123', variantId: 'gid://shopify/ProductVariant/456',
  currency: 'USD', priceCents: 199999, compareAtPriceCents: null
};
const input: SeNovemberStockReviewInput = {
  baseline, observed: { ...baseline }, region: 'US', material: 'silicone-pro',
  baselineReceiptSha256: 'a'.repeat(64), sourceMappingSha256: 'b'.repeat(64),
  sourcePriceAlreadyDiscounted: false, existingPromotionIds: []
};

describe('Private SE stock price and exact restoration plan', () => {
  it('discounts cents once and restores the immutable exact baseline, not plus ten percent', () => {
    const plan = makePlan(input)!;
    expect(plan.promotional.priceCents).toBe(179999);
    expect(plan.original.priceCents).toBe(199999);
    expect(plan.checkoutReady).toBe(false);
    expect(plan.automaticWriteConfigured).toBe(false);
    expect(plan.costAndMarginVerified).toBe(false);
    expect(Object.isFrozen(plan.original)).toBe(true);
    expect(Math.round(plan.promotional.priceCents * 1.1)).not.toBe(plan.original.priceCents);
  });
  it.each(['US', 'EU'] as const)('prepares the approved retail reduction for %s without inventing dealer costs', region => {
    for (const material of ['silicone-pro', 'stpe'] as const) {
      expect(makePlan({ ...input, region, material })?.retailReductionPercent).toBe(10);
    }
  });
  it('does not compound an already adjusted price, existing campaign or compare-at offer', () => {
    expect(makePlan({ ...input, sourcePriceAlreadyDiscounted: true })).toBeNull();
    expect(makePlan({ ...input, sourcePriceAlreadyDiscounted: undefined as never })).toBeNull();
    expect(makePlan({ ...input, existingPromotionIds: ['existing-offer'] })).toBeNull();
    expect(makePlan({ ...input, baseline: { ...baseline, compareAtPriceCents: 210000 },
      observed: { ...baseline, compareAtPriceCents: 210000 } })).toBeNull();
  });
  it.each(['productId', 'variantId', 'currency', 'priceCents', 'compareAtPriceCents'] as const)(
    'stops when the current %s differs from the captured baseline', field => {
      const changed = { ...baseline, [field]: field.endsWith('Cents') ? 100 : 'changed' };
      expect(makePlan({ ...input, observed: changed })).toBeNull();
    });
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])('rejects unsafe cents %s', priceCents => {
    const changed = { ...baseline, priceCents };
    expect(makePlan({ ...input, baseline: changed, observed: changed })).toBeNull();
  });
  it('requires exact supported identities, USD and retained evidence hashes', () => {
    expect(makePlan({ ...input, sourceMappingSha256: '' })).toBeNull();
    expect(makePlan({ ...input, baselineReceiptSha256: 'not-a-digest' })).toBeNull();
    expect(makePlan({ ...input, region: 'CA' as never })).toBeNull();
    expect(makePlan({ ...input, material: 'unknown' as never })).toBeNull();
    for (const changed of [{ ...baseline, productId: '123' }, { ...baseline, currency: 'EUR' }]) {
      expect(makePlan({ ...input, baseline: changed, observed: changed })).toBeNull();
    }
  });
  it('uses campaign boundaries for desired state and makes repeated transitions no-ops', () => {
    const plan = makePlan(input)!;
    expect(transition(plan, baseline, new Date('2026-11-01T03:59:59.999Z'))?.action).toBe('none');
    expect(transition(plan, baseline, new Date('2026-11-01T04:00:00Z'))?.target).toEqual(plan.promotional);
    expect(transition(plan, plan.promotional, new Date('2026-12-07T12:00:00Z'))?.action).toBe('none');
    const expiry = transition(plan, plan.promotional, new Date('2026-12-08T05:00:00Z'))!;
    expect(expiry.action).toBe('review-write');
    expect(expiry.target).toEqual(baseline);
    expect('requiresCoordinatedWindow' in expiry && expiry.requiresCoordinatedWindow).toBe(true);
    expect(transition(plan, baseline, new Date('2026-12-08T05:00:00Z'))?.action).toBe('none');
  });
  it('never restores over another writer or accepts an invalid date', () => {
    const plan = makePlan(input)!;
    expect(transition(plan, { ...plan.promotional, priceCents: 175000 }, new Date('2026-12-09'))).toBeNull();
    expect(transition(plan, { ...plan.promotional, compareAtPriceCents: 220000 }, new Date('2026-12-09'))).toBeNull();
    expect(transition(plan, plan.original, new Date('invalid'))).toBeNull();
  });
});
