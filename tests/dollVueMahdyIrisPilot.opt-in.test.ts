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
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-mahdy-qa@example.invalid'})}));
vi.mock('@/lib/dollvue/accountUsage',()=>({dollVueUsageForEmail:async()=>({available:true,remaining:1}),recordDollVuePreview:async()=>true}));
vi.mock('@/lib/dollvue/email',()=>({sendDollVueLookEmail:async()=>{state.mailCalls++;return {delivered:false,provider:'test-no-mail'};}}));
import { POST as generate } from '@/app/dollvue/generate/route';
import { POST as cart } from '@/app/dollvue/cart/route';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections,resolveCustomization } from '@/lib/customization/resolve';
import { promotionPricingForSelections } from '@/lib/promotions/optionPricing';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness,reviewedDollVueConfig } from '@/lib/dollvue/readiness';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { productImageSources } from '@/lib/catalog/productImage';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { env } from '@/lib/utils/env';

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/mahdy-iris-six-preparation';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const bindings=[
 ['candidate-manifest.json','738e529ca2028ac89cf97a8610ea5b2348bf5450b6e63a545cb39e78a2ae154e'],
 ['reviewed-reference-evidence.frozen.json','c24131207739f013deb75491cf00f60cae37bce16a797a1513b9f71b666980e2'],
 ['pilot-input-no-4.frozen.json','26c9f2943166a0494b2533f4a2e9b89201de14e6f19b034f94dca12d73cd7f9f']
] as const;
const pilots=[{key:'mahdy-iris6',index:1,option:'no-4',id:'gid://shopify/Product/10428386934968',source:'d32de35e9e62be4a8f91e3a2f53fbd3541ef43591f70f90d2baec8b54753b1f9',reference:'e985f100ec102e8c2200783b92dce79aeceaec4510c66070fc89af6c66c8246a'}] as const;
type Choice={groupId:string;optionId:string;label:string;reference:string;sha256:string};
type Row={index:number;id:string;handle:string;brand:string;familyKey:string;fingerprint:string;choices:Choice[];source:{sourcePosition:number;url:string;file:string;sha256:string;width:number;height:number};references:Array<Choice&{file:string}>};
type Mapped=Parameters<typeof mapShopifyProduct>[0];
type AdminNode=Omit<Mapped,'variants'|'priceRange'> & {status:string;publishedAt:string|null;hold:{value:string}|null;resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};variants:{edges:Array<{node:Omit<Mapped['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
const query=`query MahdyIrisPilot($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;
function oneCall(calls:number){if(calls!==0)throw Error('Retry/fallback forbidden');}
it('limits pilots to one fixed iris family and one attempt each',()=>{
 expect(new Set(pilots.map(p=>p.id)).size).toBe(1);expect(()=>oneCall(0)).not.toThrow();expect(()=>oneCall(1)).toThrow();
});
for(const p of pilots)it.skipIf(process.env.DOLLVUE_MAHDY_IRIS_PILOT!==p.key)(`runs one private ${p.key} iris pilot`,async()=>{
 const parsed=[];
 for(const [file,pin] of bindings){const b=await fs.readFile(path.join(root,file));expect(sha(b)).toBe(pin);parsed.push(JSON.parse(b.toString()));}
 const [manifest,review,pilot]=parsed;
 expect(review).toMatchObject({frozen:true,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false,validatedByProviderPilot:false});
 expect(pilot).toMatchObject({frozen:true,productId:p.id,fingerprint:review.fingerprint,ownerReviewed:false,state:'PREPARED_NOT_EXECUTED'});
 const r:Row=manifest.rows.find((r:Row)=>r.id===p.id);expect(r.index).toBe(p.index);
 const source=r.source;
 expect(review.source).toMatchObject({...source,decision:'approve',originalInspected:true});
 expect(pilot.source).toEqual(review.source);
 expect(source.sha256).toBe(p.source);expect(sha(await fs.readFile(source.file))).toBe(p.source);
 const selected=r.references.find(c=>c.groupId==='eye-color'&&c.optionId===p.option)!;
 expect(pilot.reference).toEqual(review.references.find((c:Choice)=>c.optionId===p.option));
 expect(selected.sha256).toBe(p.reference);
 expect(review.references.map((c:Choice)=>c.optionId)).toEqual(['no-1','no-2','no-3','no-4','no-5','no-6']);
 for(const ref of review.references){expect(ref.decision).toBe('approve-iris-color-texture-only');expect(sha(await fs.readFile(ref.file))).toBe(ref.sha256);expect(r.references).toContainEqual(expect.objectContaining({groupId:ref.groupId,optionId:ref.optionId,reference:ref.reference,sha256:ref.sha256}));}
 const choices=[{groupId:'eye-color',optionId:p.option,reference:selected.reference}];
 const allChoices=r.references.map(({groupId,optionId,reference})=>({groupId,optionId,reference}));
 const imageDigests=Object.fromEntries([[source.url,p.source],...r.references.map(c=>[c.reference,c.sha256])]);
 const record:DollVueReadinessRecord={productId:p.id,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:r.fingerprint,sourcePositions:[0],choices:allChoices,imageDigests};
 expect(pilot.routeRequest).toEqual({productHandle:r.handle,sourcePosition:0,selections:[{groupId:'eye-color',optionId:p.option}]});
 const output=path.join(root,'pilot-'+p.key);await fs.mkdir(output,{recursive:true,mode:0o700});
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 expect(await fs.stat(path.join(output,'reservation.json')).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})).toBe(false);
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 expect(env.DOLLVUE_ENABLED).toBe('true');expect(env.VENICE_API_KEY).toBeTruthy();
 const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registrySnapshot=JSON.parse(registryBytes.toString()),registryBefore=sha(registryBytes);
 expect(registrySnapshot[p.id]).toBeUndefined();
 await save('authorization.json',{reviewer:'assistant',authorizationReportedBy:'parent-assistant',ownerReviewed:false,humanApproval:false,sourceNativeReviewed:true,referenceNativeReviewed:true,maxProviderCalls:1,noRetries:true,productId:p.id,index:p.index,sourcePosition:0,choices,imageDigests,bindings,inputApprovalOnly:true,pilotInputSha256:bindings[2][1],noFallback:true,scope:'Parent-assistant directly inspected exact source and No.4 reference; authorized ONE private actual-runtime iris-only pilot. No catalog or public activation approval; output review pending.'});
 const result:Record<string,unknown>={productId:p.id,index:p.index,choices,imageDigests,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false,parentInspection:'pending',registryWritten:false,catalogChanged:false,customerMailSent:false};
 const request=(route:string)=>new Request(`${origin}/dollvue/${route}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body:JSON.stringify({productHandle:r.handle,sourcePosition:0,selections:choices.map(({groupId,optionId})=>({groupId,optionId}))})});
 const nativeFetch=globalThis.fetch;let calls=0;let expectedImages:string[]=[];let pricesVerified=false;let initialProduct:Product|null=null;state.mailCalls=0;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.href==='https://api.venice.ai/api/v1/image/multi-edit'){
   oneCall(calls);expect(pricesVerified).toBe(true);expect(state.armed).toBe(true);expect(method).toBe('POST');const body=JSON.parse(String(init?.body));
   expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toEqual(expectedImages);expect(body.images).toHaveLength(2);
   expect(body.prompt).toContain('Transfer only the visible iris color only');expect(body.prompt).not.toMatch(/Transfer only (?!the visible iris color only)/);
   for(const [file,pin] of bindings)expect(sha(await fs.readFile(path.join(root,file)))).toBe(pin);
   await current('reservation');
   const hashes=body.images.map((s:string)=>sha(Buffer.from(s.split(',')[1],'base64')));
   await save('reservation.json',{reservedAt:new Date().toISOString(),maxProviderCalls:1,requestSha256:sha(Buffer.from(String(init?.body))),hashes});calls++;
   await save('request.json',{...body,images:undefined,imageHashes:hashes});
   const response=await nativeFetch(input,{...init,redirect:'error'});result.providerStatus=response.status;return response;
  }
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);if(body.variables.ids)expect(body.variables.ids).toEqual([p.id]);else if(body.variables.id)expect(body.variables.id).toBe(p.id);else expect(body.variables.handle).toBe(r.handle);}
  else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect([source.url,new URL(selected.reference,origin).href]).toContain(u.href);}
  return nativeFetch(input,{...init,redirect:'error'});
 });
 async function current(stage:string){
  const response=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids:[p.id]});expect(response.nodes).toHaveLength(1);const n=response.nodes[0];
  expect(n.id).toBe(p.id);expect(n.handle).toBe(r.handle);expect(n.status).toBe('DRAFT');expect(n.publishedAt).toBeNull();expect(Object.hasOwn(n,'hold')).toBe(true);expect(n.hold===null||typeof n.hold?.value==='string').toBe(true);expect(n.hold?.value.trim()||'').toBe('');
  expect(n.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(n.resourcePublications.nodes.some(v=>v.isPublished)).toBe(false);
  const variants={edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:response.shop.currencyCode}}}))};
  const product=mapShopifyProduct({...n,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}});
  expect(product.extended.brand).toBe(r.brand);expect(isDollVueExcluded(product)).toBe(false);
  expect(product.tags.filter(t=>t!=='catalog-review-hold').some(t=>/hold|excluded|not-for-launch|youth|minor|teen/i.test(t))).toBe(false);
  const config=dollVueConfigForProduct(product,getCustomizationConfig(product));expect(dollVueReadinessFingerprint(product,config)).toBe(r.fingerprint);
  expect(productImageSources(product)[0]).toMatchObject({url:source.url,width:source.width,height:source.height});if(initialProduct)expect(product).toEqual(initialProduct);expect((await getCurrentDollVueHolds([p.id])).get(p.id)).toBe('clear');
  expect(config.groups.find(g=>g.id==='eye-color')?.options.find(o=>o.id===p.option)?.swatch?.value).toBe(selected.reference);
  expect(evaluateDollVueReadiness(product,config,record,{published:false,privateReview:true,contentExcluded:false})).toMatchObject({ready:true,publiclyAvailable:false,privatelyAvailable:true});
  for(const c of r.references)expect(config.groups.find(g=>g.id===c.groupId)?.options.find(o=>o.id===c.optionId)).toMatchObject({label:c.label,swatch:{kind:'image',value:c.reference}});
  const images=[await normalizeReviewedImage({url:source.url,sha256:p.source,origin}),await normalizeReviewedImage({url:selected.reference,sha256:p.reference,origin,optionReference:true})];
  if(expectedImages.length)expect(images).toEqual(expectedImages);
  await save(stage+'-current.json',{checkedAt:new Date().toISOString(),id:p.id,status:'DRAFT',publishedAt:null,allPublicationsUnpublished:true,hold:'clear',fingerprint:r.fingerprint,imageDigests,normalizedHashes:images.map(s=>sha(Buffer.from(s.split(',')[1],'base64')))});
  return {product,images};
 }
 async function publicReject(){expect(state.armed).toBe(false);expect(await getProductByHandle(r.handle,{strict:true,cache:'no-store'})).toBeNull();expect((await generate(request('generate'))).status).toBe(404);expect((await cart(request('cart'))).status).toBe(404);}
 let caught:unknown;
 try{
  const before=await current('before');initialProduct=before.product;expectedImages=before.images;await publicReject();result.publicRejectedBefore=true;
  state.product=before.product;state.registry[p.id]=record;state.armed=true;
  const product=before.product,base=getCustomizationConfig(product),snapshot=JSON.stringify(base),config=dollVueConfigForProduct(product,base);
  const ready=evaluateDollVueReadiness(product,config,record,{published:false,privateReview:true,contentExcluded:false});
  const menu=reviewedDollVueConfig(config,ready,'private'),now=new Date(),variant=product.variants.find(v=>v.availableForSale)!;expect(variant).toBeDefined();
  const checks=[];
  for(const choice of [null,...allChoices]){
   const initial=promotionPricingForSelections(product,menu,{},now).config,selections=getDefaultSelections(initial);
   if(choice)selections[choice.groupId]=choice.optionId;
   const native=resolveCustomization(promotionPricingForSelections(product,base,selections,now).config,selections,Number(variant.price.amount));
   const preview=resolveCustomization(promotionPricingForSelections(product,menu,selections,now).config,selections,Number(variant.price.amount));
   expect(native.issues).toEqual([]);expect(native.requiresPriceConfirmation).toBe(false);expect(Number.isFinite(native.totalPrice)).toBe(true);
   expect(preview.issues).toEqual([]);expect(preview.totalPrice).toBe(native.totalPrice);expect(preview.cartAttributes).toEqual(native.cartAttributes);expect(preview.selections).toEqual(native.selections);
   if(choice){
    expect(native.selections[choice.groupId]).toBe(choice.optionId);
    const response=await cart(new Request(origin+'/dollvue/cart',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({productHandle:r.handle,selections:[{groupId:choice.groupId,optionId:choice.optionId}]})})),payload=await response.json();
    expect(response.status,JSON.stringify(payload)).toBe(200);expect(payload.item).toMatchObject({merchandiseId:variant.id,unitPrice:native.totalPrice,currencyCode:variant.price.currencyCode,selections:native.selections});
    expect(payload.item.attributes.filter((a:{key:string})=>a.key!=='DollWow Reference Name')).toEqual(native.cartAttributes);
   }
   checks.push({choice,native,preview});
  }
  expect(JSON.stringify(base)).toBe(snapshot);await save('native-price-checks.json',{checkedAt:new Date().toISOString(),defaultChecks:1,choiceChecks:6,cartChecks:6,checks,catalogMenuUnchanged:true});pricesVerified=true;result.nativePricesVerifiedBeforeGeneration=true;
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
