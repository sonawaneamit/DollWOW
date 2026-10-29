import {beforeEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
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
