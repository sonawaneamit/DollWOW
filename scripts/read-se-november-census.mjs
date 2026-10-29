import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const directory='data/exports/dol-285-2026-10-29';
const domain=process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//,'');assert(domain);
let token=process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if(!token){
  const response=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({
      grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET})});
  const auth=await response.json();assert(response.ok&&auth.access_token,'Admin authentication failed');token=auth.access_token;
}
async function admin(query,variables={}){
  const response=await fetch(`https://${domain}/admin/api/2026-04/graphql.json`,{method:'POST',
    headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});
  const body=await response.json();assert(response.ok&&!body.errors,JSON.stringify(body.errors??response.status));
  const budget=body.extensions?.cost?.throttleStatus;
  if(budget&&budget.currentlyAvailable<500)await new Promise(resolve=>setTimeout(resolve,Math.ceil((500-budget.currentlyAvailable)/budget.restoreRate*1000)));
  return body.data;
}
const {shop}=await admin('query{shop{ianaTimezone currencyCode}}');
const fields=['brand','material','stock_status','warehouse_country','warehouse_regions','body_code','height_cm','customization_groups','catalog_identity_key','catalog_body_identity_key'];
const aliases=fields.map(key=>`${key}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n');
const products=[];let after=null;
do{
  const data=await admin(`query($after:String){products(first:25,after:$after,query:"tag:sedoll OR tag:se-doll OR tag:se-dolls"){
    nodes{id handle title vendor productType status tags ${aliases}
      featuredMedia{... on MediaImage{image{url width height altText}}}
      variants(first:5){nodes{id price compareAtPrice inventoryItem{unitCost{amount currencyCode}}}pageInfo{hasNextPage}}}
    pageInfo{hasNextPage endCursor}
  }}`,{after});
  assert(data.products.nodes.length||!data.products.pageInfo.hasNextPage,'Empty nonterminal page');
  products.push(...data.products.nodes);after=data.products.pageInfo.hasNextPage?data.products.pageInfo.endCursor:null;
}while(after);
assert.equal(new Set(products.map(p=>p.id)).size,products.length,'Duplicate census identities');
assert(products.every(p=>!p.variants.pageInfo.hasNextPage),'Variant pagination needs review');
await fs.mkdir(directory,{recursive:true});
await fs.writeFile(`${directory}/admin-census-private.json`,JSON.stringify({at:new Date().toISOString(),shop,products,shopifyWrites:0},null,2),{flag:'wx'});
const tally=key=>Object.fromEntries([...new Set(products.map(p=>p[key]?.value??'missing'))].map(value=>[value,products.filter(p=>(p[key]?.value??'missing')===value).length]));
console.log(JSON.stringify({shop,records:products.length,active:products.filter(p=>p.status==='ACTIVE').length,
  material:tally('material'),stock:tally('stock_status'),warehouse:tally('warehouse_country'),shopifyWrites:0}));
