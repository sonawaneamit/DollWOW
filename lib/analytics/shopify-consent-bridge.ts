import type { ConsentState } from './consent';

export type HeadlessConsentConfig = {
  headlessStorefront: true;
  checkoutRootDomain: 'checkout.dollwow.com';
  storefrontRootDomain: 'dollwow.com';
  storefrontAccessToken: string;
  credentialType: 'verified-public-storefront';
};

export type ShopifyPrivacyApi = {
  setTrackingConsent: (choice: { analytics: boolean; marketing: false; preferences: false; sale_of_data: false } & Omit<HeadlessConsentConfig, 'credentialType'>, callback: (result?: { error?: unknown }) => void) => void | Promise<unknown>;
};

export type ConsentBridgeResult = 'registered' | 'not-an-explicit-choice' | 'headless-config-unavailable' | 'api-unavailable' | 'failed' | 'timed-out';

/** Called only for explicit choices; never used to replay stored consent. */
export function registerExplicitShopifyAnalyticsChoice(
  state: ConsentState,
  visitorInteraction: boolean,
  api: ShopifyPrivacyApi | null | undefined,
  timeoutMs = 2000,
  config?: HeadlessConsentConfig
): Promise<ConsentBridgeResult> {
  if (!visitorInteraction || state === 'unknown') return Promise.resolve('not-an-explicit-choice');
  // Only an independently verified public credential may enter this browser contract.
  if (!config || config.credentialType !== 'verified-public-storefront' ||
      config.headlessStorefront !== true || config.checkoutRootDomain !== 'checkout.dollwow.com' ||
      config.storefrontRootDomain !== 'dollwow.com' ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(config.storefrontAccessToken) ||
      /^(shpat_|shpua_|shpss_|shpca_)/i.test(config.storefrontAccessToken)) {
    return Promise.resolve('headless-config-unavailable');
  }
  if (!api?.setTrackingConsent) return Promise.resolve('api-unavailable');
  return new Promise(resolve => {
    let settled = false;
    const finish = (result: ConsentBridgeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };
    const timeout = setTimeout(() => finish('timed-out'), timeoutMs);
    try {
      const headless = {
        headlessStorefront: config.headlessStorefront,
        checkoutRootDomain: config.checkoutRootDomain,
        storefrontRootDomain: config.storefrontRootDomain,
        storefrontAccessToken: config.storefrontAccessToken
      };
      const pending = api.setTrackingConsent({ ...headless, analytics: state === 'granted', marketing: false, preferences: false, sale_of_data: false },
        result => finish(result?.error ? 'failed' : 'registered'));
      if (pending && typeof pending.then === 'function') void pending.catch(() => finish('failed'));
    } catch {
      finish('failed');
    }
  });
}
