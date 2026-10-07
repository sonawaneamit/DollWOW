import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { expect, it, vi } from 'vitest';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { productImageSources } from '@/lib/catalog/productImage';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, nextMultipleSelection, resolveCustomization, isOptionAvailableForCheckout } from '@/lib/customization/resolve';
import { dollVueConfigForProduct, areDollVueSelectionsValid } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { classifyAppearance, DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness, reviewedDollVueConfig, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { promotionPricingForSelections } from '@/lib/promotions/optionPricing';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import * as storefrontModule from '@/lib/shopify/storefront';
import * as eligibilityModule from '@/lib/dollvue/eligibility';
import { POST as cartPOST } from '@/app/dollvue/cart/route';
import { productDisplayName, productPublicTitle } from '@/lib/catalog/naming';


const base='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/jarliet-eye9-hair27-preparation';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const referencePin='592ef3af5977b003e13f9da1647f8fb989cf95b55e4c455677aabca2147026b4';
const reviewPin='ab409ba88cbec5812f862a326160cfc0518cfd3fb918006f5d8913a5a4730cff';
const pin=z.string().regex(/^[a-f0-9]{64}$/);
const binding=z.object({file:z.string(),sha256:pin});
const source=z.object({sourcePosition:z.number().int().min(0).max(7),url:z.string().url(),file:z.string(),sha256:pin,byteLength:z.number(),decodedWidth:z.number(),decodedHeight:z.number()});
const manifestSchema=z.object({rows:z.array(z.object({index:z.number(),id:z.string(),handle:z.string(),status:z.string(),fingerprint:pin,sources:z.array(source)}))});
const reviewSchema=z.object({frozen:z.literal(true),ownerReviewed:z.literal(false),humanApproval:z.literal(false),parentAssistantReviewed:z.literal(true),reportedVia:z.literal('parent-assistant-message'),inputManifest:binding,
 rows:z.array(z.object({index:z.number(),id:z.string(),handle:z.string(),decision:z.enum(['approve','needsAlternative','needsAdultPresentationClarity']),sourcePosition:z.number().nullable(),sourceUrl:z.string().nullable(),sourceSha256:pin.nullable(),
 parentReview:z.object({reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false),decision:z.enum(['accept','exclude'])}).optional()}))});
const refSchema=z.object({frozen:z.literal(true),reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false),humanApproval:z.literal(false),inputs:z.record(z.string(),binding),
 references:z.array(z.object({groupId:z.enum(['eye-color','hairstyle']),optionId:z.string(),label:z.string(),url:z.string(),file:z.string(),sha256:pin,meaningReviewed:z.literal(true),visualMeaningVerified:z.literal(true),reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false)})).length(36)});
type Choice=DollVueReadinessRecord['choices'][number];
type Node=Parameters<typeof mapShopifyProduct>[0];
function approvedRows(review:z.infer<typeof reviewSchema>) {
 const rows=review.rows.filter(r=>r.decision==='approve');
 expect(rows).toHaveLength(28);expect(new Set(rows.map(r=>r.id)).size).toBe(28);
 for(const r of rows){expect(r.parentReview?.decision).toBe('accept');expect(r.sourcePosition).not.toBeNull();expect(r.sourceUrl).not.toBeNull();expect(r.sourceSha256).not.toBeNull();}
 return rows;
}
function assertFamily(refs:z.infer<typeof refSchema>['references']) {
 expect(refs.map(r=>[r.groupId,r.optionId])).toEqual([
 ...Array.from({length:9},(_,i)=>`no-${i+1}`).map(id=>['eye-color',id]),
 ...Array.from({length:28},(_,i)=>i+1).filter(n=>n!==22).map(n=>['hairstyle',`hairstyle-${n}`])]);
 for(const r of refs)expect(r.url).toBe(`/option-assets/${r.sha256}.webp`);
}
it('refuses unaccepted source counts, overrides and non-assistant attribution',()=>{
 const fixture={frozen:true,ownerReviewed:false,humanApproval:false,parentAssistantReviewed:true,reportedVia:'parent-assistant-message',inputManifest:{file:'/private/m',sha256:'a'.repeat(64)},rows:[]} as const;
 for(const changed of [{frozen:false},{ownerReviewed:true},{humanApproval:true},{reportedVia:'user message'}])expect(reviewSchema.safeParse({...fixture,...changed}).success).toBe(false);
 expect(()=>approvedRows(reviewSchema.parse(fixture))).toThrow();
});
it('rejects dropped selected options and missing cart attributes',()=>{
 const c={groupId:'eye-color',optionId:'blue'};
 expect(()=>assertRequestedChoicesRetained({selections:{},selectedOptions:[],cartAttributes:[]},[c])).toThrow();
});
it('rejects missing, reordered, duplicate and unbound family references',()=>{
 const refs=[...Array.from({length:9},(_,i)=>`no-${i+1}`).map(optionId=>({groupId:'eye-color' as const,optionId})),
 ...Array.from({length:28},(_,i)=>i+1).filter(n=>n!==22).map(n=>({groupId:'hairstyle' as const,optionId:`hairstyle-${n}`}))].map((r,i)=>({
 ...r,label:r.optionId,url:`/option-assets/${String(i).padStart(64,'0')}.webp`,sha256:String(i).padStart(64,'0'),file:'/private/ref.webp',
 meaningReviewed:true as const,visualMeaningVerified:true as const,reviewer:'parent-assistant' as const,ownerReviewed:false as const}));
 expect(()=>assertFamily(refs)).not.toThrow();
 for(const altered of [refs.slice(1),[refs[1],refs[0],...refs.slice(2)],[refs[0],refs[0],...refs.slice(2)],
 refs.map((r,i)=>i===0?{...r,url:refs[1].url}:r)]) expect(()=>assertFamily(altered)).toThrow();
});
function assertRequestedChoicesRetained(result:Pick<ReturnType<typeof resolveCustomization>,'selections'|'selectedOptions'|'cartAttributes'>,
  requested:Array<Pick<Choice,'groupId'|'optionId'>>) {
  for(const choice of requested) {
    const value=result.selections[choice.groupId];
    expect(Array.isArray(value)?value:[value],`Dropped requested ${choice.groupId}/${choice.optionId}`).toContain(choice.optionId);
    const selected=result.selectedOptions.find(option=>option.groupId===choice.groupId&&option.optionId===choice.optionId);
    expect(selected,`Missing resolved option ${choice.groupId}/${choice.optionId}`).toBeDefined();
    const attribute=result.cartAttributes.find(item=>item.key==='DollWow '+selected!.groupLabel);
    expect(attribute,`Missing cart attribute for ${choice.groupId}`).toBeDefined();
    const label=selected!.optionLabel+(selected!.priceDelta?` (+$${selected!.priceDelta})`:'');
    expect(attribute!.value.split(', '),`Missing cart value for ${choice.groupId}/${choice.optionId}`).toContain(label);
  }
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
const query = `query DollVueBatchFinalizer($ids:[ID!]!){nodes(ids:$ids){... on Product{
  id handle title description seo{title description} vendor productType tags
  featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
  priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode}}
  variants(first:30){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}}
  media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
    ... on Video{previewImage{url altText width height} sources{url mimeType}}}}}
  ${Object.entries(fields).map(([alias,key])=>`${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
}}}`;


it.skipIf(process.env.DOLLVUE_JARLIET_FINALIZE!=='1')('validates exactly 28 frozen Jarliet sources, all 36 refs and 243 combinations per product',async()=>{
 const privateInput=async(file:string)=>{const real=await fs.realpath(file);expect(real.startsWith(base+'/')).toBe(true);return real;};
 const inputs:Array<{file:string;sha256:string}>=[];
 async function pinned(file:string,expected?:string){const bytes=await fs.readFile(await privateInput(file));const digest=sha(bytes);if(expected)expect(digest).toBe(expected);inputs.push({file,sha256:digest});return JSON.parse(bytes.toString());}
 const reviewFile=path.join(base,'source-review-1-52.json');
 const review=reviewSchema.parse(await pinned(reviewFile,reviewPin));
 const readyMode=process.env.DOLLVUE_JARLIET_READY==='1';
 if(readyMode){
   const fidelity=await pinned(path.join(base,'combined-pilot-one/parent-fidelity-review.json'),'6cc72e8b5aa2d04eeab9859e95efe19a3aec67d54ba3d0539ccfba643172caa8');
   expect(fidelity).toMatchObject({frozen:true,reviewer:'parent-assistant',ownerReviewed:false,humanApproval:false,verdict:'PASS_MINOR_VARIATION_ACCEPTED',perfectMatch:false});
   for(const bound of fidelity.inputs){expect(sha(await fs.readFile(await privateInput(bound.file)))).toBe(bound.sha256);inputs.push(bound);}
 }
 const referenceEvidenceFile=path.join(base,'reviewed-reference-evidence.json');
 const referenceEvidence=refSchema.parse(await pinned(referenceEvidenceFile,referencePin));assertFamily(referenceEvidence.references);
 for(const bound of Object.values(referenceEvidence.inputs)){expect(sha(await fs.readFile(await privateInput(bound.file)))).toBe(bound.sha256);inputs.push(bound);}
 const manifest=manifestSchema.parse(await pinned(review.inputManifest.file,review.inputManifest.sha256));
 for(const ref of referenceEvidence.references)expect(sha(await fs.readFile(await privateInput(ref.file)))).toBe(ref.sha256);
 const approved=approvedRows(review).map(r=>{
   const m=manifest.rows.find(m=>m.id===r.id)!;expect(m).toBeDefined();expect([m.index,m.handle,m.status]).toEqual([r.index,r.handle,'ACTIVE']);
   const s=m.sources.find(s=>s.sourcePosition===r.sourcePosition)!;expect(s).toBeDefined();expect([s.url,s.sha256]).toEqual([r.sourceUrl,r.sourceSha256]);
   return {index:r.index,id:r.id,handle:r.handle,status:m.status,fingerprint:m.fingerprint,sourcePosition:s.sourcePosition,sourceUrl:s.url,sourceSha256:s.sha256,sourceFile:s.file,sourceBytes:s.byteLength,decoded:{width:s.decodedWidth,height:s.decodedHeight}};
 });
 const reviews=new Map(review.rows.map(r=>[r.id,{reviewer:'native-assistant + parent-assistant',ownerReviewed:false,decision:r}]));
 const choices:Choice[]=referenceEvidence.references.map(r=>({groupId:r.groupId,optionId:r.optionId,reference:r.url}));
 const eyes=choices.filter(c=>c.groupId==='eye-color'),hair=choices.filter(c=>c.groupId==='hairstyle');
 const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json');
 const registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
 if(readyMode)expect(Object.keys(registry)).toHaveLength(499);
 const output=path.join(base,readyMode?'ready-proposal-28.json':'proposal-28-cart-verified.json');
 expect(await fs.stat(output).then(()=>true,()=>false)).toBe(false);
  const ids = approved.map(row=>row.id);
  for(const id of ids) expect(registry[id],`Existing registry entry ${id}; never replace implicitly`).toBeUndefined();
  const allowedIds = new Set(ids);
  expect(hasShopifyStorefrontEnv()).toBe(true);
  const counts = {storefrontBulkReads:0,currentHoldBulkReads:0,imageReads:0,generationCalls:0,remoteWrites:0};
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch',async (input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    if(url.hostname===env.SHOPIFY_STORE_DOMAIN && url.pathname.endsWith('/graphql.json') && method==='POST') {
      const body = JSON.parse(String(init?.body));
      expect(body.query).toMatch(/^\s*query\b/); expect(body.query).not.toMatch(/\bmutation\b/);
      expect(body.variables.ids.length).toBeGreaterThan(0); expect(body.variables.ids.length).toBeLessThanOrEqual(50);
      expect(body.variables.ids.every((id:string)=>allowedIds.has(id))).toBe(true);
      if(url.pathname.includes('/admin/')) counts.currentHoldBulkReads++; else counts.storefrontBulkReads++;
    } else if(url.hostname===env.SHOPIFY_STORE_DOMAIN && url.pathname==='/admin/oauth/access_token' && method==='POST') {
      // Existing authentication renewal only; never a catalog mutation.
    } else { expect(method).toBe('GET'); expect(isOwnedOptionAsset(url.href)).toBe(true); counts.imageReads++; }
    return nativeFetch(input,init);
  });
  try {
    const nodes = new Map<string,Node>();
    const readIds = [...allowedIds];
    for(let offset=0;offset<readIds.length;offset+=50) {
      const chunk = readIds.slice(offset,offset+50);
      const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{
        method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),
        headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
        body:JSON.stringify({query,variables:{ids:chunk}}),
      });
      expect(response.ok).toBe(true);
      const body = await response.json() as {errors?:unknown[];data?:{nodes:Array<Node|null>}};
      expect(body.errors).toBeUndefined(); expect(body.data?.nodes).toHaveLength(chunk.length);
      body.data!.nodes.forEach((node,index)=>{expect(node?.id).toBe(chunk[index]); nodes.set(chunk[index],node!);});
    }
    const firstHoldCheckStartedAt = new Date().toISOString();
    const holds = await getCurrentDollVueHolds(readIds);
    const firstHoldCheckedAt = new Date().toISOString();
    expect(readIds.map(id=>holds.get(id))).toEqual(readIds.map(()=>'clear'));
    const verified = new Map<string,string>();
    const verifiedData=new Map<string,string>();
    async function verify(url:string,hash:string,optionReference=false) {
      pin.parse(hash);
      if(verified.has(url)) {expect(verified.get(url)).toBe(hash);return;}
      const data=await normalizeReviewedImage({url,sha256:hash,origin:'https://dollwow.com',optionReference});
      expect(data).toMatch(/^data:image\//);verifiedData.set(url,data);
      verified.set(url,hash);
    }
    const referencePins:Record<string,string> = {};
    for(const choice of choices) {
      const hash=referenceEvidence.references.find(r=>r.url===choice.reference)!.sha256;
      await verify(choice.reference,hash,true);referencePins[choice.reference]=hash;
    }
    const records:Record<string,DollVueReadinessRecord> = {}, verification = [];
    for(const row of approved) {
      const product = mapShopifyProduct(nodes.get(row.id)!);
      expect(product.handle).toBe(row.handle);
      expect(isCustomerVisibleProduct(product)).toBe(true); expect(isDollVueExcluded(product)).toBe(false);
      expect(product.extended.brand).toBe('Jarliet Dolls'); expect(product.extended.stockStatus).toBe('custom');
      expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);
      expect([product.productType,...product.tags.filter(t=>t!=='catalog-review-hold')].join(' ')).not.toMatch(/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i);
      const currentSource=productImageSources(product)[row.sourcePosition];
      expect(currentSource).toBeDefined();expect([currentSource.url,currentSource.width,currentSource.height]).toEqual([row.sourceUrl,row.decoded.width,row.decoded.height]);
      const source=currentSource,sourcePositions=[row.sourcePosition],imageDigests={[source.url]:row.sourceSha256};
      const bytes=await fs.readFile(await privateInput(row.sourceFile));
      expect(bytes.length).toBe(row.sourceBytes);expect(sha(bytes)).toBe(row.sourceSha256);
      await verify(source.url,row.sourceSha256);
      const config=dollVueConfigForProduct(product,getCustomizationConfig(product));
      const fingerprint=dollVueReadinessFingerprint(product,config);
      expect(fingerprint,`Changed menu/source identity ${row.handle}`).toBe(row.fingerprint);
      for(const groupId of ['eye-color','hairstyle']) {
        const group=config.groups.find(g=>g.id===groupId)!;
        expect(group?.selectionMode).toBe('single');
        expect(group?.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({optionId:o.id,label:o.label,reference:o.swatch?.value})))
          .toEqual(referenceEvidence.references.filter(r=>r.groupId===groupId).map(r=>({optionId:r.optionId,label:r.label,reference:r.url})));
      }
      for(const choice of choices) {
        const group=config.groups.find(g=>g.id===choice.groupId)!;
        expect(group).toBeDefined(); expect(group.visibleWhen?.length || 0).toBe(0);
        const option=group.options.find(o=>o.id===choice.optionId)!;
        expect(option).toBeDefined(); expect(classifyAppearance(group,option).status).toBe('candidate');
        expect(option.swatch).toMatchObject({kind:'image',value:choice.reference});
      }
      const record:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint,status:'ready',
        sourcePositions,imageDigests:{...referencePins,...imageDigests},choices};
      const ready=evaluateDollVueReadiness(product,config,record,{published:true,contentExcluded:false});
      expect(ready.ready).toBe(true);
      const menu=reviewedDollVueConfig(config,ready,'public'), now=new Date();
      const initial=promotionPricingForSelections(product,menu,{},now).config;
      const variant=product.variants.find(v=>v.availableForSale)!; expect(variant).toBeDefined();
      const basePrice=Number(variant.price.amount); expect(basePrice).toBeGreaterThan(0);
      function resolve(selected:Choice[]) {
        if(selected.length) expect(areDollVueSelectionsValid(initial,selected)).toBe(true);
        const selections=getDefaultSelections(initial);
        for(const c of selected) {
          expect(isOptionAvailableForCheckout(initial,c.groupId,c.optionId)).toBe(true);
          const g=initial.groups.find(g=>g.id===c.groupId)!;
          selections[g.id]=g.selectionMode==='multiple'?nextMultipleSelection(g.options,selections[g.id],c.optionId):c.optionId;
        }
        const priced=promotionPricingForSelections(product,menu,selections,now).config;
        const result=resolveCustomization(priced,selections,basePrice);
        expect(result.issues).toEqual([]);expect(result.requiresPriceConfirmation).toBe(false);
        assertRequestedChoicesRetained(result,selected);
        expect(Number.isFinite(result.totalPrice)).toBe(true);
        return {passed:true,selections:result.selections,totalPrice:result.totalPrice,optionPriceDelta:result.optionPriceDelta,cartAttributes:result.cartAttributes,selectedOptions:result.selectedOptions};
      }
      const defaults=resolve([]), choiceChecks=choices.map(c=>({groupId:c.groupId,optionId:c.optionId,...resolve([c])}));
      // Test-only proposed eligibility. Strict current products and real bulk holds were checked above.
      const lookup=vi.spyOn(storefrontModule,'getProductByHandle').mockImplementation(async(handle,options)=>{
        expect(handle).toBe(product.handle);expect(options).toMatchObject({strict:true,cache:'no-store'});return product;
      });
      const eligible=vi.spyOn(eligibilityModule,'resolveCurrentDollVueEligibility').mockResolvedValue({available:true,config:menu,sourcePositions,revision:fingerprint,imageDigests:record.imageDigests});
      const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;
      const request=(requested:Choice[],requestOrigin=origin)=>new Request(`${origin}/dollvue/cart`,{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify({productHandle:product.handle,selections:requested})});
      const combinedValidation=[]; for(const eye of eyes) for(const h of hair) {
        const selected=[eye,h],resolved=resolve(selected);
        const response=await cartPOST(request(selected));expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');
        const payload=await response.json(),name=productDisplayName(product);
        expect(payload.item).toMatchObject({merchandiseId:variant.id,productHandle:product.handle,unitPrice:resolved.totalPrice,currencyCode:variant.price.currencyCode,readyToShip:false,selections:resolved.selections});
        expect(payload.item.attributes).toEqual([...(name?[{key:'DollWow Reference Name',value:name}]:[]),...resolved.cartAttributes]);
        expect(payload.item.customizationCharge).toEqual(resolved.optionPriceDelta>0?{amount:resolved.optionPriceDelta,currencyCode:variant.price.currencyCode,title:name||productPublicTitle(product),items:resolved.selectedOptions.filter(o=>o.priceDelta>0).map(o=>({group:o.groupLabel,label:o.optionLabel,amount:o.priceDelta}))}:undefined);
        combinedValidation.push({choices:selected,...resolved,cartPayload:payload,cartStatus:response.status});
      }
      expect((await cartPOST(request([eyes[0],hair[0]],'https://untrusted.invalid'))).status).toBe(403);
      expect((await cartPOST(request([eyes[0],eyes[1]]))).status).toBe(409);
      eligible.mockResolvedValueOnce({available:false,config:menu,sourcePositions:[],revision:fingerprint,imageDigests:record.imageDigests});
      expect((await cartPOST(request([eyes[0],hair[0]]))).status).toBe(404);
      lookup.mockRestore();eligible.mockRestore();
      const combinedChecks=combinedValidation.length;expect(combinedChecks).toBe(243);
      records[row.id]={...record,status:readyMode?'ready':'needs-review'};
      expect(evaluateDollVueReadiness(product,config,records[row.id],{published:true,contentExcluded:false}).ready).toBe(readyMode);
      verification.push({id:row.id,handle:row.handle,draft:false,sourcePosition:row.sourcePosition,sourceUrl:source.url,sourceSha256:row.sourceSha256,
        sourceBytes:row.sourceBytes,currentHold:'clear',strictStorefrontIdentity:true,currentSourceBytesMatch:true,
        runtimeFingerprint:fingerprint,assistantVisualReview:reviews.get(row.id),localDefaultValidation:defaults,
        localChoiceValidation:choiceChecks,combinedChecks,combinedValidation,merchandiseId:variant.id,currencyCode:variant.price.currencyCode});
      if(verification.length%10===0) console.info(JSON.stringify({validated:verification.length,total:approved.length}));
    }
    const lastHoldCheckStartedAt = new Date().toISOString();
    const finalHolds = await getCurrentDollVueHolds(readIds);
    const lastHoldCheckedAt = new Date().toISOString();
    expect(readIds.map(id=>finalHolds.get(id))).toEqual(readIds.map(()=>'clear'));
    const registryAfter=await fs.readFile('lib/dollvue/readiness-registry.json');
    const registryNow=JSON.parse(registryAfter.toString()) as Record<string,DollVueReadinessRecord>;
    for(const id of ids)expect(registryNow[id],'Parent added a candidate during finalization; do not propose replacement').toBeUndefined();
    for(const input of inputs) expect(sha(await fs.readFile(input.file)),`Evidence changed during finalization: ${input.file}`).toBe(input.sha256);

    const pilotRow=approved.find(r=>r.index===27)!;expect(pilotRow).toBeDefined();
    const pilotChoices=choices.filter(c=>c.groupId==='eye-color'?c.optionId==='no-9':c.optionId==='hairstyle-11');
    expect(pilotChoices).toHaveLength(2);
    const pilot={status:'prepared-awaiting-parent-generation-authorization',generationCalls:0,productId:pilotRow.id,handle:pilotRow.handle,
      index:27,sourcePosition:pilotRow.sourcePosition,fingerprint:pilotRow.fingerprint,choices:pilotChoices,
      imageDigests:records[pilotRow.id].imageDigests,
      source:{url:pilotRow.sourceUrl,sha256:pilotRow.sourceSha256,dataUri:verifiedData.get(pilotRow.sourceUrl)},
      references:pilotChoices.map(c=>({...c,sha256:referencePins[c.reference],dataUri:verifiedData.get(c.reference)})),
      instruction:'Preserve adult source face, body, opaque gray outfit, belt, handbag, earrings, pose and red background. Apply hairstyle-11 golden curly hair and no-9 blue visible irises only. Preserve hats/accessories and respect angle/occlusion. Never transfer reference face, makeup or body.',
      freshByteRevalidationRequiredBeforeGeneration:true};
    if(!readyMode)await fs.writeFile(path.join(base,'combined-pilot-input.prepared.json'),JSON.stringify(pilot,null,2),{flag:'wx',mode:0o600});
    await fs.writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),privateProposalOnly:true,records,verification,
      referenceEvidenceFile,sourceReviewFile:reviewFile,ownerReviewed:false,humanApproval:false,generatedFidelity:readyMode?'parent-assistant PASS_MINOR_VARIATION_ACCEPTED; one combined pilot only, not perfect':'not-run',cartTestScope:'Actual cart handler, with test-only proposed eligibility and bulk-current product lookup; no live cart mutation or production bypass.',
      evidence:{inputs,registryInputSha256:sha(registryBytes),registryAfterSha256:sha(registryAfter),
        externalRegistryChanged:!registryBytes.equals(registryAfter),holdChecks:{firstHoldCheckStartedAt,firstHoldCheckedAt,lastHoldCheckStartedAt,lastHoldCheckedAt,firstAllClear:true,lastAllClear:true}},
      sourceExclusions:review.rows.filter(r=>r.decision!=='approve'),
      summary:{family:'JARLIET_EYE9_HAIR27',preparedRecords:28,readyRecords:readyMode?28:0,eyesPerRecord:9,hairPerRecord:27,
        combinedCartChecks:verification.reduce((sum,v)=>sum+v.combinedChecks,0),verifiedUniqueImages:verified.size,...counts},
      registryWritten:false,publicationChanged:false,tagsChanged:false},null,2),{flag:'wx',mode:0o600});
    console.info(JSON.stringify({output,prepared:28,ready:readyMode?28:0,combinedCartChecks:6804,...counts}));
  } finally {vi.restoreAllMocks();vi.unstubAllGlobals();}
},30*60*1000);
