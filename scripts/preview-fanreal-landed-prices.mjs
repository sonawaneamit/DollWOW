import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const directory = 'data/exports/dol-295-2026-10-29';
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
assert(domain, 'Shopify domain required');
let token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!token) {
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET})
  });
  const auth = await response.json();
  assert(response.ok && auth.access_token, 'Admin authentication failed');
  token = auth.access_token;
}
const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
  method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
  body: JSON.stringify({query: `query { products(first:250, query:"title:Fanreal*") {
    nodes { id handle title vendor status tags
      featuredMedia { ... on MediaImage { image { url width height altText } } }
      variants(first:10) { nodes { id price compareAtPrice inventoryItem { unitCost { amount currencyCode } } } }
      metafields(first:100) { nodes { namespace key type value } }
    } pageInfo { hasNextPage }
  } }`})
});
const body = await response.json();
assert(response.ok && !body.errors, JSON.stringify(body.errors ?? response.status));
assert(!body.data.products.pageInfo.hasNextPage, 'Incomplete vendor census');
await fs.mkdir(directory, {recursive: true});
await fs.writeFile(`${directory}/before-final-census-private.json`, JSON.stringify({at: new Date().toISOString(),
  readOnly: true, products: body.data.products.nodes}, null, 2), {flag: 'wx'});
console.log(JSON.stringify({readOnly: true, products: body.data.products.nodes.length,
  active: body.data.products.nodes.filter(p=>p.status === 'ACTIVE').map(p=>({
    id:p.id, handle:p.handle, title:p.title, variants:p.variants.nodes.map(v=>({id:v.id, price:v.price}))
  })), shopifyWrites: 0}));

async function read(query,variables={}) {
  const result=await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
    method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})
  });
  const payload=await result.json();
  assert(result.ok&&!payload.errors,JSON.stringify(payload.errors??result.status));
  return payload.data;
}
const discount=await read(`query{codeDiscountNodeByCode(code:"HALLOWEEN299"){id codeDiscount{... on DiscountCodeBasic{
  title status startsAt endsAt customerGets{value{... on DiscountAmount{amount{amount currencyCode} appliesOnEachItem}}
  items{__typename ... on DiscountCollections{collections(first:10){nodes{id}pageInfo{hasNextPage}}}}}
}}}`);
const campaign=discount.codeDiscountNodeByCode?.codeDiscount;
assert(campaign?.customerGets.items.__typename==='DiscountCollections','Review other campaign eligibility types separately');
assert(!campaign.customerGets.items.collections.pageInfo.hasNextPage,'Incomplete campaign collection set');
const collectionIds=new Set(campaign.customerGets.items.collections.nodes.map(c=>c.id));
const ids=body.data.products.nodes.filter(p=>p.status==='ACTIVE').map(p=>p.id);
const memberships=await read(`query($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle collections(first:20){nodes{id}pageInfo{hasNextPage}}}}}`,{ids});
assert(memberships.nodes.every(p=>!p.collections.pageInfo.hasNextPage),'Incomplete product collection membership');
const proof={at:new Date().toISOString(),readOnly:true,campaign,
  rows:memberships.nodes.map(p=>({id:p.id,handle:p.handle,eligible:p.collections.nodes.some(c=>collectionIds.has(c.id))})),orders:0,discountMutations:0};
await fs.writeFile(`${directory}/discount-eligibility.json`,JSON.stringify(proof,null,2),{flag:'wx'});
console.log(JSON.stringify({discountStatus:campaign.status,amount:campaign.customerGets.value.amount,
  eligibility:proof.rows,orders:0,discountMutations:0}));
