import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it, vi } from 'vitest';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { classifyAppearance } from '@/lib/dollvue/appearance';
import { dollVueReadinessFingerprint } from '@/lib/dollvue/readiness';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output=path.join(root,'aibei-ex-iris-preparation/current-drafts');
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
type Node=Parameters<typeof mapShopifyProduct>[0];
type State={id:string;handle:string;status:string;publishedAt:string|null;tags:string[];hold:{value:string}|null;
 resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}}};
type AdminNode=Omit<Node,'variants'|'priceRange'> & State & {variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
type Candidate={id:string;handle:string;brand:string;status:string;familyKey:string};
type Ref={optionId:string;label:string;referenceUrl:string;sha256:string;cachedFile:string};
type Family={key:string;brand:string;choices:Ref[];rows:Array<Omit<Candidate,'familyKey'>>};
function scopeFlags(type:string,tags:string[]){return [type,...tags.filter(t=>t!=='catalog-review-hold')].filter(t=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i.test(t));}
it('retains general catalog hold but rejects private scope holds',()=>{
 expect(scopeFlags('Custom Silicone doll',['catalog-review-hold'])).toEqual([]);
 expect(scopeFlags('Custom Silicone doll',['catalog-image-review-hold'])).toHaveLength(1);
});
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
const common=`id handle title description seo{title description} vendor productType tags featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}`;
const stateFields='id handle status publishedAt tags hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}';
const sfQuery=`query AibeiExPreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{${common} priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode}} variants(first:30){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{previewImage{url altText width height} sources{url mimeType}}}}}}}}`;
const adminQuery=`query AibeiExDraftPreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{${common} ${stateFields} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}}} shop{currencyCode}}`;

it.skipIf(process.env.DOLLVUE_AIBEI_EX_PREPARATION!=='1')('prepares 104 current Aibei and EX drafts with accepted iris references and unreviewed sources',async()=>{
 const input=path.join(root,'aibei-ex-iris-preparation/cached-iris-reference-preparation.json'),inputBytes=await fs.readFile(input);
 expect(hash(inputBytes)).toBe('f487cd72f0545d1eebbe129e3d9ccd329982064d2aa315a0b915c1bf16f45ea9');
 const inventory=JSON.parse(inputBytes.toString()) as {groups:Family[]};
 const evidenceFile=path.join(root,'aibei-ex-iris-preparation/reviewed-reference-evidence.json'),evidenceBytes=await fs.readFile(evidenceFile);
 expect(hash(evidenceBytes)).toBe('7aedf285161461fd8af08a495831e0e7016fbd6740ebbb3b653ba9e17dddbae5');
 const evidence=JSON.parse(evidenceBytes.toString());
 expect(evidence).toMatchObject({frozen:true,reviewer:'parent-assistant',ownerReviewed:false,humanApproval:false,status:'parent-assistant-reference-meaning-accepted'});
 expect(evidence.sourcePreparation).toEqual({file:input,sha256:hash(inputBytes)});
 const families=new Map(inventory.groups.map(g=>[g.key,g]));
 expect(inventory.groups.map(g=>[g.brand,g.rows.length,g.choices.length])).toEqual([['Aibei Dolls',59,4],['Aibei Dolls',26,7],['EXdoll',19,6]]);
 for(const family of inventory.groups){
  const accepted=evidence.groups.find((g:{key:string})=>g.key===family.key);expect(accepted).toBeDefined();
  expect(accepted.references.map(({optionId,label,referenceUrl,sha256,cachedFile}:Ref)=>({optionId,label,referenceUrl,sha256,cachedFile}))).toEqual(family.choices.map(({optionId,label,referenceUrl,sha256,cachedFile})=>({optionId,label,referenceUrl,sha256,cachedFile})));
  for(const ref of family.choices){expect(hash(await fs.readFile(ref.cachedFile))).toBe(ref.sha256);}
  expect(hash(await fs.readFile(accepted.reviewedContactSheet.file))).toBe(accepted.reviewedContactSheet.sha256);
 }
 const selected:Candidate[]=inventory.groups.flatMap(g=>g.rows.map(r=>({...r,familyKey:g.key})));
 expect(selected).toHaveLength(104);expect(selected.every(r=>r.status==='DRAFT')).toBe(true);
 const ids=selected.map(r=>r.id);expect(new Set(ids).size).toBe(104);
 await fs.mkdir(output,{recursive:true,mode:0o700});
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 expect(await fs.stat(path.join(output,'candidate-manifest.json')).then(()=>true,()=>false)).toBe(false);
 expect(hasShopifyStorefrontEnv()).toBe(true);
 const counts={storefrontBulkReads:0,adminBulkReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||'GET';
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const b=JSON.parse(String(init?.body));expect(b.query).toMatch(/^query\b/);expect(b.query).not.toMatch(/\bmutation\b/);
   expect(b.variables.ids.length).toBeLessThanOrEqual(50);expect(b.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token'){expect(method).toBe('POST');}
  else{expect(method).toBe('GET');expect(isOwnedOptionAsset(u.href)).toBe(true);counts.imageReads++;}
  return nativeFetch(input,init);
 });
 try{
  const nodes=new Map<string,Node|null>(),states=new Map<string,State|null>();
  for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50);
   const r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
   expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);
   b.data.nodes.forEach((p:Node|null,i:number)=>{if(p)expect(p.id).toBe(chunk[i]);nodes.set(chunk[i],p);});
   const s=await adminFetch<{nodes:Array<State|null>}>(`query AibeiExStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});
   expect(s.nodes).toHaveLength(chunk.length);s.nodes.forEach((p,i)=>{if(p)expect(p.id).toBe(chunk[i]);states.set(chunk[i],p);});
  }
  const draftIds=selected.filter(p=>p.status==='DRAFT').map(p=>p.id),drafts=new Map<string,Node>();
  for(let offset=0;offset<draftIds.length;offset+=50){const chunk=draftIds.slice(offset,offset+50);const d=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(adminQuery,{ids:chunk});
   expect(d.nodes).toHaveLength(chunk.length);expect(d.nodes.map(p=>p?.id)).toEqual(chunk);
   for(const p of d.nodes){expect(p).toBeTruthy();expect(draftIds).toContain(p.id);
    expect(p.status).toBe('DRAFT');expect(p.publishedAt).toBeNull();expect(Object.hasOwn(p,'hold')).toBe(true);expect(p.hold?.value.trim()||'').toBe('');
    expect(p.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(p.resourcePublications.nodes.some(v=>v.isPublished)).toBe(false);
    expect(p.variants.edges.length).toBeGreaterThan(0);const price={amount:p.variants.edges[0].node.price,currencyCode:d.shop.currencyCode};
    drafts.set(p.id,{...p,priceRange:{minVariantPrice:price,maxVariantPrice:price},variants:{edges:p.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:d.shop.currencyCode}}}))}});
   }
  }
  const checkedAt=new Date().toISOString();await save('current-state-and-holds.json',{checkedAt,rows:[...states.values()],publicationChanged:false});
  async function imageBytes(url:string){
   expect(isOwnedOptionAsset(url)).toBe(true);const r=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
   expect(r.ok).toBe(true);expect(r.headers.get('content-type')).toMatch(/^image\//);expect(Number(r.headers.get('content-length'))).toBeLessThanOrEqual(20*1024*1024);
   const reader=r.body!.getReader(),chunks:Buffer[]=[];let size=0;try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>20*1024*1024)throw Error('image exceeds bound');chunks.push(Buffer.from(p.value));}}finally{void reader.cancel();}
   const bytes=Buffer.concat(chunks),decoder=sharp(bytes,{limitInputPixels:25000000,animated:true}).timeout({seconds:5}),meta=await decoder.metadata();expect(meta.pages||1).toBe(1);expect(meta.width).toBeGreaterThan(0);expect(meta.height).toBeGreaterThan(0);expect(['jpeg','png','webp','gif']).toContain(meta.format);await decoder.clone().raw().toBuffer();
   return {bytes,sha256:hash(bytes),width:meta.width!,height:meta.height!,format:meta.format!};
  }
  const referenceEvidence=[];
  for(const family of inventory.groups)for(const ref of family.choices){
   const local=await fs.readFile(path.join(process.cwd(),'public',ref.referenceUrl));expect(hash(local)).toBe(ref.sha256);
   const image=await imageBytes(new URL(ref.referenceUrl,'https://dollwow.com').href);expect(image.sha256).toBe(ref.sha256);
   referenceEvidence.push({...ref,familyKey:family.key,productionBytesMatch:true,meaningReviewed:true,reviewer:'parent-assistant',ownerReviewed:false});
  }
  await save('reference-evidence.json',{checkedAt,references:referenceEvidence,acceptedEvidence:{file:evidenceFile,sha256:hash(evidenceBytes)},meaningReviewed:true,ownerReviewed:false});
  const rows:any[]=[],excluded:any[]=[];
  for(const [i,old]of selected.entries()){
   try{
    const family=families.get(old.familyKey)!;const refs=family.choices;const state=states.get(old.id);expect(state).toBeTruthy();expect(state!.handle).toBe(old.handle);expect(state!.status).toBe(old.status);
    expect(Object.hasOwn(state!,'hold')).toBe(true);expect(state!.hold?.value.trim()||'').toBe('');
    if(old.status==='ACTIVE'){expect(state!.publishedAt).toBeTruthy();expect(nodes.get(old.id)).toBeTruthy();}
    else{expect(state!.publishedAt).toBeNull();expect(nodes.get(old.id)).toBeNull();expect(state!.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state!.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false);}
    const node=nodes.get(old.id)||drafts.get(old.id);expect(node).toBeTruthy();expect(node!.handle).toBe(old.handle);
    const product=mapShopifyProduct(node!),config=dollVueConfigForProduct(product,getCustomizationConfig(product));
    expect(product.extended.brand).toBe(old.brand);expect(isCustomerVisibleProduct(product)).toBe(true);expect(isDollVueExcluded(product)).toBe(false);
    expect(product.extended.stockStatus).toBe('custom');expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);expect(scopeFlags(product.productType,[...product.tags,...state!.tags])).toEqual([]);
    const group=config.groups.find(g=>g.id==='eye-color')!;expect(group).toBeDefined();expect(group.selectionMode).toBe('single');expect(group.visibleWhen?.length||0).toBe(0);
    const choices=group.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({optionId:o.id,label:o.label,reference:o.swatch?.kind==='image'?o.swatch.value:null}));
    expect(choices).toEqual(refs.map(({optionId,label,referenceUrl})=>({optionId,label,reference:referenceUrl})));
    rows.push({index:i+1,id:old.id,handle:old.handle,brand:old.brand,familyKey:old.familyKey,status:old.status,currentCheckedAt:checkedAt,displayName:product.extended.displayName||product.title,tags:state!.tags,privateHold:'clear',strictAdminIdentity:true,storefrontNodeNull:true,publishedAt:state!.publishedAt,allPublicationsUnpublished:true,fingerprint:dollVueReadinessFingerprint(product,config),choices:refs.map(r=>({groupId:group.id,optionId:r.optionId,label:r.label,reference:r.referenceUrl,sha256:r.sha256})),exactHairChoices:[],sources:productImageSources(product).slice(0,8).map((s,sourcePosition)=>({...s,sourcePosition})),sourceVisualReview:'NOT_REVIEWED',ready:false});
   }catch(e){excluded.push({index:i+1,id:old.id,handle:old.handle,reason:e instanceof Error?e.message:String(e)});}
  }
  await save('current-family-candidates.json',{checkedAt,selected:ids.length,rows,excluded});
  console.info(JSON.stringify({phase:'current-identity-menu-holds',matching:rows.length,excluded:excluded.length,...counts}));
  let cursor=0;const mode=process.env.DOLLVUE_AIBEI_EX_IMAGES==='all'?'all':'lead';
  async function worker(){while(cursor<rows.length){const row=rows[cursor++];for(const source of row.sources.filter((s:any)=>mode==='all'||s.sourcePosition===0)){
   try{const image=await imageBytes(source.url);expect([image.width,image.height]).toEqual([source.width,source.height]);const file=path.join(output,`source-${row.index}-${source.sourcePosition}.${image.format==='jpeg'?'jpg':image.format}`);await fs.writeFile(file,image.bytes,{flag:'wx',mode:0o600});Object.assign(source,{file,sha256:image.sha256,decodedWidth:image.width,decodedHeight:image.height,byteLength:image.bytes.length});}
   catch(e){source.error=e instanceof Error?e.message:String(e);}
  }console.info(JSON.stringify({phase:'photos',index:row.index,total:rows.length}));}}
  await worker();
  const sheets=[];
  for(let start=0;start<rows.length;start+=8){const part=rows.slice(start,start+8),tiles=[];
   for(const row of part)for(const s of row.sources.filter((s:any)=>mode==='all'||s.sourcePosition===0))if(s.file)tiles.push(await tile(await fs.readFile(s.file),`${row.index} / p${s.sourcePosition} | ${row.displayName.slice(0,25)}`,220,290));
   const name=`source-candidates-${part[0].index}-${part.at(-1).index}.png`;sheets.push(await sheet(tiles,mode==='all'?8:4,name,220,290));
  }
  const summary={selected:ids.length,currentMatching:rows.length,hairChoices:0,excluded:excluded.length,sourceImagesPrepared:rows.reduce((n,r)=>n+r.sources.filter((s:any)=>s.file).length,0),sourceApproved:0,reviewReady:0,referenceMeaningReviewed:true,...counts};
  await save('candidate-manifest.json',{checkedAt,completedAt:new Date().toISOString(),summary,rows,excluded,contactSheets:sheets,referenceEvidence,inputs:[{file:input,sha256:hash(inputBytes)},{file:evidenceFile,sha256:hash(evidenceBytes)}],registryIndependentPreparation:true,registryWritten:false,publicationChanged:false,ownerReviewed:false});
  console.info(JSON.stringify({output,...summary}));
 }finally{vi.unstubAllGlobals();}
},40*60*1000);

async function tile(bytes:Buffer,label:string,width:number,height:number){const image=await sharp(bytes).autoOrient().resize(width,height-35,{fit:'contain',background:'#eee'}).png().toBuffer();const text=label.replaceAll('&','&amp;').replaceAll('<','&lt;');return sharp({create:{width,height,channels:3,background:'#fff'}}).composite([{input:image,top:0,left:0},{input:Buffer.from(`<svg width="${width}" height="35"><text x="4" y="22" font-size="12" font-family="Arial">${text}</text></svg>`),top:height-35,left:0}]).png().toBuffer();}
async function sheet(tiles:Buffer[],columns:number,name:string,width:number,height:number){expect(tiles.length).toBeGreaterThan(0);const bytes=await sharp({create:{width:columns*width,height:Math.ceil(tiles.length/columns)*height,channels:3,background:'#fff'}}).composite(tiles.map((input,i)=>({input,left:(i%columns)*width,top:Math.floor(i/columns)*height}))).png().toBuffer();const file=path.join(output,name);await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});return {file,sha256:hash(bytes)};}

