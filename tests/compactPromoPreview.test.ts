import fs from 'node:fs';
import { expect, it } from 'vitest';

it('keeps compact promo sizing desktop-only and explicitly preview-gated', () => {
  const page = fs.readFileSync('app/promo/page.tsx', 'utf8');
  const css = fs.readFileSync('app/promo/compact-promo-preview.css', 'utf8');
  expect(page).toContain("process.env.VERCEL_ENV === 'preview' && process.env.DOLLWOW_COMPACT_PROMO_PREVIEW === '1'");
  expect(css).toMatch(/^@media \(min-width: 1024px\)/);
  expect(css).toContain('max-width: 960px');
  expect(css).toContain('max-height: 280px');
  expect(css).toContain('object-fit: contain');
  expect(css).not.toMatch(/display:\s*none|overflow:\s*hidden/);
});
