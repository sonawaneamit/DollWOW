import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const output = process.argv[2];
assert(output && path.isAbsolute(output), 'Provide an absolute private output path');
const snapshots = JSON.parse(await fs.readFile('data/draft-previews/gynoid-oct28.json', 'utf8'));
const prices = JSON.parse(await fs.readFile('data/draft-previews/gynoid-final-price-review.json', 'utf8'));
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
assert(domain, 'Shopify domain required');
let token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!token) {
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({
      grant_type:'client_credentials', client_id:process.env.SHOPIFY_CLIENT_ID, client_secret:process.env.SHOPIFY_CLIENT_SECRET
    })});
  const auth = await response.json();
  assert(response.ok && auth.access_token, 'Admin authentication failed');
  token = auth.access_token;
}
const ids = snapshots.map(p => `gid://shopify/Product/${p.id.split(':').at(-1)}`);
assert.equal(new Set(ids).size, 11);
const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {method:'POST',
  headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token}, body:JSON.stringify({
    query:`query($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title status
      options{id name values} variants(first:100){nodes{id title price selectedOptions{name value}}pageInfo{hasNextPage}}
      resourcePublications(first:30){nodes{isPublished publication{name}}pageInfo{hasNextPage}}
    }}}`, variables:{ids}
  })});
const result = await response.json();
assert(response.ok && !result.errors, JSON.stringify({status:response.status,errors:result.errors?.map(e=>e.message)}));
const products = result.data.nodes;
for (const product of products) {
  const saved = snapshots.find(p => p.handle === product?.handle && p.id.split(':').at(-1) === product.id.split('/').at(-1));
  assert(saved && product.status === 'DRAFT', 'Expected exact retained draft identity');
  assert(!product.variants.pageInfo.hasNextPage && !product.resourcePublications.pageInfo.hasNextPage, 'Incomplete read');
  assert(product.resourcePublications.nodes.every(p => !p.isPublished), 'Unexpected existing publication');
}
const versions = ['M13','M21'].map(model => {
  const standard = prices.find(r => r.model === model && r.version === 'Standard');
  const deluxe = prices.find(r => r.model === model && r.version === 'Deluxe');
  const product = products.find(p => p.handle === standard.referenceHandle);
  assert(product && deluxe && deluxe.referenceHandle === null, 'Review existing mapping before preparing again');
  assert.equal(product.variants.nodes.length, 1, 'Existing version variants require separate reconciliation');
  const variant = product.variants.nodes[0];
  assert.equal(Number(variant.price), standard.proposedUSD, 'Standard price drift');
  return {model, productId:product.id, handle:product.handle, existingStandardVariant:variant,
    proposedBodyVersions:[{version:'Standard',priceUSD:standard.proposedUSD,variantId:variant.id},
      {version:'Deluxe',priceUSD:deluxe.proposedUSD,variantId:null}],
    state:'PROPOSED_NOT_MAPPED',
    gates:['Confirm current official body-version construction and option compatibility',
      'Implement exact version selection and server-priced checkout binding before variant writes',
      'Verify no duplicate existing version and preserve original head/gallery/menu identities']};
});
await fs.mkdir(path.dirname(output), {recursive:true});
await fs.writeFile(output, JSON.stringify({at:new Date().toISOString(), approval:'7bc009b1-0291-4544-9c8a-0ee213b2eacb',
  products, versions, shopifyWrites:0, live:false},null,2), {flag:'wx',mode:0o600});
console.log(JSON.stringify({drafts:products.length,versionPlans:versions.length,deluxeMapped:false,shopifyWrites:0,live:false}));
