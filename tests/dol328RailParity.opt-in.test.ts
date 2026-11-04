import { expect, it } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';

it.skipIf(process.env.DOL328_RAIL_PARITY !== '1')('measures one read-only full-walk versus bounded-rail parity comparison', async () => {
  process.loadEnvFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local');
  process.env.VERCEL_ENV = 'preview';
  process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
  const { getSeoCatalogProducts } = await import('@/lib/shopify/storefront');
  const { isDollVueCatalogProduct } = await import('@/lib/dollvue/config');
  const nativeFetch = globalThis.fetch;
  const operations: string[] = [];
  globalThis.fetch = async (url, init) => {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    operations.push(String(body.query ?? '').match(/\bquery\s+(\w+)/)?.[1] ?? 'other');
    return nativeFetch(url, init);
  };
  const start = Date.now();
  try {
    const before = (await getSeoCatalogProducts({ first: 5000, strict: true, includeDollVueEligibility: true }))
      .filter(isDollVueCatalogProduct)
      .sort((a, b) => (b.extended.sourceReleaseRank ?? 0) - (a.extended.sourceReleaseRank ?? 0)).slice(0, 9);
    const beforeMs = Date.now() - start;
    const beforeOperations = operations.splice(0);
    const nextStart = Date.now();
    const after = await getSeoCatalogProducts({ first: 5000, strict: true, includeDollVueEligibility: true, dollVueLimit: 9 });
    const afterMs = Date.now() - nextStart;
    const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
    const report = {
      at: new Date().toISOString(), scope: 'READ_ONLY_LOCAL_HELPERS_PREVIEW_MODE_NO_CART_OR_GENERATION',
      beforeMs, afterMs, beforeOperations, afterOperations: [...operations],
      before: before.map(p => ({ id: p.id, handle: p.handle, price: p.priceRange })),
      after: after.map(p => ({ id: p.id, handle: p.handle, price: p.priceRange })),
      beforeHash: hash(before), afterHash: hash(after), equal: hash(before) === hash(after), mutations: 0,
      qualification: 'One sequential helper comparison, not a hosted/device/Lighthouse score or performance guarantee',
    };
    fs.writeFileSync('data/exports/dol-328-2026-11-02/rail-parity-private.json', JSON.stringify(report, null, 2));
    expect(after).toEqual(before);
    expect(after).toHaveLength(9);
    expect(operations.length).toBeLessThan(beforeOperations.length);
  } finally {
    globalThis.fetch = nativeFetch;
  }
}, 180000);
