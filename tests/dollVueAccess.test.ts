import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rateLimit:vi.fn(),getProduct:vi.fn(),token:vi.fn(),sendEmail:vi.fn(),currentEligibility:vi.fn(),fetch:vi.fn()}));
vi.mock('@/lib/ai/rateLimit',()=>({checkRateLimit:mocks.rateLimit}));
vi.mock('@/lib/shopify/storefront',()=>({getProductByHandle:mocks.getProduct}));
vi.mock('@/lib/dollvue/session',()=>({createDollVueAccessToken:mocks.token}));
vi.mock('@/lib/email/sendEmail',()=>({sendEmail:mocks.sendEmail}));
vi.mock('@/lib/dollvue/eligibility',()=>({resolveCurrentDollVueEligibility:mocks.currentEligibility}));
vi.mock('@/lib/utils/env',()=>({env:{NEXT_PUBLIC_SITE_URL:'https://dollwow.com'}}));
import {POST} from '@/app/dollvue/access/route';
function request(body:unknown={email:'Customer@Example.test',handle:'reviewed-doll'}) {
 return new Request('https://dollwow.com/dollvue/access',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'192.0.2.1, 192.0.2.2'},body:JSON.stringify(body)});
}
beforeEach(()=>{
 vi.resetAllMocks();
 mocks.rateLimit.mockResolvedValue({allowed:true,resetAt:new Date(Date.now()+3600000).toISOString()});
 mocks.getProduct.mockResolvedValue({handle:'reviewed-doll',dollVueAvailable:true});
 mocks.currentEligibility.mockResolvedValue({available:true});
 mocks.token.mockReturnValue('signed+token/with=encoding');
 mocks.sendEmail.mockResolvedValue({delivered:true,provider:'google_workspace'});
 vi.stubGlobal('fetch',mocks.fetch.mockRejectedValue(new Error('Unexpected network')));
});
afterEach(()=>{expect(mocks.fetch).not.toHaveBeenCalled();vi.unstubAllGlobals();});
describe('DollVue access delivery contract',()=>{
 it('rejects invalid input instead of claiming an email was sent',async()=>{
  const r=await POST(request({email:'bad',handle:'reviewed-doll'}));expect(r.status).toBe(400);expect((await r.json()).ok).toBe(false);expect(mocks.sendEmail).not.toHaveBeenCalled();
 });
 it.each(['dollvue-access-email','dollvue-access-ip'])('retains %s abuse control and returns retry guidance',async scope=>{
  mocks.rateLimit.mockImplementation(async (x:{scope:string})=>({allowed:x.scope!==scope,resetAt:new Date(Date.now()+3600000).toISOString()}));
  const r=await POST(request());expect(r.status).toBe(429);expect(r.headers.get('retry-after')).toBeTruthy();expect((await r.json()).code).toBe('rate_limited');expect(mocks.getProduct).not.toHaveBeenCalled();expect(mocks.sendEmail).not.toHaveBeenCalled();
 });
 it('never issues links for absent or unpublished products',async()=>{
  mocks.getProduct.mockResolvedValue(null);const r=await POST(request());expect(r.status).toBe(503);expect(mocks.token).not.toHaveBeenCalled();
 });
 it('returns a retryable failure when strict lookup throws',async()=>{
  mocks.getProduct.mockRejectedValue(new Error('Unavailable'));expect((await POST(request())).status).toBe(503);expect(mocks.sendEmail).not.toHaveBeenCalled();
 });
 it('rechecks a cold false flag and sends only when the fresh check succeeds',async()=>{
  mocks.getProduct.mockResolvedValue({handle:'reviewed-doll',dollVueAvailable:false});const r=await POST(request());expect(r.status).toBe(200);expect(await r.json()).toEqual({ok:true,status:'sent'});expect(mocks.currentEligibility).toHaveBeenCalledWith(expect.anything(),{holdTimeoutMs:8000});expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
 });
 it.each([false,null])('never bypasses a current hold/unavailable check: %s',async available=>{
  mocks.currentEligibility.mockResolvedValue(available===null?null:{available});expect((await POST(request())).status).toBe(503);expect(mocks.token).not.toHaveBeenCalled();
 });
 it('handles eligibility errors without exposing private details',async()=>{
  mocks.currentEligibility.mockRejectedValue(new Error('Private hold details'));const r=await POST(request());expect(r.status).toBe(503);expect(JSON.stringify(await r.json())).not.toContain('Private');expect(mocks.sendEmail).not.toHaveBeenCalled();
 });
 it('handles missing signer configuration without claiming success',async()=>{
  mocks.token.mockImplementation(()=>{throw new Error('secret unavailable');});const r=await POST(request());expect(r.status).toBe(503);expect((await r.json()).code).toBe('access_unconfigured');
 });
 it.each(['rejected','throws'])('returns send_failed when mail %s',async mode=>{
  if(mode==='throws')mocks.sendEmail.mockRejectedValue(new Error('Private provider detail'));else mocks.sendEmail.mockResolvedValue({delivered:false,provider:'none'});
  const r=await POST(request());expect(r.status).toBe(503);expect(await r.json()).toMatchObject({ok:false,code:'send_failed'});
 });
 it('sends one encoded link only after eligibility and accepted delivery',async()=>{
  const r=await POST(request());expect(await r.json()).toEqual({ok:true,status:'sent'});expect(r.headers.get('cache-control')).toBe('no-store');
  expect(mocks.token).toHaveBeenCalledWith('customer@example.test','reviewed-doll');expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({to:'customer@example.test',text:expect.stringContaining('token=signed%2Btoken%2Fwith%3Dencoding')}));
 });
});
