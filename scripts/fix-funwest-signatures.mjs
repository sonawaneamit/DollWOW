#!/usr/bin/env node
/**
 * Fix FunWest preset recipe signatures
 * DOL-399: Compute actual template config signatures
 */

import { readFileSync, writeFileSync } from 'fs';
import { shopifyProduct } from '../lib/shopify/storefront.js';
import { getCustomizationConfig } from '../lib/customization/configs.js';
import { templateConfigSignature } from '../lib/customization/template-config-signature.js';

const templateReleasePath = './lib/customization/evidence/template-release.json';

async function main() {
  console.log('Loading FunWest products to compute signatures...');
  
  // Get one silicone and one TPE product to compute their config signatures
  const siliconeProduct = await shopifyProduct('funwest-dolls-amy-159cm-a-cup-silicone-companion-doll-fsd027');
  const tpeProduct = await shopifyProduct('funwest-dolls-adele-155cm-f-cup-tpe-companion-doll-123xb');
  
  const siliconeConfig = getCustomizationConfig(siliconeProduct);
  const tpeConfig = getCustomizationConfig(tpeProduct);
  
  const siliconeSignature = templateConfigSignature(siliconeConfig);
  const tpeSignature = templateConfigSignature(tpeConfig);
  
  console.log('Silicone config ID:', siliconeConfig.id);
  console.log('Silicone signature:', siliconeSignature);
  console.log('TPE config ID:', tpeConfig.id);
  console.log('TPE signature:', tpeSignature);
  
  // Load template release
  const release = JSON.parse(readFileSync(templateReleasePath, 'utf8'));
  
  // Find and update FunWest binding signatures
  let updated = 0;
  for (const [key, binding] of Object.entries(release.payload.bindings)) {
    if (binding.tag === 'options:funwest-silicone-full-body-v1' && binding.signature === 'sha256:PLACEHOLDER_WILL_UPDATE') {
      binding.signature = siliconeSignature;
      console.log(`\n✓ Updated silicone binding ${key.substring(0, 16)}...`);
      updated++;
    } else if (binding.tag === 'options:funwest-tpe-full-body-v1' && binding.signature === 'sha256:PLACEHOLDER_WILL_UPDATE') {
      binding.signature = tpeSignature;
      console.log(`✓ Updated TPE binding ${key.substring(0, 16)}...`);
      updated++;
    }
  }
  
  if (updated > 0) {
    writeFileSync(templateReleasePath, JSON.stringify(release, null, 2) + '\n');
    console.log(`\n✓ Updated ${updated} binding signatures in template-release.json`);
  } else {
    console.log('\nNo placeholder signatures found - already fixed?');
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
