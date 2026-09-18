import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { namedUpgradePayloadHash, releasedNamedBindings, createReleasedNamedUpgradeCart, type NamedUpgradeRelease } from '@/lib/cart/named-upgrade-release';

function fixture(): NamedUpgradeRelease {
  const payload = { releaseId: 'test-release', parents: { 'gid://shopify/ProductVariant/1': 'shared' }, groups: {
    shared: [{ group: 'Head', label: 'Extra head', unitAmount: 225, currencyCode: 'USD', merchandiseId: 'gid://shopify/ProductVariant/2', productTitle: 'SE extra head' }]
  } };
  return { schemaVersion: 1, releaseStatus: 'APPROVED', payload,
    approval: { payloadHash: namedUpgradePayloadHash(payload), evidenceRef: 'test-evidence', reviewedAt: '2026-09-18T08:00:00Z' } };
}
describe('released checkout mappings', () => {
  it('expands only requested reviewed parents', () => {
    const result = releasedNamedBindings(fixture(), ['gid://shopify/ProductVariant/1']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ parentVariantId: 'gid://shopify/ProductVariant/1', unitAmount: 225 });
  });
  it('blocks missing approval, changed prices and unknown parents', () => {
    const release = fixture(); release.releaseStatus = 'BLOCKED';
    expect(() => releasedNamedBindings(release, ['gid://shopify/ProductVariant/1'])).toThrow('release checks');
    release.releaseStatus = 'APPROVED'; release.payload.groups.shared[0].unitAmount = 1;
    expect(() => releasedNamedBindings(release, ['gid://shopify/ProductVariant/1'])).toThrow('release checks');
    expect(() => releasedNamedBindings(fixture(), ['gid://shopify/ProductVariant/3'])).toThrow('verified checkout');
  });
  it('does not interfere with ordinary base-only carts', async () => {
    const request = vi.fn();
    expect(await createReleasedNamedUpgradeCart([{ merchandiseId: 'gid://shopify/ProductVariant/3', quantity: 1 }], [], request)).toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });
  it('leaves deferred-brand-only checkout on its existing path', async () => {
    const request = vi.fn();
    expect(await createReleasedNamedUpgradeCart([{ merchandiseId: 'gid://shopify/ProductVariant/3', quantity: 1,
      customizationCharge: { amount: 100, currencyCode: 'USD' } }], [], request)).toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });
});
