import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { classifyAppearance } from '@/lib/dollvue/appearance';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
type Node=Parameters<typeof mapShopifyProduct>[0];
type Cached=Omit<Node,'priceRange'|'variants'> & {status:string;publishedAt:string|null;
  variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>}};

function hasScopeTag(productType:string,tags:string[]) {
  return [productType,...tags.filter(tag=>tag!=='catalog-review-hold')]
    .some(value=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i.test(value));
}
it('does not confuse a general draft-review tag with a specific scope exclusion',()=>{
  expect(hasScopeTag('Custom Silicone Doll',['catalog-review-hold'])).toBe(false);
  for(const tag of ['catalog-image-review-hold','not-for-launch','head-only','torso','excluded'])
    expect(hasScopeTag('Custom Silicone Doll',['catalog-review-hold',tag])).toBe(true);
  expect(hasScopeTag('Ready to ship doll',['catalog-review-hold'])).toBe(true);
});

it.skipIf(process.env.DOLLVUE_REMAINING_CENSUS!=='1')('ranks cached exact reference families without network or approval',async()=>{
  vi.stubGlobal('fetch',()=>{throw Error('Cached census must not use network');});
  try {
    const inputs:Array<{file:string;sha256:string}>=[];
    async function read(file:string){const bytes=await fs.readFile(file);inputs.push({file,sha256:hash(bytes)});return JSON.parse(bytes.toString());}
    const snapshot=await read(path.join(root,'shopify-snapshot.json')) as {capturedAt:string;nodes:Cached[]};
    const inventory=await read(path.join(root,'inventory.json')) as {rows:Array<{id:string;reasons:string[]}>};
    const holds=await read(path.join(root,'current-holds.json')) as {held:Array<{id:string}>};
    const registry=await read('lib/dollvue/readiness-registry.json') as Record<string,DollVueReadinessRecord>;
    const evidence=await read(path.join(root,'6ye-hr-eye3-preparation/reviewed-reference-evidence.json'));
    expect(evidence.frozen).toBe(true);
    const wm=registry['gid://shopify/Product/10431698337976'];
    const se=registry['gid://shopify/Product/10433981612216'];
    expect(wm.status).toBe('ready');expect(se.status).toBe('ready');
    const families=[
      {name:'HAIR15',groupId:'hairstyle',choices:wm.choices.filter(c=>c.groupId==='hairstyle').map(c=>({...c,sha256:wm.imageDigests![c.reference]}))},
      {name:'WM14',groupId:'eye-color',choices:wm.choices.filter(c=>c.groupId==='eye-color').map(c=>({...c,sha256:wm.imageDigests![c.reference]}))},
      {name:'SE4',groupId:'eye-color',choices:se.choices.filter(c=>c.groupId==='eye-color').map(c=>({...c,sha256:se.imageDigests![c.reference]}))},
      {name:'EYE3',groupId:'eye-color',choices:evidence.references.map((r:{optionId:string;url:string;sha256:string})=>({groupId:'eye-color',optionId:r.optionId,reference:r.url,sha256:r.sha256}))},
    ] as Array<{name:string;groupId:string;choices:Array<{groupId:string;optionId:string;reference:string;sha256:string}>}>;
    expect(families.map(f=>f.choices.length)).toEqual([15,14,4,3]);
    const held=new Set(holds.held.map(r=>r.id)),old=new Map(inventory.rows.map(r=>[r.id,r]));
    const priorReviews=new Map<string,Array<{file:string;decision:string}>>();
    for(const dir of await fs.readdir(root,{withFileTypes:true})){
      if(!dir.isDirectory())continue;
      for(const name of await fs.readdir(path.join(root,dir.name))){
        if(!/^source-review.*\.json$/.test(name))continue;
        const file=path.join(root,dir.name,name),review=await read(file);
        for(const row of Array.isArray(review.rows)?review.rows:Array.isArray(review.decisions)?review.decisions:[]){
          if(!row.id)continue;
          const list=priorReviews.get(row.id)||[];
          list.push({file,decision:row.decision||row.verdict||'unknown'});priorReviews.set(row.id,list);
        }
      }
    }
    type Match={family:string;exactReferenceSubset:boolean;unapprovedOptionsOmitted:number;exactSeedIds:boolean;
      choices:Array<{groupId:string;optionId:string;label:string;reference:string;sha256:string}>};
    const rows:Array<{id:string;handle:string;brand:string;status:string;matches:Match[];priorReviews:Array<{file:string;decision:string}>}>=[];
    const excluded=[],unmatched=[];
    for(const node of snapshot.nodes){
      const reasons=[...(old.get(node.id)?.reasons||[])];
      if(registry[node.id])reasons.push('already-registry');
      if(held.has(node.id))reasons.push('cached-specific-hold');
      if(!['ACTIVE','DRAFT'].includes(node.status))reasons.push('inactive');
      const price={amount:node.variants.edges[0]?.node.price||'0',currencyCode:'USD'};
      const product=mapShopifyProduct({...node,priceRange:{minVariantPrice:price,maxVariantPrice:price},
        variants:{edges:node.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:'USD'}}}))}});
      if(!isCustomerVisibleProduct(product)||isDollVueExcluded(product))reasons.push('runtime-scope-excluded');
      if(product.extended.stockStatus!=='custom'||!/^custom\b.*\bdoll\b/i.test(product.productType))reasons.push('not-custom-full-doll');
      if(hasScopeTag(product.productType,product.tags))reasons.push('scope-tag');
      if(node.status==='ACTIVE'&&!node.publishedAt)reasons.push('not-published-at-snapshot');
      if(reasons.length){excluded.push({id:node.id,brand:product.extended.brand,status:node.status,reasons:[...new Set(reasons)]});continue;}
      const config=dollVueConfigForProduct(product,getCustomizationConfig(product));
      const matches=[];
      for(const family of families){
        const group=config.groups.find(g=>g.id===family.groupId);
        if(!group||group.visibleWhen?.length||group.selectionMode!=='single')continue;
        const candidates=group.options.filter(o=>classifyAppearance(group,o).status==='candidate');
        const options=family.choices.map(c=>candidates.filter(o=>o.swatch?.kind==='image'&&o.swatch.value===c.reference));
        if(!options.every(found=>found.length===1))continue;
        const matched=options.map(found=>found[0]);
        matches.push({family:family.name,exactReferenceSubset:true,unapprovedOptionsOmitted:candidates.length-matched.length,exactSeedIds:matched.every((o,i)=>o.id===family.choices[i].optionId),
          choices:matched.map((o,i)=>({groupId:group.id,optionId:o.id,label:o.label,reference:o.swatch!.value,sha256:family.choices[i].sha256}))});
      }
      if(matches.length)rows.push({id:node.id,handle:node.handle,brand:product.extended.brand||'UNKNOWN',status:node.status,matches,priorReviews:priorReviews.get(node.id)||[]});
      else unmatched.push({id:node.id,handle:node.handle,brand:product.extended.brand,status:node.status});
    }
    const rank=(status:string)=>[...new Set(rows.filter(r=>r.status===status).map(r=>r.brand))].map(brand=>{
      const selected=rows.filter(r=>r.brand===brand&&r.status===status);
      return {brand,count:selected.length,withoutPriorSourceReview:selected.filter(r=>!r.priorReviews.length).length,families:Object.fromEntries(families.map(f=>[f.name,selected.filter(r=>r.matches.some(m=>m.family===f.name)).length])),ids:selected.map(r=>r.id)};
    }).sort((a,b)=>b.count-a.count||a.brand.localeCompare(b.brand));
    const output=path.join(root,'remaining-family-census');await fs.mkdir(output,{recursive:true,mode:0o700});
    const report={capturedAt:new Date().toISOString(),snapshotCapturedAt:snapshot.capturedAt,inputs,families,publicRanking:rank('ACTIVE'),draftRanking:rank('DRAFT'),rows,excluded,unmatched,
      approval:false,currentPublicationProof:false,networkReads:0,registryWritten:false,
      note:'Cached exact ordered reference matches using current configuration code; local IDs and labels retained explicitly. Brand semantics/source approval and fresh live eligibility remain required. Drafts separate.'};
    await fs.writeFile(path.join(output,'ranked-batch-plan-v3.json'),JSON.stringify(report,null,2),{flag:'wx',mode:0o600});
    console.info(JSON.stringify({public:report.publicRanking.map(({ids,...r})=>r),draft:report.draftRanking.map(({ids,...r})=>r)}));
  }finally{vi.unstubAllGlobals();}
});
