import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {classifyAppearance} from '@/lib/dollvue/appearance';
import {isOwnedOptionAsset} from '@/lib/assets/option-assets.mjs';
import {isDollVueExcluded} from '@/lib/dollvue/eligibility';
import {dollVueReadinessFingerprint,type DollVueReadinessRecord} from '@/lib/dollvue/readiness';
import {productImageSources} from '@/lib/catalog/productImage';
import type {CustomizationGroup} from '@/types/customization';

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
type Node=Parameters<typeof mapShopifyProduct>[0];
type Cached=Omit<Node,'priceRange'|'variants'>&{status:string;variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'>&{price:string}}>}};
type Eye={groupId:string;optionId:string;label:string;reference:string|null;owned:boolean;sha256:string|null;reviewedExactBytes:boolean;visibleWhen:CustomizationGroup['visibleWhen']};
type CensusRow={id:string;handle:string;brand:string;family:string;status:string;excluded:boolean;extraFlags:string[];existingRecord:boolean;fingerprint:string;configId:string;eyes:Eye[];ownedSourceCount:number};
it.skipIf(process.env.DOLLVUE_SINO_SANHUI_CENSUS!=='1')('compares cached draft iris ownership and exact reviewed-byte coverage without network',async()=>{
 const network=vi.fn(()=>{throw Error('No network in cached iris census');});vi.stubGlobal('fetch',network);
 try{
  const snapshotBytes=await fs.readFile(path.join(root,'shopify-snapshot.json')),snapshot=JSON.parse(snapshotBytes.toString()) as {capturedAt:string;nodes:Cached[]};
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
  const reviewed=new Set(Object.values(registry).filter(r=>r.status==='ready').flatMap(r=>r.choices.filter(c=>c.groupId==='eye-color').map(c=>r.imageDigests?.[c.reference])));
  const rows:CensusRow[]=[],hashes=new Map<string,string>();
  for(const n of snapshot.nodes.filter(n=>/^(sino|sanhui) dolls?$/i.test(n.brand?.value||n.vendor))){
   const price={amount:n.variants.edges[0]?.node.price||'0',currencyCode:'USD'};
   const p=mapShopifyProduct({...n,priceRange:{minVariantPrice:price,maxVariantPrice:price},variants:{edges:n.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:'USD'}}}))}});
   const config=getCustomizationConfig(p),eyes=[];
   for(const g of config.groups)for(const o of g.options){
    const meaning=classifyAppearance(g,o);if(meaning.status!=='candidate'||meaning.attribute!=='eye-color')continue;
    const url=o.swatch?.kind==='image'?o.swatch.value:null;
    let digest:null|string=null;
    if(url?.startsWith('/option-assets/')&&isOwnedOptionAsset(url)){
     if(!hashes.has(url))hashes.set(url,sha(await fs.readFile(path.join(process.cwd(),'public',url))));digest=hashes.get(url)!;
    }
    eyes.push({groupId:g.id,optionId:o.id,label:o.label,reference:url,owned:Boolean(url&&isOwnedOptionAsset(url)),sha256:digest,reviewedExactBytes:Boolean(digest&&reviewed.has(digest)),visibleWhen:g.visibleWhen});
   }
   const extraFlags=[p.productType,...p.tags.filter(t=>t!=='catalog-review-hold')].filter(t=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i.test(t));
   rows.push({id:p.id,handle:p.handle,brand:p.extended.brand||p.vendor,family:/^sino/i.test(p.extended.brand||p.vendor)?'Sino':'Sanhui',status:n.status,
    excluded:isDollVueExcluded(p)||extraFlags.length>0,extraFlags,existingRecord:Boolean(registry[p.id]),fingerprint:dollVueReadinessFingerprint(p,config),configId:config.id,
    eyes,ownedSourceCount:productImageSources(p).slice(0,8).filter(s=>isOwnedOptionAsset(s.url)).length});
  }
  const summary=['Sino','Sanhui'].map(family=>{const all=rows.filter(r=>r.family===family),eligible=all.filter(r=>!r.excluded&&!r.existingRecord);return {family,total:all.length,drafts:all.filter(r=>r.status==='DRAFT').length,scopeCandidates:eligible.length,
   withOwnedIris:eligible.filter(r=>r.eyes.some(e=>e.owned)).length,withReviewedExactIris:eligible.filter(r=>r.eyes.some(e=>e.reviewedExactBytes)).length,
   uniqueIrisReferences:new Set(eligible.flatMap(r=>r.eyes.filter(e=>e.owned).map(e=>e.reference))).size,
   conditionalIrisProducts:eligible.filter(r=>r.eyes.some(e=>e.visibleWhen!==undefined)).length};});
  const output=path.join(root,'sino-sanhui-cached-iris-census.json');
  await fs.writeFile(output,JSON.stringify({checkedAt:new Date().toISOString(),snapshotCapturedAt:snapshot.capturedAt,registryCount:Object.keys(registry).length,
   snapshotSha256:sha(snapshotBytes),registrySha256:sha(registryBytes),scope:'Cached scope comparison only. No fresh holds/publication or source/reference visual approval.',summary,rows,networkCalls:0,generationCalls:0,registryChanged:false},null,2),{flag:'wx',mode:0o600});
  expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);expect(network).not.toHaveBeenCalled();console.info(JSON.stringify({output,summary}));
 }finally{vi.unstubAllGlobals();}
});
