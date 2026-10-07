import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const state=vi.hoisted(()=>({armed:false,product:null as Product|null,registry:{} as Record<string,DollVueReadinessRecord>,mailCalls:0}));
vi.mock('@/lib/dollvue/readiness-registry.json',()=>({default:state.registry}));
vi.mock('@/lib/shopify/storefront',async original=>{
 const actual=await original<typeof import('@/lib/shopify/storefront')>();
 return {...actual,getProductByHandle:(...args:Parameters<typeof actual.getProductByHandle>)=>{
  if(state.armed){expect(args[0]).toBe(state.product?.handle);expect(args[1]?.strict).toBe(true);return Promise.resolve(state.product);}
  return actual.getProductByHandle(...args);
 }};
});
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-elsa-firefly-qa@example.invalid'})}));
vi.mock('@/lib/dollvue/accountUsage',()=>({dollVueUsageForEmail:async()=>({available:true,remaining:1}),recordDollVuePreview:async()=>true}));
vi.mock('@/lib/dollvue/email',()=>({sendDollVueLookEmail:async()=>{state.mailCalls++;return {delivered:false,provider:'test-no-mail'};}}));
import { POST as generate } from '@/app/dollvue/generate/route';
import { POST as cart } from '@/app/dollvue/cart/route';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness } from '@/lib/dollvue/readiness';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { productImageSources } from '@/lib/catalog/productImage';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { env } from '@/lib/utils/env';

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/elsa-firefly-preparation/current-complete';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const bindings=[["candidate-manifest.json","0c3cdd6c5566dffb60a49f332fe6a127c1c6f4a827f511bad2174ec912abca84"],["source-review-1-28.json","63e8b994f13fb13a596e95eccd0b05237bd886a982f3880200c7967f7214a39f"],["reference-screening.json","63e6ae21473f4965c2141df7f4a2388ab4639bc9fdbe8c347ff0376b06198977"]] as const;
const pilots=[{"key":"elsa-eye8","index":6,"option":"no-6","id":"gid://shopify/Product/10639172010168","source":"1a4edc81913f3567428190a99e9f65d957de7cc384c5c6fe1b94a296757249bd","reference":"1ee37c469e5e0c69c530014a7b282809a2def45fc1fcc1000e39ed3834569718"},{"key":"firefly-eye15","index":27,"option":"no-3","id":"gid://shopify/Product/10639457059000","source":"e70572ab67b06ac79737dcd20eb8bce3af26e361ec6fe8a9a668854e52c05db3","reference":"eba94adc6ce456cf97a942beaedd8884ae5419338f277d19ca0b40462e82affb"}] as const;
type Choice={groupId:string;optionId:string;label:string;reference:string;sha256:string};
type Row={index:number;id:string;handle:string;brand:string;familyKey:string;fingerprint:string;choices:Choice[];sources:Array<{sourcePosition:number;url:string;file:string;sha256:string}>};
type Mapped=Parameters<typeof mapShopifyProduct>[0];
type AdminNode=Omit<Mapped,'variants'|'priceRange'> & {status:string;publishedAt:string|null;hold:{value:string}|null;resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};variants:{edges:Array<{node:Omit<Mapped['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
const query=`query ElsaFireflyPilot($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;
function oneCall(calls:number){if(calls!==0)throw Error('Retry/fallback forbidden');}
it('limits pilots to two fixed iris families and one attempt each',()=>{
 expect(new Set(pilots.map(p=>p.id)).size).toBe(2);expect(()=>oneCall(0)).not.toThrow();expect(()=>oneCall(1)).toThrow();
});
for(const p of pilots)it.skipIf(process.env.DOLLVUE_ELSA_FIREFLY_PILOT!==p.key)(`runs one private ${p.key} iris pilot`,async()=>{
 const parsed=[];
 for(const [file,pin] of bindings){const b=await fs.readFile(path.join(root,file));expect(sha(b)).toBe(pin);parsed.push(JSON.parse(b.toString()));}
 const [manifest,review,refs]=parsed;
 expect(review).toMatchObject({frozen:true,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false});
 const r:Row=manifest.rows.find((r:Row)=>r.id===p.id);expect(r.index).toBe(p.index);
 const source=r.sources.find(s=>s.sourcePosition===0)!;
 expect(review.rows.find((r:Row)=>r.id===p.id)).toMatchObject({decision:'approve',sha256:p.source,sourceURL:source.url,sourcePosition:0,originalInspected:true});
 expect(source.sha256).toBe(p.source);expect(sha(await fs.readFile(source.file))).toBe(p.source);
 const selected=r.choices.find(c=>c.groupId==='eye-color'&&c.optionId===p.option)!;
 expect(refs).toMatchObject({frozen:true,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false});
 const ref=refs.rows.find((c:{reference:string})=>c.reference===selected.reference);
 expect(ref).toMatchObject({reference:selected.reference,sha256:p.reference,decision:'approveReferenceMeaning'});
 expect(sha(await fs.readFile(ref.file))).toBe(p.reference);
 const choices=[{groupId:'eye-color',optionId:p.option,reference:selected.reference}];
 const imageDigests={[source.url]:p.source,[selected.reference]:p.reference};
 const record:DollVueReadinessRecord={productId:p.id,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:r.fingerprint,sourcePositions:[0],choices,imageDigests};
 const output=path.join(root,'pilot-'+p.key);await fs.mkdir(output,{recursive:true,mode:0o700});
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 expect(await fs.stat(path.join(output,'reservation.json')).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})).toBe(false);
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 expect(env.DOLLVUE_ENABLED).toBe('true');expect(env.VENICE_API_KEY).toBeTruthy();
 const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registrySnapshot=JSON.parse(registryBytes.toString()),registryBefore=sha(registryBytes);
 expect(registrySnapshot[p.id]).toBeUndefined();
 await save('authorization.json',{reviewer:'assistant',authorizationReportedBy:'parent-assistant',ownerReviewed:false,humanApproval:false,sourceNativeReviewed:true,referenceNativeReviewed:true,maxProviderCalls:1,noRetries:true,productId:p.id,index:p.index,sourcePosition:0,choices,imageDigests,bindings,scope:'Private iris-only route pilot; no catalog or public activation approval.'});
 const result:Record<string,unknown>={productId:p.id,index:p.index,choices,imageDigests,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false,parentInspection:'pending',registryWritten:false,catalogChanged:false,customerMailSent:false};
 const request=(route:string)=>new Request(`${origin}/dollvue/${route}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body:JSON.stringify({productHandle:r.handle,sourcePosition:0,selections:choices.map(({groupId,optionId})=>({groupId,optionId}))})});
 const nativeFetch=globalThis.fetch;let calls=0;let expectedImages:string[]=[];state.mailCalls=0;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.href==='https://api.venice.ai/api/v1/image/multi-edit'){
   oneCall(calls);expect(state.armed).toBe(true);expect(method).toBe('POST');const body=JSON.parse(String(init?.body));
   expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toEqual(expectedImages);expect(body.images).toHaveLength(2);
   expect(body.prompt).toContain('Transfer only the visible iris color only');expect(body.prompt).not.toMatch(/Transfer only (?!the visible iris color only)/);
   for(const [file,pin] of bindings)expect(sha(await fs.readFile(path.join(root,file)))).toBe(pin);
   await current('reservation');
   const hashes=body.images.map((s:string)=>sha(Buffer.from(s.split(',')[1],'base64')));
   await save('reservation.json',{reservedAt:new Date().toISOString(),maxProviderCalls:1,requestSha256:sha(Buffer.from(String(init?.body))),hashes});calls++;
   await save('request.json',{...body,images:undefined,imageHashes:hashes});
   const response=await nativeFetch(input,{...init,redirect:'error'});result.providerStatus=response.status;return response;
  }
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);}
  else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect([source.url,new URL(selected.reference,origin).href]).toContain(u.href);}
  return nativeFetch(input,{...init,redirect:'error'});
 });
 async function current(stage:string){
  const response=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids:[p.id]});expect(response.nodes).toHaveLength(1);const n=response.nodes[0];
  expect(n.id).toBe(p.id);expect(n.handle).toBe(r.handle);expect(n.status).toBe('DRAFT');expect(n.publishedAt).toBeNull();expect(Object.hasOwn(n,'hold')).toBe(true);expect(n.hold?.value.trim()||'').toBe('');
  expect(n.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(n.resourcePublications.nodes.some(v=>v.isPublished)).toBe(false);
  const variants={edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:response.shop.currencyCode}}}))};
  const product=mapShopifyProduct({...n,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}});
  expect(product.extended.brand).toBe(r.brand);expect(isDollVueExcluded(product)).toBe(false);
  expect(product.tags.filter(t=>t!=='catalog-review-hold').some(t=>/hold|excluded|not-for-launch|youth|minor|teen/i.test(t))).toBe(false);
  const config=dollVueConfigForProduct(product,getCustomizationConfig(product));expect(dollVueReadinessFingerprint(product,config)).toBe(r.fingerprint);
  expect(productImageSources(product)[0].url).toBe(source.url);expect((await getCurrentDollVueHolds([p.id])).get(p.id)).toBe('clear');
  expect(config.groups.find(g=>g.id==='eye-color')?.options.find(o=>o.id===p.option)?.swatch?.value).toBe(selected.reference);
  expect(evaluateDollVueReadiness(product,config,record,{published:false,privateReview:true,contentExcluded:false})).toMatchObject({ready:true,publiclyAvailable:false,privatelyAvailable:true});
  const images=[await normalizeReviewedImage({url:source.url,sha256:p.source,origin}),await normalizeReviewedImage({url:selected.reference,sha256:p.reference,origin,optionReference:true})];
  if(expectedImages.length)expect(images).toEqual(expectedImages);
  await save(stage+'-current.json',{checkedAt:new Date().toISOString(),id:p.id,status:'DRAFT',publishedAt:null,allPublicationsUnpublished:true,hold:'clear',fingerprint:r.fingerprint,imageDigests,normalizedHashes:images.map(s=>sha(Buffer.from(s.split(',')[1],'base64')))});
  return {product,images};
 }
 async function publicReject(){expect(state.armed).toBe(false);expect(await getProductByHandle(r.handle,{strict:true,cache:'no-store'})).toBeNull();expect((await generate(request('generate'))).status).toBe(404);expect((await cart(request('cart'))).status).toBe(404);}
 let caught:unknown;
 try{
  const before=await current('before');expectedImages=before.images;await publicReject();result.publicRejectedBefore=true;
  state.product=before.product;state.registry[p.id]=record;state.armed=true;
  const response=await generate(request('generate')),payload=await response.json();result.routeStatus=response.status;result.routeError=payload.error;
  if(payload.previewDataUrl){const b=Buffer.from(payload.previewDataUrl.split(',')[1],'base64');const file=path.join(output,'iris.webp');await fs.writeFile(file,b,{flag:'wx',mode:0o600});result.output=file;result.outputSha256=sha(b);}
  expect(response.status,String(payload.error)).toBe(200);expect(calls).toBe(1);expect(payload.emailDelivered).toBe(false);expect(state.mailCalls).toBe(1);
 }catch(e){caught=e;result.error=e instanceof Error?e.message:String(e);}
 finally{
  state.armed=false;state.product=null;delete state.registry[p.id];
  try{await current('after');await publicReject();result.postflightPassed=true;}catch(e){caught ||= e;result.postflightError=e instanceof Error?e.message:String(e);}
  vi.unstubAllGlobals();const registryEnd=JSON.parse(await fs.readFile('lib/dollvue/readiness-registry.json','utf8'));for(const [id,entry] of Object.entries(registrySnapshot))expect(registryEnd[id]).toEqual(entry);expect(registryEnd[p.id]).toBeUndefined();result.preexistingRegistryUnchanged=true;result.registryInputCount=Object.keys(registrySnapshot).length;result.providerCalls=calls;result.registryBeforeSha256=registryBefore;result.registryAfterSha256=sha(await fs.readFile('lib/dollvue/readiness-registry.json'));result.completedAt=new Date().toISOString();await save('result.json',result);
 }
 if(caught)throw caught;
},300000);


