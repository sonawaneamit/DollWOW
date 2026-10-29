import {afterEach, expect, it, vi} from 'vitest';
import {SE_ELF_FACTS} from '@/lib/customization/se-oct27-preview';

const {lookup} = vi.hoisted(() => ({lookup: vi.fn(async () => null)}));
vi.mock('@/lib/shopify/storefront', () => ({getProductByHandle: lookup}));
import {GET} from '@/app/product-media/[handle]/[position]/route';

afterEach(() => vi.clearAllMocks());
it.each(Object.keys(SE_ELF_FACTS))('does not use the cached initial gallery in the protected image route: %s', async handle => {
  const response = await GET(new Request(`https://dollwow.com/product-media/v4/${handle}/48`),
    {params: Promise.resolve({handle, position: '48'})});
  expect(lookup).toHaveBeenCalledExactlyOnceWith(handle, {cache: 'no-store'});
  expect(response.status).toBe(404);
  expect(response.headers.get('cache-control')).toBe('no-store');
});

it('preserves the existing media cache policy for unrelated products', async () => {
  const handle = 'sedoll-akina-157cm-h-cup-tpe-companion-doll-z7mv2';
  await GET(new Request(`https://dollwow.com/product-media/v4/${handle}/0`),
    {params: Promise.resolve({handle, position: '0'})});
  expect(lookup).toHaveBeenCalledExactlyOnceWith(handle, {revalidate: 120});
});

it('continues rejecting invalid handles without a catalog lookup', async () => {
  const response = await GET(new Request('https://dollwow.com/product-media/v4/invalid/0'),
    {params: Promise.resolve({handle: '../invalid', position: '0'})});
  expect(response.status).toBe(400);
  expect(lookup).not.toHaveBeenCalled();
});
