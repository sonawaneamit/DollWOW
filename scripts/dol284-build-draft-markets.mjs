import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { dirname, isAbsolute, join } from 'node:path';

const output = process.argv[2], execute = process.argv.includes('--execute');
const resumeIndex = process.argv.indexOf('--resume-from');
const resumeFrom = resumeIndex < 0 ? null : process.argv[resumeIndex + 1];
const rejectionIndex = process.argv.indexOf('--country-rejections');
const rejectionFile = rejectionIndex < 0 ? null : process.argv[rejectionIndex + 1];
assert(output && isAbsolute(output), 'Use a new absolute evidence directory.');
assert(!resumeFrom || isAbsolute(resumeFrom));
assert(!rejectionFile || (resumeFrom && isAbsolute(rejectionFile)));
process.loadEnvFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local');
const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '');
const auth = await fetch(`https://${domain}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET })
}).then(r => r.json());
assert(auth.access_token, 'Existing app authentication failed.');
async function query(document, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': auth.access_token },
    body: JSON.stringify({ query: document, variables }), cache: 'no-store'
  });
  const result = await response.json();
  assert(response.ok && !result.errors?.length, JSON.stringify(result.errors ?? response.status));
  return result.data;
}
const fields = `id name handle status
  conditions { regionsCondition { applicationLevel regions(first:250) { nodes { id name ...on MarketRegionCountry { code } } pageInfo { hasNextPage } } } }
  currencySettings { baseCurrency { currencyCode } localCurrencies roundingEnabled }
  priceInclusions { inclusiveDutiesPricingStrategy inclusiveTaxPricingStrategy }
  catalogs(first:20) { nodes { id title } pageInfo { hasNextPage } }`;
async function markets() {
  const data = await query(`query DraftMarketScope { markets(first:50) { nodes { ${fields} } pageInfo { hasNextPage } } }`);
  assert(!data.markets.pageInfo.hasNextPage);
  for (const market of data.markets.nodes) {
    assert(!market.conditions?.regionsCondition?.regions.pageInfo.hasNextPage);
    assert(!market.catalogs.pageInfo.hasNextPage);
  }
  return data.markets.nodes;
}
const before = await markets();
const shop = (await query('{ shop { currencyCode taxesIncluded taxShipping } }')).shop;
const active = before.filter(m => m.status === 'ACTIVE');
assert.equal(active.length, 2, 'Reconcile any changed active-market scope before writing.');
const us = active.find(m => m.conditions?.regionsCondition?.regions.nodes.length === 1 && m.conditions.regionsCondition.regions.nodes[0].code === 'US');
assert(us && (us.currencySettings?.baseCurrency.currencyCode ?? shop.currencyCode) === 'USD');
const eu = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
assert.equal(new Set(eu).size, 27);
const countryEnum = (await query('{ __type(name:"CountryCode") { enumValues { name description } } }')).__type.enumValues;
const specific = new Set(['US', 'CA', 'GB', ...eu]);
const countryExclusions = [];
if (rejectionFile) {
  const rejected = JSON.parse(await fs.readFile(rejectionFile, 'utf8')).marketCreate;
  const previous = JSON.parse(await fs.readFile(join(dirname(rejectionFile), 'before.json'), 'utf8')).plan;
  assert(!rejected.market && rejected.userErrors.length && rejected.userErrors.every(e => e.code === 'UNSUPPORTED_COUNTRY_REGION'));
  const row = previous.find(p => p.handle === 'dol284-rest-of-world');
  assert(row);
  for (const error of rejected.userErrors) {
    assert.deepEqual(error.field.slice(0, 4), ['input', 'conditions', 'regionsCondition', 'regions']);
    const code = row.conditions.regionsCondition.regions[Number(error.field[4])]?.countryCode;
    assert(code && error.message === `${code} is not a supported country or region code.`);
    assert(!specific.has(code) && !['AU', 'NZ', 'CH', 'NO'].includes(code));
    countryExclusions.push({ code, reason: error.message, source: rejectionFile });
  }
}
const restOfWorld = countryEnum.filter(v => v.name !== 'ZZ' && !/unknown/i.test(v.description ?? '') && !specific.has(v.name)
  && !countryExclusions.some(e => e.code === v.name)).map(v => v.name);
assert(['AU', 'NZ', 'CH', 'NO'].every(code => restOfWorld.includes(code)));
const completePlan = [
  { name: 'Canada', handle: 'dol284-canada', countries: ['CA'] },
  { name: 'UK', handle: 'dol284-uk', countries: ['GB'] },
  { name: 'EU', handle: 'dol284-eu', countries: eu },
  { name: 'Rest of the World', handle: 'dol284-rest-of-world', countries: restOfWorld }
].map(row => ({
  name: row.name, handle: row.handle, status: 'DRAFT', makeDuplicateUniqueMarketsDraft: false,
  conditions: { regionsCondition: row.countries
    ? { regions: row.countries.map(countryCode => ({ countryCode })) }
    : { applicationLevel: 'ALL' } },
  currencySettings: { baseCurrency: 'USD', localCurrencies: false, roundingEnabled: false },
  priceInclusions: { taxPricingStrategy: 'INCLUDES_TAXES_IN_PRICE', dutiesPricingStrategy: 'INCLUDE_DUTIES_IN_PRICE' }
}));
let plan = completePlan;
if (resumeFrom) {
  const failed = JSON.parse(await fs.readFile(join(resumeFrom, 'response-dol284-rest-of-world.json'), 'utf8')).marketCreate;
  assert(!failed.market && failed.userErrors.some(e => e.code === 'WILDCARD_NOT_SUPPORTED'));
  for (const handle of ['dol284-canada', 'dol284-uk', 'dol284-eu']) {
    const receipt = JSON.parse(await fs.readFile(join(resumeFrom, `verified-${handle}.json`), 'utf8'));
    assert(receipt.existingMarketsUnchanged && receipt.created.status === 'DRAFT');
    assert.deepEqual(before.find(m => m.id === receipt.created.id), receipt.created, 'Previously completed draft differs; do not replay.');
  }
  plan = completePlan.filter(row => row.handle === 'dol284-rest-of-world');
}
for (const row of plan) assert(!before.some(m => m.handle === row.handle || m.name === row.name), 'Existing candidate: inspect its receipt; never create a duplicate.');
for (const row of plan) assert.equal(Object.keys(row.conditions.regionsCondition).length, 1, 'RegionsCondition is a oneOf input.');
await fs.mkdir(output, { recursive: false });
const save = (name, value) => fs.writeFile(join(output, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
await save('before', { at: new Date().toISOString(), approval: '995e1420-48df-4e6e-b498-3706a40635c4', before, shop, reuseUS: us.id, plan, countryEnum, countryExclusions, resumeFrom, execute });

// Existing orders are read without customer, contact, address or payment data.
const scopes = await query('{ currentAppInstallation { accessScopes { handle } } }');
assert(scopes.currentAppInstallation.accessScopes.some(s => s.handle === 'read_all_orders'));
const orders = [];
let after = null;
do {
  assert(orders.length < 2000, 'Order review exceeds the bounded scope.');
  const data = await query(`query ExistingMorOrders($after:String) { orders(first:100,after:$after,query:"status:any") {
    nodes { id createdAt test cancelledAt displayFinancialStatus displayFulfillmentStatus merchantEditable merchantOfRecordApp { id name } }
    pageInfo { hasNextPage endCursor }
  } }`, { after });
  orders.push(...data.orders.nodes);
  after = data.orders.pageInfo.hasNextPage ? data.orders.pageInfo.endCursor : null;
} while (after);
await save('existing-orders', { at: new Date().toISOString(), completeAccessibleOrderScope: true, orders });
if (execute) {
  for (const input of plan) {
    assert.equal(input.status, 'DRAFT'); assert.equal(input.makeDuplicateUniqueMarketsDraft, false);
    const result = await query(`mutation ConstructDraftMarket($input:MarketCreateInput!) {
      marketCreate(input:$input) { market { ${fields} } userErrors { field code message } }
    }`, { input });
    await save(`response-${input.handle}`, result);
    assert.deepEqual(result.marketCreate.userErrors, [], 'Stop on conflict; do not draft an active market or retry a creation.');
    const created = result.marketCreate.market;
    assert(created && created.status === 'DRAFT' && created.handle === input.handle);
    assert.deepEqual(created.currencySettings, { baseCurrency: { currencyCode: 'USD' }, localCurrencies: false, roundingEnabled: false });
    const current = await markets();
    for (const original of before) assert.deepEqual(current.find(m => m.id === original.id), original, 'An existing market changed; stop.');
    await save(`verified-${input.handle}`, { at: new Date().toISOString(), created, existingMarketsUnchanged: true });
  }
}
await save('final', { at: new Date().toISOString(), execute, markets: await markets(), orderCount: orders.length,
  merchantOfRecordOrders: orders.filter(o => o.merchantOfRecordApp).length,
  qualification: 'Draft market construction only. No activation, Managed Markets switch, shipping/rate/tax registration, checkout/order/payment or published-copy change.' });
console.log(JSON.stringify({ execute, plannedDrafts: plan.length, reuseUS: true, existingOrderCount: orders.length,
  merchantOfRecordOrders: orders.filter(o => o.merchantOfRecordApp).length, existingMarketsPreserved: true, activated: false }));
