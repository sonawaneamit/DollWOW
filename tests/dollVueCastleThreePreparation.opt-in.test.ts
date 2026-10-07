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
const query=`query CastleThreePreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output=path.join(root,'dolls-castle-bounded73-reconciliation');
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const ids=['gid://shopify/Product/10608213590200','gid://shopify/Product/10608213721272','gid://shopify/Product/10608213819576'];
it('limits new source inspection to the three missing prepared IDs',()=>{expect(ids).toHaveLength(3);expect(new Set(ids).size).toBe(3);});
it.skipIf(process.env.DOLLVUE_CASTLE_THREE_PREPARATION!=='1')('prepares only three unreviewed source0 images with current read-only identity and hold evidence',async()=>{
 const queueFile=path.join(root,'bounded-remaining-queues-1791408138820.json'),queueBytes=await fs.readFile(queueFile);expect(sha(queueBytes)).toBe('a77110fbceeb4082d07348ca4982bd5dc996db27ce7febf9c8786caa540d7f57');
 const queue=JSON.parse(queueBytes.toString()),assigned=queue.rows.filter((r:{id:string})=>ids.includes(r.id));expect(assigned).toHaveLength(3);
 expect(assigned.every((r:{queue:string;brand:string})=>r.queue==='unreviewed-owned-family-source'&&r.brand==='Dolls Castle')).toBe(true);
 const registryFile='lib/dollvue/readiness-registry.json',registryBytes=await fs.readFile(registryFile),registry=JSON.parse(registryBytes.toString());
 await fs.mkdir(output,{recursive:true});expect(await fs.stat(output+'/candidate-manifest.json').then(()=>true,()=>false)).toBe(false);
 const allowedImages=new Set<string>(),counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,shopifyWrites:0},native=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect(allowedImages.has(u.href)).toBe(true);counts.imageReads++;}
  return native(input,{...init,redirect:'error',signal:init?.signal||AbortSignal.timeout(60000)});
 });
 try{
  expect(hasShopifyStorefrontEnv()).toBe(true);
  const a=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids});expect(a.nodes.map(n=>n.id)).toEqual(ids);
  const res=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:'query CastleThreeIdentity($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle}}}',variables:{ids}})});
  expect(res.ok).toBe(true);const sf=await res.json();expect(sf.errors).toBeUndefined();expect(sf.data.nodes).toHaveLength(3);
  const holds=await getCurrentDollVueHolds(ids),rows=[];
  for(let i=0;i<a.nodes.length;i++){
   const n=a.nodes[i];expect(n.status).toBe('ACTIVE');expect(n.publishedAt).toBeTruthy();expect(sf.data.nodes[i]).toEqual({id:n.id,handle:n.handle});
   expect(n.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(n.resourcePublications.nodes.some(p=>p.isPublished)).toBe(true);
   expect(Object.hasOwn(n,'hold')).toBe(true);expect(n.hold===null||typeof n.hold?.value==='string').toBe(true);expect(n.hold?.value.trim()||'').toBe('');expect(holds.get(n.id)).toBe('clear');expect(registry[n.id]).toBeUndefined();
   const variants={edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:a.shop.currencyCode}}}))};
   const product=mapShopifyProduct({...n,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}});
   expect(product.extended.brand).toBe('Dolls Castle');expect(product.extended.stockStatus).toBe('custom');
   const scopeReasons=[product.productType,...product.tags.filter(t=>t!=='catalog-review-hold')].filter(t=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded|youth|minor|teen/i.test(t));
   const config=dollVueConfigForProduct(product,getCustomizationConfig(product)),choices=config.groups.flatMap(g=>g.options.filter(o=>classifyAppearance(g,o).status==='candidate'&&o.swatch?.kind==='image'&&isOwnedOptionAsset(o.swatch.value)).map(o=>({groupId:g.id,optionId:o.id,label:o.label,reference:o.swatch!.value,visibleWhen:g.visibleWhen||[]})));
   const source=productImageSources(product)[0];expect(source).toBeDefined();const url=new URL(source.url);expect(url.protocol).toBe('https:');expect(url.hostname).toBe('cdn.shopify.com');allowedImages.add(url.href);
   const response=await fetch(url.href,{method:'GET',cache:'no-store'});expect(response.ok).toBe(true);const bytes=Buffer.from(await response.arrayBuffer()),meta=await sharp(bytes).metadata();
   expect([meta.width,meta.height]).toEqual([source.width,source.height]);
   const file=path.join(output,'source-'+(i+1)+'-0.'+(meta.format==='png'?'png':'jpg'));await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});
   const matches=Object.entries(registry).filter(([,entry])=>(entry as {status:string}).status==='ready').flatMap(([id,entry])=>{
    const e=entry as {choices:Array<{groupId:string;optionId:string;reference:string}>;imageDigests:Record<string,string>};
    const matching=choices.filter(c=>e.choices?.some(x=>x.groupId===c.groupId&&x.optionId===c.optionId&&x.reference===c.reference)&&/^[a-f0-9]{64}$/.test(e.imageDigests?.[c.reference]||''));
    return matching.length?[{id,choices:matching}]:[];
   });
   rows.push({index:i+1,id:n.id,handle:n.handle,brand:product.extended.brand,status:n.status,publishedAt:n.publishedAt,storefrontIdentity:sf.data.nodes[i],hold:'clear',scopeReasons,fingerprint:dollVueReadinessFingerprint(product,config),catalogIdentityKey:product.extended.catalogIdentityKey,choices,exactRegisteredChoiceMatches:matches,source:{...source,sourcePosition:0,file,sha256:sha(bytes),byteLength:bytes.length},sourceDecision:'NOT_REVIEWED',ready:false});
  }
  const end=JSON.parse((await fs.readFile(registryFile)).toString());for(const [id,r] of Object.entries(registry))expect(end[id]).toEqual(r);
  const report={checkedAt:new Date().toISOString(),ownerReviewed:false,humanApproval:false,reviewer:'native-assistant',inputs:[{file:queueFile,sha256:sha(queueBytes)}],rows,registryInputCount:Object.keys(registry).length,registryEndCount:Object.keys(end).length,registryInputSha256:sha(registryBytes),preexistingRegistryUnchanged:true,counts,registryWritten:false,publicationChanged:false};
  const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');await fs.writeFile(output+'/candidate-manifest.json',bytes,{flag:'wx',mode:0o600});console.info(JSON.stringify({file:output+'/candidate-manifest.json',sha256:sha(bytes),counts}));
 }finally{vi.unstubAllGlobals();}
},10*60*1000);

