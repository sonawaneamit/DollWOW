import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement, type ReactNode } from 'react';
import { sampleProducts } from '@/lib/data/sample-products';
import type { Product } from '@/types/product';
import { parse } from 'node-html-parser';
const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getSeoCatalogProducts: load }));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: { children: ReactNode; href: string }) => createElement('a', { href, ...props }, children) }));
import Page, { generateMetadata } from '@/app/tools/doll-size-weight-finder/page';

function fixture(index: number): Product {
  const p = structuredClone(sampleProducts[0]);
  return { ...p, id: String(index), handle: `finder-${index}`, title: `Example ${index}`, productType: 'Full doll',
    tags: ['full-doll', 'tpe'], featuredImage: null, images: [],
    extended: { ...p.extended, sourceTitle: '', sourceHandle: '', material: 'TPE', heightCm: 165, weightLb: index === 1 ? undefined : 80, displayName: `Example ${index}` } };
}
describe('Finder server-rendered page', () => {
  beforeEach(() => { load.mockReset(); });
  it('serves native GET controls, weight definitions and missing data without a client component', async () => {
    load.mockResolvedValue([fixture(1), fixture(2)]);
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('method="get"'); expect(html).toContain('name="height"');
    expect(html).toContain('name="material"'); expect(html).toContain('1 missing weight');
    expect(html).toContain('Listed weight: basis unspecified'); expect(html).toContain('36.3 kg / 80.0 lb');
    expect(html).toContain('/products/finder-2'); expect(html).not.toContain('<img');
    expect(load).toHaveBeenCalledWith({ first: 5000, strict: true, revalidate: 0 });
    const schema = JSON.parse(parse(html).querySelector('script[type="application/ld+json"]')!.text);
    expect(schema).toMatchObject({ '@type': 'WebApplication', name: 'Doll Size & Weight Finder', applicationCategory: 'ShoppingApplication' });
    expect(schema).not.toHaveProperty('aggregateRating');
    expect(schema).not.toHaveProperty('offers');
  });
  it('paginates matching links and keeps selection in each link', async () => {
    load.mockResolvedValue(Array.from({ length: 25 }, (_, index) => fixture(index)));
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ height: '165', material: 'tpe', page: '2' }) }));
    expect(html).toContain('/products/finder-24'); expect(html).not.toContain('/products/finder-0"');
    expect(html).toContain('Page 2 of 2'); expect(html).toContain('height=165&amp;material=tpe&amp;page=1');
  });
  it('does not interpolate a missing material and height combination', async () => {
    load.mockResolvedValue([fixture(1)]);
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ material: 'silicone' }) }));
    expect(html).toContain('0 matching listings'); expect(html).toContain('No matching listings in this data');
    expect(html).not.toContain('/products/finder-1');
  });
  it.each(['failure', 'cap'])('fails closed for %s rather than showing fallback samples', async mode => {
    if (mode === 'failure') load.mockRejectedValue(new Error('private upstream error'));
    else load.mockResolvedValue(Array.from({ length: 5000 }, () => fixture(1)));
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('temporarily unavailable'); expect(html).not.toContain('private upstream error');
    expect(html).not.toContain('/products/');
  });
  it('has one canonical owner and noindexes parameter variants', async () => {
    const root = await generateMetadata({ searchParams: Promise.resolve({}) });
    const query = await generateMetadata({ searchParams: Promise.resolve({ height: '165' }) });
    expect(root.alternates?.canonical).toBe('/tools/doll-size-weight-finder');
    expect(root.alternates?.types).toEqual({ 'text/markdown': '/markdown/tools/doll-size-weight-finder' });
    expect(root.robots).toEqual({ index: true, follow: true });
    expect(query.robots).toEqual({ index: false, follow: true });
  });
});
