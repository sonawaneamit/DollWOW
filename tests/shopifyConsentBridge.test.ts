import { afterEach, expect, it, vi } from 'vitest';
import { registerExplicitShopifyAnalyticsChoice, type HeadlessConsentConfig } from '@/lib/analytics/shopify-consent-bridge';
const config: HeadlessConsentConfig = { headlessStorefront: true, storefrontRootDomain: 'dollwow.com', checkoutRootDomain: 'checkout.dollwow.com', storefrontAccessToken: 'fixture_public_token_not_real', credentialType: 'verified-public-storefront' };
afterEach(()=>vi.useRealTimers());

it('forwards an explicit analytics-only accept and decline through the supported API',async()=>{
 const setTrackingConsent=vi.fn((_choice,callback)=>callback());
 for(const state of ['granted','denied'] as const){
  expect(await registerExplicitShopifyAnalyticsChoice(state,true,{setTrackingConsent},2000,config)).toBe('registered');
  expect(setTrackingConsent).toHaveBeenLastCalledWith({headlessStorefront:true,checkoutRootDomain:config.checkoutRootDomain,storefrontRootDomain:config.storefrontRootDomain,storefrontAccessToken:config.storefrontAccessToken,analytics:state==='granted',marketing:false,preferences:false,sale_of_data:false},expect.any(Function));
 }
});
it('does not replay stored consent, infer consent from identity, or grant unknown state',async()=>{
 const setTrackingConsent=vi.fn();
 expect(await registerExplicitShopifyAnalyticsChoice('granted',false,{setTrackingConsent})).toBe('not-an-explicit-choice');
 expect(await registerExplicitShopifyAnalyticsChoice('unknown',true,{setTrackingConsent})).toBe('not-an-explicit-choice');
 expect(setTrackingConsent).not.toHaveBeenCalled();
});
it('does not claim registration when the headless API is unavailable',async()=>{
 expect(await registerExplicitShopifyAnalyticsChoice('granted',true,null,2000,config)).toBe('api-unavailable');
});
it('reports API failure without granting a fallback or disrupting checkout',async()=>{
 expect(await registerExplicitShopifyAnalyticsChoice('granted',true,{setTrackingConsent:()=>{throw Error('private error');}},2000,config)).toBe('failed');
 expect(await registerExplicitShopifyAnalyticsChoice('denied',true,{setTrackingConsent:(_choice,callback)=>callback({error:true})},2000,config)).toBe('failed');
});
it('bounds an unavailable callback and ignores a late completion',async()=>{
 vi.useFakeTimers();let callback:undefined|((result?:{error?:unknown})=>void);
 const result=registerExplicitShopifyAnalyticsChoice('granted',true,{setTrackingConsent:(_choice,cb)=>{callback=cb;}},100,config);
 await vi.advanceTimersByTimeAsync(100);expect(await result).toBe('timed-out');callback?.();expect(await result).toBe('timed-out');
});
it('fails closed without verified headless configuration and never forwards the credential attestation',async()=>{
 const setTrackingConsent=vi.fn((_choice,callback)=>callback());
 expect(await registerExplicitShopifyAnalyticsChoice('granted',true,{setTrackingConsent})).toBe('headless-config-unavailable');
 for(const invalid of [
  {...config,storefrontAccessToken:'shpat_private_credential'},
  {...config,storefrontAccessToken:'shpua_private_credential'},
  {...config,checkoutRootDomain:'unrelated.example.com'},
  {...config,storefrontRootDomain:'.dollwow.com'},
  {...config,credentialType:'unverified'}
 ]) expect(await registerExplicitShopifyAnalyticsChoice('granted',true,{setTrackingConsent},2000,invalid as HeadlessConsentConfig)).toBe('headless-config-unavailable');
 expect(setTrackingConsent).not.toHaveBeenCalled();
 expect(await registerExplicitShopifyAnalyticsChoice('granted',true,{setTrackingConsent},2000,config)).toBe('registered');
 expect(setTrackingConsent.mock.calls[0][0]).not.toHaveProperty('credentialType');
});
