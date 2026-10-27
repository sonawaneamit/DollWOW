import { afterEach, expect, it, vi } from 'vitest';
import { registerExplicitShopifyAnalyticsChoice } from '@/lib/analytics/shopify-consent-bridge';
afterEach(()=>vi.useRealTimers());

it('forwards an explicit analytics-only accept and decline through the supported API',async()=>{
 const setTrackingConsent=vi.fn((_choice,callback)=>callback());
 for(const state of ['granted','denied'] as const){
  expect(await registerExplicitShopifyAnalyticsChoice(state,true,{setTrackingConsent})).toBe('registered');
  expect(setTrackingConsent).toHaveBeenLastCalledWith({analytics:state==='granted',marketing:false,preferences:false,sale_of_data:false},expect.any(Function));
 }
});
it('does not replay stored consent, infer consent from identity, or grant unknown state',async()=>{
 const setTrackingConsent=vi.fn();
 expect(await registerExplicitShopifyAnalyticsChoice('granted',false,{setTrackingConsent})).toBe('not-an-explicit-choice');
 expect(await registerExplicitShopifyAnalyticsChoice('unknown',true,{setTrackingConsent})).toBe('not-an-explicit-choice');
 expect(setTrackingConsent).not.toHaveBeenCalled();
});
it('does not claim registration when the headless API is unavailable',async()=>{
 expect(await registerExplicitShopifyAnalyticsChoice('granted',true,null)).toBe('api-unavailable');
});
it('reports API failure without granting a fallback or disrupting checkout',async()=>{
 expect(await registerExplicitShopifyAnalyticsChoice('granted',true,{setTrackingConsent:()=>{throw Error('private error');}})).toBe('failed');
 expect(await registerExplicitShopifyAnalyticsChoice('denied',true,{setTrackingConsent:(_choice,callback)=>callback({error:true})})).toBe('failed');
});
it('bounds an unavailable callback and ignores a late completion',async()=>{
 vi.useFakeTimers();let callback:undefined|((result?:{error?:unknown})=>void);
 const result=registerExplicitShopifyAnalyticsChoice('granted',true,{setTrackingConsent:(_choice,cb)=>{callback=cb;}},100);
 await vi.advanceTimersByTimeAsync(100);expect(await result).toBe('timed-out');callback?.();expect(await result).toBe('timed-out');
});
