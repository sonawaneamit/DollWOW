import 'server-only';
import {z} from 'zod';
import {env} from '@/lib/utils/env';
import {getProductByHandle} from '@/lib/shopify/storefront';
import {productImageSources} from '@/lib/catalog/productImage';
import {dollVueAccessOrigin} from './accessOrigin';
import {readDollVueSession,dollVueEmailHash} from './session';
import {resolveCurrentDollVueEligibility} from './eligibility';
import {areDollVueSelectionsValid,resolveDollVueSelections,buildDollVuePrompt} from './config';
import {classifyAppearance} from './appearance';
import {DOLLVUE_BRANDING_VERSION} from './branding';
import {nonExplicitRequestFingerprint,type NonExplicitRequest} from './nonExplicitRequest';
import {nonExplicitReviewedInputs} from './nonExplicitReview';
import registry from './non-explicit-review-registry.json';

const bodySchema=z.object({
  requestId:z.uuid(),productHandle:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  sourcePosition:z.number().int().min(0).max(7),
  selections:z.array(z.object({groupId:z.string().min(1).max(100),optionId:z.string().min(1).max(100)}).strict()).min(1).max(2),
}).strict();
const limit=16*1024;
const ratios=[['1:1',1],['3:2',1.5],['16:9',16/9],['21:9',21/9],['9:16',9/16],['2:3',2/3],['3:4',.75],['4:5',.8]] as const;
type Failure='forbidden'|'unauthenticated'|'invalid-request'|'unavailable'|'not-reviewed';
type Prepared={
  requestId:string;emailHash:string;recipientEmail:string;productHandle:string;fingerprint:string;
  facts:NonExplicitRequest;inputs:NonNullable<ReturnType<typeof nonExplicitReviewedInputs>>;
  labels:Array<{group:string;option:string}>;
};

async function boundedJson(request:Request):Promise<unknown> {
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??'')||
    Number(request.headers.get('content-length'))>limit) return null;
  const reader=request.body?.getReader();if(!reader) return null;
  const parts:Uint8Array[]=[];let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read();if(done) break;
      size+=value.byteLength;if(size>limit) return null;
      parts.push(value);
    }
    return JSON.parse(Buffer.concat(parts,size).toString('utf8'));
  } catch {return null;}
  finally {void reader.cancel().catch(()=>{});}
}

/** Internal preparation only: never serialize this result to a browser. It contains
 * the verified recipient and private review pins. No public route, reservation,
 * provider call, image retention or entitlement bypass is enabled by this helper.
 */
export async function prepareNonExplicitRequest(request:Request):Promise<
  {ok:true;prepared:Prepared}|{ok:false;code:Failure}
> {
  try {
    const origin=dollVueAccessOrigin(request.url,env.NEXT_PUBLIC_SITE_URL,process.env.VERCEL_ENV,process.env.VERCEL_URL);
    if(request.method!=='POST'||new URL(request.url).origin!==origin||request.headers.get('origin')!==origin||
      (request.headers.has('sec-fetch-site')&&request.headers.get('sec-fetch-site')!=='same-origin')) {
      return {ok:false,code:'forbidden'};
    }
    const session=readDollVueSession(request.headers.get('cookie'));
    if(!session||!z.email().max(180).safeParse(session.email).success) return {ok:false,code:'unauthenticated'};
    const parsed=bodySchema.safeParse(await boundedJson(request));
    if(!parsed.success) return {ok:false,code:'invalid-request'};
    const body=parsed.data;
    const product=await getProductByHandle(body.productHandle,{cache:'no-store',strict:true});
    if(!product||product.handle!==body.productHandle) return {ok:false,code:'not-reviewed'};
    const eligibility=await resolveCurrentDollVueEligibility(product);
    if(!eligibility.available||!eligibility.sourcePositions.includes(body.sourcePosition)||
      !areDollVueSelectionsValid(eligibility.config,body.selections)) return {ok:false,code:'not-reviewed'};
    const choices=resolveDollVueSelections(eligibility.config,body.selections);
    if(choices.length!==body.selections.length||choices.some(({group,option})=>
      classifyAppearance(group,option).status!=='candidate'||option.swatch?.kind!=='image')) return {ok:false,code:'not-reviewed'};
    const photo=productImageSources(product)[body.sourcePosition];
    if(!photo?.url||!photo.width||!photo.height||photo.width<=0||photo.height<=0) return {ok:false,code:'not-reviewed'};
    const ratio=photo.width/photo.height;
    const aspectRatio=ratios.reduce((best,next)=>Math.abs(next[1]-ratio)<Math.abs(best[1]-ratio)?next:best)[0];
    const facts:NonExplicitRequest={
      productId:product.id,appearanceFingerprint:eligibility.revision,sourcePosition:body.sourcePosition,
      sourceUrl:photo.url,referenceUrls:choices.map(({option})=>option.swatch!.value),
      selections:body.selections,aspectRatio,renderVersion:DOLLVUE_BRANDING_VERSION,
      prompt:`${buildDollVuePrompt(product,choices)}\n\nNON-EXPLICIT OUTPUT ONLY: Preserve all clothing and coverage. Do not generate nudity, exposed intimate anatomy, sexual activity or sexualized poses.`,
    };
    const review=(registry as Readonly<Record<string,unknown>>)[product.id];
    const fingerprint=nonExplicitRequestFingerprint(facts,review);
    const inputs=nonExplicitReviewedInputs(facts,review);
    if(!fingerprint||!inputs) return {ok:false,code:'not-reviewed'};
    return {ok:true,prepared:{requestId:body.requestId,emailHash:dollVueEmailHash(session.email),
      recipientEmail:session.email,productHandle:product.handle,fingerprint,facts,inputs,
      labels:choices.map(({group,option})=>({group:group.label,option:option.label})),
    }};
  } catch {return {ok:false,code:'unavailable'};}
}
