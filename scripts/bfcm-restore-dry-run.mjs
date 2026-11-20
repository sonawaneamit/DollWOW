#!/usr/bin/env node
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/real-sample-products.json', 'utf8'));

console.log('='.repeat(80));
console.log('BFCM RESTORE DRY-RUN - 15 REAL SKUs');
console.log('='.repeat(80));
console.log('');
console.log(`Run time: ${new Date().toISOString()}`);
console.log(`Data exported: ${data.exportedAt}`);
console.log('');

const results = [];

for (const product of data.products || []) {
  const variant = product.variants?.[0];
  if (!variant) continue;
  
  const brand = getBrand(product);
  if (!brand) continue;
  
  const current = parseFloat(variant.price);
  const promo = parseFloat(calculatePromo(product, brand, variant.price));
  const revertAt = brand === 'IDO' ? '2026-12-01T00:00:00Z' : '2026-12-11T04:59:00Z';
  
  results.push({
    brand,
    title: product.title,
    variantId: variant.variantId,
    currentPrice: current,
    promoPrice: promo,
    restoredPrice: current,
    discount: current - promo,
    revertAt
  });
}

console.log('| Brand      | Title (truncated)                     | Variant ID      | Current    | Promo      | Restored   | Revert At            |');
console.log('|------------|---------------------------------------|-----------------|------------|------------|------------|----------------------|');

for (const r of results) {
  const title = r.title.substring(0, 37).padEnd(37);
  console.log(`| ${r.brand.padEnd(10)} | ${title} | ${String(r.variantId).padEnd(15)} | $${r.currentPrice.toFixed(2).padStart(9)} | $${r.promoPrice.toFixed(2).padStart(9)} | $${r.restoredPrice.toFixed(2).padStart(9)} | ${r.revertAt.padEnd(20)} |`);
}

console.log('');
console.log(`Total SKUs: ${results.length}`);
console.log('');
console.log('DRY-RUN: No actual Shopify writes performed.');
console.log('All prices would be restored from promo → current (original).');

function getBrand(product) {
  const { vendor, title, handle, tags = [] } = product;
  const identity = `${vendor} ${title} ${handle} ${tags.join(' ')}`;
  if (/\btop[ -]?fire\b/i.test(identity)) return 'Top Fire';
  if (/\bgalatea\b/i.test(identity)) return 'Galatea';
  if (/\bclimax\b/i.test(identity) || handle.startsWith('climax-')) return 'Climax';
  if (/\b6ye\b/i.test(identity)) return '6YE';
  if (/\bido(?:doll)?\b/i.test(identity)) return 'IDO';
  return null;
}

function calculatePromo(product, brand, originalPrice) {
  const price = parseFloat(originalPrice);
  switch (brand) {
    case 'Top Fire': return (price - 150).toFixed(2);
    case 'Galatea': return originalPrice;
    case 'Climax': return price >= 900 ? Math.floor(price * 0.9).toFixed(2) : originalPrice;
    case '6YE': return Math.floor(price * 0.95).toFixed(2);
    case 'IDO': {
      const isRTS = /\b(in.stock|ready.to.ship)\b/i.test(product.title);
      return isRTS ? '2499.00' : originalPrice;
    }
    default: return originalPrice;
  }
}
