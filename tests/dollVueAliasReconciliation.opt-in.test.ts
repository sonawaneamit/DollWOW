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
const query=`query AibeiExPilot($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description seo{title description} vendor productType tags status publishedAt hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}}} shop{currencyCode}}`;


const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const selectedIds=["gid://shopify/Product/10428386672824","gid://shopify/Product/10428386705592","gid://shopify/Product/10428386738360","gid://shopify/Product/10428386771128","gid://shopify/Product/10428386803896","gid://shopify/Product/10428386836664","gid://shopify/Product/10433145602232","gid://shopify/Product/10433145635000","gid://shopify/Product/10433145831608","gid://shopify/Product/10433145864376","gid://shopify/Product/10433145897144","gid://shopify/Product/10433145929912","gid://shopify/Product/10433145995448","gid://shopify/Product/10433146028216","gid://shopify/Product/10433147044024","gid://shopify/Product/10433147076792","gid://shopify/Product/10433147109560","gid://shopify/Product/10433147142328","gid://shopify/Product/10433147306168","gid://shopify/Product/10433147338936","gid://shopify/Product/10433147895992","gid://shopify/Product/10433147928760","gid://shopify/Product/10433150451896","gid://shopify/Product/10433150517432","gid://shopify/Product/10433150550200","gid://shopify/Product/10433150681272","gid://shopify/Product/10433151238328","gid://shopify/Product/10433151729848","gid://shopify/Product/10433151762616","gid://shopify/Product/10433155301560","gid://shopify/Product/10433155334328","gid://shopify/Product/10433155367096","gid://shopify/Product/10433155399864","gid://shopify/Product/10433155432632","gid://shopify/Product/10433156284600","gid://shopify/Product/10433156350136","gid://shopify/Product/10433156415672","gid://shopify/Product/10433157628088","gid://shopify/Product/10433157955768","gid://shopify/Product/10433157988536","gid://shopify/Product/10433158021304","gid://shopify/Product/10433158119608","gid://shopify/Product/10433158152376","gid://shopify/Product/10433158185144","gid://shopify/Product/10433158283448","gid://shopify/Product/10433164247224","gid://shopify/Product/10433893204152","gid://shopify/Product/10433893302456","gid://shopify/Product/10433893433528","gid://shopify/Product/10433893564600","gid://shopify/Product/10433893695672","gid://shopify/Product/10433893826744","gid://shopify/Product/10454995599544","gid://shopify/Product/10454995632312","gid://shopify/Product/10454995665080","gid://shopify/Product/10523301314744","gid://shopify/Product/10523301445816","gid://shopify/Product/10523301511352","gid://shopify/Product/10523301609656","gid://shopify/Product/10523301707960","gid://shopify/Product/10523301773496","gid://shopify/Product/10523301871800","gid://shopify/Product/10523301970104","gid://shopify/Product/10523302101176"] as const;
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const scope=(type:string,tags:string[])=>[type,...tags.filter(t=>t!=='catalog-review-hold')].filter(t=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded|youth|minor|teen/i.test(t));
it('limits alias reconciliation to the 64 assigned previously unreviewed IDs',()=>{
 expect(selectedIds).toHaveLength(64);expect(new Set(selectedIds).size).toBe(64);
 expect(scope('Custom Doll',['catalog-review-hold'])).toEqual([]);
 expect(scope('Custom Doll',['catalog-image-review-hold'])).toHaveLength(1);
});
it.skipIf(process.env.DOLLVUE_ALIAS_RECONCILIATION!=='1')('reads exact current identity, scope and reference reuse without generation or image downloads',async()=>{
 const censusFile=path.join(root,'coverage-reconciliation-499.json'),censusBytes=await fs.readFile(censusFile),census=JSON.parse(censusBytes.toString());
 const assigned=census.rows.filter((r:{id:string})=>(selectedIds as readonly string[]).includes(r.id));
 expect(assigned).toHaveLength(64);expect(assigned.every((r:{priorReviews:unknown[]})=>r.priorReviews.length===0)).toBe(true);
 const registryFile='lib/dollvue/readiness-registry.json',registryBytes=await fs.readFile(registryFile),registry=JSON.parse(registryBytes.toString()) as Record<string,{status:string;sourcePositions?:number[];choices?:Array<{groupId:string;optionId:string;reference:string}>;imageDigests?:Record<string,string>}>;
 const output=path.join(root,'wm-yl-angelkiss-alias-reconciliation');await fs.mkdir(output,{recursive:true});
 const native=globalThis.fetch,counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  expect(u.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);expect(method).toBe('POST');
  if(u.pathname.endsWith('/graphql.json')){
   const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   expect(body.variables.ids.length).toBeLessThanOrEqual(50);expect(body.variables.ids.every((id:string)=>(selectedIds as readonly string[]).includes(id))).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else expect(u.pathname).toBe('/admin/oauth/access_token');
  return native(input,{...init,redirect:'error'});
 });
 try{
  expect(hasShopifyStorefrontEnv()).toBe(true);const startedAt=new Date().toISOString(),rows:Record<string,unknown>[]=[],nodes:AdminNode[]=[],sfNodes:unknown[]=[];
  for(let offset=0;offset<selectedIds.length;offset+=40){
   const ids=selectedIds.slice(offset,offset+40),a=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(query,{ids});
   expect(a.nodes.map(n=>n.id)).toEqual(ids);
   const res=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:'query AliasPublicIdentity($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle}}}',variables:{ids}})});
   expect(res.ok).toBe(true);const sf=await res.json();expect(sf.errors).toBeUndefined();expect(sf.data.nodes).toHaveLength(ids.length);
   const holds=await getCurrentDollVueHolds(ids);nodes.push(...a.nodes);sfNodes.push(...sf.data.nodes);
   for(let i=0;i<a.nodes.length;i++){
    const n=a.nodes[i],cached=assigned.find((r:{id:string})=>r.id===n.id),variants={edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:a.shop.currencyCode}}}))};
    const p=mapShopifyProduct({...n,variants,priceRange:{minVariantPrice:variants.edges[0].node.price,maxVariantPrice:variants.edges[0].node.price}}),config=dollVueConfigForProduct(p,getCustomizationConfig(p));
    const reasons=scope(p.productType,p.tags);if(holds.get(n.id)!=='clear'||!Object.hasOwn(n,'hold')||n.hold?.value.trim())reasons.push('private-hold-not-clear');
    if(registry[n.id])reasons.push('already-registered');
    const choices=config.groups.flatMap(g=>g.options.filter(o=>classifyAppearance(g,o).status==='candidate'&&o.swatch?.kind==='image'&&isOwnedOptionAsset(o.swatch.value)).map(o=>({groupId:g.id,optionId:o.id,label:o.label,reference:o.swatch!.value,visibleWhen:g.visibleWhen||[]})));
    const source=productImageSources(p).slice(0,8);
    const matches=Object.entries(registry).filter(([,r])=>r.status==='ready').flatMap(([id,r])=>{
     const groups=[...new Set((r.choices||[]).map(c=>c.groupId))].flatMap(groupId=>{
      const reviewed=(r.choices||[]).filter(c=>c.groupId===groupId),actual=choices.filter(c=>c.groupId===groupId);
      return reviewed.length&&reviewed.length===actual.length&&reviewed.every(c=>actual.some(a=>a.optionId===c.optionId&&a.reference===c.reference)&&r.imageDigests?.[c.reference]===c.reference.match(/[a-f0-9]{64}/)?.[0])?[{groupId,count:reviewed.length}]:[];
     });
     return groups.length?[{recordId:id,groups}]:[];
    });
    const reusedSources=source.flatMap((s,position)=>Object.entries(registry).filter(([,r])=>r.status==='ready'&&r.imageDigests?.[s.url]).map(([id,r])=>({position,recordId:id,url:s.url,sha256:r.imageDigests![s.url],byteVerificationPending:true})));
    rows.push({index:rows.length+1,id:n.id,cachedHandle:cached.handle,currentHandle:n.handle,handleChanged:cached.handle!==n.handle,cachedStatus:cached.cachedStatus,status:n.status,brand:p.extended.brand,cachedBrand:cached.brand,displayName:p.extended.displayName,publishedAt:n.publishedAt,resourcePublications:n.resourcePublications,storefront:sf.data.nodes[i],hold:holds.get(n.id),scopeReasons:reasons,catalogIdentityKey:n.catalogIdentityKey?.value,catalogBodyIdentityKey:n.catalogBodyIdentityKey?.value,fingerprint:dollVueReadinessFingerprint(p,config),choices,sources:source,exactRegistryChoiceSetMatches:matches,exactSourceURLMatches:reusedSources,ready:false,sourceReview:'NOT_REVIEWED',notes:'Reference-set equality is technical reuse evidence only; labels, fresh image bytes, source review, current configuration and cart checks remain required. Cached ACTIVE does not imply current public availability.'});
   }
  }
  const endBytes=await fs.readFile(registryFile),end=JSON.parse(endBytes.toString());for(const [id,entry] of Object.entries(registry))expect(end[id]).toEqual(entry);
  const by=(key:string)=>Object.fromEntries([...new Set(rows.map(r=>String(r[key])))].map(k=>[k,rows.filter(r=>String(r[key])===k).length]));
  const report={startedAt,completedAt:new Date().toISOString(),reviewer:'native-assistant',ownerReviewed:false,humanApproval:false,inputs:[{file:censusFile,sha256:sha(censusBytes)}],registryInputCount:Object.keys(registry).length,registryInputSha256:sha(registryBytes),registryEndCount:Object.keys(end).length,preexistingRegistryUnchanged:true,unrelatedRegistryAdditions:Object.keys(end).filter(id=>!Object.hasOwn(registry,id)),summary:{total:rows.length,byStatus:by('status'),byBrand:by('brand'),storefrontPresent:rows.filter(r=>r.storefront!==null).length,withScopeReasons:rows.filter(r=>(r.scopeReasons as string[]).length).length,exactReferenceReuseCandidates:rows.filter(r=>(r.exactRegistryChoiceSetMatches as unknown[]).length).length,...counts},rows,registryWritten:false,publicationChanged:false,sourceApprovalInherited:false};
  const file=path.join(output,'current-reconciliation.json'),bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});
  await fs.writeFile(path.join(output,'current-admin-nodes.json'),JSON.stringify({nodes,storefrontNodes:sfNodes},null,2)+'\n',{flag:'wx',mode:0o600});
  console.info(JSON.stringify({file,sha256:sha(bytes),...report.summary}));
 }finally{vi.unstubAllGlobals();}
},300000);

