import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page, { metadata } from '@/app/review/se-november/page';
import data from '@/data/promotion-previews/se-november-review.json';
import { seNovemberReviewEnabled } from '@/lib/promotions/seNovember2026';

afterEach(() => vi.unstubAllEnvs());
const enable = () => { vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview'); vi.stubEnv('NEXT_PUBLIC_DOL285_PREVIEW', '1'); };
describe('Private SE November comparison page', () => {
  it('is noindex and absent from production even with the flag', async () => {
    enable();
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    expect(seNovemberReviewEnabled()).toBe(false);
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow();
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
  it('requires the separate opt-in in preview', async () => {
    enable(); vi.stubEnv('NEXT_PUBLIC_DOL285_PREVIEW', '');
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow();
  });
  it.each(['before', 'november', 'expired'])('renders all four cohorts and proper review date %s', async phase => {
    enable();
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ phase }) }));
    for (const title of ['TPE Custom', 'Silicone Pro Custom', 'Silicone Torso Custom', 'US / EU Stock']) expect(html).toContain(title);
    expect(html).toContain(phase === 'november' ? 'In range' : 'Out of range');
    expect(html).not.toContain('action=');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('Add to cart');
    expect(html).toContain('Catalog deltas');
  });
  it('serializes only explicit public fields and reviewed original catalog images', () => {
    const serialized = JSON.stringify(data);
    for (const forbidden of ['unitCost', 'inventoryItem', 'source-art', 'Dec.7', 'menuSha256', 'gates', 'school']) expect(serialized).not.toContain(forbidden);
    expect(data.samples).toHaveLength(3);
    expect(data.stock).toHaveLength(7);
    for (const sample of data.samples) expect(new URL(sample.image.url).hostname).toBe('cdn.shopify.com');
  });
});
