import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConsentForwarder, forwardExplicitShopifyConsent, SHOPIFY_CONSENT_SDK, type ConsentPrivacyApi } from '@/lib/analytics/shopify-consent-client';
import { headlessConsentConfig } from '@/lib/analytics/shopify-consent-config';
import type { HeadlessConsentConfig } from '@/lib/analytics/shopify-consent-bridge';

const config: HeadlessConsentConfig = { headlessStorefront: true, storefrontRootDomain: 'dollwow.com', checkoutRootDomain: 'checkout.dollwow.com', storefrontAccessToken: 'a'.repeat(32), credentialType: 'verified-public-storefront' };
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

function privacyApi() {
  let analytics = '';
  const api: ConsentPrivacyApi = {
    setTrackingConsent: vi.fn((choice, callback) => { analytics = choice.analytics ? 'yes' : 'no'; callback(); }),
    currentVisitorConsent: () => ({ analytics }),
    analyticsProcessingAllowed: () => analytics === 'yes'
  };
  return api;
}

describe('approved headless consent transport', () => {
  it('requires production, explicit enablement and dedicated public token; never uses server credentials', () => {
    expect(headlessConsentConfig({ VERCEL_ENV: 'production', SHOPIFY_CONSENT_HANDOFF_ENABLED: '1', SHOPIFY_STOREFRONT_ACCESS_TOKEN: config.storefrontAccessToken })).toBeUndefined();
    for (const env of [
      { VERCEL_ENV: 'preview', SHOPIFY_CONSENT_HANDOFF_ENABLED: '1', SHOPIFY_PUBLIC_CONSENT_TOKEN: config.storefrontAccessToken },
      { VERCEL_ENV: 'production', SHOPIFY_PUBLIC_CONSENT_TOKEN: config.storefrontAccessToken },
      { VERCEL_ENV: 'production', SHOPIFY_CONSENT_HANDOFF_ENABLED: '1', SHOPIFY_PUBLIC_CONSENT_TOKEN: 'shpua_private' }
    ]) expect(headlessConsentConfig(env)).toBeUndefined();
    expect(headlessConsentConfig({ VERCEL_ENV: 'production', SHOPIFY_CONSENT_HANDOFF_ENABLED: '1', SHOPIFY_PUBLIC_CONSENT_TOKEN: config.storefrontAccessToken })).toEqual(config);
  });
  it('does nothing until invoked by an explicit banner choice', () => {
    const load = vi.fn();
    createConsentForwarder(load);
    expect(load).not.toHaveBeenCalled();
  });
  it('forwards explicit accept and withdrawal and checks API consent readback', async () => {
    const api = privacyApi();
    const forward = createConsentForwarder(async () => api);
    expect(await forward('granted', config)).toBe('registered');
    expect(await forward('denied', config)).toBe('registered');
    expect(api.setTrackingConsent).toHaveBeenLastCalledWith(expect.objectContaining({ analytics: false, marketing: false, preferences: false, sale_of_data: false }), expect.any(Function));
  });
  it('does not submit an earlier accept superseded while the SDK loads', async () => {
    const api = privacyApi();
    let ready!: (api: ConsentPrivacyApi) => void;
    const loading = new Promise<ConsentPrivacyApi>(resolve => { ready = resolve; });
    const forward = createConsentForwarder(() => loading);
    const accept = forward('granted', config);
    const decline = forward('denied', config);
    ready(api);
    expect(await accept).toBe('superseded');
    expect(await decline).toBe('registered');
    expect(api.setTrackingConsent).toHaveBeenCalledTimes(1);
    expect(api.setTrackingConsent).toHaveBeenCalledWith(expect.objectContaining({ analytics: false }), expect.any(Function));
  });
  it('serializes withdrawal behind an in-flight SDK request', async () => {
    const api = privacyApi();
    let complete!: () => void;
    const first = new Promise<void>(resolve => { complete = resolve; });
    let calls = 0;
    api.setTrackingConsent = vi.fn((choice, callback) => {
      if (++calls === 1) return first.then(() => callback());
      callback();
    });
    api.currentVisitorConsent = () => ({ analytics: 'no' });
    const forward = createConsentForwarder(async () => api);
    const accept = forward('granted', config);
    await vi.waitFor(() => expect(api.setTrackingConsent).toHaveBeenCalledTimes(1));
    const decline = forward('denied', config);
    expect(api.setTrackingConsent).toHaveBeenCalledTimes(1);
    complete();
    expect(await accept).toBe('superseded');
    expect(await decline).toBe('registered');
    expect(api.setTrackingConsent).toHaveBeenCalledTimes(2);
  });
  it('does not treat callback success alone as confirmed consent', async () => {
    const api = privacyApi();
    api.currentVisitorConsent = () => ({ analytics: '' });
    expect(await createConsentForwarder(async () => api)('granted', config)).toBe('readback-unverified');
  });
  it('contains rejected SDK promises and loader errors without granting consent', async () => {
    const api = privacyApi();
    api.setTrackingConsent = () => Promise.reject(new Error('private error'));
    expect(await createConsentForwarder(async () => api)('granted', config)).toBe('failed');
    expect(await createConsentForwarder(async () => { throw new Error('private loader error'); })('granted', config)).toBe('failed');
  });
  it('refuses real API submission from localhost and preview hosts', async () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    expect(await forwardExplicitShopifyConsent('granted', config)).toBe('host-not-allowed');
  });
  it('loads the official SDK only after a production-host explicit choice and reuses it', async () => {
    const api = privacyApi();
    const runtime = { location: { hostname: 'dollwow.com' }, Shopify: undefined as { customerPrivacy: ConsentPrivacyApi } | undefined };
    const script = { remove: vi.fn(), onload: undefined as (() => void) | undefined };
    const appendChild = vi.fn(() => { runtime.Shopify = { customerPrivacy: api }; queueMicrotask(() => script.onload?.()); });
    vi.stubGlobal('window', runtime);
    vi.stubGlobal('document', { createElement: vi.fn(() => script), head: { appendChild } });
    expect(await forwardExplicitShopifyConsent('granted', config)).toBe('registered');
    expect(script).toMatchObject({ src: SHOPIFY_CONSENT_SDK, async: true, id: 'dollwow-shopify-consent-sdk' });
    expect(await forwardExplicitShopifyConsent('denied', config)).toBe('registered');
    expect(appendChild).toHaveBeenCalledTimes(1);
  });
});
