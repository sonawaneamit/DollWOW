import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleProducts } from '@/lib/data/sample-products';
import { gynoidBodyVersionMappings } from '@/lib/catalog/gynoid-body-versions';

const mocks = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getProductsByVariantIds: mocks.lookup }));
import { serverValidateAndRepriceLine, serverValidateAndRepriceLines } from '@/lib/cart/server-validation';

const row = gynoidBodyVersionMappings[0];
const deluxeId = row.deluxeVariantId;
function fixture() {
  return { ...structuredClone(sampleProducts[0]), id: row.productId, handle: row.handle,
    variants: [
      { id: row.standardVariantId, title: 'Standard', availableForSale: true,
        selectedOptions: [{ name: 'Body version', value: 'Standard' }], price: { amount: '5299', currencyCode: 'USD' } },
      { id: deluxeId, title: 'Deluxe', availableForSale: true,
        selectedOptions: [{ name: 'Body version', value: 'Deluxe' }], price: { amount: '5799', currencyCode: 'USD' } }
    ]
  };
}
beforeEach(() => mocks.lookup.mockResolvedValue(new Map([[deluxeId, fixture()], [row.standardVariantId, fixture()]])));

describe('Gynoid server checkout version binding', () => {
  it('takes the actual merchandise version and drops a forged browser version', async () => {
    const result = await serverValidateAndRepriceLine({ merchandiseId: deluxeId, quantity: 1,
      attributes: [{ key: 'Body version', value: 'Standard' }] });
    expect(result.merchandiseId).toBe(deluxeId);
    expect(result.attributes).toContainEqual({ key: 'Body version', value: 'Deluxe' });
    expect(result.namedUpgradeAttributes).toContainEqual({ key: 'Body version', value: 'Deluxe' });
    expect(result.attributes).not.toContainEqual({ key: 'Body version', value: 'Standard' });
    expect(result.customizationCharge).toBeUndefined();
  });
  it('keeps the version on each parent in the batched checkout path', async () => {
    const results = await serverValidateAndRepriceLines([
      { merchandiseId: row.standardVariantId, quantity: 1 }, { merchandiseId: deluxeId, quantity: 2 }
    ]);
    expect(results.map(r => r.attributes.find(a => a.key === 'Body version')?.value)).toEqual(['Standard', 'Deluxe']);
  });
  it.each(['price', 'unavailable', 'unregistered'])('rejects an invalid %s even without structured selections', async failure => {
    const p = fixture();
    if (failure === 'price') p.variants[1].price.amount = '1';
    if (failure === 'unavailable') p.variants[1].availableForSale = false;
    if (failure === 'unregistered') p.variants.pop();
    mocks.lookup.mockResolvedValue(new Map([[deluxeId, p]]));
    await expect(serverValidateAndRepriceLine({ merchandiseId: deluxeId, quantity: 1 })).rejects.toThrow();
    await expect(serverValidateAndRepriceLines([{ merchandiseId: deluxeId, quantity: 1 }])).rejects.toThrow();
  });
});
