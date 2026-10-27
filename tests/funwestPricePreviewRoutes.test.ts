import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ create: vi.fn(), checkout: vi.fn(), lookup: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ createCart: mocks.create, createCartWithLines: mocks.checkout, getProductsByVariantIds: mocks.lookup }));
import { POST as create } from '@/app/api/cart/create/route';
import { POST as checkout } from '@/app/api/cart/checkout/route';
afterEach(() => vi.unstubAllEnvs());
it('both cart routes stop before lookup or Shopify mutation in the pricing preview', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('DOLLWOW_FUNWEST_PRICE_PREVIEW', '1');
  for (const route of [create, checkout]) {
    const response = await route(new Request('https://preview.invalid/api/cart', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('Pricing review only');
  }
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.checkout).not.toHaveBeenCalled();
  expect(mocks.lookup).not.toHaveBeenCalled();
});
