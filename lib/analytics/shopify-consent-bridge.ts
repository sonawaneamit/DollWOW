import type { ConsentState } from './consent';

export type ShopifyPrivacyApi = {
  setTrackingConsent: (choice: { analytics: boolean; marketing: false; preferences: false; sale_of_data: false }, callback: (result?: { error?: unknown }) => void) => void;
};

export type ConsentBridgeResult = 'registered' | 'not-an-explicit-choice' | 'api-unavailable' | 'failed' | 'timed-out';

/** Candidate adapter only: not wired into production or used to replay stored consent. */
export function registerExplicitShopifyAnalyticsChoice(
  state: ConsentState,
  visitorInteraction: boolean,
  api: ShopifyPrivacyApi | null | undefined,
  timeoutMs = 2000
): Promise<ConsentBridgeResult> {
  if (!visitorInteraction || state === 'unknown') return Promise.resolve('not-an-explicit-choice');
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
      api.setTrackingConsent({ analytics: state === 'granted', marketing: false, preferences: false, sale_of_data: false },
        result => finish(result?.error ? 'failed' : 'registered'));
    } catch {
      finish('failed');
    }
  });
}
