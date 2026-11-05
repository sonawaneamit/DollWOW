import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({normalize:vi.fn(),registry:{} as Record<string,unknown>}));
vi.mock('@/lib/utils/env',()=>({env:{NEXT_PUBLIC_SITE_URL:'https://example.invalid'}}));
vi.mock('@/lib/dollvue/reviewedImages',()=>({normalizeReviewedImage:mocks.normalize}));
vi.mock('@/lib/dollvue/non-explicit-review-registry.json',()=>({default:mocks.registry}));
vi.mock('@/lib/assets/option-assets.mjs',()=>({isOwnedOptionAsset:(url:string)=>url.startsWith('/option-assets/')}));
import {normalizeNonExplicitInputs} from '@/lib/dollvue/normalizeNonExplicitInputs';
import {nonExplicitRequestFingerprint,type NonExplicitRequest} from '@/lib/dollvue/nonExplicitRequest';
const photo=`/option-assets/${'a'.repeat(64)}.webp`,ref=`/option-assets/${'b'.repeat(64)}.webp`;
const facts=():NonExplicitRequest=>({productId:'product100',appearanceFingerprint:'c'.repeat(64),sourcePosition:0,sourceUrl:photo,
  referenceUrls:[ref],selections:[{groupId:'eyes',optionId:'blue'}],prompt:'Non-explicit clothed product preview.',
  aspectRatio:'3:4',renderVersion:'safe-footer-v1'});
const review=()=>({policy:'non-explicit-inputs-v1',productId:'product100',appearanceFingerprint:'c'.repeat(64),
  reviewedAt:'2026-10-29T10:00:00Z',sourcePositions:[0],imageDigests:{[photo]:'a'.repeat(64),[ref]:'b'.repeat(64)}});
const prepared=()=>({facts:facts(),fingerprint:nonExplicitRequestFingerprint(facts(),review())!});
beforeEach(()=>{
  vi.clearAllMocks();for(const key of Object.keys(mocks.registry)) delete mocks.registry[key];
  mocks.registry.product100=review();mocks.normalize.mockResolvedValue('data:image/png;base64,c2FmZQ==');
});
it('re-derives reviewed pins and preserves image ordering/normalization roles',async()=>{
  const result=await normalizeNonExplicitInputs(prepared());expect(result.ok).toBe(true);
  expect(mocks.normalize.mock.calls.map(c=>c[0])).toEqual([
    {url:photo,sha256:'a'.repeat(64),optionReference:false,origin:'https://example.invalid'},
    {url:ref,sha256:'b'.repeat(64),optionReference:true,origin:'https://example.invalid'},
  ]);
  if(result.ok) {expect(result.images).toHaveLength(2);expect(result.prompt).toBe(facts().prompt);}
});
it('refuses missing/stale review before any network fetch',async()=>{
  delete mocks.registry.product100;
  expect(await normalizeNonExplicitInputs(prepared())).toEqual({ok:false,code:'not-reviewed'});
  mocks.registry.product100={...review(),reviewedAt:'2026-10-29T11:00:00Z'};
  expect(await normalizeNonExplicitInputs(prepared())).toEqual({ok:false,code:'not-reviewed'});
  expect(mocks.normalize).not.toHaveBeenCalled();
});
it.each([
  {...facts(),prompt:'Changed'}, {...facts(),referenceUrls:[photo]}, {...facts(),sourcePosition:1},
])('refuses changed facts with an old reservation fingerprint%#',async candidate=>{
  expect(await normalizeNonExplicitInputs({...prepared(),facts:candidate})).toEqual({ok:false,code:'not-reviewed'});
  expect(mocks.normalize).not.toHaveBeenCalled();
});
it('does not return partial images when byte verification fails',async()=>{
  mocks.normalize.mockResolvedValueOnce('data:image/png;base64,c2FmZQ==').mockRejectedValueOnce(new Error('private digest mismatch'));
  expect(await normalizeNonExplicitInputs(prepared())).toEqual({ok:false,code:'unavailable'});
});
it('snapshots selected facts and registry pins before awaits',async()=>{
  const input=prepared();
  mocks.normalize.mockImplementationOnce(async()=>{
    input.facts.referenceUrls[0]=photo;input.facts.prompt='Changed during fetch';
    (mocks.registry.product100 as ReturnType<typeof review>).imageDigests[ref]='d'.repeat(64);
    return 'data:image/png;base64,c2FmZQ==';
  });
  const result=await normalizeNonExplicitInputs(input);expect(result.ok).toBe(true);
  expect(mocks.normalize.mock.calls[1][0].sha256).toBe('b'.repeat(64));
  if(result.ok) expect(result.prompt).toBe(facts().prompt);
});
