import fs from 'node:fs';
import { expect, it } from 'vitest';

it('releases the approved layout only inside the desktop promo wrapper', () => {
  const page = fs.readFileSync('app/promo/page.tsx', 'utf8');
  const css = fs.readFileSync('app/promo/compact-promo.css', 'utf8');
  expect(page).toContain("import './compact-promo.css'");
  expect(page).toContain('className="compact-promo mx-auto');
  expect(page).not.toContain('DOLLWOW_COMPACT_PROMO_PREVIEW');
  expect(css).toMatch(/^@media \(min-width: 1024px\)/);
  expect(css).toContain('max-width: 960px');
  expect(css).toContain('max-height: 280px');
  expect(css).toContain('object-fit: contain');
  expect(css).not.toMatch(/display:\s*none|overflow:\s*hidden/);
});

it('does not import the held Zarga product or promotion as part of the layout release', () => {
  const page = fs.readFileSync('app/promo/page.tsx', 'utf8');
  expect(page).not.toMatch(/Zarga|zarga|DOLLWOW_COMPACT_PROMO/);
});
