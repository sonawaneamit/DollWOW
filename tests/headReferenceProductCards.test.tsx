import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { parse } from 'node-html-parser';
import { sampleProducts } from '@/lib/data/sample-products';
import mapping from '@/content/references/head-products.json';
import Page from '@/app/reference/heads/[slug]/page';
const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getProductsByHandles: load }));
vi.mock('@/components/CurrencyProvider', () => ({ DisplayMoney: ({ amount }: { amount: string }) => <span>${amount}</span> }));
beforeEach(() => {
  vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubGlobal('React', React);
  load.mockReset().mockImplementation(async (handles: string[]) => handles.map(handle => {
    const p = structuredClone(sampleProducts[0]);
    return { ...p, handle, tags: [], extended: { ...p.extended, displayName: 'Exact catalog doll', weightLb: 132.3, heightCm: 164 },
      featuredImage: { url: 'https://private-source.invalid/photo.jpg', width: 1000, height: 1500, altText: 'Exact catalog doll' },
      priceRange: { minVariantPrice: { amount: '2500', currencyCode: 'USD' }, maxVariantPrice: { amount: '2500', currencyCode: 'USD' } } };
  }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it.each(Object.entries(mapping))('links only the exact current pairing for %s', async (slug, handles) => {
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug }) })), dom = parse(html);
  const cards = dom.querySelectorAll('[data-article-product]');
  expect(cards).toHaveLength(1);
  expect(cards[0].getAttribute('data-article-product')).toBe(handles[0]);
  expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('/products/' + handles[0]);
  expect(cards[0].querySelector('img')).not.toBeNull();
  expect(cards[0].text).toContain('2500');
  expect(html).not.toContain('private-source.invalid');
  expect(html).not.toMatch(/application\/ld\+json/);
  expect(load).toHaveBeenCalledWith(handles, { revalidate: 120 });
});
it.each(['production', 'development'])('does not query products outside preview: %s', async environment => {
  vi.stubEnv('VERCEL_ENV', environment);
  await expect(Page({ params: Promise.resolve({ slug: 'irontech-s19' }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  expect(load).not.toHaveBeenCalled();
});
it('does not manufacture an unavailable product card', async () => {
  load.mockResolvedValue([]);
  expect(renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'irontech-s19' }) }))).not.toContain('data-article-products');
});
