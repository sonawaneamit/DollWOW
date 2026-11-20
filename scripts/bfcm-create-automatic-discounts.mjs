#!/usr/bin/env node
/**
 * Create BFCM 2026 Automatic Product Discounts
 * 
 * Queries live Shopify products and creates automatic discounts.
 * Requires SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN.
 * 
 * Usage:
 *   node scripts/bfcm-create-automatic-discounts.mjs --dry-run  # Default
 *   node scripts/bfcm-create-automatic-discounts.mjs --execute  # Create in Shopify
 *   node scripts/bfcm-create-automatic-discounts.mjs --start-date 2026-11-21T00:00:00Z
 * 
 * DOL-371
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !ACCESS_TOKEN) {
  console.error('Error: Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN');
  process.exit(1);
}

async function queryProducts(query, brandName) {
  console.log(`\nQuerying ${brandName} products: ${query}`);
  
  const graphqlQuery = `
    query ($query: String!) {
      products(first: 100, query: $query) {
        nodes {
          id
          title
          handle
          priceRangeV2 {
            minVariantPrice {
              amount
            }
          }
        }
      }
    }
  `;
  
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query: graphqlQuery, variables: { query } })
  });
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data?.products?.nodes || [];
}

async function createDiscount(title, productIds, valueType, value, combinesWith, startsAt, endsAt, dryRun) {
  if (dryRun) {
    console.log(`\n[DRY-RUN] Would create: ${title}`);
    console.log(`  Products: ${productIds.length}`);
    console.log(`  Value: ${valueType === 'PERCENTAGE' ? value + '%' : '$' + value}`);
    console.log(`  Starts: ${startsAt}`);
    console.log(`  Ends: ${endsAt}`);
    return { success: true, dryRun: true };
  }
  
  const mutation = `
    mutation ($discount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $discount) {
        automaticAppDiscount {
          discountId
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    discount: {
      title,
      functionId: "TODO", // Shopify function ID
      startsAt,
      endsAt,
      combinesWith: {
        orderDiscounts: combinesWith.orderDiscounts,
        productDiscounts: combinesWith.productDiscounts,
        shippingDiscounts: combinesWith.shippingDiscounts
      }
    }
  };
  
  console.log(`\n[EXECUTE] Creating: ${title}...`);
  console.error('ERROR: Real Shopify discount creation requires app function setup');
  console.error('Use discountAutomaticBasicCreate for basic discounts or set up Shopify Functions');
  
  return { success: false, error: 'Not implemented - requires Shopify Functions setup' };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const startDateArg = args.find(arg => arg.startsWith('--start-date='));
  const startDate = startDateArg ? startDateArg.split('=')[1] : new Date().toISOString();
  
  console.log('BFCM 2026 Automatic Discount Creation');
  console.log('=====================================');
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`Start Date: ${startDate}`);
  console.log(`Shopify: ${SHOPIFY_DOMAIN}`);
  
  const results = [];
  
  // Top Fire: tag top-fire full silicone dolls, $150 off
  console.log('\n' + '='.repeat(60));
  console.log('Top Fire: $150 off');
  console.log('='.repeat(60));
  const topFireProducts = await queryProducts(
    'tag:top-fire AND tag:full-doll AND tag:silicone AND NOT tag:head-only AND NOT tag:torso',
    'Top Fire'
  );
  console.log(`Found ${topFireProducts.length} Top Fire products`);
  topFireProducts.slice(0, 5).forEach(p => {
    console.log(`  - ${p.handle} ($${p.priceRangeV2.minVariantPrice.amount})`);
  });
  if (topFireProducts.length > 5) console.log(`  ... and ${topFireProducts.length - 5} more`);
  
  // Climax: tag climax custom full dolls >= $900, 10% off
  console.log('\n' + '='.repeat(60));
  console.log('Climax: 10% off ($900+)');
  console.log('='.repeat(60));
  const climaxProducts = await queryProducts(
    'tag:climax AND tag:custom AND tag:full-doll AND NOT tag:torso AND NOT tag:hips-only',
    'Climax'
  );
  const climaxEligible = climaxProducts.filter(p => parseFloat(p.priceRangeV2.minVariantPrice.amount) >= 900);
  console.log(`Found ${climaxEligible.length} Climax products >= $900`);
  climaxEligible.slice(0, 5).forEach(p => {
    const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
    const discountedPrice = Math.floor(price * 0.9);
    const fixedAmount = price - discountedPrice;
    console.log(`  - ${p.handle} ($${price} → $${discountedPrice}, -$${fixedAmount.toFixed(2)})`);
  });
  if (climaxEligible.length > 5) console.log(`  ... and ${climaxEligible.length - 5} more`);
  
  // 6YE: tag 6ye dolls, 5% off (floored)
  console.log('\n' + '='.repeat(60));
  console.log('6YE: 5% off (floored to whole dollars)');
  console.log('='.repeat(60));
  const sixYeProducts = await queryProducts(
    'vendor:DollWow AND title:*6YE*',
    '6YE'
  );
  console.log(`Found ${sixYeProducts.length} 6YE products`);
  sixYeProducts.slice(0, 5).forEach(p => {
    const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
    const discountedPrice = Math.floor(price * 0.95);
    const fixedAmount = price - discountedPrice;
    console.log(`  - ${p.handle} ($${price} → $${discountedPrice}, -$${fixedAmount.toFixed(2)})`);
  });
  if (sixYeProducts.length > 5) console.log(`  ... and ${sixYeProducts.length - 5} more`);
  
  // IDO: tag ido AND (in-stock OR ready_to_ship), $100 off
  console.log('\n' + '='.repeat(60));
  console.log('IDO: $100 off in-stock/RTS');
  console.log('='.repeat(60));
  const idoProducts = await queryProducts(
    'vendor:IDO AND (tag:in-stock OR tag:ready_to_ship)',
    'IDO'
  );
  console.log(`Found ${idoProducts.length} IDO in-stock products`);
  idoProducts.slice(0, 5).forEach(p => {
    console.log(`  - ${p.handle} ($${p.priceRangeV2.minVariantPrice.amount})`);
  });
  if (idoProducts.length > 5) console.log(`  ... and ${idoProducts.length - 5} more`);
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Top Fire: ${topFireProducts.length} products`);
  console.log(`Climax: ${climaxEligible.length} products >= $900`);
  console.log(`6YE: ${sixYeProducts.length} products`);
  console.log(`IDO: ${idoProducts.length} in-stock products`);
  
  if (!dryRun) {
    console.log('\nNOTE: Automatic discount creation requires Shopify Functions or Basic Discounts setup');
    console.log('Product lists verified above. Ready for manual creation in Shopify admin.');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
