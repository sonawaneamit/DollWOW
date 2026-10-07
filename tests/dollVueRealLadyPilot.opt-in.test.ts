import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const fixture=vi.hoisted(()=>({registry:{} as Record<string,DollVueReadinessRecord>,mailCalls:0}));
vi.mock('@/lib/dollvue/readiness-registry.json',()=>({default:fixture.registry}));
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-jarliet-qa@example.invalid'})}));
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

const base='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/real-lady-family-preparation';
const output=path.join(base,'combined-pilot-one');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const id='gid://shopify/Product/10518067019960';
const sourceHash='aa67d90bb5a35e8106182c13a0633189a93627dcb1bda104098e9f9e19836f2b';
const eyeHash='c94f7da70dca17347d537d3f236e1e48d03aa56ac4cb539674e30aaa8d794ea4';
const hairHash='3b287110a97075324f243a797bb85f39826ad4170244dbcba690e9432b83da40';
const bindings=[
 ['combined-pilot-input.prepared.json','708af31b590d8cac21b25c00357243380c97fda29c1da72a07f0ee65a708722a'],
 ['native-reviewed-source-evidence.json','28b780f2a1433d4a23eed749c1582b02624bf0dd78238912723af14eed282463'],
 ['native-reviewed-reference-evidence.json','c5725562b97d5bfd71c5419ab07c11c6027c45fc3359547698b0c570f7d82be7'],
] as const;
type Pilot={productId:string;handle:string;sourcePosition:number;fingerprint:string;choices:DollVueReadinessRecord['choices'];
 source:{url:string;sha256:string;dataUri:string};references:Array<{reference:string;sha256:string;dataUri:string}>};
const save=(name:string,value:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
function oneCall(calls:number){if(calls!==0)throw Error('Second provider call, retry or fallback forbidden');}
it('blocks every provider attempt after the first',()=>{expect(()=>oneCall(0)).not.toThrow();expect(()=>oneCall(1)).toThrow();});

it.skipIf(process.env.DOLLVUE_REALLADY_PILOT!=='1')('runs one authorized combined Nina pilot without publication or mail',async()=>{
 await fs.mkdir(output,{recursive:true});
 expect(await fs.stat(path.join(output,'reservation.json')).then(()=>true,()=>false),'A reservation consumes authorization, even if the response was lost').toBe(false);
 for(const [name,pin] of bindings)expect(sha(await fs.readFile(path.join(base,name)))).toBe(pin);
 const pilot=JSON.parse(await fs.readFile(path.join(base,bindings[0][0]),'utf8')) as Pilot;
 const review=JSON.parse(await fs.readFile(path.join(base,bindings[1][0]),'utf8'));
 expect(review.frozen).toBe(true);expect(review.ownerReviewed).toBe(false);
 expect(review.rows.find((r:{id:string})=>r.id===id)).toMatchObject({index:33,decision:'approve',sourceSha256:sourceHash,reviewer:'native-assistant'});
 expect([pilot.productId,pilot.sourcePosition,pilot.source.sha256]).toEqual([id,0,sourceHash]);
 const choices=[{groupId:'eye-color',optionId:'forest',reference:`/option-assets/${eyeHash}.webp`},{groupId:'hairstyle',optionId:'hairstyle-3',reference:`/option-assets/${hairHash}.webp`}];
 expect(pilot.choices).toEqual(choices);
 const pins={[pilot.source.url]:sourceHash,[choices[0].reference]:eyeHash,[choices[1].reference]:hairHash};
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json');
 const registrySnapshot=JSON.parse(registryBefore.toString());expect(registrySnapshot[id]).toBeUndefined();
 const authorization={frozen:true,frozenAt:new Date().toISOString(),authorizedAt:new Date().toISOString(),reviewer:'native-assistant',reportedVia:'parent-assistant-message-autonomous-family-pilots',ownerReviewed:false,humanApproval:false,
  registryInputSha256:sha(registryBefore),registryCount:Object.keys(registrySnapshot).length,maxProviderCalls:1,noRetries:true,productId:id,sourcePosition:0,choices,imageDigests:pins,
  bindings:bindings.map(([name,sha256])=>({file:path.join(base,name),sha256})),
  scope:'One real combined generation only. Source and reference meanings accepted; output fidelity pending parent inspection.',
  sourceObservation:'Native assistant inspected full-size adult Nina source33/0: opaque white gown, non-explicit; ownerReviewed false.',
  hairObservation:'Native assistant inspected hairstyle-3: short blonde wavy hair; reference face/body never transfer.',
  constraints:['Visible iris only, respecting angle/glasses','Preserve face/body/clothing/pose/setting','No makeup, face or eyelash transfer','No production registry, Shopify mutation or customer mail']};
 await save('authorization.json',authorization);
 const authHash=sha(await fs.readFile(path.join(output,'authorization.json')));
 const nativeFetch=globalThis.fetch;let calls=0;let expectedImages:string[]=[];
 const result:Record<string,unknown>={ownerReviewed:false,reviewer:'native-assistant',authorizationSha256:authHash,visualReview:'pending-native-assistant-output-check-and-parent-spotcheck',fidelityPassed:false,generationSuccessful:false,registryWritten:false,publicationChanged:false,customerMailSent:false};
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const url=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(url.href==='https://api.venice.ai/api/v1/image/multi-edit'){
   oneCall(calls);expect(method).toBe('POST');const body=JSON.parse(String(init?.body));
   expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toEqual(expectedImages);expect(body.images).toHaveLength(3);
   expect(sha(Buffer.from(body.images[0].split(',')[1],'base64'))).toBe(sourceHash);
   const requestSha256=sha(Buffer.from(String(init?.body)));
   result.requestSha256=requestSha256;
   await save('reservation.json',{authorizationSha256:authHash,requestSha256,reservedAt:new Date().toISOString(),maxCalls:1,model:body.modelId});
   calls++;
   await save('provider-request.json',{requestSha256,authorizationSha256:authHash,model:body.modelId,prompt:body.prompt,imageDataSha256:body.images.map((s:string)=>sha(Buffer.from(s.split(',')[1],'base64'))),aspectRatio:body.aspect_ratio,resolution:body.resolution});
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
  const registryAfter=await fs.readFile('lib/dollvue/readiness-registry.json');const registryNow=JSON.parse(registryAfter.toString());for(const [oldId,oldRecord] of Object.entries(registrySnapshot)){if(JSON.stringify(registryNow[oldId])!==JSON.stringify(oldRecord))caught ||= Error('Prior registry entry changed: '+oldId);}if(registryNow[id])caught ||= Error('Pilot family entered registry during pilot');result.registryObservation={beforeSha256:sha(registryBefore),afterSha256:sha(registryAfter),externalChange:!registryBefore.equals(registryAfter),writtenByHarness:false};
  await save('result.json',result);vi.unstubAllGlobals();delete fixture.registry[id];
 }
 if(caught)throw caught;
},240000);
