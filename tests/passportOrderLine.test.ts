import { describe, expect, it } from 'vitest';
import { isPassportDollLine } from '@/lib/passport/order-line';

describe('named upgrade passport eligibility', () => {
  it.each(['SE Doll extra head #134SC', 'Vaginal irrigator', 'Reusable drying rod'])(
    'does not create a separate doll passport for %s', title => {
      expect(isPassportDollLine({ title, product: { id: 'fixture-upgrade', tags: ['dollwow-system', 'custom-option-charge'] } })).toBe(false);
    });
  it('preserves ordinary doll eligibility and existing legacy exclusions', () => {
    expect(isPassportDollLine({ title: 'SE Doll Lita B', product: { id: 'fixture-doll', tags: ['brand:se-doll'] } })).toBe(true);
    expect(isPassportDollLine({ title: 'Selected customization', product: { id: 'fixture-charge' } })).toBe(false);
    expect(isPassportDollLine({ title: 'Deleted product', product: null })).toBe(false);
  });
});
