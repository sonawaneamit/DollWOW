import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { expect, it, vi } from 'vitest';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
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
import { isDollVueGroupVisible } from '@/lib/dollvue/conditionalVisibility';

// Private proposal only; no registry injection, generation, or Shopify mutation.
const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/gynoid-family-preparation';
const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const pin = z.string().regex(/^[a-f0-9]{64}$/);
const binding = z.object({ file:z.string(), sha256:pin });
const sourceSchema = z.object({index:z.number().int(),id:z.string(),handle:z.string(),brand:z.literal('Gynoid'),
  status:z.literal('DRAFT'),sourcePosition:z.number().int().min(0).max(7),sourceUrl:z.string().url(),sourceFile:z.string(),sourceSha256:pin,
  sourceBytes:z.number().int().positive(),decoded:z.object({width:z.number().positive(),height:z.number().positive()}),fingerprint:pin,
  reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false),humanReviewed:z.literal(false),parentAssistantReviewed:z.boolean(),
  parentDecision:z.enum(['approve','needs-adult-presentation-clarity','needs-alternative-source']),sourceReview:z.string(),sourceApproved:z.boolean(),finalizationBlocked:z.boolean()});
const reviewSchema = z.object({frozen:z.literal(true),revision:z.literal(3),reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false),
  humanReviewed:z.literal(false),sourceApprovalIsProvisional:z.literal(false),sourceApproved:z.literal(true),pilotsRequired:z.literal(true),
  activationApproved:z.literal(false),inputs:z.array(binding),rows:z.array(sourceSchema)});
const referenceSchema = z.object({frozen:z.literal(true),reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false),humanReviewed:z.literal(false),
  meaningApproved:z.literal(true),manifestFile:z.string(),manifestSha256:pin,contactSheets:z.array(binding),
  rows:z.array(z.object({index:z.number(),reference:z.string(),sourceFile:z.string(),sourceSha256:pin,sha256:pin,sourceBytes:z.number(),
    brand:z.string(),groupId:z.enum(['eye-color','hairstyle']),meaningApproved:z.literal(true),nonExplicit:z.literal(true),
    transferOnly:z.enum(['hair','iris color']),doNotTransfer:z.array(z.string()),
    occurrences:z.array(z.object({id:z.string(),brand:z.string(),groupId:z.string(),optionId:z.string(),label:z.string()}))}))});
type Source = z.infer<typeof sourceSchema>;
type Choice = DollVueReadinessRecord['choices'][number];
type Node = Parameters<typeof mapShopifyProduct>[0];
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
function approvedRows(rows:Source[]) {
  expect(new Set(rows.map(r=>r.id)).size).toBe(rows.length);
  return rows.filter(r=>r.parentAssistantReviewed&&r.parentDecision==='approve'&&r.sourceApproved&&!r.finalizationBlocked&&r.sourceReview==='parent-approved'&&![1,5].includes(r.index));
}
function assertRetained(result:ReturnType<typeof resolveCustomization>, requested:Choice[]) {
  for(const c of requested){
    const value=result.selections[c.groupId];expect(Array.isArray(value)?value:[value]).toContain(c.optionId);
    const option=result.selectedOptions.find(o=>o.groupId===c.groupId&&o.optionId===c.optionId);expect(option).toBeDefined();
    const attribute=result.cartAttributes.find(a=>a.key==='DollWow '+option!.groupLabel);expect(attribute).toBeDefined();
    expect(attribute!.value.split(', ')).toContain(option!.optionLabel+(option!.priceDelta?` (+$${option!.priceDelta})`:''));
  }
}
it('fails closed on hold, publication, absence and unresolved source evidence',()=>{
  const n={status:'DRAFT',publishedAt:null,hold:null,resourcePublications:{nodes:[],pageInfo:{hasNextPage:false}}};
  expect(()=>assertDraft(n,null)).not.toThrow();
  for(const bad of [{...n,hold:undefined},{...n,hold:{value:'review'}},{...n,status:'ACTIVE'},{...n,publishedAt:'today'},
    {...n,resourcePublications:{nodes:[],pageInfo:{hasNextPage:true}}},{...n,resourcePublications:{nodes:[{isPublished:true}],pageInfo:{hasNextPage:false}}}]) expect(()=>assertDraft(bad,null)).toThrow();
  expect(()=>assertDraft(n,{})).toThrow();
  const row={index:2,id:'a',parentAssistantReviewed:true,parentDecision:'approve',sourceApproved:true,finalizationBlocked:false,sourceReview:'parent-approved'} as Source;
  expect(approvedRows([row])).toHaveLength(1);
  for(const r of [{...row,parentAssistantReviewed:false},{...row,finalizationBlocked:true},{...row,sourceApproved:false},{...row,index:1},{...row,sourceReview:'pending-parent-conflict-resolution'},{...row,index:5}]) expect(approvedRows([r])).toEqual([]);
});
it('rejects dropped requested choices and missing exact cart values',()=>{
  const c={groupId:'eye-color',optionId:'no-2',reference:'/ref'};
  const result={selections:{'eye-color':'no-2'},selectedOptions:[{...c,groupLabel:'Eye Color',optionLabel:'No.2',priceDelta:0}],cartAttributes:[{key:'DollWow Eye Color',value:'No.2'}]} as unknown as ReturnType<typeof resolveCustomization>;
  expect(()=>assertRetained(result,[c])).not.toThrow();
  expect(()=>assertRetained({...result,selections:{}},[c])).toThrow();
  expect(()=>assertRetained({...result,cartAttributes:[]},[c])).toThrow();
  expect(()=>assertRetained({...result,cartAttributes:[{key:'DollWow Eye Color',value:'Factory default'}]},[c])).toThrow();
});
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',
  displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',
  material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',
  stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',
  irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
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

it.skipIf(process.env.DOLLVUE_GYNOID_READINESS!=='1')('writes a private 9-record iris-only exact-reference proposal with before/after current proof',async()=>{
  const inputs:Array<{file:string;sha256:string}>=[];
  async function evidence(file:string,expected?:string){
    const real=await fs.realpath(file);expect(real.startsWith(root+path.sep)).toBe(true);
    const bytes=await fs.readFile(real),digest=sha(bytes);if(expected)expect(digest).toBe(expected);
    inputs.push({file:real,sha256:digest});return bytes;
  }
  const reviewFile=path.join(root,'parent-source-review-9.eyes-only.frozen.json');
  const review=reviewSchema.parse(JSON.parse((await evidence(reviewFile,'8c0b53498a4ae66cf4b3f8fc40194a3d806d5d535249e2cefe57bab3eee2cad5')).toString()));
  for(const input of review.inputs)await evidence(input.file,input.sha256);
  const refFile=path.join(root,'parent-eye-reference-review.frozen.json');
  const refs=referenceSchema.parse(JSON.parse((await evidence(refFile,'fef9f25f0e5987dec4ca7c34c166f85cde527850c76c657637513e113eceea52')).toString()));
  await evidence(refs.manifestFile,refs.manifestSha256);
  for(const sheet of refs.contactSheets)await evidence(sheet.file,sheet.sha256);
  expect(refs.rows).toHaveLength(7);expect(new Set(refs.rows.map(r=>r.reference)).size).toBe(7);
  expect(refs.rows.every(r=>r.groupId==='eye-color')).toBe(true);
  for(const r of refs.rows){
    expect(r.sourceSha256).toBe(r.sha256);expect(r.reference).toBe(`/option-assets/${r.sha256}.webp`);
    expect((await evidence(r.sourceFile,r.sha256)).length).toBe(r.sourceBytes);
    expect(sha(await fs.readFile(path.join(process.cwd(),'public',r.reference)))).toBe(r.sha256);
    expect(r.transferOnly).toBe(r.groupId==='hairstyle'?'hair':'iris color');
  }
  const rows=approvedRows(review.rows);expect(rows).toHaveLength(9);
  let pilotReview: unknown;
  if(process.env.DOLLVUE_GYNOID_PILOT_REVIEW){
    const accepted=z.object({frozen:z.literal(true),reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false),
      humanReviewed:z.literal(false),decision:z.literal('PASS_MINOR_VARIATION_ACCEPTED'),pilotAccepted:z.literal(true),
      providerCalls:z.literal(1),inputs:z.array(binding)}).parse(JSON.parse((await evidence(process.env.DOLLVUE_GYNOID_PILOT_REVIEW)).toString()));
    for(const input of accepted.inputs)await evidence(input.file,input.sha256);
    expect(accepted.inputs).toContainEqual({file:path.join(root,'pilot-gynoid/iris-only.webp'),sha256:'cebb0e3f4758f3fd059ee0943789fb748a913917888faf8b5485dc5c5008d66c'});
    pilotReview=accepted;
  }
  const ids=rows.map(r=>r.id),allowed=new Set(ids);
  const registryFile='lib/dollvue/readiness-registry.json',registryBytes=await fs.readFile(registryFile);
  const registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
  expect(Object.keys(registry).length).toBeGreaterThan(0);
  for(const id of ids)expect(registry[id],`Existing registry conflict ${id}`).toBeUndefined();
  const output=process.env.DOLLVUE_GYNOID_OUTPUT||path.join(root,'reviewed-gynoid-9-eye7-record-proposal.json');
  expect(await fs.realpath(path.dirname(output))).toBe(root);
  expect(await fs.stat(output).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})).toBe(false);
  expect(hasShopifyStorefrontEnv()).toBe(true);
  const counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,remoteWrites:0};
  const native=globalThis.fetch;
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const url=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
    if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname.endsWith('/graphql.json')){
      expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query).toMatch(/^\s*query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
      expect(body.variables.ids.length).toBeGreaterThan(0);expect(body.variables.ids.length).toBeLessThanOrEqual(50);
      expect(body.variables.ids.every((id:string)=>allowed.has(id))).toBe(true);
      if(url.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
    }else if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname==='/admin/oauth/access_token'){expect(method).toBe('POST');}
    else{expect(method).toBe('GET');expect(isOwnedOptionAsset(url.href)).toBe(true);counts.imageReads++;}
    return native(input,init);
  });
  try{
    async function current(){
      const startedAt=new Date().toISOString(),nodes=new Map<string,{node:AdminNode;product:ReturnType<typeof mapped>}>();
      for(let offset=0;offset<ids.length;offset+=50){
        const chunk=ids.slice(offset,offset+50),admin=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(query,{ids:chunk});
        expect(admin.nodes).toHaveLength(chunk.length);expect(admin.shop.currencyCode).toMatch(/^[A-Z]{3}$/);
        const response=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),
          headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
          body:JSON.stringify({query:'query DraftExpansionAbsent($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids:chunk}})});
        expect(response.ok).toBe(true);const sf=await response.json();expect(sf.errors).toBeUndefined();expect(sf.data?.nodes).toEqual(chunk.map(()=>null));
        admin.nodes.forEach((n,i)=>{expect(n?.id).toBe(chunk[i]);assertDraft(n!,sf.data.nodes[i]);nodes.set(chunk[i],{node:n!,product:mapped(n!,admin.shop.currencyCode)});});
      }
      const holds=await getCurrentDollVueHolds(ids);expect(ids.map(id=>holds.get(id))).toEqual(ids.map(()=>'clear'));
      return {startedAt,checkedAt:new Date().toISOString(),nodes};
    }
    const before=await current(),verified=new Map<string,string>();
    async function verify(url:string,digest:string,optionReference=false){
      if(verified.has(url)){expect(verified.get(url)).toBe(digest);return;}
      await normalizeReviewedImage({url,sha256:digest,origin:env.NEXT_PUBLIC_SITE_URL,optionReference});verified.set(url,digest);
    }
    const records:Record<string,DollVueReadinessRecord>={},verification=[];
    for(const row of rows){
      const {product,node}=before.nodes.get(row.id)!;
      expect(product.handle).toBe(row.handle);expect(product.extended.brand).toBe(row.brand);expect(product.extended.stockStatus).toBe('custom');
      expect(isDollVueExcluded(product)).toBe(false);expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);
      expect([product.productType,...product.tags.filter(t=>t!=='catalog-review-hold')].join(' ')).not.toMatch(/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i);
      const source=productImageSources(product)[row.sourcePosition];expect(source).toBeDefined();
      expect([source.url,source.width,source.height]).toEqual([row.sourceUrl,row.decoded.width,row.decoded.height]);
      expect((await evidence(row.sourceFile,row.sourceSha256)).length).toBe(row.sourceBytes);await verify(source.url,row.sourceSha256);
      const config=dollVueConfigForProduct(product,getCustomizationConfig(product));
      expect(dollVueReadinessFingerprint(product,config)).toBe(row.fingerprint);
      const choices:Choice[]=[],digests:Record<string,string>={[source.url]:row.sourceSha256};
      for(const ref of refs.rows){
        const mappings=ref.occurrences.filter(o=>o.id===row.id);
        for(const m of mappings){
          expect(m.brand).toBe(row.brand);expect(m.groupId).toBe(ref.groupId);
          const group=config.groups.find(g=>g.id===m.groupId);expect(group).toBeDefined();
          expect(group!.visibleWhen?.length).toBeGreaterThan(0);
          expect(getDefaultSelections(config).head).toBe('no-change');
          expect(isDollVueGroupVisible(config,group!,new Set(['eye-color']))).toBe(true);
          const option=group!.options.find(o=>o.id===m.optionId);expect(option).toBeDefined();expect(option!.label).toBe(m.label);
          expect(option!.swatch).toMatchObject({kind:'image',value:ref.reference});
          if(option!.swatch?.label)expect(option!.swatch.label).toBe(m.label);
          expect(classifyAppearance(group!,option!).status).toBe('candidate');
          choices.push({groupId:m.groupId,optionId:m.optionId,reference:ref.reference});digests[ref.reference]=ref.sha256;await verify(ref.reference,ref.sha256,true);
        }
      }
      expect(new Set(choices.map(c=>c.groupId+':'+c.optionId)).size).toBe(choices.length);
      const actual=config.groups.filter(g=>g.id==='eye-color').flatMap(g=>g.options.filter(o=>classifyAppearance(g,o).status==='candidate'&&o.swatch?.kind==='image').map(o=>`${g.id}:${o.id}:${o.swatch!.value}`)).sort();
      expect(choices.map(c=>`${c.groupId}:${c.optionId}:${c.reference}`).sort()).toEqual(actual);
      const eyes=choices.filter(c=>c.groupId==='eye-color'),hair=choices.filter(c=>c.groupId==='hairstyle');
      expect(eyes).toHaveLength(7);expect(hair).toHaveLength(0);
      const record:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:row.fingerprint,status:'ready',sourcePositions:[row.sourcePosition],choices,imageDigests:digests};
      const ready=evaluateDollVueReadiness(product,config,record,{published:false,privateReview:true,contentExcluded:false});
      expect(ready).toMatchObject({ready:true,publiclyAvailable:false,privatelyAvailable:true});
      expect(reviewedDollVueConfig(config,ready,'public').groups.every(g=>g.options.every(o=>!o.dollVueEnabled))).toBe(true);
      const menu=reviewedDollVueConfig(config,ready,'private'),now=new Date(),initial=promotionPricingForSelections(product,menu,{},now).config;
      expect(menu.groups.filter(g=>g.id!=='eye-color').every(g=>g.options.every(o=>!o.dollVueEnabled))).toBe(true);
      const variant=product.variants.find(v=>v.availableForSale)||product.variants[0];expect(variant).toBeDefined();const basePrice=Number(variant.price.amount);expect(basePrice).toBeGreaterThan(0);
      function resolve(requested:Choice[]){
        if(requested.length)expect(areDollVueSelectionsValid(initial,requested)).toBe(true);
        const selections=getDefaultSelections(initial);
        for(const c of requested){expect(isOptionAvailableForCheckout(initial,c.groupId,c.optionId)).toBe(true);const g=initial.groups.find(g=>g.id===c.groupId)!;
          selections[g.id]=g.selectionMode==='multiple'?nextMultipleSelection(g.options,selections[g.id],c.optionId):c.optionId;}
        const priced=promotionPricingForSelections(product,menu,selections,now).config,result=resolveCustomization(priced,selections,basePrice);
        expect(result.issues).toEqual([]);expect(result.requiresPriceConfirmation).toBe(false);assertRetained(result,requested);expect(Number.isFinite(result.totalPrice)).toBe(true);
        return {passed:true,selections:result.selections,totalPrice:result.totalPrice,optionPriceDelta:result.optionPriceDelta,cartAttributes:result.cartAttributes};
      }
      const defaults=resolve([]),choiceChecks=choices.map(c=>({...c,...resolve([c])})),combined=[];
      for(const eye of eyes)for(const h of hair)combined.push({eyeOptionId:eye.optionId,hairOptionId:h.optionId,...resolve([eye,h])});
      records[row.id]=record;
      verification.push({id:row.id,handle:row.handle,brand:row.brand,index:row.index,draft:true,published:false,publiclyAvailable:false,privatelyAvailable:true,
        currentHold:'clear',strictStorefrontNull:true,currentSourceBytesMatch:true,sourcePosition:row.sourcePosition,sourceUrl:source.url,sourceSha256:row.sourceSha256,sourceBytes:row.sourceBytes,
        runtimeFingerprint:row.fingerprint,catalogIdentityKey:node.catalogIdentityKey?.value,catalogBodyIdentityKey:node.catalogBodyIdentityKey?.value,
        retainedHoldTags:product.tags.filter(t=>/hold/i.test(t)),assistantVisualReview:{file:reviewFile,reviewer:'parent-assistant',ownerReviewed:false},
        localDefaultValidation:defaults,localChoiceValidation:choiceChecks,combinedChecks:combined.length,localCombinedValidation:combined,merchandiseId:variant.id,currencyCode:variant.price.currencyCode});
      if(verification.length%5===0)console.info(JSON.stringify({validated:verification.length,total:rows.length}));
    }
    const after=await current();
    for(const id of ids){expect(after.nodes.get(id)!.node).toEqual(before.nodes.get(id)!.node);}
    expect(await fs.readFile(registryFile)).toEqual(registryBytes);
    for(const input of inputs)expect(sha(await fs.readFile(input.file)),input.file).toBe(input.sha256);
    await fs.writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),privateProposalOnly:true,published:false,privateReview:true,publicActivationAllowed:false,pilotsRequired:true,pilotsRun:Boolean(pilotReview),pilotAccepted:Boolean(pilotReview),pilotReview,
      sourceApprovalIsProvisional:false,sourceApproved:true,activationApproved:false,ownerReviewed:false,
      records,verification,sourceExclusions:review.rows.filter(r=>!records[r.id]),
      evidence:{inputs,registryInputSha256:sha(registryBytes),registryInputCount:Object.keys(registry).length,
        holdChecks:{productIds:ids,firstHoldCheckStartedAt:before.startedAt,firstHoldCheckedAt:before.checkedAt,lastHoldCheckStartedAt:after.startedAt,lastHoldCheckedAt:after.checkedAt,firstAllClear:true,lastAllClear:true},
        beforeAfterDraftUnpublishedStorefrontAbsent:true,referenceTransferRestrictions:refs.rows.map(r=>({reference:r.reference,sha256:r.sha256,transferOnly:r.transferOnly,doNotTransfer:r.doNotTransfer}))},
      summary:{family:'Gynoid-private-drafts-eye7',readyRecords:rows.length,defaultChecks:verification.length,choiceChecks:verification.reduce((n,r)=>n+r.localChoiceValidation.length,0),
        combinedChecks:verification.reduce((n,r)=>n+r.combinedChecks,0),verifiedUniqueImages:verified.size,...counts},registryChanged:false,publicationChanged:false},null,2),{flag:'wx',mode:0o600});
    console.info(JSON.stringify({proposal:output,records:rows.length,...counts}));
  }finally{vi.unstubAllGlobals();}
},30*60*1000);
