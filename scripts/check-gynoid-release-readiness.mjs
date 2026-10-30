import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { isAbsolute, join } from 'node:path';

// Read-only preflight. Missing draft merchandise requires controlled QA staging,
// not invented availability or a release signature.
const output = process.argv[2];
assert(output && isAbsolute(output), 'An absolute, new evidence directory is required.');
process.loadEnvFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local');
const reviewed = JSON.parse(await fs.readFile('data/catalog/gynoid-approved-configurations.json', 'utf8'));
const candidate = JSON.parse(await fs.readFile('data/exports/dol-273-approved-2026-10-30/named-upgrades-candidate-1552.json', 'utf8'));
assert.equal(candidate.releaseStatus, 'BLOCKED');
const parentIds = reviewed.products.map(row => row.productId);
const variantIds = Object.keys(candidate.payload.parents);
const charges = [...new Set(Object.values(candidate.payload.groups).flat().map(row => row.merchandiseId))];
assert.equal(parentIds.length, 11); assert.equal(variantIds.length, 13); assert.equal(charges.length, 10);
const ids = [...variantIds, ...charges];
const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '');
const authResponse = await fetch(`https://${domain}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET })
});
const auth = await authResponse.json();
assert(authResponse.ok && auth.access_token, 'Existing app authentication failed.');
async function query(api, document, variables = {}) {
  assert(/^query\b/.test(document), 'Read-only queries only.');
  const response = await fetch(`https://${domain}/${api === 'admin' ? 'admin/api' : 'api'}/2026-04/graphql.json`, {
    method: 'POST', headers: { 'content-type': 'application/json',
      [api === 'admin' ? 'X-Shopify-Access-Token' : 'X-Shopify-Storefront-Access-Token']:
        api === 'admin' ? auth.access_token : process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN },
    body: JSON.stringify({ query: document, variables }), cache: 'no-store'
  });
  const result = await response.json();
  assert(response.ok && !result.errors?.length, JSON.stringify(result.errors ?? { status: response.status }));
  return result.data;
}
await fs.mkdir(output, { recursive: false });
const save = (name, value) => fs.writeFile(join(output, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
const discount = await query('admin', `query GynoidDiscountExclusion {
  codeDiscountNodeByCode(code: "HALLOWEEN299") { id codeDiscount { __typename ... on DiscountCodeBasic {
    title status customerGets { items { __typename ... on DiscountCollections {
      collections(first: 100) { nodes { id } pageInfo { hasNextPage } }
    } } }
  } } }
}`);
await save('discount', discount);
const parents = await query('admin', `query GynoidExclusionParents($ids: [ID!]!) {
  nodes(ids: $ids) { ... on Product { id handle status
    collections(first: 100) { nodes { id } pageInfo { hasNextPage } }
    resourcePublications(first: 20) { nodes { isPublished } pageInfo { hasNextPage } }
  } }
}`, { ids: parentIds });
await save('parents', parents);
assert(parents.nodes.every(p => p && !p.collections.pageInfo.hasNextPage && !p.resourcePublications.pageInfo.hasNextPage), 'Incomplete parent evidence.');
const items = discount.codeDiscountNodeByCode?.codeDiscount?.customerGets?.items;
const exclusion = items?.__typename === 'DiscountCollections' && !items.collections.pageInfo.hasNextPage
  ? parents.nodes.every(p => p.collections.nodes.every(c => !items.collections.nodes.some(d => d.id === c.id))) : null;
const countries = [];
for (const country of ['US', 'DE', 'GB', 'FR']) {
  const data = await query('storefront', `query GynoidCountry($ids: [ID!]!, $country: CountryCode!) @inContext(country: $country) {
    nodes(ids: $ids) { ... on ProductVariant { id availableForSale requiresShipping price { amount currencyCode } product { id handle } } }
  }`, { ids, country });
  await save(`country-${country}`, data);
  countries.push({ country, requested: ids.length, visible: data.nodes.filter(Boolean).length,
    available: data.nodes.filter(n => n?.availableForSale).length,
    unavailableIds: ids.filter(id => !data.nodes.some(n => n?.id === id && n.availableForSale)) });
}
const summary = { at: new Date().toISOString(), writes: 0, carts: 0, discount: 'HALLOWEEN299',
  discountStatus: discount.codeDiscountNodeByCode?.codeDiscount?.status ?? null,
  halloweenCollectionExclusion: exclusion, parents: parents.nodes.map(p => ({ id: p.id, status: p.status,
    published: p.resourcePublications.nodes.some(v => v.isPublished) })), countries,
  qualification: 'Current read-only collection membership proves only this campaign exclusion. Country visibility is not cart, settled currency, rate, tax or shipping acceptance. No settings or publication change.',
  next: 'Controlled exact-scope QA staging is required for unavailable draft merchandise before actual cart/discount/shipping verification. Never sign the release from this preflight.' };
await save('summary', summary);
console.log(JSON.stringify({ at: summary.at, halloweenCollectionExclusion: exclusion,
  countries: countries.map(({ country, requested, visible, available }) => ({ country, requested, visible, available })), writes: 0, carts: 0 }));
