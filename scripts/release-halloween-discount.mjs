import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Explicit one-off DOL-217 release commands; never changes products or orders.
process.loadEnvFile('.env.local');
const mode = process.argv[2] || 'read';
const root = 'data/exports/dol-217';
const oldId = 'gid://shopify/DiscountAutomaticNode/1811452526776';
const end = '2026-11-08T23:59:00Z';
const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '');
const auth = await fetch(`https://${domain}/admin/oauth/access_token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }) }).then(r => r.json());
if (!auth.access_token) throw new Error('Authorized Shopify app authentication failed.');
async function query(query, variables = {}) {
  const r = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-shopify-access-token': auth.access_token }, body: JSON.stringify({ query, variables }) });
  const result = await r.json();
  if (!r.ok || result.errors?.length) throw new Error(JSON.stringify(result.errors || { status: r.status }));
  return result.data;
}
async function save(name, data) { await fs.writeFile(`${root}/${name}.json`, JSON.stringify(data, null, 2)); }
function checked(payload) { if (payload.userErrors?.length) throw new Error(JSON.stringify(payload.userErrors)); return payload; }
async function read() {
  const data = await query(`query{codeDiscountNodeByCode(code:"HALLOWEEN299"){id codeDiscount{... on DiscountCodeBasic{title status startsAt endsAt combinesWith{orderDiscounts productDiscounts shippingDiscounts} customerGets{value{... on DiscountAmount{amount{amount currencyCode} appliesOnEachItem}}}}}}discountAutomaticNode:node(id:"${oldId}"){... on DiscountAutomaticNode{id automaticDiscount{... on DiscountAutomaticBasic{title status startsAt endsAt}}}}}`);
  await save('release-current-discounts', { at: new Date().toISOString(), ...data });
  return data;
}
const audit = JSON.parse(await fs.readFile(`${root}/release-eligibility-audit.json`, 'utf8'));
const expected = new Set(audit.variantIds);
assert.equal(expected.size, 3147, 'Re-review a changed manifest before releasing');
assert(expected.has('gid://shopify/ProductVariant/54335377080504'));
assert(expected.has('gid://shopify/ProductVariant/54335385534648'));
let current = await read();
let collectionId;
try { collectionId = JSON.parse(await fs.readFile(`${root}/release-collection.json`, 'utf8')).id; } catch { /* First staging run creates a private manual collection. */ }
if (mode === 'stage') {
  const products = audit.eligible.map(p => p.id);
  assert(audit.eligible.every(p => p.variants.nodes.length === 1), 'A product-level collection must not include add-on variants');
  if (!collectionId) {
    const data = await query(`mutation($input:CollectionInput!){collectionCreate(input:$input){collection{id handle}userErrors{field message}}}`, { input: { title: 'Halloween 2026 eligible full-size dolls', handle: 'halloween-2026-eligible-full-size', products: products.slice(0, 250) } });
    const c = checked(data.collectionCreate).collection;
    collectionId = c.id;
    await save('release-collection', c);
  }
  let members = await collectionProducts(collectionId);
  const missingProducts = products.filter(id => !members.has(id));
  for (let i = 0; i < missingProducts.length; i += 250) {
    checked((await query(`mutation($id:ID!,$products:[ID!]!){collectionAddProducts(id:$id,productIds:$products){collection{id}userErrors{field message}}}`, { id: collectionId, products: missingProducts.slice(i, i + 250) })).collectionAddProducts);
    console.log(`Collection membership ${Math.min(i + 250, missingProducts.length)}/${missingProducts.length} added`);
  }
  members = await collectionProducts(collectionId);
  assert.deepEqual([...members].sort(), [...products].sort(), 'Collection membership differs from reviewed manifest');
  let id = current.codeDiscountNodeByCode?.id;
  if (id) assert.equal(current.codeDiscountNodeByCode.codeDiscount.title, 'DollWOW Halloween 2026 - $299 off full-size dolls');
  if (!id) {
    const data = await query(`mutation($input:DiscountCodeBasicInput!){discountCodeBasicCreate(basicCodeDiscount:$input){codeDiscountNode{id}userErrors{field message code}}}`, { input: {
      title: 'DollWOW Halloween 2026 - $299 off full-size dolls', code: 'HALLOWEEN299', context: { all: 'ALL' },
      startsAt: '2026-11-08T23:58:00Z', endsAt: end,
      customerGets: { value: { discountAmount: { amount: '299.00', appliesOnEachItem: false } }, items: { collections: { add: [collectionId] } } },
      combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false }
    } });
    id = checked(data.discountCodeBasicCreate).codeDiscountNode.id;
    await save('release-created-discount', { id, at: new Date().toISOString() });
  }
  const actual = await variants(id);
  assert.deepEqual([...actual].sort(), [...expected].sort(), 'Shopify eligibility differs from reviewed manifest');
  await save('release-eligibility-readback', { at: new Date().toISOString(), id, count: actual.size, variantIds: [...actual], approvedNearCostIncluded: true, unresolvedExcluded: audit.unresolved.map(p => ({ handle: p.handle, reason: p.reason })) });
  current = await read();
} else if (mode === 'activate') {
  const id = current.codeDiscountNodeByCode?.id;
  assert(id, 'Stage the exact manifest first');
  assert.deepEqual([...(await variants(id))].sort(), [...expected].sort());
  const data = await query(`mutation($id:ID!,$input:DiscountCodeBasicInput!){discountCodeBasicUpdate(id:$id,basicCodeDiscount:$input){codeDiscountNode{id}userErrors{field message code}}}`, { id, input: { startsAt: new Date().toISOString(), endsAt: end } });
  checked(data.discountCodeBasicUpdate); current = await read();
} else if (mode === 'retire-10') {
  assert.equal(current.codeDiscountNodeByCode?.codeDiscount.status, 'ACTIVE');
  assert.equal(current.discountAutomaticNode.automaticDiscount.title, '10% off');
  await save('release-before-10-retirement', current);
  const data = await query(`mutation($id:ID!){discountAutomaticDeactivate(id:$id){automaticDiscountNode{id}userErrors{field message code}}}`, { id: oldId });
  checked(data.discountAutomaticDeactivate); current = await read();
} else if (mode !== 'read') throw new Error('Unknown release command');
console.log(JSON.stringify(current));

async function variants(id) {
  const data = await query(`query($id:ID!){codeDiscountNode(id:$id){codeDiscount{... on DiscountCodeBasic{customerGets{items{__typename ... on DiscountCollections{collections(first:10){nodes{id}}}}}}}}}`, { id });
  const items = data.codeDiscountNode.codeDiscount.customerGets.items;
  assert.equal(items.__typename, 'DiscountCollections');
  assert.deepEqual(items.collections.nodes.map(c => c.id), [collectionId]);
  const members = await collectionProducts(collectionId);
  assert.deepEqual([...members].sort(), audit.eligible.map(p => p.id).sort());
  return new Set(audit.eligible.flatMap(p => p.variants.nodes.map(v => v.id)));
}
async function collectionProducts(id) {
  const ids = new Set(); let after = null;
  do {
    const data = await query(`query($id:ID!,$after:String){collection(id:$id){products(first:250,after:$after){nodes{id}pageInfo{hasNextPage endCursor}}}}`, { id, after });
    const list = data.collection.products;
    list.nodes.forEach(v => ids.add(v.id)); after = list.pageInfo.hasNextPage ? list.pageInfo.endCursor : null;
  } while (after);
  return ids;
}
