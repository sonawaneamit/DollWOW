import { describe, expect, it } from 'vitest';
import { sampleProducts } from '@/lib/data/sample-products';
import { gynoidBodyVersionMappings, verifiedGynoidBodyVersion } from '@/lib/catalog/gynoid-body-versions';
import type { Product } from '@/types/product';

function product(index = 0): Product {
  const row = gynoidBodyVersionMappings[index];
  return {
    ...structuredClone(sampleProducts[0]), id: row.productId, handle: row.handle,
    variants: [
      { id: row.standardVariantId, title: 'Standard', availableForSale: true,
        selectedOptions: [{ name: 'Body version', value: 'Standard' }],
        price: { amount: String(row.standardUSD), currencyCode: 'USD' } },
      { id: row.deluxeVariantId, title: 'Deluxe', availableForSale: true,
        selectedOptions: [{ name: 'Body version', value: 'Deluxe' }],
        price: { amount: String(row.deluxeUSD), currencyCode: 'USD' } }
    ]
  };
}

describe('exact approved Gynoid body versions', () => {
  it.each([0, 1])('binds both versions to retained parent %i and the actual fetched variant', index => {
    const p = product(index), row = gynoidBodyVersionMappings[index];
    const before = structuredClone(p);
    expect(verifiedGynoidBodyVersion(p, p.variants[0].id)).toEqual({
      version: 'Standard', model: row.model, priceUSD: row.standardUSD, bodyWeightKg: row.standardWeightKg
    });
    expect(verifiedGynoidBodyVersion(p, p.variants[1].id)).toEqual({
      version: 'Deluxe', model: row.model, priceUSD: row.deluxeUSD, bodyWeightKg: row.deluxeWeightKg
    });
    expect(p).toEqual(before);
  });

  it.each([
    ['wrong handle', (p: Product) => { p.handle += '-other'; }],
    ['wrong parent ID', (p: Product) => { p.id += '1'; }],
    ['synthetic Deluxe ID', (p: Product) => { p.variants[1].id = 'preview:deluxe'; }],
    ['duplicate IDs', (p: Product) => { p.variants[1].id = p.variants[0].id; }],
    ['missing Deluxe', (p: Product) => { p.variants.pop(); }],
    ['unreviewed extra variant', (p: Product) => { p.variants.push({ ...p.variants[1], id: 'gid://shopify/ProductVariant/888' }); }],
    ['changed Standard ID', (p: Product) => { p.variants[0].id = 'gid://shopify/ProductVariant/777'; }],
    ['unregistered real Deluxe ID', (p: Product) => { p.variants[1].id = 'gid://shopify/ProductVariant/888'; }],
    ['wrong Standard price', (p: Product) => { p.variants[0].price.amount = '1'; }],
    ['wrong Deluxe price', (p: Product) => { p.variants[1].price.amount = '5299'; }],
    ['non-USD pricing', (p: Product) => { p.variants[1].price.currencyCode = 'EUR'; }],
    ['head named Deluxe', (p: Product) => { p.variants[1].selectedOptions = [{ name: 'Head', value: 'Deluxe' }]; }],
    ['extra option axis', (p: Product) => { p.variants[1].selectedOptions.push({ name: 'Head', value: 'Lisa' }); }],
    ['duplicate Standard version', (p: Product) => { p.variants[1].selectedOptions[0].value = 'Standard'; }]
  ] as const)('fails closed for %s', (_name, change) => {
    const p = product(); change(p);
    expect(() => verifiedGynoidBodyVersion(p, p.variants[0].id)).toThrow();
  });

  it('does not treat a similar vendor, model or head name as an exact mapping', () => {
    const p = product(); p.id = 'gid://shopify/Product/111'; p.handle += '-jiayi';
    p.variants[0].id = 'gid://shopify/ProductVariant/222';
    expect(verifiedGynoidBodyVersion(p, p.variants[0].id)).toBeNull();
  });
  it('rejects a variant belonging to another product', () => {
    expect(() => verifiedGynoidBodyVersion(product(), 'gid://shopify/ProductVariant/222')).toThrow();
  });
});
