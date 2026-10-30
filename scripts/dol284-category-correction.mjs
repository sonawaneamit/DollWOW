import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const dir='data/exports/dol-284-2026-10-30';
const targets=[
  ['10661772951736','top-fire-doll-casey-t41-silicone-head-only-3-in-1-in-stock-eu','539.00'],
  ['10661772853432','top-fire-doll-flora-t02-silicone-head-only-3-in-1-in-stock-eu','539.00'],
  ['10661773213880','top-fire-doll-lorna-t07-silicone-head-only-3-in-1-in-stock-eu','539.00'],
  ['10661775081656','top-fire-doll-lorna-t07-silicone-head-only-ai-in-stock-eu','595.00'],
  ['10661775016120','top-fire-doll-nina-t27-silicone-head-only-in-stock-eu','595.00']
];
const category='gid://shopify/TaxonomyCategory/ma-1-4';
const d=process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//,'');
const auth=await fetch(`https://${d}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET})});
const token=(await auth.json()).access_token;assert(token,'Authentication failed');
async function admin(query,variables={}){
  const r=await fetch(`https://${d}/admin/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});
  const j=await r.json();assert(r.ok&&!j.errors,JSON.stringify(j.errors));return j.data;
}
const query=`query($ids:[ID!]!){nodes(ids:$ids){...on Product{id title handle status vendor productType descriptionHtml tags category{id fullName} variants(first:20){nodes{id price compareAtPrice selectedOptions{name value} inventoryPolicy inventoryItem{id requiresShipping tracked}} pageInfo{hasNextPage}} media(first:100){nodes{id status alt}pageInfo{hasNextPage}}metafields(first:100){nodes{id namespace key value type}pageInfo{hasNextPage}}}}}`;
const ids=targets.map(([id])=>`gid://shopify/Product/${id}`);
const before=(await admin(query,{ids})).nodes;
assert.equal(before.length,5);
for(const [i,p] of before.entries()){
  assert.equal(p.id,ids[i]);assert.equal(p.handle,targets[i][1]);assert.equal(p.status,'ACTIVE');assert.equal(p.productType,'Silicone head');
  assert.equal(p.variants.nodes.length,1);assert.equal(p.variants.nodes[0].price,targets[i][2]);
  assert(!p.category||p.category.id==='gid://shopify/TaxonomyCategory/na','Already categorized; inspect prior receipt instead of replaying');
  assert(!p.variants.pageInfo.hasNextPage&&!p.media.pageInfo.hasNextPage&&!p.metafields.pageInfo.hasNextPage);
}
const taxonomy=(await admin('{taxonomy{categories(first:30,search:"sex"){nodes{id fullName}pageInfo{hasNextPage}}}}')).taxonomy.categories;
assert(!taxonomy.pageInfo.hasNextPage);assert(taxonomy.nodes.some(c=>c.id===category&&c.fullName==='Mature > Erotic > Sex Toys & Erotic Games'));
if(!process.argv.includes('--apply')){console.log(JSON.stringify({dryRun:true,exactProducts:5,category,priceChanges:0,settingsChanges:0}));process.exit(0);}
await fs.mkdir(dir,{recursive:true});
await fs.writeFile(`${dir}/category-before-private.json`,JSON.stringify({at:new Date().toISOString(),before,taxonomy},null,2),{flag:'wx'});
const receipt=[];
for(const id of ids){
  const result=(await admin('mutation($product:ProductUpdateInput!){productUpdate(product:$product){product{id category{id fullName}}userErrors{field message}}}',{product:{id,category}})).productUpdate;
  assert.deepEqual(result.userErrors,[]);assert.equal(result.product.category.id,category);
  receipt.push(result.product);
  await fs.writeFile(`${dir}/category-write-receipt-private.json`,JSON.stringify({at:new Date().toISOString(),receipt},null,2));
}
const after=(await admin(query,{ids})).nodes;
const omitCategory=p=>Object.fromEntries(Object.entries(p).filter(([k])=>k!=='category'));
for(const [i,p] of after.entries()){
  assert.equal(p.category.id,category);assert.deepEqual(omitCategory(p),omitCategory(before[i]),'An unrelated product field changed; inspect before assuming category-only proof');
}
await fs.writeFile(`${dir}/category-readback-private.json`,JSON.stringify({at:new Date().toISOString(),after},null,2));
console.log(JSON.stringify({categoryUpdates:5,category,unrelatedObservedFieldsEqual:true,beforeHash:createHash('sha256').update(JSON.stringify(before)).digest('hex'),priceChanges:0,settingsChanges:0}));
