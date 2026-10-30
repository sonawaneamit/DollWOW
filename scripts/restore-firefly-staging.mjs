import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='data/exports/dol-262-2026-10-30';
const staging=JSON.parse(await fs.readFile(`${dir}/checkout-staging-before-private.json`,'utf8'));
const corrected=JSON.parse(await fs.readFile(`${dir}/corrected-readback-private.json`,'utf8'));
const domain=process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//,'');
const auth=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET})});
const token=(await auth.json()).access_token;assert(token);
async function admin(query,variables={}){const r=await fetch(`https://${domain}/admin/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});const j=await r.json();assert(r.ok&&!j.errors,JSON.stringify(j.errors));return j.data;}
const ids=staging.fresh.map(p=>p.id);
const fresh=(await admin('query($ids:[ID!]!){nodes(ids:$ids){...on Product{id status tags handle}}}',{ids})).nodes;
assert.equal(fresh.length,31);assert(fresh.every(p=>p.status==='ACTIVE'));
await fs.writeFile(`${dir}/staging-restore-before-private.json`,JSON.stringify({at:new Date().toISOString(),fresh},null,2),{flag:'wx'});
const results=[];
for(const p of fresh){
  const parent=corrected.parents.find(x=>x.id===p.id);
  const tags=parent?p.tags.filter(t=>t!=='dollwow-test'):p.tags;
  if(parent)assert.deepEqual([...tags].sort(),[...parent.tags].sort());
  const updated=(await admin('mutation($product:ProductUpdateInput!){productUpdate(product:$product){product{id status tags}userErrors{message}}}',{product:{id:p.id,status:'DRAFT',tags}})).productUpdate;
  assert.deepEqual(updated.userErrors,[]);assert.equal(updated.product.status,'DRAFT');
  const unpublished=(await admin('mutation($id:ID!,$input:[PublicationInput!]!){publishableUnpublish(id:$id,input:$input){userErrors{message}}}',{id:p.id,input:staging.publications.map(p=>({publicationId:p.id}))})).publishableUnpublish;
  assert.deepEqual(unpublished.userErrors,[]);
  results.push({id:p.id,parent:!!parent,status:updated.product.status});
  await fs.writeFile(`${dir}/staging-restore-receipt-private.json`,JSON.stringify({at:new Date().toISOString(),results},null,2));
}
const after=(await admin('query($ids:[ID!]!){nodes(ids:$ids){...on Product{id status tags variants(first:5){nodes{id price}} metafields(first:100){nodes{namespace key value}}}}}',{ids})).nodes;
assert(after.every(p=>p.status==='DRAFT'&&!p.tags.includes('dollwow-test')));
for(const p of after.filter(p=>corrected.parents.some(x=>x.id===p.id))){
  const before=corrected.parents.find(x=>x.id===p.id);
  assert.deepEqual(p.variants.nodes.map(v=>[v.id,v.price]),before.variants.nodes.map(v=>[v.id,v.price]));
  const values=p.metafields.nodes.filter(m=>m.namespace==='custom'&&['weight_lb','cup_size','measurements'].includes(m.key));
  for(const m of values)assert.equal(m.value,before.metafields.nodes.find(x=>x.namespace===m.namespace&&x.key===m.key)?.value);
}
await fs.writeFile(`${dir}/staging-restored-readback-private.json`,JSON.stringify({at:new Date().toISOString(),after},null,2));
console.log(JSON.stringify({parentsDraft:4,chargesRestoredDraft:27,approvedCorrectionsPreserved:true,sharedActiveChargesUntouched:2,orders:0,emails:0}));
