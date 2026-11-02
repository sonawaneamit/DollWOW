import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream, renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import LoadingPage from '@/app/loading';
import DollVuePage from '@/app/dollvue/page';
import { getSeoCatalogProducts } from '@/lib/shopify/storefront';
import { connection } from 'next/server';

vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));
vi.mock('@/lib/shopify/storefront', () => ({ getSeoCatalogProducts: vi.fn(() => new Promise(() => {})) }));
vi.mock('@/components/dollvue/DollVueLanding', () => ({
  DollVueLanding: ({ latestProducts }: { latestProducts: React.ReactNode }) => <main><h1>DollVue introduction</h1>{latestProducts}</main>
}));
vi.mock('@/components/ProductCard', () => ({ ProductCard: () => <article /> }));

beforeEach(() => {
  vi.mocked(connection).mockReset().mockResolvedValue(undefined);
  vi.mocked(getSeoCatalogProducts).mockClear();
});

function readShell() {
  return new Promise<string>((resolve, reject) => {
    const output = new PassThrough();
    let html = '';
    const stream = renderToPipeableStream(<DollVuePage />, {
      onShellReady() { stream.pipe(output); },
      onShellError: reject,
      onError() { /* Expected when the intentionally pending fixture is aborted. */ }
    });
    output.on('data', chunk => {
      html += chunk.toString();
      if (html.includes('Loading available dolls')) { resolve(html); stream.abort(); }
    });
  });
}

describe('Navigation feedback and streamed DollVue content', () => {
  it('streams the introduction without waiting for catalog verification', async () => {
    const shell = await readShell();
    expect(shell).toContain('DollVue introduction');
    expect(shell).toContain('Loading available dolls');
    expect(connection).toHaveBeenCalled();
    await vi.waitFor(() => expect(getSeoCatalogProducts).toHaveBeenCalledWith({ first: 5000, strict: true, includeDollVueEligibility: true, dollVueLimit: 9 }));
  });

  it('does not read eligibility before the request boundary resolves', async () => {
    vi.mocked(connection).mockImplementation(() => new Promise(() => {}));
    expect(await readShell()).toContain('DollVue introduction');
    expect(connection).toHaveBeenCalled();
    expect(getSeoCatalogProducts).not.toHaveBeenCalled();
  });

  it('provides a stable accessible page-loading state with no purchase controls', () => {
    const html = renderToStaticMarkup(<LoadingPage />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading page"');
    expect(html).toContain('min-h-screen');
    expect(html).toContain('aspect-[2/3]');
    expect(html).not.toContain('<button');
  });

  it('extends the banner link to the margins without enlarging its artwork', () => {
    const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
    const rule = css.match(/\.home-dollvue-strip__link\s*\{([^}]+)\}/)?.[1];
    expect(rule).toContain('width: 100%');
    expect(rule).toContain('padding-inline: 10%');
  });
});
