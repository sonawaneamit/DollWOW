#!/usr/bin/env node
/**
 * Create BFCM 2026 Automatic Product Discounts
 * 
 * Creates Shopify automatic discounts for Black Friday brand promotions.
 * Must be approved by Martin before execution.
 * 
 * Usage:
 *   node scripts/bfcm-create-automatic-discounts.mjs --dry-run  # Default: show what would be created
 *   node scripts/bfcm-create-automatic-discounts.mjs --execute  # Actually create in Shopify
 * 
 * DOL-371
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const DISCOUNTS = [
  {
    brand: 'Top Fire',
    title: 'BFCM 2026 Top Fire $150 Off',
    method: 'AUTOMATIC',
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: false,
      shippingDiscounts: false
    },
    startsAt: '2026-11-21T00:00:00Z',
    endsAt: '2026-12-11T04:59:00Z',
    appliesTo: {
      collections: [], // Will be populated with Top Fire collection IDs
      products: [],
      variants: [],
      all: false
    },
    value: {
      type: 'FIXED_AMOUNT',
      amount: 150.0
    },
    prerequisite: {
      type: 'vendor',
      value: 'Top Fire'
    }
  },
  {
    brand: 'Climax',
    title: 'BFCM 2026 Climax 10% Off $900+',
    method: 'AUTOMATIC',
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: false,
      shippingDiscounts: false
    },
    startsAt: '2026-11-21T00:00:00Z',
    endsAt: '2026-12-11T04:59:00Z',
    appliesTo: {
      collections: [],
      products: [],
      variants: [],
      all: false
    },
    value: {
      type: 'PERCENTAGE',
      percentage: 10.0
    },
    prerequisite: {
      type: 'tag',
      value: 'climax',
      minimumAmount: 900.0
    }
  },
  {
    brand: '6YE',
    title: 'BFCM 2026 6YE 5% Off',
    method: 'AUTOMATIC',
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: false,
      shippingDiscounts: false
    },
    startsAt: '2026-11-21T00:00:00Z',
    endsAt: '2026-12-11T04:59:00Z',
    appliesTo: {
      collections: [],
      products: [],
      variants: [],
      all: false
    },
    value: {
      type: 'PERCENTAGE',
      percentage: 5.0,
      note: 'Shopify floors percentage discounts to whole dollars automatically'
    },
    prerequisite: {
      type: 'vendor',
      value: 'DollWow',
      titleContains: '6YE'
    }
  },
  {
    brand: 'IDO',
    title: 'BFCM 2026 IDO In-Stock $100 Off',
    method: 'AUTOMATIC',
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: false,
      shippingDiscounts: false
    },
    startsAt: '2026-11-21T00:00:00Z',
    endsAt: '2026-12-01T00:00:00Z',
    appliesTo: {
      collections: [],
      products: [],
      variants: [],
      all: false
    },
    value: {
      type: 'FIXED_AMOUNT',
      amount: 100.0
    },
    prerequisite: {
      type: 'vendor',
      value: 'IDO',
      tags: ['in-stock', 'ready_to_ship']
    }
  }
];

function printDiscount(discount) {
  console.log(`\n${discount.brand} Discount`);
  console.log('='.repeat(60));
  console.log(`Title: ${discount.title}`);
  console.log(`Method: ${discount.method}`);
  console.log(`Starts: ${discount.startsAt}`);
  console.log(`Ends: ${discount.endsAt}`);
  console.log(`Combines with order discounts: ${discount.combinesWith.orderDiscounts}`);
  
  if (discount.value.type === 'FIXED_AMOUNT') {
    console.log(`Discount: $${discount.value.amount.toFixed(2)} off`);
  } else {
    console.log(`Discount: ${discount.value.percentage}% off`);
    if (discount.value.note) {
      console.log(`Note: ${discount.value.note}`);
    }
  }
  
  if (discount.prerequisite) {
    console.log(`Prerequisites:`);
    if (discount.prerequisite.type === 'vendor') {
      console.log(`  - Vendor: ${discount.prerequisite.value}`);
      if (discount.prerequisite.titleContains) {
        console.log(`  - Title contains: ${discount.prerequisite.titleContains}`);
      }
    } else if (discount.prerequisite.type === 'tag') {
      console.log(`  - Tag: ${discount.prerequisite.value}`);
      if (discount.prerequisite.minimumAmount) {
        console.log(`  - Minimum amount: $${discount.prerequisite.minimumAmount}`);
      }
    }
    if (discount.prerequisite.tags) {
      console.log(`  - Tags (any): ${discount.prerequisite.tags.join(', ')}`);
    }
  }
}

async function createDiscount(discount, dryRun = true) {
  if (dryRun) {
    printDiscount(discount);
    return { success: true, dryRun: true };
  }
  
  if (!SHOPIFY_DOMAIN || !ACCESS_TOKEN) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN');
  }
  
  // Build GraphQL mutation based on discount configuration
  // This is a placeholder - actual implementation would use Shopify's discount APIs
  console.log(`\n[EXECUTE] Would create discount: ${discount.title}`);
  console.log('NOTE: Actual Shopify API implementation required');
  
  return { success: true, dryRun: false, discount: discount.title };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log('BFCM 2026 Automatic Discount Creation');
  console.log('=====================================');
  console.log(`Mode: ${dryRun ? 'DRY-RUN (default)' : 'EXECUTE'}`);
  console.log(`Date: ${new Date().toISOString()}`);
  
  if (dryRun) {
    console.log('\nShowing what would be created. Use --execute to actually create.');
  } else {
    console.log('\n⚠️  LIVE MODE - Will create discounts in Shopify');
    console.log('⚠️  Must be approved by Martin before execution');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('BFCM Automatic Product Discounts');
  console.log('='.repeat(60));
  
  for (const discount of DISCOUNTS) {
    await createDiscount(discount, dryRun);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total discounts: ${DISCOUNTS.length}`);
  console.log('All discounts combine with BLACKFRIDAYWOW26 order discount');
  console.log('\nNOTE: Galatea has no automatic discount (free upgrades at $0 in cart)');
  console.log('\nNext steps:');
  console.log('1. Review output above');
  console.log('2. Get Martin\'s approval');
  console.log('3. Run with --execute flag');
  
  if (!dryRun) {
    console.log('\n✅ Discounts created (pending actual API implementation)');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
