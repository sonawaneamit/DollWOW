import { expect, it } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';

it.skipIf(process.env.DOL328_HOME_IMAGE_PARITY !== '1')('measures one read-only homepage list image projection comparison', async () => {
  process.loadEnvFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local');
  process.env.VERCEL_ENV = 'preview';
  const { getProducts } = await import('@/lib/shopify/storefront');
  const { homepageCardPayload } = await import('@/lib/catalog/publicPayload');
  const { withProtectedProductImages } = await import('@/lib/catalog/productImage');
  const original = globalThis.fetch;
  const catalogResponses: number[] = [];
  globalThis.fetch = async (url, init) => {
    const response = await original(url, init);
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    if (/query Products\(/.test(body.query ?? '')) catalogResponses.push((await response.clone().arrayBuffer()).byteLength);
    return response;
  };
  try {
    const before = await getProducts({ first: 96, strict: true, imageFirst: 8 });
    const beforeBytes = catalogResponses.splice(0).reduce((a, b) => a + b, 0);
    const after = await getProducts({ first: 96, strict: true, imageFirst: 1 });
    const afterBytes = catalogResponses.reduce((a, b) => a + b, 0);
    const project = (products: typeof before) => products.map(withProtectedProductImages).map(homepageCardPayload);
    const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
    const report = { at: new Date().toISOString(), beforeBytes, afterBytes, records: before.length,
      beforeHash: hash(project(before)), afterHash: hash(project(after)),
      qualification: 'One latest96 list, uncompressed upstream JSON bytes, not whole-home transfer or speed/score proof; same fresh eligibility checks', mutations: 0 };
    fs.writeFileSync('data/exports/dol-328-2026-11-02/home-image-parity-private.json', JSON.stringify(report, null, 2));
    expect(after).toHaveLength(before.length);
    expect(project(after)).toEqual(project(before));
    expect(afterBytes).toBeLessThan(beforeBytes);
  } finally {
    globalThis.fetch = original;
  }
}, 180000);
