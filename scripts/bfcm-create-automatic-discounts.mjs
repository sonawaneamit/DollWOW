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

async function createDiscount(title, productsByAmount, startsAt, endsAt, dryRun, allDiscounts) {
  console.log(`\n${title}`);
  console.log('='.repeat(60));
  
  for (const [amount, products] of Object.entries(productsByAmount)) {
    console.log(`\n  Group: $${amount} off (${products.length} products)`);
    products.forEach(p => {
      const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
      const newPrice = price - parseFloat(amount);
      console.log(`    ${p.handle}: $${price} → $${newPrice}`);
    });
    
    if (dryRun) {
      console.log(`  [DRY-RUN] Would create discount for ${products.length} products`);
    } else {
      // Build all discount specs first (done in main), now execute
      const spec = allDiscounts.find(d => d.title === `${title} $${amount}`);
      if (!spec) {
        console.error(`  ERROR: Discount spec not found for ${title} $${amount}`);
        continue;
      }
      
      console.log(`\n  [EXECUTE] Creating: ${spec.title}...`);
      const result = await graphql(spec.mutation, spec.variables);
      
      if (result.data?.discountAutomaticBasicCreate?.userErrors?.length > 0) {
        console.error(`  ERROR:`, result.data.discountAutomaticBasicCreate.userErrors);
        throw new Error(`Failed to create discount: ${spec.title}`);
      } else if (result.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id) {
        console.log(`  ✓ Created: ${result.data.discountAutomaticBasicCreate.automaticDiscountNode.id}`);
      } else {
        console.error(`  ERROR: No discount ID returned`);
        throw new Error(`Failed to create discount: ${spec.title}`);
      }
    }
  }
}

async function countActiveAutomaticDiscounts() {
  const query = `
    query {
      automaticDiscountNodes(first: 100) {
        nodes {
          id
          automaticDiscount {
            ... on DiscountAutomaticBasic {
              status
            }
            ... on DiscountAutomaticBxgy {
              status
            }
            ... on DiscountAutomaticFreeShipping {
              status
            }
            ... on DiscountAutomaticApp {
              status
            }
          }
        }
      }
    }
  `;
  const data = await graphql(query);
  const active = data.data?.automaticDiscountNodes?.nodes.filter(n => {
    const discount = n.automaticDiscount;
    return discount?.status === 'ACTIVE';
  }) || [];
  return active.length;
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
  
  // Check current automatic discount count (Shopify limit: 25 total)
  const currentActive = await countActiveAutomaticDiscounts();
  console.log(`Current active automatic discounts: ${currentActive}/25\n`);
  
  // Top Fire: productType filter excludes heads and torsos, $150 off
  console.log('Querying Top Fire products...');
  const topFireAll = await queryAllProducts('tag:top-fire');
  const topFire = topFireAll.filter(p => {
    const type = p.productType || '';
    return type === 'Custom Silicone doll' || type === 'Silicone doll';
  });
  console.log(`Found ${topFire.length} Top Fire products (${topFireAll.length} total, filtered by productType)`);
  
  await createDiscount(
    'BFCM 2026 Top Fire',
    { '150.00': topFire },
    startDate,
    '2026-12-11T04:59:00Z',
    dryRun
  );
  
  // Climax: custom full >= $900, excluding torsos/hips, 10% off (floored per product)
  console.log('\nQuerying Climax products...');
  const climaxAll = await queryAllProducts('tag:climax');
  const climax = climaxAll.filter(p => {
    const title = p.title.toLowerCase();
    const handle = p.handle.toLowerCase();
    const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
    const isTorsoOrHip = title.includes(' torso') || title.includes(' hip') || 
                         handle.includes('-torso') || handle.includes('-hip') ||
                         handle.startsWith('torso-') || handle.startsWith('hip-');
    return !isTorsoOrHip && price >= 900;
  });
  console.log(`Found ${climax.length} Climax custom full dolls >= $900 (${climaxAll.length} total, filtered torsos/hips/under-$900)`);
  
  const climaxByDiscount = {};
  for (const p of climax) {
    const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
    const discounted = Math.floor(price * 0.9);
    const amount = (price - discounted).toFixed(2);
    if (!climaxByDiscount[amount]) climaxByDiscount[amount] = [];
    climaxByDiscount[amount].push(p);
  }
  
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
  console.log(`Climax: ${climax.length} products (10% floored, ${Object.keys(climaxByDiscount).length} discount groups)`);
  console.log(`6YE: ${sixYe.length} products (5% floored, ${Object.keys(sixYeByDiscount).length} discount groups)`);
  console.log(`IDO: ${ido.length} products ($100 off)`);
  
  const totalDiscounts = 1 + Object.keys(climaxByDiscount).length + Object.keys(sixYeByDiscount).length + 1;
  console.log(`\nTotal automatic discounts to create: ${totalDiscounts}`);
  console.log(`After creation: ${currentActive + totalDiscounts}/25 automatic discounts`);
  
  if (currentActive + totalDiscounts > 25) {
    console.error(`\n❌ ERROR: ${currentActive} existing + ${totalDiscounts} new = ${currentActive + totalDiscounts} total`);
    console.error(`   Shopify allows maximum 25 active automatic discounts of all types.`);
    console.error(`   Pause or delete ${currentActive + totalDiscounts - 25} existing discount(s) before running --execute.`);
    if (!dryRun) {
      process.exit(1);
    }
  }
  
  // Build all discount specs before executing (so a crash can't leave partial set)
  const allDiscounts = [];
  const buildSpec = (title, amount, products, startsAt, endsAt) => {
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
    allDiscounts.push({ title: discountTitle, mutation, variables });
  };
  
  if (!dryRun) {
    // Build all specs first
    buildSpec('BFCM 2026 Top Fire', '150.00', topFire, startDate, '2026-12-11T04:59:00Z');
    for (const [amount, products] of Object.entries(climaxByDiscount)) {
      buildSpec('BFCM 2026 Climax 10%', amount, products, startDate, '2026-12-11T04:59:00Z');
    }
    for (const [amount, products] of Object.entries(sixYeByDiscount)) {
      buildSpec('BFCM 2026 6YE 5%', amount, products, startDate, '2026-12-11T04:59:00Z');
    }
    buildSpec('BFCM 2026 IDO In-Stock', '100.00', ido, startDate, '2026-12-01T00:00:00Z');
  }
  
  // Now execute discounts
  await createDiscount(
    'BFCM 2026 Top Fire',
    { '150.00': topFire },
    startDate,
    '2026-12-11T04:59:00Z',
    dryRun,
    allDiscounts
  );
  
  await createDiscount(
    'BFCM 2026 Climax 10%',
    climaxByDiscount,
    startDate,
    '2026-12-11T04:59:00Z',
    dryRun,
    allDiscounts
  );
  
  await createDiscount(
    'BFCM 2026 6YE 5%',
    sixYeByDiscount,
    startDate,
    '2026-12-11T04:59:00Z',
    dryRun,
    allDiscounts
  );
  
  await createDiscount(
    'BFCM 2026 IDO In-Stock',
    { '100.00': ido },
    startDate,
    '2026-12-01T00:00:00Z',
    dryRun,
    allDiscounts
  );
  
  if (dryRun) {
    console.log('\n✓ Dry-run complete. Review counts above before running --execute.');
  } else {
    console.log('\n✓ Execution complete. Check Shopify admin for created discounts.');
  }
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
