import {expect,it,vi} from 'vitest';
vi.mock('@/lib/assets/option-assets.mjs',()=>({isOwnedOptionAsset:(url:string)=>url.startsWith('/option-assets/')}));
import {nonExplicitRequestFingerprint} from '@/lib/dollvue/nonExplicitRequest';
const source=`/option-assets/${'a'.repeat(64)}.webp`,ref=`/option-assets/${'b'.repeat(64)}.webp`;
const input=()=>({productId:'product100',appearanceFingerprint:'c'.repeat(64),sourcePosition:0,sourceUrl:source,
  referenceUrls:[ref],selections:[{groupId:'eyes',optionId:'blue'},{groupId:'hair',optionId:'black'}],
  prompt:'A non-explicit clothed studio product preview.',aspectRatio:'3:4',renderVersion:'white-footer-v1'});
const review=()=>({policy:'non-explicit-inputs-v1',productId:'product100',appearanceFingerprint:'c'.repeat(64),
  reviewedAt:'2026-10-29T10:00:00Z',sourcePositions:[0],imageDigests:{[source]:'a'.repeat(64),[ref]:'b'.repeat(64)}});
it('requires a content review and well-formed server facts',()=>{
  expect(nonExplicitRequestFingerprint(input(),undefined)).toBeNull();
  expect(nonExplicitRequestFingerprint({...input(),email:'never included'},review())).toBeNull();
  expect(nonExplicitRequestFingerprint({...input(),prompt:''},review())).toBeNull();
});
it('canonicalizes group ordering without mutating input',()=>{
  const original=input(),reordered={...input(),selections:[...input().selections].reverse()};
  expect(nonExplicitRequestFingerprint(original,review())).toMatch(/^[a-f0-9]{64}$/);
  expect(nonExplicitRequestFingerprint(reordered,review())).toBe(nonExplicitRequestFingerprint(original,review()));
  expect(original.selections[0].groupId).toBe('eyes');
});
it.each([
  {...input(),prompt:'Different non-explicit request'},
  {...input(),renderVersion:'white-footer-v2'},
  {...input(),aspectRatio:'1:1'},
  {...input(),prompt:` ${input().prompt}`},
  {...input(),selections:[{groupId:'eyes',optionId:'green'},{groupId:'hair',optionId:'black'}]},
])('changes fingerprint when requested output changes%#',request=>{
  expect(nonExplicitRequestFingerprint(request,review())).not.toBe(nonExplicitRequestFingerprint(input(),review()));
});
it('binds actual reviewed image bytes and review revision',()=>{
  expect(nonExplicitRequestFingerprint(input(),{...review(),imageDigests:{...review().imageDigests,[ref]:'d'.repeat(64)}}))
    .not.toBe(nonExplicitRequestFingerprint(input(),review()));
  expect(nonExplicitRequestFingerprint(input(),{...review(),reviewedAt:'2026-10-29T11:00:00Z'}))
    .not.toBe(nonExplicitRequestFingerprint(input(),review()));
});
it('rejects duplicate groups and unreviewed scope changes',()=>{
  expect(nonExplicitRequestFingerprint({...input(),selections:[input().selections[0],input().selections[0]]},review())).toBeNull();
  expect(nonExplicitRequestFingerprint({...input(),sourcePosition:1},review())).toBeNull();
  expect(nonExplicitRequestFingerprint({...input(),appearanceFingerprint:'d'.repeat(64)},review())).toBeNull();
});
