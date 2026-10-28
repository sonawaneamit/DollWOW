import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLearningArticle, getLearningArticles } from '@/lib/learn/content';
import Page from '@/app/learn/[slug]/page';

vi.mock('@/lib/shopify/storefront', () => ({ getProducts: vi.fn().mockResolvedValue([]), getProductsByHandles: vi.fn().mockResolvedValue([]) }));
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const se = 'se-doll-vs-starpery-build-comparison';
describe('customer-facing guide dates', () => {
  it('keeps internal review language out of every currently visible guide', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-27T19:00:00Z')); vi.stubGlobal('React', React);
    const articles = getLearningArticles();
    expect(articles.length).toBeGreaterThan(50);
    for (const article of articles) {
      expect(article.hideReviewDate, article.slug).toBe(true);
      const dom = parse(renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: article.slug }) })));
      dom.querySelectorAll('script').forEach(node => node.remove());
      expect(dom.text, article.slug).not.toMatch(/last reviewed|checked on (?:\d|October)|listing data checked|based on listing data|not factory-confirmed|basis not specified|decision-critical|Sources:/i);
    }
  });
  it('retains care warnings and factual publication metadata', () => {
    const article = getLearningArticle('silicone-sex-doll-repair')!;
    expect(article.body).toContain('Do not inject or open the body without manufacturer support');
    expect(article.lastReviewed).toBe('2026-08-12');
  });
  it('omits SE review/provenance wording while retaining publication, prices, measurements and product links', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T21:00:00Z')); vi.stubGlobal('React', React);
    const article = getLearningArticle(se)!;
    expect(article.hideReviewDate).toBe(true);
    expect(article.lastReviewed).toBe('2026-10-23');
    expect(article.publishedAt).toBe('2026-10-19T09:00:00.000Z');
    const dom = parse(renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: se }) })));
    const schema = dom.querySelectorAll('script[type="application/ld+json"]').map(node => JSON.parse(node.text)).find(value => value['@type'] === 'Article');
    expect(schema.datePublished).toBe(article.publishedAt);
    expect(schema.dateModified.slice(0, 10)).toBe('2026-10-23');
    dom.querySelectorAll('script').forEach(node => node.remove());
    expect(dom.text).not.toMatch(/Last reviewed|basis not specified|basis unspecified|snapshot|Sources:|Starting price,|catalog comparison|review date|decision-critical/);
    for (const fact of ['35 kg / 77.2 lb', '52.5 kg / 115.7 lb', '83 / 50 / 89 cm', '109 / 102 / 125 cm', '$1,899', '$2,199', '$300', '52 cm', '36 cm']) expect(dom.text).toContain(fact);
    expect(dom.querySelectorAll('a').map(node => node.getAttribute('href'))).toContain('/products/sedoll-alba-a-161cm-f-cup-tpe-companion-doll-11id7');
    expect(dom.querySelectorAll('a').map(node => node.getAttribute('href'))).toContain('/products/starpery-amy-161cm-h-cup-silicone-head-companion-doll-1l9j0');
  });
  it.each(['irontech-vs-wm-build-comparison', 'md-vs-ido-doll-build-comparison', 'funwest-vs-dolls-castle-build-comparison'])('hides review dates without changing the scheduled release gate for %s', async slug => {
    vi.useFakeTimers(); vi.stubGlobal('React', React);
    const article = getLearningArticle(slug, Date.parse('2030-01-01T00:00:00Z'))!;
    expect(article.hideReviewDate).toBe(true);
    vi.setSystemTime(Date.parse(article.publishedAt!) - 1);
    await expect(Page({ params: Promise.resolve({ slug }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    vi.setSystemTime(Date.parse(article.publishedAt!));
    expect(renderToStaticMarkup(await Page({ params: Promise.resolve({ slug }) }))).not.toContain('Last reviewed');
  });
});
