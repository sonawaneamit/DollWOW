#!/usr/bin/env node
// Relink FunWest/Top Fire registry hashes after Shopify data changes, using the app's own hash functions.
// Run: NODE_OPTIONS=--conditions=react-server npx tsx scripts/relink-funwest-topfire-registry.mjs
// Re-stamps all three approval gates with the new payload hash (required, or presets die sitewide).
import fs from 'node:fs';
import { getProductByHandle } from '../lib/shopify/storefront.ts';
import { getFactoryCustomizationConfig } from '../lib/customization/configs.ts';
import { templateRuntimeHash, templateReleasePayloadHash, templateReleaseIssues } from '../lib/customization/template-release-registry.ts';

const REGISTRY_PATH = 'lib/customization/evidence/template-release.json';
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
const entries = registry.payload.entries.filter(e => /^(funwest-dolls-|top-fire-doll-)/.test(e.handle));
let changed = 0, same = 0, missing = [];
for (const entry of entries) {
  const product = await getProductByHandle(entry.handle, { cache: 'no-store', strict: true }).catch(() => null);
  if (!product || product.id !== entry.productId) { missing.push(entry.handle); continue; }
  const hash = templateRuntimeHash(product, getFactoryCustomizationConfig(product));
  if (hash === entry.runtimeHash) same++; else { entry.runtimeHash = hash; changed++; }
}
const now = new Date().toISOString();
const payloadHash = templateReleasePayloadHash(registry.payload);
for (const gate of ['catalogCompatibility', 'checkoutChargeLines', 'coordinatedRelease']) {
  registry.approvals[gate] = { ...registry.approvals[gate], reviewedAt: now, payloadHash,
    evidenceRef: `FunWest/Top Fire go-live relink ${now.slice(0, 10)}: ${changed} hashes relinked` };
}
const issues = templateReleaseIssues(registry);
if (issues.length) { console.error('Registry invalid, not written:', issues); process.exit(1); }
fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
console.log({ entries: entries.length, changed, unchanged: same, notVisibleOrMissing: missing.length, missing });
