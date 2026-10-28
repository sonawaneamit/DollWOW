'use client';

import { registerExplicitShopifyAnalyticsChoice, type HeadlessConsentConfig, type ShopifyPrivacyApi } from './shopify-consent-bridge';

export const SHOPIFY_CONSENT_SDK = 'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.2/consent-tracking-api.js';
export type ConsentPrivacyApi = ShopifyPrivacyApi & {
  currentVisitorConsent: () => { analytics?: string };
  analyticsProcessingAllowed: () => boolean;
};
type ConsentWindow = Window & { Shopify?: { customerPrivacy?: ConsentPrivacyApi } };

let sdk: Promise<ConsentPrivacyApi> | undefined;
function loadPrivacyApi(): Promise<ConsentPrivacyApi> {
  const runtime = window as ConsentWindow;
  if (typeof runtime.Shopify?.customerPrivacy?.setTrackingConsent === 'function') {
    return Promise.resolve(runtime.Shopify.customerPrivacy);
  }
  if (sdk) return sdk;
  const pending = new Promise<ConsentPrivacyApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'dollwow-shopify-consent-sdk';
    script.async = true;
    script.src = SHOPIFY_CONSENT_SDK;
    const timeout = setTimeout(() => { script.remove(); reject(new Error('SDK_TIMEOUT')); }, 10000);
    script.onload = () => {
      clearTimeout(timeout);
      const api = runtime.Shopify?.customerPrivacy;
      if (typeof api?.setTrackingConsent === 'function' && typeof api.currentVisitorConsent === 'function') resolve(api);
      else { script.remove(); reject(new Error('SDK_UNAVAILABLE')); }
    };
    script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('SDK_LOAD_FAILED')); };
    document.head.appendChild(script);
  });
  sdk = pending;
  void pending.catch(() => { if (sdk === pending) sdk = undefined; });
  return pending;
}

/** Serializes explicit choices; choices superseded while loading are never submitted. */
export function createConsentForwarder(load: () => Promise<ConsentPrivacyApi>) {
  let generation = 0;
  let tail: Promise<unknown> = Promise.resolve();
  return (state: 'granted' | 'denied', config: HeadlessConsentConfig) => {
    const current = ++generation;
    const operation = tail.then(async () => {
      try {
        const api = await load();
        if (current !== generation) return 'superseded' as const;
        const previous = api.currentVisitorConsent().analytics;
        console.info('DollWOW privacy prior choice: ' + (previous === 'yes' ? 'yes' : previous === 'no' ? 'no' : 'unknown'));
        let transport: Promise<unknown> | undefined;
        const result = await registerExplicitShopifyAnalyticsChoice(state, true, {
          setTrackingConsent(choice, callback) {
            const pending = api.setTrackingConsent(choice, callback);
            if (pending && typeof pending.then === 'function') transport = Promise.resolve(pending);
            return pending;
          }
        }, 5000, config);
        // Keep later choices behind the actual SDK request, even after a callback timeout.
        if (transport) await transport;
        if (current !== generation) return 'superseded' as const;
        if (result !== 'registered') return result;
        return api.currentVisitorConsent().analytics === (state === 'granted' ? 'yes' : 'no')
          ? 'registered' as const : 'readback-unverified' as const;
      } catch { return 'failed' as const; }
    });
    tail = operation;
    return operation;
  };
}

const forward = createConsentForwarder(loadPrivacyApi);
export function forwardExplicitShopifyConsent(state: 'granted' | 'denied', config: HeadlessConsentConfig) {
  if (!['dollwow.com', 'www.dollwow.com'].includes(window.location.hostname)) return Promise.resolve('host-not-allowed' as const);
  return forward(state, config);
}
