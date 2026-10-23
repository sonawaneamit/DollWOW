import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleProducts } from '@/lib/data/sample-products';
import { articleListing, articleProductHandles, articleProducts } from '@/lib/learn/productCards';
import { getLearningArticle, getLearningArticles, buildArticleStructuredData, absoluteUrl } from '@/lib/learn/content';
import { CatalogListingCard } from '@/components/CatalogListingCard';
import Page, { generateMetadata } from '@/app/learn/[slug]/page';
import { GET } from '@/app/learn/[slug]/comparison-image/route';
import ReviewPage, { generateMetadata as reviewMetadata } from '@/app/review/comparisons/[slug]/page';
import { GET as reviewImage } from '@/app/review/comparisons/[slug]/image/route';
import type { Product } from '@/types/product';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getProducts: vi.fn().mockResolvedValue([]), getProductsByHandles: load }));
vi.mock('@/components/CurrencyProvider', () => ({ DisplayMoney: ({ amount }: { amount: string }) => <span>${amount}</span> }));
vi.mock('next/og', () => ({ ImageResponse: class extends Response {
  constructor(_node: unknown, options: { headers: HeadersInit }) { super('social-photo-render', { headers: options.headers }); }
} }));

const slugs = ['se-doll-vs-starpery-build-comparison', 'irontech-vs-wm-build-comparison', 'md-vs-ido-doll-build-comparison', 'funwest-vs-dolls-castle-build-comparison'];
function product(handle: string, index: number): Product {
  const p = structuredClone(sampleProducts[0]);
  return { ...p, id: String(index), handle, title: `Catalog doll ${index}`, tags: ['full-doll'],
    featuredImage: { url: `https://cdn.shopify.com/s/files/1/0960/7531/7432/files/doll-${index}.jpg`, altText: 'Actual catalog photo', width: 1000, height: 1500 },
    images: [], extended: { ...p.extended, sourceTitle: '', sourceHandle: '', displayName: `Catalog doll ${index}`, heightCm: 161, weightLb: 77.2 },
    priceRange: { minVariantPrice: { amount: '1899', currencyCode: 'USD' }, maxVariantPrice: { amount: '1899', currencyCode: 'USD' } } };
}
beforeEach(() => {
  vi.stubGlobal('React', React);
  load.mockReset().mockImplementation(async (handles: string[]) => handles.map(product));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('live catalog cards in guides', () => {
  it('uses exact public local product links, deduplicates and excludes held/external identities', () => {
    expect(articleProductHandles('[A](/products/one) [A](https://dollwow.com/products/one?q=2) [B](/products/two#details) [X](https://other.test/products/three) [X](//other.test/products/four) [X](/products/not%2Fsafe)')).toEqual(['one', 'two']);
    expect(articleProductHandles('[held](/products/wm-head-583-165cm-d-cup-silicone-companion-doll-2j3mm)')).toEqual([]);
    const a = product('one', 1), held = { ...product('two', 2), tags: ['source-review-hold'] };
    expect(articleProducts(['one', 'two', 'missing'], [held, a]).map(p => p.handle)).toEqual(['one']);
  });
  it('preserves unavailable measurements/prices instead of estimating them', () => {
    const p = product('one', 1);
    p.extended.heightCm = undefined; p.extended.weightLb = NaN; p.priceRange.minVariantPrice.amount = '0';
    expect(articleListing(p)).toMatchObject({ heightCm: null, weightLb: null, price: null });
    const html = renderToStaticMarkup(<CatalogListingCard row={articleListing(p)} heading="h3" />);
    expect(html).toContain('Height not listed'); expect(html).toContain('Weight not listed'); expect(html).toContain('Price unavailable');
    expect(html).not.toContain('cdn.shopify.com');
  });
  it.each(slugs)('shows every linked doll in top/inline/end cards and actual-photo hero for %s', async slug => {
    vi.useFakeTimers();
    const article = getLearningArticle(slug, Date.parse('2030-01-01'))!;
    vi.setSystemTime(new Date(article.publishedAt!));
    const handles = articleProductHandles(article.body);
    expect(handles).toHaveLength(2);
    const dom = parse(renderToStaticMarkup(await Page({ params: Promise.resolve({ slug }) })));
    expect(dom.querySelectorAll('[data-article-products]')).toHaveLength(3);
    expect(dom.querySelectorAll('[data-article-product-hero] img')).toHaveLength(2);
    for (const handle of handles) {
      expect(dom.querySelectorAll(`[data-article-product="${handle}"]`)).toHaveLength(3);
      expect(dom.querySelector(`[data-article-product="${handle}"] a`)?.getAttribute('href')).toBe(`/products/${handle}`);
    }
    expect(dom.text).toContain('35.0 kg / 77.2 lb'); expect(dom.text).toContain('1899');
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    const images = (metadata.openGraph as { images: Array<{ url: string; width: number; height: number }> }).images;
    expect(images).toEqual([expect.objectContaining({ url: absoluteUrl(`/learn/${slug}/comparison-image`), width: 1200, height: 630 })]);
    expect(metadata.twitter?.images).toEqual([absoluteUrl(`/learn/${slug}/comparison-image`)]);
    expect(buildArticleStructuredData(article).image).toBe(absoluteUrl(`/learn/${slug}/comparison-image`));
    dom.querySelectorAll('script').forEach(node => node.remove());
    expect(dom.text).not.toMatch(/Last reviewed|Sources:|basis not specified|snapshot|review date/);
    expect(load).toHaveBeenCalledWith(handles, { revalidate: 120 });
  });
  it('never fills an unavailable catalog response with invented cards or blank-frame cover', async () => {
    load.mockResolvedValue([]);
    const dom = parse(renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: slugs[0] }) })));
    expect(dom.querySelectorAll('[data-article-products], [data-article-product-hero]')).toHaveLength(0);
    expect(dom.querySelectorAll('img').some(node => node.getAttribute('src')?.includes('build-comparison.webp'))).toBe(false);
  });
  it('activates only the four approved owners, with future authoring enabled by default', () => {
    expect(getLearningArticles(Date.parse('2030-01-01')).filter(article => article.productCards).map(a => a.slug).sort()).toEqual([...slugs].sort());
    expect(fs.readFileSync('scripts/generate-learning-center-drafts.mjs', 'utf8')).toContain('"productCards: true"');
  });
  it.each(slugs.slice(1))('keeps both article and social photo route closed before %s release', async slug => {
    vi.useFakeTimers();
    const article = getLearningArticle(slug, Date.parse('2030-01-01'))!;
    vi.setSystemTime(Date.parse(article.publishedAt!) - 1);
    const params = Promise.resolve({ slug });
    expect(await generateMetadata({ params })).toEqual({});
    await expect(Page({ params })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect((await GET(new Request('https://dollwow.com'), { params })).status).toBe(404);
    expect(load).not.toHaveBeenCalled();
  });
  it('renders social photos only from this store CDN and fails closed on unavailable or redirected media', async () => {
    const fetcher = vi.fn().mockImplementation(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } }));
    vi.stubGlobal('fetch', fetcher);
    const params = Promise.resolve({ slug: slugs[0] });
    const response = await GET(new Request('https://dollwow.com'), { params });
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/1/0960/7531/7432/files/'), expect.objectContaining({ redirect: 'error' }));
    load.mockImplementation(async (handles: string[]) => handles.map((handle, i) => ({ ...product(handle, i), featuredImage: { url: 'https://supplier.invalid/photo.jpg', altText: '', width: 100, height: 100 } })));
    expect((await GET(new Request('https://dollwow.com'), { params })).status).toBe(404);
    expect(fetcher).toHaveBeenCalledTimes(2);
    load.mockRejectedValue(new Error('private upstream detail'));
    const failed = await GET(new Request('https://dollwow.com'), { params });
    expect(failed.status).toBe(503); expect(await failed.text()).not.toContain('private upstream detail');
  });
  it.each(['production', 'development', ''])('never exposes private draft review routes in %s', async environment => {
    vi.stubEnv('VERCEL_ENV', environment);
    for (const slug of slugs) {
      const params = Promise.resolve({ slug });
      await expect(ReviewPage({ params })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
      expect((await reviewImage(new Request('https://dollwow.com'), { params })).status).toBe(404);
    }
    expect(load).not.toHaveBeenCalled();
  });
  it.each(slugs)('offers an isolated noindex private review for %s without opening the canonical owner', async slug => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T22:00:00Z'));
    const params = Promise.resolve({ slug });
    const dom = parse(renderToStaticMarkup(await ReviewPage({ params })));
    expect(dom.querySelectorAll('h1')).toHaveLength(1);
    expect(dom.querySelectorAll('[data-article-products]')).toHaveLength(3);
    expect(dom.querySelectorAll('[data-article-product-hero] img')).toHaveLength(2);
    expect((await reviewMetadata({ params })).robots).toEqual({ index: false, follow: false });
    if (slug !== slugs[0]) expect(getLearningArticle(slug)).toBeNull();
  });
  it('does not accept an arbitrary future guide through the private preview wrapper', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const params = Promise.resolve({ slug: 'unrelated-future-guide' });
    await expect(ReviewPage({ params })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect((await reviewImage(new Request('https://dollwow.com'), { params })).status).toBe(404);
    expect(load).not.toHaveBeenCalled();
  });
});
