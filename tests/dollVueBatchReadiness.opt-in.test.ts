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

// Opt in with DOLLVUE_BATCH_READINESS=1. All paths are absolute/private:
// DOLLVUE_BATCH_MANIFEST, DOLLVUE_BATCH_REVIEWS (JSON array of file paths),
// DOLLVUE_BATCH_OUTPUT (new JSON file), DOLLVUE_BATCH_INCLUDE_HAIR=1 (optional).
// DOLLVUE_BATCH_FAMILY=WM14 (default), SE4, YL14, AngelkissHAIR15, or WMHAIR15.
// SE4 never permits hair; both HAIR15 families require INCLUDE_HAIR=1 and exclude eyes.
// 6YE_EYE3 / HR_EYE3 forbid hair and require DOLLVUE_BATCH_REFERENCE_EVIDENCE
// pointing to frozen private assistant-reviewed evidence for the fixed three iris references.
// EYE3 accepts a full mixed-brand manifest; every row needs a decision before brand scoping.
// Manifest: {rows:[{id,handle,status:'ACTIVE',sourcePosition:0..7,sourceUrl,
// sourceFile,sourceSha256,sourceBytes,decoded:{width,height},fingerprint}]}.
// Each review file: {reviewer:{role:'assistant',name:'Euclid'|'Beauvoir'|...},
// decisions:[{id,sourcePosition:0..7,sourceUrl,sourceSha256,
// verdict:'PASS_ADULT_NON_EXPLICIT_SOURCE'|'EXCLUDE'|'HOLD',reason}]}.
// Every row needs a byte-bound decision; there is no candidate-to-approval fallback.
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const pin = z.string().regex(/^[a-f0-9]{64}$/);
const identity = { id:z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/), sourcePosition:z.number().int().min(0).max(7),
  sourceUrl:z.string().url(), sourceSha256:pin };
const manifestSchema = z.object({rows:z.array(z.object({...identity,handle:z.string().min(1),status:z.literal('ACTIVE'),
  brand:z.string().optional(),
  sourceFile:z.string().min(1),sourceBytes:z.number().int().positive(),fingerprint:pin,
  decoded:z.object({width:z.number().int().positive(),height:z.number().int().positive()}),
})).min(1)});
const reviewSchema = z.object({reviewer:z.object({role:z.literal('assistant'),name:z.string().min(1)}),
  decisions:z.array(z.object({...identity,verdict:z.enum(['PASS_ADULT_NON_EXPLICIT_SOURCE','EXCLUDE','HOLD']),reason:z.string().min(1)})).min(1)});
// Existing reviewer evidence is consumed unchanged, including its manifest pin.
const sourceReviewSchema = z.object({reviewer:z.literal('assistant'),ownerReviewed:z.literal(false),
  manifest:z.object({file:z.string(),sha256:pin}),
  rows:z.array(z.object({...identity,handle:z.string().min(1),reviewer:z.literal('assistant'),ownerReviewed:z.literal(false),
    decision:z.enum(['approve','needsalternative','needsadultpresentationclarity']),reason:z.string().min(1)})).min(1)});
type Choice = DollVueReadinessRecord['choices'][number];
type Node = Parameters<typeof mapShopifyProduct>[0];
const eye3References = [
  {optionId:'blue',label:'Blue',sha256:'5d0d14251992d753a5f73b4cdee66b12c07bad149ab935490d84bcaf5c4e6bb0'},
  {optionId:'brown',label:'Brown',sha256:'117c6ec3a9ba4343a0aa4a078961aa8dce12d740f156a4dba95b081219225074'},
  {optionId:'green',label:'Green',sha256:'006702359260e1fd300c875cdb64bb59d622bde03043d0922829681b842d1265'},
].map(r=>({...r,groupId:'eye-color',url:`/option-assets/${r.sha256}.webp`}));
const evidenceFileSchema=z.object({file:z.string().min(1),sha256:pin});
const eye3EvidenceSchema=z.object({
  family:z.literal('6YE-HR-eye3'),frozen:z.literal(true),privateEvidenceOnly:z.literal(true),
  status:z.literal('parent-assistant-reference-meaning-accepted'),reviewer:z.literal('parent-assistant'),
  ownerReviewed:z.literal(false),humanApproval:z.literal(false),
  sourceFamilyInventory:evidenceFileSchema,reviewedContactSheet:evidenceFileSchema,
  references:z.array(z.object({groupId:z.literal('eye-color'),optionId:z.enum(['blue','brown','green']),
    label:z.string(),url:z.string(),sha256:pin,cachedFile:z.string().min(1),
    meaning:z.object({attribute:z.literal('eye-color'),property:z.literal('visible iris color only'),
      label:z.string(),accepted:z.literal(true),visualMeaningVerified:z.literal(true),
      reviewer:z.literal('parent-assistant'),ownerReviewed:z.literal(false)}),
  })).length(3),
  constraints:z.object({sourcePhotoApprovalGranted:z.literal(false),generatedFidelityApprovalGranted:z.literal(false),
    readinessApprovalGranted:z.literal(false),registryChanged:z.literal(false),publicationChanged:z.literal(false)}),
});
function parseEye3Evidence(raw:unknown) {
  const evidence=eye3EvidenceSchema.parse(raw);
  expect(evidence.references.map(({groupId,optionId,label,url,sha256})=>({groupId,optionId,label,url,sha256})))
    .toEqual(eye3References);
  for(const ref of evidence.references) expect(ref.meaning.label).toBe(ref.label);
  return evidence;
}
const families = {
  WM14:{seedProductId:'gid://shopify/Product/10431698337976',brand:'WM Dolls',
    eyeIds:[1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n=>`no-${n}`),allowHair:true},
  SE4:{seedProductId:'gid://shopify/Product/10433981612216',brand:'SE Doll',
    eyeIds:['handmade-01','handmade-02','handmade-03','handmade-04'],allowHair:false},
  YL14:{seedProductId:'gid://shopify/Product/10431698337976',brand:'YL Dolls',
    eyeIds:[1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n=>`no-${n}`),allowHair:true},
  AngelkissHAIR15:{seedProductId:'gid://shopify/Product/10431698337976',brand:'Angelkiss',
    eyeIds:[] as string[],allowHair:true},
  WMHAIR15:{seedProductId:'gid://shopify/Product/10431698337976',brand:'WM Dolls',
    eyeIds:[] as string[],allowHair:true},
  '6YE_EYE3':{seedProductId:null,brand:'6YE Dolls',eyeIds:['blue','brown','green'],allowHair:false},
  HR_EYE3:{seedProductId:null,brand:'HR Dolls',eyeIds:['blue','brown','green'],allowHair:false},
};
const familySchema = z.enum(['WM14','SE4','YL14','AngelkissHAIR15','WMHAIR15','6YE_EYE3','HR_EYE3']);
type SourceRow = z.infer<typeof manifestSchema>['rows'][number];
function scopeReviewedRows(rows:SourceRow[],reviewedIds:Iterable<string>,name:z.infer<typeof familySchema>) {
  expect([...reviewedIds].sort(),'All manifest rows require explicit decisions before scoping')
    .toEqual(rows.map(row=>row.id).sort());
  if(name!=='6YE_EYE3'&&name!=='HR_EYE3') return {scopedRows:rows,outsideScope:[] as SourceRow[]};
  for(const row of rows) z.enum(['6YE Dolls','HR Dolls']).parse(row.brand);
  return {scopedRows:rows.filter(row=>row.brand===families[name].brand),
    outsideScope:rows.filter(row=>row.brand!==families[name].brand)};
}
function familyChoices(name:z.infer<typeof familySchema>,includeHair:boolean,seedChoices:Choice[],referenceEvidence?:unknown) {
  const family=families[name];
  expect(!includeHair||family.allowHair,'This family is eyes-only; hair is not authorized').toBe(true);
  const hairOnly=name==='AngelkissHAIR15'||name==='WMHAIR15';
  expect(!hairOnly||includeHair,'HAIR15 families require INCLUDE_HAIR=1').toBe(true);
  if(family.seedProductId===null) {
    const evidence=parseEye3Evidence(referenceEvidence);
    const eyes=evidence.references.map(r=>({groupId:r.groupId,optionId:r.optionId,reference:r.url}));
    return {eyes,hair:[] as Choice[],choices:eyes};
  }
  const eyes=hairOnly?[]:seedChoices.filter(c=>c.groupId==='eye-color');
  expect(eyes.map(c=>c.optionId)).toEqual(family.eyeIds);
  const seedHair=includeHair?seedChoices.filter(c=>c.groupId==='hairstyle'):[];
  if(includeHair) expect(seedHair.map(c=>c.optionId)).toEqual(Array.from({length:15},(_,i)=>`no-${i+1}`));
  const hair=name==='AngelkissHAIR15'?seedHair.map((c,i)=>({...c,optionId:`hairstyle-${i+1}`})):seedHair;
  return {eyes,hair,choices:[...eyes,...hair]};
}
function assertSourceBinding(row:z.infer<typeof reviewSchema>['decisions'][number] | SourceRow,
  decision:z.infer<typeof reviewSchema>['decisions'][number]) {
  const schema=z.object(identity);
  expect(schema.parse(decision)).toEqual(schema.parse(row));
}
function reviewedSource(sources:ReturnType<typeof productImageSources>,row:SourceRow) {
  identity.sourcePosition.parse(row.sourcePosition);
  const source=sources[row.sourcePosition];
  expect(source,`Missing reviewed gallery position ${row.sourcePosition}`).toBeDefined();
  expect([source.url,source.width,source.height]).toEqual([row.sourceUrl,row.decoded.width,row.decoded.height]);
  return {source,sourcePositions:[row.sourcePosition],imageDigests:{[source.url]:row.sourceSha256}};
}
function assertSourceBytes(bytes:Buffer,row:SourceRow) {
  expect(bytes.length).toBe(row.sourceBytes);
  expect(sha(bytes)).toBe(row.sourceSha256);
}
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
it('rejects dropped batch choices and missing cart attributes for single and combined selections',()=>{
  const requested=[{groupId:'eye-color',optionId:'no-2'},{groupId:'hairstyle',optionId:'no-8'}];
  const result={selections:{'eye-color':'no-2',hairstyle:'no-8'},selectedOptions:requested.map((choice,index)=>({
    ...choice,groupLabel:index?'Hairstyle':'Eye Color',optionLabel:index?'No.8':'No.2',priceDelta:0,priceConfirmed:true,
  })),cartAttributes:[{key:'DollWow Eye Color',value:'No.2'},{key:'DollWow Hairstyle',value:'No.8'}]};
  for(const choices of [[requested[0]],requested]) {
    expect(()=>assertRequestedChoicesRetained(result,choices)).not.toThrow();
    expect(()=>assertRequestedChoicesRetained({...result,selections:{...result.selections,'eye-color':'no-change'}},choices)).toThrow();
    expect(()=>assertRequestedChoicesRetained({...result,cartAttributes:result.cartAttributes.slice(1)},choices)).toThrow();
    expect(()=>assertRequestedChoicesRetained({...result,cartAttributes:[{key:'DollWow Eye Color',value:'Factory default'},result.cartAttributes[1]]},choices)).toThrow();
  }
});
const sourceFixtureBytes=Buffer.from('offline reviewed source');
function sourceFixture(position=0):SourceRow {
  return {id:'gid://shopify/Product/123',handle:'reviewed-source',status:'ACTIVE',sourcePosition:position,
    sourceUrl:`https://example.test/source-${position}.jpg`,sourceSha256:sha(sourceFixtureBytes),
    sourceFile:'/private/source.jpg',sourceBytes:sourceFixtureBytes.length,fingerprint:'a'.repeat(64),
    decoded:{width:800,height:1200}};
}
function decisionFixture(row:SourceRow):z.infer<typeof reviewSchema>['decisions'][number] {
  return {...row,verdict:'PASS_ADULT_NON_EXPLICIT_SOURCE',reason:'Offline fixture only'};
}
it.each([0,7])('accepts gallery position %i in manifest and both review formats',(position)=>{
  const row=sourceFixture(position);
  expect(manifestSchema.parse({rows:[row]}).rows[0].sourcePosition).toBe(position);
  expect(reviewSchema.parse({reviewer:{role:'assistant',name:'test'},decisions:[decisionFixture(row)]})
    .decisions[0].sourcePosition).toBe(position);
  expect(sourceReviewSchema.parse({reviewer:'assistant',ownerReviewed:false,
    manifest:{file:'/private/manifest.json',sha256:'b'.repeat(64)},
    rows:[{...row,reviewer:'assistant',ownerReviewed:false,decision:'approve',reason:'Offline fixture only'}]})
    .rows[0].sourcePosition).toBe(position);
});
it.each([-1,8,0.5,'1',undefined])('rejects invalid gallery position %s in every input format',(sourcePosition)=>{
  const row={...sourceFixture(),sourcePosition};
  expect(manifestSchema.safeParse({rows:[row]}).success).toBe(false);
  expect(reviewSchema.safeParse({reviewer:{role:'assistant',name:'test'},
    decisions:[{...decisionFixture(sourceFixture()),sourcePosition}]}).success).toBe(false);
  expect(sourceReviewSchema.safeParse({reviewer:'assistant',ownerReviewed:false,
    manifest:{file:'/private/manifest.json',sha256:'b'.repeat(64)},
    rows:[{...row,reviewer:'assistant',ownerReviewed:false,decision:'approve',reason:'Offline fixture only'}]}).success).toBe(false);
});
it('rejects mismatched review ID, gallery position, URL, or hash',()=>{
  const row=sourceFixture(7),decision=decisionFixture(row);
  expect(()=>assertSourceBinding(row,decision)).not.toThrow();
  for(const changed of [{id:'gid://shopify/Product/124'},{sourcePosition:0},
    {sourceUrl:'https://example.test/other.jpg'},{sourceSha256:'c'.repeat(64)}]) {
    expect(()=>assertSourceBinding(row,{...decision,...changed})).toThrow();
  }
});
it.each([0,7])('retains exact source position %i and its pin without source-zero fallback',(position)=>{
  const sources=Array.from({length:8},(_,i)=>({url:sourceFixture(i).sourceUrl,altText:'Offline fixture',width:800,height:1200}));
  const row=sourceFixture(position),selected=reviewedSource(sources,row);
  expect(selected.source).toBe(sources[position]);
  expect(selected.sourcePositions).toEqual([position]);
  expect(selected.imageDigests).toEqual({[row.sourceUrl]:row.sourceSha256});
  expect(()=>assertSourceBytes(sourceFixtureBytes,row)).not.toThrow();
  expect(()=>assertSourceBytes(Buffer.from('wrong bytes'),row)).toThrow();
  expect(()=>assertSourceBytes(Buffer.alloc(sourceFixtureBytes.length),row)).toThrow();
  expect(()=>reviewedSource(sources.slice(0,position),row)).toThrow();
  expect(()=>reviewedSource(sources,{...row,sourceUrl:'https://example.test/wrong.jpg'})).toThrow();
  expect(()=>reviewedSource(sources,{...row,decoded:{width:801,height:1200}})).toThrow();
  expect(()=>reviewedSource(sources,{...row,decoded:{width:800,height:1201}})).toThrow();
});
const wmChoiceFixture:Choice[]=[
  ...families.WM14.eyeIds.map(optionId=>({groupId:'eye-color',optionId,reference:`/option-assets/eye-${optionId}.webp`})),
  ...Array.from({length:15},(_,i)=>({groupId:'hairstyle',optionId:`no-${i+1}`,reference:`/option-assets/hair-${i+1}.webp`})),
];
it('maps AngelkissHAIR15 to the 15 reviewed hair references only and requires the hair flag',()=>{
  const result=familyChoices('AngelkissHAIR15',true,wmChoiceFixture);
  expect(families.AngelkissHAIR15.brand).toBe('Angelkiss');
  expect(families.AngelkissHAIR15.seedProductId).toBe(families.WM14.seedProductId);
  expect(result.eyes).toEqual([]);
  expect(result.choices).toEqual(wmChoiceFixture.filter(c=>c.groupId==='hairstyle')
    .map((c,i)=>({...c,optionId:`hairstyle-${i+1}`})));
  expect(result.choices.every(c=>c.groupId==='hairstyle')).toBe(true);
  expect(()=>familyChoices('AngelkissHAIR15',false,wmChoiceFixture)).toThrow();
  expect(()=>familyChoices('AngelkissHAIR15',true,wmChoiceFixture.slice(0,-1))).toThrow();
  expect(()=>familyChoices('AngelkissHAIR15',true,wmChoiceFixture.map(c=>
    c.groupId==='hairstyle'&&c.optionId==='no-1'?{...c,optionId:'no-2'}:c))).toThrow();
  expect(wmChoiceFixture.find(c=>c.groupId==='hairstyle')!.optionId).toBe('no-1');
});
it('keeps WMHAIR15 hair-only with exact seed IDs even when no eye family matches',()=>{
  const hair=wmChoiceFixture.filter(c=>c.groupId==='hairstyle');
  expect(familySchema.parse('WMHAIR15')).toBe('WMHAIR15');
  expect(families.WMHAIR15.brand).toBe('WM Dolls');
  expect(families.WMHAIR15.seedProductId).toBe(families.WM14.seedProductId);
  for(const seed of [wmChoiceFixture,hair,[...hair,{groupId:'eye-color',optionId:'unrelated',reference:'/option-assets/unrelated.webp'}]]) {
    expect(familyChoices('WMHAIR15',true,seed)).toEqual({eyes:[],hair,choices:hair});
  }
  expect(()=>familyChoices('WMHAIR15',false,wmChoiceFixture)).toThrow();
  expect(()=>familyChoices('WMHAIR15',true,hair.slice(1))).toThrow();
  expect(()=>familyChoices('WMHAIR15',true,[...hair,hair[0]])).toThrow();
  expect(()=>familyChoices('WMHAIR15',true,hair.map((c,i)=>({...c,optionId:`hairstyle-${i+1}`})))).toThrow();
});
it.each(['WM14','YL14'] as const)('preserves %s eyes and optional hair',(name)=>{
  expect(familyChoices(name,true,wmChoiceFixture).choices).toEqual(wmChoiceFixture);
  expect(familyChoices(name,false,wmChoiceFixture).choices).toEqual(wmChoiceFixture.filter(c=>c.groupId==='eye-color'));
});
it('preserves SE4 eyes-only choices and rejects hair',()=>{
  const choices=families.SE4.eyeIds.map(optionId=>({groupId:'eye-color',optionId,reference:`/option-assets/${optionId}.webp`}));
  expect(familyChoices('SE4',false,choices).choices).toEqual(choices);
  expect(()=>familyChoices('SE4',true,choices)).toThrow();
});
function eye3EvidenceFixture() {
  return {family:'6YE-HR-eye3',frozen:true,privateEvidenceOnly:true,
    status:'parent-assistant-reference-meaning-accepted',reviewer:'parent-assistant',ownerReviewed:false,humanApproval:false,
    sourceFamilyInventory:{file:'/private/inventory.json',sha256:'a'.repeat(64)},
    reviewedContactSheet:{file:'/private/references.png',sha256:'b'.repeat(64)},
    references:eye3References.map(r=>({...r,cachedFile:`/private/${r.optionId}.webp`,
      meaning:{attribute:'eye-color',property:'visible iris color only',label:r.label,accepted:true,
        visualMeaningVerified:true,reviewer:'parent-assistant',ownerReviewed:false}})),
    constraints:{sourcePhotoApprovalGranted:false,generatedFidelityApprovalGranted:false,
      readinessApprovalGranted:false,registryChanged:false,publicationChanged:false}};
}
it.each(['6YE_EYE3','HR_EYE3'] as const)('requires frozen exact references for %s without a seed or hair',(name)=>{
  expect(families[name].seedProductId).toBeNull();
  expect(families[name].brand).toBe(name==='6YE_EYE3'?'6YE Dolls':'HR Dolls');
  const result=familyChoices(name,false,[],eye3EvidenceFixture());
  expect(result.choices).toEqual(eye3References.map(r=>({groupId:r.groupId,optionId:r.optionId,reference:r.url})));
  expect(result.hair).toEqual([]);
  expect(()=>familyChoices(name,true,[],eye3EvidenceFixture())).toThrow();
  expect(()=>familyChoices(name,false,wmChoiceFixture)).toThrow();
});
it('rejects unfrozen, unaccepted, wrong-family or human-attributed EYE3 evidence',()=>{
  for(const changed of [{frozen:false},{frozen:undefined},{family:'WM14'},{status:'pending'},
    {reviewer:'user'},{ownerReviewed:true},{humanApproval:true}]) {
    expect(()=>parseEye3Evidence({...eye3EvidenceFixture(),...changed})).toThrow();
  }
});
it('rejects missing, duplicate, extra, swapped or changed EYE3 reference mappings',()=>{
  const evidence=eye3EvidenceFixture(),refs=evidence.references;
  for(const references of [refs.slice(1),[refs[0],refs[0],refs[2]],[...refs,refs[0]],
    [refs[1],refs[0],refs[2]],
    refs.map((r,i)=>i===0?{...r,label:'Brown'}:r),
    refs.map((r,i)=>i===0?{...r,url:refs[1].url}:r),
    refs.map((r,i)=>i===0?{...r,sha256:'c'.repeat(64)}:r),
    refs.map((r,i)=>i===0?{...r,groupId:'hairstyle'}:r),
    refs.map((r,i)=>i===0?{...r,meaning:{...r.meaning,accepted:false}}:r),
    refs.map((r,i)=>i===0?{...r,meaning:{...r.meaning,label:'Brown'}}:r)]) {
    expect(()=>parseEye3Evidence({...evidence,references})).toThrow();
  }
  expect(()=>parseEye3Evidence({...evidence,constraints:{...evidence.constraints,sourcePhotoApprovalGranted:true}})).toThrow();
});
it.each(['6YE_EYE3','HR_EYE3'] as const)('scopes %s only after the entire mixed manifest is reviewed',(name)=>{
  const rows:SourceRow[]=[{...sourceFixture(),brand:'6YE Dolls'},
    {...sourceFixture(),id:'gid://shopify/Product/124',handle:'hr-source',brand:'HR Dolls'}];
  const ids=rows.map(row=>row.id);
  const result=scopeReviewedRows(rows,ids,name);
  expect(result.scopedRows).toEqual(rows.filter(row=>row.brand===families[name].brand));
  expect(result.outsideScope).toEqual(rows.filter(row=>row.brand!==families[name].brand));
  // Even a missing decision for the other brand must block finalization.
  expect(()=>scopeReviewedRows(rows,result.scopedRows.map(row=>row.id),name)).toThrow();
  expect(()=>scopeReviewedRows(rows,[...ids,'gid://shopify/Product/125'],name)).toThrow();
  expect(()=>scopeReviewedRows(rows.map(row=>({...row,brand:undefined})),ids,name)).toThrow();
  expect(()=>scopeReviewedRows(rows.map(row=>({...row,brand:'WM Dolls'})),ids,name)).toThrow();
  expect(manifestSchema.parse({rows}).rows.map(row=>row.brand)).toEqual(['6YE Dolls','HR Dolls']);
});
it('keeps existing families unfiltered, including manifests without brand metadata',()=>{
  const rows=[sourceFixture()];
  for(const name of ['WM14','SE4','YL14','AngelkissHAIR15'] as const) {
    expect(scopeReviewedRows(rows,rows.map(row=>row.id),name)).toEqual({scopedRows:rows,outsideScope:[]});
  }
});
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

it.skipIf(process.env.DOLLVUE_BATCH_READINESS !== '1')('finalizes only explicitly assistant-reviewed source bytes using bulk current reads', async () => {
  const privateRoot = await fs.realpath('/Volumes/Extreme Pro/Projects/DollWOW/data/exports');
  async function privateInput(file: string) {
    expect(path.isAbsolute(file)).toBe(true);
    const real = await fs.realpath(file);
    expect(real.startsWith(privateRoot + path.sep)).toBe(true);
    return real;
  }
  const manifestPath = await privateInput(process.env.DOLLVUE_BATCH_MANIFEST || '');
  const reviewPaths = z.array(z.string()).min(1).parse(JSON.parse(process.env.DOLLVUE_BATCH_REVIEWS || '[]'));
  const output = process.env.DOLLVUE_BATCH_OUTPUT || '';
  expect(path.isAbsolute(output)).toBe(true);
  const outputDir = await fs.realpath(path.dirname(output));
  expect(outputDir.startsWith(privateRoot + path.sep)).toBe(true);
  expect(await fs.lstat(output).then(()=>true, error=>{if(error.code==='ENOENT') return false; throw error;})).toBe(false);
  expect(['0','1',undefined]).toContain(process.env.DOLLVUE_BATCH_INCLUDE_HAIR);
  const includeHair = process.env.DOLLVUE_BATCH_INCLUDE_HAIR === '1';
  const familyName=familySchema.parse(process.env.DOLLVUE_BATCH_FAMILY || 'WM14');
  const family=families[familyName];
  expect(!includeHair||family.allowHair,'This family is eyes-only; hair is not authorized').toBe(true);
  expect(!['AngelkissHAIR15','WMHAIR15'].includes(familyName)||includeHair,'HAIR15 families require INCLUDE_HAIR=1').toBe(true);
  const manifestBytes = await fs.readFile(manifestPath);
  const {rows} = manifestSchema.parse(JSON.parse(manifestBytes.toString()));
  expect(new Set(rows.map(row=>row.id)).size).toBe(rows.length);
  expect(new Set(rows.map(row=>row.handle)).size).toBe(rows.length);
  const reviews = new Map<string, {file:string;reviewer:string;decision:z.infer<typeof reviewSchema>['decisions'][number]}>();
  const inputs = [{file:manifestPath,sha256:sha(manifestBytes)}];
  for (const requested of reviewPaths) {
    const file = await privateInput(requested), bytes = await fs.readFile(file);
    inputs.push({file,sha256:sha(bytes)});
    const raw:unknown = JSON.parse(bytes.toString());
    const native = sourceReviewSchema.safeParse(raw);
    let review:z.infer<typeof reviewSchema>;
    if(native.success) {
      expect(await privateInput(native.data.manifest.file)).toBe(manifestPath);
      expect(native.data.manifest.sha256).toBe(sha(manifestBytes));
      const verdicts = {approve:'PASS_ADULT_NON_EXPLICIT_SOURCE',needsalternative:'EXCLUDE',needsadultpresentationclarity:'HOLD'} as const;
      for(const decision of native.data.rows) expect(rows.find(row=>row.id===decision.id)?.handle).toBe(decision.handle);
      review = {reviewer:{role:'assistant',name:'assistant'},decisions:native.data.rows.map(row=>({
        id:row.id,sourcePosition:row.sourcePosition,sourceUrl:row.sourceUrl,sourceSha256:row.sourceSha256,
        verdict:verdicts[row.decision],reason:row.reason,
      }))};
    } else {
      // No permissive rows/decision fallback: unknown native schemas fail validation.
      review = reviewSchema.parse(raw);
    }
    for (const decision of review.decisions) {
      const row = rows.find(row=>row.id===decision.id);
      expect(row,`Unknown reviewed ID ${decision.id}`).toBeDefined();
      expect(reviews.has(decision.id),`Duplicate/conflicting decision ${decision.id}`).toBe(false);
      assertSourceBinding(row!,decision);
      reviews.set(decision.id,{file,reviewer:review.reviewer.name,decision});
    }
  }
  expect(reviews.size,'All manifest rows require explicit decisions').toBe(rows.length);
  const {scopedRows,outsideScope}=scopeReviewedRows(rows,reviews.keys(),familyName);
  const approved = scopedRows.filter(row=>reviews.get(row.id)!.decision.verdict==='PASS_ADULT_NON_EXPLICIT_SOURCE');
  expect(approved.length).toBeGreaterThan(0);
  const registryBytes = await fs.readFile('lib/dollvue/readiness-registry.json');
  const registry = JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
  const seed = family.seedProductId===null?undefined:registry[family.seedProductId];
  let referenceEvidence:z.infer<typeof eye3EvidenceSchema>|undefined;
  let referenceEvidenceFile:string|undefined;
  if(family.seedProductId===null) {
    referenceEvidenceFile=await privateInput(process.env.DOLLVUE_BATCH_REFERENCE_EVIDENCE || '');
    const bytes=await fs.readFile(referenceEvidenceFile);
    referenceEvidence=parseEye3Evidence(JSON.parse(bytes.toString()));
    inputs.push({file:referenceEvidenceFile,sha256:sha(bytes)});
    const boundFiles=[referenceEvidence.sourceFamilyInventory,referenceEvidence.reviewedContactSheet,
      ...referenceEvidence.references.map(r=>({file:r.cachedFile,sha256:r.sha256}))];
    for(const bound of boundFiles) {
      const file=await privateInput(bound.file);
      expect(sha(await fs.readFile(file)),`Changed reference evidence: ${file}`).toBe(bound.sha256);
      inputs.push({file,sha256:bound.sha256});
    }
  } else expect(seed?.status).toBe('ready');
  const {eyes,hair,choices}=familyChoices(familyName,includeHair,seed?.choices || [],referenceEvidence);
  const ids = approved.map(row=>row.id);
  for(const id of ids) expect(registry[id],`Existing registry entry ${id}; never replace implicitly`).toBeUndefined();
  const allowedIds = new Set([...ids,...(seed?[seed.productId]:[])]);
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
    if(seed) {
      const seedProduct = mapShopifyProduct(nodes.get(seed.productId)!);
      const seedConfig = dollVueConfigForProduct(seedProduct,getCustomizationConfig(seedProduct));
      expect(dollVueReadinessFingerprint(seedProduct,seedConfig)).toBe(seed.fingerprint);
    }
    const verified = new Map<string,string>();
    async function verify(url:string,hash:string,optionReference=false) {
      pin.parse(hash);
      if(verified.has(url)) {expect(verified.get(url)).toBe(hash);return;}
      await normalizeReviewedImage({url,sha256:hash,origin:env.NEXT_PUBLIC_SITE_URL,optionReference});
      verified.set(url,hash);
    }
    const referencePins:Record<string,string> = {};
    for(const choice of choices) {
      const hash=referenceEvidence?referenceEvidence.references.find(r=>r.url===choice.reference)!.sha256:seed!.imageDigests![choice.reference];
      await verify(choice.reference,hash,true);referencePins[choice.reference]=hash;
    }
    const records:Record<string,DollVueReadinessRecord> = {}, verification = [];
    for(const row of approved) {
      const product = mapShopifyProduct(nodes.get(row.id)!);
      expect(product.handle).toBe(row.handle);
      expect(isCustomerVisibleProduct(product)).toBe(true); expect(isDollVueExcluded(product)).toBe(false);
      expect(product.extended.brand).toBe(family.brand); expect(product.extended.stockStatus).toBe('custom');
      expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);
      expect([product.productType,...product.tags].join(' ')).not.toMatch(/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i);
      const {source,sourcePositions,imageDigests}=reviewedSource(productImageSources(product),row);
      const bytes=await fs.readFile(await privateInput(row.sourceFile));
      assertSourceBytes(bytes,row);
      await verify(source.url,row.sourceSha256);
      const config=dollVueConfigForProduct(product,getCustomizationConfig(product));
      const fingerprint=dollVueReadinessFingerprint(product,config);
      expect(fingerprint,`Changed menu/source identity ${row.handle}`).toBe(row.fingerprint);
      if(referenceEvidence) {
        const group=config.groups.find(g=>g.id==='eye-color');
        expect(group?.selectionMode).toBe('single');
        expect(group?.options.filter(o=>classifyAppearance(group,o).status==='candidate')
          .map(o=>({optionId:o.id,label:o.label,reference:o.swatch?.value})))
          .toEqual(eye3References.map(r=>({optionId:r.optionId,label:r.label,reference:r.url})));
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
        return {passed:true,selections:result.selections,totalPrice:result.totalPrice,optionPriceDelta:result.optionPriceDelta,cartAttributes:result.cartAttributes};
      }
      const defaults=resolve([]), choiceChecks=choices.map(c=>({groupId:c.groupId,optionId:c.optionId,...resolve([c])}));
      let combinedChecks=0; for(const eye of eyes) for(const h of hair) {resolve([eye,h]);combinedChecks++;}
      records[row.id]=record;
      verification.push({id:row.id,handle:row.handle,draft:false,sourcePosition:row.sourcePosition,sourceUrl:source.url,sourceSha256:row.sourceSha256,
        sourceBytes:row.sourceBytes,currentHold:'clear',strictStorefrontIdentity:true,currentSourceBytesMatch:true,
        runtimeFingerprint:fingerprint,assistantVisualReview:reviews.get(row.id),localDefaultValidation:defaults,
        localChoiceValidation:choiceChecks,combinedChecks,merchandiseId:variant.id,currencyCode:variant.price.currencyCode});
      if(verification.length%10===0) console.info(JSON.stringify({validated:verification.length,total:approved.length}));
    }
    const lastHoldCheckStartedAt = new Date().toISOString();
    const finalHolds = await getCurrentDollVueHolds(readIds);
    const lastHoldCheckedAt = new Date().toISOString();
    expect(readIds.map(id=>finalHolds.get(id))).toEqual(readIds.map(()=>'clear'));
    expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);
    for(const input of inputs) expect(sha(await fs.readFile(input.file)),`Evidence changed during finalization: ${input.file}`).toBe(input.sha256);
    await fs.writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),privateProposalOnly:true,records,verification,
      reviewDecision:{reviewer:'assistant',scope:'Explicit byte-bound gallery-position decisions only (0..7)'},
      evidence:{inputs,registryInputSha256:sha(registryBytes),
        ...(seed?{seedProductId:seed.productId}:{referenceEvidenceFile,referenceFamily:'6YE-HR-eye3'}),
        holdChecks:{productIds:readIds,firstHoldCheckStartedAt,firstHoldCheckedAt,lastHoldCheckStartedAt,lastHoldCheckedAt,
          firstAllClear:true,lastAllClear:true}},
      sourceExclusions:scopedRows.filter(row=>!records[row.id]).map(row=>({id:row.id,handle:row.handle,...reviews.get(row.id)})),
      outsideScope:outsideScope.map(row=>({id:row.id,handle:row.handle,brand:row.brand,
        reason:'Outside selected exact-brand family; not a source exclusion',...reviews.get(row.id)})),
      summary:{family:familyName,readyRecords:approved.length,eyesPerRecord:eyes.length,hairPerRecord:hair.length,verifiedUniqueImages:verified.size,...counts},
      registryChanged:false,publicationChanged:false},null,2),{mode:0o600,flag:'wx'});
  } finally {vi.unstubAllGlobals();}
},30 * 60 * 1000);
