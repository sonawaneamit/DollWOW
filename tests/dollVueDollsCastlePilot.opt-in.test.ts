import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const fixture=vi.hoisted(()=>({registry:{} as Record<string,DollVueReadinessRecord>,mailCalls:0}));
vi.mock('@/lib/dollvue/readiness-registry.json',()=>({default:fixture.registry}));
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-castle-qa@example.invalid'})}));
vi.mock('@/lib/dollvue/accountUsage',()=>({dollVueUsageForEmail:async()=>({available:true,remaining:1}),recordDollVuePreview:async()=>true}));
vi.mock('@/lib/dollvue/email',()=>({sendDollVueLookEmail:async()=>{fixture.mailCalls++;return {delivered:false,provider:'test-only-no-mail'};}}));

import { POST } from '@/app/dollvue/generate/route';
import { getProductByHandle, isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { dollVueReadinessFingerprint } from '@/lib/dollvue/readiness';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { productImageSources } from '@/lib/catalog/productImage';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { env } from '@/lib/utils/env';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';

const base='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/dolls-castle-eye5-preparation/current-complete';
const output=path.join(base,'combined-pilot-one');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const id='gid://shopify/Product/10518026715320';
const sourceHash='19a431b81328398385f044aa9243ca9ed95ba4684cddcefd9e40832b254e29fe';
const eyeHash='ec721cb436a7dc6ff83389ab99b8bd7b66e9b5cae68015d5895b9cdab2e5da17';
const hairHash='b52732bd2186781455d4adf7ff1a066e8f745ddb704f1902068cdd6b8f0918f3';
const bindings=[
 ['combined-pilot-input.cart-verified.json','9186694ebccd1c2b2fdfe59b3e704fbadb30e894f3dbfb5257bb56632fc0571d'],
 ['source-review-1-156.json','de3f642484a02e76720fe4ebd7825b6347a2bf43e382a3be288e84d5a13a7182'],
 ['reviewed-reference-evidence.json','5756f3f507e84698b8815273beda2300f2b54cd21e28c8ce8b06ed91aa86c42c'],
] as const;
type Pilot={productId:string;handle:string;sourcePosition:number;fingerprint:string;choices:DollVueReadinessRecord['choices'];
 source:{url:string;sha256:string;dataUri:string};references:Array<{reference:string;sha256:string;dataUri:string}>};
const save=(name:string,value:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
function oneCall(calls:number){if(calls!==0)throw Error('Second provider call, retry or fallback forbidden');}
it('blocks every provider attempt after the first',()=>{expect(()=>oneCall(0)).not.toThrow();expect(()=>oneCall(1)).toThrow();});

it.skipIf(process.env.DOLLVUE_CASTLE_PILOT!=='1')('runs one authorized combined Sybil pilot without publication or mail',async()=>{
 await fs.mkdir(output,{recursive:true});
 expect(await fs.stat(path.join(output,'reservation.json')).then(()=>true,()=>false),'A reservation consumes authorization, even if the response was lost').toBe(false);
 for(const [name,pin] of bindings)expect(sha(await fs.readFile(path.join(base,name)))).toBe(pin);
 const pilot=JSON.parse(await fs.readFile(path.join(base,bindings[0][0]),'utf8')) as Pilot;
 const review=JSON.parse(await fs.readFile(path.join(base,bindings[1][0]),'utf8'));
 expect(review.frozen).toBe(true);expect(review.ownerReviewed).toBe(false);
 expect(review.rows.find((r:{id:string})=>r.id===id)).toMatchObject({index:121,decision:'approve',sourceSha256:sourceHash,parentReview:{decision:'accept',reviewer:'parent-assistant'}});
 expect([pilot.productId,pilot.sourcePosition,pilot.source.sha256]).toEqual([id,0,sourceHash]);
 const choices=[{groupId:'eye-color',optionId:'blue',reference:`/option-assets/${eyeHash}.webp`},{groupId:'hairstyle',optionId:'hairstyle-3',reference:`/option-assets/${hairHash}.webp`}];
 expect(pilot.choices).toEqual(choices);
 const pins={[pilot.source.url]:sourceHash,[choices[0].reference]:eyeHash,[choices[1].reference]:hairHash};
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json');
 const authorization={authorizedAt:new Date().toISOString(),reviewer:'parent-assistant',reportedVia:'parent-assistant-message',ownerReviewed:false,humanApproval:false,
  maxProviderCalls:1,noRetries:true,productId:id,sourcePosition:0,choices,imageDigests:pins,
  bindings:bindings.map(([name,sha256])=>({file:path.join(base,name),sha256})),
  scope:'One real combined generation only. Source and reference meanings accepted; output fidelity pending parent inspection.',
  sourceObservation:'Parent-assistant inspected full-size mature adult Sybil, white top and shorts; non-explicit.',
  hairObservation:'Parent-assistant inspected hairstyle-3: black long hair with blunt fringe.',
  constraints:['Visible iris only, respecting angle/glasses','Preserve face/body/clothing/pose/setting','No makeup transfer','No production registry, Shopify mutation or customer mail']};
 await save('authorization.json',authorization);
 const authHash=sha(await fs.readFile(path.join(output,'authorization.json')));
 const nativeFetch=globalThis.fetch;let calls=0;let expectedImages:string[]=[];
 const result:Record<string,unknown>={ownerReviewed:false,reviewer:'parent-assistant',authorizationSha256:authHash,visualReview:'pending-parent-assistant',fidelityPassed:false,generationSuccessful:false,registryWritten:false,publicationChanged:false,customerMailSent:false};
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const url=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(url.href==='https://api.venice.ai/api/v1/image/multi-edit'){
   oneCall(calls);expect(method).toBe('POST');const body=JSON.parse(String(init?.body));
   expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toEqual(expectedImages);expect(body.images).toHaveLength(3);
   expect(sha(Buffer.from(body.images[0].split(',')[1],'base64'))).toBe(sourceHash);
   await save('reservation.json',{authorizationSha256:authHash,reservedAt:new Date().toISOString(),maxCalls:1,model:body.modelId});
   calls++;
   await save('provider-request.json',{model:body.modelId,prompt:body.prompt,imageDataSha256:body.images.map((s:string)=>sha(Buffer.from(s.split(',')[1],'base64'))),aspectRatio:body.aspect_ratio,resolution:body.resolution});
   const response=await nativeFetch(input,init);
   result.providerStatus=response.status;
   await save('provider-response-status.json',{status:response.status,receivedAt:new Date().toISOString()});
   return response;
  }
  if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
  }else if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect([pilot.source.url,...choices.map(c=>new URL(c.reference,origin).href)]).toContain(url.href);expect(init?.cache).toBe('no-store');}
  return nativeFetch(input,init);
 });
 async function current(stage:string){
  const product=await getProductByHandle(pilot.handle,{strict:true,cache:'no-store'});expect(product?.id).toBe(id);
  expect(isCustomerVisibleProduct(product!)).toBe(true);expect(isDollVueExcluded(product!)).toBe(false);
  const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(pilot.fingerprint);
  expect(productImageSources(product!)[0].url).toBe(pilot.source.url);
  const holds=await getCurrentDollVueHolds([id]);expect(holds.get(id)).toBe('clear');
  const images=[await normalizeReviewedImage({url:pilot.source.url,sha256:sourceHash,origin})];
  for(const c of choices){const group=config.groups.find(g=>g.id===c.groupId)!;expect(group.visibleWhen?.length||0).toBe(0);expect(group.options.find(o=>o.id===c.optionId)?.swatch?.value).toBe(c.reference);images.push(await normalizeReviewedImage({url:c.reference,sha256:pins[c.reference],origin,optionReference:true}));}
  expect(images).toEqual([pilot.source.dataUri,...pilot.references.map(r=>r.dataUri)]);
  await save(stage+'-current-verification.json',{checkedAt:new Date().toISOString(),productId:id,handle:product!.handle,fingerprint:pilot.fingerprint,hold:'clear',imageDigests:pins,normalizedDigests:images.map(s=>sha(Buffer.from(s.split(',')[1],'base64')))});
  return images;
 }
 let caught:unknown;
 try{
  expectedImages=await current('before');
  fixture.registry[id]={productId:id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:pilot.fingerprint,status:'ready',sourcePositions:[0],choices,imageDigests:pins};
  const response=await POST(new Request(`${origin}/dollvue/generate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body:JSON.stringify({productHandle:pilot.handle,sourcePosition:0,selections:choices.map(({groupId,optionId})=>({groupId,optionId}))})}));
  const payload=await response.json();result.routeStatus=response.status;result.routeError=payload.error;
  if(payload.previewDataUrl){const bytes=Buffer.from(payload.previewDataUrl.split(',')[1],'base64');const file=path.join(output,'combined.webp');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});result.output=file;result.outputSha256=sha(bytes);result.generationSuccessful=true;}
  expect(response.status,String(payload.error)).toBe(200);expect(calls).toBe(1);expect(payload.emailDelivered).toBe(false);expect(fixture.mailCalls).toBe(1);
 }catch(error){caught=error;result.error=error instanceof Error?error.message:String(error);}
 finally{
  try{await current('after');result.postflightPassed=true;}catch(error){result.postflightPassed=false;result.postflightError=error instanceof Error?error.message:String(error);caught ||= error;}
  for(const [name,pin] of bindings){if(sha(await fs.readFile(path.join(base,name)))!==pin){result.evidenceChanged=true;caught ||= Error('Bound evidence changed');}}
  result.providerCalls=calls;result.completedAt=new Date().toISOString();
  const registryAfter=await fs.readFile('lib/dollvue/readiness-registry.json');result.registryObservation={beforeSha256:sha(registryBefore),afterSha256:sha(registryAfter),externalChange:!registryBefore.equals(registryAfter),writtenByHarness:false};
  await save('result.json',result);vi.unstubAllGlobals();delete fixture.registry[id];
 }
 if(caught)throw caught;
},240000);
