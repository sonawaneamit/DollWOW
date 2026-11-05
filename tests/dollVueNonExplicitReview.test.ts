import {expect,it,vi} from 'vitest';
vi.mock('@/lib/assets/option-assets.mjs',()=>({isOwnedOptionAsset:(url:string)=>url.startsWith('/option-assets/')}));
import {nonExplicitReviewedInputs} from '@/lib/dollvue/nonExplicitReview';
const photo=`/option-assets/${'a'.repeat(64)}.webp`,reference=`/option-assets/${'b'.repeat(64)}.webp`;
const input=()=>({productId:'gid://shopify/Product/100',appearanceFingerprint:'c'.repeat(64),sourcePosition:0,sourceUrl:photo,referenceUrls:[reference]});
const review=()=>({policy:'non-explicit-inputs-v1',productId:input().productId,appearanceFingerprint:input().appearanceFingerprint,
  reviewedAt:'2026-10-29T10:00:00Z',sourcePositions:[0],imageDigests:{[photo]:'a'.repeat(64),[reference]:'b'.repeat(64)}});
it('requires distinct explicit non-explicit approval, not a ready appearance flag',()=>{
  expect(nonExplicitReviewedInputs(input(),undefined)).toBeNull();
  expect(nonExplicitReviewedInputs(input(),{...review(),policy:'appearance-v2',status:'ready'})).toBeNull();
});
it('returns only server-pinned inputs for later byte verification',()=>{
  expect(nonExplicitReviewedInputs(input(),review())).toEqual([
    {url:photo,sha256:'a'.repeat(64),optionReference:false},
    {url:reference,sha256:'b'.repeat(64),optionReference:true},
  ]);
});
it.each([
  {...input(),productId:'gid://shopify/Product/101'},
  {...input(),appearanceFingerprint:'d'.repeat(64)},
  {...input(),sourcePosition:1},
  {...input(),sourceUrl:'/option-assets/changed.webp'},
  {...input(),referenceUrls:['https://example.invalid/photo.webp']},
  {...input(),referenceUrls:[]},
])('fails closed when product/menu/photo/reference scope changes%#',candidate=>{
  expect(nonExplicitReviewedInputs(candidate,review())).toBeNull();
});
it('rejects malformed digest or missing dated review',()=>{
  expect(nonExplicitReviewedInputs(input(),{...review(),imageDigests:{[photo]:'bad'}})).toBeNull();
  expect(nonExplicitReviewedInputs(input(),{...review(),reviewedAt:''})).toBeNull();
});
