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
import {isDollVueExcluded} from '@/lib/dollvue/eligibility';
import {classifyAppearance,DOLLVUE_APPEARANCE_POLICY} from '@/lib/dollvue/appearance';
import {dollVueReadinessFingerprint,evaluateDollVueReadiness,reviewedDollVueConfig} from '@/lib/dollvue/readiness';
import {productImageSources} from '@/lib/catalog/productImage';
import {normalizeReviewedImage} from '@/lib/dollvue/reviewedImages';
import {env,hasShopifyStorefrontEnv} from '@/lib/utils/env';
type Mapped=Parameters<typeof mapShopifyProduct>[0];
type AdminNode=Omit<Mapped,'variants'|'priceRange'> & {status:string;publishedAt:string|null;hold:{value:string}|null;resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};variants:{edges:Array<{node:Omit<Mapped['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
const query=`query AliasReuseReadiness($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;


const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/wm-yl-angelkiss-alias-reconciliation/seven-gap-preparation';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const indices=[5,35,42,48,50,51,52];
type Binding={file:string;sha256:string};
type Choice={groupId:string;optionId:string;reference:string};
type Source=Binding&{url:string;sourcePosition:number;byteLength:number;decodedWidth:number;decodedHeight:number};
type Row={index:number;id:string;handle:string;status:string;fingerprint:string;source:Source;sourceReview:Binding&{decision:string;reviewer:string;ownerReviewed:boolean};choices:Array<Choice&{label:string;visibleWhen:unknown[]}>};
type Reference=Binding&{url:string;nativeVisualMeaning:string;uses:Array<{index:number;groupId:string;optionId:string;label:string}>;reviewer:string;ownerReviewed:boolean;nonExplicitReference:boolean};
function unchanged(before:Record<string,unknown>,after:Record<string,unknown>,ids:string[]){
 for(const [id,entry] of Object.entries(before))expect(after[id],id).toEqual(entry);
 for(const id of ids)expect(after[id],'Candidate already registered '+id).toBeUndefined();
}
function attribution(review:{reviewer:string;reportedVia:string;ownerReviewed:boolean;humanApproval:boolean;verdict:string;frozen:boolean}){
 expect(review).toMatchObject({frozen:true,reviewer:'parent-assistant',reportedVia:'parent-assistant-message',ownerReviewed:false,humanApproval:false,verdict:'PASS_MINOR_VARIATION_ACCEPTED'});
}
it('requires parent-assistant pilot-only attribution, never owner approval',()=>{
 const r={frozen:true,reviewer:'parent-assistant',reportedVia:'parent-assistant-message',ownerReviewed:false,humanApproval:false,verdict:'PASS_MINOR_VARIATION_ACCEPTED'};
 expect(()=>attribution(r)).not.toThrow();
 for(const bad of [{ownerReviewed:true},{humanApproval:true},{reportedVia:'user message'},{verdict:'PENDING'}])expect(()=>attribution({...r,...bad})).toThrow();
});
it('allows unrelated additions but rejects changed baseline or candidate overlap',()=>{
 expect(()=>unchanged({a:1},{a:1,b:2},['c'])).not.toThrow();
 expect(()=>unchanged({a:1},{a:2},['c'])).toThrow();expect(()=>unchanged({a:1},{a:1,c:2},['c'])).toThrow();
});
it.skipIf(process.env.DOLLVUE_ALIAS_SEVEN_FINALIZE!=='1')('finalizes exactly seven reviewed alias records with fresh bytes and runtime checks, no generation',async()=>{
 const output=root+'/ready-seven-proposal.json';
 expect(await fs.stat(output).then(()=>true,()=>false)).toBe(false);
 const inputs:Binding[]=[];
 async function evidence(file:string,expected:string){
  const real=await fs.realpath(file);expect(real.startsWith(path.dirname(root)+path.sep)).toBe(true);
  const bytes=await fs.readFile(real);expect(sha(bytes)).toBe(expected);
  if(!inputs.some(i=>i.file===real))inputs.push({file:real,sha256:expected});
  return bytes;
 }
 const report=JSON.parse((await evidence(root+'/current-seven.json','4381b49eae78355a247954a06cb9994f8adc0416169d8c13a0c343df4f7068ea')).toString()) as {rows:Row[];inputs:Binding[]};
 const observations=JSON.parse((await evidence(root+'/native-reference-observations.frozen.json','fc10c5e64cefb1dcdfc2a69ae47449e069953dfc067408545ddcea963fb59563')).toString()) as {references:Reference[];reviewer:string;ownerReviewed:boolean;frozen:boolean};
 expect(observations).toMatchObject({frozen:true,reviewer:'native-assistant',ownerReviewed:false});
 const refs=observations.references;expect(refs).toHaveLength(37);
 for(const ref of refs){expect(ref).toMatchObject({reviewer:'native-assistant',ownerReviewed:false,nonExplicitReference:true});expect(ref.nativeVisualMeaning).toBeTruthy();await evidence(ref.file,ref.sha256);}
 for(const input of report.inputs)await evidence(input.file,input.sha256);
 const pilotReviews=[
  ['angelkiss-hilda','df0d3f086eb6fe04ec69ed719e79e989a6d51193677099fe759a6c3f350687e2'],
  ['wm-sulane','acbeab140bff45c30d81939dbc4c78ccf6d3bde35192b202f3959a8d13993987'],
  ['yl-judy','9e2ebfe38e017b71befcf3ca9c16f8ac627e5518f01bb0c6a9a6eb9344d0cf2c'],
 ] as const;
 for(const [family,digest] of pilotReviews){
  const review=JSON.parse((await evidence(root+'/'+family+'-pilot-one/parent-pilot-only-review.frozen.json',digest)).toString());attribution(review);
  for(const input of review.inputs)await evidence(input.file,input.sha256);
  const result=JSON.parse(await fs.readFile(root+'/'+family+'-pilot-one/result.json','utf8'));
  expect(result).toMatchObject({generationSuccessful:true,postflightPassed:true,providerCalls:1,routeStatus:200,providerStatus:200,registryWritten:false,publicationChanged:false,customerMailSent:false});
 }
 const rows=report.rows;expect(rows.map(r=>r.index)).toEqual(indices);const ids=rows.map(r=>r.id);
 for(const row of rows){expect(row.sourceReview).toMatchObject({decision:'approve',reviewer:'native-assistant',ownerReviewed:false});await evidence(row.sourceReview.file,row.sourceReview.sha256);await evidence(row.source.file,row.source.sha256);}
 const registryFile='lib/dollvue/readiness-registry.json',registryBytes=await fs.readFile(registryFile),registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
 unchanged(registry,registry,ids);
 const runtimeFiles=['lib/dollvue/readiness.ts','lib/dollvue/config.ts','lib/dollvue/eligibility.ts','lib/dollvue/reviewedImages.ts','lib/customization/configs.ts','lib/customization/resolve.ts','lib/customization/visibility.ts','app/dollvue/cart/route.ts'];
 const runtimeInputs=await Promise.all(runtimeFiles.map(async file=>({file,sha256:sha(await fs.readFile(file))})));
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toBe('https://dollwow.com');expect(hasShopifyStorefrontEnv()).toBe(true);
 const draft=rows.find(r=>r.status==='DRAFT')!;expect(draft.index).toBe(5);
 const public404Urls=[origin+'/dollvue/'+draft.handle,origin+'/products/'+draft.handle];
 const imageUrls=new Set([...rows.map(r=>r.source.url),...refs.map(r=>new URL(r.url,origin).href)]);
 const native=globalThis.fetch,counts={adminReads:0,storefrontReads:0,imageReads:0,public404Reads:0,generationCalls:0,shopifyWrites:0};
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   if(body.variables.ids){expect(body.variables.ids.length).toBeLessThanOrEqual(7);expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);}
   else if(body.variables.id)expect(ids).toContain(body.variables.id);
   else expect(rows.some(r=>r.handle===body.variables.handle)).toBe(true);
   counts[u.pathname.includes('/admin/')?'adminReads':'storefrontReads']++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect(init?.cache).toBe('no-store');if(public404Urls.includes(u.href))counts.public404Reads++;else{expect(imageUrls.has(u.href)).toBe(true);counts.imageReads++;}}
  return native(input,{...init,redirect:'error'});
 });
 try{
  async function current(){
   state.product=null;
   const startedAt=new Date().toISOString(),a=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids});
   expect(a.nodes.map(n=>n.id)).toEqual(ids);
   const res=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},signal:AbortSignal.timeout(60000),body:JSON.stringify({query:'query SevenPublication($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle}}}',variables:{ids}})});
   expect(res.ok).toBe(true);const sf=await res.json();expect(sf.errors).toBeUndefined();expect(sf.data.nodes).toHaveLength(7);
   const holds=await getCurrentDollVueHolds(ids);expect(ids.map(id=>holds.get(id))).toEqual(ids.map(()=>'clear'));
   const nodes=new Map<string,{node:AdminNode;product:Product;storefrontProduct:Product|null}>();
   for(let i=0;i<rows.length;i++){
    const row=rows[i],node=a.nodes[i];expect(node.status).toBe(row.status);expect(node.handle).toBe(row.handle);
    expect(Object.hasOwn(node,'hold')).toBe(true);expect(node.hold?.value.trim()||'').toBe('');
    expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
    if(node.status==='DRAFT'){expect(node.publishedAt).toBeNull();expect(node.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false);expect(sf.data.nodes[i]).toBeNull();}
    else{expect(node.status).toBe('ACTIVE');expect(node.publishedAt).toBeTruthy();expect(node.resourcePublications.nodes.some(p=>p.isPublished)).toBe(true);expect(sf.data.nodes[i]).toEqual({id:node.id,handle:node.handle});}
    const variants={edges:node.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:a.shop.currencyCode}}}))};
    const product=mapShopifyProduct({...node,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}});
    const storefrontProduct=await getProductByHandle(node.handle,{strict:true,cache:'no-store'});
    if(node.status==='DRAFT')expect(storefrontProduct).toBeNull();else expect(storefrontProduct?.id).toBe(node.id);
    nodes.set(node.id,{node,product,storefrontProduct});
   }
   return {nodes,startedAt,checkedAt:new Date().toISOString()};
  }
  const before=await current(),records:Record<string,DollVueReadinessRecord>={},verification:unknown[]=[],verified=new Map<string,string>();
  async function image(url:string,digest:string,optionReference=false){
   if(verified.has(url)){expect(verified.get(url)).toBe(digest);return;}
   await normalizeReviewedImage({url,sha256:digest,origin,optionReference});verified.set(url,digest);
  }
  let singles=0,combined=0,cartChecks=0;
  for(const row of rows){
   const {node,product,storefrontProduct}=before.nodes.get(row.id)!;
   const publicProduct=storefrontProduct||product,published=node.status==='ACTIVE';
   for(const p of [product,...(storefrontProduct?[storefrontProduct]:[])]){
    expect(isDollVueExcluded(p)).toBe(false);expect(p.extended.stockStatus).toBe('custom');
    const s=productImageSources(p)[0];expect([s.url,s.width,s.height]).toEqual([row.source.url,row.source.decodedWidth,row.source.decodedHeight]);
    expect(dollVueReadinessFingerprint(p,dollVueConfigForProduct(p,getCustomizationConfig(p)))).toBe(row.fingerprint);
   }
   const base=getCustomizationConfig(publicProduct),baseSnapshot=JSON.stringify(base),config=dollVueConfigForProduct(publicProduct,base);
   const actual=config.groups.filter(g=>['eye-color','hairstyle'].includes(g.id)).flatMap(g=>g.options.filter(o=>classifyAppearance(g,o).status==='candidate'&&o.swatch?.kind==='image').map(o=>({groupId:g.id,optionId:o.id,label:o.label,reference:o.swatch!.value,visibleWhen:g.visibleWhen||[]})));
   expect(actual).toEqual(row.choices);expect(actual.every(c=>c.visibleWhen.length===0)).toBe(true);
   const choices:Choice[]=row.choices.map(({groupId,optionId,reference})=>({groupId,optionId,reference}));
   expect(choices).toHaveLength(row.index===5?21:row.index===35?7:row.index===42?14:9);
   const imageDigests:Record<string,string>={[row.source.url]:row.source.sha256};await image(row.source.url,row.source.sha256);
   for(const c of choices){const ref=refs.find(r=>r.url===c.reference)!;expect(ref).toBeDefined();expect(ref.uses.some(u=>u.index===row.index&&u.groupId===c.groupId&&u.optionId===c.optionId)).toBe(true);await image(c.reference,ref.sha256,true);imageDigests[c.reference]=ref.sha256;}
   const record:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:row.fingerprint,sourcePositions:[0],choices,imageDigests};
   expect(Object.keys(record).sort()).toEqual(['productId','policy','status','fingerprint','sourcePositions','choices','imageDigests'].sort());
   const ready=evaluateDollVueReadiness(publicProduct,config,record,{published,privateReview:!published,contentExcluded:false});
   expect(ready.ready).toBe(true);expect(ready.publiclyAvailable).toBe(published);if(!published)expect(ready.privatelyAvailable).toBe(true);
   const menu=reviewedDollVueConfig(config,ready,published?'public':'private'),now=new Date(),variant=publicProduct.variants.find(v=>v.availableForSale)!;expect(variant).toBeDefined();
   if(!published)expect(reviewedDollVueConfig(config,ready,'public').groups.every(g=>g.options.every(o=>!o.dollVueEnabled))).toBe(true);
   function resolve(selected:Choice[]){
    const initial=promotionPricingForSelections(publicProduct,menu,{},now).config,selections=getDefaultSelections(initial);
    if(selected.length)expect(areDollVueSelectionsValid(initial,selected)).toBe(true);
    for(const c of selected)selections[c.groupId]=c.optionId;
    const result=resolveCustomization(promotionPricingForSelections(publicProduct,menu,selections,now).config,selections,Number(variant.price.amount));
    expect(result.issues).toEqual([]);expect(result.requiresPriceConfirmation).toBe(false);expect(Number.isFinite(result.totalPrice)).toBe(true);
    const ordinary=resolveCustomization(promotionPricingForSelections(publicProduct,base,selections,now).config,selections,Number(variant.price.amount));
    expect(result.totalPrice).toBe(ordinary.totalPrice);expect(result.cartAttributes).toEqual(ordinary.cartAttributes);expect(result.selections).toEqual(ordinary.selections);
    for(const c of selected){
     expect(result.selections[c.groupId]).toBe(c.optionId);
     const option=result.selectedOptions.find(o=>o.groupId===c.groupId&&o.optionId===c.optionId)!;expect(option).toBeDefined();
     expect(result.cartAttributes.some(a=>a.key==='DollWow '+option.groupLabel&&a.value.includes(option.optionLabel))).toBe(true);
    }
    return result;
   }
   const defaults=resolve([]),singleChecks=choices.map(c=>({choice:c,result:resolve([c])}));singles+=singleChecks.length;
   const eyes=choices.filter(c=>c.groupId==='eye-color'),hair=choices.filter(c=>c.groupId==='hairstyle');
   const combinedChecks=eyes.flatMap(e=>hair.map(h=>({choices:[e,h],result:resolve([e,h])})));combined+=combinedChecks.length;
   const selected=[eyes[0],...(hair.length?[hair[0]]:[])],expected=resolve(selected);
   state.registry[row.id]=record;state.product=published?storefrontProduct:null;
   let cartStatus:number;
   try{
    const response=await cart(new Request(origin+'/dollvue/cart',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({productHandle:row.handle,selections:selected.map(({groupId,optionId})=>({groupId,optionId}))})})),payload=await response.json();
    cartStatus=response.status;expect(response.status,JSON.stringify(payload)).toBe(published?200:404);
    if(published){
     expect(payload.item).toMatchObject({merchandiseId:variant.id,productHandle:row.handle,unitPrice:expected.totalPrice,currencyCode:variant.price.currencyCode,selections:expected.selections});
     expect(payload.item.attributes.filter((a:{key:string})=>a.key!=='DollWow Reference Name')).toEqual(expected.cartAttributes);
     if(expected.optionPriceDelta===0)expect(payload.item.customizationCharge).toBeUndefined();else expect(payload.item.customizationCharge).toMatchObject({amount:expected.optionPriceDelta,currencyCode:variant.price.currencyCode});
    }
    cartChecks++;
   }finally{state.product=null;delete state.registry[row.id];}
   expect(JSON.stringify(base)).toBe(baseSnapshot);records[row.id]=record;
   verification.push({id:row.id,index:row.index,status:row.status,published,hold:'clear',sourceReviewAttribution:'native-assistant',referenceMeaningAttribution:'native-assistant',familyPilotVerdictAttribution:'parent-assistant-pilot-only',ownerReviewed:false,source:row.source,fingerprint:row.fingerprint,defaults,singleChecks,combinedChecks,cartStatus,cartSample:selected,cartExpected:expected,catalogMenuAndPricesUnchanged:true});
  }
  const private404Checks=[];
  for(const url of public404Urls){const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(60000)});expect(response.status).toBe(404);await response.body?.cancel();private404Checks.push({url,status:response.status});}
  const after=await current();for(const id of ids){expect(after.nodes.get(id)!.node).toEqual(before.nodes.get(id)!.node);expect(after.nodes.get(id)!.storefrontProduct).toEqual(before.nodes.get(id)!.storefrontProduct);}
  for(const input of [...inputs,...runtimeInputs])expect(sha(await fs.readFile(input.file))).toBe(input.sha256);
  const endBytes=await fs.readFile(registryFile),end=JSON.parse(endBytes.toString());unchanged(registry,end,ids);
  expect([singles,combined,cartChecks,verified.size]).toEqual([78,195,7,44]);
  const proposal={frozen:true,frozenAt:new Date().toISOString(),privateProposalOnly:true,integrationAuthorized:false,integrationGate:'Independent Mill review, then explicit parent confirmation to Mill; do not integrate automatically.',ownerReviewed:false,humanApproval:false,reviewer:'native-assistant',records,verification,private404Checks,evidence:{inputs,runtimeInputs,registryInputCount:Object.keys(registry).length,registryInputSha256:sha(registryBytes),registryEndCount:Object.keys(end).length,registryEndSha256:sha(endBytes),preexistingRegistryUnchanged:true,unrelatedRegistryAdditions:Object.keys(end).filter(id=>!Object.hasOwn(registry,id)),firstCurrentCheck:{startedAt:before.startedAt,checkedAt:before.checkedAt},lastCurrentCheck:{startedAt:after.startedAt,checkedAt:after.checkedAt}},summary:{readyRecords:7,currentlyPublic:6,unpublishedDrafts:1,defaultChecks:7,singleChoiceChecks:singles,combinedChecks:combined,routeCartPayloadChecks:6,draftCart404Checks:1,draftViewerAndPdp404Checks:2,verifiedUniqueImages:verified.size,...counts},registryWritten:false,publicationChanged:false,customerMailSent:false};
  const bytes=Buffer.from(JSON.stringify(proposal,null,2)+'\n');await fs.writeFile(output,bytes,{flag:'wx',mode:0o600});console.info(JSON.stringify({proposal:output,sha256:sha(bytes),summary:proposal.summary}));
 }finally{state.product=null;state.registry={};vi.unstubAllGlobals();}
},20*60*1000);

