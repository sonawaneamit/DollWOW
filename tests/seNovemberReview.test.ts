import { describe, expect, it } from 'vitest';
import { seNovemberReviewQuote as quote } from '@/lib/promotions/seNovemberReview';

const parent = { cohort: 'tpe-custom' as const, menuSha256: 'observed-menu-digest' };
const group = { id: 'skin-tone' };
const option = { id: 'custom-color', label: 'Custom Color', priceDelta: 250 };

describe('Comparison-only exact SE November menu quotes', () => {
  it('compares actual retail, never reseller $100 to $50', () => {
    expect(quote(parent, group, option)).toEqual({ current: 250, proposed: 125, reductionPercent: 50, menuSha256: parent.menuSha256, checkoutReady: false });
  });
  it.each([
    ['material', 'stpe-free', 'STPE', 100], ['skeleton-type', 'evo-free', 'EVO', 50],
    ['breast-options', 'gel-free', 'Gel', 69], ['enhanced-mouth-add-on', 'with-tongue-free', 'With Tongue', 49],
    ['premium-head-body-options-multiple', 'lubricant-free-free', 'Lubricant-free', 29],
    ['premium-head-body-options-multiple', 'hyper-realism-body-painting-free', 'Hyper-realism Body Painting', 99]
  ])('uses exact primary choice %s/%s', (id, optionId, label, priceDelta) => {
    expect(quote(parent, { id }, { id: optionId, label, priceDelta })?.proposed).toBe(0);
  });
  it('does not discount free extra heads or combined paid options by a substring', () => {
    expect(quote(parent, { id: 'an-extra-free-head' }, { id: '22', label: '#22', priceDelta: 0 })).toBeNull();
    expect(quote(parent, { id: 'enhanced-mouth-add-on-for-extra-head' }, { id: 'with-tongue-free', label: 'With Tongue', priceDelta: 49 })).toBeNull();
    expect(quote(parent, { id: 'premium-head-body-options-multiple' }, { id: 'hyper-realism-body-painting-freckles', label: 'Hyper-realism Body Painting & Freckles', priceDelta: 120 })).toBeNull();
  });
  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, -1])('keeps missing or invalid delta %s unknown', priceDelta => {
    expect(quote(parent, group, { ...option, priceDelta })).toBeNull();
  });
  it('fails closed for unavailable choices, changed labels and conditional groups', () => {
    for (const field of ['factoryExists', 'priceVerified', 'purchasable', 'displayable']) expect(quote(parent, group, { ...option, [field]: false })).toBeNull();
    expect(quote(parent, { ...group, visibleWhen: { material: 'hybrid' } }, option)).toBeNull();
    expect(quote(parent, group, { ...option, label: 'Custom Color + Extras' })).toBeNull();
    expect(quote({ ...parent, menuSha256: '' }, group, option)).toBeNull();
  });
  it('keeps zero choices zero without inventing a previous price', () => {
    expect(quote(parent, group, { ...option, priceDelta: 0 })?.proposed).toBe(0);
  });
  it('does not use generic warehouse material or a held parent as an entitlement', () => {
    for (const cohort of ['warehouse', 'held'] as const) expect(quote({ ...parent, cohort }, group, option)).toBeNull();
  });
  it('uses exact torso body identity, never height proxies', () => {
    const g = { id: 'premium-head-body-options-multiple' }, o = { id: 'gel-butt-free', label: 'Gel', priceDelta: 69 };
    for (const bodyCode of ['ST1', 'ST2', 'ST3', 'ST4', 'ST8']) expect(quote({ ...parent, cohort: 'silicone-torso-custom', bodyCode }, g, o)?.proposed).toBe(34.5);
    for (const bodyCode of [undefined, 'ST2-LONG', 'ST5', 'ST6', 'ST7', '111CM']) expect(quote({ ...parent, cohort: 'silicone-torso-custom', bodyCode }, g, o)).toBeNull();
  });
  it('keeps named silicone heads paid instead of pretending they are random supplier heads', () => {
    expect(quote({ ...parent, cohort: 'silicone-pro-custom' }, { id: 'an-extra-head' }, { id: '010so', label: '#010SO', priceDelta: 225 })).toBeNull();
  });
});
