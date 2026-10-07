import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it, vi } from 'vitest';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const pilotFixture=vi.hoisted(()=>({registry:{} as Record<string,DollVueReadinessRecord>,mailStubCalls:0}));
vi.mock('@/lib/dollvue/readiness-registry.json',()=>({default:pilotFixture.registry}));
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-se-skin-qa@example.invalid'})}));
vi.mock('@/lib/dollvue/accountUsage',()=>({dollVueUsageForEmail:async()=>({available:true,remaining:1}),recordDollVuePreview:async()=>true}));
vi.mock('@/lib/dollvue/email',()=>({sendDollVueLookEmail:async()=>{pilotFixture.mailStubCalls++;return {delivered:false,provider:'private-test-no-mail'};}}));

import { POST as generatePilot } from '@/app/dollvue/generate/route';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { getCurrentDollVueHolds } from '@/lib/dollvue/currentHold';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { resolveCurrentDollVueEligibility } from '@/lib/dollvue/eligibility';
import { buildDollVuePrompt, resolveDollVueSelections } from '@/lib/dollvue/config';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { classifyAppearance } from '@/lib/dollvue/appearance';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness, reviewedDollVueConfig } from '@/lib/dollvue/readiness';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output = path.join(root, 'se-skin5-preparation');
const syOutput=path.join(root,'sy-compact-appearance-preparation');
const familyHash = 'f5701faa05d81a3e89085d5edc7e5ca2a24aa54092f6e082f0eb3196df33be25';
const hash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
async function observeRegistry(base:Buffer,ownIds:string[]){
  const latest=await fs.readFile('lib/dollvue/readiness-registry.json'),before=JSON.parse(base.toString()),after=JSON.parse(latest.toString());
  const valueHash=(value:unknown)=>hash(Buffer.from(JSON.stringify(value??null)));
  for(const id of Object.keys(before))expect(valueHash(after[id]),`Preserve existing registry entry ${id}`).toBe(valueHash(before[id]));
  for(const id of ownIds)expect(valueHash(after[id]),`No concurrent changes to assigned family ${id}`).toBe(valueHash(before[id]));
  return {beforeEntries:Object.keys(before).length,afterEntries:Object.keys(after).length,beforeSha256:hash(base),afterSha256:hash(latest),unrelatedAdditions:Object.keys(after).filter(id=>!Object.hasOwn(before,id)).length,writtenByHarness:false};
}
type Node = Parameters<typeof mapShopifyProduct>[0];
type State = { id: string; handle: string; status: string; publishedAt: string | null; tags: string[];
  hold: { value: string } | null; resourcePublications: { nodes: { isPublished: boolean }[]; pageInfo: { hasNextPage: boolean } } };
type Ref = { optionId: string; label: string; reference: string; sha256: string };
type Candidate = { id: string; handle: string; status: string; excludedReasons: string[]; inventoryReasons: string[]; priorReviews: unknown[] };
type Source = ReturnType<typeof productImageSources>[number] & { sourcePosition: number; file?: string; sha256?: string; error?: string };
type Row = { index: number; id: string; handle: string; status: string; sources: Source[]; scopeExclusions: string[];
  saleHolds: string[]; fingerprint: string; displayName: string; exactSkinFamily: boolean; [key: string]: unknown };
const fields: Record<string, string> = { catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups' };
const common = `id handle title description seo{title description} vendor productType tags featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} ${Object.entries(fields).map(([a,k]) => `${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}`;
const stateFields = 'id handle status publishedAt tags hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}';
const sfQuery = `query SeSkinPreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{${common} priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode}} variants(first:30){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{previewImage{url altText width height} sources{url mimeType}}}}}}}}`;
const adminQuery = `query SeSkinPrivatePreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{${common} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}}} shop{currencyCode}}`;
const save = (name: string, data: unknown) => fs.writeFile(path.join(output, name), JSON.stringify(data, null, 2)+'\n', {flag:'wx',mode:0o600});
const scopeFlags = (type: string, tags: string[]) => [type, ...tags.filter(t => t !== 'catalog-review-hold')].filter(t => /head[ -]?only|torso|accessor|ready.to.ship|not-for-launch|excluded/i.test(t));
const saleFlags = (state: State) => [...state.tags.filter(t => t !== 'catalog-review-hold' && /hold/i.test(t)), ...(state.hold?.value.trim() ? ['private-catalog-image-review-hold'] : [])];
function permitted(url: URL, method: string, body: string | undefined, ids: string[], domain: string) {
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  if (url.hostname === domain && url.pathname.endsWith('/graphql.json')) {
    if (method !== 'POST') return false;
    const b = JSON.parse(body || '{}');
    return /^query\b/.test(b.query) && !/\bmutation\b/.test(b.query) && Array.isArray(b.variables?.ids)
      && b.variables.ids.length <= 50 && b.variables.ids.every((id: string) => ids.includes(id));
  }
  if (url.hostname === domain && url.pathname === '/admin/oauth/access_token') return method === 'POST';
  return method === 'GET' && url.hostname === 'cdn.shopify.com' && isOwnedOptionAsset(url.href);
}
it('limits all network use to selected read-only queries, token renewal and owned Shopify images', () => {
  const ids=['gid://shopify/Product/1'], domain='example.myshopify.com';
  const u=new URL(`https://${domain}/admin/api/2026-04/graphql.json`);
  expect(permitted(u,'POST',JSON.stringify({query:'query State($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids}}),ids,domain)).toBe(true);
  expect(permitted(u,'POST',JSON.stringify({query:'mutation Update{productUpdate{id}}',variables:{ids}}),ids,domain)).toBe(false);
  expect(permitted(new URL('https://example.com/photo.jpg'),'GET',undefined,ids,domain)).toBe(false);
  expect(permitted(new URL('https://cdn.shopify.com/s/files/1/0000/image.jpg'),'GET',undefined,ids,domain)).toBe(false);
});
it('separates generic catalog review from existing sale holds and full-body scope', () => {
  expect(scopeFlags('Custom TPE doll',['catalog-review-hold'])).toEqual([]);
  expect(scopeFlags('Ready to ship doll',[])).toHaveLength(1);
  expect(saleFlags({tags:['catalog-review-hold','safety-review-hold'],hold:null} as State)).toEqual(['safety-review-hold']);
});
function onlyFirstProviderCall(calls:number) {if(calls!==0)throw Error('Second provider attempt, retry or fallback forbidden');}
it('does not permit a provider retry or fallback after consuming the single reservation',()=>{
  expect(()=>onlyFirstProviderCall(0)).not.toThrow();expect(()=>onlyFirstProviderCall(1)).toThrow();
});

async function decoded(bytes: Buffer) {
  const decoder=sharp(bytes,{limitInputPixels:25000000,animated:true,failOn:'warning'}).timeout({seconds:5});
  const m=await decoder.metadata(); expect(m.pages||1).toBe(1); await decoder.clone().raw().toBuffer();
  return {bytes,sha256:hash(bytes),width:m.width!,height:m.height!,format:m.format!};
}
async function sourceBytes(url: string) {
  expect(isOwnedOptionAsset(url)).toBe(true);
  let bytes: Buffer;
  if (url.startsWith('/')) bytes=await fs.readFile(path.join(process.cwd(),'public',url));
  else {
    const r=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
    expect(r.ok).toBe(true); expect(r.headers.get('content-type')).toMatch(/^image\//);
    expect(Number(r.headers.get('content-length'))).toBeLessThanOrEqual(20*1024*1024);
    const reader=r.body!.getReader(), chunks:Buffer[]=[]; let size=0;
    try { while(true) { const p=await reader.read(); if(p.done)break; size+=p.value.length;
      if(size>20*1024*1024)throw Error('Image exceeds size bound'); chunks.push(Buffer.from(p.value)); } }
    finally { void reader.cancel().catch(()=>{}); }
    bytes=Buffer.concat(chunks);
  }
  return decoded(bytes);
}
async function tile(file: string, lines: string[]) {
  const width=320,height=460,thumb=await sharp(await fs.readFile(file)).autoOrient().resize(width,400,{fit:'contain',background:'#eee'}).png().toBuffer();
  const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const footer=Buffer.from(`<svg width="320" height="60"><rect width="320" height="60" fill="white"/><g font-family="Arial" font-size="13">${lines.map((s,i)=>`<text x="5" y="${17+i*18}">${escape(s)}</text>`).join('')}</g></svg>`);
  return sharp({create:{width,height,channels:3,background:'#fff'}}).composite([{input:thumb,left:0,top:0},{input:footer,left:0,top:400}]).png().toBuffer();
}
async function sheet(tiles:Buffer[],name:string,columns=4,directory=output) {
  expect(tiles.length).toBeGreaterThan(0);
  const b=await sharp({create:{width:columns*320,height:Math.ceil(tiles.length/columns)*460,channels:3,background:'#fff'}})
    .composite(tiles.map((input,i)=>({input,left:i%columns*320,top:Math.floor(i/columns)*460}))).png().toBuffer();
  const file=path.join(directory,name); await fs.writeFile(file,b,{flag:'wx',mode:0o600}); return {file,sha256:hash(b)};
}

it.skipIf(process.env.DOLLVUE_SE_SKIN_PREPARATION !== '1')('prepares SE skin5 current states, exact menus, references and source zero privately', async () => {
  await fs.mkdir(output,{recursive:true,mode:0o700});
  const input=path.join(root,'remaining-family-census/other-family-reference-inventory.json'), inputBytes=await fs.readFile(input);
  const inventory=JSON.parse(inputBytes.toString()) as {groups:{referenceFamilyHash:string;choices:Ref[];products:Candidate[]}[]};
  const family=inventory.groups.find(g=>g.referenceFamilyHash===familyHash)!; expect(family).toBeDefined();
  const selected=[...new Map(family.products.map(r=>[r.id,r])).values()], ids=selected.map(r=>r.id);
  expect(selected).toHaveLength(296); expect(family.choices).toHaveLength(5);
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json');
  const counts={storefrontBulkReads:0,adminBulkReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
  const nativeFetch=globalThis.fetch;
  vi.stubGlobal('fetch',async (input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||'GET';
    expect(permitted(u,method,init?.body?.toString(),ids,env.SHOPIFY_STORE_DOMAIN!)).toBe(true);
    if(u.pathname.endsWith('/graphql.json')) { if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++; }
    else if(method==='GET')counts.imageReads++;
    return nativeFetch(input,{...init,redirect:'error'});
  });
  try {
    expect(hasShopifyStorefrontEnv()).toBe(true);
    const nodes=new Map<string,Node|null>(),states=new Map<string,State>();
    for(let n=0;n<ids.length;n+=50) {
      const chunk=ids.slice(n,n+50);
      const r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
      expect(r.ok).toBe(true); const b=await r.json(); expect(b.errors).toBeUndefined(); expect(b.data.nodes).toHaveLength(chunk.length);
      b.data.nodes.forEach((p:Node|null,i:number)=>{if(p)expect(p.id).toBe(chunk[i]);nodes.set(chunk[i],p);});
      const s=await adminFetch<{nodes:State[]}>(`query SeSkinStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});
      expect(s.nodes).toHaveLength(chunk.length); s.nodes.forEach((p,i)=>{expect(p?.id).toBe(chunk[i]);states.set(p.id,p);});
    }
    const checkedAt=new Date().toISOString(); await save('initial-current-state-and-holds.json',{checkedAt,rows:[...states.values()]});
    const privateNodes=new Map<string,Node>(),missing=ids.filter(id=>!nodes.get(id));
    for(let n=0;n<missing.length;n+=20) {
      const d=await adminFetch<{nodes:Array<Omit<Node,'variants'> & {variants:{edges:{node:{id:string;title:string;availableForSale:boolean;price:string;selectedOptions:{name:string;value:string}[]}}[]}}>;shop:{currencyCode:string}}>(adminQuery,{ids:missing.slice(n,n+20)});
      for(const p of d.nodes) { expect(p).toBeTruthy(); const price={amount:p.variants.edges[0]?.node.price||'0',currencyCode:d.shop.currencyCode};
        privateNodes.set(p.id,{...p,priceRange:{minVariantPrice:price,maxVariantPrice:price},variants:{edges:p.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:d.shop.currencyCode}}}))}}); }
    }
    const referenceEvidence=[];
    for(const ref of family.choices) {
      expect(isOwnedOptionAsset(ref.reference)).toBe(true); const b=await decoded(await fs.readFile(path.join(process.cwd(),'public',ref.reference)));
      expect(b.sha256).toBe(ref.sha256); const file=path.join(output,`reference-${ref.optionId}.${b.format}`);
      await fs.writeFile(file,b.bytes,{flag:'wx',mode:0o600}); referenceEvidence.push({...ref,file,width:b.width,height:b.height,localOwnedBytesVerified:true,productionFetch:false,meaningReviewed:false});
    }
    const referenceSheet=await sheet(await Promise.all(referenceEvidence.map((r,i)=>tile(r.file,[`${i+1}. ${r.label}`,r.optionId,'SE SKIN5 REFERENCE / NOT APPROVED']))),'skin5-reference-contact-sheet.png',5);
    await save('reference-evidence.json',{familyHash,referenceEvidence,referenceSheet,ownerReviewed:false});
    const rows:Row[]=[];
    for(const [index,old] of selected.entries()) {
      const state=states.get(old.id)!,node=nodes.get(old.id)||privateNodes.get(old.id); expect(node).toBeTruthy();
      const product=mapShopifyProduct(node!),config=dollVueConfigForProduct(product,getCustomizationConfig(product)),group=config.groups.find(g=>g.id==='skin-tone');
      const scopeExclusions=scopeFlags(product.productType,[...product.tags,...state.tags]);
      if(product.extended.stockStatus!=='custom')scopeExclusions.push('not-custom');
      if(!/^custom\b.*\bdoll\b/i.test(product.productType)||[product.productType,...product.tags,...state.tags].some(t=>/torso/i.test(t)))scopeExclusions.push('not-full-body-custom');
      if(isDollVueExcluded(product))scopeExclusions.push('runtime-scope-excluded');
      if(!isCustomerVisibleProduct(product))scopeExclusions.push('customer-visibility-excluded');
      if(product.extended.brand!=='SE Doll'||state.handle!==old.handle||node!.handle!==old.handle||state.status!==old.status)scopeExclusions.push('current-identity-mismatch');
      expect(Object.hasOwn(state,'hold')).toBe(true);
      if(state.status==='DRAFT') { expect(nodes.get(old.id)).toBeNull(); expect(state.publishedAt).toBeNull(); expect(state.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false); }
      else if(!nodes.get(old.id)||!state.publishedAt)scopeExclusions.push('not-currently-public');
      const currentChoices=group?.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({optionId:o.id,label:o.label,reference:o.swatch?.kind==='image'?o.swatch.value:null}));
      const exactSkinFamily=JSON.stringify(currentChoices)===JSON.stringify(family.choices.map(({optionId,label,reference})=>({optionId,label,reference})));
      if(!exactSkinFamily)scopeExclusions.push('current-skin-family-mismatch');
      if(group?.selectionMode!=='single'||group.visibleWhen?.length)scopeExclusions.push('conditional-or-multiple-skin-group');
      rows.push({index:index+1,id:old.id,handle:old.handle,status:state.status,displayName:product.extended.displayName||product.title,
        productType:product.productType,stockStatus:product.extended.stockStatus,bodyType:product.extended.bodyType,material:product.extended.material,
        currentCheckedAt:checkedAt,currentState:state,scopeExclusions:[...new Set(scopeExclusions)],saleHolds:saleFlags(state),exactSkinFamily,
        fingerprint:dollVueReadinessFingerprint(product,config),skinGroup:group,rules:config.rules,configuration:config,
        sources:productImageSources(product).slice(0,8).map((s,sourcePosition)=>({...s,sourcePosition})),cachedEvidence:old,
        sourceVisualReview:'NOT_REVIEWED',ready:false});
    }
    await save('current-family-candidates.json',{checkedAt,rows,counts});
    // Source zero is collected for every identity before any alternative is considered.
    for(const row of rows) {
      const source=row.sources[0]; if(!source)continue;
      try { const b=await sourceBytes(source.url),file=path.join(output,`source-${row.index}-p0.${b.format==='jpeg'?'jpg':b.format}`);
        await fs.writeFile(file,b.bytes,{flag:'wx',mode:0o600}); Object.assign(source,{file,sha256:b.sha256,width:b.width,height:b.height,byteLength:b.bytes.length}); }
      catch(e) {source.error=e instanceof Error?e.message:String(e);}
      if(row.index%25===0)console.info(JSON.stringify({phase:'source-zero',processed:row.index,total:rows.length}));
    }
    const sheets=[];
    for(let n=0;n<rows.length;n+=12) {
      const part=rows.slice(n,n+12),tiles=[];
      for(const row of part) { const s=row.sources[0]; if(s?.file)tiles.push(await tile(s.file,[`${row.index}. ${row.displayName.slice(0,37)}`,`${row.id.split('/').at(-1)} | p0`,row.scopeExclusions.length?'SCOPE EXCLUDED / REVIEW ONLY':'NOT APPROVED'])); }
      if(tiles.length)sheets.push(await sheet(tiles,`source0-${part[0].index}-${part.at(-1)!.index}.png`));
    }
    await save('candidate-manifest.json',{checkedAt,completedAt:new Date().toISOString(),familyHash,rows,referenceEvidence,referenceSheet,sheets,counts,
      input:{file:input,sha256:hash(inputBytes)},registryInputSha256:hash(registryBytes),registryWritten:false,publicationChanged:false,ownerReviewed:false,ready:false});
    console.info(JSON.stringify({output,rows:rows.length,scopeClear:rows.filter(r=>!r.scopeExclusions.length&&!r.saleHolds.length).length,...counts}));
  } finally {vi.unstubAllGlobals();}
},40*60*1000);

it.skipIf(process.env.DOLLVUE_SE_SKIN_FINALIZE !== '1')('binds a private four-tone proposal to current states without enabling or generating previews', async () => {
  const expanded=process.env.DOLLVUE_SE_SKIN_PARENT104==='1',batch=expanded?'parent104':'parent98';
  const inputs: {file:string;sha256:string}[]=[];
  async function read<T>(name:string):Promise<T> { const file=path.join(output,name),b=await fs.readFile(file);inputs.push({file,sha256:hash(b)});return JSON.parse(b.toString()) as T; }
  const manifest=await read<{familyHash:string;rows:Row[]}>('candidate-manifest.json');
  const decisions=await read<{rows:{id:string;index:number;previewEligible:boolean;parentSourceApproval:boolean;source:Source|null}[]}>(expanded?'parent104-source-review.json':'parent-source-review.json');
  const references=await read<{parentReferenceApproval:boolean;choices:(Ref&{file:string})[]}>('four-tone-reference-review.json');
  await read('source0-review.json'); await read('alternative-review.json');
  expect(manifest.familyHash).toBe(familyHash);expect(references.parentReferenceApproval).toBe(true);
  expect(references.choices.map(r=>r.optionId)).toEqual(['white','natural','light-tan','dark-tan']);
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString());
  expect(Object.keys(registry).length).toBeGreaterThan(0);
  const selected=decisions.rows.filter(r=>r.previewEligible&&r.parentSourceApproval);expect(selected).toHaveLength(expanded?104:98);
  expect(selected.some(r=>r.index===184)).toBe(false);
  expect(decisions.rows.filter(r=>r.previewEligible&&!r.parentSourceApproval)).toHaveLength(expanded?0:6);
  const ids=manifest.rows.map(r=>r.id),nodes=new Map<string,Node|null>(),states=new Map<string,State>();
  const nativeFetch=globalThis.fetch,counts={storefrontBulkReads:0,adminBulkReads:0,imageReads:0,defaults:0,fourToneChoices:0,retainedCustomColorCheckoutChoices:0,generationCalls:0,shopifyWrites:0};
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||'GET';
    expect(permitted(u,method,init?.body?.toString(),ids,env.SHOPIFY_STORE_DOMAIN!)).toBe(true);
    if(u.pathname.endsWith('/graphql.json')) {if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;}
    else if(method==='GET')counts.imageReads++;
    return nativeFetch(input,{...init,redirect:'error'});
  });
  async function currentStates() {
    const result:State[]=[];
    for(let n=0;n<ids.length;n+=50) {
      const chunk=ids.slice(n,n+50),s=await adminFetch<{nodes:State[]}>(`query SeSkinFinalStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});
      expect(s.nodes).toHaveLength(chunk.length);
      s.nodes.forEach((p,i)=>{expect(p?.id).toBe(chunk[i]);expect(p).toEqual(manifest.rows.find(r=>r.id===p.id)!.currentState);result.push(p);});
    }
    return result;
  }
  try {
    const startedAt=new Date().toISOString();
    for(const s of await currentStates())states.set(s.id,s);
    for(let n=0;n<ids.length;n+=50) {
      const chunk=ids.slice(n,n+50),r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
      expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);
      b.data.nodes.forEach((p:Node|null,i:number)=>{if(p)expect(p.id).toBe(chunk[i]);nodes.set(chunk[i],p);});
    }
    for(const r of manifest.rows) {
      const state=states.get(r.id)!;expect(saleFlags(state)).toEqual(r.saleHolds);
      if(state.status==='DRAFT') {expect(nodes.get(r.id)).toBeNull();expect(state.publishedAt).toBeNull();expect(state.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false);}
    }
    for(const r of references.choices) {expect(hash(await fs.readFile(r.file))).toBe(r.sha256);expect((await sourceBytes(r.reference)).sha256).toBe(r.sha256);}
    const rows=[];
    for(const decision of selected) {
      const old=manifest.rows.find(r=>r.id===decision.id)!,node=nodes.get(old.id),state=states.get(old.id)!,source=decision.source!;
      expect(registry[old.id]).toBeUndefined();expect(node).toBeTruthy();expect(state.status).toBe('ACTIVE');expect(state.publishedAt).toBeTruthy();
      const product=mapShopifyProduct(node!),config=dollVueConfigForProduct(product,getCustomizationConfig(product));
      expect(product.handle).toBe(old.handle);expect(product.extended.brand).toBe('SE Doll');expect(product.extended.stockStatus).toBe('custom');
      expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);expect(scopeFlags(product.productType,[...product.tags,...state.tags])).toEqual([]);
      expect(isCustomerVisibleProduct(product)).toBe(true);expect(isDollVueExcluded(product)).toBe(false);expect(saleFlags(state)).toEqual([]);
      expect(dollVueReadinessFingerprint(product,config)).toBe(old.fingerprint);expect(config).toEqual(old.configuration);
      const group=config.groups.find(g=>g.id==='skin-tone')!;expect(group.options.map(o=>o.id)).toEqual(['white','natural','light-tan','dark-tan','custom-color']);
      expect(group.selectionMode).toBe('single');expect(group.visibleWhen?.length||0).toBe(0);
      expect(productImageSources(product)[source.sourcePosition]?.url).toBe(source.url);
      expect(hash(await fs.readFile(source.file!))).toBe(source.sha256);expect((await sourceBytes(source.url)).sha256).toBe(source.sha256);
      const before=JSON.stringify(config),defaults=getDefaultSelections(config);
      expect(resolveCustomization(config,defaults,0).issues).toEqual([]);counts.defaults++;
      for(const option of group.options) {
        const resolved=resolveCustomization(config,{...defaults,'skin-tone':option.id},0);
        expect(resolved.issues).toEqual([]);expect(resolved.selections['skin-tone']).toBe(option.id);
        expect(resolved.selectedOptions.some(o=>o.groupId==='skin-tone'&&o.optionId===option.id)).toBe(true);
        expect(resolved.cartAttributes.some(a=>a.value.includes(option.label))).toBe(true);
        if(option.id==='custom-color')counts.retainedCustomColorCheckoutChoices++;else counts.fourToneChoices++;
      }
      expect(JSON.stringify(config)).toBe(before);
      rows.push({index:old.index,id:old.id,handle:old.handle,displayName:old.displayName,material:old.material,fingerprint:old.fingerprint,source,
        choices:references.choices.map(r=>({groupId:'skin-tone',optionId:r.optionId,label:r.label,reference:r.reference,sha256:r.sha256})),currentState:state,
        configuration:config,ready:false,parentSourceApproval:true,status:expanded?'awaiting-single-pilot-and-parent-output-review':'awaiting-parent-pilot-input-approval'});
    }
    const finalStates=await currentStates(),registryObservation=await observeRegistry(registryBytes,ids);
    const proposal={startedAt,completedAt:new Date().toISOString(),familyHash,inputs,registryBase:{entries:Object.keys(registry).length,sha256:hash(registryBytes)},registryObservation,rows,counts,finalStates,
      parentReferenceApproval:true,parentSourceApproval:true,ownerReviewed:false,pilotGenerated:false,ready:false,registryWritten:false,checkoutMenuChanged:false,
      excludedPreviewChoices:[{groupId:'skin-tone',optionId:'custom-color',reason:'No unique color target; checkout option retained.'}],
      editScope:'Visible skin color only; preserve identity, existing ears/head, makeup, eyes, hair, pose, clothing, accessories, proportions, lighting and background. No fantasy-head transfer.',
      referenceProductionFetch:false};
    await save(`four-tone-${batch}-proposal.json`,proposal);
    const pilot=rows.find(r=>r.index===14)!,target=references.choices.find(r=>r.optionId==='dark-tan')!;
    await save(`${batch}-pilot-input.json`,{productId:pilot.id,handle:pilot.handle,index:pilot.index,displayName:pilot.displayName,material:pilot.material,
      source:pilot.source,target,referenceFamilyHash:familyHash,fingerprint:pilot.fingerprint,registryBase:proposal.registryBase,
      rationale:'TPE full-body catalog product with clearly adult facial presentation, opaque orange top/white shorts and visible face, hands and legs for evaluating a skin-only color change.',
      instruction:'Change only the visible skin color of this adult doll to the supplied Dark Tan flat color reference. Preserve the exact face, identity, existing head and ears, makeup, eye color, hair, anatomy, pose, clothing and coverage, accessories including glasses and jewelry, watermark, camera framing, texture, lighting and background. Do not copy any head or fantasy features. Add no nudity or explicit detail.',
      parentSourceApproval:true,parentReferenceApproval:true,ownerReviewed:false,inputApproval:expanded,generationAllowed:false,generationCalls:0,
      requiredNextStep:expanded?'One call only under one-pilot-authorization.json and a permanent reservation; output review required before ready.':'Parent approval of this exact source/reference/instruction combination before any generation.'});
    if(!expanded)await sheet([await tile(pilot.source.file!,[`${pilot.index}. ${pilot.displayName}`,`${pilot.id.split('/').at(-1)} | p${pilot.source.sourcePosition}`,'PILOT INPUT / NOT APPROVED']),await tile(target.file,['Dark Tan','skin-tone / dark-tan','REFERENCE APPROVED'])],`${batch}-pilot-input.png`,2);
    console.info(JSON.stringify({output,candidates:rows.length,...counts,registryEntries:Object.keys(registry).length,ready:false}));
  } finally {vi.unstubAllGlobals();}
},40*60*1000);

it.skipIf(process.env.DOLLVUE_SE_SKIN_ALTERNATIVES !== '1')('prepares alternatives only after an explicit adult source-zero review requires them', async () => {
  const manifest=JSON.parse(await fs.readFile(path.join(output,'candidate-manifest.json'),'utf8')) as {rows:Row[]};
  const reviewBytes=await fs.readFile(path.join(output,'source0-review.json'));
  const review=JSON.parse(reviewBytes.toString()) as {rows:{id:string;sourceSha256:string;decision:string}[]};
  const selected=manifest.rows.filter(r=>!r.scopeExclusions.length&&!r.saleHolds.length&&review.rows.some(d=>d.id===r.id&&d.sourceSha256===r.sources[0].sha256&&d.decision==='needsalternative'));
  const nativeFetch=globalThis.fetch; let imageReads=0;
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const u=new URL(String(input));expect(permitted(u,init?.method||'GET',undefined,[],'')).toBe(true);imageReads++;
    return nativeFetch(input,{...init,redirect:'error'});
  });
  try {
    const rows=[],sheets=[];
    for(const row of selected) {
      const sources=[];
      for(const source of row.sources.slice(1,8)) {
        try {const b=await sourceBytes(source.url),file=path.join(output,`source-${row.index}-p${source.sourcePosition}.${b.format==='jpeg'?'jpg':b.format}`);
          await fs.writeFile(file,b.bytes,{flag:'wx',mode:0o600});sources.push({...source,file,sha256:b.sha256,width:b.width,height:b.height});}
        catch(e){sources.push({...source,error:e instanceof Error?e.message:String(e)});}
      }
      rows.push({index:row.index,id:row.id,handle:row.handle,sources});
      const tiles=[];for(const s of sources)if(s.file)tiles.push(await tile(s.file,[`${row.index}. ${row.displayName}`,`${row.id.split('/').at(-1)} | p${s.sourcePosition}`,'ALTERNATIVE / NOT APPROVED']));
      if(tiles.length)sheets.push(await sheet(tiles,`alternatives-${row.index}.png`));
    }
    await save('alternative-manifest.json',{preparedAt:new Date().toISOString(),source0ReviewSha256:hash(reviewBytes),rows,sheets,imageReads,generationCalls:0,shopifyWrites:0});
  }finally{vi.unstubAllGlobals();}
},40*60*1000);

it.skipIf(process.env.DOLLVUE_SE_SKIN_PILOT !== '1' && process.env.DOLLVUE_SE_SKIN_CORRECTED_PILOT !== '1')('runs exactly one approved skin-only pilot and leaves readiness pending output review',async()=>{
  const corrected=process.env.DOLLVUE_SE_SKIN_CORRECTED_PILOT==='1';
  const directory=path.join(output,corrected?'pilot-two-swatch-authority':'pilot-one-dark-tan');await fs.mkdir(directory,{recursive:true,mode:0o700});
  const write=(name:string,value:unknown)=>fs.writeFile(path.join(directory,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  expect(await fs.stat(path.join(directory,'reservation.json')).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;}),'Reservation consumes authorization even after failure; never delete or retry').toBe(false);
  const approvalFile=path.join(output,'one-pilot-authorization.json'),approvalBytes=await fs.readFile(approvalFile);
  const approval=JSON.parse(approvalBytes.toString()) as {frozen:boolean;ownerReviewed:boolean;inputApproved:boolean;maxProviderCalls:number;noRetries:boolean;productId:string;sourcePosition:number;sourceSha256:string;reference:string;referenceSha256:string;choice:{groupId:string;optionId:string};bindings:{file:string;sha256:string}[]};
  expect(approval).toMatchObject({frozen:true,ownerReviewed:false,inputApproved:true,maxProviderCalls:1,noRetries:true,productId:'gid://shopify/Product/10433918042296',sourcePosition:0,choice:{groupId:'skin-tone',optionId:'dark-tan'}});
  const proposalFile=path.join(output,'four-tone-parent104-proposal.json'),proposalBytes=await fs.readFile(proposalFile);
  const proposal=JSON.parse(proposalBytes.toString()) as {rows:(Row&{source:Source})[];registryBase:{entries:number;sha256:string}};
  expect(proposal.rows).toHaveLength(104);const pilot=proposal.rows.find(r=>r.id===approval.productId)!;expect(pilot.index).toBe(14);
  expect(pilot.source.sha256).toBe(approval.sourceSha256);expect(pilot.source.sourcePosition).toBe(0);
  const pins=[...approval.bindings,{file:approvalFile,sha256:hash(approvalBytes)},{file:proposalFile,sha256:hash(proposalBytes)}];
  const runtimeBytes=await fs.readFile('lib/dollvue/config.ts'),runtimeSha256=hash(runtimeBytes);
  if(corrected){
    const correctionFile=path.join(output,'corrected-pilot-authorization.json'),correctionBytes=await fs.readFile(correctionFile),correction=JSON.parse(correctionBytes.toString());
    expect(correction).toMatchObject({maxProviderCalls:1,noRetries:true,noFallback:true,sameReviewedInputs:true,ownerReviewed:false,sharedFilesApproved:['lib/dollvue/config.ts','tests/dollVue.test.ts']});
    expect(correction.runtimeSha256).toBe(runtimeSha256);for(const test of correction.passedTestLogs){expect(test.exitCode).toBe(0);expect(hash(await fs.readFile(test.file))).toBe(test.sha256);}
    pins.push({file:correctionFile,sha256:hash(correctionBytes)});
  }
  async function verifyPins(){for(const p of pins){expect((await fs.realpath(p.file)).startsWith(`${await fs.realpath(output)}${path.sep}`)).toBe(true);expect(hash(await fs.readFile(p.file))).toBe(p.sha256);}}
  await verifyPins();
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json');
  const ownIds=(JSON.parse(await fs.readFile(path.join(output,'candidate-manifest.json'),'utf8')) as {rows:Row[]}).rows.map(r=>r.id);
  if(!corrected){expect(Object.keys(JSON.parse(registryBytes.toString()))).toHaveLength(proposal.registryBase.entries);expect(hash(registryBytes)).toBe(proposal.registryBase.sha256);}
  expect(JSON.parse(registryBytes.toString())[pilot.id]).toBeUndefined();
  const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
  expect(env.DOLLVUE_ENABLED).toBe('true');expect(env.VENICE_API_KEY).toBeTruthy();
  const choices=[{...approval.choice,reference:approval.reference}],imageDigests={[pilot.source.url]:approval.sourceSha256,[approval.reference]:approval.referenceSha256};
  const fixture:DollVueReadinessRecord={productId:pilot.id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:pilot.fingerprint,status:'ready',sourcePositions:[0],choices,imageDigests};
  pilotFixture.registry[pilot.id]=fixture;pilotFixture.mailStubCalls=0;
  const nativeFetch=globalThis.fetch;let calls=0,reserved=false,expectedImageHashes:string[]=[],expectedPrompt='';
  const result:Record<string,unknown>={productId:pilot.id,sourcePosition:0,choice:approval.choice,approvalSha256:hash(approvalBytes),proposalSha256:hash(proposalBytes),ownerReviewed:false,ready:false,parentOutputReview:'pending',generationSuccessful:false,registryWritten:false,shopifyWrites:0,mailSent:0,referenceTransport:'Exact local owned reference bytes served by test fetch; no production reference fetch',fixtureScope:'Test-only readiness record, QA session, account usage and no-op mail; real product, holds, source fetch, route and provider'};
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const url=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
    expect(url.protocol).toBe('https:');expect(url.username||url.password||url.port).toBe('');
    if(url.href==='https://api.venice.ai/api/v1/image/multi-edit'){
      onlyFirstProviderCall(calls);expect(reserved).toBe(true);expect(method).toBe('POST');
      const body=JSON.parse(String(init?.body));expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toHaveLength(2);
      const hashes=body.images.map((s:string)=>{expect(s).toMatch(/^data:image\//);return hash(Buffer.from(s.split(',')[1],'base64'));});
      expect(hashes).toEqual(expectedImageHashes);expect(body.prompt).toBe(expectedPrompt);await verifyPins();expect(hash(await fs.readFile('lib/dollvue/config.ts'))).toBe(runtimeSha256);await observeRegistry(registryBytes,ownIds);
      calls++;
      await write('provider-request.json',{requestSha256:hash(Buffer.from(String(init?.body))),model:body.modelId,prompt:body.prompt,imageHashes:hashes,aspectRatio:body.aspect_ratio,resolution:body.resolution,authorizationSha256:hash(approvalBytes)});
      const response=await nativeFetch(input,{...init,redirect:'error'});result.providerStatus=response.status;
      await write('provider-status.json',{status:response.status,receivedAt:new Date().toISOString()});
      if(response.ok){const b=Buffer.from(await response.clone().arrayBuffer());await fs.writeFile(path.join(directory,'provider-original.webp'),b,{flag:'wx',mode:0o600});result.providerOriginalSha256=hash(b);}
      return response;
    }
    if(url.hostname===env.SHOPIFY_STORE_DOMAIN){
      expect(method).toBe('POST');
      if(url.pathname.endsWith('/graphql.json')){const b=JSON.parse(String(init?.body));expect(b.query.trim()).toMatch(/^query\b/);expect(b.query).not.toMatch(/\bmutation\b/);
        expect(b.variables?.handle===pilot.handle||b.variables?.id===pilot.id||(Array.isArray(b.variables?.ids)&&b.variables.ids.length===1&&b.variables.ids[0]===pilot.id)).toBe(true);
      }else expect(url.pathname).toBe('/admin/oauth/access_token');
      return nativeFetch(input,{...init,redirect:'error'});
    }
    expect(method).toBe('GET');expect(init?.cache).toBe('no-store');
    if(url.href===new URL(approval.reference,origin).href){
      expect(isOwnedOptionAsset(approval.reference)).toBe(true);const b=await fs.readFile(path.join(process.cwd(),'public',approval.reference));expect(hash(b)).toBe(approval.referenceSha256);
      return new Response(new Uint8Array(b),{headers:{'Content-Type':'image/webp','Content-Length':String(b.length)}});
    }
    expect(url.href).toBe(pilot.source.url);expect(url.hostname).toBe('cdn.shopify.com');expect(isOwnedOptionAsset(url.href)).toBe(true);
    return nativeFetch(input,{...init,redirect:'error'});
  });
  async function current(stage:string){
    const product=await getProductByHandle(pilot.handle,{strict:true,cache:'no-store'});expect(product?.id).toBe(pilot.id);
    expect(isCustomerVisibleProduct(product!)).toBe(true);expect(isDollVueExcluded(product!)).toBe(false);expect(product!.extended.stockStatus).toBe('custom');expect(product!.extended.brand).toBe('SE Doll');
    const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(pilot.fingerprint);expect(config).toEqual(pilot.configuration);
    expect(productImageSources(product!)[0].url).toBe(pilot.source.url);
    const state=await adminFetch<{nodes:State[]}>(`query SeSkinPilotState($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:[pilot.id]});
    expect(state.nodes).toHaveLength(1);expect(state.nodes[0]).toEqual(pilot.currentState);expect(state.nodes[0].status).toBe('ACTIVE');expect(state.nodes[0].publishedAt).toBeTruthy();expect(saleFlags(state.nodes[0])).toEqual([]);
    expect((await getCurrentDollVueHolds([pilot.id])).get(pilot.id)).toBe('clear');
    expect(hash(await fs.readFile(pilot.source.file!))).toBe(approval.sourceSha256);
    const images=[await normalizeReviewedImage({url:pilot.source.url,sha256:approval.sourceSha256,origin}),await normalizeReviewedImage({url:approval.reference,sha256:approval.referenceSha256,origin,optionReference:true})];
    const hashes=images.map(s=>hash(Buffer.from(s.split(',')[1],'base64')));expect(hashes[0]).toBe(approval.sourceSha256);
    const eligibility=await resolveCurrentDollVueEligibility(product!);expect(eligibility.available).toBe(true);
    const selections=resolveDollVueSelections(eligibility.config,[approval.choice]);expect(selections).toHaveLength(1);expect(selections[0].option.id).toBe('dark-tan');
    const prompt=buildDollVuePrompt(product!,selections);expect(prompt).toContain('the synthetic-skin color only');expect(prompt).toContain('eyewear');expect(prompt).toContain('lighting');
    if(corrected){expect(prompt).toContain('SKIN-TONE AUTHORITY');expect(prompt).toContain("Image 2's actual skin-color field is the authority");expect(hash(await fs.readFile('lib/dollvue/config.ts'))).toBe(runtimeSha256);}
    await write(`${stage}-current-verification.json`,{checkedAt:new Date().toISOString(),productId:pilot.id,fingerprint:pilot.fingerprint,currentState:state.nodes[0],imageDigests,normalizedImageHashes:hashes,promptSha256:hash(Buffer.from(prompt)),hold:'clear'});
    return {hashes,prompt};
  }
  let caught:unknown;
  try{
    const before=await current('before');expectedImageHashes=before.hashes;expectedPrompt=before.prompt;
    const payload={productHandle:pilot.handle,sourcePosition:0,selections:[approval.choice]};
    await observeRegistry(registryBytes,ownIds);await fs.writeFile(path.join(directory,'registry-base.json'),registryBytes,{flag:'wx',mode:0o600});
    await write('reservation.json',{reservedAt:new Date().toISOString(),maxProviderCalls:1,noRetries:true,noFallback:true,corrected,runtimeSha256,authorizationSha256:hash(approvalBytes),proposalSha256:hash(proposalBytes),pins,registrySha256:hash(registryBytes),requestSha256:hash(Buffer.from(JSON.stringify(payload))),normalizedImageHashes:expectedImageHashes,promptSha256:hash(Buffer.from(expectedPrompt))});reserved=true;
    const response=await generatePilot(new Request(`${origin}/dollvue/generate`,{method:'POST',headers:{origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body:JSON.stringify(payload)}));
    const body=await response.json();result.routeStatus=response.status;result.routeError=body.error;
    if(body.previewDataUrl){expect(body.previewDataUrl).toMatch(/^data:image\/webp;base64,/);const b=Buffer.from(body.previewDataUrl.split(',')[1],'base64'),file=path.join(directory,'dark-tan-route-output.webp');await decoded(b);await fs.writeFile(file,b,{flag:'wx',mode:0o600});result.output=file;result.outputSha256=hash(b);result.generationSuccessful=true;}
    expect(response.status,String(body.error)).toBe(200);expect(calls).toBe(1);expect(body.emailDelivered).toBe(false);expect(pilotFixture.mailStubCalls).toBe(1);
  }catch(e){caught=e;result.error=e instanceof Error?e.message:String(e);}
  finally{
    try{const after=await current('after');if(reserved){expect(after.hashes).toEqual(expectedImageHashes);expect(after.prompt).toBe(expectedPrompt);}await verifyPins();result.registryObservation=await observeRegistry(registryBytes,ownIds);result.postflightPassed=true;}
    catch(e){result.postflightPassed=false;result.postflightError=e instanceof Error?e.message:String(e);caught ||= e;}
    result.providerCalls=calls;result.mailStubCalls=pilotFixture.mailStubCalls;result.completedAt=new Date().toISOString();
    await write('result.json',result);vi.unstubAllGlobals();delete pilotFixture.registry[pilot.id];
  }
  if(caught)throw caught;
},240000);

it.skipIf(process.env.DOLLVUE_SY_CURRENT !== '1')('censuses every reserved SY identity and native appearance group without blanket enablement',async()=>{
  const reservationBytes=await fs.readFile(path.join(syOutput,'work-reservation.json'));
  const reservation=JSON.parse(reservationBytes.toString()) as {ids:string[]};const ids=reservation.ids;expect(ids).toHaveLength(298);
    const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString());expect(Object.keys(registry).length).toBeGreaterThan(0);
  const nativeFetch=globalThis.fetch,counts={storefrontBulkReads:0,adminBulkReads:0,generationCalls:0,shopifyWrites:0};
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const u=new URL(input instanceof Request?input.url:String(input));expect(permitted(u,init?.method||'GET',init?.body?.toString(),ids,env.SHOPIFY_STORE_DOMAIN!)).toBe(true);
    if(u.pathname.endsWith('/graphql.json')){if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;}
    return nativeFetch(input,{...init,redirect:'error'});
  });
  try{
    const nodes=new Map<string,Node|null>(),states=new Map<string,State>();
    for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50);
      const r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
      expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);
      b.data.nodes.forEach((p:Node|null,i:number)=>{if(p)expect(p.id).toBe(chunk[i]);nodes.set(chunk[i],p);});
      const s=await adminFetch<{nodes:State[]}>(`query SyAppearanceStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});
      expect(s.nodes).toHaveLength(chunk.length);s.nodes.forEach((p,i)=>{expect(p?.id).toBe(chunk[i]);states.set(p.id,p);});
    }
    const rows=[],unavailable=[];
    for(const [index,id] of ids.entries()){
      const node=nodes.get(id),state=states.get(id)!;
      if(!node){unavailable.push({index:index+1,id,state,scopeExclusions:['not-currently-public'],ready:false});continue;}
      const product=mapShopifyProduct(node),config=dollVueConfigForProduct(product,getCustomizationConfig(product));
      const exclusions=scopeFlags(product.productType,[...product.tags,...state.tags]);
      if(product.extended.brand!=='SY Dolls')exclusions.push('current-brand-not-SY');
      if(product.extended.stockStatus!=='custom')exclusions.push('not-custom');
      if(isDollVueExcluded(product))exclusions.push('runtime-content-excluded');
      if(!isCustomerVisibleProduct(product))exclusions.push('customer-visibility-excluded');
      if(state.status!=='ACTIVE'||!state.publishedAt)exclusions.push('not-active-published');
      const groups=config.groups.flatMap(group=>{
        const choices=group.options.flatMap(option=>{const d=classifyAppearance(group,option);return d.status==='candidate'&&option.swatch?.kind==='image'&&isOwnedOptionAsset(option.swatch.value)?[{groupId:group.id,optionId:option.id,label:option.label,attribute:d.attribute,reference:option.swatch.value}]:[];});
        return choices.length?[{groupId:group.id,label:group.label,selectionMode:group.selectionMode,visibleWhen:group.visibleWhen,referenceFamilyHash:hash(Buffer.from(JSON.stringify(choices.map(c=>[c.attribute,c.reference])))),choices}]:[];
      });
      rows.push({index:index+1,id,handle:product.handle,displayName:product.extended.displayName||product.title,brand:product.extended.brand,status:state.status,productType:product.productType,stockStatus:product.extended.stockStatus,material:product.extended.material,
        currentState:state,scopeExclusions:[...new Set(exclusions)],saleHolds:saleFlags(state),existingRegistryRecord:!!registry[id],fingerprint:dollVueReadinessFingerprint(product,config),configuration:config,groups,
        sources:productImageSources(product).slice(0,8).map((s,sourcePosition)=>({...s,sourcePosition})),ready:false});
    }
    const summary={total:ids.length,currentPublic:rows.length,unavailable:unavailable.length,scopeClear:rows.filter(r=>!r.scopeExclusions.length&&!r.saleHolds.length).length,
      stockStatuses:rows.reduce<Record<string,number>>((a,r)=>{const key=r.stockStatus??'unknown';a[key]=(a[key]||0)+1;return a;},{}),productTypes:[...new Set(rows.map(r=>r.productType))],appearanceRows:rows.filter(r=>r.groups.length).length,...counts};
    const registryObservation=await observeRegistry(registryBytes,ids);
    await fs.writeFile(path.join(syOutput,'current-census.json'),JSON.stringify({checkedAt:new Date().toISOString(),rows,unavailable,summary,registryBase:{entries:Object.keys(registry).length,sha256:hash(registryBytes)},registryObservation,reservationSha256:hash(reservationBytes),ready:false},null,2)+'\n',{flag:'wx',mode:0o600});
    console.info(JSON.stringify(summary));
  }finally{vi.unstubAllGlobals();}
},15*60*1000);

type SyChoice={groupId:string;optionId:string;label:string;attribute:string;reference:string};
type SyGroup={groupId:string;label:string;selectionMode:string;visibleWhen?:unknown;referenceFamilyHash:string;choices:SyChoice[]};
type SyRow=Row&{groups:SyGroup[];productType:string;stockStatus:string;existingRegistryRecord:boolean};
type SyReview={frozen:boolean;inputs:{file:string;sha256:string}[];rows:{id:string;source?:Source;sourceApproved:boolean;approvedAttributes:string[];decision:string;reason:string}[];families:{referenceFamilyHash:string;choices:(SyChoice&{sha256:string;file:string;referenceApproved:boolean})[]}[]};
it.skipIf(process.env.DOLLVUE_SE_IRIS_SALVAGE !== '1')('checks SE skin-approved sources for exact existing SE4 native iris eligibility without inventing choices',async()=>{
  const proposalFile=path.join(output,'four-tone-parent104-proposal.json'),proposalBytes=await fs.readFile(proposalFile);
  const proposal=JSON.parse(proposalBytes.toString()) as {rows:(Row&{source:Source})[]};expect(proposal.rows).toHaveLength(104);
  const reviewFile=path.join(output,'parent104-source-review.json'),reviewBytes=await fs.readFile(reviewFile);
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
  const seedId='gid://shopify/Product/10433981612216',seed=registry[seedId];expect(seed.status).toBe('ready');expect(seed.policy).toBe(DOLLVUE_APPEARANCE_POLICY);
  const exactChoices=seed.choices.filter(c=>c.groupId==='eye-color');expect(exactChoices.map(c=>c.optionId)).toEqual(['handmade-01','handmade-02','handmade-03','handmade-04']);
  const priorIds=Object.keys(registry).filter(id=>JSON.stringify(registry[id].choices.filter(c=>c.groupId==='eye-color'))===JSON.stringify(exactChoices));
  const ids=proposal.rows.map(r=>r.id),nativeFetch=globalThis.fetch,counts={storefrontBulkReads:0,adminBulkReads:0,sourceNetworkReads:0,generationCalls:0,shopifyWrites:0};
  const directory=path.join(output,'iris-only-salvage');await fs.mkdir(directory,{recursive:true,mode:0o700});
  expect(await fs.stat(path.join(directory,'current-family-check.json')).then(()=>true,()=>false)).toBe(false);
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{const u=new URL(input instanceof Request?input.url:String(input));expect(permitted(u,init?.method||'GET',init?.body?.toString(),ids,env.SHOPIFY_STORE_DOMAIN!)).toBe(true);if(u.pathname.endsWith('/graphql.json')){if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;}else if((init?.method||'GET')==='GET')counts.sourceNetworkReads++;return nativeFetch(input,{...init,redirect:'error'});});
  try{
    const references=[];for(const c of exactChoices){expect(isOwnedOptionAsset(c.reference)).toBe(true);const b=await sourceBytes(c.reference);expect(b.sha256).toBe(seed.imageDigests?.[c.reference]);references.push({...c,sha256:b.sha256,width:b.width,height:b.height});}
    const states=new Map<string,State>(),rows=[];
    for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50),r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
      expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);
      const s=await adminFetch<{nodes:State[]}>(`query SeIrisSalvageStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});expect(s.nodes).toHaveLength(chunk.length);
      for(const [i,node] of (b.data.nodes as (Node|null)[]).entries()){
        const id=chunk[i],old=proposal.rows.find(p=>p.id===id)!,state=s.nodes[i];expect(state.id).toBe(id);states.set(id,state);if(node)expect(node.id).toBe(id);
        const product=node?mapShopifyProduct(node):null,config=product?dollVueConfigForProduct(product,getCustomizationConfig(product)):null;
        const eyeGroups=config?.groups.flatMap(group=>{const candidates=group.options.filter(option=>{const d=classifyAppearance(group,option);return d.status==='candidate'&&d.attribute==='eye-color';});return candidates.length?[{id:group.id,label:group.label,selectionMode:group.selectionMode,visibleWhen:group.visibleWhen,choices:candidates.map(option=>({groupId:group.id,optionId:option.id,reference:option.swatch?.kind==='image'?option.swatch.value:null})),labels:candidates.map(o=>o.label)}]:[];})||[];
        const matched=eyeGroups.find(g=>JSON.stringify(g.choices)===JSON.stringify(exactChoices));
        const scopeExclusions=product?scopeFlags(product.productType,[...product.tags,...state.tags]):['not-currently-public'];
        if(product&&(product.extended.brand!=='SE Doll'||product.extended.stockStatus!=='custom'))scopeExclusions.push('not-custom-SE');
        if(product&&(isDollVueExcluded(product)||!isCustomerVisibleProduct(product)))scopeExclusions.push('runtime-visibility-exclusion');if(state.status!=='ACTIVE'||!state.publishedAt)scopeExclusions.push('not-active-published');
        const originalHash=hash(await fs.readFile(old.source.file!));expect(originalHash).toBe(old.source.sha256);
        const sourceCurrent=!!product&&productImageSources(product)[old.source.sourcePosition]?.url===old.source.url;
        const fingerprint=product&&config?dollVueReadinessFingerprint(product,config):null;
        rows.push({index:old.index,id,handle:old.handle,displayName:old.displayName,source:old.source,sourceApproval:'Parent-approved adult nonexplicit exact frame, originally reviewed for skin preparation',preservedSourceSha256:originalHash,sourcePositionUnchanged:sourceCurrent,currentFingerprint:fingerprint,priorFingerprint:old.fingerprint,configurationUnchanged:!!config&&JSON.stringify(config)===JSON.stringify(old.configuration),currentState:state,currentEyeGroups:eyeGroups,exactSE4Family:!!matched,existingRegistryRecord:!!registry[id],scopeExclusions,saleHolds:saleFlags(state),irisVisibilityReview:'not-yet-reviewed-for-iris-edit; approval requires exact native family first',disposition:registry[id]?'existing-record-no-duplicate':!matched?(eyeGroups.length?'different-native-iris-family':'no-native-iris-options'):!sourceCurrent||fingerprint!==old.fingerprint?'source-or-configuration-changed':'requires-individual-iris-visibility-review',ready:false,ownerReviewed:false,previewExclusionOnly:true});
      }
    }
    for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50),s=await adminFetch<{nodes:State[]}>(`query SeIrisSalvageFinalStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});expect(s.nodes).toHaveLength(chunk.length);s.nodes.forEach((state,i)=>{expect(state.id).toBe(chunk[i]);expect(state).toEqual(states.get(state.id));});}
    expect(hash(await fs.readFile(proposalFile))).toBe(hash(proposalBytes));expect(hash(await fs.readFile(reviewFile))).toBe(hash(reviewBytes));const registryObservation=await observeRegistry(registryBytes,ids);
    const summary={reviewedSkinSources:rows.length,existingExactSE4:priorIds.length,duplicateCandidates:rows.filter(r=>r.existingRegistryRecord).length,noNativeIrisOptions:rows.filter(r=>!r.currentEyeGroups.length).length,exactSE4Matches:rows.filter(r=>r.exactSE4Family).length,sourcePositionsUnchanged:rows.filter(r=>r.sourcePositionUnchanged).length,configurationsUnchanged:rows.filter(r=>r.configurationUnchanged).length,approvedIrisAdditions:0};
    await fs.writeFile(path.join(directory,'registry-base.json'),registryBytes,{flag:'wx',mode:0o600});
    await fs.writeFile(path.join(directory,'current-family-check.json'),JSON.stringify({checkedAt:new Date().toISOString(),inputs:[{file:proposalFile,sha256:hash(proposalBytes)},{file:reviewFile,sha256:hash(reviewBytes)}],seedId,exactSE4FamilyHash:hash(Buffer.from(JSON.stringify(exactChoices))),references,existingSE4Ids:priorIds,rows,summary,counts,registryObservation,records:{},ownerReviewed:false,registryWritten:false,skinRetriesStopped:true,checkoutMenuChanged:false},null,2)+'\n',{flag:'wx',mode:0o600});
    console.info(JSON.stringify({summary,counts,registryObservation}));
  }finally{vi.unstubAllGlobals();}
},240000);
it.skipIf(process.env.DOLLVUE_SY_RUNTIME !== '1')('checks exact SY proposal records against current runtime without promoting readiness',async()=>{
  const file=path.join(syOutput,'current-finalization/proposal.json'),bytes=await fs.readFile(file);
  const proposal=JSON.parse(bytes.toString()) as {rows:(Row&{source:Source;choices:(SyChoice&{sha256:string;referenceFamilyHash:string})[]})[];decisions:{id:string}[]};
  const ids=proposal.rows.map(r=>r.id),ownIds=proposal.decisions.map(r=>r.id),registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),nativeFetch=globalThis.fetch;
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{const u=new URL(input instanceof Request?input.url:String(input));expect(permitted(u,init?.method||'GET',init?.body?.toString(),ids,env.SHOPIFY_STORE_DOMAIN!)).toBe(true);return nativeFetch(input,{...init,redirect:'error'});});
  try{
    const records:Record<string,DollVueReadinessRecord>={},checks=[];
    for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50),r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
      expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);
      const states=await adminFetch<{nodes:State[]}>(`query SyRuntimeStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});expect(states.nodes).toHaveLength(chunk.length);
      for(const [i,node] of (b.data.nodes as Node[]).entries()){
        expect(node?.id).toBe(chunk[i]);const row=proposal.rows.find(p=>p.id===node.id)!,product=mapShopifyProduct(node),config=dollVueConfigForProduct(product,getCustomizationConfig(product));expect(states.nodes[i]).toEqual(row.currentState);expect(saleFlags(states.nodes[i])).toEqual([]);
        expect(dollVueReadinessFingerprint(product,config)).toBe(row.fingerprint);expect(config).toEqual(row.configuration);expect(productImageSources(product)[0].url).toBe(row.source.url);expect(isCustomerVisibleProduct(product)).toBe(true);expect(isDollVueExcluded(product)).toBe(false);
        const record:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:row.fingerprint,status:'needs-review',sourcePositions:[0],choices:row.choices.map(({groupId,optionId,reference})=>({groupId,optionId,reference})),imageDigests:{[row.source.url]:row.source.sha256!,...Object.fromEntries(row.choices.map(c=>[c.reference,c.sha256]))}};
        const evaluated=evaluateDollVueReadiness(product,config,{...record,status:'ready'},{published:true,contentExcluded:false});expect(evaluated.publiclyAvailable).toBe(true);expect(evaluated.choices).toHaveLength(row.choices.length);
        expect(evaluateDollVueReadiness(product,config,record,{published:true,contentExcluded:false}).publiclyAvailable).toBe(false);
        const reviewed=reviewedDollVueConfig(config,evaluated,'public');for(const c of record.choices)expect(resolveDollVueSelections(reviewed,[c])).toHaveLength(1);
        records[row.id]=record;checks.push({id:row.id,choiceCount:row.choices.length,status:'needs-review',hypotheticalApprovedRuntimeValid:true,currentState:states.nodes[i]});
      }
    }
    const registryObservation=await observeRegistry(registryBytes,ownIds);expect(hash(await fs.readFile(file))).toBe(hash(bytes));
    await fs.writeFile(path.join(syOutput,'current-finalization/runtime-validation.json'),JSON.stringify({checkedAt:new Date().toISOString(),proposalSha256:hash(bytes),records,checks,registryObservation,ownerReviewed:false,ready:false,registryWritten:false},null,2)+'\n',{flag:'wx',mode:0o600});
    console.info(JSON.stringify({products:checks.length,choices:checks.reduce((n,c)=>n+c.choiceCount,0),ready:false}));
  }finally{vi.unstubAllGlobals();}
},240000);
it.skipIf(!process.env.DOLLVUE_SY_PILOT)('runs one reserved actual route call for one exact reviewed SY family',async()=>{
  const name=process.env.DOLLVUE_SY_PILOT!;expect(['eye34-blue','nail19-06','nail4-ruby']).toContain(name);
  const directory=path.join(syOutput,`pilot-${name}`);await fs.mkdir(directory,{recursive:true,mode:0o700});
  const write=(file:string,value:unknown)=>fs.writeFile(path.join(directory,file),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  expect(await fs.stat(path.join(directory,'reservation.json')).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;}),'Never reuse a consumed family authorization').toBe(false);
  const inputFile=path.join(syOutput,'precise-family-pilot-inputs.json'),inputBytes=await fs.readFile(inputFile);
  const inputs=JSON.parse(inputBytes.toString()) as {frozen:boolean;reviewSha256:string;pilots:{name:string;productId:string;handle:string;index:number;source:Source;fingerprint:string;referenceFamilyHash:string;choice:SyChoice;reference:{file:string;sha256:string};maxProviderCalls:number;noRetries:boolean;ownerReviewed:boolean}[]};
  expect(inputs.frozen).toBe(true);const pilot=inputs.pilots.find(p=>p.name===name)!;expect(pilot).toMatchObject({maxProviderCalls:1,noRetries:true,ownerReviewed:false});
  const reviewFile=path.join(syOutput,'source-reference-review.json'),reviewBytes=await fs.readFile(reviewFile);expect(hash(reviewBytes)).toBe(inputs.reviewSha256);
  const review=JSON.parse(reviewBytes.toString()) as SyReview,decision=review.rows.find(r=>r.id===pilot.productId)!;
  expect(decision.sourceApproved).toBe(true);expect(decision.approvedAttributes).toContain(pilot.choice.attribute);expect(decision.source).toEqual(pilot.source);
  expect(review.families.find(f=>f.referenceFamilyHash===pilot.referenceFamilyHash)?.choices.some(c=>c.referenceApproved&&c.reference===pilot.choice.reference&&c.sha256===pilot.reference.sha256)).toBe(true);
  const proposalFile=path.join(syOutput,'current-finalization/proposal.json'),proposalBytes=await fs.readFile(proposalFile);
  const proposal=JSON.parse(proposalBytes.toString()) as {reviewSha256:string;rows:(Row&{source:Source;choices:(SyChoice&{sha256:string;referenceFamilyHash:string})[]})[];decisions:{id:string}[]};
  expect(proposal.reviewSha256).toBe(inputs.reviewSha256);const row=proposal.rows.find(r=>r.id===pilot.productId)!;expect(row).toBeTruthy();expect(row.source).toEqual(pilot.source);expect(row.fingerprint).toBe(pilot.fingerprint);
  expect(row.choices.some(c=>c.groupId===pilot.choice.groupId&&c.optionId===pilot.choice.optionId&&c.reference===pilot.choice.reference&&c.sha256===pilot.reference.sha256&&c.referenceFamilyHash===pilot.referenceFamilyHash)).toBe(true);
  const pins=[{file:inputFile,sha256:hash(inputBytes)},{file:reviewFile,sha256:hash(reviewBytes)},{file:proposalFile,sha256:hash(proposalBytes)},{file:pilot.source.file!,sha256:pilot.source.sha256!},{file:pilot.reference.file,sha256:pilot.reference.sha256}];
  async function verifyPins(){for(const p of pins){expect((await fs.realpath(p.file)).startsWith(`${await fs.realpath(syOutput)}${path.sep}`)).toBe(true);expect(hash(await fs.readFile(p.file))).toBe(p.sha256);}}
  await verifyPins();const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),ownIds=proposal.decisions.map(d=>d.id);expect(ownIds).toHaveLength(298);expect(JSON.parse(registryBytes.toString())[pilot.productId]).toBeUndefined();
  const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);expect(env.DOLLVUE_ENABLED).toBe('true');expect(env.VENICE_API_KEY).toBeTruthy();
  const choice={groupId:pilot.choice.groupId,optionId:pilot.choice.optionId},imageDigests={[pilot.source.url]:pilot.source.sha256!,[pilot.choice.reference]:pilot.reference.sha256};
  pilotFixture.registry[pilot.productId]={productId:pilot.productId,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:pilot.fingerprint,status:'ready',sourcePositions:[0],choices:[{...choice,reference:pilot.choice.reference}],imageDigests};pilotFixture.mailStubCalls=0;
  const nativeFetch=globalThis.fetch;let calls=0,reserved=false,expectedHashes:string[]=[],expectedPrompt='';
  const result:Record<string,unknown>={name,productId:pilot.productId,referenceFamilyHash:pilot.referenceFamilyHash,choice,pins,ownerReviewed:false,ready:false,parentOutputReview:'pending',shopifyWrites:0,registryWritten:false,mailSent:0,referenceTransport:'Exact local owned bytes intercepted in test; no production reference request',testDoubles:['readiness fixture','QA session','account usage','no-op email']};
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');expect(u.protocol).toBe('https:');expect(u.username||u.password||u.port).toBe('');
    if(u.href==='https://api.venice.ai/api/v1/image/multi-edit'){
      onlyFirstProviderCall(calls);expect(reserved).toBe(true);expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toHaveLength(2);
      const hashes=body.images.map((s:string)=>{expect(s).toMatch(/^data:image\//);return hash(Buffer.from(s.split(',')[1],'base64'));});expect(hashes).toEqual(expectedHashes);expect(body.prompt).toBe(expectedPrompt);await verifyPins();await observeRegistry(registryBytes,ownIds);
      calls++;await write('provider-request.json',{model:body.modelId,prompt:body.prompt,imageHashes:hashes,requestSha256:hash(Buffer.from(String(init?.body))),aspectRatio:body.aspect_ratio,resolution:body.resolution});
      const response=await nativeFetch(input,{...init,redirect:'error'});result.providerStatus=response.status;await write('provider-status.json',{status:response.status,receivedAt:new Date().toISOString()});
      if(response.ok){const b=Buffer.from(await response.clone().arrayBuffer());await fs.writeFile(path.join(directory,'provider-original.webp'),b,{flag:'wx',mode:0o600});result.providerOriginalSha256=hash(b);}return response;
    }
    if(u.hostname===env.SHOPIFY_STORE_DOMAIN){expect(method).toBe('POST');if(u.pathname.endsWith('/graphql.json')){const b=JSON.parse(String(init?.body));expect(b.query.trim()).toMatch(/^query\b/);expect(b.query).not.toMatch(/\bmutation\b/);expect(b.variables?.handle===pilot.handle||b.variables?.id===pilot.productId||(Array.isArray(b.variables?.ids)&&b.variables.ids.length===1&&b.variables.ids[0]===pilot.productId)).toBe(true);}else expect(u.pathname).toBe('/admin/oauth/access_token');return nativeFetch(input,{...init,redirect:'error'});}
    expect(method).toBe('GET');expect(init?.cache).toBe('no-store');
    if(u.href===new URL(pilot.choice.reference,origin).href){expect(isOwnedOptionAsset(pilot.choice.reference)).toBe(true);const b=await fs.readFile(path.join(process.cwd(),'public',pilot.choice.reference));expect(hash(b)).toBe(pilot.reference.sha256);return new Response(new Uint8Array(b),{headers:{'Content-Type':'image/webp','Content-Length':String(b.length)}});}
    expect(u.href).toBe(pilot.source.url);expect(u.hostname).toBe('cdn.shopify.com');expect(isOwnedOptionAsset(u.href)).toBe(true);return nativeFetch(input,{...init,redirect:'error'});
  });
  async function current(stage:string){
    const product=await getProductByHandle(pilot.handle,{strict:true,cache:'no-store'});expect(product?.id).toBe(pilot.productId);expect(isCustomerVisibleProduct(product!)).toBe(true);expect(isDollVueExcluded(product!)).toBe(false);expect(product!.extended.brand).toBe('SY Dolls');expect(product!.extended.stockStatus).toBe('custom');expect(product!.productType).toBe('Companion doll');
    const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(pilot.fingerprint);expect(config).toEqual(row.configuration);expect(productImageSources(product!)[0].url).toBe(pilot.source.url);
    const state=await adminFetch<{nodes:State[]}>(`query SyPilotState($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:[pilot.productId]});expect(state.nodes).toHaveLength(1);expect(state.nodes[0]).toEqual(row.currentState);expect(state.nodes[0].status).toBe('ACTIVE');expect(state.nodes[0].publishedAt).toBeTruthy();expect(saleFlags(state.nodes[0])).toEqual([]);expect(scopeFlags(product!.productType,[...product!.tags,...state.nodes[0].tags])).toEqual([]);expect((await getCurrentDollVueHolds([pilot.productId])).get(pilot.productId)).toBe('clear');
    const defaults=getDefaultSelections(config),resolved=resolveCustomization(config,{...defaults,[choice.groupId]:choice.optionId},0);expect(resolved.issues).toEqual([]);expect(resolved.selections[choice.groupId]).toBe(choice.optionId);
    const images=[await normalizeReviewedImage({url:pilot.source.url,sha256:pilot.source.sha256!,origin}),await normalizeReviewedImage({url:pilot.choice.reference,sha256:pilot.reference.sha256,origin,optionReference:true})],hashes=images.map(s=>hash(Buffer.from(s.split(',')[1],'base64')));
    expect(hashes[0]).toBe(pilot.source.sha256);const eligibility=await resolveCurrentDollVueEligibility(product!);expect(eligibility.available).toBe(true);const selections=resolveDollVueSelections(eligibility.config,[choice]);expect(selections).toHaveLength(1);expect(selections[0].option.id).toBe(choice.optionId);
    const prompt=buildDollVuePrompt(product!,selections);expect(prompt).toContain(pilot.choice.attribute==='eye-color'?'the visible iris color only':'the visible nail polish color only');
    const registryObservation=await observeRegistry(registryBytes,ownIds);await write(`${stage}-current-verification.json`,{checkedAt:new Date().toISOString(),fingerprint:pilot.fingerprint,currentState:state.nodes[0],imageDigests,normalizedImageHashes:hashes,promptSha256:hash(Buffer.from(prompt)),hold:'clear',registryObservation});return {hashes,prompt};
  }
  let caught:unknown;
  try{
    const before=await current('before');expectedHashes=before.hashes;expectedPrompt=before.prompt;const payload={productHandle:pilot.handle,sourcePosition:0,selections:[choice]};
    await fs.writeFile(path.join(directory,'registry-base.json'),registryBytes,{flag:'wx',mode:0o600});await write('reservation.json',{reservedAt:new Date().toISOString(),authorization:'User authorized one actual route/provider pilot per precise SY family',maxProviderCalls:1,noRetries:true,pins,registrySha256:hash(registryBytes),requestSha256:hash(Buffer.from(JSON.stringify(payload))),normalizedImageHashes:expectedHashes,promptSha256:hash(Buffer.from(expectedPrompt))});reserved=true;
    const response=await generatePilot(new Request(`${origin}/dollvue/generate`,{method:'POST',headers:{origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body:JSON.stringify(payload)})),body=await response.json();result.routeStatus=response.status;result.routeError=body.error;
    if(body.previewDataUrl){expect(body.previewDataUrl).toMatch(/^data:image\/webp;base64,/);const b=Buffer.from(body.previewDataUrl.split(',')[1],'base64'),file=path.join(directory,'route-output.webp');await decoded(b);await fs.writeFile(file,b,{flag:'wx',mode:0o600});result.output=file;result.outputSha256=hash(b);}
    expect(response.status,String(body.error)).toBe(200);expect(calls).toBe(1);expect(body.emailDelivered).toBe(false);expect(pilotFixture.mailStubCalls).toBe(1);
  }catch(e){caught=e;result.error=e instanceof Error?e.message:String(e);}
  finally{
    try{const after=await current('after');if(reserved){expect(after.hashes).toEqual(expectedHashes);expect(after.prompt).toBe(expectedPrompt);}await verifyPins();result.registryObservation=await observeRegistry(registryBytes,ownIds);result.postflightPassed=true;}catch(e){caught ||= e;result.postflightPassed=false;result.postflightError=e instanceof Error?e.message:String(e);}
    result.providerCalls=calls;result.mailStubCalls=pilotFixture.mailStubCalls;result.completedAt=new Date().toISOString();await write('result.json',result);vi.unstubAllGlobals();delete pilotFixture.registry[pilot.productId];
  }
  if(caught)throw caught;
},240000);
it.skipIf(process.env.DOLLVUE_SY_FINALIZE !== '1')('binds each reviewed SY source to current native choices without changing registry or checkout',async()=>{
  const parentApproved=process.env.DOLLVUE_SY_PARENT_FINALIZE==='1';
  const reviewFile=path.join(syOutput,'source-reference-review.json'),reviewBytes=await fs.readFile(reviewFile),review=JSON.parse(reviewBytes.toString()) as SyReview;
  expect(review.frozen).toBe(true);for(const p of review.inputs)expect(hash(await fs.readFile(p.file))).toBe(p.sha256);
  const census=JSON.parse(await fs.readFile(path.join(syOutput,'current-census.json'),'utf8')) as {rows:SyRow[]};
  const ids=census.rows.map(r=>r.id);expect(ids).toHaveLength(298);expect(review.rows).toHaveLength(298);
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString());
  const nodes=new Map<string,Node|null>(),states=new Map<string,State>(),nativeFetch=globalThis.fetch;
  const counts={storefrontBulkReads:0,adminBulkReads:0,imageReads:0,defaults:0,choices:0,generationCalls:0,shopifyWrites:0};
  const directory=path.join(syOutput,parentApproved?'parent-approved-finalization':'current-finalization');await fs.mkdir(directory,{recursive:true,mode:0o700});
  const write=(name:string,value:unknown)=>fs.writeFile(path.join(directory,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  const parentPins:{file:string;sha256:string}[]=[],approvedFamilies=new Set<string>();
  const readyRecords:Record<string,DollVueReadinessRecord>={};
  let priorProposal:{rows:(Row&{source:Source;choices:(SyChoice&{sha256:string;referenceFamilyHash:string})[]})[]}|undefined;
  if(parentApproved){
    const verdictFile=path.join(syOutput,'parent-pilot-verdicts.json'),verdictBytes=await fs.readFile(verdictFile),verdict=JSON.parse(verdictBytes.toString());
    expect(verdict).toMatchObject({frozen:true,ownerReviewed:false,generationAuthorized:false});expect(verdict.pilots.map((p:{name:string})=>p.name)).toEqual(['eye34-blue','nail19-06','nail4-ruby']);
    parentPins.push({file:verdictFile,sha256:hash(verdictBytes)});
    for(const p of verdict.pilots){
      expect(p.decision).toBe('PASS_MINOR_VARIATION_ACCEPTED');const dir=path.join(syOutput,`pilot-${p.name}`),resultFile=path.join(dir,'result.json'),resultBytes=await fs.readFile(resultFile),result=JSON.parse(resultBytes.toString());
      expect(result).toMatchObject({providerCalls:1,routeStatus:200,postflightPassed:true,ownerReviewed:false,mailSent:0,registryWritten:false});expect(result.outputSha256).toBe(p.outputSha256);
      const comparisonFile=path.join(dir,'source-reference-output-review.png');expect(hash(await fs.readFile(result.output))).toBe(p.outputSha256);expect(hash(await fs.readFile(comparisonFile))).toBe(p.comparisonSha256);
      parentPins.push({file:resultFile,sha256:hash(resultBytes)},{file:result.output,sha256:p.outputSha256},{file:comparisonFile,sha256:p.comparisonSha256});approvedFamilies.add(result.referenceFamilyHash);
    }
    const priorFile=path.join(syOutput,'current-finalization/proposal.json'),priorBytes=await fs.readFile(priorFile);priorProposal=JSON.parse(priorBytes.toString());parentPins.push({file:priorFile,sha256:hash(priorBytes)});
    await observeRegistry(await fs.readFile(path.join(syOutput,'current-finalization/registry-base.json')),ids);
  }
  expect(await fs.stat(path.join(directory,'proposal.json')).then(()=>true,()=>false)).toBe(false);
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const u=new URL(input instanceof Request?input.url:String(input));expect(permitted(u,init?.method||'GET',init?.body?.toString(),ids,env.SHOPIFY_STORE_DOMAIN!)).toBe(true);
    if(u.pathname.endsWith('/graphql.json')){if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;}else if((init?.method||'GET')==='GET')counts.imageReads++;
    return nativeFetch(input,{...init,redirect:'error'});
  });
  async function readStates(){const result:State[]=[];for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50),s=await adminFetch<{nodes:State[]}>(`query SyFinalStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});expect(s.nodes).toHaveLength(chunk.length);s.nodes.forEach((p,i)=>{expect(p?.id).toBe(chunk[i]);result.push(p);});}return result;}
  try{
    const startedAt=new Date().toISOString();for(const state of await readStates())states.set(state.id,state);
    for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50),r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
      expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);b.data.nodes.forEach((p:Node|null,i:number)=>{if(p)expect(p.id).toBe(chunk[i]);nodes.set(chunk[i],p);});}
    for(const f of review.families)for(const c of f.choices.filter(c=>c.referenceApproved)){expect(hash(await fs.readFile(c.file))).toBe(c.sha256);expect((await sourceBytes(c.reference)).sha256).toBe(c.sha256);expect(c.attribute).not.toBe('skin-tone');}
    const rows=[],decisions=[];
    for(const old of census.rows){
      const decision=review.rows.find(r=>r.id===old.id)!,state=states.get(old.id)!,node=nodes.get(old.id),technicalGaps:string[]=[];
      const product=node?mapShopifyProduct(node):null,config=product?dollVueConfigForProduct(product,getCustomizationConfig(product)):null;
      const scopeExclusions=product?scopeFlags(product.productType,[...product.tags,...state.tags]):['not-currently-public'];
      if(product&&(product.extended.brand!=='SY Dolls'||product.extended.stockStatus!=='custom'||product.productType!=='Companion doll'))scopeExclusions.push('not-custom-SY-fullbody');
      if(product&&(isDollVueExcluded(product)||!isCustomerVisibleProduct(product)))scopeExclusions.push('runtime-visibility-exclusion');
      if(state.status!=='ACTIVE'||!state.publishedAt)scopeExclusions.push('not-active-published');
      const saleHolds=saleFlags(state),choices:(SyChoice&{sha256:string;referenceFamilyHash:string})[]=[],choiceGaps:unknown[]=[];
      if(decision.sourceApproved&&!scopeExclusions.length&&!saleHolds.length&&product&&config){
        if(registry[old.id])technicalGaps.push('existing-registry-record-needs-parent-merge');
        if(dollVueReadinessFingerprint(product,config)!==old.fingerprint||JSON.stringify(config)!==JSON.stringify(old.configuration))technicalGaps.push('native-configuration-or-fingerprint-changed');
        const source=decision.source!;
        if(productImageSources(product)[0]?.url!==source.url)technicalGaps.push('source-zero-url-changed');
        if(!technicalGaps.length){
          expect(source.sourcePosition).toBe(0);expect(hash(await fs.readFile(source.file!))).toBe(source.sha256);expect((await sourceBytes(source.url)).sha256).toBe(source.sha256);
          const before=JSON.stringify(config),defaults=getDefaultSelections(config),defaultResult=resolveCustomization(config,defaults,0);
          if(defaultResult.issues.length)technicalGaps.push(`default-resolution: ${JSON.stringify(defaultResult.issues)}`);else counts.defaults++;
          for(const native of old.groups){
            const family=review.families.find(f=>f.referenceFamilyHash===native.referenceFamilyHash);expect(family).toBeTruthy();
            const group=config.groups.find(g=>g.id===native.groupId)!;expect(group).toBeTruthy();
            for(const c of native.choices){const approved=family!.choices.find(r=>r.reference===c.reference&&r.attribute===c.attribute&&r.label===c.label);
              if(!approved?.referenceApproved||!decision.approvedAttributes.includes(c.attribute)){choiceGaps.push({groupId:c.groupId,optionId:c.optionId,reason:!approved?.referenceApproved?'reference-not-approved':'feature-not-visible-in-approved-source'});continue;}
              const option=group.options.find(o=>o.id===c.optionId)!;expect(option?.label).toBe(c.label);expect(option.swatch?.kind).toBe('image');expect(option.swatch?.value).toBe(c.reference);
              const resolved=resolveCustomization(config,{...defaults,[group.id]:option.id},0);
              if(resolved.issues.length||resolved.selections[group.id]!==option.id||!resolved.selectedOptions.some(o=>o.groupId===group.id&&o.optionId===option.id)||!resolved.cartAttributes.some(a=>a.key===`DollWow ${group.label}`&&a.value.includes(option.label))){choiceGaps.push({groupId:c.groupId,optionId:c.optionId,reason:'current-condition-or-cart-resolution',issues:resolved.issues});continue;}
              choices.push({...c,sha256:approved.sha256,referenceFamilyHash:native.referenceFamilyHash});counts.choices++;
            }
          }
          expect(JSON.stringify(config)).toBe(before);
        }
        if(!technicalGaps.length&&choices.length){
          if(parentApproved){
            const prior=priorProposal!.rows.find(r=>r.id===old.id)!;expect(prior).toBeTruthy();expect(source).toEqual(prior.source);expect(choices).toEqual(prior.choices);expect(old.fingerprint).toBe(prior.fingerprint);
            expect(choices.every(c=>approvedFamilies.has(c.referenceFamilyHash))).toBe(true);
            const record:DollVueReadinessRecord={productId:old.id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:old.fingerprint,status:'ready',sourcePositions:[0],choices:choices.map(({groupId,optionId,reference})=>({groupId,optionId,reference})),imageDigests:{[source.url]:source.sha256!,...Object.fromEntries(choices.map(c=>[c.reference,c.sha256]))}};
            const evaluated=evaluateDollVueReadiness(product,config,record,{published:true,contentExcluded:false});expect(evaluated.publiclyAvailable).toBe(true);expect(evaluated.choices).toHaveLength(choices.length);
            const reviewed=reviewedDollVueConfig(config,evaluated,'public');for(const c of choices)expect(resolveDollVueSelections(reviewed,[c])).toHaveLength(1);readyRecords[old.id]=record;
          }
          rows.push({index:old.index,id:old.id,handle:old.handle,displayName:old.displayName,source,fingerprint:old.fingerprint,configuration:config,currentState:state,choices,choiceGaps,ownerReviewed:false,ready:parentApproved,status:parentApproved?'parent-pilot-reviewed-current-checks-passed':'awaiting-family-pilots-and-parent-output-review'});
        }
      }
      decisions.push({index:old.index,id:old.id,sourceDecision:decision.decision,sourceReason:decision.reason,sourceApproved:decision.sourceApproved,approvedAttributes:decision.approvedAttributes,scopeExclusions,saleHolds,technicalGaps,choiceGaps,preparedChoices:technicalGaps.length?0:choices.length,currentState:state,ready:parentApproved&&Object.hasOwn(readyRecords,old.id)});
    }
    for(const state of await readStates())expect(state).toEqual(states.get(state.id));
    expect(hash(await fs.readFile(reviewFile))).toBe(hash(reviewBytes));const registryObservation=await observeRegistry(registryBytes,ids);
    for(const pin of parentPins)expect(hash(await fs.readFile(pin.file))).toBe(pin.sha256);
    if(parentApproved){expect(rows).toHaveLength(88);expect(counts.choices).toBe(3820);expect(Object.keys(readyRecords).sort()).toEqual(priorProposal!.rows.map(r=>r.id).sort());}
    await fs.writeFile(path.join(directory,'registry-base.json'),registryBytes,{flag:'wx',mode:0o600});
    if(parentApproved)await write('ready-records.json',readyRecords);
    await write('proposal.json',{startedAt,completedAt:new Date().toISOString(),reviewSha256:hash(reviewBytes),registryObservation,parentPins,rows,decisions,counts,ownerReviewed:false,ready:parentApproved,registryWritten:false,checkoutMenuChanged:false,shopifyWrites:0,approvalScope:parentApproved?'Parent pilot-only minor-variation acceptance plus assistant per-source and exact-reference review; not exact colorimetry or perfect geometry':undefined});
    console.info(JSON.stringify({preparedProducts:rows.length,allIdentities:decisions.length,...counts,registryObservation,ready:parentApproved}));
  }finally{vi.unstubAllGlobals();}
},40*60*1000);
it.skipIf(process.env.DOLLVUE_SY_IMAGES !== '1')('preserves SY native source-zero and exact reference originals for individual inspection',async()=>{
  const input=await fs.readFile(path.join(syOutput,'current-census.json')),census=JSON.parse(input.toString()) as {rows:SyRow[]};
  const rows=census.rows.filter(r=>r.groups.length);expect(rows).toHaveLength(195);
  const nativeFetch=globalThis.fetch;let imageReads=0;
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{const u=new URL(String(input));expect(permitted(u,init?.method||'GET',undefined,[],'')).toBe(true);imageReads++;return nativeFetch(input,{...init,redirect:'error'});});
  try{
    const families=new Map<string,SyGroup>();for(const r of rows)for(const g of r.groups)if(!families.has(g.referenceFamilyHash))families.set(g.referenceFamilyHash,g);
    const references=[];
    for(const [familyHash,group] of families){
      const choices=[];
      for(const c of group.choices){expect(c.reference).toMatch(/^\/option-assets\/[a-f0-9]{64}\.webp$/);const sha256=path.basename(c.reference,'.webp'),b=await sourceBytes(c.reference);expect(b.sha256).toBe(sha256);
        const file=path.join(syOutput,`reference-${sha256}.webp`);await fs.writeFile(file,b.bytes,{flag:'wx',mode:0o600});choices.push({...c,sha256,file,width:b.width,height:b.height});
      }
      const sheets=[];for(let n=0;n<choices.length;n+=12){const part=choices.slice(n,n+12),tiles=[];for(const [i,c] of part.entries())tiles.push(await tile(c.file,[`${n+i+1}. ${c.label}`,group.label,'REFERENCE / NOT APPROVED']));sheets.push(await sheet(tiles,`refs-${familyHash.slice(0,12)}-${n+1}-${n+part.length}.png`,4,syOutput));}
      references.push({referenceFamilyHash:familyHash,label:group.label,choices,sheets});
    }
    for(const row of rows){const s=row.sources[0];if(!s)continue;
      try{const b=await sourceBytes(s.url),file=path.join(syOutput,`source-${row.index}-p0.${b.format==='jpeg'?'jpg':b.format}`);await fs.writeFile(file,b.bytes,{flag:'wx',mode:0o600});Object.assign(s,{file,sha256:b.sha256,width:b.width,height:b.height});}
      catch(e){s.error=e instanceof Error?e.message:String(e);}
    }
    const sheets=[];
    for(let n=0;n<rows.length;n+=12){const part=rows.slice(n,n+12),tiles=[];for(const row of part)if(row.sources[0]?.file)tiles.push(await tile(row.sources[0].file!,[`${row.index}. ${row.displayName.slice(0,34)}`,`${row.id.split('/').at(-1)} | p0`,row.scopeExclusions.length?'SCOPE EXCLUDED':'SOURCE / NOT APPROVED']));if(tiles.length)sheets.push(await sheet(tiles,`sources-${n+1}-${n+part.length}.png`,4,syOutput));}
    await fs.writeFile(path.join(syOutput,'source-reference-manifest.json'),JSON.stringify({preparedAt:new Date().toISOString(),censusSha256:hash(input),rows,references,sheets,imageReads,generationCalls:0,registryWritten:false,ownerReviewed:false,ready:false},null,2)+'\n',{flag:'wx',mode:0o600});
    console.info(JSON.stringify({nativeAppearanceRows:rows.length,referenceFamilies:references.length,imageReads,sourceFiles:rows.filter(r=>r.sources[0]?.file).length}));
  }finally{vi.unstubAllGlobals();}
},40*60*1000);
