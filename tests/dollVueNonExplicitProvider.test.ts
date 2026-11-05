import sharp from 'sharp';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
vi.mock('@/lib/utils/env',()=>({env:{VENICE_API_KEY:'synthetic-key'}}));
import {NON_EXPLICIT_MODEL,requestNonExplicitPreview} from '@/lib/dollvue/nonExplicitProvider';
const transport=vi.fn();
const input=()=>({images:['data:image/png;base64,YWJj'],prompt:'Change the color of the fully clothed adult mannequin jacket to green.',aspectRatio:'3:4'});
beforeEach(()=>{vi.stubGlobal('fetch',transport);transport.mockReset();});
afterEach(()=>vi.unstubAllGlobals());
it('always requests the filtered model without an uncensored fallback or URL re-fetch',async()=>{
  const image=await sharp({create:{width:512,height:512,channels:3,background:'#66aa88'}}).webp().toBuffer();
  transport.mockResolvedValue(new Response(new Uint8Array(image),{headers:{'content-type':'image/webp','x-venice-is-blurred':'false'}}));
  const result=await requestNonExplicitPreview(input());
  expect(result.ok).toBe(true);expect(transport).toHaveBeenCalledTimes(1);
  const request=JSON.parse(transport.mock.calls[0][1].body);
  expect(request).toMatchObject({modelId:NON_EXPLICIT_MODEL,safe_mode:true,enhance_prompt:false});
  if(result.ok) expect(result.bytes.equals(image)).toBe(true);
});
it.each([undefined,'','unknown','0'])('fails closed on unknown classification %j',async header=>{
  transport.mockResolvedValue(new Response('untrusted output',{headers:header===undefined?{}:{'x-venice-is-blurred':header}}));
  expect(await requestNonExplicitPreview(input())).toEqual({ok:false,code:'classification-unknown'});
  expect(transport).toHaveBeenCalledTimes(1);
});
it('does not decode, return, brand or retry adult-classified output',async()=>{
  transport.mockResolvedValue(new Response('not an image',{headers:{'x-venice-is-blurred':'true'}}));
  expect(await requestNonExplicitPreview(input())).toEqual({ok:false,code:'filtered'});
  expect(transport).toHaveBeenCalledTimes(1);
});
it.each([422,429,503])('does not retry rejection %i through another model',async status=>{
  transport.mockResolvedValue(new Response('provider detail',{status}));
  expect(await requestNonExplicitPreview(input())).toEqual({ok:false,code:'provider-rejected'});
  expect(transport).toHaveBeenCalledTimes(1);
});
it('rejects browser URLs, unsupported ratios and oversized image counts before a paid API call',async()=>{
  expect((await requestNonExplicitPreview({...input(),images:['https://example.invalid/photo.png']})).ok).toBe(false);
  expect((await requestNonExplicitPreview({...input(),images:Array(4).fill(input().images[0])})).ok).toBe(false);
  expect((await requestNonExplicitPreview({...input(),aspectRatio:'arbitrary'})).ok).toBe(false);
  expect(transport).not.toHaveBeenCalled();
});
it.each(['text/html','image/gif',''])('rejects unexpected content type %j despite a safe header',async contentType=>{
  transport.mockResolvedValue(new Response('not a photo',{headers:{'content-type':contentType,'x-venice-is-blurred':'false'}}));
  expect(await requestNonExplicitPreview(input())).toEqual({ok:false,code:'invalid-output'});
});
it('bounds declared output size before decoding it',async()=>{
  transport.mockResolvedValue(new Response('large',{headers:{'content-type':'image/webp','x-venice-is-blurred':'false','content-length':String(21*1024*1024)}}));
  expect(await requestNonExplicitPreview(input())).toEqual({ok:false,code:'invalid-output'});
});
it('hides transport errors without returning the key or provider detail',async()=>{
  transport.mockRejectedValue(new Error('synthetic-key private provider detail'));
  expect(await requestNonExplicitPreview(input())).toEqual({ok:false,code:'unavailable'});
});
