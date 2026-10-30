import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='data/exports/dol-284-2026-10-30';
const d=process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//,'');
const auth=await fetch(`https://${d}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET})});
const token=(await auth.json()).access_token;assert(token);
const query=`query($after:String){products(first:250,after:$after){pageInfo{hasNextPage endCursor}nodes{id title handle status productType category{id fullName}}}}`;
const rows=[];let after=null,pages=0;
do{
  const r=await fetch(`https://${d}/admin/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables:{after}})});
  const j=await r.json();assert(r.ok&&!j.errors,JSON.stringify(j.errors));
  const page=j.data.products;rows.push(...page.nodes);pages++;
  assert(pages<200,'Unexpectedly large catalog; stop rather than silently truncate');
  after=page.pageInfo.hasNextPage?page.pageInfo.endCursor:null;
}while(after);
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
const missing=rows.filter(p=>!p.category||p.category.id==='gid://shopify/TaxonomyCategory/na');
const summary={at:new Date().toISOString(),pages,productsRead:rows.length,uncategorized:missing.length,
  activeUncategorized:missing.filter(p=>p.status==='ACTIVE').length,
  systemChargeUncategorized:missing.filter(p=>p.productType==='System charge').length,
  noWrites:true};
await fs.mkdir(dir,{recursive:true});
await fs.writeFile(`${dir}/uncategorized-products-private.json`,JSON.stringify({summary,products:missing},null,2),{flag:'wx'});
await fs.writeFile(`${dir}/uncategorized-summary.json`,JSON.stringify(summary,null,2),{flag:'wx'});
console.log(JSON.stringify(summary));
