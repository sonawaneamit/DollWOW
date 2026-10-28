import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { admin } = vi.hoisted(() => ({ admin: vi.fn() }));
vi.mock('@/lib/shopify/admin', () => ({ adminFetch: admin }));
beforeEach(() => { vi.resetModules(); admin.mockReset(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('authenticated canonical webhook shop identity', () => {
  it('normalizes a shop host but rejects URLs, ports and lookalike suffixes', async () => {
    const { canonicalWebhookShopDomain: parse } = await import('@/lib/shopify/webhookShop');
    expect(parse(' Shop-123.MyShopify.com ')).toBe('shop-123.myshopify.com');
    for (const value of [null, '', 'shop.example.com', 'https://shop.myshopify.com', 'shop.myshopify.com.attacker.test', 'shop.myshopify.com:443', 'user@shop.myshopify.com']) expect(parse(value)).toBeNull();
  });
  it('reads the canonical host only from authenticated Admin and caches for five minutes', async () => {
    admin.mockResolvedValue({ shop: { myshopifyDomain: 'permanent-shop.myshopify.com' } });
    const { expectedWebhookShopDomain } = await import('@/lib/shopify/webhookShop');
    expect(await expectedWebhookShopDomain()).toBe('permanent-shop.myshopify.com');
    expect(await expectedWebhookShopDomain()).toBe('permanent-shop.myshopify.com');
    expect(admin).toHaveBeenCalledTimes(1);
    expect(admin).toHaveBeenCalledWith('query WebhookShopIdentity { shop { myshopifyDomain } }');
    await vi.advanceTimersByTimeAsync(300001);
    await expectedWebhookShopDomain();
    expect(admin).toHaveBeenCalledTimes(2);
  });
  it('shares an in-flight authenticated lookup across concurrent deliveries', async () => {
    let resolve!: (value: { shop: { myshopifyDomain: string } }) => void;
    admin.mockReturnValue(new Promise(r => { resolve = r; }));
    const { expectedWebhookShopDomain } = await import('@/lib/shopify/webhookShop');
    const a = expectedWebhookShopDomain(), b = expectedWebhookShopDomain();
    expect(admin).toHaveBeenCalledTimes(1);
    resolve({ shop: { myshopifyDomain: 'permanent-shop.myshopify.com' } });
    expect(await a).toBe('permanent-shop.myshopify.com');
    expect(await b).toBe('permanent-shop.myshopify.com');
  });
  it('does not cache failed lookups or substitute a configured alias', async () => {
    admin.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue({ shop: { myshopifyDomain: 'permanent-shop.myshopify.com' } });
    const { expectedWebhookShopDomain } = await import('@/lib/shopify/webhookShop');
    await expect(expectedWebhookShopDomain()).rejects.toThrow('unavailable');
    expect(await expectedWebhookShopDomain()).toBe('permanent-shop.myshopify.com');
    expect(admin).toHaveBeenCalledTimes(2);
  });
  it('fails closed on invalid authenticated identity data', async () => {
    admin.mockResolvedValue({ shop: { myshopifyDomain: 'other.example.com' } });
    const { expectedWebhookShopDomain } = await import('@/lib/shopify/webhookShop');
    await expect(expectedWebhookShopDomain()).rejects.toThrow('Invalid canonical shop identity');
  });
});
