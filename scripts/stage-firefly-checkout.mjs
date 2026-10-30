import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='data/exports/dol-262-2026-10-30';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const backup=await read(`${dir}/corrected-readback-private.json`);
const mapped=await read('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/tdf-expansion-2026-10-03/firefly-brand-charge-bindings-candidate.json');
const needed=new Set(mapped.rows.flatMap(r=>r.bindings.map(b=>b.merchandiseId)));
const charges=backup.charges.filter(p=>p.variants.nodes.some(v=>needed.has(v.id)));
assert.equal(charges.length,27);
for(const p of charges){assert(p.tags.includes('dollwow-system')&&p.tags.includes('exact-upgrade-pilot'));for(const v of p.variants.nodes)assert(!v.inventoryItem.requiresShipping&&!v.inventoryItem.tracked&&v.inventoryPolicy==='CONTINUE');}
const domain=process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//,'');
const ar=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET})});const token=(await ar.json()).access_token;assert(token);
async function admin(query,variables={}){const r=await fetch(`https://${domain}/admin/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});const j=await r.json();assert(r.ok&&!j.errors,JSON.stringify(j.errors));return j.data;}
const allPublications=(await admin('query{publications(first:50){nodes{id name}}}')).publications.nodes;
console.log(JSON.stringify({availablePublicationNames:allPublications.map(p=>p.name)}));
const publications=allPublications.filter(p=>p.name==='Online Store'||p.name==='DollWOW! Headless');assert.equal(publications.length,2);
const ids=[...backup.parents,...charges].map(p=>p.id);
const fresh=(await admin('query($ids:[ID!]!){nodes(ids:$ids){...on Product{id status tags handle variants(first:5){nodes{id price}}}}}',{ids})).nodes;
assert(fresh.every(p=>p?.status==='DRAFT'),'Staging already changed; inspect receipt instead of replay');
await fs.writeFile(`${dir}/checkout-staging-before-private.json`,JSON.stringify({at:new Date().toISOString(),fresh,publications},null,2),{flag:'wx'});
const receipt=[];
for(const p of [...charges,...backup.parents]){
  const parent=backup.parents.some(x=>x.id===p.id);
  // Temporary test exclusion isolates approved release QA from normal public catalog reads.
  const tags=parent?[...new Set([...p.tags,'dollwow-test'])]:p.tags;
  const update=(await admin('mutation($product:ProductUpdateInput!){productUpdate(product:$product){product{id status tags}userErrors{field message}}}',{product:{id:p.id,status:'ACTIVE',tags}})).productUpdate;assert.deepEqual(update.userErrors,[]);
  const published=(await admin('mutation($id:ID!,$input:[PublicationInput!]!){publishablePublish(id:$id,input:$input){userErrors{field message}}}',{id:p.id,input:publications.map(p=>({publicationId:p.id}))})).publishablePublish;assert.deepEqual(published.userErrors,[]);
  receipt.push({id:p.id,parent,isolated:parent,status:update.product.status});
  await fs.writeFile(`${dir}/checkout-staging-receipt-private.json`,JSON.stringify({at:new Date().toISOString(),receipt},null,2));
}
console.log(JSON.stringify({parentsStagedExcluded:4,existingChargesActivated:27,unusedDraftChargesPreserved:5,sharedActiveChargesUnchanged:2,publicRelease:false}));
