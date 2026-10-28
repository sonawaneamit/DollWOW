import type { HeadlessConsentConfig } from './shopify-consent-bridge';

/** Dedicated, owner-approved public configuration; never fall back to server tokens. */
export function headlessConsentConfig(env: Record<string, string | undefined>): HeadlessConsentConfig | undefined {
  const token = env.SHOPIFY_PUBLIC_CONSENT_TOKEN?.trim();
  if (env.VERCEL_ENV !== 'production' || env.SHOPIFY_CONSENT_HANDOFF_ENABLED !== '1' ||
      !token || !/^[a-f0-9]{32}$/i.test(token)) return undefined;
  return {
    headlessStorefront: true,
    storefrontRootDomain: 'dollwow.com',
    checkoutRootDomain: 'checkout.dollwow.com',
    storefrontAccessToken: token,
    credentialType: 'verified-public-storefront'
  };
}
