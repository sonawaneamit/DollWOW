import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(), getProduct: vi.fn(), token: vi.fn(), sendEmail: vi.fn(),
  currentEligibility: vi.fn(), fetch: vi.fn(),
}));
vi.mock('@/lib/ai/rateLimit', () => ({ checkRateLimit: mocks.rateLimit }));
vi.mock('@/lib/shopify/storefront', () => ({ getProductByHandle: mocks.getProduct }));
vi.mock('@/lib/dollvue/session', () => ({ createDollVueAccessToken: mocks.token }));
vi.mock('@/lib/email/sendEmail', () => ({ sendEmail: mocks.sendEmail }));
vi.mock('@/lib/dollvue/eligibility', () => ({ resolveCurrentDollVueEligibility: mocks.currentEligibility }));
vi.mock('@/lib/utils/env', () => ({ env: { NEXT_PUBLIC_SITE_URL: 'https://dollwow.com' } }));

import { POST } from '@/app/dollvue/access/route';

function request() {
  return new Request('https://dollwow.com/dollvue/access', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1, 192.0.2.2' },
    body: JSON.stringify({ email: 'Customer@Example.test', handle: 'reviewed-doll' }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.rateLimit.mockResolvedValue({ allowed: true });
  mocks.getProduct.mockResolvedValue({ handle: 'reviewed-doll', dollVueAvailable: true });
  mocks.token.mockReturnValue('signed+token/with=encoding');
  mocks.sendEmail.mockResolvedValue({ delivered: true });
  mocks.fetch.mockRejectedValue(new Error('Unexpected real network call'));
  vi.stubGlobal('fetch', mocks.fetch);
});

afterEach(() => {
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.currentEligibility).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe('POST /dollvue/access', () => {
  it.each(['dollvue-access-email', 'dollvue-access-ip'])('blocks %s before any product lookup or email', async blockedScope => {
    mocks.rateLimit.mockImplementation(async ({ scope }: { scope: string }) => ({ allowed: scope !== blockedScope }));
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.rateLimit).toHaveBeenCalledTimes(2);
    expect(mocks.getProduct).not.toHaveBeenCalled();
    expect(mocks.token).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('waits for both limiter decisions before reading the product', async () => {
    let finishIp!: (value: { allowed: boolean }) => void;
    mocks.rateLimit.mockImplementation(({ scope }: { scope: string }) => scope === 'dollvue-access-ip'
      ? new Promise(resolve => { finishIp = resolve; })
      : Promise.resolve({ allowed: true }));
    const pending = POST(request());
    await vi.waitFor(() => expect(mocks.rateLimit).toHaveBeenCalledTimes(2));
    expect(mocks.getProduct).not.toHaveBeenCalled();
    finishIp({ allowed: false });
    await pending;
    expect(mocks.getProduct).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['draft or unpublished', null],
    ['currently held', { handle: 'reviewed-doll', dollVueAvailable: false }],
    ['missing current availability', { handle: 'reviewed-doll' }],
  ])('does not issue a token or email for %s products', async (_label, product) => {
    mocks.getProduct.mockResolvedValue(product);
    const response = await POST(request());
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.getProduct).toHaveBeenCalledExactlyOnceWith('reviewed-doll', { cache: 'no-store', strict: true });
    expect(mocks.token).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('does not email when the strict lookup fails', async () => {
    mocks.getProduct.mockRejectedValue(new Error('Shopify unavailable'));
    expect(await (await POST(request())).json()).toEqual({ ok: true });
    expect(mocks.token).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('sends one encoded verification token only for a currently ready product', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.rateLimit).toHaveBeenCalledWith({
      scope: 'dollvue-access-email', identifier: 'customer@example.test', limit: 4, windowSeconds: 3600,
    });
    expect(mocks.rateLimit).toHaveBeenCalledWith({
      scope: 'dollvue-access-ip', identifier: '192.0.2.1', limit: 12, windowSeconds: 3600,
    });
    expect(mocks.getProduct).toHaveBeenCalledExactlyOnceWith('reviewed-doll', { cache: 'no-store', strict: true });
    expect(mocks.token).toHaveBeenCalledExactlyOnceWith('customer@example.test', 'reviewed-doll');
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    const url = 'https://dollwow.com/dollvue/verify?token=signed%2Btoken%2Fwith%3Dencoding';
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'customer@example.test', text: expect.stringContaining(url), html: expect.stringContaining(`href="${url}"`),
    }));
  });
});
