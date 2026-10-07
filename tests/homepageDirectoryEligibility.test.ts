import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';

vi.mock('@/lib/catalog/brands', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/catalog/brands')>();
  const futureBrands = [
    { value: 'jk', label: 'JK Dolls', collectionHandle: 'jk-dolls', tags: ['jk'], aliases: ['JK Dolls'] },
    { value: 'evas', label: 'Evas Doll', collectionHandle: 'evas-dolls', tags: ['evas'], aliases: ['Evasdoll'] }
  ];
  return {
    ...actual,
    getCatalogBrand: (name: string | undefined | null) => futureBrands.find(brand =>
      [brand.value, brand.label, brand.collectionHandle, ...brand.tags, ...brand.aliases]
        .some(alias => actual.normalizeBrandText(alias) === actual.normalizeBrandText(name))
    ) ?? actual.getCatalogBrand(name)
  };
});

import { homepageBrandKey, homepageFeatureProducts, homepageNewArrivals, homepageBestSellers, homepageBrands } from '@/lib/catalog/homepage';

function product(brand: string): Product {
  return {
    id: brand, handle: 'directory-test', title: 'Test product', description: '',
    vendor: brand, productType: 'Dolls', tags: [], featuredImage: null,
    images: [], variants: [], extended: { brand },
    priceRange: {
      minVariantPrice: { amount: '1000', currencyCode: 'USD' },
      maxVariantPrice: { amount: '1000', currencyCode: 'USD' }
    }
  };
}

describe('exact homepage directory eligibility after brand registration', () => {
  it.each([
    ['JK Dolls', 'jk'], ['jk', 'jk'], ['jk-dolls', 'jk'],
    ['Evasdoll', 'evas'], ['Evas Doll', 'evas'], ['evas-dolls', 'evas']
  ])('keeps %s eligible through canonical key %s without needing a logo', (name, key) => {
    const item = product(name);
    expect(homepageBrandKey(item)).toBe(key);
    expect(homepageFeatureProducts([item])).toEqual([item]);
    expect(homepageNewArrivals([item])).toEqual([item]);
    expect(homepageBestSellers([item])).toEqual([item]);
    expect(homepageBrands([item])).toEqual([]);
  });

  it('preserves exact unregistered identities and verified base brands', () => {
    const items = ['Lusandy', 'GYNOID TECH. LTD', 'Top Fire Doll', 'WM Dolls', 'SE Doll'].map(product);
    expect(homepageFeatureProducts(items)).toEqual(items);
  });

  it('does not infer eligibility from unknown names, partial matches or parent brands', () => {
    for (const name of ['Unknown', 'Zelex', 'Zelex Dolls', 'Real Lady', 'JK Dolls collaboration', 'Evasdoll / Zelex']) {
      const item = { ...product(name), title: 'JK Dolls Evasdoll' };
      expect(homepageFeatureProducts([item]), name).toEqual([]);
    }
    expect(homepageFeatureProducts([{ ...product('Unknown'), vendor: 'JK Dolls' }])).toEqual([]);
  });
});
