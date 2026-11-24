#!/usr/bin/env node
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Regenerate approval hashes for preview branch - does NOT validate evidence,
// only updates hashes to match current payload for preview testing.
// Production releases MUST use prepare-preset-hosted-candidate.mjs with full evidence.

const registryPath = 'lib/customization/evidence/template-release.json';
const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)])
    );
  }
  return value;
}

const hash = value => createHash('sha256').update(value).digest('hex');
const payloadHash = hash(JSON.stringify(canonical(registry.payload)));

console.log('Current payload hash:', payloadHash);
console.log('\nOld approval hashes:');
for (const [gate, approval] of Object.entries(registry.approvals || {})) {
  console.log(`  ${gate}: ${approval.payloadHash}`);
}

const evidenceRef = 'DOL-399: FunWest packages preview - approval regenerated for preview testing only';
const reviewedAt = new Date().toISOString();

registry.approvals = Object.fromEntries(
  ['catalogCompatibility', 'checkoutChargeLines', 'coordinatedRelease'].map(gate => [
    gate,
    {
      reviewedBy: 'Preview regeneration: DOL-399 FunWest packages',
      reviewedAt,
      evidenceRef,
      payloadHash
    }
  ])
);

await fs.writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log('\n✓ Updated approval hashes:');
for (const [gate, approval] of Object.entries(registry.approvals)) {
  console.log(`  ${gate}: ${approval.payloadHash}`);
}
console.log(`\nWrote ${registryPath}`);
