import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const prior = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/tdf-expansion-2026-10-03';
const directory = 'data/exports/dol-262-2026-10-29';
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const historical = await read(`${prior}/firefly-local-preview-batch.json`);
const saved = await read(`${prior}/firefly-shopify-draft-readback.json`);
const recent = await read('/Volumes/Extreme Pro/Projects/DollWOW-dol266-prices/data/exports/dol-262-2026-10-27/shopify-census.json');
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
assert(domain);
let token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!token) {
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,
      client_secret:process.env.SHOPIFY_CLIENT_SECRET})});
  const body = await response.json();
  assert(response.ok && body.access_token, 'Admin authentication failed');
  token = body.access_token;
}
async function admin(query, variables) {
  const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {method:'POST',
    headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});
  const body = await response.json();
  assert(response.ok && !body.errors, JSON.stringify(body.errors ?? response.status));
  return body.data;
}
const ids = saved.rows.map(row => row.productId);
assert.equal(ids.length,4);
const data = await admin(`query($ids:[ID!]!){nodes(ids:$ids){... on Product{
  id handle title descriptionHtml vendor productType status tags seo{title description}
  variants(first:10){nodes{id title price selectedOptions{name value}}}
  media(first:100){nodes{id status ... on MediaImage{image{url width height altText}}}pageInfo{hasNextPage}}
  metafields(first:100){nodes{namespace key type value}}
  resourcePublications(first:20){nodes{isPublished publication{name}}}
}}}`,{ids});
const products=[];
const recipes={};
const comparisons=[];
for (const raw of data.nodes) {
  const old = saved.rows.find(row => row.productId === raw.id);
  assert(old && old.handle === raw.handle && raw.status === 'DRAFT', 'Exact existing draft required');
  assert(raw.resourcePublications.nodes.every(x => !x.isPublished), 'Draft unexpectedly published');
  assert(!raw.media.pageInfo.hasNextPage && raw.media.nodes.every(x => x.status === 'READY' && x.image), 'Complete ready image gallery required');
  assert.equal(raw.media.nodes.length,old.readyMedia);
  const fields = Object.fromEntries(raw.metafields.nodes.filter(x => x.namespace === 'custom').map(x => [x.key,x.value]));
  const previous = recent.products.nodes.find(x => x.id === raw.id);
  assert(previous, 'Recent census identity required');
  const oldFields=Object.fromEntries(previous.metafields.nodes.filter(x=>x.namespace==='custom').map(x=>[x.key,x.value]));
  assert.deepEqual(JSON.parse(fields.customization_groups),JSON.parse(oldFields.customization_groups),'Menu changed since27Oct review');
  assert.equal(raw.variants.nodes.length,1);
  assert.equal(raw.variants.nodes[0].id,old.variantId);
  assert.equal(Number(raw.variants.nodes[0].price),old.priceUSD);
  const legacy=historical.drafts.find(x=>x.product.handle===raw.handle);
  assert(legacy);
  const p=structuredClone(legacy.product);
  p.id=raw.id;p.title=raw.title;p.tags=raw.tags;p.seo=raw.seo;
  p.images=raw.media.nodes.map(x=>x.image);p.featuredImage=p.images[0];
  p.variants=raw.variants.nodes.map(v=>({id:v.id,title:v.title,availableForSale:false,
    price:{amount:v.price,currencyCode:'USD'},selectedOptions:v.selectedOptions}));
  p.priceRange={minVariantPrice:p.variants[0].price,maxVariantPrice:p.variants[0].price};
  p.extended.customizationGroups=JSON.parse(fields.customization_groups);
  p.extended.editorialIntro=JSON.parse(fields.editorial_intro);
  p.extended.previewCustomizationFixture=true;
  p.dollVueAvailable=false;
  const clean=Object.fromEntries(['id','handle','title','description','vendor','productType','tags','seo','featuredImage','images','variants','priceRange','extended','dollVueAvailable'].map(k=>[k,p[k]]));
  products.push(clean);
  const tag=legacy.templateRecipe.tag;
  if (recipes[tag]) assert.deepEqual(recipes[tag],legacy.templateRecipe,'Shared template recipe differs');
  recipes[tag]=legacy.templateRecipe;
  comparisons.push({handle:p.handle,id:p.id,variantId:p.variants[0].id,status:raw.status,priceUSD:Number(raw.variants.nodes[0].price),
    readyMedia:p.images.length,groups:p.extended.customizationGroups.length,menuMatches27Oct:true,
    menuSha256:crypto.createHash('sha256').update(fields.customization_groups).digest('hex')});
}
await fs.mkdir(directory,{recursive:true});
await fs.writeFile(`${directory}/fresh-admin-private.json`,JSON.stringify({at:new Date().toISOString(),products:data.nodes},null,2));
await fs.writeFile(`${directory}/fresh-readback.json`,JSON.stringify({at:new Date().toISOString(),readOnly:true,comparisons},null,2));
await fs.mkdir('data/draft-previews',{recursive:true});
await fs.writeFile('data/draft-previews/firefly-mary.json',JSON.stringify(products,null,2));
await fs.writeFile('data/draft-previews/firefly-mary-recipes.json',JSON.stringify(recipes,null,2));
console.log(JSON.stringify({products:products.length,media:products.reduce((n,p)=>n+p.images.length,0),unchangedMenus:true,shopifyWrites:0,comparisons}));
