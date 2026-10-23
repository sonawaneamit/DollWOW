import { afterEach, describe, expect, it, vi } from 'vitest';
const { read } = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('next/cache', () => ({ unstable_cache: () => read }));
vi.mock('@/lib/shopify/storefront', () => ({ getSeoCatalogProducts: vi.fn() }));
import { getSizeWeightSnapshot } from '@/lib/catalog/sizeWeightSnapshot';

describe('dated Finder cache age gate', () => {
  afterEach(() => { vi.useRealTimers(); read.mockReset(); });
  it('returns the original observation timestamp, not the request time', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T01:00:00Z'));
    const value = { rows: [], checkedAt: '2026-10-23T00:30:00Z' };
    read.mockResolvedValue(value);
    expect(await getSizeWeightSnapshot()).toBe(value);
  });
  it.each(['not-a-date', '2026-10-21T01:00:00Z'])('rejects invalid or expired snapshot %s', async checkedAt => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T01:00:00Z'));
    read.mockResolvedValue({ rows: [], checkedAt });
    await expect(getSizeWeightSnapshot()).rejects.toThrow('Catalog snapshot expired');
  });
});
