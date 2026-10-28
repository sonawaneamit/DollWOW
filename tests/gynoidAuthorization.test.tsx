import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe('Gynoid authorization preview boundaries', () => {
  it('excludes the new brand and certificate from production directories', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DOL273_PREVIEW', '1');
    vi.resetModules();
    const { brandAuthorizations } = await import('@/lib/catalog/authorizations');
    const { catalogBrands } = await import('@/lib/catalog/brands');
    expect(brandAuthorizations.some(a => a.brandValue === 'gynoid')).toBe(false);
    expect(catalogBrands.some(a => a.value === 'gynoid')).toBe(false);
  });
  it('shows the exact scope and file on both cards and the preview directory', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_DOL273_PREVIEW', '1');
    vi.resetModules();
    const { BrandAuthorizationCard } = await import('@/components/BrandAuthorizationCard');
    const { default: Directory, metadata } = await import('@/app/authorized-vendors/page');
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    for (const variant of ['brand', 'product'] as const) {
      const html = renderToStaticMarkup(<BrandAuthorizationCard brand="gynoid" variant={variant} />);
      expect(html).toContain('Europe and the Americas');
      expect(html).toContain('22 October 2026 to 21 October 2027');
      expect(html).toContain('/images/authorizations/gynoid-authorized.png');
    }
    expect(renderToStaticMarkup(<Directory />)).toContain('id="gynoid"');
  });
});
