import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { sampleProducts } from '@/lib/data/sample-products';
import type { Product } from '@/types/product';
import { warehouseBuyerNotes, warehouseFaqItems } from '@/lib/catalog/warehouseSeo';
const { load } = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getSeoCatalogProducts: load }));
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: { children: ReactNode; href: string }) => createElement('a', { href, ...props }, children) }));
vi.mock('@/components/ProductFilters', () => ({ ProductFilters: () => createElement('div', { 'data-test': 'filters' }) }));
vi.mock('@/components/ProductGrid', () => ({ ProductGrid: ({ products }: { products: Product[] }) => createElement('div', { className: 'catalog-grid', 'data-handles': products.map(p => p.handle).join(',') }) }));
vi.mock('@/components/care/CareForLifePanel', () => ({ CareForLifePanel: () => createElement('div', { 'data-test': 'care' }, 'Existing care panel') }));
import Page from '@/app/(store)/warehouse/page';

describe('warehouse product-first layout', () => {
  beforeEach(() => { load.mockReset(); load.mockResolvedValue(sampleProducts); });
  it('puts all buyer notes, care and FAQ after the product area in closed native disclosures', async () => {
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
    const dom = parse(html), disclosures = dom.querySelectorAll('details.collection-disclosure');
    expect(disclosures).toHaveLength(2);
    expect(disclosures.every(node => !node.hasAttribute('open'))).toBe(true);
    expect(html.indexOf('id="collection-products"')).toBeLessThan(html.indexOf('warehouse-checks-heading'));
    expect(html.indexOf('id="collection-products"')).toBeLessThan(html.indexOf('data-test="care"'));
    expect(disclosures[0].querySelector('[data-test=care]')).not.toBeNull();
    for (const note of warehouseBuyerNotes) expect(disclosures[0].text).toContain(note.body);
    for (const faq of warehouseFaqItems) expect(disclosures[1].text).toContain(faq.answer);
  });
  it('preserves visible FAQ/schema equality without deferred client-only copy', async () => {
    const dom = parse(renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) })));
    const faq = dom.querySelectorAll('script[type="application/ld+json"]').map(node => JSON.parse(node.text)).find(node => node['@type'] === 'FAQPage');
    expect(faq.mainEntity).toHaveLength(warehouseFaqItems.length);
    for (const row of faq.mainEntity) {
      expect(dom.querySelectorAll('details')[1].text).toContain(row.name);
      expect(dom.querySelectorAll('details')[1].text).toContain(row.acceptedAnswer.text);
    }
  });
  it('reuses the compact guide row and makes the existing regional scroll group focusable', async () => {
    const dom = parse(renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) })));
    expect(dom.querySelector('nav[aria-label="Warehouse buying guides"]')?.classNames).toContain('collection-guide-links');
    expect(dom.querySelector('nav[aria-label="Warehouse buying guides"]')?.getAttribute('tabindex')).toBe('0');
    expect(dom.querySelector('[aria-label="Warehouse locations"]')?.getAttribute('tabindex')).toBe('0');
  });
  it('preserves all non-page selections when switching warehouse region', async () => {
    const dom = parse(renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ material: 'silicone', sort: 'price-asc', page: '3' }) })));
    const links = dom.querySelectorAll('.warehouse-region-switcher__options a');
    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      const url = new URL(link.getAttribute('href')!, 'https://dollwow.com');
      expect(url.searchParams.get('material')).toBe('silicone');
      expect(url.searchParams.get('sort')).toBe('price-asc');
      expect(url.searchParams.has('page')).toBe(false);
    }
  });
});
