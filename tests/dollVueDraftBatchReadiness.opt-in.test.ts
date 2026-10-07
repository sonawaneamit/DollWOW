import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { expect, it, vi } from 'vitest';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { adminFetch } from '@/lib/shopify/admin';
import { POST as publicCart } from '@/app/dollvue/cart/route';
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

// Separate private-DRAFT finalizer. Never accepts ACTIVE products or changes publication.
// Opt in: DOLLVUE_DRAFT_READINESS=1, DOLLVUE_DRAFT_MANIFEST,
// DOLLVUE_DRAFT_REVIEWS (JSON file-path array), DOLLVUE_DRAFT_OUTPUT (new private JSON).
// Explicit assistant byte-bound source0 approval is mandatory. No public finalizer bypass.
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const pin = z.string().regex(/^[a-f0-9]{64}$/);
const identity = { id:z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/), sourcePosition:z.literal(0),
  sourceUrl:z.string().url(), sourceSha256:pin };
const manifestSchema = z.object({rows:z.array(z.object({...identity,handle:z.string().min(1),status:z.literal('DRAFT'),brand:z.enum(['WM Dolls','WM Doll','JK Dolls','OR Dolls']),
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
type AdminState = {id:string;handle:string;status:string;publishedAt:string|null;tags:string[];
  resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}}};
type AdminNode = Omit<Node,'priceRange'|'variants'|'media'> & AdminState & {
  variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>};
  media?:{edges:Array<{node:NonNullable<Node['media']>['edges'][number]['node'] & {
    preview?:{image?:NonNullable<Node['featuredImage']>|null}|null;
  }}>};
};
const family={seedProductId:'gid://shopify/Product/10431698337976',
  eyeIds:[1,2,3,4,5,6,7,8,9,14,15,16,17,18].map(n=>`no-${n}`)};
function assertUnpublished(node:AdminState) {
  expect(node.status).toBe('DRAFT');expect(node.publishedAt).toBeNull();
  expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
  expect(node.resourcePublications.nodes.some(item=>item.isPublished)).toBe(false);
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
const fields: Record<string,string> = {
  catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',
  displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',
  sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',
  weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',
  warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',
  stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',
  irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups',
};
const query = `query DollVueDraftFinalizer($ids:[ID!]!){nodes(ids:$ids){... on Product{
  id handle title description seo{title description} vendor productType tags status publishedAt
  resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}
  featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
  variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}
  media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
    ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}
  ${Object.entries(fields).map(([alias,key])=>`${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
}} shop{currencyCode}}`;

it.skipIf(process.env.DOLLVUE_DRAFT_READINESS !== '1')('finalizes only private DRAFT records and verifies public rejection with current reads', async () => {
  const privateRoot = await fs.realpath('/Volumes/Extreme Pro/Projects/DollWOW/data/exports');
  async function privateInput(file: string) {
    expect(path.isAbsolute(file)).toBe(true);
    const real = await fs.realpath(file);
    expect(real.startsWith(privateRoot + path.sep)).toBe(true);
    return real;
  }
  const manifestPath = await privateInput(process.env.DOLLVUE_DRAFT_MANIFEST || '');
  const reviewPaths = z.array(z.string()).min(1).parse(JSON.parse(process.env.DOLLVUE_DRAFT_REVIEWS || '[]'));
  const output = process.env.DOLLVUE_DRAFT_OUTPUT || '';
  expect(path.isAbsolute(output)).toBe(true);
  const outputDir = await fs.realpath(path.dirname(output));
  expect(outputDir.startsWith(privateRoot + path.sep)).toBe(true);
  expect(await fs.lstat(output).then(()=>true, error=>{if(error.code==='ENOENT') return false; throw error;})).toBe(false);
  const includeHair = true;
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
      expect([decision.sourceUrl,decision.sourceSha256,decision.sourcePosition]).toEqual([row!.sourceUrl,row!.sourceSha256,row!.sourcePosition]);
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
  const eyes = seed.choices.filter(c=>c.groupId==='eye-color');
  expect(eyes.map(c=>c.optionId)).toEqual(family.eyeIds);
  const hair = includeHair ? seed.choices.filter(c=>c.groupId==='hairstyle') : [];
  if(includeHair) expect(hair.map(c=>c.optionId)).toEqual(Array.from({length:15},(_,i)=>`no-${i+1}`));
  const choices = [...eyes,...hair];
  const ids = approved.map(row=>row.id);
  for(const id of ids) expect(registry[id],`Existing registry entry ${id}; never replace implicitly`).toBeUndefined();
  const allowedIds = new Set([...ids,seed.productId]);
  expect(hasShopifyStorefrontEnv()).toBe(true);
  const counts = {storefrontReads:0,adminReads:0,imageReads:0,public404Checks:0,generationCalls:0,remoteWrites:0};
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch',async (input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    if(url.hostname===env.SHOPIFY_STORE_DOMAIN && url.pathname.endsWith('/graphql.json') && method==='POST') {
      const body = JSON.parse(String(init?.body));
      expect(body.query).toMatch(/^\s*query\b/); expect(body.query).not.toMatch(/\bmutation\b/);
      if(body.variables.ids) {
        expect(body.variables.ids.length).toBeGreaterThan(0);expect(body.variables.ids.length).toBeLessThanOrEqual(50);
        expect(body.variables.ids.every((id:string)=>allowedIds.has(id))).toBe(true);
      } else {
        expect(url.pathname.includes('/admin/')).toBe(false);
        expect(approved.map(row=>row.handle)).toContain(body.variables.handle);
      }
      if(url.pathname.includes('/admin/')) counts.adminReads++; else counts.storefrontReads++;
    } else if(url.hostname===env.SHOPIFY_STORE_DOMAIN && url.pathname==='/admin/oauth/access_token' && method==='POST') {
      // Existing authentication renewal only; never a catalog mutation.
    } else { expect(method).toBe('GET'); expect(isOwnedOptionAsset(url.href)).toBe(true); counts.imageReads++; }
    return nativeFetch(input,init);
  });
  try {
    const nodes = new Map<string,Node>(),states=new Map<string,AdminState>();
    const readIds = [...allowedIds];
    for(let offset=0;offset<readIds.length;offset+=50) {
      const chunk=readIds.slice(offset,offset+50);
      const body=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(query,{ids:chunk});
      expect(body.nodes).toHaveLength(chunk.length);
      expect(body.shop.currencyCode).toMatch(/^[A-Z]{3}$/);
      body.nodes.forEach((node,index)=>{
        expect(node?.id).toBe(chunk[index]);states.set(chunk[index],node!);
        const price={amount:node!.variants.edges[0]?.node.price||'0',currencyCode:body.shop.currencyCode};
        nodes.set(chunk[index],{...node!,priceRange:{minVariantPrice:price,maxVariantPrice:price},
          media:node!.media ? {edges:node!.media.edges.map(({node:media})=>({node:{...media,previewImage:media.preview?.image}}))} : undefined,
          variants:{edges:node!.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:body.shop.currencyCode}}}))}});
      });
    }
    async function assertPublicNull() {
      for(let offset=0;offset<ids.length;offset+=50) {
        const chunk=ids.slice(offset,offset+50);
        const response=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{
          method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),
          headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
          body:JSON.stringify({query:'query DraftPublicAbsence($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids:chunk}}),
        });
        expect(response.ok).toBe(true);
        const body=await response.json();expect(body.errors).toBeUndefined();
        expect(body.data?.nodes).toEqual(chunk.map(()=>null));
      }
    }
    for(const id of ids) assertUnpublished(states.get(id)!);
    await assertPublicNull();
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
      expect(isDollVueExcluded(product)).toBe(false);
      expect(product.extended.brand).toBe(row.brand); expect(product.extended.stockStatus).toBe('custom');
      expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);
      expect([product.productType,...product.tags.filter(tag=>tag!=='catalog-review-hold')].join(' ')).not.toMatch(/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i);
      const source=productImageSources(product)[0];
      expect([source.url,source.width,source.height]).toEqual([row.sourceUrl,row.decoded.width,row.decoded.height]);
      const bytes=await fs.readFile(await privateInput(row.sourceFile));
      expect(bytes.length).toBe(row.sourceBytes); expect(sha(bytes)).toBe(row.sourceSha256);
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
        sourcePositions:[0],imageDigests:{...referencePins,[source.url]:row.sourceSha256},choices};
      const ready=evaluateDollVueReadiness(product,config,record,{published:false,privateReview:true,contentExcluded:false});
      expect(ready).toMatchObject({ready:true,publiclyAvailable:false,privatelyAvailable:true});
      expect(reviewedDollVueConfig(config,ready,'public').groups.every(g=>g.options.every(o=>!o.dollVueEnabled))).toBe(true);
      const menu=reviewedDollVueConfig(config,ready,'private'), now=new Date();
      const initial=promotionPricingForSelections(product,menu,{},now).config;
      const variant=product.variants.find(v=>v.availableForSale)||product.variants[0]; expect(variant).toBeDefined();
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
      const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;
      const response=await publicCart(new Request(origin+'/dollvue/cart',{method:'POST',
        headers:{Origin:origin,'Content-Type':'application/json'},
        body:JSON.stringify({productHandle:row.handle,selections:[{groupId:'eye-color',optionId:'no-2'},{groupId:'hairstyle',optionId:'no-8'}]})}));
      const publicPayload=await response.json();
      expect(response.status,JSON.stringify(publicPayload)).toBe(404);counts.public404Checks++;
      records[row.id]=record;
      verification.push({id:row.id,handle:row.handle,draft:true,published:false,publiclyAvailable:false,privatelyAvailable:true,publicCartStatus:404,
        retainedHoldTags:product.tags.filter(tag=>/hold/i.test(tag)),sourcePosition:0,sourceUrl:source.url,sourceSha256:row.sourceSha256,
        sourceBytes:row.sourceBytes,currentHold:'clear',strictStorefrontNull:true,currentSourceBytesMatch:true,
        runtimeFingerprint:fingerprint,assistantVisualReview:reviews.get(row.id),localDefaultValidation:defaults,
        localChoiceValidation:choiceChecks,combinedChecks,merchandiseId:variant.id,currencyCode:variant.price.currencyCode});
      if(verification.length%10===0) console.info(JSON.stringify({validated:verification.length,total:approved.length}));
    }
    // Recheck publication state and absence after lengthy compatibility work.
    for(let offset=0;offset<ids.length;offset+=50) {
      const chunk=ids.slice(offset,offset+50);
      const state=await adminFetch<{nodes:Array<AdminState|null>}>(
        'query DraftFinalState($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle status publishedAt tags resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}}}}',{ids:chunk});
      expect(state.nodes).toHaveLength(chunk.length);
      state.nodes.forEach((node,index)=>{expect(node?.id).toBe(chunk[index]);assertUnpublished(node!);
        expect(node!.handle).toBe(states.get(chunk[index])!.handle);expect(node!.tags).toEqual(states.get(chunk[index])!.tags);});
    }
    await assertPublicNull();
    const lastHoldCheckStartedAt = new Date().toISOString();
    const finalHolds = await getCurrentDollVueHolds(readIds);
    const lastHoldCheckedAt = new Date().toISOString();
    expect(readIds.map(id=>finalHolds.get(id))).toEqual(readIds.map(()=>'clear'));
    expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);
    for(const input of inputs) expect(sha(await fs.readFile(input.file)),`Evidence changed during finalization: ${input.file}`).toBe(input.sha256);
    await fs.writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),privateProposalOnly:true,published:false,privateReview:true,publicActivationAllowed:false,records,verification,
      reviewDecision:{reviewer:'assistant',scope:'Explicit byte-bound source0 decisions only'},
      evidence:{inputs,registryInputSha256:sha(registryBytes),seedProductId:seed.productId,
        holdChecks:{productIds:readIds,firstHoldCheckStartedAt,firstHoldCheckedAt,lastHoldCheckStartedAt,lastHoldCheckedAt,
          firstAllClear:true,lastAllClear:true}},
      sourceExclusions:rows.filter(row=>!records[row.id]).map(row=>({id:row.id,handle:row.handle,...reviews.get(row.id)})),
      summary:{family:'WM14-private-drafts',readyRecords:approved.length,eyesPerRecord:eyes.length,hairPerRecord:hair.length,verifiedUniqueImages:verified.size,...counts},
      registryChanged:false,publicationChanged:false},null,2),{mode:0o600,flag:'wx'});
  } finally {vi.unstubAllGlobals();}
},30 * 60 * 1000);
