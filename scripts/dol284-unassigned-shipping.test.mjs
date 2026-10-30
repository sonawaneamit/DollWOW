import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const evidence = new URL('../data/exports/dol-284-2026-10-30/', import.meta.url);
const receipts = await Promise.all([
  'unassigned-shipping-candidate.json',
  'shipping-execute-1900/before.json',
  'shipping-execute-1900/after.json',
  'shipping-execute-1900/response.json',
].map(async path => JSON.parse(await fs.readFile(new URL(path, evidence), 'utf8')))).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (!receipts) {
  test('private saved-receipt verification', { skip: 'Requires retained local DOL284 shipping receipts; no API calls are made.' }, () => {});
} else {
const [candidate, before, after, response] = receipts;

async function check(change, succeeds = false) {
  const directory = await fs.mkdtemp(join(tmpdir(), 'dol284-shipping-'));
  try {
    const saved = structuredClone(after);
    change(saved);
    for (const [name, value] of Object.entries({ candidate, before, after: saved, response })) {
      await fs.writeFile(join(directory, `${name}.json`), JSON.stringify(value), { mode: 0o600 });
    }
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./dol284-save-unassigned-shipping.mjs', import.meta.url)),
      join(directory, 'candidate.json'), directory, '--verify-saved'], { encoding: 'utf8' });
    assert.equal(result.status === 0, succeeds, result.stderr);
    if (!succeeds) assert.match(result.stderr, /AssertionError/, 'A loader failure is not a guard pass.');
    if (succeeds) {
      const verified = JSON.parse(await fs.readFile(join(directory, 'verified.json'), 'utf8'));
      assert.equal(verified.configuredCountries, 34);
      assert.equal(verified.reportedZoneCountryCount, 0);
      assert.equal(verified.activeMethods, 0);
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
const created = saved => saved.after.find(profile => !profile.default);
test('actual saved dormant readback passes without network or mutation', () => check(() => {}, true));
test('preexisting General change is rejected', () => check(saved => { saved.after.find(profile => profile.default).name += ' changed'; }));
test('any associated variant is rejected', () => check(saved => { created(saved).productVariantsCount.count = 1; }));
test('any selling-plan association is rejected', () => check(saved => { created(saved).sellingPlanGroups.nodes.push({ id: 'unexpected' }); }));
test('active rate is rejected even if aggregate counter remains zero', () => check(saved => { created(saved).profileLocationGroups[0].locationGroupZones.nodes[0].methodDefinitions.nodes[0].active = true; }));
test('missing EU destination is rejected even if country aggregate is unchanged', () => check(saved => {
  const eu = created(saved).profileLocationGroups[0].locationGroupZones.nodes.find(zone => zone.zone.name === 'EU27');
  eu.zone.countries = eu.zone.countries.filter(country => country.code.countryCode !== 'BG');
}));
test('nonzero price is rejected', () => check(saved => { created(saved).profileLocationGroups[0].locationGroupZones.nodes[0].methodDefinitions.nodes[0].rateProvider.price.amount = '1.0'; }));
}
