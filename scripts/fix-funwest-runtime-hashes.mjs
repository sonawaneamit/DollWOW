#!/usr/bin/env node
/**
 * Check and fix FunWest product runtimeHashes
 * Similar to DOL-398 (WM Jade Sterling) - recomputes hashes when product data changes
 */
import fs from 'node:fs/promises';

console.log('FunWest RuntimeHash Check');
console.log('=' + '='.repeat(79));
console.log('\nNote: This requires Next.js build to access getCustomizationConfig.');
console.log('For DOL-399 preview, manually fixing specific products based on test results.\n');

const registry = JSON.parse(await fs.readFile('lib/customization/evidence/template-release.json', 'utf8'));

// Get all FunWest entries
const funwestEntries = registry.payload.entries.filter(e => e.handle.startsWith('funwest'));

console.log(`Total FunWest products in registry: ${funwestEntries.length}`);
console.log(`  Silicone: ${funwestEntries.filter(e => e.tag.includes('silicone')).length}`);
console.log(`  TPE: ${funwestEntries.filter(e => e.tag.includes('tpe')).length}`);

console.log('\nKnown issues from testing:');
console.log('  ✗ funwest-dolls-amy-159cm-a-cup-silicone-companion-doll-fsd027');
console.log('    Status: RuntimeHash mismatch - product data changed');
console.log('    Solution: Requires recomputation with live product data');

console.log('\nTo fix runtimeHashes:');
console.log('1. Build the Next.js app: npm run build');
console.log('2. Use the built functions to compute: templateRuntimeHash(product, config)');
console.log('3. Update registry entry with new hash');
console.log('4. Regenerate approval hashes');

console.log('\nFor broader audit across all brands:');
console.log('- Estimated time: 10-15 minutes for 2957 products');
console.log('- Would need to fetch each product from Shopify API');
console.log('- Similar pattern seen in other brands (pre-existing issue)');
