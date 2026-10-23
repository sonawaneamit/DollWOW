import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { INDEXNOW_ENDPOINT, indexNowUrls, notifyIndexNow } from '@/lib/seo/indexNow';
import { processProductNotification, productNotificationSnapshot, type IndexNowProduct, type IndexNowState } from '@/lib/seo/indexNowProduct';
import { validShopifyWebhookSignature } from '@/lib/shopify/webhookSignature';

const now = Date.parse('2026-10-22T17:00:00Z');
const product: IndexNowProduct = {
  id: 'gid://shopify/Product/1', handle: 'sample-product', status: 'ACTIVE',
  publishedAt: '2026-10-20T12:00:00Z', vendor: 'Irontech', tags: [], currencyCode: 'USD',
  variants: [{ id: 'gid://shopify/ProductVariant/2', price: '1999.00' }]
};
const canonical = 'https://dollwow.com/products/sample-product';

function harness(value: IndexNowState = { version: 1 }, patch: Partial<IndexNowProduct> = {}) {
  const write = vi.fn().mockResolvedValueOnce('claim').mockResolvedValue('committed');
  const notify = vi.fn().mockResolvedValue({ status: 200, validationPending: false });
  return { product: { ...product, ...patch }, stored: { value, digest: null }, now, write, notify };
}

describe('IndexNow canonical transport', () => {
  it('deduplicates canonical own-host URLs', () => expect(indexNowUrls([canonical, canonical])).toEqual([canonical]));
  it.each(['https://other.example/a', `${canonical}?token=private`, `${canonical}#private`,
    'https://user:secret@dollwow.com/a', 'http://dollwow.com/a', 'https://www.dollwow.com/a'])('rejects %s', url => {
    expect(() => indexNowUrls([url])).toThrow();
  });
  it('bounds batches', () => {
    expect(() => indexNowUrls([])).toThrow();
    expect(() => indexNowUrls(Array(10001).fill(canonical))).toThrow();
  });
  it.each([200, 202])('records acceptance %i, not an indexing claim', async status => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status }));
    expect(await notifyIndexNow([canonical], 'test-public-key', request)).toEqual({ status, count: 1, validationPending: status === 202 });
    expect(request).toHaveBeenCalledWith(INDEXNOW_ENDPOINT, expect.objectContaining({ redirect: 'error' }));
    const options = request.mock.calls[0][1];
    expect(options.headers).toEqual({ 'Content-Type': 'application/json; charset=utf-8' });
    expect(JSON.parse(options.body).urlList).toEqual([canonical]);
  });
  it.each([400, 403, 429, 500])('does not commit HTTP %i as success', async status => {
    await expect(notifyIndexNow([canonical], 'test-public-key', vi.fn().mockResolvedValue(new Response(null, { status })))).rejects.toThrow();
  });
  it('rejects invalid keys before requesting', async () => {
    const request = vi.fn();
    await expect(notifyIndexNow([canonical], '', request)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});

describe('raw-body Shopify authentication', () => {
  const secret = 'test-only-secret', body = Buffer.from('{"name":"Caf\u00e9"}');
  const signature = createHmac('sha256', secret).update(body).digest('base64');
  it('verifies unchanged raw bytes', () => expect(validShopifyWebhookSignature(body, signature, secret)).toBe(true));
  it('rejects tampering and wrong secrets', () => {
    expect(validShopifyWebhookSignature(Buffer.concat([body, Buffer.from(' ')]), signature, secret)).toBe(false);
    expect(validShopifyWebhookSignature(body, signature, 'wrong')).toBe(false);
  });
  it.each([null, '', 'invalid', signature.slice(1)])('rejects malformed/missing signatures', value => {
    expect(validShopifyWebhookSignature(body, value, secret)).toBe(false);
  });
  it('fails closed without a secret', () => expect(validShopifyWebhookSignature(body, signature, undefined)).toBe(false));
});

describe('persistent product notification claims', () => {
  it('notifies once and persists only after acceptance', async () => {
    const h = harness();
    expect(await processProductNotification(h)).toMatchObject({ status: 'submitted', count: 1, httpStatus: 200 });
    expect(h.notify).toHaveBeenCalledWith([canonical]);
    const committed = h.write.mock.calls[1][0];
    expect(committed.pending).toBeUndefined();
    expect(h.write.mock.calls[1][1]).toBe('claim');
    const repeated = harness(committed);
    expect(await processProductNotification(repeated)).toEqual({ status: 'unchanged' });
    expect(repeated.notify).not.toHaveBeenCalled();
    expect(repeated.write).not.toHaveBeenCalled();
  });
  it.each([{ status: 'DRAFT' }, { publishedAt: null }, { publishedAt: '2027-01-01T00:00:00Z' },
    { tags: ['dollwow-test'] }, { tags: ['dollwow-system'] }, { tags: ['custom-option-charge'] }, { tags: ['safety-hold'] }])('never submits a private listing %j', async patch => {
    const h = harness({ version: 1 }, patch);
    expect(await processProductNotification(h)).toEqual({ status: 'ignored_private' });
    expect(h.write).not.toHaveBeenCalled();
    expect(h.notify).not.toHaveBeenCalled();
  });
  it('ignores metadata-only changes and price formatting', () => {
    expect(productNotificationSnapshot({ ...product, vendor: 'Different public brand', tags: ['metadata'],
      variants: [{ ...product.variants[0], price: '1999' }] }, now).fingerprint).toBe(productNotificationSnapshot(product, now).fingerprint);
  });
  it('detects changed price and ignores variant ordering', () => {
    const second = { id: 'gid://shopify/ProductVariant/3', price: '2000' };
    const a = { ...product, variants: [...product.variants, second] };
    expect(productNotificationSnapshot(a, now).fingerprint).toBe(productNotificationSnapshot({ ...a, variants: [...a.variants].reverse() }, now).fingerprint);
    expect(productNotificationSnapshot({ ...product, variants: [second] }, now).fingerprint).not.toBe(productNotificationSnapshot(product, now).fingerprint);
  });
  it.each(['', '-1', 'Infinity', '1e3', '1.999'])('fails closed on malformed price %s', price => {
    expect(() => productNotificationSnapshot({ ...product, variants: [{ ...product.variants[0], price }] }, now)).toThrow();
  });
  it('notifies previous and new canonical URLs when renamed', async () => {
    const h = harness({ version: 1, submittedUrl: canonical, submittedFingerprint: 'old' }, { handle: 'renamed-product' });
    await processProductNotification(h);
    expect(h.notify).toHaveBeenCalledWith([canonical, 'https://dollwow.com/products/renamed-product']);
  });
  it('notifies a previously public URL when unpublished', async () => {
    const h = harness({ version: 1, submittedUrl: canonical, submittedFingerprint: 'old' }, { status: 'DRAFT' });
    await processProductNotification(h);
    expect(h.notify).toHaveBeenCalledWith([canonical]);
  });
  it('does not notify after losing a CAS claim', async () => {
    const h = harness(); h.write.mockReset().mockResolvedValue(null);
    expect(await processProductNotification(h)).toEqual({ status: 'busy' });
    expect(h.notify).not.toHaveBeenCalled();
  });
  it('keeps an in-flight delivery retryable', async () => {
    const h = harness({ version: 1, pending: { fingerprint: 'old', url: canonical, claimedAt: new Date(now - 10_000).toISOString() } });
    expect(await processProductNotification(h)).toEqual({ status: 'busy' });
    expect(h.write).not.toHaveBeenCalled();
  });
  it('allows an expired claim to be retried', async () => {
    const h = harness({ version: 1, pending: { fingerprint: 'old', url: canonical, claimedAt: new Date(now - 100_000).toISOString() } });
    expect(await processProductNotification(h)).toMatchObject({ status: 'submitted' });
  });
  it('never marks failed outbound delivery as submitted', async () => {
    const h = harness(); h.notify.mockRejectedValue(new Error('unavailable'));
    await expect(processProductNotification(h)).rejects.toThrow();
    expect(h.write).toHaveBeenCalledTimes(1);
  });
  it('keeps failed post-acceptance persistence retryable', async () => {
    const h = harness(); h.write.mockReset().mockResolvedValueOnce('claim').mockResolvedValueOnce(null);
    await expect(processProductNotification(h)).rejects.toThrow('before commit');
  });
});
