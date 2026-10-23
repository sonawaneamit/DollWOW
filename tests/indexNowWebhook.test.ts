import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/shopify/indexNowNotification', () => ({ notifyShopifyProductChange: vi.fn() }));
import { notifyShopifyProductChange } from '@/lib/shopify/indexNowNotification';
import { POST } from '@/app/api/webhooks/shopify/products/route';

const secret = 'test-only-secret', productId = 'gid://shopify/Product/1';
const notify = vi.mocked(notifyShopifyProductChange);
function request(body = JSON.stringify({ admin_graphql_api_id: productId }), headers: Record<string, string> = {}) {
  return new Request('https://dollwow.com/api/webhooks/shopify/products', { method: 'POST', body,
    headers: { 'x-shopify-hmac-sha256': createHmac('sha256', secret).update(body).digest('base64'),
      'x-shopify-shop-domain': 'sample.myshopify.com', 'x-shopify-topic': 'products/update', ...headers } });
}
beforeEach(() => {
  vi.stubEnv('SHOPIFY_CLIENT_SECRET', secret); vi.stubEnv('SHOPIFY_WEBHOOK_SECRET', '');
  vi.stubEnv('SHOPIFY_STORE_DOMAIN', 'sample.myshopify.com'); vi.stubEnv('VERCEL_ENV', 'production');
  notify.mockReset().mockResolvedValue({ status: 'unchanged' });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('authenticated product-only webhook', () => {
  it('dispatches a valid product update', async () => {
    expect((await POST(request())).status).toBe(200);
    expect(notify).toHaveBeenCalledExactlyOnceWith(productId);
  });
  it('accepts the safe numeric identity fallback', async () => {
    expect((await POST(request('{"id":1}'))).status).toBe(200);
    expect(notify).toHaveBeenCalledWith(productId);
  });
  it.each(['{"id":9007199254740992}', '{"admin_graphql_api_id":"gid://shopify/Order/1"}', 'null', 'invalid'])('rejects invalid identities without reading Shopify: %s', async body => {
    expect((await POST(request(body))).status).toBe(400);
    expect(notify).not.toHaveBeenCalled();
  });
  it.each([
    [{ 'x-shopify-hmac-sha256': 'invalid' }, 401],
    [{ 'x-shopify-shop-domain': 'other.myshopify.com' }, 403],
    [{ 'x-shopify-topic': 'orders/create' }, 400]
  ] as const)('rejects invalid authentication/topic %j', async (headers, status) => {
    expect((await POST(request(undefined, headers))).status).toBe(status);
    expect(notify).not.toHaveBeenCalled();
  });
  it('fails closed when authentication is unconfigured', async () => {
    vi.stubEnv('SHOPIFY_CLIENT_SECRET', '');
    expect((await POST(request())).status).toBe(503);
    expect(notify).not.toHaveBeenCalled();
  });
  it('keeps previews inert even with a valid signature', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const result = await POST(request());
    expect(await result.json()).toEqual({ status: 'preview_disabled' });
    expect(notify).not.toHaveBeenCalled();
  });
  it('rejects oversized declared or streamed bodies', async () => {
    expect((await POST(request('{}', { 'content-length': String(3 * 1024 * 1024) }))).status).toBe(413);
    expect((await POST(request('x'.repeat(2 * 1024 * 1024 + 1)))).status).toBe(413);
    expect(notify).not.toHaveBeenCalled();
  });
  it('returns retryable 503 for a busy claim', async () => {
    notify.mockResolvedValue({ status: 'busy' });
    expect((await POST(request())).status).toBe(503);
  });
  it('returns retryable 503 without exposing failure details', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    notify.mockRejectedValue(new Error('private supplier or credential detail'));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private supplier');
  });
});
