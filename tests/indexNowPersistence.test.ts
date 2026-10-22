import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/shopify/admin', () => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/seo/indexNow', () => ({ indexNowKey: () => 'test-public-key', notifyIndexNow: vi.fn(),
  INDEXNOW_ORIGIN: 'https://dollwow.com', indexNowUrls: (urls: string[]) => [...new Set(urls)] }));
import { adminFetch } from '@/lib/shopify/admin';
import { notifyIndexNow } from '@/lib/seo/indexNow';
import { notifyShopifyProductChange } from '@/lib/shopify/indexNowNotification';

const api = vi.mocked(adminFetch), notify = vi.mocked(notifyIndexNow);
const source = {
  id: 'gid://shopify/Product/1', handle: 'sample-product', status: 'ACTIVE', publishedAt: '2026-01-01T00:00:00Z',
  vendor: 'Irontech', tags: [], priceRangeV2: { minVariantPrice: { currencyCode: 'USD' } },
  variants: { nodes: [{ id: 'gid://shopify/ProductVariant/2', price: '1999' }], pageInfo: { hasNextPage: false } }, state: null
};
const saved = (digest: string) => ({ metafieldsSet: { metafields: [{ compareDigest: digest }], userErrors: [] } });
beforeEach(() => {
  api.mockReset(); notify.mockReset().mockResolvedValue({ status: 200, count: 1, validationPending: false });
});
describe('Shopify app-owned CAS persistence', () => {
  it('conditionally creates state, then commits with the claim digest', async () => {
    api.mockResolvedValueOnce({ product: source }).mockResolvedValueOnce(saved('claim')).mockResolvedValueOnce(saved('committed'));
    expect(await notifyShopifyProductChange(source.id)).toMatchObject({ status: 'submitted' });
    expect(api.mock.calls[1][1]).toMatchObject({ fields: [{ ownerId: source.id, namespace: '$app:indexnow', key: 'notification_state', type: 'json', compareDigest: null }] });
    expect(api.mock.calls[2][1]).toMatchObject({ fields: [{ compareDigest: 'claim' }] });
  });
  it('treats a lost CAS race as retryable without notifying', async () => {
    api.mockResolvedValueOnce({ product: source }).mockResolvedValueOnce({ metafieldsSet: { metafields: [], userErrors: [{ code: 'STALE_OBJECT', message: 'changed' }] } });
    expect(await notifyShopifyProductChange(source.id)).toEqual({ status: 'busy' });
    expect(notify).not.toHaveBeenCalled();
  });
  it('does not mask permissions or malformed digests as successful claims', async () => {
    api.mockResolvedValueOnce({ product: source }).mockResolvedValueOnce({ metafieldsSet: { metafields: [], userErrors: [{ code: 'INVALID_COMPARE_DIGEST', message: 'bad digest' }] } });
    await expect(notifyShopifyProductChange(source.id)).rejects.toThrow();
    expect(notify).not.toHaveBeenCalled();
  });
  it('rejects partial variant reads and corrupt stored state', async () => {
    api.mockResolvedValueOnce({ product: { ...source, variants: { ...source.variants, pageInfo: { hasNextPage: true } } } });
    await expect(notifyShopifyProductChange(source.id)).rejects.toThrow('verified limit');
    api.mockResolvedValueOnce({ product: { ...source, state: { value: '{"version":2}', compareDigest: 'old' } } });
    await expect(notifyShopifyProductChange(source.id)).rejects.toThrow();
    expect(notify).not.toHaveBeenCalled();
  });
  it('ignores deleted/missing products without inventing their former URL', async () => {
    api.mockResolvedValueOnce({ product: null });
    expect(await notifyShopifyProductChange(source.id)).toEqual({ status: 'missing_product' });
    expect(notify).not.toHaveBeenCalled();
  });
});
