import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import type {Product} from '@/types/product';
import type {DollVueReadinessRecord} from '@/lib/dollvue/readiness';
const state=vi.hoisted(()=>({product:null as Product|null,registry:{} as Record<string,DollVueReadinessRecord>}));
vi.mock('@/lib/dollvue/readiness-registry.json',()=>({default:state.registry}));
vi.mock('@/lib/shopify/storefront',async original=>{
 const actual=await original<typeof import('@/lib/shopify/storefront')>();
 return {...actual,getProductByHandle:(...args:Parameters<typeof actual.getProductByHandle>)=>{
  if(state.product){expect(args[0]).toBe(state.product.handle);expect(args[1]?.strict).toBe(true);return Promise.resolve(state.product);}
  return actual.getProductByHandle(...args);
 }};
});
import {POST as cart} from '@/app/dollvue/cart/route';
import {getProductByHandle} from '@/lib/shopify/storefront';
import {adminFetch} from '@/lib/shopify/admin';
import {storefrontAuthHeaders} from '@/lib/shopify/auth';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {getCurrentDollVueHolds} from '@/lib/dollvue/currentHold';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {promotionPricingForSelections} from '@/lib/promotions/optionPricing';
import {dollVueConfigForProduct,areDollVueSelectionsValid} from '@/lib/dollvue/config';
import {isDollVueExcluded,resolveDollVueEligibility} from '@/lib/dollvue/eligibility';
import {classifyAppearance,DOLLVUE_APPEARANCE_POLICY} from '@/lib/dollvue/appearance';
import {dollVueReadinessFingerprint,evaluateDollVueReadiness,reviewedDollVueConfig} from '@/lib/dollvue/readiness';
import {productImageSources} from '@/lib/catalog/productImage';
import {normalizeReviewedImage} from '@/lib/dollvue/reviewedImages';
import {env,hasShopifyStorefrontEnv} from '@/lib/utils/env';
type Mapped=Parameters<typeof mapShopifyProduct>[0];
type AdminNode=Omit<Mapped,'variants'|'priceRange'> & {status:string;publishedAt:string|null;hold:{value:string}|null;resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};variants:{edges:Array<{node:Omit<Mapped['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
const query=`query ClosingFourteenReadiness($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;


const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/closing-fourteen-source-preparation';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const indices=[11];
type Choice={groupId:string;optionId:string;reference:string};
type Source={url:string;file:string;sha256:string;byteLength:number;decodedWidth:number;decodedHeight:number;sourcePosition:number};
type Row={index:number;id:string;currentHandle:string;brand:string;status:string;fingerprint:string;catalogIdentityKey:string;catalogBodyIdentityKey:string;choices:Array<Choice&{label:string;visibleWhen:unknown[]}>;sources:Source[]};
type Decision={index:number;id:string;handle:string;sourcePosition:number;source:Source;decision:string;reviewer:string;ownerReviewed:boolean;humanApproval:boolean;originalInspected:boolean};
function unchanged(before:Record<string,unknown>,after:Record<string,unknown>,ids:string[]){
 for(const [id,entry] of Object.entries(before))expect(after[id],id).toEqual(entry);
 for(const id of ids)expect(after[id],'Already registered '+id).toBeUndefined();
}
function assertPublic(n:AdminNode,sf:{id:string;handle:string}|null){
 expect(n.status).toBe('ACTIVE');expect(typeof n.publishedAt).toBe('string');expect(n.publishedAt).toBeTruthy();
 expect(n.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(n.resourcePublications.nodes.some(p=>p.isPublished)).toBe(true);
 expect(Object.hasOwn(n,'hold')).toBe(true);expect(n.hold===null||typeof n.hold?.value==='string').toBe(true);expect(n.hold?.value.trim()||'').toBe('');
 expect(sf).toEqual({id:n.id,handle:n.handle});
}
function approved(rows:Row[],decisions:Decision[]){
 expect(new Set(decisions.map(r=>r.id)).size).toBe(rows.length);
 expect(decisions.map(r=>r.id).sort()).toEqual(rows.map(r=>r.id).sort());
 for(const r of rows){
  const d=decisions.find(d=>d.id===r.id)!;
  expect(d).toMatchObject({index:r.index,handle:r.currentHandle,sourcePosition:r.sources[0].sourcePosition,source:r.sources[0],reviewer:'native-assistant',ownerReviewed:false,humanApproval:false});
  expect(Number.isInteger(d.sourcePosition)&&d.sourcePosition>=0&&d.sourcePosition<=7).toBe(true);
  expect(['approve','needsAlternative','needsAdultPresentationClarity']).toContain(d.decision);
  if(d.decision==='approve')expect(d.originalInspected).toBe(true);
 }
 return rows.filter(r=>indices.includes(r.index)&&decisions.find(d=>d.id===r.id)!.decision==='approve');
}
function family(index:number,registry:Record<string,DollVueReadinessRecord>){
 expect(indices).toContain(index);
 const seedId='gid://shopify/Product/10433997373624',seed=registry[seedId];
 expect(seed.status).toBe('ready');expect(seed.policy).toBe(DOLLVUE_APPEARANCE_POLICY);
 const groupId='eye-color',optionIds=['blue','brown','green'];
 const choices=seed.choices!.filter(c=>c.groupId===groupId&&optionIds.includes(c.optionId));
 expect(choices.map(c=>c.optionId)).toEqual(optionIds);
 for(const c of choices)expect(c.reference).toBe('/option-assets/'+seed.imageDigests![c.reference]+'.webp');
 return {seedId,groupId,choices,imageDigests:seed.imageDigests!};
}
function exactReviewedSubset(actual:Choice[],reviewed:Choice[]){
 const selected=actual.filter(c=>reviewed.some(r=>r.groupId===c.groupId&&r.optionId===c.optionId));
 expect(selected).toEqual(reviewed);
 return selected;
}
it('keeps additional unreviewed menu choices outside the exact iris3 subset',()=>{
 const c={groupId:'eye-color',optionId:'no-1',reference:'pinned'};
 expect(exactReviewedSubset([{...c,optionId:'brown',reference:'unreviewed'},c],[c])).toEqual([c]);
 expect(()=>exactReviewedSubset([{...c,reference:'changed'}],[c])).toThrow();
 expect(()=>exactReviewedSubset([],[c])).toThrow();
 expect(()=>exactReviewedSubset([c,c],[c])).toThrow();
});
it('requires current publication, explicit clear hold and matching Storefront identity',()=>{
 const n={id:'a',handle:'h',status:'ACTIVE',publishedAt:'2026-01-01',hold:null,resourcePublications:{nodes:[{isPublished:true}],pageInfo:{hasNextPage:false}}} as unknown as AdminNode;
 expect(()=>assertPublic(n,{id:'a',handle:'h'})).not.toThrow();
 for(const bad of [{...n,status:'DRAFT'},{...n,publishedAt:null},{...n,hold:undefined},{...n,hold:{value:'held'}},{...n,resourcePublications:{nodes:[],pageInfo:{hasNextPage:false}}}])expect(()=>assertPublic(bad as AdminNode,{id:'a',handle:'h'})).toThrow();
 expect(()=>assertPublic(n,null)).toThrow();expect(()=>assertPublic(n,{id:'b',handle:'h'})).toThrow();
});
it('allows unrelated registry additions but never changed previous records or overlap',()=>{
 expect(()=>unchanged({a:1},{a:1,b:2},['c'])).not.toThrow();
 expect(()=>unchanged({a:1},{a:2},['c'])).toThrow();
 expect(()=>unchanged({a:1},{a:1,c:2},['c'])).toThrow();
});
it('rejects missing, duplicate, unapproved and changed source bindings',()=>{
 const s={url:'u',file:'f',sha256:'s',sourcePosition:7},r={id:'a',index:11,currentHandle:'h',sources:[s]} as Row;
 const d={id:'a',index:11,handle:'h',sourcePosition:7,source:s,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false,originalInspected:true,decision:'approve'} as Decision;
 expect(approved([r],[d])).toHaveLength(1);
 for(const bad of [[],[d,d],[{...d,source:{...s,sha256:'wrong'}}],[{...d,originalInspected:false}],[{...d,sourcePosition:0}],[{...d,sourcePosition:8,source:{...s,sourcePosition:8}}]])expect(()=>approved([r],bad as Decision[])).toThrow();
 expect(approved([r],[{...d,decision:'needsAlternative'}])).toHaveLength(0);
});
it('does not infer a family from a matching label or missing digest',()=>{
 const choices=['blue','brown','green'].map((optionId,i)=>({groupId:'eye-color',optionId,reference:'/option-assets/'+String(i).padStart(64,'0')+'.webp'}));
 const imageDigests=Object.fromEntries(choices.map(c=>[c.reference,c.reference.slice(15,-5)]));
 const record={status:'ready',policy:DOLLVUE_APPEARANCE_POLICY,choices,imageDigests} as DollVueReadinessRecord;
 const id='gid://shopify/Product/10433997373624';
 expect(()=>family(11,{[id]:record})).not.toThrow();
 expect(()=>family(11,{[id]:{...record,imageDigests:{}}})).toThrow();
 expect(()=>family(11,{[id]:{...record,choices:choices.slice(1)}})).toThrow();
});
it.skipIf(process.env.DOLLVUE_CLOSING_FOURTEEN_READINESS!=='1')('finalizes only the source-approved HR iris3 subset without generation or legacy changes',async()=>{
 const registryFile='lib/dollvue/readiness-registry.json',registryBytes=await fs.readFile(registryFile),registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
 const inputs:Array<{file:string;sha256:string}>=[];
 async function evidence(file:string,expected:string){
  const real=await fs.realpath(file);expect(real.startsWith(root+path.sep)).toBe(true);const bytes=await fs.readFile(real);expect(sha(bytes)).toBe(expected);inputs.push({file:real,sha256:expected});return bytes;
 }
 const manifest=JSON.parse((await evidence(root+'/candidate-manifest.json','379b404a4f56e146b7d6f9a7408410c7c85b4fbd7fe455dfc29a54cc8133551e')).toString());
 const review=JSON.parse((await evidence(root+'/source-review-1-14.frozen.json','67e2f81c836511f87c932bed5f8ef16216ebb4f7047fa878e4f7ba00bcbe2d8b')).toString());
 expect(manifest.rows).toHaveLength(14);expect(review).toMatchObject({frozen:true,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false});
 const preparedRows=manifest.rows.map((r:{source:Source&{width:number;height:number};handle:string})=>({...r,currentHandle:r.handle,sources:[{...r.source,decodedWidth:r.source.width,decodedHeight:r.source.height}]}));
 const rows=approved(preparedRows,review.rows);expect(rows.map(r=>r.index)).toEqual(indices);
 const ids=rows.map(r=>r.id),families=new Map(rows.map(r=>[r.id,family(r.index,registry)]));unchanged(registry,registry,ids);
 const output=root+'/reviewed-hr-iris3-1-record-proposal.json';
 expect(await fs.stat(output).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})).toBe(false);
 expect(hasShopifyStorefrontEnv()).toBe(true);
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const allowedImages=new Set(rows.flatMap(r=>[r.sources[0].url,...families.get(r.id)!.choices.map(c=>new URL(c.reference,origin).href)]));
 const counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
 const native=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   if(body.variables.ids){expect(body.variables.ids.length).toBeLessThanOrEqual(50);expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);}
   else if(body.variables.id)expect(ids).toContain(body.variables.id);
   else expect(rows.some(r=>r.currentHandle===body.variables.handle)).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect(allowedImages.has(u.href)).toBe(true);counts.imageReads++;}
  return native(input,{...init,redirect:'error'});
 });
 try{
  async function current(){
   const startedAt=new Date().toISOString(),a=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids});
   expect(a.nodes.map(n=>n.id)).toEqual(ids);
   const res=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},signal:AbortSignal.timeout(60000),body:JSON.stringify({query:'query IrontechPublication($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle}}}',variables:{ids}})});
   expect(res.ok).toBe(true);const sf=await res.json();expect(sf.errors).toBeUndefined();expect(sf.data.nodes).toHaveLength(ids.length);
   const holds=await getCurrentDollVueHolds(ids);expect(ids.map(id=>holds.get(id))).toEqual(ids.map(()=>'clear'));
   const nodes=new Map<string,{node:AdminNode;product:Product;storefrontProduct:Product}>();
   for(let i=0;i<a.nodes.length;i++){
    const node=a.nodes[i];assertPublic(node,sf.data.nodes[i]);
    const variants={edges:node.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:a.shop.currencyCode}}}))};
    const product=mapShopifyProduct({...node,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}});
    const storefrontProduct=await getProductByHandle(node.handle,{strict:true,cache:'no-store'});expect(storefrontProduct?.id).toBe(node.id);
    nodes.set(node.id,{node,product,storefrontProduct:storefrontProduct!});
   }
   return {nodes,startedAt,checkedAt:new Date().toISOString()};
  }
  const before=await current(),records:Record<string,DollVueReadinessRecord>={},verification:unknown[]=[],verified=new Map<string,string>();
  async function image(url:string,pin:string,optionReference=false){if(verified.has(url)){expect(verified.get(url)).toBe(pin);return;}await normalizeReviewedImage({url,sha256:pin,origin,optionReference});verified.set(url,pin);}
  let singles=0,cartChecks=0;
  for(const row of rows){
   const {node,product,storefrontProduct}=before.nodes.get(row.id)!,f=families.get(row.id)!;
   expect(node.status).toBe(row.status);expect(product.handle).toBe(row.currentHandle);expect(product.extended.brand).toBe(row.brand);
   expect(row.brand).toBe('HR Doll');
   expect(product.extended.stockStatus).toBe('custom');expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);
   expect([product.productType,...product.tags.filter(t=>t!=='catalog-review-hold')].join(' ')).not.toMatch(/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded|youth|minor|teen/i);
   expect(isDollVueExcluded(product)).toBe(false);
   expect(node.catalogIdentityKey?.value).toBe(row.catalogIdentityKey);expect(node.catalogBodyIdentityKey?.value).toBe(row.catalogBodyIdentityKey);
   const s=row.sources[0];expect((await evidence(s.file,s.sha256)).length).toBe(s.byteLength);
   for(const p of [product,storefrontProduct]){
    const source=productImageSources(p)[s.sourcePosition];expect([source.url,source.width,source.height]).toEqual([s.url,s.decodedWidth,s.decodedHeight]);
    expect(dollVueReadinessFingerprint(p,dollVueConfigForProduct(p,getCustomizationConfig(p)))).toBe(row.fingerprint);
   }
   await image(s.url,s.sha256);
   const legacyBefore=resolveDollVueEligibility(storefrontProduct);
   const legacyChoices=legacyBefore.available?legacyBefore.config.groups.flatMap(g=>g.options.filter(o=>o.dollVueEnabled).map(o=>({groupId:g.id,optionId:o.id}))):[];
   for(const c of legacyChoices)expect(f.choices.some(x=>x.groupId===c.groupId&&x.optionId===c.optionId),'Legacy choice must not be removed').toBe(true);
   const base=getCustomizationConfig(storefrontProduct),baseSnapshot=JSON.stringify(base),config=dollVueConfigForProduct(storefrontProduct,base),group=config.groups.find(g=>g.id===f.groupId)!;
   expect(group.visibleWhen).toBeUndefined();
   const frozen=row.choices.filter(c=>c.groupId===f.groupId);
   const actual=group.options.filter(o=>classifyAppearance(group,o).status==='candidate'&&o.swatch?.kind==='image').map(o=>({groupId:group.id,optionId:o.id,label:o.label,reference:o.swatch!.value}));
   expect(actual).toEqual(frozen.map(({visibleWhen,...c})=>c));
   exactReviewedSubset(actual.map(({label,...c})=>c),f.choices);
   const imageDigests:Record<string,string>={[s.url]:s.sha256};
   for(const c of f.choices){const digest=f.imageDigests[c.reference];expect(digest).toMatch(/^[a-f0-9]{64}$/);await image(c.reference,digest,true);imageDigests[c.reference]=digest;}
   const record:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:row.fingerprint,sourcePositions:[s.sourcePosition],choices:f.choices,imageDigests};
   const ready=evaluateDollVueReadiness(storefrontProduct,config,record,{published:true,contentExcluded:false});
   expect(ready).toMatchObject({ready:true,publiclyAvailable:true});
   const menu=reviewedDollVueConfig(config,ready,'public');expect(menu.groups.filter(g=>g.options.some(o=>o.dollVueEnabled)).map(g=>g.id)).toEqual([f.groupId]);
   expect(menu.groups.flatMap(g=>g.options.filter(o=>o.dollVueEnabled).map(o=>({groupId:g.id,optionId:o.id,reference:o.swatch!.value})))).toEqual(f.choices);
   const now=new Date(),variant=storefrontProduct.variants.find(v=>v.availableForSale)!;expect(variant).toBeDefined();
   function resolve(choice?:Choice){
    const initial=promotionPricingForSelections(storefrontProduct,menu,{},now).config,selections=getDefaultSelections(initial);
    if(choice){expect(areDollVueSelectionsValid(initial,[choice])).toBe(true);selections[choice.groupId]=choice.optionId;}
    const priced=promotionPricingForSelections(storefrontProduct,menu,selections,now).config,result=resolveCustomization(priced,selections,Number(variant.price.amount));
    expect(result.issues).toEqual([]);expect(result.requiresPriceConfirmation).toBe(false);expect(Number.isFinite(result.totalPrice)).toBe(true);
    const ordinary=resolveCustomization(promotionPricingForSelections(storefrontProduct,base,selections,now).config,selections,Number(variant.price.amount));
    expect(result.totalPrice).toBe(ordinary.totalPrice);expect(result.cartAttributes).toEqual(ordinary.cartAttributes);expect(result.selections).toEqual(ordinary.selections);
    if(choice){expect(result.selections[choice.groupId]).toBe(choice.optionId);expect(result.selectedOptions.some(o=>o.groupId===choice.groupId&&o.optionId===choice.optionId)).toBe(true);}
    return result;
   }
   const defaults=resolve(),localChoices=f.choices.map(choice=>({choice,result:resolve(choice)}));singles+=localChoices.length;
   state.product=storefrontProduct;state.registry[row.id]=record;
   try{for(const {choice,result} of localChoices){
    const response=await cart(new Request(origin+'/dollvue/cart',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({productHandle:row.currentHandle,selections:[{groupId:choice.groupId,optionId:choice.optionId}]})})),payload=await response.json();
    expect(response.status,JSON.stringify(payload)).toBe(200);
    expect(payload.item).toMatchObject({merchandiseId:variant.id,productHandle:row.currentHandle,unitPrice:result.totalPrice,currencyCode:variant.price.currencyCode,selections:result.selections});
    expect(payload.item.attributes.filter((a:{key:string})=>a.key!=='DollWow Reference Name')).toEqual(result.cartAttributes);
    if(result.optionPriceDelta===0)expect(payload.item.customizationCharge).toBeUndefined();else expect(payload.item.customizationCharge).toMatchObject({amount:result.optionPriceDelta,currencyCode:variant.price.currencyCode});
    cartChecks++;
   }}finally{state.product=null;delete state.registry[row.id];}
   expect(JSON.stringify(base)).toBe(baseSnapshot);
   records[row.id]=record;verification.push({id:row.id,index:row.index,handle:row.currentHandle,brand:row.brand,currentHold:'clear',status:node.status,publishedAt:node.publishedAt,strictStorefrontIdentity:true,seedRecordId:f.seedId,reusedGroup:f.groupId,source:s,ownerReviewed:false,humanApproval:false,legacyAvailableBefore:legacyBefore.available,legacyChoicesPreserved:true,defaults,localChoices,catalogMenuAndPricesUnchanged:true});
   console.info(JSON.stringify({validated:verification.length,total:rows.length,index:row.index}));
  }
  const after=await current();for(const id of ids){expect(after.nodes.get(id)!.node).toEqual(before.nodes.get(id)!.node);expect(after.nodes.get(id)!.storefrontProduct).toEqual(before.nodes.get(id)!.storefrontProduct);}
  for(const input of inputs)expect(sha(await fs.readFile(input.file))).toBe(input.sha256);
  const endBytes=await fs.readFile(registryFile),end=JSON.parse(endBytes.toString());unchanged(registry,end,ids);
  const proposal={checkedAt:new Date().toISOString(),privateProposalOnly:true,ownerReviewed:false,humanApproval:false,reviewer:'native-assistant',records,verification,sourceApprovedReferenceGaps:review.rows.filter((r:Decision)=>r.decision==='approve'&&!indices.includes(r.index)),sourceExclusions:review.rows.filter((r:Decision)=>r.decision!=='approve'),sourceReview:inputs[1],evidence:{inputs,familySeeds:[...new Set([...families.values()].map(f=>f.seedId))].map(id=>({id,record:registry[id]})),registryInputCount:Object.keys(registry).length,registryInputSha256:sha(registryBytes),registryEndCount:Object.keys(end).length,registryEndSha256:sha(endBytes),preexistingRegistryUnchanged:true,unrelatedRegistryAdditions:Object.keys(end).filter(id=>!Object.hasOwn(registry,id)),firstCurrentCheck:{startedAt:before.startedAt,checkedAt:before.checkedAt},lastCurrentCheck:{startedAt:after.startedAt,checkedAt:after.checkedAt},currentPublicationIdentityHoldsUnchanged:true},summary:{readyRecords:rows.length,eyeOnlyRecords:rows.length,defaultChecks:rows.length,choiceChecks:singles,routeCartChecksWithPrivateRegistryFixture:cartChecks,verifiedUniqueImages:verified.size,...counts},registryChangedByTask:false,publicationChanged:false};
  const bytes=Buffer.from(JSON.stringify(proposal,null,2)+'\n');await fs.writeFile(output,bytes,{flag:'wx',mode:0o600});console.info(JSON.stringify({proposal:output,sha256:sha(bytes),...proposal.summary,registryInputCount:Object.keys(registry).length,registryEndCount:Object.keys(end).length}));
 }finally{state.product=null;state.registry={};vi.unstubAllGlobals();}
},30*60*1000);
