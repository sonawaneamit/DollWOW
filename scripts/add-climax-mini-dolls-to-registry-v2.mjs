#!/usr/bin/env node
// Add Climax Eva and Kerekes mini dolls to Belle's template binding
// Using data from Shopify GraphQL Admin API
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const REGISTRY_PATH = 'lib/customization/evidence/template-release.json';
const BELLE_BINDING_KEY = 'c7f5d1fc77b7dbc76ad9026f5b2acc9e374874a071de97a0186ceb760ec31fd6';

// Product data fetched from Shopify - must match ACTIVE state without dollwow-test tag
const PRODUCTS_DATA = {
  'gid://shopify/Product/10761282715832': {
    id: 'gid://shopify/Product/10761282715832',
    handle: 'climax-eva-100cm-q-cup-plus-mini-doll',
    vendor: 'Climax Dolls',
    productType: 'Dolls',
    tags: ['climax', 'climax-dolls', 'custom', 'customizable', 'female-doll', 'height-100', 'mini-doll', 'options:climax-female-tpe-standard', 'tpe', 'weight-under-75'],
    variants: [{
      id: 'gid://shopify/ProductVariant/50561279926456',
      price: '1459.00',
      sku: 'CLIMAX-EVA-100-BASE',
      availableForSale: true
    }],
    metafields: {
      brand: 'climax',
      bodyType: 'female',
      material: 'tpe',
      heightCm: 100,
      cupSize: 'Q',
      stockStatus: 'custom',
      customAvailable: true
    }
  },
  'gid://shopify/Product/10761283010744': {
    id: 'gid://shopify/Product/10761283010744',
    handle: 'climax-kerekes-100cm-q-cup-plus-mini-doll',
    vendor: 'Climax Dolls',
    productType: 'Dolls',
    tags: ['climax', 'climax-dolls', 'custom', 'customizable', 'female-doll', 'height-100', 'mini-doll', 'options:climax-female-tpe-standard', 'tpe', 'weight-under-75'],
    variants: [{
      id: 'gid://shopify/ProductVariant/50561280188600',
      price: '1459.00',
      sku: 'CLIMAX-KEREKES-100-BASE',
      availableForSale: true
    }],
    metafields: {
      brand: 'climax',
      bodyType: 'female',
      material: 'tpe',
      heightCm: 100,
      cupSize: 'Q',
      stockStatus: 'custom',
      customAvailable: true
    }
  }
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

// Find Belle's entry and binding to reference
const belleEntry = registry.payload.entries.find(e => e.handle === 'climax-belle-malachi-158cm-b-cup-tpe-companion-doll-1vkpb');
if (!belleEntry) {
  throw new Error('Could not find Belle entry');
}

const belleBinding = registry.payload.bindings[BELLE_BINDING_KEY];
if (!belleBinding) {
  throw new Error('Could not find Belle binding');
}

console.log(`Using Belle's binding key: ${BELLE_BINDING_KEY}`);
console.log(`Belle's config signature: ${belleBinding.signature}`);
console.log(`Belle's runtime hash: ${belleEntry.runtimeHash.slice(0, 16)}...`);

// For now, use placeholder hashes - we'll need to verify these after deployment
// The actual runtime hash depends on the full product data, config, and defaults
// which requires the app environment to compute correctly
const PLACEHOLDER_HASHES = {
  'gid://shopify/Product/10761282715832': 'PLACEHOLDER_EVA_HASH_TO_BE_COMPUTED',
  'gid://shopify/Product/10761283010744': 'PLACEHOLDER_KEREKES_HASH_TO_BE_COMPUTED'
};

console.log('\n⚠️  WARNING: This script adds entries with placeholder hashes.');
console.log('The actual runtime hashes must be computed using the app environment.');
console.log('After this change is deployed, run the relink script to compute correct hashes.\n');

const existingEntries = new Set(registry.payload.entries.map(e => e.productId));

let added = 0;
for (const [productId, productData] of Object.entries(PRODUCTS_DATA)) {
  if (existingEntries.has(productId)) {
    console.log(`${productData.handle}: already in registry, skipping`);
    continue;
  }

  const entry = {
    productId,
    handle: productData.handle,
    tag: 'options:climax-female-tpe-standard',
    bindingKey: BELLE_BINDING_KEY,
    runtimeHash: PLACEHOLDER_HASHES[productId]
  };

  // Add to expectedProductIds
  registry.payload.expectedProductIds.push(productId);
  
  // Add to entries (insert alphabetically by handle)
  const insertIndex = registry.payload.entries.findIndex(e => e.handle > productData.handle);
  if (insertIndex === -1) {
    registry.payload.entries.push(entry);
  } else {
    registry.payload.entries.splice(insertIndex, 0, entry);
  }

  console.log(`${productData.handle}: added with placeholder hash`);
  added++;
}

if (added === 0) {
  console.log('No products added');
  process.exit(0);
}

// Sort expectedProductIds
registry.payload.expectedProductIds.sort();

// DON'T update approval gates yet - this is intentionally incomplete
// We'll compute correct hashes after deploy

console.log(`\n📝 ${added} products added to registry with placeholder hashes`);
console.log('Next steps:');
console.log('1. Push this change');
console.log('2. After deploy, run relink script to compute correct hashes');
console.log('3. Push the corrected hashes');
