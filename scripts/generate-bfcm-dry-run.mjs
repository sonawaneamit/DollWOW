#!/usr/bin/env node
/**
 * Generate BFCM dry-run table from real Shopify product data
 * Uses confirmed promo terms to calculate pricing
 */
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('data/real-sample-products.json', 'utf8'));
const products = data.products;

console.log('='.repeat(100));
console.log('BFCM DRY-RUN TABLE - REAL SHOPIFY PRODUCTS');
console.log('='.repeat(100));
console.log('');
console.log(`Data exported: ${data.exportedAt}`);
console.log(`Products: ${products.length}`);
console.log('');

// Promo logic from bfcmBrandPreview.ts
function getBrand(product) {
  const { vendor, title, handle, tags } = product;
  const identity = `${vendor} ${title} ${handle} ${tags.join(' ')}`;
  
  if (/\btop[ -]?fire\b/i.test(identity)) return 'Top Fire';
  if (/\bgalatea\b/i.test(identity)) return 'Galatea';
  if (/\bclimax\b/i.test(identity) || handle.startsWith('climax-')) return 'Climax';
  if (/\b6ye\b/i.test(identity)) return '6YE';
  if (/\bido(?:doll)?\b/i.test(identity)) return 'IDO';
  
  return 'Unknown';
}

function calculatePromo(product, brand) {
  const originalPrice = parseFloat(product.variants[0].price);
  let promoPrice = originalPrice;
  let freeOptions = [];
  let revertAt = '2026-12-11T04:59:00Z';
  
  switch (brand) {
    case 'Top Fire':
      // $150 off + free second head
      promoPrice = originalPrice - 150;
      freeOptions = ['second-head'];
      break;
      
    case 'Galatea':
      // Price unchanged, 3 free upgrades
      promoPrice = originalPrice;
      freeOptions = ['body-heating', 'vaginal-suction', 'oral-heating'];
      break;
      
    case 'Climax':
      // 10% off if >= $900, free extras
      promoPrice = originalPrice >= 900 ? Math.floor(originalPrice * 0.9) : originalPrice;
      freeOptions = ['second-head', 'gel-butt'];
      // Check if full doll (not torso)
      const isTorso = /torso|hips-only/i.test(product.productType || '');
      if (!isTorso) {
        freeOptions.push('hands-feet');
      }
      break;
      
    case '6YE':
      // 5% off all products
      promoPrice = Math.floor(originalPrice * 0.95);
      // Free extra head on dolls >= 135cm
      const heightMatch = product.title.match(/(\d+)cm/);
      const heightCm = heightMatch ? parseInt(heightMatch[1]) : 0;
      if (heightCm >= 135) {
        freeOptions = ['second-head'];
      }
      break;
      
    case 'IDO':
      // Fixed pricing based on custom vs RTS
      const isRTS = /ready.to.ship|in.stock/i.test(product.title) || product.tags.includes('ready_to_ship');
      promoPrice = isRTS ? 2499 : 2599;
      if (!isRTS) {
        freeOptions = ['random-wig', 'moving-pad'];
      }
      revertAt = '2026-12-01T00:00:00Z'; // End of Nov 30
      break;
  }
  
  return { originalPrice, promoPrice, freeOptions, revertAt };
}

const results = [];

for (const product of products) {
  const brand = getBrand(product);
  const { originalPrice, promoPrice, freeOptions, revertAt } = calculatePromo(product, brand);
  const variant = product.variants[0];
  
  results.push({
    brand,
    handle: product.handle,
    productId: String(product.productId),
    variantId: String(variant.variantId),
    originalPrice,
    promoPrice,
    discount: originalPrice - promoPrice,
    freeOptions,
    revertAt,
  });
}

// Group by brand
const byBrand = {};
for (const result of results) {
  if (!byBrand[result.brand]) byBrand[result.brand] = [];
  byBrand[result.brand].push(result);
}

// Print by brand
for (const [brand, products] of Object.entries(byBrand)) {
  console.log(`\n## ${brand}`);
  console.log(`Revert at: ${products[0].revertAt}`);
  console.log('');
  
  for (const p of products) {
    console.log(`**${p.handle}**`);
    console.log(`- Product ID: ${p.productId}`);
    console.log(`- Variant ID: ${p.variantId}`);
    console.log(`- Current Price: $${p.originalPrice.toFixed(2)}`);
    console.log(`- Promo Price: $${p.promoPrice.toFixed(2)}`);
    console.log(`- Discount: $${p.discount.toFixed(2)}`);
    console.log(`- Free Options: ${p.freeOptions.join(', ') || 'none'}`);
    console.log('');
  }
}

// Table format
console.log('');
console.log('='.repeat(100));
console.log('DRY-RUN TABLE');
console.log('='.repeat(100));
console.log('');

const maxHandleLen = Math.max(...results.map(r => r.handle.length));

console.log('| Brand      | Handle' + ' '.repeat(maxHandleLen - 6) + ' | Product ID      | Variant ID      | Current    | Promo      | Free Options                                  | Revert At            |');
console.log('|------------|' + '-'.repeat(maxHandleLen) + '|-----------------|-----------------|------------|------------|-----------------------------------------------|----------------------|');

for (const r of results) {
  const brand = r.brand.padEnd(10);
  const handle = r.handle.padEnd(maxHandleLen);
  const productId = r.productId.padEnd(15);
  const variantId = r.variantId.padEnd(15);
  const current = `$${r.originalPrice.toFixed(2)}`.padEnd(10);
  const promo = `$${r.promoPrice.toFixed(2)}`.padEnd(10);
  const freeOpts = r.freeOptions.join(', ').padEnd(45);
  const revert = r.revertAt.padEnd(20);
  
  console.log(`| ${brand} | ${handle} | ${productId} | ${variantId} | ${current} | ${promo} | ${freeOpts} | ${revert} |`);
}

console.log('');
console.log('='.repeat(100));
console.log('');
console.log('Total products: ' + results.length);
console.log('Top Fire: ' + byBrand['Top Fire'].length);
console.log('Galatea: ' + byBrand['Galatea'].length);
console.log('Climax: ' + byBrand['Climax'].length);
console.log('6YE: ' + byBrand['6YE'].length);
console.log('IDO: ' + byBrand['IDO'].length);
console.log('');
console.log('BLACKFRIDAYWOW26 code: $299 off orders >= $900 (stacks on top of brand promos)');
