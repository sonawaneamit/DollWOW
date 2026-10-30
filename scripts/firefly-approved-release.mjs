import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const dir='data/exports/dol-262-2026-10-30';
const old=JSON.parse(await fs.readFile('data/exports/dol-262-2026-10-29/fresh-admin-private.json','utf8')).products;
const chargeBackup=JSON.parse(await fs.readFile('data/exports/dol-262-2026-10-29/fresh-charge-readback-private.json','utf8')).charges;
const domain=process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//,'');
assert(domain);
const auth=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET})});
const token=(await auth.json()).access_token;assert(auth.ok&&token,'Admin authentication failed');
async function admin(query,variables={}){
  const r=await fetch(`https://${domain}/admin/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});
  const j=await r.json();assert(r.ok&&!j.errors,JSON.stringify(j.errors??r.status));return j.data;
}
const query=`query($ids:[ID!]!){nodes(ids:$ids){...on Product{id handle title descriptionHtml vendor productType status tags seo{title description} variants(first:10){nodes{id title price compareAtPrice selectedOptions{name value} inventoryPolicy inventoryItem{tracked requiresShipping measurement{weight{unit value}}}}} media(first:100){nodes{id status ...on MediaImage{image{url width height altText}}}pageInfo{hasNextPage}} metafields(first:100){nodes{namespace key type value}} resourcePublications(first:20){nodes{isPublished publication{id name}}}}}}`;
const current=(await admin(query,{ids:[...old,...chargeBackup].map(p=>p.id)})).nodes;
assert.equal(current.length,36);assert(current.every(Boolean));
const parents=current.slice(0,4),charges=current.slice(4);
const field=(p,key)=>p.metafields.nodes.find(m=>m.namespace==='custom'&&m.key===key);
for(const p of parents){const previous=old.find(o=>o.id===p.id);assert(previous&&p.handle===previous.handle&&p.status==='DRAFT','Exact unpublished parent required');assert(p.resourcePublications.nodes.every(p=>!p.isPublished));assert.deepEqual(p.media.nodes.map(m=>[m.id,m.status]),previous.media.nodes.map(m=>[m.id,m.status]));assert.equal(field(p,'customization_groups').value,field(previous,'customization_groups').value);assert.equal(p.variants.nodes.length,1);assert.equal(p.variants.nodes[0].id,previous.variants.nodes[0].id);}
for(const p of charges){const previous=chargeBackup.find(o=>o.id===p.id);assert(previous&&p.handle===previous.handle&&p.status==='DRAFT');assert(p.resourcePublications.nodes.every(p=>!p.isPublished));assert.deepEqual(p.variants.nodes.map(v=>[v.id,v.price]),previous.variants.nodes.map(v=>[v.id,v.price]));}
const plans=parents.map(p=>{
  const normal=p.handle==='firefly-mary-164cm-normal-silicone-companion-doll',max165=p.handle==='firefly-mary-165cm-max-silicone-companion-doll';
  const measurements=JSON.parse(field(p,'measurements').value);
  const metafields=[];
  const set=(key,value)=>metafields.push({namespace:'custom',key,type:field(p,key).type,value:String(value)});
  if(normal||max165){measurements.Weight=normal?'30 kg':'34 kg';set('weight_lb',normal?'66.14':'74.96');if(max165){measurements['Cup size']='65B';set('cup_size','65B');for(const key of ['catalog_identity_key','catalog_body_identity_key'])set(key,field(p,key).value.replace('165cm-d-cup-max','165cm-65b-max'));}set('measurements',JSON.stringify(measurements));}
  const tags=(normal||max165)?p.tags.map(t=>t==='weight-75-89'?'weight-under-75':t):p.tags;
  let descriptionHtml=p.descriptionHtml;
  if(normal)descriptionHtml=descriptionHtml.replace(/36\s*kg/gi,'30 kg').replace(/79\.4\s*(?:lb|lbs)/gi,'66.14 lb');
  if(max165)descriptionHtml=descriptionHtml.replace(/37\.5\s*kg/gi,'34 kg').replace(/82\.7\s*(?:lb|lbs)/gi,'74.96 lb').replace(/D[ -]Cup/gi,'65B');
  assert(!/authorized\s+dealer/i.test(descriptionHtml),'Remove any unapproved dealer wording before release');
  return {id:p.id,handle:p.handle,variantId:p.variants.nodes[0].id,price:normal?'2600.00':p.variants.nodes[0].price,product:{id:p.id,tags,descriptionHtml,metafields},normal,max165};
});
await fs.mkdir(dir,{recursive:true});
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
await fs.writeFile(`${dir}/pre-release-private.json`,JSON.stringify({at:new Date().toISOString(),parents,charges,plans},null,2),{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});
if(process.argv.includes('--apply-corrections')){
  for(const plan of plans.filter(p=>p.normal||p.max165)){
    const p=(await admin('mutation($product:ProductUpdateInput!){productUpdate(product:$product){product{id} userErrors{field message}}}',{product:plan.product})).productUpdate;
    assert.deepEqual(p.userErrors,[]);
    if(plan.normal){const v=(await admin('mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$productId,variants:$variants){productVariants{id price} userErrors{field message}}}',{productId:plan.id,variants:[{id:plan.variantId,price:plan.price}]})).productVariantsBulkUpdate;assert.deepEqual(v.userErrors,[]);}
  }
  const after=(await admin(query,{ids:parents.map(p=>p.id)})).nodes;
  for(const p of after){const plan=plans.find(x=>x.id===p.id);assert(p.status==='DRAFT');assert.equal(p.variants.nodes[0].price,plan.price);for(const m of plan.product.metafields)assert.equal(field(p,m.key).value,m.value);assert.equal(field(p,'customization_groups').value,field(parents.find(x=>x.id===p.id),'customization_groups').value);}
  await fs.writeFile(`${dir}/corrected-readback-private.json`,JSON.stringify({at:new Date().toISOString(),parents:after,charges},null,2));
}
console.log(JSON.stringify({parents:parents.length,charges:charges.length,menusUnchanged:true,backupSha256:digest(parents),correctionsApplied:process.argv.includes('--apply-corrections'),published:false,plans:plans.map(p=>({handle:p.handle,price:p.price,fields:p.product.metafields.map(m=>m.key)}))}));
