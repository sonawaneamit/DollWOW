import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const fixture=vi.hoisted(()=>({registry:{} as Record<string,DollVueReadinessRecord>,mailCalls:0,armed:false,product:null as Product|null}));
vi.mock('@/lib/dollvue/readiness-registry.json',()=>({default:fixture.registry}));
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-alias-seven-qa@example.invalid'})}));
vi.mock('@/lib/dollvue/accountUsage',()=>({dollVueUsageForEmail:async()=>({available:true,remaining:1}),recordDollVuePreview:async()=>true}));
vi.mock('@/lib/dollvue/email',()=>({sendDollVueLookEmail:async()=>{fixture.mailCalls++;return {delivered:false,provider:'test-only-no-mail'};}}));

vi.mock('@/lib/shopify/storefront',async importOriginal=>{
 const original=await importOriginal<typeof import('@/lib/shopify/storefront')>();
 return {...original,getProductByHandle:(...args:Parameters<typeof original.getProductByHandle>)=>{
  if(fixture.armed&&args[0]===fixture.product?.handle){expect(args[1]?.strict).toBe(true);return Promise.resolve(fixture.product);}
  return original.getProductByHandle(...args);
 }};
});
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

type Node=Parameters<typeof mapShopifyProduct>[0];
type AdminNode = Omit<Node,'priceRange'|'variants'> & {status:string;publishedAt:string|null;hold?:{value:string}|null;
  resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};
  variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
function assertDraft(n:Pick<AdminNode,'status'|'publishedAt'|'hold'|'resourcePublications'>, sf:unknown) {
  expect(n.status).toBe('DRAFT');expect(n.publishedAt).toBeNull();expect(sf).toBeNull();
  expect(n.resourcePublications.pageInfo.hasNextPage).toBe(false);
  expect(n.resourcePublications.nodes.some(x=>x.isPublished)).toBe(false);
  expect(Object.hasOwn(n,'hold')).toBe(true);
  expect(n.hold===null||typeof n.hold?.value==='string').toBe(true);expect(n.hold?.value.trim()||'').toBe('');
}

const fields: Record<string,string> = {
  catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',
  displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',
  sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',
  weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',
  warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',
  stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',
  irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups',
};
const query=`query DraftExpansionCurrent($ids:[ID!]!){nodes(ids:$ids){... on Product{
 id handle title description seo{title description} vendor productType tags status publishedAt
 hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}
 resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}
 featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
 variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}
 media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
 ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}
 ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join('\n')}
}} shop{currencyCode}}`;
function mapped(n:AdminNode,currency:string){
  const price={amount:n.variants.edges[0]?.node.price||'0',currencyCode:currency};
  return mapShopifyProduct({...n,priceRange:{minVariantPrice:price,maxVariantPrice:price},
    variants:{edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:currency}}}))}});
}
const base='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/wm-yl-angelkiss-alias-reconciliation/seven-gap-preparation';
const familyPins={
 'angelkiss-hilda':'28de9b7bf61c5e0abf90eb2e2dd70291b91d24a7bb6194a35fe2ae5fc4d0f387',
 'wm-sulane':'1c4525f4e13b79a7e11f27dba5fd8349f98f973ba25e125d0d10edeea085d8d1',
 'yl-judy':'ce9dd9246f0a785814f61bf64b000fd12fec19bb59f3d6ad4be011a85324090b',
} as const;
const selectedFamily=process.env.DOLLVUE_ALIAS_SEVEN_FAMILY;
const family=(selectedFamily||'angelkiss-hilda') as keyof typeof familyPins;
const output=path.join(base,family+'-pilot-one');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
type Binding={file:string;sha256:string};
type Pilot={frozen:boolean;ownerReviewed:false;productId:string;handle:string;sourcePosition?:number;fingerprint:string;statusAtPreparation:string;
 choices:Array<{groupId:string;optionId:string}>;source:Binding & {url:string;sourcePosition:number};
 references:Array<Binding & {url:string;groupId:string;optionId:string}>;inputs:Binding[];contactSheet:Binding;
 request:{productHandle:string;sourcePosition:number;selections:Array<{groupId:string;optionId:string}>};requestSha256:string;imageDigests:Record<string,string>};
const save=(name:string,value:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
function oneCall(calls:number){if(calls!==0)throw Error('Second provider call, retry or fallback forbidden');}
it('blocks every provider attempt after the first',()=>{expect(()=>oneCall(0)).not.toThrow();expect(()=>oneCall(1)).toThrow();});

it.skipIf(!selectedFamily)('runs exactly one parent-input-authorized combined alias-family pilot without publication or mail',async()=>{
 expect(Object.hasOwn(familyPins,family)).toBe(true);
 await fs.mkdir(output,{recursive:true});
 expect(await fs.stat(path.join(output,'reservation.json')).then(()=>true,()=>false),'A reservation consumes authorization, even if the response was lost').toBe(false);
 const inputFile=path.join(base,family+'-pilot-input.frozen.json');
 expect(sha(await fs.readFile(inputFile))).toBe(familyPins[family]);
 const pilot=JSON.parse(await fs.readFile(inputFile,'utf8')) as Pilot;
 expect(pilot.frozen).toBe(true);expect(pilot.ownerReviewed).toBe(false);
 expect(pilot.request.sourcePosition).toBe(0);
 expect(sha(Buffer.from(JSON.stringify(pilot.request)))).toBe(pilot.requestSha256);
 const bindings:Binding[]=[{file:inputFile,sha256:familyPins[family]},...pilot.inputs,pilot.contactSheet,pilot.source,...pilot.references];
 for(const bound of bindings)expect(sha(await fs.readFile(bound.file))).toBe(bound.sha256);
 const id=pilot.productId,sourceHash=pilot.source.sha256;
 const choices=pilot.choices.map(c=>{const ref=pilot.references.find(r=>r.groupId===c.groupId&&r.optionId===c.optionId)!;expect(ref).toBeDefined();return {...c,reference:ref.url};});
 expect(choices).toHaveLength(2);expect(choices.map(c=>c.groupId)).toEqual(['eye-color','hairstyle']);
 const pins=pilot.imageDigests;
 expect(pins).toEqual(Object.fromEntries([pilot.source,...pilot.references].map(r=>[r.url,r.sha256])));
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json');
 const registrySnapshot=JSON.parse(registryBefore.toString());expect(registrySnapshot[id]).toBeUndefined();
 const authorization={frozen:true,frozenAt:new Date().toISOString(),authorizedAt:new Date().toISOString(),reviewer:'parent-assistant',reportedVia:'parent-assistant-message',ownerReviewed:false,humanApproval:false,
  approvalScope:'INPUT ONLY. Parent directly inspected the three frozen input PNGs. Output fidelity is not approved.',
  registryInputSha256:sha(registryBefore),registryCount:Object.keys(registrySnapshot).length,maxProviderCalls:1,totalAuthorizedFamilies:3,noRetries:true,noFallback:true,
  family,productId:id,sourcePosition:0,choices,imageDigests:pins,requestSha256:pilot.requestSha256,bindings,
  scope:'Exactly one actual runtime/provider combined pilot for this family. No registry, publication, orders, mail or Shopify mutations.',
  sourceObservation:family==='angelkiss-hilda'?'Adult Hilda in opaque orange dress holding wine glass':family==='wm-sulane'?'Adult Sulane in opaque floral dress':'Adult Judy in opaque light top and black pants',
  constraints:['Visible iris only','Preserve source identity, body, clothing, pose, props and setting','No reference face, makeup or eyelash transfer','Output needs parent review']};
 await save('authorization.json',authorization);
 const authHash=sha(await fs.readFile(path.join(output,'authorization.json')));
 const nativeFetch=globalThis.fetch;let calls=0;let expectedImages:string[]=[];
 const result:Record<string,unknown>={ownerReviewed:false,reviewer:'native-assistant',authorizationSha256:authHash,visualReview:'pending-parent-output-inspection',fidelityPassed:false,generationSuccessful:false,registryWritten:false,publicationChanged:false,customerMailSent:false};
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
   const response=await nativeFetch(input,{...init,redirect:'error'});
   result.providerStatus=response.status;
   await save('provider-response-status.json',{status:response.status,receivedAt:new Date().toISOString()});
   return response;
  }
  if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
  }else if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect([pilot.source.url,...choices.map(c=>new URL(c.reference,origin).href)]).toContain(url.href);expect(init?.cache).toBe('no-store');}
  return nativeFetch(input,{...init,redirect:'error'});
 });
 async function current(stage:string){
  expect(fixture.armed).toBe(false);
  const sf=await getProductByHandle(pilot.handle,{strict:true,cache:'no-store'});
  if(pilot.statusAtPreparation==='DRAFT')expect(sf).toBeNull();else expect(sf?.id).toBe(id);
  const admin=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(query,{ids:[id]});
  expect(admin.nodes).toHaveLength(1);const node=admin.nodes[0]!;expect(node.id).toBe(id);expect(node.status).toBe(pilot.statusAtPreparation);
  if(node.status==='DRAFT')assertDraft(node,sf);
  expect(Object.hasOwn(node,'hold')).toBe(true);expect(node.hold?.value.trim()||'').toBe('');
  const product=mapped(node,admin.shop.currencyCode);expect(product.id).toBe(id);fixture.product=product;
  expect(isCustomerVisibleProduct(product!)).toBe(true);expect(isDollVueExcluded(product!)).toBe(false);
  const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(pilot.fingerprint);
  if(sf){const sfConfig=dollVueConfigForProduct(sf,getCustomizationConfig(sf));expect(dollVueReadinessFingerprint(sf,sfConfig)).toBe(pilot.fingerprint);}
  expect(productImageSources(product!)[0].url).toBe(pilot.source.url);
  const holds=await getCurrentDollVueHolds([id]);expect(holds.get(id)).toBe('clear');
  const images=[await normalizeReviewedImage({url:pilot.source.url,sha256:sourceHash,origin})];
  for(const c of choices){const group=config.groups.find(g=>g.id===c.groupId)!;expect(group.visibleWhen?.length||0).toBe(0);expect(group.options.find(o=>o.id===c.optionId)?.swatch?.value).toBe(c.reference);images.push(await normalizeReviewedImage({url:c.reference,sha256:pins[c.reference],origin,optionReference:true}));}
  expect(images).toHaveLength(3);
  await save(stage+'-current-verification.json',{checkedAt:new Date().toISOString(),productId:id,handle:product!.handle,fingerprint:pilot.fingerprint,hold:'clear',status:node.status,published:node.publishedAt!==null,storefrontAbsent:sf===null,tags:product.tags,imageDigests:pins,normalizedDigests:images.map(s=>sha(Buffer.from(s.split(',')[1],'base64')))});
  return images;
 }
 let caught:unknown;
 try{
  expectedImages=await current('before');
  fixture.registry[id]={productId:id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:pilot.fingerprint,status:'ready',sourcePositions:[0],choices,imageDigests:pins};
  fixture.armed=true;
  const response=await POST(new Request(`${origin}/dollvue/generate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body:JSON.stringify({productHandle:pilot.handle,sourcePosition:0,selections:choices.map(({groupId,optionId})=>({groupId,optionId}))})}));
  const payload=await response.json();result.routeStatus=response.status;result.routeError=payload.error;
  if(payload.previewDataUrl){const bytes=Buffer.from(payload.previewDataUrl.split(',')[1],'base64');const file=path.join(output,'combined.webp');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});result.output=file;result.outputSha256=sha(bytes);result.generationSuccessful=true;}
  expect(response.status,String(payload.error)).toBe(200);expect(calls).toBe(1);expect(payload.emailDelivered).toBe(false);expect(fixture.mailCalls).toBe(1);
 }catch(error){caught=error;result.error=error instanceof Error?error.message:String(error);}
 finally{
  fixture.armed=false;
  try{await current('after');result.postflightPassed=true;}catch(error){result.postflightPassed=false;result.postflightError=error instanceof Error?error.message:String(error);caught ||= error;}
  for(const bound of bindings){if(sha(await fs.readFile(bound.file))!==bound.sha256){result.evidenceChanged=true;caught ||= Error('Bound evidence changed');}}
  result.providerCalls=calls;result.completedAt=new Date().toISOString();
  const registryAfter=await fs.readFile('lib/dollvue/readiness-registry.json');const registryNow=JSON.parse(registryAfter.toString());for(const [oldId,oldRecord] of Object.entries(registrySnapshot)){if(JSON.stringify(registryNow[oldId])!==JSON.stringify(oldRecord))caught ||= Error('Prior registry entry changed: '+oldId);}if(registryNow[id])caught ||= Error('Pilot family entered registry during pilot');result.registryObservation={beforeSha256:sha(registryBefore),afterSha256:sha(registryAfter),externalChange:!registryBefore.equals(registryAfter),writtenByHarness:false};
  await save('result.json',result);vi.unstubAllGlobals();delete fixture.registry[id];
 }
 if(caught)throw caught;
},240000);

