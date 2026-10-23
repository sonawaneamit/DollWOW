import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, type ReactNode } from 'react';
import { sampleProducts } from '@/lib/data/sample-products';
import type { Product } from '@/types/product';
import { parse } from 'node-html-parser';
const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getSeoCatalogProducts: load }));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('@/components/CurrencyProvider', () => ({ DisplayMoney: ({ amount }: { amount: string }) => createElement('span', null, `$${amount}`) }));
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: { children: ReactNode; href: string }) => createElement('a', { href, ...props }, children) }));
import Page, { generateMetadata } from '@/app/tools/doll-size-weight-finder/page';

function fixture(index: number): Product {
  const p = structuredClone(sampleProducts[0]);
  return { ...p, id: String(index), handle: `finder-${index}`, title: `Example ${index}`, productType: 'Full doll',
    tags: ['full-doll', 'tpe'], featuredImage: { url: 'https://private-source.invalid/photo.jpg', altText: 'Product', width: 400, height: 500 }, images: [],
    extended: { ...p.extended, sourceTitle: '', sourceHandle: '', material: 'TPE', heightCm: 165, weightLb: index === 1 ? undefined : 80, displayName: `Example ${index}` } };
}
describe('range Finder initial HTML', () => {
  beforeEach(() => { load.mockReset(); });
  it('renders four native handles, materials, photos and prices without provenance copy or dates', async () => {
    load.mockResolvedValue([fixture(1), fixture(2)]);
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    const dom = parse(html);
    expect(dom.querySelectorAll('input[type="range"]')).toHaveLength(4);
    expect(dom.querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
    expect(dom.querySelector('form')?.getAttribute('method')).toBe('get');
    expect(dom.querySelectorAll('[data-finder-card]')).toHaveLength(1);
    expect(dom.text).toContain('1 matching listing');
    expect(dom.text).toContain('36.3 kg / 80.0 lb');
    expect(html).not.toMatch(/factory-confirmed|listing data|Listing data checked|checkedAt|Snapshot checked/);
    expect(dom.querySelector('#minWeight')!.getAttribute('min')).toBe('36.3');
    expect(dom.querySelector('#minWeight')!.getAttribute('value')).toBe('36.3');
    expect(dom.querySelector('noscript')?.text).toContain('Apply filters');
    expect(html).toContain('/products/finder-2');
    expect(html).not.toContain('/products/finder-1"');
    const imageSrc = new URL(dom.querySelector('img')!.getAttribute('src')!, 'https://dollwow.com');
    expect(imageSrc.searchParams.get('url')).toMatch(/^\/product-media\/v4\/finder-2\//);
    expect(html).not.toContain('private-source.invalid');
    expect(html).not.toMatch(/basis unspecified|factory body only|Data coverage and definitions/i);
    const schema = JSON.parse(dom.querySelector('script[type="application/ld+json"]')!.text);
    expect(schema).toMatchObject({ '@type': 'WebApplication', applicationCategory: 'ShoppingApplication' });
    expect(schema).not.toHaveProperty('offers');
    expect(schema).not.toHaveProperty('aggregateRating');
    expect(load).toHaveBeenCalledWith({ first: 5000, strict: true, revalidate: 0 });
  });
  it('paginates server HTML and retains both ranges and material in native links', async () => {
    load.mockResolvedValue(Array.from({ length: 27 }, (_, index) => fixture(index)));
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ minHeight: '160', maxHeight: '170', minWeight: '30', maxWeight: '40', material: 'tpe', page: '2' }) }));
    expect(html).toContain('/products/finder-26');
    expect(html).not.toContain('/products/finder-0"');
    expect(html).toContain('Page 2 of 2');
    expect(html).toContain('minHeight=160&amp;maxHeight=165&amp;minWeight=36.3&amp;maxWeight=37&amp;material=tpe');
  });
  it('shows an honest empty state and reset link, never estimated or missing weights', async () => {
    load.mockResolvedValue([fixture(1), fixture(2)]);
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ material: 'silicone' }) }));
    expect(html).toContain('0 matching listings');
    expect(html).toContain('No matching listings');
    expect(html).toContain('Reset filters');
    expect(html).not.toContain('/products/');
  });
  it.each(['failure', 'cap'])('fails closed for %s without fallback samples', async mode => {
    if (mode === 'failure') load.mockRejectedValue(new Error('private upstream error'));
    else load.mockResolvedValue(Array.from({ length: 5000 }, () => fixture(1)));
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('temporarily unavailable');
    expect(html).not.toContain('private upstream error');
    expect(html).not.toContain('/products/');
  });
  it('has one canonical owner and noindexes parameter variants', async () => {
    const root = await generateMetadata({ searchParams: Promise.resolve({}) });
    const query = await generateMetadata({ searchParams: Promise.resolve({ minHeight: '165' }) });
    expect(root.alternates?.canonical).toBe('/tools/doll-size-weight-finder');
    expect(root.alternates?.types).toEqual({ 'text/markdown': '/markdown/tools/doll-size-weight-finder' });
    expect(root.robots).toEqual({ index: true, follow: true });
    expect(query.robots).toEqual({ index: false, follow: true });
  });
});
