import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function greenbackNonPriceFingerprint(product) {
  return createHash('sha256').update(JSON.stringify({
    id: product.id, handle: product.handle, vendor: product.vendor, productType: product.productType,
    tags: [...product.tags].sort(),
    metafields: product.metafields.nodes.map(f=>[f.key,f.type,f.value]).sort((a,b)=>a[0].localeCompare(b[0])),
    variants: product.variants.nodes.map(v=>[v.id,v.inventoryPolicy,v.inventoryItem.sku,v.inventoryItem.tracked])
  })).digest('hex');
}
export function validateGreenbackPriceScope(manifest, products) {
  assert.equal(manifest.approval,'b0e196b3-7cb7-496f-adb3-be8fb3ef79ce');
  assert.equal(manifest.rows.length,64);assert.equal(new Set(manifest.rows.map(r=>r.id)).size,64);
  assert.equal(manifest.rows.filter(r=>r.before!==r.after).length,33);
  assert.equal(manifest.rows.filter(r=>r.hold).length,29);
  return manifest.rows.map(row=>{
    assert(['WM Dolls','Tantaly','Lusandy'].includes(row.brand),'Unapproved brand');
    const matches=products.filter(p=>p?.id===row.id&&p.handle===row.handle);assert.equal(matches.length,1);
    const product=matches[0];assert.equal(product.status,'ACTIVE');
    assert(!product.metafields.pageInfo.hasNextPage);assert(!product.variants.pageInfo.hasNextPage);
    assert.equal(product.variants.nodes.length,1);assert.equal(row.variantIds.length,1);
    const variant=product.variants.nodes[0];assert.equal(variant.id,row.variantIds[0]);assert.equal(variant.inventoryItem.sku,row.sku);
    assert([row.before,row.after].includes(Number(variant.price)),'Unexpected current price');
    assert.equal(greenbackNonPriceFingerprint(product),row.nonPriceFingerprint,'Non-price source drift');
    if(row.hold){assert.equal(row.before,1777);assert.equal(row.after,1777);}
    else if(row.before!==row.after){assert(row.after>row.before);assert(String(row.after).endsWith('9'));}
    assert(variant.compareAtPrice===null||Number(variant.compareAtPrice)>=row.after,'Compare-at needs a separate decision');
    return {row,product,needsChange:Number(variant.price)!==row.after};
  });
}
export function greenbackPriceMutationVariables(row) {
  return {productId:row.id,variants:row.variantIds.map(id=>({id,price:row.after.toFixed(2)}))};
}
const fields=`id handle status vendor productType tags metafields(first:100,namespace:"custom"){pageInfo{hasNextPage}nodes{key type value}} variants(first:2){pageInfo{hasNextPage}nodes{id price compareAtPrice inventoryPolicy inventoryItem{sku tracked}}}`;
async function main(){
  const execute=process.argv.includes('--execute');
  assert(process.env.DOLLWOW_EXISTING_ADMIN_MODULE&&process.env.DOL255_RECEIPT_DIRECTORY);
  const {admin}=await import(pathToFileURL(path.resolve(process.env.DOLLWOW_EXISTING_ADMIN_MODULE)).href);
  const manifest=JSON.parse(await fs.readFile('data/pricing/dol255-approved-prices.json'));
  const products=[];for(let i=0;i<manifest.rows.length;i+=8){const result=await admin(`query($ids:[ID!]!){nodes(ids:$ids){...on Product{${fields}}}}`,{ids:manifest.rows.slice(i,i+8).map(r=>r.id)});products.push(...result.nodes);}
  const scope=validateGreenbackPriceScope(manifest,products),out=process.env.DOL255_RECEIPT_DIRECTORY;await fs.mkdir(out,{recursive:true});
  await fs.writeFile(path.join(out,execute?'execute-preflight.json':'dry-run.json'),JSON.stringify({at:new Date().toISOString(),scope},null,2));
  if(!execute){console.log(JSON.stringify({dryRun:true,matched:scope.length,changes:scope.filter(s=>s.needsChange).length,writes:0}));return;}
  assert.equal(process.env.DOL255_APPROVAL,manifest.approval);assert(/^[a-f0-9]{40}$/.test(process.env.DOL255_VERIFIED_PRODUCTION_COMMIT||''));
  const journalPath=path.join(out,'write-journal.json'),journal={startedAt:new Date().toISOString(),productionCommit:process.env.DOL255_VERIFIED_PRODUCTION_COMMIT,approval:manifest.approval,state:'RUNNING',completed:[],skipped:scope.filter(s=>!s.needsChange).map(s=>s.row.id),current:null};
  await fs.writeFile(journalPath,JSON.stringify(journal,null,2),{flag:'wx'});
  try{
    for(const {row,product} of scope.filter(s=>s.needsChange)){
      const fresh=(await admin(`query($id:ID!){product(id:$id){${fields}}}`,{id:row.id})).product;
      assert.deepEqual(fresh,product,`Immediate drift ${row.handle}`);
      journal.current={id:row.id,handle:row.handle,variables:greenbackPriceMutationVariables(row),state:'SUBMITTING'};await fs.writeFile(journalPath,JSON.stringify(journal,null,2));
      const result=await admin(`mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$productId,variants:$variants){productVariants{id price compareAtPrice}userErrors{field message}}}`,journal.current.variables);
      assert.deepEqual(result.productVariantsBulkUpdate.userErrors,[]);const variants=result.productVariantsBulkUpdate.productVariants;assert.deepEqual(variants.map(v=>v.id),row.variantIds);
      assert.equal(Number(variants[0].price),row.after);assert.equal(variants[0].compareAtPrice,product.variants.nodes[0].compareAtPrice);
      journal.completed.push({...journal.current,state:'ACKNOWLEDGED',variants,at:new Date().toISOString()});journal.current=null;await fs.writeFile(journalPath,JSON.stringify(journal,null,2));
      if(journal.completed.length%10===0)console.log(JSON.stringify({acknowledged:journal.completed.length,total:scope.filter(s=>s.needsChange).length}));
    }
    journal.state='COMPLETE_ACKNOWLEDGED_NEEDS_READBACK';await fs.writeFile(journalPath,JSON.stringify(journal,null,2));console.log(JSON.stringify({updated:journal.completed.length,skipped:journal.skipped.length,otherFieldWrites:0}));
  }catch(error){journal.state='STOPPED_DO_NOT_RETRY_BLINDLY';journal.error=String(error);await fs.writeFile(journalPath,JSON.stringify(journal,null,2));throw error;}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await main();
