import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import {adminFetch} from '@/lib/shopify/admin';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {env} from '@/lib/utils/env';
import {storefrontAuthHeaders} from '@/lib/shopify/auth';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {dollVueConfigForProduct} from '@/lib/dollvue/config';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {promotionPricingForSelections} from '@/lib/promotions/optionPricing';
type Node=Parameters<typeof mapShopifyProduct>[0];
type AdminNode = Omit<Node,'priceRange'|'variants'> & {status:string;publishedAt:string|null;hold?:{value:string}|null;
  resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}};
  variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
function assertDraft(n:Pick<AdminNode,'status'|'publishedAt'|'hold'|'resourcePublications'>, sf:unknown) {
  expect(n.status).toBe('DRAFT');expect(n.publishedAt).toBeNull();expect(sf).toBeNull();
  expect(n.resourcePublications.pageInfo.hasNextPage).toBe(false);
  expect(n.resourcePublications.nodes.some(x=>x.isPublished)).toBe(false);
  expect(Object.hasOwn(n,'hold')).toBe(true);
  expect(n.hold===null||typeof n.hold?.value==='string').toBe(true);expect(n.hold?.value.trim()||'').toBe('');
}

const fields: Record<string,string> = {
  catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',
  displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',
  sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',
  weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',
  warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',
  stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',
  irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups',
};
const query=`query DraftExpansionCurrent($ids:[ID!]!){nodes(ids:$ids){... on Product{
 id handle title description seo{title description} vendor productType tags status publishedAt
 hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value}
 resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}
 featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
 variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}}
 media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
 ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}
 ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join('\n')}
}} shop{currencyCode}}`;
function mapped(n:AdminNode,currency:string){
  const price={amount:n.variants.edges[0]?.node.price||'0',currencyCode:currency};
  return mapShopifyProduct({...n,priceRange:{minVariantPrice:price,maxVariantPrice:price},
    variants:{edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:currency}}}))}});
}
it.skipIf(process.env.DOLLVUE_TOPCYDOLL_DIAGNOSE!=='1')('reads the ten blocked drafts without mutation, images or generation',async()=>{
 const base='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/top-cydoll-family-preparation';
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const prior=JSON.parse(await fs.readFile(base+'/ready-proposal-24.json','utf8'));
 const ids=prior.checkoutBlocked.map((r:{id:string})=>r.id);
 expect(ids).toHaveLength(10);
 const files=['lib/customization/configs.ts','lib/customization/resolve.ts','lib/customization/visibility.ts','lib/dollvue/config.ts','lib/shopify/mappers.ts'];
 const codeInputs=await Promise.all(files.map(async file=>({file,sha256:sha(await fs.readFile(file))})));
 const original=globalThis.fetch;let calls=0;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  expect(url.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);expect(init?.method).toBe('POST');
  if(url.pathname.endsWith('/graphql.json')){const body=JSON.parse(String(init?.body));expect(body.query).toMatch(/^\s*query\b/);expect(body.query).not.toMatch(/\bmutation\b/);expect(body.variables.ids).toEqual(ids);}
  else expect(url.pathname).toBe('/admin/oauth/access_token');
  calls++;return original(input,init);
 });
 try{
  const admin=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(query,{ids});
  const response=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:'query DraftAbsent($ids:[ID!]!){nodes(ids:$ids){id}}',variables:{ids}})});
  expect(response.ok).toBe(true);const sf=await response.json();expect(sf.errors).toBeUndefined();expect(sf.data.nodes).toEqual(ids.map(()=>null));
  const rows=admin.nodes.map((node,i)=>{
   expect(node?.id).toBe(ids[i]);assertDraft(node!,sf.data.nodes[i]);
   const product=mapped(node!,admin.shop.currencyCode);
   const config=dollVueConfigForProduct(product,getCustomizationConfig(product));
   const groups=config.groups;
   const missingRules=groups.flatMap(g=>(g.visibleWhen||[]).flatMap(branch=>branch.filter(rule=>!groups.some(p=>p.id===rule.groupId&&p.options.some(o=>o.id===rule.optionId))).map(rule=>({groupId:g.id,rule}))));
   const parents=[...new Set(prior.checkoutBlocked[i].missingRules.map((r:{rule:{groupId:string}})=>r.rule.groupId))];
   const describe=(g:typeof groups[number])=>({id:g.id,visibleWhen:g.visibleWhen,options:g.options.map(o=>({id:o.id,label:o.label,priceDelta:o.priceDelta,priceVerified:o.priceVerified,purchasable:o.purchasable,productionNote:o.productionNote}))});
   const defaults=resolveCustomization(config,getDefaultSelections(config),Number(product.variants[0].price.amount));
   const priced=promotionPricingForSelections(product,config,{},new Date()).config;
   const pricedDefaults=resolveCustomization(priced,getDefaultSelections(priced),Number(product.variants[0].price.amount));
   return {index:prior.checkoutBlocked[i].index,id:node!.id,handle:node!.handle,status:node!.status,published:false,hold:node!.hold,storefrontAbsent:true,missingRules,issues:defaults.issues,requiresPriceConfirmation:defaults.requiresPriceConfirmation,pricedIssues:pricedDefaults.issues,pricedRequiresPriceConfirmation:pricedDefaults.requiresPriceConfirmation,
    rawParents:product.extended.customizationGroups?.filter(g=>parents.includes(g.id)).map(describe),
    runtimeParents:groups.filter(g=>parents.includes(g.id)).map(describe)};
  });
  for(const input of codeInputs)expect(sha(await fs.readFile(input.file))).toBe(input.sha256);
  const report={checkedAt:new Date().toISOString(),codeInputs,rows,stillBlocked:rows.filter(r=>r.issues.length||r.pricedIssues.length||r.requiresPriceConfirmation||r.pricedRequiresPriceConfirmation).length,calls,providerCalls:0,remoteWrites:0,registryWritten:false,reviewer:'native-assistant',ownerReviewed:false};
  const file=base+'/ten-blocked-current-read.json';await fs.writeFile(file,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.info(JSON.stringify({file,sha256:sha(await fs.readFile(file)),stillBlocked:report.stillBlocked}));
 }finally{vi.unstubAllGlobals();}
},120000);

