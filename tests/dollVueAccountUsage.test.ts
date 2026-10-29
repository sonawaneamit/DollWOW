import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ client: vi.fn(), hash: vi.fn(), result: { count: 7, error: null as null | { message: string } } }));
vi.mock('@/lib/supabase/client', () => ({ getSupabaseServerClient: mocks.client }));
vi.mock('@/lib/dollvue/session', () => ({ dollVueEmailHash: mocks.hash }));
import { dollVueUsageForEmail } from '@/lib/dollvue/accountUsage';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.result = { count: 7, error: null };
  mocks.hash.mockReturnValue('private-hmac');
  const query = { select: vi.fn(() => query), eq: vi.fn() };
  let filters = 0;
  query.eq.mockImplementation(() => ++filters === 3 ? Promise.resolve(mocks.result) : query);
  mocks.client.mockReturnValue({ from: vi.fn(() => query) });
});

it('keeps the normal five-preview allowance exhausted but grants approved hello generation allowance', async () => {
  expect(await dollVueUsageForEmail('hello@dollwow.com')).toMatchObject({ available: true, count: 7, unlimited: true, remaining: Number.MAX_SAFE_INTEGER });
});

it('does not grant unlimited allowance to an ordinary verified customer', async () => {
  expect(await dollVueUsageForEmail('customer@example.test')).toMatchObject({ available: true, count: 7, unlimited: false, remaining: 0 });
});

it('never grants test allowance when the usage store is unavailable', async () => {
  mocks.client.mockReturnValue(null);
  expect(await dollVueUsageForEmail('hello@dollwow.com')).toMatchObject({ available: false, remaining: 0 });
});

it('fails closed on a usage lookup error for the test identity too', async () => {
  mocks.result.error = { message: 'lookup failed' };
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(await dollVueUsageForEmail('hello@dollwow.com')).toMatchObject({ available: false, remaining: 0 });
  log.mockRestore();
});
