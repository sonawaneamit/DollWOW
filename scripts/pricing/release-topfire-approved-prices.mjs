import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateTopfirePriceScope(manifest, products) {
  assert.equal(manifest.rows.length,7);
  assert.equal(new Set(manifest.rows.map(r=>r.id)).size,7);
  assert.equal(new Set(manifest.rows.flatMap(r=>r.variantIds)).size,7);
  return manifest.rows.map(row=>{
    const matches=products.filter(p=>p.id===row.id && p.handle===row.handle);
    assert.equal(matches.length,1,`Missing/duplicate ${row.handle}`);
    const p=matches[0];
    assert.equal(p.status,'ACTIVE');assert.equal(p.brand?.value,row.brand);
    assert(!p.variants.pageInfo.hasNextPage);assert.equal(row.variantIds.length,1);
    assert.deepEqual(p.variants.nodes.map(v=>v.id),row.variantIds);
    assert(row.after>row.before && Number.isFinite(row.after));
    for(const v of p.variants.nodes){assert.equal(v.sku,row.sku);assert.equal(Number(v.price),row.before);assert.equal(v.compareAtPrice,null);}
    return {row,product:p};
  });
}

export function topfirePriceMutationVariables(row) {
  return {productId:row.id,variants:row.variantIds.map(id=>({id,price:row.after.toFixed(2)}))};
}

const fields=`id handle status vendor tags brand:metafield(namespace:"custom",key:"brand"){value} variants(first:100){pageInfo{hasNextPage}nodes{id sku price compareAtPrice inventoryItem{id unitCost{amount currencyCode}}}}`;

async function main() {
  const execute=process.argv.includes('--execute');
  assert(process.env.DOLLWOW_EXISTING_ADMIN_MODULE && process.env.DOL257_RECEIPT_DIRECTORY);
  const manifest=JSON.parse(await fs.readFile('data/pricing/dol257-approved-price-release.json'));
  const {admin}=await import(pathToFileURL(path.resolve(process.env.DOLLWOW_EXISTING_ADMIN_MODULE)).href);
  const result=await admin(`query($ids:[ID!]!){nodes(ids:$ids){...on Product{${fields}}}}`,{ids:manifest.rows.map(r=>r.id)});
  const scope=validateTopfirePriceScope(manifest,result.nodes);
  const output=process.env.DOL257_RECEIPT_DIRECTORY;await fs.mkdir(output,{recursive:true});
  await fs.writeFile(path.join(output,execute?'execute-preflight.json':'dry-run.json'),JSON.stringify({at:new Date().toISOString(),scope},null,2));
  if(!execute){console.log(JSON.stringify({dryRun:true,matched:scope.length,writes:0}));return;}
  assert.equal(process.env.DOL257_APPROVAL,'310e895d-dc46-4e80-b48f-c4e303894d21');
  assert(/^[a-f0-9]{40}$/.test(process.env.DOL257_VERIFIED_PRODUCTION_COMMIT||''));
  const journalPath=path.join(output,'write-journal.json');
  const journal={startedAt:new Date().toISOString(),productionBindingCommit:process.env.DOL257_VERIFIED_PRODUCTION_COMMIT,approval:process.env.DOL257_APPROVAL,state:'RUNNING',completed:[],current:null};
  await fs.writeFile(journalPath,JSON.stringify(journal,null,2),{flag:'wx'});
  try {
    for(const {row,product} of scope){
      const fresh=await admin(`query($id:ID!){product(id:$id){${fields}}}`,{id:row.id});
      assert.deepEqual(fresh.product,product,`Immediate source drift ${row.handle}`);
      journal.current={handle:row.handle,variables:topfirePriceMutationVariables(row),state:'SUBMITTING',at:new Date().toISOString()};
      await fs.writeFile(journalPath,JSON.stringify(journal,null,2));
      const d=await admin(`mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$productId,variants:$variants){productVariants{id price compareAtPrice}userErrors{field message}}}`,journal.current.variables);
      assert.deepEqual(d.productVariantsBulkUpdate.userErrors,[]);
      const variants=d.productVariantsBulkUpdate.productVariants;assert.deepEqual(variants.map(v=>v.id),row.variantIds);
      for(const v of variants){assert.equal(Number(v.price),row.after);assert.equal(v.compareAtPrice,null);}
      journal.completed.push({...journal.current,state:'ACKNOWLEDGED',variants,at:new Date().toISOString()});journal.current=null;
      await fs.writeFile(journalPath,JSON.stringify(journal,null,2));
    }
    journal.state='COMPLETE_ACKNOWLEDGED_NEEDS_INDEPENDENT_READBACK';journal.finishedAt=new Date().toISOString();
    await fs.writeFile(journalPath,JSON.stringify(journal,null,2));console.log(JSON.stringify({updated:journal.completed.length,state:journal.state,otherFieldWrites:0}));
  }catch(error){
    journal.state='STOPPED_DO_NOT_RETRY_BLINDLY';journal.error=String(error);journal.stoppedAt=new Date().toISOString();
    await fs.writeFile(journalPath,JSON.stringify(journal,null,2));throw error;
  }
}
if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await main();
