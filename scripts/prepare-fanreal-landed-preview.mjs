import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { minimumRetailForMargin } from '../lib/catalog/landed-price-preview.ts';

const directory='data/exports/dol-295-2026-10-29';
const census=JSON.parse(await fs.readFile(`${directory}/before-featured-census-private.json`,'utf8'));
const active=census.products.filter(p=>p.status==='ACTIVE');
assert.equal(active.length,10,'Review changed census before continuing');
const privateRows=[];
const rows=active.map(p=>{
  assert.equal(p.variants.nodes.length,1,'Review multi-variant pricing separately');
  const inStock=p.handle.endsWith('-rts-us');
  const torso=p.handle.includes('-torso-');
  assert(inStock || torso || p.handle.includes('-real-skin-'),'Real Skin body source required');
  const exw=inStock ? (p.handle.includes('-maria-')?1630:1680) : torso?930:p.handle.includes('-155cm-')?1450:1530;
  const shipping=inStock?0:700;
  const costCents=(exw+shipping)*100;
  const current=Number(p.variants.nodes[0].price);
  assert.equal(current,inStock?(p.handle.includes('-maria-')?2380:2480):torso?1580:p.handle.includes('-155cm-')?2780:2880,'Existing price changed');
  const minimum=inStock?current:Math.ceil(minimumRetailForMargin(costCents)/100);
  const discountedScenario=inStock?current:Math.ceil(minimumRetailForMargin(costCents,3000,29900)/100);
  privateRows.push({id:p.id,handle:p.handle,variantId:p.variants.nodes[0].id,exwUSD:exw,
    assumedShippingUSD:shipping,landedCostUSD:exw+shipping,currentUSD:current,
    undiscountedMinimumUSD:minimum,if299AppliesUSD:discountedScenario,
    basis:'DOL-295 corrected Real Skin EXW rows and29Oct09:49 $700-air approval; excludes unconfirmed duties/tax/payment fees/options'});
  assert(p.featuredMedia?.image?.url,'Existing product photo required');
  return {id:p.id,variantId:p.variants.nodes[0].id,handle:p.handle,title:p.title,
    image:p.featuredMedia.image.url,inStock,torso,currentUSD:current,
    undiscountedMinimumUSD:minimum,if299AppliesUSD:discountedScenario};
});
await fs.mkdir('data/price-previews',{recursive:true});
await fs.writeFile('data/price-previews/fanreal-landed.json',JSON.stringify(rows,null,2));
await fs.writeFile(`${directory}/landed-cost-private.json`,JSON.stringify({at:new Date().toISOString(),
  source:'DOL-295/e29da49b-b62e-4bba-aa0a-528a74576fbb',rows:privateRows,shopifyWrites:0,
  warning:'30% product+assumed-air gross margin, NOT net profit. Discount eligibility must be independently checked before selecting a release price.'},null,2));
console.log(JSON.stringify({rows:rows.length,custom:rows.filter(r=>!r.inStock).length,
  stockUnchanged:rows.filter(r=>r.inStock).length,shopifyWrites:0}));
