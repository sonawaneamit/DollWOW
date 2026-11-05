import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import Page, { metadata } from '@/app/review/dollvue-credit-packs/page';

it('shows only a private draft proposal, with no purchase or credit issuance path', () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  try {
    const html = renderToStaticMarkup(<Page />);
    expect(html).toContain('Get 5 more for $5');
    expect(html).toContain('Get 30 more for $25');expect(html).not.toContain('35 more');
    expect((html.match(/disabled=""/g) ?? []).length).toBe(3);
    expect(html).not.toContain('/cart');expect(html).not.toContain('/checkout');
  } finally { vi.unstubAllEnvs(); }
});

it('keeps the proposal noindex and404 in production', () => {
  vi.stubEnv('VERCEL_ENV', 'production');vi.stubEnv('NODE_ENV', 'production');
  try { expect(metadata.robots).toEqual({ index: false, follow: false });expect(() => Page()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404'); }
  finally { vi.unstubAllEnvs(); }
});
