#!/usr/bin/env node
/**
 * Fetch REAL live Shopify products for BFCM promo dry-run
 * Queries actual production store for Top Fire, Galatea, Climax, 6YE, IDO products
 */

const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'tpaekn-rc.myshopify.com';

if (!SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  console.error('Error: SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variable is required');
  console.error('Set it in .env.local or pass it directly:');
  console.error('  SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx node scripts/fetch-real-bfcm-products.mjs');
  process.exit(1);
}

const STOREFRONT_API_VERSION = '2024-10';

async function queryStorefront(query, variables = {}) {
  const response = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  }
  
  return data.data;
}

const PRODUCT_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          handle
          title
          vendor
          productType
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchBrandProducts(brandQuery, brandName, limit = 10) {
  console.log(`\nFetching ${brandName} products...`);
  
  try {
    const data = await queryStorefront(PRODUCT_QUERY, {
      first: limit,
      query: brandQuery,
    });
    
    const products = data.products.edges.map(edge => edge.node);
    console.log(`Found ${products.length} ${brandName} products`);
    
    return products;
  } catch (error) {
    console.error(`Error fetching ${brandName}:`, error.message);
    return [];
  }
}

// Promo eligibility logic from bfcmBrandPreview.ts
function isEligible(product, brand) {
  const identity = `${product.vendor} ${product.title} ${product.tags.join(' ')}`;
  const productType = product.productType || '';
  const tags = product.tags || [];
  
  const torso = /torso|hips-only/i.test(`${productType}`);
  const full = !torso && !/head.only|accessor|charge|system/i.test(productType) && /doll/i.test(productType);
  const custom = tags.includes('custom') || tags.includes('customizable');
  
  switch (brand) {
    case 'Top Fire':
      // Full silicone dolls only
      const isSilicone = tags.includes('silicone') || /silicone/i.test(identity);
      return full && isSilicone;
      
    case 'Galatea':
      // Custom order dolls only
      return custom;
      
    case 'Climax':
      // Custom dolls (full or torso)
      return custom && (full || torso);
      
    case '6YE':
      // All products (will filter by height for extra head)
      return true;
      
    case 'IDO':
      // Full dolls (custom or RTS)
      const rts = tags.includes('ready_to_ship') || tags.includes('ready-to-ship');
      return full && (custom || rts);
      
    default:
      return false;
  }
}

function calculatePromoPrice(product, brand) {
  const originalPrice = parseFloat(product.priceRange.minVariantPrice.amount);
  
  switch (brand) {
    case 'Top Fire':
      return originalPrice - 150;
      
    case 'Galatea':
      // Price stays same, free upgrades
      return originalPrice;
      
    case 'Climax':
      // 10% off if >= $900
      return originalPrice >= 900 ? Math.floor(originalPrice * 0.9) : originalPrice;
      
    case '6YE':
      // 5% off
      return Math.floor(originalPrice * 0.95);
      
    case 'IDO':
      // Fixed pricing
      const custom = product.tags.includes('custom') || product.tags.includes('customizable');
      return custom ? 2599 : 2499;
      
    default:
      return originalPrice;
  }
}

function getRevertTimestamp(brand) {
  switch (brand) {
    case 'IDO':
      return '2026-12-01T00:00:00Z'; // End of Nov 30
    default:
      return '2026-12-11T04:59:00Z'; // Dec 10 11:59 PM Eastern
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('BFCM REAL PRODUCT ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Store: ${SHOPIFY_STORE_DOMAIN}`);
  console.log('');
  
  const brands = [
    { name: 'Top Fire', query: 'vendor:"Top Fire" OR tag:topfire OR tag:top-fire' },
    { name: 'Galatea', query: 'vendor:Galatea OR tag:galatea' },
    { name: 'Climax', query: 'vendor:Climax OR tag:climax' },
    { name: '6YE', query: 'vendor:"6YE" OR tag:6ye' },
    { name: 'IDO', query: 'vendor:IDO OR vendor:IdollDolls OR tag:ido OR tag:idodoll' },
  ];
  
  const allResults = [];
  
  for (const { name, query } of brands) {
    const products = await fetchBrandProducts(query, name, 50);
    const eligible = products.filter(p => isEligible(p, name));
    
    // Pick first 3 eligible
    const selected = eligible.slice(0, 3);
    
    for (const product of selected) {
      const originalPrice = parseFloat(product.priceRange.minVariantPrice.amount);
      const promoPrice = calculatePromoPrice(product, name);
      const variant = product.variants.edges[0]?.node;
      
      allResults.push({
        brand: name,
        title: product.title,
        handle: product.handle,
        productId: product.id,
        variantId: variant?.id || 'N/A',
        originalPrice,
        promoPrice,
        discount: originalPrice - promoPrice,
        revertAt: getRevertTimestamp(name),
      });
    }
    
    console.log(`${name}: Selected ${selected.length} of ${eligible.length} eligible products`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('SELECTED PRODUCTS FOR BFCM PROMOTION');
  console.log('='.repeat(80));
  console.log('');
  
  // Group by brand
  const byBrand = {};
  for (const result of allResults) {
    if (!byBrand[result.brand]) byBrand[result.brand] = [];
    byBrand[result.brand].push(result);
  }
  
  for (const [brand, products] of Object.entries(byBrand)) {
    console.log(`\n## ${brand}`);
    console.log(`Revert at: ${products[0].revertAt}`);
    console.log('');
    
    for (const product of products) {
      console.log(`### ${product.title}`);
      console.log(`Handle: ${product.handle}`);
      console.log(`Product ID: ${product.productId}`);
      console.log(`Variant ID: ${product.variantId}`);
      console.log(`Original Price: $${product.originalPrice.toFixed(2)}`);
      console.log(`Promo Price: $${product.promoPrice.toFixed(2)}`);
      console.log(`Discount: $${product.discount.toFixed(2)}`);
      console.log('');
    }
  }
  
  // Write to file
  const fs = await import('node:fs');
  const outputPath = 'data/bfcm-real-products.json';
  fs.writeFileSync(outputPath, JSON.stringify({ products: allResults, fetchedAt: new Date().toISOString() }, null, 2));
  console.log(`\nResults written to: ${outputPath}`);
  
  // Dry-run table
  console.log('');
  console.log('='.repeat(80));
  console.log('DRY-RUN TABLE');
  console.log('='.repeat(80));
  console.log('');
  console.log('| Brand      | Product Handle                          | Product ID                        | Variant ID                         | Original   | Promo      | Restore To | Revert At            |');
  console.log('|------------|----------------------------------------|-----------------------------------|-----------------------------------|------------|------------|------------|----------------------|');
  
  for (const p of allResults) {
    const handle = p.handle.substring(0, 38).padEnd(38);
    const productId = p.productId.split('/').pop().padEnd(17);
    const variantId = (p.variantId.split('/').pop() || 'N/A').padEnd(17);
    const original = `$${p.originalPrice.toFixed(2)}`.padEnd(10);
    const promo = `$${p.promoPrice.toFixed(2)}`.padEnd(10);
    const restore = `$${p.originalPrice.toFixed(2)}`.padEnd(10);
    const revert = p.revertAt.padEnd(20);
    
    console.log(`| ${p.brand.padEnd(10)} | ${handle} | ${productId} | ${variantId} | ${original} | ${promo} | ${restore} | ${revert} |`);
  }
  
  console.log('');
  console.log('Total products: ' + allResults.length);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
