import { describe, expect, it } from 'vitest';
import { gynoidEarlyBirdPreviewEnabled, gynoidEarlyBirdTier } from '@/lib/promotions/gynoidEarlyBird2026';

describe('Gynoid Early Bird boundaries and isolation', () => {
  it.each([
    ['2026-11-04T23:59:59.999Z', null],
    ['2026-11-05T00:00:00Z', 500],
    ['2026-11-14T23:59:59.999Z', 500],
    ['2026-11-15T00:00:00Z', 300],
    ['2026-11-24T23:59:59.999Z', 300],
    ['2026-11-25T00:00:00Z', 100],
    ['2026-12-04T23:59:59.999Z', 100],
    ['2026-12-05T00:00:00Z', null],
    ['invalid', null]
  ])('uses the correct benefit at %s', (date, saving) => {
    expect(gynoidEarlyBirdTier(new Date(date))?.saving ?? null).toBe(saving);
  });
  it('never enables on production or from a public environment label alone', () => {
    expect(gynoidEarlyBirdPreviewEnabled({ VERCEL_ENV: 'production', NEXT_PUBLIC_DOL221_PREVIEW: '1' })).toBe(false);
    expect(gynoidEarlyBirdPreviewEnabled({ NEXT_PUBLIC_VERCEL_ENV: 'preview', NEXT_PUBLIC_DOL221_PREVIEW: '1' })).toBe(false);
    expect(gynoidEarlyBirdPreviewEnabled({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(gynoidEarlyBirdPreviewEnabled({ VERCEL_ENV: 'preview', NEXT_PUBLIC_DOL221_PREVIEW: '1' })).toBe(true);
  });
});
