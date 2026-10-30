import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

const [candidatePath, output, ...args] = process.argv.slice(2);
assert(candidatePath && output && isAbsolute(candidatePath) && isAbsolute(output));
assert(args.length === 0 || (args.length === 1 && ['--execute', '--verify-saved'].includes(args[0])));
const execute = args.includes('--execute');
const candidate = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
const profile = candidate.variables.profile;
assert.equal(candidate.state, 'LOCAL_CANDIDATE_ONLY_NO_SHOPIFY_WRITE');
assert.equal(profile.name, 'DOL284 UNASSIGNED PREVIEW - NOT LIVE');
assert.deepEqual(Object.keys(profile).sort(), ['locationGroupsToCreate', 'name', 'sellingPlanGroupsToAssociate', 'variantsToAssociate']);
assert.deepEqual(profile.variantsToAssociate, []);
assert.deepEqual(profile.sellingPlanGroupsToAssociate, []);
assert.equal(profile.locationGroupsToCreate.length, 1);
const group = profile.locationGroupsToCreate[0];
assert.deepEqual(group.locationsToAdd, ['gid://shopify/Location/108947898552']);
assert.equal(group.zonesToCreate.length, 5);
const countries = group.zonesToCreate.flatMap(zone => zone.countries.map(country => country.code));
assert.equal(countries.length, 34);
assert.equal(new Set(countries).size, 34);
assert.deepEqual([...countries].sort(), [...candidate.coverage.proposed].sort());
for (const zone of group.zonesToCreate) {
  assert(zone.countries.every(country => country.includeAllProvinces === true && !country.restOfWorld));
  assert.equal(zone.methodDefinitionsToCreate.length, 1);
  const method = zone.methodDefinitionsToCreate[0];
  assert.equal(method.active, false);
  assert.deepEqual(method.rateDefinition, { price: { amount: 0, currencyCode: 'USD' } });
}
function verify(before, after, id) {
  for (const existing of before) assert.deepEqual(after.find(item => item.id === existing.id), existing, 'Preexisting profile changed: stop and reconcile without replay.');
  assert.equal(after.length, before.length + 1);
  const created = after.find(item => item.id === id);
  assert(created && !created.default);
  assert.equal(created.productVariantsCount.count, 0);
  assert.equal(created.productVariantsCount.precision, 'EXACT');
  assert.equal(created.profileItems.nodes.length, 0);
  assert(!created.profileItems.pageInfo.hasNextPage);
  assert.equal(created.sellingPlanGroups.nodes.length, 0);
  assert(!created.sellingPlanGroups.pageInfo.hasNextPage);
  assert.equal(created.activeMethodDefinitionsCount, 0);
  // The real inactive-profile read reports zero here; explicit zone membership is verified separately.
  assert.equal(created.zoneCountryCount, 0);
  const savedZones = created.profileLocationGroups.flatMap(group => group.locationGroupZones.nodes);
  assert.equal(savedZones.length, 5);
  assert.deepEqual(savedZones.flatMap(zone => zone.zone.countries.map(country => country.code.countryCode)).sort(), [...countries].sort());
  for (const zone of savedZones) {
    const intended = group.zonesToCreate.find(item => item.name === zone.zone.name);
    assert(intended);
    assert.deepEqual(zone.zone.countries.map(country => country.code.countryCode).sort(), intended.countries.map(country => country.code).sort());
    assert.equal(zone.methodDefinitions.nodes.length, 1);
    const method = zone.methodDefinitions.nodes[0];
    assert(!method.active && method.rateProvider.__typename === 'DeliveryRateDefinition');
    assert.equal(Number(method.rateProvider.price.amount), 0);
    assert.equal(method.rateProvider.price.currencyCode, 'USD');
  }
  return { at: new Date().toISOString(), id, existingProfilesUnchanged: true, variants: 0, sellingPlanGroups: 0, activeMethods: 0, configuredCountries: 34, reportedZoneCountryCount: created.zoneCountryCount, zones: 5 };
}
if (args.includes('--verify-saved')) {
  const before = JSON.parse(await fs.readFile(join(output, 'before.json'), 'utf8')).before;
  const after = JSON.parse(await fs.readFile(join(output, 'after.json'), 'utf8')).after;
  const response = JSON.parse(await fs.readFile(join(output, 'response.json'), 'utf8')).deliveryProfileCreate;
  assert.equal(response.userErrors.length, 0);
  const verified = verify(before, after, response.profile.id);
  await fs.writeFile(join(output, 'verified.json'), JSON.stringify(verified, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ...verified, savedReadbackOnly: true }));
  process.exit(0);
}
process.loadEnvFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local');
const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '');
const auth = await fetch(`https://${domain}/admin/oauth/access_token`, {
  method: 'POST', body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }),
}).then(response => response.json());
assert(auth.access_token, 'Existing app authentication failed.');
async function query(document, variables = {}) {
  const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': auth.access_token },
    body: JSON.stringify({ query: document, variables }), cache: 'no-store',
  });
  const result = await response.json();
  assert(response.ok && !result.errors?.length, JSON.stringify(result.errors ?? response.status));
  return result.data;
}
const fields = `id name default activeMethodDefinitionsCount zoneCountryCount locationsWithoutRatesCount
  productVariantsCount { count precision }
  profileItems(first:1) { nodes { id } pageInfo { hasNextPage } }
  sellingPlanGroups(first:1) { nodes { id } pageInfo { hasNextPage } }
  profileLocationGroups {
    locationGroup { id locations(first:20) { nodes { id } pageInfo { hasNextPage } } }
    locationGroupZones(first:20) { nodes {
      zone { id name countries { code { countryCode restOfWorld } provinces { code } } }
      methodDefinitions(first:20) { nodes { id name active rateProvider { __typename ...on DeliveryRateDefinition { price { amount currencyCode } } } } pageInfo { hasNextPage } }
    } pageInfo { hasNextPage } }
  }`;
async function read() {
  const data = await query(`{ deliveryProfiles(first:20) { nodes { ${fields} } pageInfo { hasNextPage } } }`);
  assert(!data.deliveryProfiles.pageInfo.hasNextPage);
  for (const profile of data.deliveryProfiles.nodes) for (const group of profile.profileLocationGroups) {
    assert(!group.locationGroup.locations.pageInfo.hasNextPage);
    assert(!group.locationGroupZones.pageInfo.hasNextPage);
    assert(group.locationGroupZones.nodes.every(zone => !zone.methodDefinitions.pageInfo.hasNextPage));
  }
  return data.deliveryProfiles.nodes;
}
const before = await read();
assert(!before.some(existing => existing.name === profile.name), 'Candidate already exists; reconcile the receipt, never recreate.');
const general = before.find(existing => existing.default);
assert.equal(general.id, 'gid://shopify/DeliveryProfile/134113296568');
assert.equal(general.zoneCountryCount, 24);
assert.equal(general.profileLocationGroups.length, 1);
const currentCountries = general.profileLocationGroups[0].locationGroupZones.nodes.flatMap(zone => zone.zone.countries.map(country => country.code.countryCode));
assert.deepEqual([...currentCountries].sort(), [...candidate.coverage.existing].sort());
await fs.mkdir(output, { recursive: false });
const save = (name, value) => fs.writeFile(join(output, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
await save('before', { at: new Date().toISOString(), execute, before, candidatePath, profile });
if (!execute) {
  console.log(JSON.stringify({ dryRun: true, profiles: before.length, proposedAssociations: 0, proposedActiveMethods: 0 }));
} else {
  await save('request-started', { at: new Date().toISOString(), action: 'CREATE_ONE_UNASSIGNED_PROFILE_ONLY' });
  const response = await query(`mutation DormantShipping($profile:DeliveryProfileInput!) { deliveryProfileCreate(profile:$profile) { profile { id name } userErrors { field message } } }`, { profile });
  await save('response', response);
  assert.equal(response.deliveryProfileCreate.userErrors.length, 0, 'Rejected request: inspect exact receipt; do not retry automatically.');
  const id = response.deliveryProfileCreate.profile?.id;
  assert(id);
  const after = await read();
  await save('after', { at: new Date().toISOString(), after });
  const verified = verify(before, after, id);
  await save('verified', verified);
  console.log(JSON.stringify(verified));
}
