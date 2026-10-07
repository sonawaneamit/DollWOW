import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it, vi } from 'vitest';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { dollVueReadinessFingerprint, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output=path.join(root,'funwest-eye-family-preparation');
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
type Node=Parameters<typeof mapShopifyProduct>[0];
type AdminNode=Omit<Node,'priceRange'|'variants'|'media'> & {
 status:string;publishedAt:string|null;hold?:{value:string}|null;
 resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};
 variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>};
 media?:Node['media'];
};
function mapped(node:AdminNode,currencyCode='USD'){
 const amount=node.variants.edges[0]?.node.price||'0',price={amount,currencyCode};
 return mapShopifyProduct({...node,priceRange:{minVariantPrice:price,maxVariantPrice:price},
 variants:{edges:node.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode}}}))}});
}
function assertPrivateDraft(node:AdminNode,storefront:unknown){
 expect(node.status).toBe('DRAFT');expect(node.publishedAt).toBeNull();expect(storefront).toBeNull();
 expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
 expect(node.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false);
 expect(Object.hasOwn(node,'hold')).toBe(true);
 expect(node.hold===null||typeof node.hold?.value==='string').toBe(true);
 expect(node.hold?.value.trim()||'').toBe('');
}
function scopeFlags(productType:string,tags:string[]){
 return [productType,...tags.filter(tag=>tag!=='catalog-review-hold')]
  .filter(value=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i.test(value));
}
it('retains generic draft review tags without bypassing specific scope holds',()=>{
 expect(scopeFlags('Custom Silicone doll',['catalog-review-hold'])).toEqual([]);
 for(const tag of ['catalog-image-review-hold','not-for-launch','head-only','torso'])
  expect(scopeFlags('Custom Silicone doll',['catalog-review-hold',tag])).toContain(tag);
});
it('fails closed for unknown holds, publication and Storefront presence',()=>{
 const n={status:'DRAFT',publishedAt:null,hold:null,resourcePublications:{nodes:[],pageInfo:{hasNextPage:false}}} as unknown as AdminNode;
 expect(()=>assertPrivateDraft(n,null)).not.toThrow();
 for(const node of [{...n,hold:undefined},{...n,hold:{value:'review'}},{...n,status:'ACTIVE'},{...n,publishedAt:'2026-10-07'},
 {...n,resourcePublications:{nodes:[{isPublished:true}],pageInfo:{hasNextPage:false}}}])
 expect(()=>assertPrivateDraft(node,null)).toThrow();
 expect(()=>assertPrivateDraft(n,{})).toThrow();
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
  id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}
  resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}
  featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
  variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}
  media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
    ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}
  ${Object.entries(fields).map(([alias,key])=>`${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
}} shop{currencyCode}}`;

it.skipIf(process.env.DOLLVUE_FUNWEST_PREPARATION!=='1')('prepares private draft sources and unapproved reference evidence without activation',async()=>{
 const inputFile=path.join(root,'remaining-family-census/other-family-reference-inventory.json');
 const inputBytes=await fs.readFile(inputFile);
 type Family={referenceFamilyHash:string;attributes:string[];choices:Array<{optionId:string;reference:string;sha256:string}>;products:Array<{id:string;handle:string;brand:string;status:string}>};
 const families=(JSON.parse(inputBytes.toString()).groups as Family[]).filter(g=>g.attributes.length===1&&g.attributes[0]==='eye-color'&&g.products.some(p=>p.brand==='FunWest Dolls'));
 expect(families.map(f=>f.choices.length).sort((a,b)=>a-b)).toEqual([5,15]);
 const selected=families.flatMap(f=>f.products.filter(p=>p.brand==='FunWest Dolls').map(p=>({...p,family:f.referenceFamilyHash})));
 expect(selected).toHaveLength(92);expect(new Set(selected.map(p=>p.id)).size).toBe(92);
 const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json');
 const registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
 async function census(node:AdminNode,currency='USD'){
  const product=mapped(node,currency),config=dollVueConfigForProduct(product,getCustomizationConfig(product));
  const family=families.find(f=>f.products.some(p=>p.id===node.id))!;
  const group=config.groups.find(g=>g.id==='eye-color');
  const references=[];
  for(const option of group?.options||[]){
   if(option.swatch?.kind!=='image')continue;
   const reference=option.swatch.value;
   expect(reference).toMatch(/^\/option-assets\/[a-f0-9]{64}\.webp$/);
   const sha256=hash(await fs.readFile(path.join(process.cwd(),'public',reference)));
   references.push({groupId:'eye-color',optionId:option.id,label:option.label,reference,sha256,
    conditional:!!group?.visibleWhen?.length,irisOnly:!option.id.includes('bloodshot'),meaningApproved:false});
  }
  const pins=(rows:Array<{optionId:string;reference:string;sha256:string}>)=>rows.map(r=>[r.optionId,r.reference,r.sha256].join(':')).sort();
  const familyMatches=JSON.stringify(pins(references))===JSON.stringify(pins(family.choices));
  return {product,config,references,exactChoices:references.filter(r=>r.irisOnly),familyMatches,
   fingerprint:dollVueReadinessFingerprint(product,config)};
 }
 await fs.mkdir(output,{recursive:true});
 const save=(name:string,value:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2),{flag:'wx',mode:0o600});
 await save('input-family-pins.json',{inputFile,sha256:hash(inputBytes),families,registrySha256:hash(registryBytes),
 meaningApproved:false,bloodshotOptionsExcludedFromIrisScope:true});
 expect(hasShopifyStorefrontEnv()).toBe(true);
 const counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,remoteWrites:0},ids=selected.map(r=>r.id);
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const url=new URL(input instanceof Request?input.url:String(input)),method=init?.method||'GET';
  if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query).toMatch(/^\s*query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   expect(body.variables.ids.length).toBeLessThanOrEqual(50);expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);
   if(url.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname==='/admin/oauth/access_token'){expect(method).toBe('POST');}
  else{expect(method).toBe('GET');expect(isOwnedOptionAsset(url.href)).toBe(true);counts.imageReads++;}
  return nativeFetch(input,init);
 });
 try{
  type Census = Awaited<ReturnType<typeof census>>;
  const live:Array<{id:string;handle:string;brand:string;status:string;storefrontAbsent:boolean;node:AdminNode;
    references:Census['references'];exactChoices:Census['exactChoices'];fingerprint:string;reasons:string[];sourceReview:string}>=[];
  const eligible:Array<{id:string;handle:string;brand:string;fingerprint:string;exactChoices:Census['exactChoices']}>=[];
  const sources:Array<{id:string;handle:string;brand:string;index:number;status:'DRAFT';sourcePosition:number;sourceUrl:string;sourceFile:string;sourceSha256:string;
   sourceBytes:number;decoded:{width:number;height:number};fingerprint:string;sourceReview:string;retainedHoldTags:string[]}>=[],excluded=[];
  const tasks:Array<{id:string;handle:string;brand:string;index:number;fingerprint:string;retainedHoldTags:string[];position:number;source:ReturnType<typeof productImageSources>[number]}>=[];
  for(let offset=0;offset<ids.length;offset+=50){
   const chunk=ids.slice(offset,offset+50);
   const admin=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(query,{ids:chunk});
   const response=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),
    headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
    body:JSON.stringify({query:'query DraftExpansionAbsence($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids:chunk}})});
   expect(response.ok).toBe(true);const sf=await response.json();expect(sf.errors).toBeUndefined();
   expect(admin.nodes).toHaveLength(chunk.length);expect(sf.data.nodes).toHaveLength(chunk.length);
   for(let i=0;i<chunk.length;i++){
    const id=chunk[i],node=admin.nodes[i],old=selected.find(r=>r.id===id)!;
    if(!node){excluded.push({id,brand:old.brand,reason:'Current Admin identity missing'});continue;}
    expect(node.id).toBe(id);
    const c=await census(node,admin.shop.currencyCode),reasons:string[]=[];
    try{assertPrivateDraft(node,sf.data.nodes[i]);}catch{reasons.push('Draft/publication/absence/hold gate failed');}
    if(node.handle!==old.handle||c.product.extended.brand!==old.brand)reasons.push('Identity changed');
    if(!c.familyMatches)reasons.push('Current exact eye family changed');
    if(registry[id])reasons.push('Existing registry record');
    if(isDollVueExcluded(c.product)||c.product.extended.stockStatus!=='custom'||
      !/^custom\b.*\bdoll\b/i.test(node.productType)||scopeFlags(node.productType,node.tags).length)
      reasons.push('Current full-body custom scope exclusion');
    live.push({id,handle:node.handle,brand:old.brand,status:node.status,storefrontAbsent:sf.data.nodes[i]===null,node,references:c.references,
      exactChoices:c.exactChoices,fingerprint:c.fingerprint,reasons,sourceReview:'NOT_REVIEWED'});
    if(reasons.length){excluded.push({id,handle:node.handle,brand:old.brand,reasons});continue;}
    eligible.push({id,handle:node.handle,brand:old.brand,fingerprint:c.fingerprint,exactChoices:c.exactChoices});
    for(const [position,source]of productImageSources(c.product).slice(0,1).entries()){
     tasks.push({id,handle:node.handle,brand:old.brand,index:selected.findIndex(r=>r.id===id)+1,fingerprint:c.fingerprint,
      retainedHoldTags:node.tags.filter(t=>/hold/i.test(t)),position,source});
    }
   }
  }
  await save('fresh-state-before-downloads.json',{checkedAt:new Date().toISOString(),rows:live,eligible,excluded,counts});
  const referenceRows:Array<{index:number;sha256:string|null;reference:string;sourceFile:string;sourceBytes:number;
   occurrences:Array<{id:string;brand:string;groupId:string;optionId:string;label:string}>;visualReview:string;meaningApproved:boolean}>=[];
  for(const row of live)for(const reference of row.references){
   let entry=referenceRows.find(r=>r.sha256===reference.sha256);
   if(!entry){
    expect(reference.sha256).toMatch(/^[a-f0-9]{64}$/);expect(isOwnedOptionAsset(reference.reference)).toBe(true);
    const bytes=await fs.readFile(path.join(process.cwd(),'public',reference.reference));expect(hash(bytes)).toBe(reference.sha256);
    const sourceFile=path.join(output,'reference-'+reference.sha256+'.webp');await fs.writeFile(sourceFile,bytes,{flag:'wx',mode:0o600});
    entry={index:referenceRows.length+1,sha256:reference.sha256,reference:reference.reference,sourceFile,sourceBytes:bytes.length,
     occurrences:[] as Array<{id:string;brand:string;groupId:string;optionId:string;label:string}>,visualReview:'NOT_REVIEWED',meaningApproved:false};
    referenceRows.push(entry);
   }
   entry.occurrences.push({id:row.id,brand:row.brand,groupId:reference.groupId,optionId:reference.optionId,label:reference.label});
  }
  const referenceSheets=[];
  for(let offset=0;offset<referenceRows.length;offset+=10){
   const parts=[];
   for(const [i,r]of referenceRows.slice(offset,offset+10).entries()){
    const left=i%5*300,top=Math.floor(i/5)*360,o=r.occurrences[0];
    parts.push({input:await sharp(r.sourceFile).resize(300,280,{fit:'contain',background:'#fff'}).png().toBuffer(),left,top});
    const label=(o.brand+' | '+o.groupId+' | '+o.label).replaceAll('&','&amp;').replaceAll('<','&lt;');
    parts.push({input:Buffer.from('<svg width="300" height="80"><rect width="300" height="80" fill="white"/><g font-size="12"><text x="6" y="20">REF '+r.index+' | '+label+'</text><text x="6" y="42">'+r.sha256!.slice(0,30)+'</text><text x="6" y="64">MEANING / VISUAL REVIEW PENDING</text></g></svg>'),left,top:top+280});
   }
   const file=path.join(output,'reference-sheet-'+String(offset/10+1).padStart(2,'0')+'.png');
   await fs.writeFile(file,await sharp({create:{width:1500,height:720,channels:3,background:'#eee'}}).composite(parts).png().toBuffer(),{flag:'wx',mode:0o600});
   referenceSheets.push({file,sha256:hash(await fs.readFile(file))});
  }
  await save('reference-review-manifest.json',{checkedAt:new Date().toISOString(),rows:referenceRows,contactSheets:referenceSheets,meaningApproved:false,source:'Current resolved configuration and exact local owned-asset bytes; no inferred visual meaning'});
  console.info(JSON.stringify({privateDraftCandidates:eligible.length,references:referenceRows.length,sourceDownloads:tasks.length}));
  let next=0;
  const downloadErrors:Array<{id:string;position:number;reason:string}>=[];
  async function worker(){while(next<tasks.length){
   const task=tasks[next++],{id,position,source}=task;
   try{
     expect(isOwnedOptionAsset(source.url)).toBe(true);
     const response=await fetch(source.url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
     expect(response.ok).toBe(true);expect(response.headers.get('content-type')).toMatch(/^image\//);
     const limit=20*1024*1024;expect(Number(response.headers.get('content-length'))).toBeLessThanOrEqual(limit);
     const chunks:Buffer[]=[];let size=0;
     const reader=response.body!.getReader();
     try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;expect(size).toBeLessThanOrEqual(limit);chunks.push(Buffer.from(part.value));}}
     finally{void reader.cancel().catch(()=>{});}
     const bytes=Buffer.concat(chunks);
     const decoder=sharp(bytes,{limitInputPixels:25000000,failOn:'warning'}),meta=await decoder.metadata();await decoder.clone().raw().toBuffer();
     expect([meta.width,meta.height]).toEqual([source.width,source.height]);expect(meta.pages||1).toBe(1);
     const file=path.join(output,id.split('/').at(-1)+'-p'+position+'.'+(meta.format==='jpeg'?'jpg':meta.format));
     await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});
     sources.push({id,handle:task.handle,brand:task.brand,index:task.index,status:'DRAFT',retainedHoldTags:task.retainedHoldTags,sourcePosition:position,sourceUrl:source.url,sourceFile:file,sourceSha256:hash(bytes),
      sourceBytes:bytes.length,decoded:{width:meta.width!,height:meta.height!},fingerprint:task.fingerprint,sourceReview:'NOT_REVIEWED'});
   }catch(error){downloadErrors.push({id,position,reason:error instanceof Error?error.message:String(error)});}
   if((sources.length+downloadErrors.length)%40===0)console.info(JSON.stringify({downloaded:sources.length,errors:downloadErrors.length,total:tasks.length}));
  }}
  await Promise.all(Array.from({length:6},worker));
  sources.sort((a,b)=>a.index-b.index||a.sourcePosition-b.sourcePosition);
  const sheets=[];
  for(let offset=0;offset<sources.length;offset+=10){
   const parts=[];for(const [i,r]of sources.slice(offset,offset+10).entries()){
    const left=i%5*300,top=Math.floor(i/5)*420;
    parts.push({input:await sharp(r.sourceFile).resize(300,360,{fit:'contain',background:'#fff'}).png().toBuffer(),left,top});
    parts.push({input:Buffer.from('<svg width="300" height="60"><rect width="300" height="60" fill="white"/><text x="6" y="22" font-size="13">'+r.index+'. '+r.id.split('/').at(-1)+' | p'+r.sourcePosition+'</text><text x="6" y="45" font-size="13">DRAFT / NOT REVIEWED</text></svg>'),left,top:top+360});
   }
   const file=path.join(output,'source-sheet-'+String(offset/10+1).padStart(2,'0')+'.png');
   await fs.writeFile(file,await sharp({create:{width:1500,height:840,channels:3,background:'#eee'}}).composite(parts).png().toBuffer(),{flag:'wx',mode:0o600});
   sheets.push({file,sha256:hash(await fs.readFile(file))});
  }
  const byBrand=['FunWest Dolls'].map(brand=>({brand,total:selected.filter(r=>r.brand===brand).length,
   exactMatchProducts:live.filter(r=>r.brand===brand&&r.exactChoices.length).length,eligible:eligible.filter(r=>r.brand===brand).length,
   confirmedPrivateDrafts:live.filter(r=>r.brand===brand&&!r.reasons.includes('Draft/publication/absence/hold gate failed')).length}));
  await save('current-state-census.json',{checkedAt:new Date().toISOString(),rows:live,byBrand,counts});
  await save('candidate-manifest.json',{checkedAt:new Date().toISOString(),rows:sources,eligible,excluded,downloadErrors,contactSheets:sheets,byBrand,counts,
   sourceApproval:false,parentReferenceReviewRequired:true,referenceManifest:path.join(output,'reference-review-manifest.json'),registryChanged:false,publicationChanged:false});
  expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);
  console.info(JSON.stringify({byBrand,sources:sources.length,sheets:sheets.length,counts}));
 }finally{vi.unstubAllGlobals();}
},30*60*1000);
