import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateFunwestPriceScope(manifest, products) {
  assert.equal(manifest.rows.length,164);
  assert.equal(new Set(manifest.rows.map(row=>row.id)).size,164);
  assert.equal(new Set(manifest.rows.flatMap(row=>row.variantIds)).size,164);
  return manifest.rows.map(row=>{
    const matches=products.filter(p=>p.id===row.id && p.handle===row.handle);
    assert.equal(matches.length,1,`Missing/duplicate ${row.handle}`);
    const p=matches[0];
    assert.equal(p.status,'ACTIVE');
    assert.equal(p.brand?.value,'FunWest Dolls');
    assert(!p.variants.pageInfo.hasNextPage);
    assert.equal(row.variantIds.length,1);
    assert.deepEqual(p.variants.nodes.map(v=>v.id),row.variantIds);
    assert(row.after-row.before>100 && Number.isFinite(row.after));
    for(const v of p.variants.nodes){assert.equal(Number(v.price),row.before,`Price drift ${row.handle}`);assert.equal(v.compareAtPrice,null);}
    return {row,product:p};
  });
}

export function priceMutationVariables(row) {
  return {productId:row.id,variants:row.variantIds.map(id=>({id,price:row.after.toFixed(2)}))};
}

async function main() {
  const execute=process.argv.includes('--execute');
  const modulePath=process.env.DOLLWOW_EXISTING_ADMIN_MODULE;
  const output=process.env.DOL276_RECEIPT_DIRECTORY;
  assert(modulePath && output,'Existing Admin helper and private receipt directory required');
  const manifest=JSON.parse(await fs.readFile('data/pricing/dol276-approved-price-release.json'));
  const {admin}=await import(pathToFileURL(path.resolve(modulePath)).href);
  let after=null;const products=[];
  do {
    const d=await admin(`query($after:String){products(first:100,after:$after,query:"handle:funwest-*"){pageInfo{hasNextPage endCursor}nodes{id handle status brand:metafield(namespace:"custom",key:"brand"){value}variants(first:100){pageInfo{hasNextPage}nodes{id price compareAtPrice}}}}}`,{after});
    products.push(...d.products.nodes);after=d.products.pageInfo.hasNextPage?d.products.pageInfo.endCursor:null;
  }while(after);
  const scope=validateFunwestPriceScope(manifest,products);
  await fs.mkdir(output,{recursive:true});
  const preflight={at:new Date().toISOString(),execute,matched:scope.length,otherProducts:products.length-scope.length,manifestApproval:manifest.approval,allProducts:products,scope};
  await fs.writeFile(path.join(output,execute?'execute-preflight.json':'dry-run.json'),JSON.stringify(preflight,null,2));
  if(!execute){console.log(JSON.stringify({dryRun:true,matched:scope.length,otherProducts:products.length-scope.length,writes:0}));return;}
  assert.equal(process.env.DOL276_APPROVAL,'fdee86eb-73e7-4258-8a2f-8ede12b49140');
  assert(/^[a-f0-9]{40}$/.test(process.env.DOL276_VERIFIED_PRODUCTION_COMMIT||''),'Verified price-binding production commit required');
  const journalPath=path.join(output,'write-journal.json');
  const journal={startedAt:new Date().toISOString(),productionBindingCommit:process.env.DOL276_VERIFIED_PRODUCTION_COMMIT,approval:process.env.DOL276_APPROVAL,state:'RUNNING',completed:[],current:null};
  await fs.writeFile(journalPath,JSON.stringify(journal,null,2),{flag:'wx'});
  try {
    for(const {row,product} of scope){
      const fresh=await admin(`query($id:ID!){product(id:$id){id handle status brand:metafield(namespace:"custom",key:"brand"){value}variants(first:100){pageInfo{hasNextPage}nodes{id price compareAtPrice}}}}`,{id:row.id});
      assert.deepEqual(fresh.product,product,`Immediate source drift ${row.handle}`);
      journal.current={handle:row.handle,variables:priceMutationVariables(row),state:'SUBMITTING',at:new Date().toISOString()};
      await fs.writeFile(journalPath,JSON.stringify(journal,null,2));
      const result=await admin(`mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$productId,variants:$variants){productVariants{id price compareAtPrice}userErrors{field message}}}`,journal.current.variables);
      assert.deepEqual(result.productVariantsBulkUpdate.userErrors,[]);
      const variants=result.productVariantsBulkUpdate.productVariants;
      assert.deepEqual(variants.map(v=>v.id),row.variantIds);
      for(const variant of variants){assert.equal(Number(variant.price),row.after);assert.equal(variant.compareAtPrice,null);}
      journal.completed.push({...journal.current,state:'ACKNOWLEDGED',variants,at:new Date().toISOString()});journal.current=null;
      await fs.writeFile(journalPath,JSON.stringify(journal,null,2));
      if(journal.completed.length%20===0)console.log(`Acknowledged ${journal.completed.length}/164 price updates`);
    }
    journal.state='COMPLETE_ACKNOWLEDGED_NEEDS_INDEPENDENT_READBACK';journal.finishedAt=new Date().toISOString();
    await fs.writeFile(journalPath,JSON.stringify(journal,null,2));
    console.log(JSON.stringify({updated:journal.completed.length,compareAtWrites:0,otherFieldWrites:0,state:journal.state}));
  }catch(error){
    journal.state='STOPPED_DO_NOT_RETRY_BLINDLY';journal.error=String(error);journal.stoppedAt=new Date().toISOString();
    await fs.writeFile(journalPath,JSON.stringify(journal,null,2));throw error;
  }
}

if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)await main();
