import {afterEach, beforeEach, expect, it, vi} from 'vitest';
const state = vi.hoisted(() => ({configured:true}));
vi.mock('@/lib/utils/env', () => ({env:{SHOPIFY_STORE_DOMAIN:'test.myshopify.com', SHOPIFY_STOREFRONT_ACCESS_TOKEN:'test'}, hasShopifyStorefrontEnv:() => state.configured}));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({default:{}}));
import {getProducts} from '@/lib/shopify/storefront';

beforeEach(() => {state.configured = true; vi.spyOn(console, 'error').mockImplementation(() => {});});
afterEach(() => {vi.unstubAllGlobals(); vi.restoreAllMocks();});

it('fails closed only when strict is explicitly requested with missing credentials', async () => {
  state.configured = false;
  expect(await getProducts({strict:true})).toEqual([]);
  expect((await getProducts()).length).toBeGreaterThan(0);
});
it.each(['empty','failure'])('does not substitute samples for a strict %s response', async mode => {
  vi.stubGlobal('fetch', vi.fn(async () => {
    if (mode === 'failure') throw new Error('offline');
    return new Response(JSON.stringify({data:{products:{edges:[],pageInfo:{hasNextPage:false}}}}));
  }));
  expect(await getProducts({strict:true})).toEqual([]);
  expect((await getProducts()).length).toBeGreaterThan(0);
});
it.each([['CREATED_AT',true],['BEST_SELLING',false]] as const)('passes %s ordering and the lightweight cached image limit intact', async (sortKey,reverse) => {
  const fetchMock = vi.fn(async (_url: unknown, _init: RequestInit) => new Response(JSON.stringify({data:{products:{edges:[],pageInfo:{hasNextPage:false}}}})));
  vi.stubGlobal('fetch',fetchMock);
  await getProducts({strict:true,sortKey,reverse,imageFirst:1,revalidate:300});
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit & {next:{revalidate:number}};
  const request = JSON.parse(String(init.body));
  expect(request.variables).toMatchObject({sortKey,reverse});
  expect(request.query).toContain('images(first: 1)');
  expect(init.next.revalidate).toBe(300);
});
