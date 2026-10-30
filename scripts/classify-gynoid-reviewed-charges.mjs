import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { isAbsolute, join } from 'node:path';

// Scope is the eight dedicated adult-doll option/accessory charges, not the
// shared care products or the store-wide uncategorized inventory.
const output = process.argv[2], execute = process.argv.includes('--execute');
assert(output && isAbsolute(output), 'A new absolute evidence directory is required.');
process.loadEnvFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local');
const saved = JSON.parse(await fs.readFile('data/exports/dol-273-approved-2026-10-30/menu-charge-read-1552/verified.json', 'utf8'));
const rows = saved.charges.nodes.filter(n => n.product.status === 'DRAFT');
assert.equal(rows.length, 8);
const category = 'gid://shopify/TaxonomyCategory/ma-1-4';
const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '');
const authResponse = await fetch(`https://${domain}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET })
});
const auth = await authResponse.json(); assert(authResponse.ok && auth.access_token, 'Existing app authentication failed.');
async function query(document, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': auth.access_token },
    body: JSON.stringify({ query: document, variables }), cache: 'no-store'
  });
  const result = await response.json(); assert(response.ok && !result.errors?.length, JSON.stringify(result.errors ?? response.status));
  return result.data;
}
const document = `query GynoidChargeClassification($ids:[ID!]!) {
  nodes(ids:$ids) { ... on Product { id title handle descriptionHtml status productType vendor tags category { id fullName }
    variants(first:3) { nodes { id title price taxable sku inventoryPolicy selectedOptions { name value } inventoryItem { requiresShipping tracked } } pageInfo { hasNextPage } }
    metafields(first:100) { nodes { namespace key type value } pageInfo { hasNextPage } }
    media(first:10) { nodes { id } pageInfo { hasNextPage } }
    resourcePublications(first:20) { nodes { isPublished publication { id } } pageInfo { hasNextPage } }
  } }
}`;
const read = async () => (await query(document, { ids: rows.map(r => r.product.id) })).nodes;
const before = await read(); assert.equal(before.length, 8);
for (const p of before) {
  const expected = rows.find(r => r.product.id === p?.id); assert(expected);
  assert.equal(p.status, 'DRAFT'); assert.equal(p.productType, 'System charge'); assert.equal(p.title, expected.product.title);
  assert.equal(p.variants.nodes.length, 1); assert.equal(p.variants.nodes[0].id, expected.id);
  assert.equal(Number(p.variants.nodes[0].price), Number(expected.price));
  assert.equal(p.variants.nodes[0].inventoryItem.requiresShipping, false);
  for (const key of ['variants', 'metafields', 'media', 'resourcePublications']) assert.equal(p[key].pageInfo.hasNextPage, false);
  assert(p.resourcePublications.nodes.every(n => !n.isPublished));
  assert(p.category === null || p.category.id === category, 'Do not overwrite an independently assigned category.');
}
const taxonomy = await query(`query GynoidAdultClassification { taxonomy { categories(first:40,search:"Sex Toys") { nodes { id fullName } } } }`);
assert(taxonomy.taxonomy.categories.nodes.some(n => n.id === category && n.fullName === 'Mature > Erotic > Sex Toys & Erotic Games'));
await fs.mkdir(output, { recursive: false });
const save = (name, value) => fs.writeFile(join(output, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
const plan = before.filter(p => !p.category).map(p => ({ id: p.id, title: p.title, category,
  reason: 'Dedicated Gynoid adult-doll configuration or accessory fulfilled with its adult doll; not a generic standalone service or innocuous household product.' }));
await save('before', { at: new Date().toISOString(), approval: '7bc009b1-0291-4544-9c8a-0ee213b2eacb', before, taxonomy, plan,
  qualification: 'Accurate adult classification only. Does not promise platform approval, alter Managed Markets, or authorize tax/shipping settings.' });
if (execute) {
  for (const row of plan) {
    const response = await query(`mutation GynoidAdultCategory($product:ProductUpdateInput!) {
      productUpdate(product:$product) { product { id category { id fullName } } userErrors { field message } }
    }`, { product: { id: row.id, category: row.category } });
    await save(`response-${row.id.split('/').at(-1)}`, response);
    assert.deepEqual(response.productUpdate.userErrors, []);
    const current = (await read()).find(p => p.id === row.id);
    const original = before.find(p => p.id === row.id);
    const withoutCategory = ({ category: ignored, ...rest }) => { void ignored; return rest; };
    assert.equal(current.category.id, category);
    assert.deepEqual(withoutCategory(current), withoutCategory(original), 'Observed fields other than category changed; stop without replaying writes.');
    await save(`verified-${row.id.split('/').at(-1)}`, current);
  }
}
console.log(JSON.stringify({ at: new Date().toISOString(), mode: execute ? 'execute' : 'dry-run', changes: plan.length,
  products: plan.map(p => ({ id: p.id, title: p.title })), category, settingsChanged: false, published: false }));
