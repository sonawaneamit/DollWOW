import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {adminFetch} from '@/lib/shopify/admin';
import {storefrontAuthHeaders} from '@/lib/shopify/auth';
import {env} from '@/lib/utils/env';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {resolveDollVueEligibility,isDollVueExcluded} from '@/lib/dollvue/eligibility';
import {dollVueGroups} from '@/lib/dollvue/config';
import {getCurrentDollVueHolds} from '@/lib/dollvue/currentHold';
import {productImageSources} from '@/lib/catalog/productImage';
import {isOwnedOptionAsset} from '@/lib/assets/option-assets.mjs';
import {classifyAppearance} from '@/lib/dollvue/appearance';
import type {DollVueReadinessRecord} from '@/lib/dollvue/readiness';
type MappedNode = Parameters<typeof mapShopifyProduct>[0];
type AdminNode = Omit<MappedNode, 'priceRange' | 'variants'> & {
  status: string; publishedAt: string | null; tags: string[];
  resourcePublications: { nodes: Array<{ isPublished: boolean }>; pageInfo: { hasNextPage: boolean } };
  variants: { edges: Array<{ node: Omit<MappedNode['variants']['edges'][number]['node'], 'price'> & { price: string } }> };
};
const fields: Record<string, string> = {
  catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',
  displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',
  sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',
  weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',
  warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',
  stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',
  irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups',
};
const query = `query DraftBrandPilot($ids:[ID!]!){nodes(ids:$ids){... on Product{
  id handle title description seo{title description} vendor productType tags status publishedAt
  resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}
  featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
  variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}
  media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
    ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}
  ${Object.entries(fields).map(([alias,key])=>`${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
}} shop{currencyCode}}`;

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const brandOf=(brand:string)=>/^irontech(?: dolls?)?$/i.test(brand)?'Irontech':/^starpery(?: dolls?)?$/i.test(brand)?'Starpery':/^lusandy$/i.test(brand)?'Lusandy':null;
it.skipIf(process.env.DOLLVUE_LEGACY_COVERAGE!=='1')('audits cached legacy IDs against current read-only bulk state and actual resolver',async()=>{
 const snapshotBytes=await fs.readFile(path.join(root,'shopify-snapshot.json'));
 const snapshot=JSON.parse(snapshotBytes.toString()) as {capturedAt:string;nodes:AdminNode[]};
 const registryFile='lib/dollvue/readiness-registry.json',registryBytes=await fs.readFile(registryFile);
 const registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
 const candidates=snapshot.nodes.filter(n=>brandOf(n.brand?.value||n.vendor));
 const ids=candidates.map(n=>n.id),allowed=new Set(ids);
 expect(ids.length).toBe(1083);expect(allowed.size).toBe(ids.length);
 const counts={adminReads:0,storefrontReads:0,generationCalls:0,remoteWrites:0};
 const native=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  expect(url.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);
  expect(init?.method).toBe('POST');
  if(url.pathname.endsWith('/graphql.json')){
   const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   expect(body.variables.ids.length).toBeLessThanOrEqual(50);expect(body.variables.ids.every((id:string)=>allowed.has(id))).toBe(true);
   if(url.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else expect(url.pathname).toBe('/admin/oauth/access_token');
  return native(input,{...init,redirect:'error'});
 });
 const rows:Array<Record<string,unknown>>=[],errors:Array<{ids:string[];message:string}>=[];
 const totals:Record<string,number>={},byBrandStatus:Record<string,Record<string,number>>={};
 try{
  for(let offset=0;offset<ids.length;offset+=50){
   const chunk=ids.slice(offset,offset+50);
   try{
    const admin=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(query,{ids:chunk});
    expect(admin.nodes).toHaveLength(chunk.length);
    const response=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),
     headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
     body:JSON.stringify({query:'query LegacyPublicNodes($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids:chunk}})});
    expect(response.ok).toBe(true);const publicData=await response.json();expect(publicData.errors).toBeUndefined();expect(publicData.data.nodes).toHaveLength(chunk.length);
    const holds=await getCurrentDollVueHolds(chunk);
    for(let i=0;i<chunk.length;i++){
     const n=admin.nodes[i];if(!n){rows.push({id:chunk[i],gap:'missing-current-product'});continue;}
     expect(n.id).toBe(chunk[i]);const money=(amount:string)=>({amount,currencyCode:admin.shop.currencyCode});
     const product=mapShopifyProduct({...n,variants:{edges:n.variants.edges.map(({node:v})=>({node:{...v,price:money(v.price)}}))},
      priceRange:{minVariantPrice:money(n.variants.edges[0]?.node.price||'0'),maxVariantPrice:money(n.variants.edges[0]?.node.price||'0')}});
     const brand=brandOf(product.extended.brand||product.vendor)||'changed-brand';
     const config=getCustomizationConfig(product),resolved=resolveDollVueEligibility(product),groups=dollVueGroups(resolved.config),record=registry[n.id];
     const storefrontVisible=publicData.data.nodes[i]?.id===n.id,hold=holds.get(n.id)||'unavailable',excluded=isDollVueExcluded(product);
     const currentlyAvailable=storefrontVisible&&hold==='clear'&&resolved.available;
     const ownedSourceCount=productImageSources(product).slice(0,8).filter(p=>isOwnedOptionAsset(p.url)).length;
     const disabledConditional=config.groups.filter(g=>g.visibleWhen!==undefined).flatMap(g=>g.options.filter(o=>o.dollVueEnabled).map(o=>({groupId:g.id,optionId:o.id,visibleWhen:g.visibleWhen})));
     const appearanceCandidates=config.groups.flatMap(g=>g.options.flatMap(o=>{
      const meaning=classifyAppearance(g,o);if(meaning.status!=='candidate')return [];
      return [{groupId:g.id,optionId:o.id,attribute:meaning.attribute,enabled:o.dollVueEnabled===true,
       ownedReference:o.swatch?.kind==='image'&&isOwnedOptionAsset(o.swatch.value),conditional:g.visibleWhen!==undefined}];
     }));
     const gap=currentlyAvailable?'available':excluded?'excluded':record&&record.status!=='ready'?'reviewed-'+record.status:
      hold!=='clear'?'private-hold-'+hold:!storefrontVisible?'not-storefront-visible':
      !ownedSourceCount?'no-owned-source':!groups.length?'no-approved-visible-choices':!resolved.available?'resolver-unavailable':'unknown';
     const row={id:n.id,handle:n.handle,brand,status:n.status,publishedAt:n.publishedAt,storefrontVisible,currentHold:hold,
      recordStatus:record?.status||'recordless',resolverAvailable:resolved.available,currentlyAvailable,excluded,gap,
      configId:config.id,ownedSourceCount,visibleChoiceCount:groups.reduce((n,g)=>n+g.options.length,0),
      visibleGroups:groups.map(g=>({id:g.id,optionIds:g.options.map(o=>o.id)})),disabledConditionalChoices:record?[]:disabledConditional,appearanceCandidates};
     rows.push(row);
     const key=brand+' / '+n.status,summary=byBrandStatus[key]||={products:0,recordless:0,recordBacked:0,resolverAvailable:0,currentlyAvailable:0,excluded:0,conditionalBlocked:0};
     summary.products++;summary[record?'recordBacked':'recordless']++;if(resolved.available)summary.resolverAvailable++;
     if(currentlyAvailable)summary.currentlyAvailable++;if(excluded)summary.excluded++;if(!record&&disabledConditional.length)summary.conditionalBlocked++;
     totals[gap]=(totals[gap]||0)+1;
    }
   }catch(error){errors.push({ids:chunk,message:error instanceof Error?error.message:String(error)});}
   if((offset/50)%4===0)console.info(JSON.stringify({checked:Math.min(offset+50,ids.length),total:ids.length,errors:errors.length}));
  }
  expect(await fs.readFile(registryFile)).toEqual(registryBytes);
  const output=path.join(root,'legacy-resolver-coverage.current.json');
  await fs.writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),snapshotCapturedAt:snapshot.capturedAt,
   scope:'Existing cached IDs with actual raw Irontech/Starpery/Lusandy aliases, fresh full Admin config, Storefront node visibility and bulk private holds. No new global census; no image review, download or generation.',
   inputSnapshotSha256:sha(snapshotBytes),registrySha256:sha(registryBytes),registryCount:Object.keys(registry).length,
   candidateIds:ids.length,byBrandStatus,totals,counts,errors,rows,registryChanged:false},null,2),{flag:'wx',mode:0o600});
  console.info(JSON.stringify({output,byBrandStatus,totals,counts,errors:errors.length}));
  expect(errors).toEqual([]);expect(rows).toHaveLength(ids.length);
 }finally{vi.unstubAllGlobals();}
},20*60*1000);

