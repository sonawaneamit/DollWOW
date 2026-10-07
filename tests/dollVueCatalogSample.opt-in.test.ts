import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {it, expect} from 'vitest';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {dollVueGroups, areDollVueSelectionsValid, isDollVueCatalogProduct, buildDollVuePrompt, resolveDollVueSelections} from '@/lib/dollvue/config';

const input=process.env.DOLLVUE_SAMPLE_INPUT;
const output=process.env.DOLLVUE_SAMPLE_OUTPUT;
const seed='dollvue-release-2026-10-07';
const order=(id:string)=>createHash('sha256').update(`${seed}:${id}`).digest('hex');

it.skipIf(!input || !output)('records a reproducible stratified sample against release runtime menus',async()=>{
  const snapshot=JSON.parse(await fs.readFile(input!,'utf8'));
  const pools=new Map<string,any[]>();
  for(const node of snapshot.nodes){
    if(/^system\b/i.test(node.productType))continue;
    const key=`${node.brand?.value || node.vendor}:${node.status}`;
    pools.set(key,[...(pools.get(key)||[]),node]);
  }
  const selected=[...pools.values()].map(pool=>pool.sort((a,b)=>order(a.id).localeCompare(order(b.id)))[0]);
  const rows=[];
  for(const node of selected){
    const price={amount:node.variants.edges[0]?.node.price||'0',currencyCode:'USD'};
    const product=mapShopifyProduct({...node,priceRange:{minVariantPrice:price,maxVariantPrice:price},
      variants:{edges:node.variants.edges.map(({node:v}:any)=>({node:{...v,price:{amount:v.price,currencyCode:'USD'}}}))}});
    const config=getCustomizationConfig(product);
    const before=JSON.stringify(config);
    const groups=dollVueGroups(config);
    const choices=groups.flatMap(g=>g.options.map(o=>({groupId:g.id,optionId:o.id})));
    const invalidChoices=choices.filter(choice=>!areDollVueSelectionsValid(config,[choice]));
    for(const choice of choices){
      expect(buildDollVuePrompt(product,resolveDollVueSelections(config,[choice]))).toContain('Image 2:');
    }
    expect(JSON.stringify(config)).toBe(before);
    expect(areDollVueSelectionsValid(config,[{groupId:'unknown',optionId:'unknown'}])).toBe(false);
    if(choices[0])expect(areDollVueSelectionsValid(config,[choices[0],choices[0]])).toBe(false);
    rows.push({handle:product.handle,brand:product.extended.brand,status:node.status,
      advertised:isDollVueCatalogProduct(product),exposedChoices:choices.length,invalidExposedChoices:invalidChoices.length,
      fullMenuGroups:config.groups.length,photoQuality:'not-checked',generatedFidelity:'not-checked',publicationProof:'not-checked'});
  }
  const report={seed,capturedAt:snapshot.capturedAt,checkedAt:new Date().toISOString(),
    scope:'One deterministic random product per raw brand/product-status stratum; runtime structure only, not release approval.',
    sampleCount:rows.length,invalidExposedChoices:rows.reduce((n,r)=>n+r.invalidExposedChoices,0),
    activeUnadvertisedWithChoices:rows.filter(r=>r.status==='ACTIVE'&&!r.advertised&&r.exposedChoices>0).length,rows};
  await fs.writeFile(output!,JSON.stringify(report,null,2));
  console.log(JSON.stringify({samples:report.sampleCount,invalidExposedChoices:report.invalidExposedChoices,activeUnadvertisedWithChoices:report.activeUnadvertisedWithChoices}));
  expect(rows.length).toBeGreaterThan(0);
},120000);
