import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Page from '@/app/review/se-november/page';
import stock from '@/data/promotion-previews/se-november-stock-review.json';

describe('Private EU stock scenario, not an eligible live offer', () => {
  it('exports only public retail fields, never private supplier prices or identities', () => {
    expect(Object.keys(stock).sort()).toEqual(['currency', 'discountPercent', 'releaseReady', 'rows', 'sourceAt', 'sourceDigest'].sort());
    expect(stock.releaseReady).toBe(false);
    expect(stock.rows).toHaveLength(5);
    for (const row of stock.rows) {
      expect(Object.keys(row).sort()).toEqual(['handle', 'title', 'warehouse', 'baselineCents', 'proposedCents', 'restoreCents', 'identityCheck'].sort());
      expect(row.restoreCents).toBe(row.baselineCents);
      expect(row.proposedCents).toBe(Math.round(row.baselineCents * 90 / 100));
      expect(row.identityCheck).toContain('pending');
    }
  });
  it.each(['before', 'november', 'expired'])('keeps the %s phase honest and exposes exact restoration', async phase => {
    const oldPreview = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const oldFlag = process.env.NEXT_PUBLIC_DOL285_PREVIEW;
    try {
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
      process.env.NEXT_PUBLIC_DOL285_PREVIEW = '1';
      const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ phase }) }));
      expect(html).toContain('EU Stock Price Scenario');
      expect(html).toContain('draft calculation, not an available offer');
      expect(html).toContain('no scheduled write configured');
      expect(html).toContain('Restore after 7 Dec');
      for (const row of stock.rows) expect(html).toContain(`https://dollwow.com/products/${row.handle}`);
      expect(html).not.toContain('Add to cart');
      const scenario = html.split('EU Stock Price Scenario')[1].split('Other Warehouse Evidence')[0];
      expect(scenario).toContain('$2,299.00');
      expect(scenario.includes('$2,069.10')).toBe(phase === 'november');
    } finally {
      if (oldPreview === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = oldPreview;
      if (oldFlag === undefined) delete process.env.NEXT_PUBLIC_DOL285_PREVIEW;
      else process.env.NEXT_PUBLIC_DOL285_PREVIEW = oldFlag;
    }
  });
});
