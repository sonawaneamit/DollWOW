import { afterEach, expect, it, vi } from 'vitest';
import { markShopifyConsentSynced, needsShopifyConsentChoice, readShopifyConsentMarker } from '@/lib/analytics/shopify-consent-marker';
afterEach(() => vi.unstubAllGlobals());

it('requires a fresh explicit interaction for pre-fix stored choices or mismatched markers', () => {
  expect(needsShopifyConsentChoice(true, 'granted', 'unknown')).toBe(true);
  expect(needsShopifyConsentChoice(true, 'denied', 'unknown')).toBe(true);
  expect(needsShopifyConsentChoice(true, 'denied', 'granted')).toBe(true);
  expect(needsShopifyConsentChoice(true, 'unknown', 'granted')).toBe(true);
  expect(needsShopifyConsentChoice(true, 'granted', 'granted')).toBe(false);
  expect(needsShopifyConsentChoice(false, 'granted', 'unknown')).toBe(false);
});
it('stores only the confirmed choice and timestamp, never identity or permission inference', () => {
  let stored: string | null = null;
  vi.stubGlobal('CustomEvent', class { constructor(public type: string) {} });
  vi.stubGlobal('window', { localStorage: { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; } }, dispatchEvent: vi.fn() });
  expect(readShopifyConsentMarker()).toBe('unknown');
  markShopifyConsentSynced('denied');
  expect(readShopifyConsentMarker()).toBe('denied');
  expect(Object.keys(JSON.parse(stored!))).toEqual(['state', 'at']);
});
it.each(['bad', '{}', JSON.stringify({ state: 'granted', at: '2099-01-01' }), JSON.stringify({ state: 'granted', at: '2020-01-01' })])('rejects malformed, future or expired state %s', value => {
  vi.stubGlobal('window', { localStorage: { getItem: () => value } });
  expect(readShopifyConsentMarker()).toBe('unknown');
});
it('fails closed when storage is blocked', () => {
  vi.stubGlobal('window', { localStorage: { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } } });
  expect(readShopifyConsentMarker()).toBe('unknown');
  expect(() => markShopifyConsentSynced('granted')).not.toThrow();
});
