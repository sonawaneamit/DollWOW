import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {expect,it,vi} from 'vitest';
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-family-finalization@example.invalid'})}));
import {env} from '@/lib/utils/env';
import {adminFetch} from '@/lib/shopify/admin';
import * as storefront from '@/lib/shopify/storefront';
import * as eligibility from '@/lib/dollvue/eligibility';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization,isOptionAvailableForCheckout} from '@/lib/customization/resolve';
import {dollVueConfigForProduct,areDollVueSelectionsValid} from '@/lib/dollvue/config';
import {classifyAppearance,DOLLVUE_APPEARANCE_POLICY} from '@/lib/dollvue/appearance';
import {dollVueReadinessFingerprint,evaluateDollVueReadiness,reviewedDollVueConfig,type DollVueReadinessRecord} from '@/lib/dollvue/readiness';
import {normalizeReviewedImage} from '@/lib/dollvue/reviewedImages';
import {productImageSources} from '@/lib/catalog/productImage';
import {promotionPricingForSelections} from '@/lib/promotions/optionPricing';
import {productDisplayName,productPublicTitle} from '@/lib/catalog/naming';
import {POST as cartPOST} from '@/app/dollvue/cart/route';

const directory='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/piper-family-preparation/avant-rosretty-moonvale';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const expectedIndices=[1,28,29,30,34,36,42,49,50,55,60,65,66,76,77,78];
const stateFields='id handle status publishedAt tags hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}';
function clearPublicState(state:any,id:string,handle:string){
 expect(state).toMatchObject({id,handle,status:'ACTIVE'});expect(state.publishedAt).toBeTruthy();expect(Object.hasOwn(state,'hold')).toBe(true);expect(state.hold===null||typeof state.hold?.value==='string').toBe(true);expect(state.hold?.value.trim()||'').toBe('');expect(state.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state.resourcePublications.nodes.some((r:any)=>r.isPublished)).toBe(true);
}
it('fails closed for draft, unknown holds and unpublished state',()=>{
 const s={id:'id',handle:'handle',status:'ACTIVE',publishedAt:'today',hold:null,resourcePublications:{nodes:[{isPublished:true}],pageInfo:{hasNextPage:false}}};
 expect(()=>clearPublicState(s,'id','handle')).not.toThrow();
 for(const change of [{status:'DRAFT'},{hold:{value:'hold'}},{hold:undefined},{publishedAt:null},{resourcePublications:{nodes:[],pageInfo:{hasNextPage:false}}}])expect(()=>clearPublicState({...s,...change},'id','handle')).toThrow();
});
it.skipIf(process.env.DOLLVUE_THREE_BRAND_FINALIZE!=='1')('finalizes exact sixteen privately after bound parent pilot acceptance and fresh runtime checks',async()=>{
 const approvalFile=path.join(directory,'parent-output-approval.json'),approvalBytes=await fs.readFile(approvalFile),approval=JSON.parse(approvalBytes.toString());
 expect(approval).toMatchObject({frozen:true,ownerReviewed:false,reviewer:'parent-assistant',verdict:'PASS_MINOR_VARIATION_ACCEPTED',parentAllSourcesReviewed:false,generationAuthorized:false,registryMutationAuthorized:false,finalizationAuthorized:{exactRecords:16}});
 const outputReviewBytes=await fs.readFile(path.join(directory,'two-pilot-output-review.json'));expect(hash(outputReviewBytes)).toBe(approval.nativeOutputReviewSha256);const outputReview=JSON.parse(outputReviewBytes.toString());
 for(const p of approval.pilots){const reviewed=outputReview.pilots.find((r:any)=>r.name===p.name);expect(reviewed.productId).toBe(p.productId);expect(hash(await fs.readFile(reviewed.inputFile))).toBe(p.inputSha256);expect(hash(await fs.readFile(reviewed.outputFile))).toBe(p.outputSha256);expect(hash(await fs.readFile(reviewed.comparison.file))).toBe(p.comparisonSha256);const resultBytes=await fs.readFile(reviewed.resultEvidence.file);expect(hash(resultBytes)).toBe(reviewed.resultEvidence.sha256);expect(JSON.parse(resultBytes.toString())).toMatchObject({providerCalls:1,routeCalls:1,routeStatus:200,postflightPassed:true,outputSha256:p.outputSha256});}
 const reviewFile=path.join(directory,'native-review-and-candidate-proposal-corrected.json'),reviewBytes=await fs.readFile(reviewFile);expect(hash(reviewBytes)).toBe('81868f17ee73f1120368cfb351128f29030873e492d40699391bc994539891c9');const review=JSON.parse(reviewBytes.toString());
 const prepBytes=await fs.readFile(review.preparation.file);expect(hash(prepBytes)).toBe(review.preparation.sha256);const prep=JSON.parse(prepBytes.toString());expect(hash(await fs.readFile(review.nativeReview.file))).toBe(review.nativeReview.sha256);
 const selected=review.rows.filter((r:any)=>r.sourceDecision==='PASS_NATIVE_ADULT_NONEXPLICIT_IRIS');expect(selected.map((r:any)=>r.index)).toEqual(expectedIndices);
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBefore.toString());for(const r of selected)expect(registry[r.id]).toBeUndefined();
 const dir=path.join(directory,`finalization-${Object.keys(registry).length}-${Date.now()}`);await fs.mkdir(dir,{mode:0o700});
 const save=async(name:string,value:unknown)=>{const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n'),file=path.join(dir,name);await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});return {file,sha256:hash(bytes)};};
 await save('reservation.json',{reservedAt:new Date().toISOString(),ids:selected.map((r:any)=>r.id),approvalSha256:hash(approvalBytes),reviewSha256:hash(reviewBytes),registrySha256:hash(registryBefore),generationAuthorized:false,remoteMutationsAuthorized:false});
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const counts={adminReads:0,storefrontReads:0,imageReads:0,cartPasses:0,priceRejections:0,rejectionChecks:0,generationCalls:0,remoteMutations:0};
 const records:Record<string,DollVueReadinessRecord>={},images=new Map<string,{url:string;file:string;sha256:string;optionReference:boolean}>();
 for(const row of selected){
  expect(row.approvedSourcePositions).toEqual([0]);expect(row.ownerReviewed).toBe(false);const source=row.sources[0],g=row.candidateGroups[0];expect(row.candidateGroups).toHaveLength(1);expect(g.groupId).toBe('eye-color');
  const family=prep.families.find((f:any)=>f.referenceFamilyHash===g.familyHash),choices=family.choices.filter((c:any)=>g.optionIds.includes(c.optionId)).map((c:any)=>({groupId:g.groupId,optionId:c.optionId,reference:c.reference}));expect(choices).toHaveLength(row.brand==='Avant Doll'?19:10);
  const pins:Record<string,string>={[source.url]:source.sha256};images.set(source.url,{...source,optionReference:false});
  for(const choice of choices){const r=prep.referenceEvidence.find((r:any)=>r.reference===choice.reference);expect(r).toBeTruthy();pins[r.reference]=r.sha256;images.set(r.reference,{url:r.reference,file:r.file,sha256:r.sha256,optionReference:true});}
  records[row.id]={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:row.fingerprint,sourcePositions:[0],imageDigests:pins,choices};
 }
 expect(images.size).toBe(45);
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);if(body.variables?.ids)expect(body.variables.ids.every((id:string)=>selected.some((r:any)=>r.id===id))).toBe(true);if(body.variables?.handle)expect(selected.some((r:any)=>r.handle===body.variables.handle)).toBe(true);if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;}
  else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect([...images.keys()].map(url=>new URL(url,origin).href)).toContain(u.href);expect(init?.cache).toBe('no-store');counts.imageReads++;}
  return nativeFetch(input,init);
 });
 async function current(row:any){
  const product=await storefront.getProductByHandle(row.handle,{strict:true,cache:'no-store'});expect(product?.id).toBe(row.id);expect(product?.handle).toBe(row.handle);const data=await adminFetch<{nodes:any[]}>(`query AssignedFinalizerState($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:[row.id]}),state=data.nodes[0];clearPublicState(state,row.id,row.handle);
  expect(product!.extended.brand).toBe(row.brand);expect(product!.extended.stockStatus).toBe('custom');expect(storefront.isCustomerVisibleProduct(product!)).toBe(true);expect(eligibility.isDollVueExcluded(product!)).toBe(false);
  const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(row.fingerprint);expect(productImageSources(product!)[0].url).toBe(row.sources[0].url);
  const group=config.groups.find(g=>g.id==='eye-color')!;expect([undefined,'single']).toContain(group.selectionMode);expect(group.visibleWhen?.length||0).toBe(0);
  const actual=group.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({groupId:group.id,optionId:o.id,reference:o.swatch?.value}));
  const original=row.groups.find((g:any)=>g.groupId==='eye-color').options.filter((o:any)=>o.classification.status==='candidate').map((o:any)=>({groupId:'eye-color',optionId:o.id,reference:o.reference}));expect(actual).toEqual(original);
  const evaluation=evaluateDollVueReadiness(product!,config,records[row.id],{published:true,contentExcluded:false});expect(evaluation.ready).toBe(true);const menu=reviewedDollVueConfig(config,evaluation,'public');
  for(const c of records[row.id].choices!)expect(areDollVueSelectionsValid(menu,[c])).toBe(true);
  return {product:product!,config,menu,state};
 }
 async function imageCheck(stage:string){const checked=[];for(const r of images.values()){expect(hash(await fs.readFile(r.file))).toBe(r.sha256);if(r.url.startsWith('/'))expect(hash(await fs.readFile(path.join(process.cwd(),'public',decodeURIComponent(new URL(r.url,origin).pathname))))).toBe(r.sha256);const data=await normalizeReviewedImage({...r,origin});checked.push({...r,normalizedSha256:hash(Buffer.from(data.split(',')[1],'base64'))});}await save(`${stage}-image-checks.json`,checked);return checked;}
 try{
  const beforeImages=await imageCheck('before'),before=[];
  for(const row of selected)before.push(await current(row));await save('before-current-state.json',before);
  const reports=[],readyIds:string[]=[],priceBlocked:Array<{id:string;handle:string;index:number;choices:unknown[];reason:string}>=[];
  for(const [i,row] of selected.entries()){
   const {product,menu}=before[i],record=records[row.id],choices=record.choices!,variant=product.variants.find(v=>v.availableForSale)!;expect(variant).toBeDefined();const checks=[],blockedChoices=[];
   const lookup=vi.spyOn(storefront,'getProductByHandle').mockImplementation(async(handle,options)=>{expect(handle).toBe(row.handle);expect(options).toMatchObject({strict:true,cache:'no-store'});return product;});
   const resolver=vi.spyOn(eligibility,'resolveCurrentDollVueEligibility').mockImplementation(async p=>{expect(p.id).toBe(row.id);return {available:true,config:menu,sourcePositions:[0],revision:row.fingerprint,imageDigests:record.imageDigests};});
   const request=(selections:Array<{groupId:string;optionId:string}>,o=origin)=>new Request(`${origin}/dollvue/cart`,{method:'POST',headers:{Origin:o,'Content-Type':'application/json'},body:JSON.stringify({productHandle:row.handle,selections})});
   try{
    for(const choice of choices){
     const now=new Date(),initial=promotionPricingForSelections(product,menu,{},now).config;
     if(!isOptionAvailableForCheckout(initial,choice.groupId,choice.optionId)){
      const response=await cartPOST(request([choice])),payload=await response.json();expect(response.status).toBe(409);expect(payload.error).toContain('needs a confirmed price');
      const option=initial.groups.find(g=>g.id===choice.groupId)!.options.find(o=>o.id===choice.optionId)!;
      const evidence={choice,status:response.status,payload,catalogPricePresent:Object.hasOwn(option,'priceDelta'),catalogPriceDelta:option.priceDelta??null};blockedChoices.push(evidence);checks.push(evidence);counts.priceRejections++;continue;
     }
     const selections={...getDefaultSelections(initial),'eye-color':choice.optionId},priced=promotionPricingForSelections(product,menu,selections,now).config,resolved=resolveCustomization(priced,selections,Number(variant.price.amount));expect(resolved.issues).toEqual([]);expect(resolved.requiresPriceConfirmation).toBe(false);
     const response=await cartPOST(request([choice]));expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');const payload=await response.json(),name=productDisplayName(product);
     expect(payload.item).toMatchObject({merchandiseId:variant.id,productHandle:row.handle,unitPrice:resolved.totalPrice,currencyCode:variant.price.currencyCode,readyToShip:false,selections:resolved.selections});expect(payload.item.attributes).toEqual([...(name?[{key:'DollWow Reference Name',value:name}]:[]),...resolved.cartAttributes]);
     expect(payload.item.customizationCharge).toEqual(resolved.optionPriceDelta>0?{amount:resolved.optionPriceDelta,currencyCode:variant.price.currencyCode,title:name||productPublicTitle(product),items:resolved.selectedOptions.filter(o=>o.priceDelta>0).map(o=>({group:o.groupLabel,label:o.optionLabel,amount:o.priceDelta}))}:undefined);
     counts.cartPasses++;checks.push({choice,status:response.status,unitPrice:payload.item.unitPrice,currencyCode:payload.item.currencyCode,resolved,payload});
    }
    for(const [selections,status,o]of [[choices.slice(0,1),403,'https://untrusted.invalid'],[choices.slice(0,2),409,origin],[[{groupId:'wig-style',optionId:'wig-1'}],409,origin],[[{groupId:'eye-color',optionId:'unknown'}],409,origin]] as const){expect((await cartPOST(request([...selections],o))).status).toBe(status);counts.rejectionChecks++;}
    resolver.mockResolvedValueOnce({available:false,config:menu,sourcePositions:[],revision:row.fingerprint,imageDigests:record.imageDigests});expect((await cartPOST(request([choices[0]]))).status).toBe(404);counts.rejectionChecks++;
    if(row.brand==='Avant Doll'){expect((await cartPOST(request([{groupId:'eye-color',optionId:'eye-20'}]))).status).toBe(409);counts.rejectionChecks++;}
    if(blockedChoices.length)priceBlocked.push({id:row.id,handle:row.handle,index:row.index,choices:blockedChoices,reason:'Current native iris option price is unconfirmed; actual cart route rejects with 409. No price inferred or changed. No ready record proposed.'});else readyIds.push(row.id);
    reports.push(await save(`cart-${row.index}.json`,{id:row.id,handle:row.handle,index:row.index,checks,sourcePositions:[0],ownerReviewed:false,testOnlyEligibility:true,remoteMutations:0,priceBlocked:blockedChoices.length>0}));
   }finally{lookup.mockRestore();resolver.mockRestore();}
  }
  const after:Array<Awaited<ReturnType<typeof current>>>=[];for(const row of selected)after.push(await current(row));expect(after).toEqual(before);await save('after-current-state.json',after);expect(await imageCheck('after')).toEqual(beforeImages);
  const registryAfter=await fs.readFile('lib/dollvue/readiness-registry.json'),latest=JSON.parse(registryAfter.toString());for(const [id,r]of Object.entries(registry))expect(latest[id],id).toEqual(r);for(const row of selected)expect(latest[row.id]).toBeUndefined();
  expect(hash(await fs.readFile(approvalFile))).toBe(hash(approvalBytes));expect(hash(await fs.readFile(reviewFile))).toBe(hash(reviewBytes));expect(counts.cartPasses+counts.priceRejections).toBe(169);expect(counts.rejectionChecks).toBe(81);
  const verification=selected.map((row:any,i:number)=>({id:row.id,handle:row.handle,draft:after[i].state.status==='DRAFT',status:after[i].state.status,publishedAt:after[i].state.publishedAt,publicRuntime:true,privateHold:'clear',sourcePositions:[0],irisChoices:records[row.id].choices!.length,sourceReviewer:'assistant-native-image-review',stateCheckedAt:new Date().toISOString()}));
  const readyRecords=Object.fromEntries(readyIds.map(id=>[id,records[id]]));
  const result=await save(`ready-proposal-${readyIds.length}.json`,{checkedAt:new Date().toISOString(),status:priceBlocked.length?'PARTIAL_READY_PRIVATE_PROPOSAL_WITH_PRICE_BLOCKERS':'EXACT_SIXTEEN_READY_PRIVATE_PROPOSAL_NOT_INTEGRATED',requestedRecords:16,records:readyRecords,priceBlocked,verification:verification.map((v:any)=>({...v,eligibleForIntegration:readyIds.includes(v.id)})),parentPilotApproval:{file:approvalFile,sha256:hash(approvalBytes),...approval},nativeSourceReview:{file:reviewFile,sha256:hash(reviewBytes)},sourceReviewer:'assistant-native-image-review',parentAllSourcesReviewed:false,ownerReviewed:false,verificationReports:reports,counts,summary:{readyRecords:readyIds.length,priceBlockedRecords:priceBlocked.length,publicActiveReviewed:16,drafts:0,sourcePositions:[0],uniqueImageBindings:45,cartPasses:counts.cartPasses,priceRejections:counts.priceRejections,rejectionChecks:81},registryVerification:{beforeCount:Object.keys(registry).length,afterCount:Object.keys(latest).length,beforeSha256:hash(registryBefore),afterSha256:hash(registryAfter),oldEntriesAndAssignedFamilyUnchanged:true},registryWritten:false,generationCalls:0,remoteMutations:0,testScope:'Actual local cart route with prospective private eligibility and freshly read Storefront products. No hosted activation, cart/order creation, prices changed, publication, mail or registry writes. Two representative accepted pilots, not 169 individual generations.'});
  console.info(JSON.stringify({result,counts,verification}));
 }catch(error){await save('failure.json',{failedAt:new Date().toISOString(),error:error instanceof Error?error.message:String(error),counts,registryWritten:false});throw error;}
 finally{vi.restoreAllMocks();vi.unstubAllGlobals();}
},15*60*1000);
