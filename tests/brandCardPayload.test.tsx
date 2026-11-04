import React from 'react';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { ProductCard } from '@/components/ProductCard';
import { sampleProducts } from '@/lib/data/sample-products';
import { getProducts } from '@/lib/shopify/storefront';
import { compactFilters, filterProducts, shopifyQueryForFilters } from '@/lib/catalog/filters';
import { paginateCatalog } from '@/lib/catalog/pagination';
import { buildBrandStructuredData } from '@/lib/catalog/brandSeo';
import { getCatalogBrand } from '@/lib/catalog/brands';
import type { Product } from '@/types/product';

vi.mock('@/components/CurrencyProvider', () => ({ DisplayMoney: ({ amount }: { amount: string }) => <span>{amount}</span> }));
vi.mock('@/components/WishlistButton', () => ({ WishlistButton: ({ entry }: { entry: unknown }) => <button data-wishlist={JSON.stringify(entry)} /> }));
vi.mock('@/components/compare/CompareButton', () => ({ CompareButton: ({ entry }: { entry: unknown }) => <button data-compare={JSON.stringify(entry)} /> }));

afterEach(() => vi.unstubAllGlobals());
const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const cards = (products: Product[]) => renderToStaticMarkup(<>{products.map(p => <ProductCard key={p.id} product={p} />)}</>);
const firstImageOnly = (p: Product) => ({ ...p, images: p.images.slice(0, 1) });
const order = (products: Product[]) => [...products].sort((a, b) => {
  const left = a.extended.sourceReleaseRank;
  const right = b.extended.sourceReleaseRank;
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  return right - left;
});

it.each([false, true])('preserves the entire card, wishlist and compare entry with featuredImage=%s', featured => {
  const images = [
    { url: '/images/home-brands/dolls-castle.png', altText: 'Brand fixture', width: 100, height: 100 },
    { url: '/images/home-brands/sedoll.png', altText: 'Other fixture', width: 100, height: 100 }
  ];
  const product = { ...sampleProducts[0], images, featuredImage: featured ? images[1] : null };
  expect(cards([firstImageOnly(product)])).toBe(cards([product]));
});

it('keeps the bounded brand read uncached without changing the shared gallery default', () => {
  const page = fs.readFileSync(new URL('../app/brands/[brand]/page.tsx', import.meta.url), 'utf8');
  const storefront = fs.readFileSync(new URL('../lib/shopify/storefront.ts', import.meta.url), 'utf8');
  expect(page).toContain('first: requiresCatalogWideFetch(filters) ? 2200 : 600');
  expect(page).toContain('imageFirst: 1');
  expect(page).toContain('cache: "no-store"');
  expect(storefront).toContain('imageFirst = 8');
});

it.skipIf(process.env.DOL328_BRAND_PAYLOAD_QA !== '1')('compares two actual read-only brand payloads without weakening guards', async () => {
  const output = 'data/exports/dol-328-2026-11-02/brand-image-parity-private.json';
  expect(fs.existsSync(output)).toBe(false);
  const brand = getCatalogBrand('dolls-castle')!;
  const filters = compactFilters({ brand: brand.value });
  const nativeFetch = globalThis.fetch;
  let bytes = 0;
  let requests = 0;
  vi.stubGlobal('fetch', async (...args: Parameters<typeof fetch>) => {
    const response = await nativeFetch(...args);
    const request = JSON.parse(String(args[1]?.body ?? '{}')) as { query?: string };
    if (request.query?.includes('query Products(')) {
      bytes += Buffer.byteLength(await response.clone().text());
      requests++;
    }
    return response;
  });
  const options = { query: shopifyQueryForFilters(filters), first: 600, cacheKey: `${brand.value}-release-order-v1`, cache: 'no-store' as const, strict: true };
  const before = await getProducts({ ...options, imageFirst: 8 });
  const beforeRead = { bytes, requests };
  bytes = 0; requests = 0;
  const after = await getProducts({ ...options, imageFirst: 1 });
  const beforeOrdered = order(filterProducts(before, filters));
  const afterOrdered = order(filterProducts(after, filters));
  const beforePage = paginateCatalog(beforeOrdered, 1);
  const afterPage = paginateCatalog(afterOrdered, 1);
  const result = {
    at: new Date().toISOString(), beforeRead, afterRead: { bytes, requests },
    beforeCount: before.length, afterCount: after.length,
    beforeProductHash: hash(before.map(firstImageOnly)), afterProductHash: hash(after),
    beforeCardsHash: hash(cards(beforePage.items)), afterCardsHash: hash(cards(afterPage.items)),
    beforeSchemaHash: hash(buildBrandStructuredData(brand, beforeOrdered)), afterSchemaHash: hash(buildBrandStructuredData(brand, afterOrdered)),
    qualification: 'Two sequential current upstream reads; byte counts are decoded catalog-response JSON, not page transfer or visitor performance. Fresh readiness/private-hold reads remain enabled. No Shopify writes/cart/email/generation.'
  };
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  expect(before.length).toBeGreaterThan(0);
  expect(result.afterProductHash).toBe(result.beforeProductHash);
  expect(result.afterCardsHash).toBe(result.beforeCardsHash);
  expect(result.afterSchemaHash).toBe(result.beforeSchemaHash);
  expect(result.afterRead.bytes).toBeLessThan(result.beforeRead.bytes);
}, 120000);
