import {beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {HeadlessConsentConfig} from '@/lib/analytics/shopify-consent-bridge';
const config: HeadlessConsentConfig={headlessStorefront:true,storefrontRootDomain:'dollwow.com',checkoutRootDomain:'checkout.dollwow.com',storefrontAccessToken:'a'.repeat(32),credentialType:'verified-public-storefront'};
const mocks=vi.hoisted(()=>({consent:'unknown',write:vi.fn(),marker:'unknown',forward:vi.fn()}));
vi.mock('@/lib/analytics/consent',()=>({useConsent:()=>mocks.consent,writeConsent:mocks.write}));
vi.mock('@/lib/utils/storageStore',()=>({useMounted:()=>true}));
vi.mock('@/lib/analytics/shopify-consent-client',()=>({forwardExplicitShopifyConsent:mocks.forward}));
vi.mock('@/lib/analytics/shopify-consent-marker',()=>({useShopifyConsentMarker:()=>mocks.marker,
  needsShopifyConsentChoice:()=>true,markShopifyConsentSynced:vi.fn()}));
import {ConsentBanner} from '@/components/ConsentBanner';
beforeEach(()=>{vi.clearAllMocks();mocks.marker='unknown';});
it.each(['unknown','granted','denied'])('does not auto-prompt or change consent for %s with unconfirmed checkout sync',state=>{
  mocks.consent=state;
  expect(renderToStaticMarkup(<ConsentBanner autoPrompt={false}/>)).toBe('');
  expect(mocks.write).not.toHaveBeenCalled();expect(mocks.forward).not.toHaveBeenCalled();
});

it('offers both choices immediately for a fresh visitor without waiting for scroll',()=>{
  mocks.consent='unknown';
  const markup=renderToStaticMarkup(<ConsentBanner/>);
  expect(markup).toContain('Privacy preferences');
  expect(markup).toContain('>Decline</button>');
  expect(markup).toContain('>Accept</button>');
  expect(mocks.write).not.toHaveBeenCalled();
});

it.each(['granted','denied'])('remembers %s even when checkout synchronization is unconfirmed',state=>{
  mocks.consent=state;
  expect(renderToStaticMarkup(<ConsentBanner shopifyConfig={config}/>)).toBe('');
  expect(mocks.write).not.toHaveBeenCalled();
  expect(mocks.forward).not.toHaveBeenCalled();
});
