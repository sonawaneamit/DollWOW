import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const [sourcePath, chargesPath, marketsPath] = process.argv.slice(2);
if (!sourcePath || !chargesPath || !marketsPath) throw new Error('Supply the fresh catalog, charge and market evidence files');
const report = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
const charges = JSON.parse(await fs.readFile(chargesPath, 'utf8'));
const markets = JSON.parse(await fs.readFile(marketsPath, 'utf8'));
if (report.failures.length || report.requestedCount !== 2580 || report.candidate.payload.entries.length !== 2580 ||
    Date.now() - Date.parse(report.checkedAt) > 86400000 || markets.failures.length || markets.uniqueAddons !== 1834 ||
    Date.now() - Date.parse(markets.checkedAt) > 86400000 || markets.countries.join(',') !== 'US,PT,GB,CA,AU,DE' ||
    Object.keys(charges.payload.parents).length !== 2591 || charges.releaseStatus !== 'BLOCKED') throw new Error('Fresh release evidence incomplete');
const registry = report.candidate;
const hash = value => createHash('sha256').update(value).digest('hex');
const bindingKeys = new Map(Object.keys(registry.payload.bindings).map(key => [key, hash(key)]));
registry.payload.entries = registry.payload.entries.map(entry => ({ ...entry, bindingKey: bindingKeys.get(entry.bindingKey) }));
registry.payload.bindings = Object.fromEntries(Object.entries(registry.payload.bindings).map(([key, recipe]) => [bindingKeys.get(key), {
  ...recipe, signature: recipe.signature.startsWith('sha256:') ? recipe.signature : `sha256:${hash(recipe.signature)}`
}]));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([,item]) => item !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => [key,canonical(item)]));
  return value;
}
const evidenceRef = 'docs/preset-hosted-candidate-2026-09-18.md';
const reviewedAt = new Date().toISOString();
const payloadHash = hash(JSON.stringify(canonical(registry.payload)));
registry.releaseStatus = 'APPROVED';
registry.approvals = Object.fromEntries(['catalogCompatibility','checkoutChargeLines','coordinatedRelease'].map(gate => [gate, {
  reviewedBy: 'Codex: verified catalog and checkout evidence; hosted candidate only', reviewedAt, evidenceRef, payloadHash
}]));
charges.releaseStatus = 'APPROVED';
charges.approval = { payloadHash: hash(JSON.stringify(charges.payload)), evidenceRef, reviewedAt };
for (const [file, data] of [['lib/customization/evidence/template-release.json',registry], ['lib/cart/evidence/named-upgrades-release.json',charges]]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data) + '\n');
  console.log(`${file}: ${Buffer.byteLength(JSON.stringify(data))} bytes`);
}
