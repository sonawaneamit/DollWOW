import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminFetch } from '@/lib/shopify/admin';
import { hasShopifyAdminEnv } from '@/lib/utils/env';
import { getCurrentDollVueHold, getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';

vi.mock('@/lib/shopify/admin', () => ({ adminFetch: vi.fn() }));
vi.mock('@/lib/utils/env', () => ({ hasShopifyAdminEnv: vi.fn() }));

const id = 'gid://shopify/Product/10431698337976';
const response = (hold: { value: string } | null) => ({ product: { id, hold } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(hasShopifyAdminEnv).mockReturnValue(true);
  // Any accidental request outside the mocked Admin client must fail offline.
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); }));
});

describe('bulk current private DollVue holds', () => {
  const ids = (count: number) => Array.from({ length: count }, (_, index) => `gid://shopify/Product/${index + 1}`);
  const clearNodes = (productIds: string[]) => ({ nodes: productIds.map(id => ({ id, hold: null })) });

  it.each([1, 50, 51, 101])('chunks %i unique IDs into requests of at most 50', async count => {
    const productIds = ids(count);
    vi.mocked(adminFetch).mockImplementation(async (_query, variables) => clearNodes(variables!.ids as string[]));
    const results = await getCurrentDollVueHolds(productIds);
    expect(results.size).toBe(count);
    expect([...results.values()].every(value => value === 'clear')).toBe(true);
    expect(adminFetch).toHaveBeenCalledTimes(Math.ceil(count / 50));
    expect(vi.mocked(adminFetch).mock.calls.flatMap(([, variables]) => variables!.ids)).toEqual(productIds);
    for (const [query, variables] of vi.mocked(adminFetch).mock.calls) {
      expect((variables!.ids as string[]).length).toBeLessThanOrEqual(50);
      expect(query).toContain('nodes(ids: $ids)');
      expect(query).toContain('... on Product');
      expect(query).toContain('key: "catalog_image_review_hold"');
      expect(query).not.toContain('mutation');
    }
  });

  it('deduplicates valid IDs and retains invalid inputs as unavailable', async () => {
    vi.mocked(adminFetch).mockResolvedValue(clearNodes([id]));
    const results = await getCurrentDollVueHolds([id, '', id, 'sample', 'gid://shopify/ProductVariant/1']);
    expect([...results]).toEqual([[id, 'clear'], ['', 'unavailable'], ['sample', 'unavailable'], ['gid://shopify/ProductVariant/1', 'unavailable']]);
    expect(adminFetch).toHaveBeenCalledExactlyOnceWith(expect.any(String), { ids: [id] });
  });

  it('makes no requests for empty, invalid-only or unconfigured input', async () => {
    expect(await getCurrentDollVueHolds([])).toEqual(new Map());
    expect(await getCurrentDollVueHolds(['bad'])).toEqual(new Map([['bad', 'unavailable']]));
    vi.mocked(hasShopifyAdminEnv).mockReturnValue(false);
    expect(await getCurrentDollVueHolds([id])).toEqual(new Map([[id, 'unavailable']]));
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it('distinguishes absent nodes, malformed holds, empty holds and private held notes', async () => {
    const productIds = ids(7);
    vi.mocked(adminFetch).mockResolvedValue({ nodes: [
      null,
      { id: productIds[1], hold: null },
      { id: productIds[2], hold: { value: ' \n ' } },
      { id: productIds[3], hold: { value: 'Private reason' } },
      { id: productIds[4] },
      { id: productIds[5], hold: { value: false } },
      { id: productIds[6], hold: { value: 'false' } },
    ] });
    expect([...(await getCurrentDollVueHolds(productIds)).values()]).toEqual([
      'unavailable', 'clear', 'clear', 'held', 'unavailable', 'unavailable', 'held',
    ]);
  });

  it.each([undefined, {}, { nodes: null }, { nodes: [] }, { nodes: [{ id, hold: null }, null] }])(
    'fails closed on a malformed or truncated chunk: %j', async data => {
      vi.mocked(adminFetch).mockResolvedValue(data);
      expect(await getCurrentDollVueHolds([id])).toEqual(new Map([[id, 'unavailable']]));
    },
  );

  it('rejects reordered or mismatched nodes instead of clearing the wrong product', async () => {
    const productIds = ids(2);
    vi.mocked(adminFetch).mockResolvedValue(clearNodes([...productIds].reverse()));
    expect([...(await getCurrentDollVueHolds(productIds)).values()]).toEqual(['unavailable', 'unavailable']);
  });

  it('keeps successful chunks when another chunk fails, without logging private errors', async () => {
    const productIds = ids(51);
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(adminFetch).mockRejectedValueOnce(new Error('Private upstream detail'))
      .mockResolvedValueOnce({ nodes: [{ id: productIds[50], hold: { value: 'Private hold' } }] });
    const results = await getCurrentDollVueHolds(productIds);
    expect(productIds.slice(0, 50).every(id => results.get(id) === 'unavailable')).toBe(true);
    expect(results.get(productIds[50])).toBe('held');
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('limits concurrent chunks to four and stops queued chunks at the overall deadline', async () => {
    vi.useFakeTimers();
    const productIds = ids(251);
    const completions: Array<(value: unknown) => void> = [];
    vi.mocked(adminFetch).mockImplementation(() => new Promise(resolve => { completions.push(resolve); }));
    const check = getCurrentDollVueHolds(productIds);
    expect(adminFetch).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(3000);
    const results = await check;
    expect(adminFetch).toHaveBeenCalledTimes(4);
    expect(results.size).toBe(251);
    expect([...results.values()].every(value => value === 'unavailable')).toBe(true);
    completions.forEach((resolve, index) => resolve(clearNodes(productIds.slice(index * 50, index * 50 + 50))));
    await vi.advanceTimersByTimeAsync(0);
    expect([...results.values()].every(value => value === 'unavailable')).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('drains queued chunks without retaining results between bulk calls', async () => {
    const productIds = ids(251);
    vi.mocked(adminFetch).mockImplementation(async (_query, variables) => clearNodes(variables!.ids as string[]));
    expect([...(await getCurrentDollVueHolds(productIds)).values()].every(value => value === 'clear')).toBe(true);
    expect(adminFetch).toHaveBeenCalledTimes(6);
    vi.mocked(adminFetch).mockResolvedValue({ nodes: [{ id: productIds[0], hold: { value: 'New hold' } }] });
    expect((await getCurrentDollVueHolds([productIds[0]])).get(productIds[0])).toBe('held');
  });
});

afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('current private DollVue hold', () => {
  it.each([null, { value: '' }, { value: ' \n\t ' }])('allows only a verified empty hold: %j', async hold => {
    vi.mocked(adminFetch).mockResolvedValue(response(hold));
    await expect(getCurrentDollVueHold(id)).resolves.toBe('clear');
    expect(adminFetch).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(
      'metafield(namespace: "custom", key: "catalog_image_review_hold")'
    ), { id });
    const query = vi.mocked(adminFetch).mock.calls[0][0];
    expect(query).toContain('product(id: $id)');
    expect(query).not.toContain('mutation');
  });

  it.each(['Private review notes', ' false ', '0'])('blocks every nonempty hold without returning its text: %s', async value => {
    vi.mocked(adminFetch).mockResolvedValue(response({ value }));
    await expect(getCurrentDollVueHold(id)).resolves.toBe('held');
  });

  it('does not retain clear results or held results between actions', async () => {
    vi.mocked(adminFetch)
      .mockResolvedValueOnce(response(null))
      .mockResolvedValueOnce(response({ value: 'New private hold' }))
      .mockResolvedValueOnce(response(null));
    await expect(getCurrentDollVueHold(id)).resolves.toBe('clear');
    await expect(getCurrentDollVueHold(id)).resolves.toBe('held');
    await expect(getCurrentDollVueHold(id)).resolves.toBe('clear');
    expect(adminFetch).toHaveBeenCalledTimes(3);
  });

  it('fails closed when Admin credentials are unavailable', async () => {
    vi.mocked(hasShopifyAdminEnv).mockReturnValue(false);
    await expect(getCurrentDollVueHold(id)).resolves.toBe('unavailable');
    expect(adminFetch).not.toHaveBeenCalled();
  });

  it.each(['', 'sample-product', 'gid://shopify/ProductVariant/123', 'gid://shopify/Product/0', `${id}?other=1`])(
    'rejects an invalid product ID without an Admin request: %s', async productId => {
      await expect(getCurrentDollVueHold(productId)).resolves.toBe('unavailable');
      expect(adminFetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    undefined, null, {}, { product: null }, { product: {} },
    { product: { id } }, { product: { id, hold: {} } },
    { product: { id, hold: { value: null } } },
    { product: { id, hold: { value: false } } },
    { product: { id: 'gid://shopify/Product/999', hold: null } },
  ])('fails closed for missing, mismatched or malformed data: %j', async data => {
    vi.mocked(adminFetch).mockResolvedValue(data);
    await expect(getCurrentDollVueHold(id)).resolves.toBe('unavailable');
  });

  it('does not expose or log private upstream errors', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(adminFetch).mockRejectedValue(new Error('Private review note or authentication detail'));
    await expect(getCurrentDollVueHold(id)).resolves.toBe('unavailable');
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('bounds caller latency and ignores a late clear result', async () => {
    vi.useFakeTimers();
    let resolve!: (value: unknown) => void;
    vi.mocked(adminFetch).mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const check = getCurrentDollVueHold(id);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(check).resolves.toBe('unavailable');
    resolve(response(null));
    await expect(check).resolves.toBe('unavailable');
    expect(vi.getTimerCount()).toBe(0);
    vi.mocked(adminFetch).mockResolvedValueOnce(response({ value: 'Fresh hold' }));
    await expect(getCurrentDollVueHold(id)).resolves.toBe('held');
  });

  it('handles rejection after its deadline without leaking an unhandled error', async () => {
    vi.useFakeTimers();
    let reject!: (error: Error) => void;
    vi.mocked(adminFetch).mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }));
    const check = getCurrentDollVueHold(id);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(check).resolves.toBe('unavailable');
    reject(new Error('Late private upstream failure'));
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up the deadline immediately after a successful lookup', async () => {
    vi.useFakeTimers();
    vi.mocked(adminFetch).mockResolvedValue(response(null));
    await expect(getCurrentDollVueHold(id)).resolves.toBe('clear');
    expect(vi.getTimerCount()).toBe(0);
  });
});
