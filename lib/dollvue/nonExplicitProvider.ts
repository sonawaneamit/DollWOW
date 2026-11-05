import 'server-only';
import sharp from 'sharp';
import {env} from '@/lib/utils/env';

export const NON_EXPLICIT_PROVIDER_VERSION='seedream-pro-filtered-v1';
export const NON_EXPLICIT_MODEL='seedream-v5-pro-edit';
const maxBytes=20*1024*1024;
const ratios=new Set(['1:1','3:2','16:9','21:9','9:16','2:3','3:4','4:5']);
type Failure='invalid-input'|'unavailable'|'provider-rejected'|'filtered'|'classification-unknown'|'invalid-output';
type Result={ok:true;bytes:Buffer;model:typeof NON_EXPLICIT_MODEL}|{ok:false;code:Failure};

/** Filtered output transport, not an input content review. Caller must independently
 * verify non-explicit source/reference pins and current product safety eligibility.
 * No URL inputs, arbitrary models, unsafe override or fallback are accepted here.
 */
export async function requestNonExplicitPreview(input:{images:readonly string[];prompt:string;aspectRatio:string}):Promise<Result> {
  if(!input.images.length||input.images.length>3||!input.prompt.trim()||input.prompt.length>8000||!ratios.has(input.aspectRatio)) {
    return {ok:false,code:'invalid-input'};
  }
  const images=[...input.images];
  if(images.some(image=>!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)||
    image.length>Math.ceil(maxBytes*4/3)+100)) return {ok:false,code:'invalid-input'};
  if(!env.VENICE_API_KEY) return {ok:false,code:'unavailable'};
  const signal=AbortSignal.timeout(60_000);
  try {
    const response=await fetch('https://api.venice.ai/api/v1/image/multi-edit',{
      method:'POST',headers:{Authorization:`Bearer ${env.VENICE_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({modelId:NON_EXPLICIT_MODEL,images,prompt:input.prompt,aspect_ratio:input.aspectRatio,
        resolution:'2K',output_format:'webp',safe_mode:true,enhance_prompt:false,disable_prompt_optimization_thinking:true}),
      redirect:'error',cache:'no-store',signal,
    });
    const discard=()=>{void response.body?.cancel().catch(()=>{});};
    if(!response.ok) {discard();return {ok:false,code:'provider-rejected'};}
    const classification=response.headers.get('x-venice-is-blurred')?.trim().toLowerCase();
    if(classification==='true') {discard();return {ok:false,code:'filtered'};}
    if(classification!=='false') {discard();return {ok:false,code:'classification-unknown'};}
    if(!/^image\/(?:webp|png|jpeg)(?:;|$)/i.test(response.headers.get('content-type')??'')||
      Number(response.headers.get('content-length'))>maxBytes||!response.body) {
      discard();return {ok:false,code:'invalid-output'};
    }
    const reader=response.body.getReader();const chunks:Buffer[]=[];let size=0;
    try {
      while(true) {
        const {done,value}=await reader.read();if(done) break;
        size+=value.byteLength;if(size>maxBytes) return {ok:false,code:'invalid-output'};
        chunks.push(Buffer.from(value));
      }
    } finally {void reader.cancel().catch(()=>{});}
    const bytes=Buffer.concat(chunks,size);
    const metadata=await sharp(bytes,{limitInputPixels:25_000_000,failOn:'warning',animated:true}).timeout({seconds:5}).metadata();
    if(!metadata.width||!metadata.height||Math.min(metadata.width,metadata.height)<400||
      (metadata.pages??1)!==1||!['png','webp','jpeg'].includes(metadata.format??'')) return {ok:false,code:'invalid-output'};
    return {ok:true,bytes,model:NON_EXPLICIT_MODEL};
  } catch {return {ok:false,code:'unavailable'};}
}
