import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({session:vi.fn(),hash:vi.fn(),product:vi.fn(),eligibility:vi.fn(),valid:vi.fn(),choices:vi.fn(),
  sources:vi.fn(),classify:vi.fn(),registry:{} as Record<string,unknown>}));
vi.mock('@/lib/utils/env',()=>({env:{NEXT_PUBLIC_SITE_URL:'https://example.invalid'}}));
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:mocks.session,dollVueEmailHash:mocks.hash}));
vi.mock('@/lib/shopify/storefront',()=>({getProductByHandle:mocks.product}));
vi.mock('@/lib/dollvue/eligibility',()=>({resolveCurrentDollVueEligibility:mocks.eligibility}));
vi.mock('@/lib/catalog/productImage',()=>({productImageSources:mocks.sources}));
vi.mock('@/lib/dollvue/config',()=>({areDollVueSelectionsValid:mocks.valid,resolveDollVueSelections:mocks.choices,
  buildDollVuePrompt:()=> 'Preserve this clothed adult product photo.'}));
vi.mock('@/lib/dollvue/appearance',()=>({classifyAppearance:mocks.classify}));
vi.mock('@/lib/dollvue/branding',()=>({DOLLVUE_BRANDING_VERSION:'safe-synthetic-footer-v1'}));
vi.mock('@/lib/dollvue/non-explicit-review-registry.json',()=>({default:mocks.registry}));
vi.mock('@/lib/assets/option-assets.mjs',()=>({isOwnedOptionAsset:(url:string)=>url.startsWith('/option-assets/')}));
import {prepareNonExplicitRequest} from '@/lib/dollvue/prepareNonExplicitRequest';
const photo=`/option-assets/${'a'.repeat(64)}.webp`,ref=`/option-assets/${'b'.repeat(64)}.webp`;
const body=()=>({requestId:'11111111-1111-4111-8111-111111111111',productHandle:'safe-fixture',sourcePosition:0,
  selections:[{groupId:'eyes',optionId:'blue'}]});
const choice=()=>({group:{label:'Eye Color'},option:{label:'Blue',swatch:{kind:'image',value:ref}}});
const request=(value:unknown=body(),headers:Record<string,string>={},url='https://example.invalid/dollvue/non-explicit')=>
  new Request(url,{method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json',cookie:'signed-fixture',...headers},body:JSON.stringify(value)});
beforeEach(()=>{
  vi.clearAllMocks();for(const key of Object.keys(mocks.registry)) delete mocks.registry[key];
  vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('VERCEL_URL','preview.example.invalid');
  mocks.session.mockReturnValue({email:'qa@example.invalid'});mocks.hash.mockReturnValue('d'.repeat(64));
  mocks.product.mockResolvedValue({id:'product100',handle:'safe-fixture'});
  mocks.eligibility.mockResolvedValue({available:true,sourcePositions:[0],revision:'c'.repeat(64),config:{}});
  mocks.valid.mockReturnValue(true);mocks.choices.mockReturnValue([choice()]);mocks.classify.mockReturnValue({status:'candidate'});
  mocks.sources.mockReturnValue([{url:photo,width:600,height:800}]);
});
afterEach(()=>vi.unstubAllEnvs());
function approveFixture() {mocks.registry.product100={policy:'non-explicit-inputs-v1',productId:'product100',
  appearanceFingerprint:'c'.repeat(64),reviewedAt:'2026-10-29T10:00:00Z',sourcePositions:[0],imageDigests:{[photo]:'a'.repeat(64),[ref]:'b'.repeat(64)}};}
const untrustedHeaders:Record<string,string>[]=[{origin:'https://other.invalid'},{origin:'null'},{'sec-fetch-site':'cross-site'}];
it.each(untrustedHeaders)('rejects untrusted origin before identity/product lookup%#',async headers=>{
  expect(await prepareNonExplicitRequest(request(body(),headers))).toEqual({ok:false,code:'forbidden'});
  expect(mocks.session).not.toHaveBeenCalled();expect(mocks.product).not.toHaveBeenCalled();
});
it('rejects missing or invalid signed identity without reading products',async()=>{
  mocks.session.mockReturnValueOnce(null).mockReturnValueOnce({email:'bad'});
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'unauthenticated'});
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'unauthenticated'});
  expect(mocks.product).not.toHaveBeenCalled();
});
it.each([{...body(),email:'other@example.invalid'},{...body(),requestId:'bad'},{...body(),review:{policy:'approved'}},
  {...body(),prompt:'user override'}, {...body(),sourcePosition:8}])('refuses client identity/review/prompt overrides or malformed requests%#',async value=>{
  expect(await prepareNonExplicitRequest(request(value))).toEqual({ok:false,code:'invalid-request'});
  expect(mocks.product).not.toHaveBeenCalled();
});
it('bounds actual streamed body bytes, not just a content-length hint',async()=>{
  expect(await prepareNonExplicitRequest(request({...body(),padding:'x'.repeat(17000)}))).toEqual({ok:false,code:'invalid-request'});
  expect(mocks.product).not.toHaveBeenCalled();
});
it('rejects non-JSON and non-POST requests before server product lookup',async()=>{
  expect(await prepareNonExplicitRequest(request(body(),{'content-type':'text/plain'}))).toEqual({ok:false,code:'invalid-request'});
  expect(await prepareNonExplicitRequest(new Request('https://example.invalid/dollvue/non-explicit',{headers:{origin:'https://example.invalid'}})))
    .toEqual({ok:false,code:'forbidden'});
  expect(mocks.product).not.toHaveBeenCalled();
});
it('never treats appearance-ready as separate content approval',async()=>{
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'not-reviewed'});
  expect(mocks.product).toHaveBeenCalledWith('safe-fixture',{cache:'no-store',strict:true});
  expect(mocks.hash).not.toHaveBeenCalled();
});
it('rechecks current holds, photo availability and menu compatibility',async()=>{
  approveFixture();mocks.eligibility.mockResolvedValueOnce({available:false});
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'not-reviewed'});
  mocks.valid.mockReturnValueOnce(false);
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'not-reviewed'});
  mocks.sources.mockReturnValueOnce([{url:photo}]);
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'not-reviewed'});
});
it('retains the independent non-explicit appearance classifier',async()=>{
  approveFixture();mocks.classify.mockReturnValueOnce({status:'excluded'});
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'not-reviewed'});
});
it('returns only internal verified recipient and server-fingerprinted reviewed facts',async()=>{
  approveFixture();const result=await prepareNonExplicitRequest(request());expect(result.ok).toBe(true);
  if(!result.ok) throw Error('Expected safe fixture preparation');
  expect(result.prepared.recipientEmail).toBe('qa@example.invalid');expect(result.prepared.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  expect(result.prepared.facts.aspectRatio).toBe('3:4');expect(result.prepared.facts.prompt).toContain('NON-EXPLICIT OUTPUT ONLY');
  expect(result.prepared.inputs.map(i=>i.sha256)).toEqual(['a'.repeat(64),'b'.repeat(64)]);
});
it('does not leak upstream exceptions or private hold details',async()=>{
  mocks.product.mockRejectedValueOnce(new Error('private upstream context'));
  expect(await prepareNonExplicitRequest(request())).toEqual({ok:false,code:'unavailable'});
});
it('accepts only the exact configured preview origin in preview',async()=>{
  vi.stubEnv('VERCEL_ENV','preview');approveFixture();
  expect((await prepareNonExplicitRequest(request(body(),{origin:'https://preview.example.invalid'},'https://preview.example.invalid/dollvue/non-explicit'))).ok).toBe(true);
  expect(await prepareNonExplicitRequest(request(body(),{origin:'https://other-preview.invalid'},'https://other-preview.invalid/dollvue/non-explicit')))
    .toEqual({ok:false,code:'forbidden'});
});
