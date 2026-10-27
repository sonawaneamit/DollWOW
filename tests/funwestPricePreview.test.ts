import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import manifest from '@/data/pricing/dol276-funwest-preview.json';
import { sampleProducts } from '@/lib/data/sample-products';
import { applyFunwestPricePreview, assertPricePreviewReadOnly, pricePreviewSourceProduct } from '@/lib/catalog/funwestPricePreview';
import type { Product } from '@/types/product';

function source(row = manifest[0]): Product {
  const price = { amount: row.before.toFixed(2), currencyCode: 'USD' };
  return { ...sampleProducts[0], id: row.id, handle: row.handle,
    variants: row.variantIds.map(id => ({ ...sampleProducts[0].variants[0], id, price })),
    priceRange: { minVariantPrice: price, maxVariantPrice: price },
    extended: { ...sampleProducts[0].extended, brand: 'FunWest Dolls' } };
}
beforeEach(() => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('DOLLWOW_FUNWEST_PRICE_PREVIEW', '1');
});
afterEach(() => vi.unstubAllEnvs());

describe('DOL-276 isolated price preview', () => {
  it('covers exactly the approved 164 unique products and variants', () => {
    expect(manifest).toHaveLength(164);
    expect(new Set(manifest.map(row => row.id)).size).toBe(164);
    expect(new Set(manifest.flatMap(row => row.variantIds)).size).toBe(164);
    for (const row of manifest) {
      const product = source(row);
      const original = structuredClone(product);
      const preview = applyFunwestPricePreview(product);
      expect(preview.variants[0].price.amount).toBe(row.after.toFixed(2));
      expect(preview.priceRange.minVariantPrice.amount).toBe(row.after.toFixed(2));
      expect(preview.priceRange.maxVariantPrice.amount).toBe(row.after.toFixed(2));
      expect(product).toEqual(original);
      expect(pricePreviewSourceProduct({ ...preview })).toBe(product);
      expect(preview.extended).toBe(product.extended);
      expect(row.after - row.before).toBeGreaterThan(100);
    }
  });
  it.each(['production', 'development', ''])('never overrides or blocks %s even with flag set', env => {
    vi.stubEnv('VERCEL_ENV', env);
    const product = source();
    expect(applyFunwestPricePreview(product)).toBe(product);
    expect(() => assertPricePreviewReadOnly()).not.toThrow();
  });
  it('leaves other previews unchanged unless explicitly enabled', () => {
    vi.stubEnv('DOLLWOW_FUNWEST_PRICE_PREVIEW', '0');
    const product = source();
    expect(applyFunwestPricePreview(product)).toBe(product);
    expect(() => assertPricePreviewReadOnly()).not.toThrow();
  });
  it('does not touch other products, brands or mismatched identities', () => {
    for (const product of [sampleProducts[0], { ...source(), handle: 'another-handle' },
      { ...source(), extended: { brand: 'MD Doll' } }]) expect(applyFunwestPricePreview(product)).toBe(product);
  });
  it('supports lightweight search/card payloads with verified price ranges', () => {
    expect(applyFunwestPricePreview({ ...source(), variants: [] }).priceRange.minVariantPrice.amount).toBe(manifest[0].after.toFixed(2));
  });
  it('fails closed on changed variant prices, IDs, ranges or currency', () => {
    for (const field of ['price', 'id', 'range', 'currency']) {
      const product = source();
      if (field === 'price') product.variants[0].price = { amount: '1', currencyCode: 'USD' };
      if (field === 'id') product.variants[0].id = 'different';
      if (field === 'range') product.priceRange = { minVariantPrice: { amount: '1', currencyCode: 'USD' }, maxVariantPrice: { amount: '1', currencyCode: 'USD' } };
      if (field === 'currency') product.variants[0].price = { amount: manifest[0].before.toFixed(2), currencyCode: 'EUR' };
      expect(() => applyFunwestPricePreview(product)).toThrow(/review/);
    }
  });
  it('blocks checkout in this preview', () => expect(() => assertPricePreviewReadOnly()).toThrow('Checkout is unavailable'));
});
