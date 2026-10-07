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
const query=`query MahdyIrisReadiness($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/mahdy-iris-six-preparation';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const bindings=[
 ['candidate-manifest.json','738e529ca2028ac89cf97a8610ea5b2348bf5450b6e63a545cb39e78a2ae154e'],
 ['reviewed-reference-evidence.frozen.json','c24131207739f013deb75491cf00f60cae37bce16a797a1513b9f71b666980e2'],
 ['parent-pilot-acceptance.frozen.json','127e61864747b937c89c9dd6e8e4c5f0321a32bb08109c5722bac935b7528b44']
] as const;
type Choice={groupId:string;optionId:string;label:string;reference:string;sha256:string};
type Row={index:number;id:string;handle:string;brand:string;status:string;familyKey:string;fingerprint:string;choices:Choice[];sources:Array<{sourcePosition:number;url:string;file:string;sha256:string;decodedWidth:number;decodedHeight:number;byteLength:number}>};
type Review={index:number;id:string;handle:string;sourcePosition:number;sourceURL:string;file:string;sha256:string;decision:string;reviewer:string;ownerReviewed:boolean;humanApproval?:boolean;originalInspected:boolean};
type Ref={optionId:string;label:string;referenceUrl:string;sha256:string;cachedFile:string;visualMeaningVerified:boolean};
type Family={key:string;brand:string;references:Ref[]};
function unchanged(before:Record<string,unknown>,after:Record<string,unknown>,ids:string[]){
 for(const [id,entry] of Object.entries(before))expect(after[id],id).toEqual(entry);
 for(const id of ids)expect(after[id],'Proposal conflict '+id).toBeUndefined();
}
function assertDraft(n:AdminNode,sf:unknown){
 expect(n.status).toBe('DRAFT');expect(n.publishedAt).toBeNull();expect(sf).toBeNull();
 expect(Object.hasOwn(n,'hold')).toBe(true);expect(n.hold===null||typeof n.hold?.value==='string').toBe(true);expect(n.hold?.value.trim()||'').toBe('');
 expect(n.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(n.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false);
}
function approved(manifest:Row[],review:Review[]){
 expect(new Set(review.map(r=>r.id)).size).toBe(review.length);expect(review.map(r=>r.id).sort()).toEqual(manifest.map(r=>r.id).sort());
 for(const r of manifest){
  const d=review.find(d=>d.id===r.id)!,s=r.sources.find(s=>s.sourcePosition===0)!;
  expect(d).toMatchObject({index:r.index,handle:r.handle,sourcePosition:0,sourceURL:s.url,file:s.file,sha256:s.sha256,reviewer:'native-assistant',ownerReviewed:false});
  expect(['approve','needsAlternative','needsAdultPresentationClarity']).toContain(d.decision);
  if(d.decision==='approve')expect(d.originalInspected).toBe(true);
 }
 return manifest.filter(r=>review.find(d=>d.id===r.id)!.decision==='approve');
}
it('allows unrelated additions but rejects changed prior records or proposal overlap',()=>{
 expect(()=>unchanged({a:{n:1}},{a:{n:1},b:{}},['c'])).not.toThrow();
 expect(()=>unchanged({a:{n:1}},{a:{n:2}},['c'])).toThrow();
 expect(()=>unchanged({a:{}},{},['c'])).toThrow();
 expect(()=>unchanged({a:{}},{a:{},c:{}},['c'])).toThrow();
});
it('rejects publication and unavailable or held draft proof',()=>{
 const n={status:'DRAFT',publishedAt:null,hold:null,resourcePublications:{nodes:[],pageInfo:{hasNextPage:false}}} as unknown as AdminNode;
 expect(()=>assertDraft(n,null)).not.toThrow();
 for(const bad of [{...n,status:'ACTIVE'},{...n,hold:undefined},{...n,hold:{value:'hold'}},{...n,publishedAt:'today'},{...n,resourcePublications:{nodes:[],pageInfo:{hasNextPage:true}}},{...n,resourcePublications:{nodes:[{isPublished:true}],pageInfo:{hasNextPage:false}}}])expect(()=>assertDraft(bad as AdminNode,null)).toThrow();
 expect(()=>assertDraft(n,{})).toThrow();
});
it('does not accept missing, duplicated or mismatched source decisions',()=>{
 const r={index:1,id:'a',handle:'h',sources:[{sourcePosition:0,url:'u',file:'f',sha256:'s'}]} as Row;
 const d={index:1,id:'a',handle:'h',sourcePosition:0,sourceURL:'u',file:'f',sha256:'s',reviewer:'native-assistant',ownerReviewed:false,humanApproval:false,decision:'approve',originalInspected:true};
 expect(approved([r],[d])).toHaveLength(1);
 for(const bad of [[],[d,d],[{...d,sha256:'wrong'}],[{...d,decision:'pending'}],[{...d,originalInspected:false}]])expect(()=>approved([r],bad)).toThrow();
 expect(approved([r],[{...d,decision:'needsAdultPresentationClarity'}])).toHaveLength(0);
});
it.skipIf(process.env.DOLLVUE_MAHDY_IRIS_READINESS!=='1')('finalizes only one native-reviewed Mahdy iris-only drafts without publication or generation',async()=>{
 const registryFile='lib/dollvue/readiness-registry.json',registryBytes=await fs.readFile(registryFile),registry=JSON.parse(registryBytes.toString());
 const inputs:Array<{file:string;sha256:string}>=[];
 async function evidence(file:string,pin?:string){
  const real=await fs.realpath(file);expect(real.startsWith(root+path.sep)).toBe(true);const b=await fs.readFile(real),h=sha(b);if(pin)expect(h).toBe(pin);inputs.push({file:real,sha256:h});return b;
 }
 const parsed=[];
 for(const [file,pin] of bindings)parsed.push(JSON.parse((await evidence(path.join(root,file),pin)).toString()));
 const [raw,review,acceptance]=parsed;
 expect(raw.rows).toHaveLength(1);
 expect(review).toMatchObject({frozen:true,reviewer:'native-assistant',ownerReviewed:false,humanApproval:false,productId:'gid://shopify/Product/10428386934968'});
 expect(acceptance).toMatchObject({frozen:true,reviewer:'parent-assistant',reportedBy:'parent-assistant',ownerReviewed:false,humanApproval:false,decision:'PASS_MINOR_VARIATION_ACCEPTED',productId:review.productId,groupId:'eye-color',optionId:'no-4'});
 for(const x of [acceptance.source,acceptance.reference,acceptance.output,acceptance.result,acceptance.nativeReview,acceptance.pilotInput])await evidence(x.file,x.sha256);
 const pilotResult=JSON.parse((await evidence(acceptance.result.file,acceptance.result.sha256)).toString());
 expect(pilotResult).toMatchObject({productId:review.productId,providerCalls:1,routeStatus:200,publicRejectedBefore:true,postflightPassed:true,customerMailSent:false,registryWritten:false,nativePricesVerifiedBeforeGeneration:true});
 expect(pilotResult.outputSha256).toBe(acceptance.output.sha256);
 const rows:Row[]=raw.rows.map((r:{source:{width:number;height:number}})=>({...r,sources:[{...r.source,decodedWidth:r.source.width,decodedHeight:r.source.height}]}));
 expect(rows[0]).toMatchObject({id:review.productId,brand:'Irontech Dolls',status:'DRAFT',fingerprint:review.fingerprint});
 expect(review.source).toMatchObject({...raw.rows[0].source,decision:'approve',originalInspected:true,ownerReviewed:false,humanApproval:false});
 const decisions:Review[]=[{index:rows[0].index,id:rows[0].id,handle:rows[0].handle,sourcePosition:0,sourceURL:review.source.url,file:review.source.file,sha256:review.source.sha256,decision:review.source.decision,reviewer:review.source.reviewer,ownerReviewed:review.source.ownerReviewed,humanApproval:false,originalInspected:true}];
 expect(approved(rows,decisions)).toEqual(rows);
 expect(review.references.map((r:Choice)=>r.optionId)).toEqual(['no-1','no-2','no-3','no-4','no-5','no-6']);
 const references:Ref[]=review.references.map((r:Choice&{file:string;decision:string;originalInspected:boolean},i:number)=>{
  expect(r.groupId).toBe('eye-color');expect(r.optionId).toBe('no-'+(i+1));expect(r.label).toBe('No.'+(i+1));
  expect(r.decision).toBe('approve-iris-color-texture-only');expect(r.originalInspected).toBe(true);expect(r.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(raw.rows[0].references).toContainEqual(expect.objectContaining({optionId:r.optionId,reference:r.reference,sha256:r.sha256}));
  return {optionId:r.optionId,label:r.label,referenceUrl:r.reference,sha256:r.sha256,cachedFile:r.file,visualMeaningVerified:true};
 });
 for(const ref of references)await evidence(ref.cachedFile,ref.sha256);
 const eyeChoices:Choice[]=references.map(r=>({groupId:'eye-color',optionId:r.optionId,label:r.label,reference:r.referenceUrl,sha256:r.sha256}));
 const ids=rows.map(r=>r.id);unchanged(registry,registry,ids);
 const output=path.join(root,'reviewed-mahdy-iris6-1-record-proposal.json');
 expect(await fs.stat(output).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})).toBe(false);
 expect(hasShopifyStorefrontEnv()).toBe(true);
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const allowedImages=new Set(rows.flatMap(r=>[r.sources[0].url,...eyeChoices.map(c=>new URL(c.reference,origin).href)]));
 const counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
 const native=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   if(body.variables.ids){expect(body.variables.ids.length).toBeLessThanOrEqual(50);expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);}
   else if(body.variables.id)expect(ids).toContain(body.variables.id);
   else expect(rows.some(r=>r.handle===body.variables.handle)).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect(allowedImages.has(u.href)).toBe(true);counts.imageReads++;}
  return native(input,{...init,redirect:'error'});
 });
 try{
  async function current(){
   const startedAt=new Date().toISOString(),nodes=new Map<string,{node:AdminNode;product:Product}>();
   for(let n=0;n<ids.length;n+=50){
    const chunk=ids.slice(n,n+50),a=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids:chunk});
    expect(a.nodes.map(n=>n.id)).toEqual(chunk);
    const res=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:'query MahdyIrisAbsent($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids:chunk}})});
    expect(res.ok).toBe(true);const sf=await res.json();expect(sf.errors).toBeUndefined();expect(sf.data.nodes).toEqual(chunk.map(()=>null));
    a.nodes.forEach((node,i)=>{assertDraft(node,sf.data.nodes[i]);const variants={edges:node.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:a.shop.currencyCode}}}))};
     const product=mapShopifyProduct({...node,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}});nodes.set(node.id,{node,product});});
   }
   const holds=await getCurrentDollVueHolds(ids);expect(ids.map(id=>holds.get(id))).toEqual(ids.map(()=>'clear'));
   return {nodes,startedAt,checkedAt:new Date().toISOString()};
  }
  const before=await current(),records:Record<string,DollVueReadinessRecord>={},verification:unknown[]=[],verified=new Map<string,string>();
  async function image(url:string,pin:string,optionReference=false){if(verified.has(url)){expect(verified.get(url)).toBe(pin);return;}await normalizeReviewedImage({url,sha256:pin,origin,optionReference});verified.set(url,pin);}
  let singles=0,public404=0,privateCartChecks=0;
  for(const row of rows){
   const {product,node}=before.nodes.get(row.id)!;expect(product.handle).toBe(row.handle);expect(product.extended.brand).toBe(row.brand);
   expect(product.extended.stockStatus).toBe('custom');expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);
   expect([product.productType,...product.tags.filter(t=>t!=='catalog-review-hold')].join(' ')).not.toMatch(/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded|youth|minor|teen/i);
   expect(isDollVueExcluded(product)).toBe(false);
   const s=row.sources.find(s=>s.sourcePosition===0)!,actualSource=productImageSources(product)[0];
   expect([actualSource.url,actualSource.width,actualSource.height]).toEqual([s.url,s.decodedWidth,s.decodedHeight]);
   expect((await evidence(s.file,s.sha256)).length).toBe(s.byteLength);await image(s.url,s.sha256);
   const base=getCustomizationConfig(product),baseSnapshot=JSON.stringify(base),config=dollVueConfigForProduct(product,base);expect(dollVueReadinessFingerprint(product,config)).toBe(row.fingerprint);
   const group=config.groups.find(g=>g.id==='eye-color')!;expect(group.visibleWhen).toBeUndefined();
   const manifestEyes=row.choices.filter(c=>c.groupId==='eye-color').map(c=>({groupId:c.groupId,optionId:c.optionId,label:c.label,reference:c.reference}));
   expect(manifestEyes).toEqual(eyeChoices.map(({sha256,...c})=>c));
   const actual=group.options.filter(o=>classifyAppearance(group,o).status==='candidate'&&o.swatch?.kind==='image').map(o=>({optionId:o.id,label:o.label,reference:o.swatch!.value}));
   expect(actual).toEqual(eyeChoices.map(c=>({optionId:c.optionId,label:c.label,reference:c.reference})));
   const choices=eyeChoices.map(({groupId,optionId,reference})=>({groupId,optionId,reference})),imageDigests:Record<string,string>={[s.url]:s.sha256};
   for(const c of eyeChoices){await image(c.reference,c.sha256,true);imageDigests[c.reference]=c.sha256;}
   const record:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:row.fingerprint,sourcePositions:[0],choices,imageDigests};
   const ready=evaluateDollVueReadiness(product,config,record,{published:false,privateReview:true,contentExcluded:false});
   expect(ready).toMatchObject({ready:true,publiclyAvailable:false,privatelyAvailable:true});
   expect(reviewedDollVueConfig(config,ready,'public').groups.every(g=>g.options.every(o=>!o.dollVueEnabled))).toBe(true);
   const menu=reviewedDollVueConfig(config,ready,'private');
   expect(menu.groups.filter(g=>g.options.some(o=>o.dollVueEnabled)).map(g=>g.id)).toEqual(['eye-color']);
   const now=new Date(),variant=product.variants.find(v=>v.availableForSale)||product.variants[0];
   function resolve(choice?:typeof choices[number]){
    const initial=promotionPricingForSelections(product,menu,{},now).config,selections=getDefaultSelections(initial);
    if(choice){expect(areDollVueSelectionsValid(initial,[choice])).toBe(true);selections[choice.groupId]=choice.optionId;}
    const priced=promotionPricingForSelections(product,menu,selections,now).config,result=resolveCustomization(priced,selections,Number(variant.price.amount));
    expect(result.issues).toEqual([]);expect(result.requiresPriceConfirmation).toBe(false);expect(Number.isFinite(result.totalPrice)).toBe(true);
    const ordinary=resolveCustomization(promotionPricingForSelections(product,base,selections,now).config,selections,Number(variant.price.amount));
    expect(result.totalPrice).toBe(ordinary.totalPrice);expect(result.cartAttributes).toEqual(ordinary.cartAttributes);expect(result.selections).toEqual(ordinary.selections);
    if(choice){expect(result.selections[choice.groupId]).toBe(choice.optionId);const o=result.selectedOptions.find(o=>o.groupId===choice.groupId&&o.optionId===choice.optionId)!;expect(o).toBeDefined();expect(result.cartAttributes).toContainEqual({key:'DollWow '+o.groupLabel,value:o.optionLabel+(o.priceDelta?' (+$'+o.priceDelta+')':'')});}
    return result;
   }
   const defaults=resolve(),localChoices=choices.map(c=>({choice:c,result:resolve(c)}));singles+=localChoices.length;
   const request=(c:typeof choices[number])=>new Request(origin+'/dollvue/cart',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({productHandle:row.handle,selections:[{groupId:c.groupId,optionId:c.optionId}]})});
   expect(await getProductByHandle(row.handle,{strict:true,cache:'no-store'})).toBeNull();expect((await cart(request(choices[0]))).status).toBe(404);public404++;
   state.product=product;state.registry[row.id]=record;
   try{for(const {choice,result} of localChoices){
    const response=await cart(request(choice)),payload=await response.json();expect(response.status,JSON.stringify(payload)).toBe(200);
    expect(payload.item).toMatchObject({merchandiseId:variant.id,productHandle:row.handle,unitPrice:result.totalPrice,currencyCode:variant.price.currencyCode,selections:result.selections});
    expect(payload.item.attributes.filter((a:{key:string})=>a.key!=='DollWow Reference Name')).toEqual(result.cartAttributes);
    if(result.optionPriceDelta===0)expect(payload.item.customizationCharge).toBeUndefined();else expect(payload.item.customizationCharge).toMatchObject({amount:result.optionPriceDelta,currencyCode:variant.price.currencyCode});
    privateCartChecks++;
   }}finally{state.product=null;delete state.registry[row.id];}
   expect((await cart(request(choices[0]))).status).toBe(404);public404++;
   expect(JSON.stringify(base)).toBe(baseSnapshot);
   records[row.id]=record;verification.push({id:row.id,index:row.index,handle:row.handle,brand:row.brand,draft:true,published:false,publiclyAvailable:false,privatelyAvailable:true,currentHold:'clear',strictStorefrontNull:true,sourcePosition:0,sourceUrl:s.url,sourceSha256:s.sha256,runtimeFingerprint:row.fingerprint,catalogIdentityKey:node.catalogIdentityKey?.value,catalogBodyIdentityKey:node.catalogBodyIdentityKey?.value,assistantVisualReview:{reviewer:'native-assistant',ownerReviewed:false,parentPilotSpotchecked:true,parentAcceptanceScope:'Exact Mahdy No.4 output only; input and reference approvals native-assistant',nativePilotSpotchecked:true},defaults,localChoices});
   if(verification.length%5===0)console.info(JSON.stringify({validated:verification.length,total:rows.length}));
  }
  const after=await current();for(const id of ids)expect(after.nodes.get(id)!.node).toEqual(before.nodes.get(id)!.node);
  for(const input of inputs)expect(sha(await fs.readFile(input.file))).toBe(input.sha256);
  const endBytes=await fs.readFile(registryFile),end=JSON.parse(endBytes.toString());unchanged(registry,end,ids);
  const proposal={checkedAt:new Date().toISOString(),privateProposalOnly:true,published:false,privateReview:true,publicActivationAllowed:false,ownerReviewed:false,humanApproval:false,reviewer:'native-assistant',records,verification,sourceExclusions:[],priorClosingFourteenSourceExclusionsPreserved:true,pilotAcceptance:acceptance,scopeExclusions:[],excludedAttributes:['skin-color','skin-tone','makeup','hair','nail-color','toe-nail-color'],evidence:{inputs,registryInputSha256:sha(registryBytes),registryInputCount:Object.keys(registry).length,registryEndSha256:sha(endBytes),registryEndCount:Object.keys(end).length,preexistingRegistryUnchanged:true,unrelatedRegistryAdditions:Object.keys(end).filter(id=>!Object.hasOwn(registry,id)),firstCurrentCheck:{startedAt:before.startedAt,checkedAt:before.checkedAt},lastCurrentCheck:{startedAt:after.startedAt,checkedAt:after.checkedAt},beforeAfterDraftUnpublishedStorefrontAbsent:true},summary:{readyRecords:rows.length,defaultChecks:rows.length,choiceChecks:singles,combinedChecks:0,privateFixtureCartChecks:privateCartChecks,publicCart404:public404,verifiedUniqueImages:verified.size,...counts},registryChangedByTask:false,publicationChanged:false};
  const bytes=Buffer.from(JSON.stringify(proposal,null,2)+'\n');await fs.writeFile(output,bytes,{flag:'wx',mode:0o600});console.info(JSON.stringify({proposal:output,sha256:sha(bytes),...proposal.summary,registryInputCount:Object.keys(registry).length}));
 }finally{state.product=null;state.registry={};vi.unstubAllGlobals();}
},30*60*1000);
