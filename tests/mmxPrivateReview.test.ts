import { describe, expect, it } from 'vitest';
import snapshot from '@/data/draft-previews/mmx-nov10.json';
import { mmxReviewEnabled } from '@/lib/catalog/mmxReview';

describe('MMX private review boundaries', () => {
  it('requires both a preview deployment and the explicit review flag', () => {
    expect(mmxReviewEnabled({ VERCEL_ENV: 'preview', DOLLWOW_DOL261_PREVIEW: '1' })).toBe(true);
    for (const VERCEL_ENV of ['production', 'development', undefined]) {
      expect(mmxReviewEnabled({ VERCEL_ENV, DOLLWOW_DOL261_PREVIEW: '1' })).toBe(false);
    }
    expect(mmxReviewEnabled({ VERCEL_ENV: 'preview' })).toBe(false);
  });
  it('keeps the unquoted 153cm model out of priced products', () => {
    expect(snapshot.products).toHaveLength(19);
    expect(snapshot.held).toHaveLength(1);
    expect(snapshot.products.every(product => !product.handle.includes('153'))).toBe(true);
    expect(JSON.stringify(snapshot.held)).not.toMatch(/priceRange|amount|2445/);
  });
  it('contains the supplier sheets and all 15 reviewed videos, without source costs or menus', () => {
    expect(snapshot.products.flatMap(product => product.media).filter(media => media.type === 'video')).toHaveLength(15);
    for (const product of snapshot.products) {
      expect(product.images.some(image => image.altText?.includes('official body measurements'))).toBe(true);
      expect(product.variants).toEqual([]);
    }
    expect(JSON.stringify(snapshot)).not.toMatch(/rosemarydoll|drive\.google|docs\.google|factoryCost|dealerCost|customization_groups/);
  });
});
