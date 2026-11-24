#!/usr/bin/env node
import fs from 'node:fs/promises';
import { getCustomizationConfig } from '../lib/customization/configs.js';
import { templateRuntimeHash } from '../lib/customization/template-release-registry.ts';
import { getProducts } from '../lib/shopify/storefront.ts';

const registry = JSON.parse(await fs.readFile('lib/customization/evidence/template-release.json', 'utf8'));

console.log('Checking runtimeHash mismatches...\n');

// Group entries by brand
const byBrand = {};
for (const entry of registry.payload.entries) {
  const brand = entry.handle.split('-')[0];
  if (!byBrand[brand]) byBrand[brand] = [];
  byBrand[brand].push(entry);
}

const mismatches = [];
let checked = 0;
let total = registry.payload.entries.length;

for (const [brand, entries] of Object.entries(byBrand)) {
  console.log(`Checking ${brand} (${entries.length} products)...`);
  
  for (const entry of entries) {
    checked++;
    if (checked % 100 === 0) console.log(`  Progress: ${checked}/${total}`);
    
    try {
      // Fetch live product
      const result = await getProducts({ query: `handle:${entry.handle}`, first: 1 });
      if (result.products.length === 0) {
        console.log(`  ✗ Not found: ${entry.handle}`);
        continue;
      }
      
      const product = result.products[0];
      const config = getCustomizationConfig(product);
      const liveHash = templateRuntimeHash(product, config);
      
      if (liveHash !== entry.runtimeHash) {
        mismatches.push({
          handle: entry.handle,
          brand,
          stored: entry.runtimeHash.substring(0, 16) + '...',
          live: liveHash.substring(0, 16) + '...',
          tag: entry.tag
        });
      }
    } catch (error) {
      console.log(`  ✗ Error checking ${entry.handle}: ${error.message}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('RUNTIME HASH MISMATCH SUMMARY');
console.log('='.repeat(80));

// Group mismatches by brand
const mismatchesByBrand = {};
for (const m of mismatches) {
  if (!mismatchesByBrand[m.brand]) mismatchesByBrand[m.brand] = [];
  mismatchesByBrand[m.brand].push(m);
}

for (const [brand, items] of Object.entries(mismatchesByBrand)) {
  console.log(`\n${brand.toUpperCase()}: ${items.length} mismatches`);
  items.slice(0, 5).forEach(m => {
    console.log(`  ${m.handle}`);
    console.log(`    Stored: ${m.stored} | Live: ${m.live}`);
  });
  if (items.length > 5) {
    console.log(`  ... and ${items.length - 5} more`);
  }
}

console.log(`\nTotal mismatches: ${mismatches.length} out of ${total} products`);

// Write full list to file
await fs.writeFile('/tmp/runtime-hash-mismatches.json', JSON.stringify(mismatches, null, 2));
console.log('\nFull list written to /tmp/runtime-hash-mismatches.json');
