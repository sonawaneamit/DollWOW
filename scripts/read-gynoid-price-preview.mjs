import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const directory='data/exports/dol-273-price-2026-10-29';
const snapshots=JSON.parse(await fs.readFile('data/draft-previews/gynoid-oct28.json','utf8'));
const old=JSON.parse(await fs.readFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dol-273-2026-10-28/admin-readback.json','utf8')).products.nodes
  .filter(p=>snapshots.some(s=>s.id===`preview:gynoid:${p.id.split('/').at(-1)}`&&s.handle===p.handle));
assert.equal(old.length,11);
const domain=process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//,'');
assert(domain);
let token=process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if(!token){
  const response=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({
      grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET
    })});
  const auth=await response.json();assert(response.ok&&auth.access_token,'Admin authentication failed');token=auth.access_token;
}
const response=await fetch(`https://${domain}/admin/api/2026-04/graphql.json`,{method:'POST',
  headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({
    query:`query($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle status
      variants(first:10){nodes{id price compareAtPrice}pageInfo{hasNextPage}}
      media(first:100){nodes{id status}pageInfo{hasNextPage}}
      metafields(first:100){nodes{namespace key type value}pageInfo{hasNextPage}}
      resourcePublications(first:20){nodes{isPublished publication{name}}} }}}`,variables:{ids:old.map(p=>p.id)}
  })});
const payload=await response.json();assert(response.ok&&!payload.errors,JSON.stringify(payload.errors??response.status));
const rows=[];
for(const product of payload.data.nodes){
  const before=old.find(p=>p.id===product?.id);
  assert(before&&product.status==='DRAFT'&&before.handle===product.handle,'Exact retained draft required');
  assert(product.resourcePublications.nodes.every(p=>!p.isPublished),'Unexpected publication');
  assert(!product.variants.pageInfo.hasNextPage&&!product.media.pageInfo.hasNextPage&&!product.metafields.pageInfo.hasNextPage,'Incomplete read');
  assert.deepEqual(product.variants.nodes.map(v=>[v.id,v.price]),before.variants.nodes.map(v=>[v.id,v.price]),'Draft price/variant drift');
  assert.deepEqual(product.media.nodes.map(m=>m.id),before.media.nodes.map(m=>m.id),'Saved gallery identity/order drift');
  assert(product.media.nodes.every(m=>m.status==='READY'),'Non-ready gallery');
  const fields=x=>Object.fromEntries(x.metafields.nodes.map(m=>[`${m.namespace}.${m.key}`,m.value]));
  assert.equal(fields(product)['custom.customization_groups'],fields(before)['custom.customization_groups'],'Saved menu drift');
  rows.push({id:product.id,handle:product.handle,variants:product.variants.nodes,media:product.media.nodes.length,
    menuSha256:crypto.createHash('sha256').update(fields(product)['custom.customization_groups']).digest('hex'),draft:true,unpublished:true});
}
assert.equal(rows.length,11);assert.equal(rows.reduce((n,p)=>n+p.media,0),94);
await fs.mkdir(directory,{recursive:true});
await fs.writeFile(`${directory}/fresh-admin-private.json`,JSON.stringify({at:new Date().toISOString(),products:payload.data.nodes},null,2),{flag:'wx'});
await fs.writeFile(`${directory}/fresh-readback.json`,JSON.stringify({at:new Date().toISOString(),rows,shopifyWrites:0},null,2),{flag:'wx'});
console.log(JSON.stringify({drafts:rows.length,readyMedia:94,menusUnchanged:true,variantPricesUnchanged:true,shopifyWrites:0}));
