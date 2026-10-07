import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {expect,it,vi} from 'vitest';
import {adminFetch} from '@/lib/shopify/admin';
import {storefrontAuthHeaders} from '@/lib/shopify/auth';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {getCurrentDollVueHolds} from '@/lib/dollvue/currentHold';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {dollVueConfigForProduct} from '@/lib/dollvue/config';
import {dollVueReadinessFingerprint} from '@/lib/dollvue/readiness';
import {classifyAppearance} from '@/lib/dollvue/appearance';
import {productImageSources} from '@/lib/catalog/productImage';
import {isOwnedOptionAsset} from '@/lib/assets/option-assets.mjs';
import {env,hasShopifyStorefrontEnv} from '@/lib/utils/env';
type Mapped=Parameters<typeof mapShopifyProduct>[0];
type AdminNode=Omit<Mapped,'variants'|'priceRange'> & {status:string;publishedAt:string|null;hold:{value:string}|null;resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};variants:{edges:Array<{node:Omit<Mapped['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
const query=`query ElsaFireflyPreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output=path.join(root,'elsa-firefly-preparation/current-complete');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const selected=[{"id":"gid://shopify/Product/10639171682488","handle":"elsa-babe-sakai-kanako-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639171748024","handle":"elsa-babe-kikukawa-rei-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639171813560","handle":"elsa-babe-kaoro-150cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639171879096","handle":"elsa-babe-sakurai-yuriko-150cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639171977400","handle":"elsa-babe-takigawa-senhime-150cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639172010168","handle":"elsa-babe-doris-connor-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639172108472","handle":"elsa-babe-ivanka-ricci-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639172174008","handle":"elsa-babe-mila-bell-160cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639172206776","handle":"elsa-babe-doris-connor-160cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639172305080","handle":"elsa-babe-ikeda-anna-160cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639172927672","handle":"elsa-babe-kat-bccarin-160cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639174074552","handle":"elsa-babe-eguchi-masami-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639175286968","handle":"elsa-babe-kinsley-clark-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639176564920","handle":"elsa-babe-hirosue-yuko-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639177941176","handle":"elsa-babe-hirano-rin-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639179186360","handle":"elsa-babe-ishihara-minako-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639180431544","handle":"elsa-babe-kasawara-tomoko-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639181873336","handle":"elsa-babe-sasaki-azusa-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639183315128","handle":"elsa-babe-molly-red-wolf-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639184527544","handle":"elsa-babe-rosalyn-clark-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639186002104","handle":"elsa-babe-iwai-yuzuki-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639187148984","handle":"elsa-babe-lena-davis-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639188459704","handle":"elsa-babe-mila-bell-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639189803192","handle":"elsa-babe-tyler-grande-165cm-silicone-companion-doll","brand":"Elsa Babe","status":"DRAFT"},{"id":"gid://shopify/Product/10639456305336","handle":"firefly-mary-160cm-max-silicone-companion-doll","brand":"Firefly Diary","status":"DRAFT"},{"id":"gid://shopify/Product/10639456960696","handle":"firefly-mary-164cm-normal-silicone-companion-doll","brand":"Firefly Diary","status":"DRAFT"},{"id":"gid://shopify/Product/10639457059000","handle":"firefly-mary-165cm-max-silicone-companion-doll","brand":"Firefly Diary","status":"DRAFT"},{"id":"gid://shopify/Product/10639457124536","handle":"firefly-mary-164cm-max-silicone-companion-doll","brand":"Firefly Diary","status":"DRAFT"}] as const;
const scope=(type:string,tags:string[])=>[type,...tags.filter(t=>t!=='catalog-review-hold')].filter(t=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded|youth|minor|teen/i.test(t));
it('keeps the general draft catalog hold but preserves specific scope exclusions',()=>{
 expect(scope('Custom Silicone Doll',['catalog-review-hold'])).toEqual([]);
 expect(scope('Custom Silicone Doll',['catalog-image-review-hold'])).toHaveLength(1);
 expect(selected).toHaveLength(28);expect(new Set(selected.map(r=>r.id)).size).toBe(28);
});
it.skipIf(process.env.DOLLVUE_ELSA_FIREFLY_PREPARATION!=='1')('prepares all 28 assigned drafts without approval, generation or registry writes',async()=>{
 const inventoryBytes=await fs.readFile(path.join(root,'inventory.json'));expect(sha(inventoryBytes)).toBe('91f00deb17c2ba7a6fbf27790ce087a05beb17fd64498f76dca6624ba6625188');
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBefore.toString());
 await fs.mkdir(output,{recursive:true,mode:0o700});
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 expect(await fs.stat(path.join(output,'candidate-manifest.json')).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})).toBe(false);
 expect(hasShopifyStorefrontEnv()).toBe(true);
 const ids:string[]=selected.map(r=>r.id),native=globalThis.fetch,counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const b=JSON.parse(String(init?.body));expect(b.query.trim()).toMatch(/^query\b/);expect(b.query).not.toMatch(/\bmutation\b/);
   expect(b.variables.ids.length).toBeLessThanOrEqual(50);expect(b.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect(isOwnedOptionAsset(u.href)).toBe(true);counts.imageReads++;}
  return native(input,{...init,redirect:'error'});
 });
 try{
  const checkedAt=new Date().toISOString(),a=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids});
  expect(a.nodes.map(n=>n.id)).toEqual(ids);
  const res=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:'query ElsaFireflyAbsent($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids}})});
  expect(res.ok).toBe(true);const sf=await res.json();expect(sf.errors).toBeUndefined();expect(sf.data.nodes).toHaveLength(ids.length);
  const holds=await getCurrentDollVueHolds(ids),rows=[],exclusions=[],referenceMap=new Map<string,{reference:string;sha256:string;file:string;width:number;height:number;byteLength:number;occurrences:unknown[]}>();
  for(let i=0;i<selected.length;i++){
   const expected=selected[i],n=a.nodes[i];expect(n.handle).toBe(expected.handle);expect(Object.hasOwn(n,'hold')).toBe(true);
   const variants={edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:a.shop.currencyCode}}}))};
   const product=mapShopifyProduct({...n,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}});
   expect(product.extended.brand).toBe(expected.brand);
   const reasons=scope(product.productType,product.tags);
   if(registry[n.id])reasons.push('already-in-registry');
   if(n.status!=='DRAFT'||n.publishedAt!==null||sf.data.nodes[i]!==null||n.resourcePublications.pageInfo.hasNextPage||n.resourcePublications.nodes.some(p=>p.isPublished))reasons.push('draft-unpublished-public-absence-not-proven');
   if(holds.get(n.id)!=='clear'||n.hold?.value.trim())reasons.push('private-hold-not-clear');
   const config=dollVueConfigForProduct(product,getCustomizationConfig(product)),sources=productImageSources(product).slice(0,8).map((s,sourcePosition)=>({...s,sourcePosition}));
   const choices=config.groups.flatMap(g=>g.options.filter(o=>classifyAppearance(g,o).status==='candidate'&&o.swatch?.kind==='image').map(o=>({groupId:g.id,groupLabel:g.label,optionId:o.id,label:o.label,reference:o.swatch!.value,visibleWhen:g.visibleWhen||[]})));
   const row={index:i+1,id:n.id,handle:n.handle,displayName:product.extended.displayName||product.title,brand:product.extended.brand,status:n.status,publishedAt:n.publishedAt,storefrontNull:sf.data.nodes[i]===null,resourcePublications:n.resourcePublications,hold:holds.get(n.id),tags:product.tags,scopeReasons:reasons,fingerprint:dollVueReadinessFingerprint(product,config),choices,sources,sourceVisualReview:'NOT_REVIEWED',referenceMeaningReview:'NOT_REVIEWED',ready:false};
   rows.push(row);if(reasons.length){exclusions.push({id:n.id,index:i+1,reasons});continue;}
   for(const c of choices){
    expect(c.reference).toMatch(/^\/option-assets\/[a-f0-9]{64}\.webp$/);
    let reference=referenceMap.get(c.reference);
    if(!reference){const b=await fs.readFile(path.join(process.cwd(),'public',c.reference)),digest=sha(b);expect(c.reference).toContain(digest);const meta=await sharp(b).metadata();
     const file=path.join(output,'reference-'+digest+'.webp');await fs.writeFile(file,b,{flag:'wx',mode:0o600});reference={reference:c.reference,sha256:digest,file,width:meta.width!,height:meta.height!,byteLength:b.length,occurrences:[]};referenceMap.set(c.reference,reference);}
    reference.occurrences.push({id:n.id,index:i+1,brand:product.extended.brand,groupId:c.groupId,optionId:c.optionId,label:c.label});
   }
   const source=sources[0];if(!source){exclusions.push({id:n.id,index:i+1,reasons:['no-product-source']});continue;}
   const image=await fetch(source.url,{cache:'no-store',signal:AbortSignal.timeout(60000)});expect(image.ok).toBe(true);const bytes=Buffer.from(await image.arrayBuffer()),meta=await sharp(bytes).metadata();
   expect(meta.width).toBe(source.width);expect(meta.height).toBe(source.height);
   const file=path.join(output,'source-'+(i+1)+'-0.'+(meta.format==='png'?'png':'jpg'));await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});Object.assign(source,{file,sha256:sha(bytes),byteLength:bytes.length,decodedWidth:meta.width,decodedHeight:meta.height});
  }
  const sheets:Array<{file:string;sha256:string;items:Array<{file:string;label:string}>}>=[];
  const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
  async function sheet(items:Array<{file:string;label:string}>,prefix:string,w:number,h:number){
   for(let n=0;n<items.length;n+=8){
    const group=items.slice(n,n+8),layers=[];
    for(let j=0;j<group.length;j++){const left=j%4*w,top=Math.floor(j/4)*(h+50);layers.push({input:await sharp(group[j].file).resize(w,h,{fit:'contain',background:'white'}).png().toBuffer(),left,top});
     layers.push({input:Buffer.from('<svg width="'+w+'" height="50"><rect width="'+w+'" height="50" fill="white"/><text x="8" y="25" font-family="sans-serif" font-size="14">'+esc(group[j].label.slice(0,39))+'</text></svg>'),left,top:top+h});}
    const bytes=await sharp({create:{width:w*4,height:(h+50)*2,channels:3,background:'white'}}).composite(layers).png().toBuffer(),file=path.join(output,prefix+'-'+(n/8+1)+'.png');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});sheets.push({file,sha256:sha(bytes),items:group});
   }
  }
  const sourceRows=rows.filter(r=>'file' in (r.sources[0]||{}));
  await sheet(sourceRows.map(r=>({file:(r.sources[0] as typeof r.sources[number]&{file:string}).file,label:r.index+' | '+r.displayName+' | p0'})),'private-unreviewed-sources',300,450);
  const references=[...referenceMap.values()];
  await sheet(references.map((r,i)=>({file:r.file,label:'Ref '+(i+1)+' | '+(r.occurrences[0] as {label:string}).label})),'private-unreviewed-references',250,250);
  const end=JSON.parse(await fs.readFile('lib/dollvue/readiness-registry.json','utf8'));for(const [id,r] of Object.entries(registry))expect(end[id]).toEqual(r);
  await save('candidate-manifest.json',{checkedAt,completedAt:new Date().toISOString(),reviewer:'assistant',ownerReviewed:false,humanApproval:false,inputs:[{file:path.join(root,'inventory.json'),sha256:sha(inventoryBytes)}],registryInputCount:Object.keys(registry).length,registryInputSha256:sha(registryBefore),preexistingRegistryUnchanged:true,rows,exclusions,references,sheets,summary:{total:rows.length,sourcePhotos:sourceRows.length,references:references.length,...counts},sourceApproved:0,referenceMeaningApproved:0,registryWritten:false,publicationChanged:false,productSaleHoldsChanged:false});
  console.info(JSON.stringify({output,rows:rows.length,sources:sourceRows.length,references:references.length,exclusions:exclusions.length,...counts}));
 }finally{vi.unstubAllGlobals();}
},15*60*1000);
