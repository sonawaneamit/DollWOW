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
// DOLLVUE_BATCH_FAMILY=WM14 (default), SE4, YL14, or AngelkissHAIR15.
// SE4 never permits hair; AngelkissHAIR15 requires INCLUDE_HAIR=1 and excludes eyes.
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
const families = {
  WM14:{seedProductId:'gid://shopify/Product/10431698337976',brand:'WM Dolls',
    eyeIds:[1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n=>`no-${n}`),allowHair:true},
  SE4:{seedProductId:'gid://shopify/Product/10433981612216',brand:'SE Doll',
    eyeIds:['handmade-01','handmade-02','handmade-03','handmade-04'],allowHair:false},
  YL14:{seedProductId:'gid://shopify/Product/10431698337976',brand:'YL Dolls',
    eyeIds:[1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n=>`no-${n}`),allowHair:true},
  AngelkissHAIR15:{seedProductId:'gid://shopify/Product/10431698337976',brand:'Angelkiss',
    eyeIds:[] as string[],allowHair:true},
};
const familySchema = z.enum(['WM14','SE4','YL14','AngelkissHAIR15']);
type SourceRow = z.infer<typeof manifestSchema>['rows'][number];
function familyChoices(name:z.infer<typeof familySchema>,includeHair:boolean,seedChoices:Choice[]) {
  const family=families[name];
  expect(!includeHair||family.allowHair,'SE4 is eyes-only; hair is not authorized').toBe(true);
  expect(name!=='AngelkissHAIR15'||includeHair,'AngelkissHAIR15 requires INCLUDE_HAIR=1').toBe(true);
  const eyes=name==='AngelkissHAIR15'?[]:seedChoices.filter(c=>c.groupId==='eye-color');
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
it.each(['WM14','YL14'] as const)('preserves %s eyes and optional hair',(name)=>{
  expect(familyChoices(name,true,wmChoiceFixture).choices).toEqual(wmChoiceFixture);
  expect(familyChoices(name,false,wmChoiceFixture).choices).toEqual(wmChoiceFixture.filter(c=>c.groupId==='eye-color'));
});
it('preserves SE4 eyes-only choices and rejects hair',()=>{
  const choices=families.SE4.eyeIds.map(optionId=>({groupId:'eye-color',optionId,reference:`/option-assets/${optionId}.webp`}));
  expect(familyChoices('SE4',false,choices).choices).toEqual(choices);
  expect(()=>familyChoices('SE4',true,choices)).toThrow();
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
  expect(!includeHair||family.allowHair,'SE4 is eyes-only; hair is not authorized').toBe(true);
  expect(familyName!=='AngelkissHAIR15'||includeHair,'AngelkissHAIR15 requires INCLUDE_HAIR=1').toBe(true);
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
  const approved = rows.filter(row=>reviews.get(row.id)!.decision.verdict==='PASS_ADULT_NON_EXPLICIT_SOURCE');
  expect(approved.length).toBeGreaterThan(0);
  const registryBytes = await fs.readFile('lib/dollvue/readiness-registry.json');
  const registry = JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
  const seed = registry[family.seedProductId];
  expect(seed.status).toBe('ready');
  const {eyes,hair,choices}=familyChoices(familyName,includeHair,seed.choices);
  const ids = approved.map(row=>row.id);
  for(const id of ids) expect(registry[id],`Existing registry entry ${id}; never replace implicitly`).toBeUndefined();
  const allowedIds = new Set([...ids,seed.productId]);
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
    const seedProduct = mapShopifyProduct(nodes.get(seed.productId)!);
    const seedConfig = dollVueConfigForProduct(seedProduct,getCustomizationConfig(seedProduct));
    expect(dollVueReadinessFingerprint(seedProduct,seedConfig)).toBe(seed.fingerprint);
    const verified = new Map<string,string>();
    async function verify(url:string,hash:string,optionReference=false) {
      pin.parse(hash);
      if(verified.has(url)) {expect(verified.get(url)).toBe(hash);return;}
      await normalizeReviewedImage({url,sha256:hash,origin:env.NEXT_PUBLIC_SITE_URL,optionReference});
      verified.set(url,hash);
    }
    const referencePins:Record<string,string> = {};
    for(const choice of choices) {const hash=seed.imageDigests![choice.reference];await verify(choice.reference,hash,true);referencePins[choice.reference]=hash;}
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
      evidence:{inputs,registryInputSha256:sha(registryBytes),seedProductId:seed.productId,
        holdChecks:{productIds:readIds,firstHoldCheckStartedAt,firstHoldCheckedAt,lastHoldCheckStartedAt,lastHoldCheckedAt,
          firstAllClear:true,lastAllClear:true}},
      sourceExclusions:rows.filter(row=>!records[row.id]).map(row=>({id:row.id,handle:row.handle,...reviews.get(row.id)})),
      summary:{family:familyName,readyRecords:approved.length,eyesPerRecord:eyes.length,hairPerRecord:hair.length,verifiedUniqueImages:verified.size,...counts},
      registryChanged:false,publicationChanged:false},null,2),{mode:0o600,flag:'wx'});
  } finally {vi.unstubAllGlobals();}
},30 * 60 * 1000);
