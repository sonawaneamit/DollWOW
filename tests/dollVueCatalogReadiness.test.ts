import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { dollVueReadinessFingerprint, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';

const mocks = vi.hoisted(() => ({ registry: {} as Record<string, DollVueReadinessRecord>,
  heldIds: new Set<string>(), currentEligibility: vi.fn(), batchHolds: vi.fn() }));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({ default: mocks.registry }));
vi.mock('@/lib/dollvue/currentHold', () => ({ getCurrentDollVueHolds: mocks.batchHolds }));
vi.mock('@/lib/dollvue/eligibility', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/dollvue/eligibility')>();
  mocks.currentEligibility.mockImplementation(async (product: Product) => {
    const result = actual.resolveDollVueEligibility(product);
    return { ...result, available: result.available && !mocks.heldIds.has(product.id) };
  });
  return { ...actual, resolveCurrentDollVueEligibility: mocks.currentEligibility };
});
vi.mock('@/lib/utils/env', () => ({
  env: { SHOPIFY_STORE_DOMAIN: 'test.myshopify.com', SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'test' },
  hasShopifyStorefrontEnv: () => true,
}));
vi.mock('@/lib/customization/configs', () => ({
  getCustomizationConfig: (product: Product): BrandCustomizationConfig => ({
    id: 'test', brandLabel: 'Example', leadTimeNote: '', rules: [],
    groups: product.extended.customizationGroups ?? [],
  }),
}));
import { getProducts, getSeoCatalogProducts, getSearchProducts, getProductsByHandles, getProductByHandle } from '@/lib/shopify/storefront';
import { resolveDollVueEligibility } from '@/lib/dollvue/eligibility';

type Node = Parameters<typeof mapShopifyProduct>[0] & { __typename: string };
const groups: BrandCustomizationConfig['groups'] = [{
  id: 'eyes', label: 'Eye color', display: 'swatches', options: [{
    id: 'blue', label: 'Blue', priceDelta: 0,
    swatch: { kind: 'image', value: '/option-assets/blue.webp' },
  }],
}];
function node(index: number, handle = `example-${index}`): Node {
  return {
    __typename: 'Product', id: `gid://shopify/Product/${index}`, handle, title: handle,
    description: 'Private detail description', vendor: 'Example', productType: 'Custom Doll', tags: [],
    featuredImage: { url: '/product-media/example.webp', altText: null, width: 800, height: 1000 },
    images: { edges: [{ node: { url: '/product-media/second.webp', altText: null, width: 800, height: 1000 } }] },
    variants: { edges: [] }, priceRange: {
      minVariantPrice: { amount: '100', currencyCode: 'USD' },
      maxVariantPrice: { amount: '100', currencyCode: 'USD' },
    },
    stockStatus: { value: 'custom' }, customizationGroups: { value: JSON.stringify(groups) },
    qcNote: { value: 'PRIVATE REVIEW EVIDENCE' },
  };
}
function approve(detail: Node) {
  const product = mapShopifyProduct(detail);
  const config: BrandCustomizationConfig = { id: 'test', brandLabel: 'Example', leadTimeNote: '', rules: [],
    groups: product.extended.customizationGroups! };
  mocks.registry[detail.id] = {
    productId: detail.id, policy: DOLLVUE_APPEARANCE_POLICY, status: 'ready',
    fingerprint: dollVueReadinessFingerprint(product, config), sourcePositions: [0],
    imageDigests: { '/product-media/example.webp': 'a'.repeat(64), '/option-assets/blue.webp': 'b'.repeat(64) },
    choices: [{ groupId: 'eyes', optionId: 'blue', reference: '/option-assets/blue.webp' }],
  };
}

const paths = [
  { name: 'catalog', read: (handles: string[]) => getProducts({ first: handles.length }) },
  { name: 'SEO catalog', read: (handles: string[]) => getSeoCatalogProducts({ first: handles.length, strict: true, includeDollVueEligibility: true }) },
  { name: 'search', read: (handles: string[]) => getSearchProducts({ first: handles.length }) },
  { name: 'handles', read: (handles: string[]) => getProductsByHandles(handles) },
];

function serve(details: Node[], hydrate: (ids: string[]) => unknown = ids => ({
  nodes: ids.map(id => details.find(detail => detail.id === id) ?? null),
})) {
  const cards = details.map(detail => ({ ...detail, description: 'Card description',
    images: { edges: [] }, customizationGroups: undefined, qcNote: undefined }));
  const fetchMock = vi.fn(async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { query: string; variables: Record<string, unknown> };
    let data: unknown;
    if (body.query.includes('query DollVueCatalogReadiness')) {
      data = hydrate(body.variables.ids as string[]);
    } else if (body.query.includes('query ProductsByHandle')) {
      data = Object.fromEntries(Object.values(body.variables).map((handle, index) =>
        [`product${index}`, cards.find(card => card.handle === handle) ?? null]));
    } else if (body.query.includes('query Product(')) {
      data = { product: details.find(detail => detail.handle === body.variables.handle) ?? null };
    } else {
      data = { products: { edges: cards.map(card => ({ node: card })), pageInfo: { hasNextPage: false } } };
    }
    return new Response(JSON.stringify({ data }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  for (const id of Object.keys(mocks.registry)) delete mocks.registry[id];
  mocks.heldIds.clear();
  mocks.currentEligibility.mockClear();
  mocks.batchHolds.mockReset().mockImplementation(async (ids: string[]) =>
    new Map(ids.map(id => [id, mocks.heldIds.has(id) ? 'held' : 'clear'])));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each([undefined, false])('keeps SEO eligibility lightweight with opt-in %s', async includeDollVueEligibility => {
  const detail = node(1);
  approve(detail);
  mocks.registry[detail.id].fingerprint = 'stale';
  mocks.heldIds.add(detail.id);
  const fetchMock = serve([detail]);
  const [card] = await getSeoCatalogProducts({ first: 1, strict: true, includeDollVueEligibility });
  expect(card.id).toBe(detail.id);
  expect(card.dollVueAvailable).toBe(true);
  expect(card.extended.customizationGroups).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ next: { revalidate: 300 } });
  expect(mocks.batchHolds).not.toHaveBeenCalled();
  expect(mocks.currentEligibility).not.toHaveBeenCalled();
});

describe.each(paths)('$name readiness badges', ({ read }) => {
  it('honors a current private hold even when the exact readiness fingerprint passes', async () => {
    const detail = node(1);
    approve(detail);
    mocks.heldIds.add(detail.id);
    serve([detail]);
    expect(resolveDollVueEligibility(mapShopifyProduct(detail)).available).toBe(true);
    expect((await read([detail.handle]))[0].dollVueAvailable).toBe(false);
    expect(mocks.currentEligibility).not.toHaveBeenCalled();
    expect(mocks.batchHolds).toHaveBeenCalledExactlyOnceWith([detail.id]);
  });

  it('matches exact PDP readiness without returning hydrated private data', async () => {
    const detail = node(1);
    approve(detail);
    const fetchMock = serve([detail]);
    const [card] = await read([detail.handle]);
    expect(card.dollVueAvailable).toBe(true);
    expect(card.dollVueAvailable).toBe(resolveDollVueEligibility(mapShopifyProduct(detail)).available);
    expect(card.extended.customizationGroups).toBeUndefined();
    expect(card.extended.qcNote).toBeUndefined();
    expect(card.images.some(image => image.url === '/product-media/second.webp')).toBe(false);
    expect(JSON.stringify(card)).not.toContain('PRIVATE REVIEW EVIDENCE');
    expect(JSON.stringify(card)).not.toContain(mocks.registry[detail.id].fingerprint);
    const hydration = fetchMock.mock.calls[1][1];
    expect(hydration.cache).toBe('no-store');
    expect(JSON.parse(String(hydration.body)).query).toContain('customization_groups');
    expect(JSON.parse(String(hydration.body)).query).toContain('media(first: 100)');
  });

  it.each(['menu', 'photo', 'policy', 'identity', 'stock'] as const)('rejects stale %s evidence', async change => {
    const detail = node(1);
    approve(detail);
    if (change === 'menu') detail.customizationGroups = { value: JSON.stringify([{ ...groups[0], label: 'Eye colour' }]) };
    if (change === 'photo') detail.images.edges[0].node.url = '/product-media/replaced.webp';
    if (change === 'policy') mocks.registry[detail.id].policy = 'old';
    if (change === 'identity') mocks.registry[detail.id].productId = 'other';
    if (change === 'stock') detail.stockStatus = { value: 'ready_to_ship' };
    serve([detail]);
    const [card] = await read([detail.handle]);
    expect(card.dollVueAvailable).toBe(false);
    expect(resolveDollVueEligibility(mapShopifyProduct(detail)).available).toBe(false);
    expect(mocks.batchHolds).not.toHaveBeenCalled();
  });

  it.each(['failure', 'missing', 'wrong-type', 'wrong-id', 'wrong-handle'] as const)(
    'fails closed on hydration %s, preserving cards and legacy behavior', async failure => {
      const detail = node(1), legacy = node(2, 'irontech-existing');
      approve(detail);
      serve([detail, legacy], () => {
        if (failure === 'failure') throw new Error('Upstream unavailable');
        return { nodes: [failure === 'missing' ? null : { ...detail,
          ...(failure === 'wrong-type' ? { __typename: 'Collection' } : {}),
          ...(failure === 'wrong-id' ? { id: 'unexpected' } : {}),
          ...(failure === 'wrong-handle' ? { handle: 'other-handle' } : {}),
        }] };
      });
      const cards = await read([detail.handle, legacy.handle]);
      expect(cards.map(card => card.id)).toEqual([detail.id, legacy.id]);
      expect(cards.map(card => card.dollVueAvailable)).toEqual([false, true]);
      expect(mocks.batchHolds).not.toHaveBeenCalled();
    }
  );

  it('does not hydrate unregistered or explicitly unready records', async () => {
    const legacy = node(1, 'irontech-existing'), excluded = node(2, 'irontech-excluded'), pending = node(3);
    approve(excluded); mocks.registry[excluded.id].status = 'excluded';
    approve(pending); mocks.registry[pending.id].status = 'needs-review';
    const fetchMock = serve([legacy, excluded, pending]);
    expect((await read([legacy.handle, excluded.handle, pending.handle])).map(card => card.dollVueAvailable))
      .toEqual([true, false, false]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.batchHolds).not.toHaveBeenCalled();
  });

  it.each(['unavailable', 'missing', 'failure'] as const)('disables only candidates on bulk hold %s', async failure => {
    const detail = node(1), legacy = node(2, 'irontech-existing');
    approve(detail);
    serve([detail, legacy]);
    if (failure === 'failure') mocks.batchHolds.mockRejectedValueOnce(new Error('Private upstream failure'));
    else mocks.batchHolds.mockResolvedValueOnce(new Map(failure === 'missing' ? [] : [[detail.id, 'unavailable']]));
    const cards = await read([detail.handle, legacy.handle]);
    expect(cards.map(card => card.id)).toEqual([detail.id, legacy.id]);
    expect(cards.map(card => card.dollVueAvailable)).toEqual([false, true]);
    expect(mocks.batchHolds).toHaveBeenCalledExactlyOnceWith([detail.id]);
    expect(mocks.currentEligibility).not.toHaveBeenCalled();
  });
});

it('decorates a strict product detail using current eligibility, not just fingerprint readiness', async () => {
  const detail = node(1);
  approve(detail);
  serve([detail]);
  expect((await getProductByHandle(detail.handle, { strict: true, cache: 'no-store' }))?.dollVueAvailable).toBe(true);
  mocks.heldIds.add(detail.id);
  expect((await getProductByHandle(detail.handle, { strict: true, cache: 'no-store' }))?.dollVueAvailable).toBe(false);
  expect(mocks.currentEligibility).toHaveBeenCalledTimes(2);
  expect(mocks.batchHolds).not.toHaveBeenCalled();
});

it('deduplicates ready IDs and batches at 50 without per-product fanout', async () => {
  const details = Array.from({ length: 101 }, (_, index) => node(index + 1));
  details.forEach(approve);
  const fetchMock = serve([...details, details[0]], ids => ({
    nodes: ids.map(id => details.find(detail => detail.id === id)),
  }));
  const cards = await getProducts({ first: 102 });
  expect(cards).toHaveLength(102);
  expect(cards.every(card => card.dollVueAvailable)).toBe(true);
  const batches = fetchMock.mock.calls.slice(1).map(([, init]) => JSON.parse(String(init.body)).variables.ids);
  expect(batches.map(ids => ids.length)).toEqual([50, 50, 1]);
  expect(new Set(batches.flat()).size).toBe(101);
  expect(mocks.batchHolds).toHaveBeenCalledExactlyOnceWith(details.map(detail => detail.id));
  expect(mocks.currentEligibility).not.toHaveBeenCalled();
});

it('isolates a failed hydration chunk without discarding other verified results', async () => {
  const details = Array.from({ length: 51 }, (_, index) => node(index + 1));
  details.forEach(approve);
  serve(details, ids => {
    if (ids.length === 50) throw new Error('First batch failed');
    return { nodes: [details[50]] };
  });
  const cards = await getProducts({ first: 51 });
  expect(cards).toHaveLength(51);
  expect(cards.slice(0, 50).every(card => card.dollVueAvailable === false)).toBe(true);
  expect(cards[50].dollVueAvailable).toBe(true);
  expect(mocks.batchHolds).toHaveBeenCalledExactlyOnceWith([details[50].id]);
});

describe('bounded DollVue landing rail', () => {
  const rail = (limit = 9) => getSeoCatalogProducts({ first: 5000, strict: true, includeDollVueEligibility: true, dollVueLimit: limit });

  it('stops at nine in the existing catalog order without hydrating unrelated cards or leaking details', async () => {
    const details = Array.from({ length: 60 }, (_, index) => node(index + 1));
    details.forEach(approve);
    details[30].sourceReleaseRank = { value: '99999' };
    const fetchMock = serve(details);
    const cards = await rail();
    expect(cards.map(card => card.id)).toEqual(details.slice(0, 9).map(detail => detail.id));
    expect(cards.every(card => card.extended.sourceReleaseRank === undefined)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const hydration = fetchMock.mock.calls[1][1];
    expect(hydration.cache).toBe('no-store');
    expect(JSON.parse(String(hydration.body)).variables.ids).toEqual(details.slice(0, 9).map(detail => detail.id));
    expect(mocks.batchHolds).toHaveBeenCalledExactlyOnceWith(cards.map(card => card.id));
    expect(cards.every(card => card.images.length === 1 && card.variants.length === 0 && card.description === '')).toBe(true);
    expect(JSON.stringify(cards)).not.toContain('PRIVATE REVIEW EVIDENCE');
    expect(cards.every(card => card.extended.customizationGroups === undefined)).toBe(true);
  });

  it('continues past stale and held candidates rather than filling with unsafe or empty slots', async () => {
    const details = Array.from({ length: 6 }, (_, index) => node(index + 1));
    details.forEach(approve);
    mocks.registry[details[0].id].fingerprint = 'stale';
    mocks.heldIds.add(details[1].id);
    serve(details);
    expect((await rail(3)).map(card => card.id)).toEqual(details.slice(2, 5).map(detail => detail.id));
  });

  it('keeps the already released legacy pilot, excluding explicitly unready and warehouse cards', async () => {
    const legacy = node(1, 'irontech-existing'), excluded = node(2, 'irontech-excluded'), stock = node(3, 'irontech-stock');
    approve(excluded); mocks.registry[excluded.id].status = 'excluded';
    stock.stockStatus = { value: 'ready_to_ship' };
    const fetchMock = serve([excluded, stock, legacy]);
    expect((await rail(1)).map(card => card.id)).toEqual([legacy.id]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.batchHolds).not.toHaveBeenCalled();
  });

  it('reads subsequent catalog pages when an earlier page has no eligible candidates', async () => {
    const excluded = node(1), approved = node(2);
    approve(approved);
    const original = serve([excluded, approved]);
    const fetchMock = vi.fn(async (url: unknown, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      if (!body.query.includes('query SeoCatalogProducts')) return original(url, init);
      const secondPage = body.variables.after === 'next';
      return new Response(JSON.stringify({ data: { products: {
        edges: [{ node: secondPage ? approved : excluded }],
        pageInfo: { hasNextPage: !secondPage, endCursor: secondPage ? null : 'next' },
      } } }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    expect((await rail(1)).map(card => card.id)).toEqual([approved.id]);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).variables.after).toBe('next');
  });

  it('does not cache a private hold change between rail requests', async () => {
    const details = [node(1), node(2)];
    details.forEach(approve);
    serve(details);
    expect((await rail(1)).map(card => card.id)).toEqual([details[0].id]);
    mocks.heldIds.add(details[0].id);
    expect((await rail(1)).map(card => card.id)).toEqual([details[1].id]);
    expect(mocks.batchHolds).toHaveBeenCalledTimes(3);
  });

  it('fails closed on missing detail evidence and returns fewer cards if none remain', async () => {
    const detail = node(1);
    approve(detail);
    serve([detail], () => ({ nodes: [null] }));
    expect(await rail(1)).toEqual([]);
    expect(mocks.batchHolds).not.toHaveBeenCalled();
  });

  it.each([0, 37, 1.5, Infinity])('rejects an invalid rail limit %s', async limit => {
    await expect(rail(limit)).rejects.toThrow(RangeError);
  });

  it('requires strict reads and current eligibility for the limited path', async () => {
    await expect(getSeoCatalogProducts({ dollVueLimit: 9 })).rejects.toThrow(RangeError);
    await expect(getSeoCatalogProducts({ strict: true, dollVueLimit: 9 })).rejects.toThrow(RangeError);
  });
});
