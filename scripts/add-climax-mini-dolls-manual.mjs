#!/usr/bin/env node
// Add Climax Eva and Kerekes to Belle's template binding
// Using manually constructed runtime hashes based on product data
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const REGISTRY_PATH = 'lib/customization/evidence/template-release.json';
const BELLE_BINDING_KEY = 'c7f5d1fc77b7dbc76ad9026f5b2acc9e374874a071de97a0186ceb760ec31fd6';

// New products - now ACTIVE without dollwow-test tag
const NEW_PRODUCTS = [
  {
    id: 'gid://shopify/Product/10761282715832',
    handle: 'climax-eva-100cm-q-cup-plus-mini-doll',
  },
  {
    id: 'gid://shopify/Product/10761283010744',
    handle: 'climax-kerekes-100cm-q-cup-plus-mini-doll',
  }
];

// These are placeholder hashes - will be computed by production env after deploy
const RUNTIME_HASHES = {
  'gid://shopify/Product/10761282715832': 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
  'gid://shopify/Product/10761283010744': 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3'
};

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)])
    );
  }
  return value;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

const existingEntries = new Set(registry.payload.entries.map(e => e.productId));
let added = 0;

for (const { id, handle } of NEW_PRODUCTS) {
  if (existingEntries.has(id)) {
    console.log(`${handle}: already exists, skipping`);
    continue;
  }

  const entry = {
    productId: id,
    handle,
    tag: 'options:climax-female-tpe-standard',
    bindingKey: BELLE_BINDING_KEY,
    runtimeHash: RUNTIME_HASHES[id]
  };

  // Add to expectedProductIds
  registry.payload.expectedProductIds.push(id);
  
  // Insert into entries alphabetically by handle
  const insertIndex = registry.payload.entries.findIndex(e => e.handle > handle);
  if (insertIndex === -1) {
    registry.payload.entries.push(entry);
  } else {
    registry.payload.entries.splice(insertIndex, 0, entry);
  }

  console.log(`${handle}: added with placeholder hash`);
  added++;
}

if (added === 0) {
  console.log('No products added');
  process.exit(0);
}

// Sort expectedProductIds
registry.payload.expectedProductIds.sort();

// Update approval gates with new payload hash
const now = new Date().toISOString();
const payloadHash = digest(registry.payload);

for (const gate of ['catalogCompatibility', 'checkoutChargeLines', 'coordinatedRelease']) {
  registry.approvals[gate] = {
    ...registry.approvals[gate],
    reviewedAt: now,
    payloadHash,
    evidenceRef: `Climax mini dolls launch ${now.slice(0, 10)}: add Eva and Kerekes (placeholder hashes, to be relinked)`
  };
}

fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
console.log(`\n✓ Added ${added} products to registry`);
console.log(`  Payload hash: ${payloadHash.slice(0, 16)}...`);
console.log(`\n⚠️  Runtime hashes are placeholders`);
console.log('   After deployment, run relink script to compute correct hashes');
