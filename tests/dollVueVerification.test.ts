import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getProduct: vi.fn(), token: vi.fn(), eligibility: vi.fn(), cookie: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getProductByHandle: mocks.getProduct }));
vi.mock('@/lib/dollvue/eligibility', () => ({ resolveCurrentDollVueEligibility: mocks.eligibility }));
vi.mock('@/lib/dollvue/session', () => ({ verifyDollVueAccessToken: mocks.token, dollVueSessionCookie: mocks.cookie }));
import { GET } from '@/app/dollvue/verify/route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.token.mockReturnValue({ email: 'customer@example.test', handle: 'reviewed-doll' });
  mocks.cookie.mockReturnValue('session=verified; HttpOnly');
});

it('a valid email token cannot open a draft or unpublished product', async () => {
  mocks.getProduct.mockResolvedValue(null);
  const response = await GET(new Request('https://dollwow.com/dollvue/verify?token=valid'));
  expect(mocks.getProduct).toHaveBeenCalledWith('reviewed-doll', { cache: 'no-store', strict: true });
  expect(response.headers.get('location')).toContain('access=invalid');
  expect(response.headers.has('set-cookie')).toBe(false);
});

it('requires both current publication and current readiness', async () => {
  mocks.getProduct.mockResolvedValue({ handle: 'reviewed-doll' });
  mocks.eligibility.mockReturnValue({ available: false });
  expect((await GET(new Request('https://dollwow.com/dollvue/verify?token=valid'))).headers.has('set-cookie')).toBe(false);
  mocks.eligibility.mockReturnValue({ available: true });
  const response = await GET(new Request('https://dollwow.com/dollvue/verify?token=valid'));
  expect(response.headers.get('location')).toBe('https://dollwow.com/dollvue/reviewed-doll');
  expect(response.headers.get('set-cookie')).toContain('HttpOnly');
});

it('fails closed when Shopify is unavailable', async () => {
  mocks.getProduct.mockRejectedValue(new Error('unavailable'));
  expect((await GET(new Request('https://dollwow.com/dollvue/verify?token=valid'))).headers.has('set-cookie')).toBe(false);
});
