#!/usr/bin/env node
/**
 * Create BFCM 2026 Automatic Product Discounts
 * Real implementation with discountAutomaticBasicCreate
 * DOL-371
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !ACCESS_TOKEN) {
  console.error('Error: Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN');
  process.exit(1);
}

async function graphql(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

async function queryAllProducts(query) {
  const products = [];
  let cursor = null;
  let hasNextPage = true;
  
  while (hasNextPage) {
    const gql = `
      query ($query: String!, $cursor: String) {
        products(first: 50, query: $query, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            status
            priceRangeV2 {
              minVariantPrice { amount }
            }
          }
        }
      }
    `;
    
    const data = await graphql(gql, { query, cursor });
    const nodes = data.data?.products?.nodes || [];
    products.push(...nodes.filter(p => p.status === 'ACTIVE'));
    
    hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
    cursor = data.data?.products?.pageInfo?.endCursor || null;
  }
  
  return products;
}

async function createDiscount(title, productsByAmount, startsAt, endsAt, dryRun) {
  console.log(`\n${title}`);
  console.log('='.repeat(60));
  
  for (const [amount, products] of Object.entries(productsByAmount)) {
    console.log(`\n  Group: $${amount} off (${products.length} products)`);
    products.slice(0, 3).forEach(p => {
      const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
      const newPrice = price - parseFloat(amount);
      console.log(`    ${p.handle}: $${price} → $${newPrice}`);
    });
    if (products.length > 3) console.log(`    ... and ${products.length - 3} more`);
    
    if (dryRun) {
      console.log(`  [DRY-RUN] Would create discount for ${products.length} products`);
      continue;
    }
    
    const mutation = `
      mutation ($discount: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicCreate(automaticBasicDiscount: $discount) {
          automaticDiscountNode {
            id
            automaticDiscount {
              ... on DiscountAutomaticBasic {
                title
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const discountTitle = `${title} $${amount}`;
    const variables = {
      discount: {
        title: discountTitle,
        startsAt,
        endsAt,
        customerGets: {
          value: {
            discountAmount: {
              amount: parseFloat(amount),
              appliesOnEachItem: true
            }
          },
          items: {
            products: {
              productsToAdd: products.map(p => p.id)
            }
          }
        },
        combinesWith: {
          orderDiscounts: true,
          productDiscounts: false,
          shippingDiscounts: false
        }
      }
    };
    
    console.log(`\n  [EXECUTE] Creating: ${discountTitle}...`);
    const result = await graphql(mutation, variables);
    
    if (result.data?.discountAutomaticBasicCreate?.userErrors?.length > 0) {
      console.error(`  ERROR:`, result.data.discountAutomaticBasicCreate.userErrors);
    } else if (result.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id) {
      console.log(`  ✓ Created: ${result.data.discountAutomaticBasicCreate.automaticDiscountNode.id}`);
    } else {
      console.error(`  ERROR: No discount ID returned`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const startDateArg = args.find(arg => arg.startsWith('--start-date='));
  const startDate = startDateArg ? startDateArg.split('=')[1] : new Date().toISOString();
  
  console.log('BFCM 2026 Automatic Discount Creation');
  console.log('=====================================');
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`Start: ${startDate}`);
  console.log(`Shopify: ${SHOPIFY_DOMAIN}\n`);
  
  // Top Fire: full silicone dolls, $150 off
  console.log('Querying Top Fire products...');
  const topFire = await queryAllProducts('tag:top-fire AND tag:silicone AND product_type:"Full-size adult doll"');
  console.log(`Found ${topFire.length} Top Fire products`);
  
  await createDiscount(
    'BFCM 2026 Top Fire',
    { '150.00': topFire },
    startDate,
    '2026-12-11T04:59:00Z',
    dryRun
  );
  
  // Climax: custom full >= $900, 10% off (floored per product)
  console.log('\nQuerying Climax products...');
  const climax = await queryAllProducts('tag:climax AND tag:custom AND product_type:"Full-size adult doll"');
  const climaxEligible = climax.filter(p => parseFloat(p.priceRangeV2.minVariantPrice.amount) >= 900);
  console.log(`Found ${climaxEligible.length} Climax products >= $900`);
  
  const climaxByDiscount = {};
  for (const p of climaxEligible) {
    const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
    const discounted = Math.floor(price * 0.9);
    const amount = (price - discounted).toFixed(2);
    if (!climaxByDiscount[amount]) climaxByDiscount[amount] = [];
    climaxByDiscount[amount].push(p);
  }
  
  await createDiscount(
    'BFCM 2026 Climax 10%',
    climaxByDiscount,
    startDate,
    '2026-12-11T04:59:00Z',
    dryRun
  );
  
  // 6YE: 5% off (floored per product)
  console.log('\nQuerying 6YE products...');
  const sixYe = await queryAllProducts('tag:6ye');
  console.log(`Found ${sixYe.length} 6YE products`);
  
  const sixYeByDiscount = {};
  for (const p of sixYe) {
    const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
    const discounted = Math.floor(price * 0.95);
    const amount = (price - discounted).toFixed(2);
    if (!sixYeByDiscount[amount]) sixYeByDiscount[amount] = [];
    sixYeByDiscount[amount].push(p);
  }
  
  await createDiscount(
    'BFCM 2026 6YE 5%',
    sixYeByDiscount,
    startDate,
    '2026-12-11T04:59:00Z',
    dryRun
  );
  
  // IDO: in-stock/RTS, $100 off
  console.log('\nQuerying IDO products...');
  const ido = await queryAllProducts('tag:ido AND (tag:in-stock OR tag:ready_to_ship)');
  console.log(`Found ${ido.length} IDO in-stock products`);
  
  await createDiscount(
    'BFCM 2026 IDO In-Stock',
    { '100.00': ido },
    startDate,
    '2026-12-01T00:00:00Z',
    dryRun
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Top Fire: ${topFire.length} products ($150 off)`);
  console.log(`Climax: ${climaxEligible.length} products (10% floored per product)`);
  console.log(`6YE: ${sixYe.length} products (5% floored per product)`);
  console.log(`IDO: ${ido.length} products ($100 off)`);
  
  if (dryRun) {
    console.log('\n✓ Dry-run complete. Use --execute to create in Shopify.');
  } else {
    console.log('\n✓ Execution complete. Check Shopify admin for created discounts.');
  }
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
