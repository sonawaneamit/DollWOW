import { expect, it } from 'vitest';
import { idoOctoberOfferForProduct, isIdoOctoberActive } from '@/lib/promotions/idoOctober2026';
import { IDO_MENU_TAG } from '@/lib/customization/ido-md';
import { withPreviewEditorialFixture } from '@/lib/catalog/previewEditorialFixture';
import type { Product } from '@/types/product';

const product = { tags: [IDO_MENU_TAG], extended: { stockStatus: 'custom' } } as Product;

it.each([
  ['2026-10-01T06:59:59Z', false], ['2026-10-01T07:00:00Z', true],
  ['2026-11-01T06:59:59Z', true], ['2026-11-01T07:00:00Z', false]
])('shows the IDO October banner on the Pacific campaign clock at %s', (clock, active) => {
  expect(isIdoOctoberActive(new Date(clock))).toBe(active);
  expect(idoOctoberOfferForProduct(product, new Date(clock))).toBe(active);
});

it('limits the banner to custom IDO factory orders', () => {
  const now = new Date('2026-10-14T12:00:00Z');
  expect(idoOctoberOfferForProduct({ ...product, extended: { stockStatus: 'ready_to_ship' } } as Product, now)).toBe(false);
  expect(idoOctoberOfferForProduct({ ...product, tags: [] } as Product, now)).toBe(false);
});

it('mirrors saved IDO editorial text on preview deployments only', () => {
  const ido = { handle: 'ido-alessia-165cm-d-cup-silicone-companion-doll', extended: {} } as Product;
  expect(withPreviewEditorialFixture(ido, 'preview').extended.editorialIntro?.heading).toBeTruthy();
  expect(withPreviewEditorialFixture(ido, 'production')).toBe(ido);
});
