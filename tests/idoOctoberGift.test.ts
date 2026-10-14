import { expect, it } from 'vitest';
import { withIdoOctoberGift } from '@/lib/promotions/idoOctober2026';
import { IDO_MENU_TAG, isIdoMdFixedInclusion } from '@/lib/customization/ido-md';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
const product = { tags: [IDO_MENU_TAG], extended: { stockStatus: 'custom' } } as Product;
const config: BrandCustomizationConfig = { id: IDO_MENU_TAG.slice(8), brandLabel: 'IDO', leadTimeNote: '', rules: [], groups: [
  { id: 'lingerie', label: 'Lingerie', display: 'compact', selectionMode: 'single', options: [{ id: 'paid', label: 'Paid choice', priceDelta: 75, priceVerified: true }] }
] };
it.each([
  ['2026-10-01T06:59:59Z', false], ['2026-10-01T07:00:00Z', true],
  ['2026-11-01T06:59:59Z', true], ['2026-11-01T07:00:00Z', false]
])('schedules the China-order gift at %s without discounting paid lingerie', (clock, active) => {
  const priced = withIdoOctoberGift(product, config, new Date(clock));
  expect(priced.groups.some(g => g.id === 'ido-october-gifts')).toBe(active);
  expect(priced.groups[0]).toEqual(config.groups[0]);
  if (active) {
    expect(isIdoMdFixedInclusion(priced, 'ido-october-gifts', 'lingerie-set')).toBe(true);
    expect(getDefaultSelections(priced)['ido-october-gifts']).toEqual(['lingerie-set']);
    const resolved = resolveCustomization(priced, { lingerie: 'paid', 'ido-october-gifts': [] }, 2000);
    expect(resolved.selections['ido-october-gifts']).toEqual(['lingerie-set']);
    expect(resolved.totalPrice).toBe(2075);
  }
});
it('excludes overseas stock and other tags', () => {
  const now = new Date('2026-10-14T12:00:00Z');
  expect(withIdoOctoberGift({ ...product, extended: { ...product.extended, stockStatus: 'ready_to_ship' } }, config, now)).toBe(config);
  expect(withIdoOctoberGift({ ...product, tags: [] }, config, now)).toBe(config);
});
