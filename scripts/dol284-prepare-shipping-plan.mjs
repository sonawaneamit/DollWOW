import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

const root = process.argv[2];
assert(root && isAbsolute(root), 'Pass the existing absolute DOL284 evidence directory.');
assert.equal(process.argv.length, 3, 'Preparation only: no execute mode.');
const source = JSON.parse(await fs.readFile(join(root, 'shipping-rate-read-1836.json'), 'utf8'));
const profiles = source.deliveryProfiles;
assert(!profiles.pageInfo.hasNextPage);
const general = profiles.nodes.find(profile => profile.default);
assert.equal(general.id, 'gid://shopify/DeliveryProfile/134113296568');
assert.equal(general.profileLocationGroups.length, 1);
const group = general.profileLocationGroups[0];
assert(!group.locationGroup.locations.pageInfo.hasNextPage);
assert(!group.locationGroupZones.pageInfo.hasNextPage);
assert.equal(group.locationGroup.locations.nodes.length, 1);
assert.equal(group.locationGroupZones.nodes.length, 1);
const originalZone = group.locationGroupZones.nodes[0];
assert(!originalZone.methodDefinitions.pageInfo.hasNextPage);
const originalRate = originalZone.methodDefinitions.nodes.find(method => method.active);
assert.equal(originalRate.rateProvider.__typename, 'DeliveryRateDefinition');
assert.equal(originalRate.rateProvider.price.currencyCode, 'USD');
assert.equal(Number(originalRate.rateProvider.price.amount), 0);
const covered = originalZone.zone.countries.map(country => country.code.countryCode);
assert.equal(covered.length, 24);
const eu = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
const zones = [
  { name: 'US', countries: ['US'] },
  { name: 'Canada', countries: ['CA'] },
  { name: 'UK', countries: ['GB'] },
  { name: 'EU27', countries: eu },
  { name: 'RoW - previously covered destinations only', countries: ['AU', 'NZ', 'CH', 'NO'] },
];
const all = zones.flatMap(zone => zone.countries);
assert.equal(all.length, 34);
assert.equal(new Set(all).size, all.length);
assert(covered.every(code => all.includes(code)));
const missingEU = eu.filter(code => !covered.includes(code));
assert.equal(missingEU.length, 10);
// No variant/selling-plan associations and inactive methods keep this a dormant candidate.
const profile = {
  name: 'DOL284 UNASSIGNED PREVIEW - NOT LIVE',
  variantsToAssociate: [],
  sellingPlanGroupsToAssociate: [],
  locationGroupsToCreate: [{
    locationsToAdd: group.locationGroup.locations.nodes.map(location => location.id),
    zonesToCreate: zones.map(zone => ({
      name: zone.name,
      countries: zone.countries.map(code => ({ code, includeAllProvinces: true })),
      methodDefinitionsToCreate: [{
        name: originalRate.name,
        active: false,
        rateDefinition: { price: { amount: 0, currencyCode: 'USD' } },
      }],
    })),
  }],
};
const result = {
  at: new Date().toISOString(),
  state: 'LOCAL_CANDIDATE_ONLY_NO_SHOPIFY_WRITE',
  sourceAt: source.at,
  approval: '995e1420 construction only; activation requires separate final yes',
  variables: { profile },
  coverage: { existing: covered, proposed: all, additions: missingEU },
  limitations: [
    'No live profile or shipping rate has been changed or created.',
    'An unassigned profile cannot establish rates for current products.',
    'Inactive rates do not offer shipping, even if a product were later assigned.',
    'EU additions are proposed configuration, not supplier delivery acceptance.',
    'RoW207 market membership does not authorize207-country shipping.',
    'A guarded fresh read, schema validation and unchanged-General readback are required before saving this candidate.',
    'Final approved assignment/rate enablement and actual checkout QA remain separate.',
  ],
};
await fs.writeFile(join(root, 'unassigned-shipping-candidate.json'), JSON.stringify(result, null, 2), { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ state: result.state, zones: zones.length, countries: all.length, newEU: missingEU.length, associations: 0, activeMethods: 0 }));
