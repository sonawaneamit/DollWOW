import { afterEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ order: {} as Record<string, unknown> }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/utils/env', () => ({ env: { PASSPORT_SESSION_SECRET: 'test-only-fixture-secret-not-production' }, hasShopifyAdminEnv: () => true }));
vi.mock('@/lib/shopify/admin', () => ({ adminFetch: vi.fn(async () => ({ orders: { nodes: [state.order] } })) }));
vi.mock('@/lib/cart/exact-upgrade-pilot', () => ({ loadExactUpgradePilotBindings: async () => [
  { parentVariantId: 'doll', merchandiseId: 'head', productTitle: 'Extra head #134SC', group: 'Extra head', label: '#134SC', unitAmount: 225, currencyCode: 'USD' }
] }));
import { listPassportsForOwner } from '@/lib/passport/repository';

function setup(withHead = true, quantity = 1) {
  vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('DOLLWOW_EXACT_UPGRADE_PILOT', '1');
  state.order = {
    id: 'test-order', name: 'TEST-NOT-REAL', createdAt: '2026-09-14T00:00:00Z', email: 'fixture@example.test', displayFinancialStatus: 'PAID',
    lineItems: { pageInfo: { hasNextPage: false }, nodes: [
      { id: 'doll-line', title: 'Lita', quantity, currentQuantity: quantity,
        product: { id: 'product', handle: 'fixture-doll', tags: [] }, variant: { id: 'doll' }, customAttributes: [
          { key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' }, { key: '_DollWOW_build_id', value: 'build-a' },
          { key: 'Included: Skin tone', value: 'Tan' }, { key: 'DollWow Add Extra Head', value: '#134SC (+$225)' }
        ] },
      ...(withHead ? [{ id: 'head-line', title: 'Extra head #134SC', quantity, currentQuantity: quantity,
        product: { id: 'head-product', handle: 'fixture-head', tags: ['dollwow-system', 'custom-option-charge'] }, variant: { id: 'head' },
        customAttributes: [{ key: '_DollWOW_build_id', value: 'build-a' }] }] : [])
    ] }
  };
}
afterEach(() => vi.unstubAllEnvs());
describe('Passport consumes actual named order lines', () => {
  it('creates one passport per doll, not per extra head', async () => {
    setup(true, 2);
    const passports = await listPassportsForOwner('fixture@example.test');
    expect(passports).toHaveLength(2);
    expect(passports[0].id).not.toBe(passports[1].id);
    expect(passports[0].build_record['Purchased upgrades']).toBe('Extra head #134SC');
    expect(passports[0].build_record['Included: Skin tone']).toBe('Tan');
    expect(passports[0].build_record['Add Extra Head']).toBeUndefined();
  });
  it('never resurrects an unpaid head from the original parent description', async () => {
    setup(false);
    const passports = await listPassportsForOwner('fixture@example.test');
    expect(passports[0].build_record['Purchased upgrades']).toBe('None');
    expect(JSON.stringify(passports[0])).not.toContain('#134SC');
  });
  it('does not expose another customer order', async () => {
    setup();
    expect(await listPassportsForOwner('someone-else@example.test')).toEqual([]);
  });
  it('does not silently activate local-only named order processing in production', async () => {
    setup(); vi.stubEnv('NODE_ENV', 'production');
    await expect(listPassportsForOwner('fixture@example.test')).rejects.toThrow('not enabled');
  });
});
