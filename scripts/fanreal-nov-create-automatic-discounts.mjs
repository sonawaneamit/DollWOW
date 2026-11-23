#!/usr/bin/env node
/**
 * Create Fanreal November 2026 automatic product discounts.
 * Dry-run by default. Pass --execute only after Martin approves the preview.
 *
 * Cash amount is 10% off, floored at Fanreal's official MAP from the 4 Nov 2026
 * price list. Discounts combine with order codes (BLACKFRIDAYWOW26).
 * Ends 2026-12-01T08:00:00.000Z (end of 30 Nov, America/Los_Angeles).
 *
 * Keep MAP rules in sync with lib/promotions/fanrealNovember2026.ts.
 */

const SHOPIFY_DOMAIN = (process.env.SHOPIFY_STORE_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
let accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const ENDS_AT = '2026-12-01T08:00:00.000Z';

function parseBody(product) {
  const title = product.title || '';
  const handle = product.handle || '';
  const tags = (product.tags || []).join(' ');
  const text = `${title} ${handle} ${product.productType || ''} ${tags}`;
  const isTorso = /\btorso\b/i.test(text) || /T-?\d{2,3}/i.test(`${title} ${handle}`);
  const isUni = /\buniseries\b|\buni-series\b/i.test(text);
  const isRs = /\breal[ -]?skin\b/i.test(text);
  const isMale = /\bmale\b/i.test(text) && !/\bfemale\b/i.test(text);
  let heightCm = null;
  let cup = null;
  const titleSize = title.match(/(\d{2,3})\s*cm\s+([A-M])-?cup/i);
  if (titleSize) {
    heightCm = Number(titleSize[1]);
    cup = titleSize[2].toUpperCase();
  } else {
    const torso = title.match(/T-?(\d{2,3})\s*([A-M])\b/i) || `${title} ${handle}`.match(/T-?(\d{2,3})([A-M])\b/i);
    if (torso) {
      heightCm = Number(torso[1]);
      cup = torso[2].toUpperCase();
    }
  }
  return { heightCm, cup, isTorso, isUni, isRs, isMale, text };
}

function mapPrice(product) {
  const { heightCm, cup, isTorso, isUni, isRs, isMale } = parseBody(product);
  if (isTorso) {
    if (heightCm === 95 || heightCm === 109 || heightCm === 110) return 1680;
    if (heightCm === 111 || heightCm === 108) return 1580;
    return null;
  }
  if (isUni) {
    if (heightCm === 155 && cup === 'F') return 3080;
    if (heightCm === 170 || heightCm === 166) return 3180;
    return null;
  }
  if (isMale) return 2880;
  if (isRs) {
    if ((heightCm === 155 && cup === 'F') || (heightCm === 158 && cup === 'B')) return 2780;
    if (heightCm != null) return 2880;
    return null;
  }
  if (heightCm != null && heightCm >= 152 && heightCm <= 159) return 2580;
  if (heightCm != null && heightCm >= 162 && heightCm <= 173) return 2680;
  return null;
}

function cashOff(product) {
  const price = parseFloat(product.priceRangeV2.minVariantPrice.amount);
  const map = mapPrice(product);
  if (!Number.isFinite(price) || map == null || price <= map) return 0;
  const next = Math.max(Math.floor(price * 0.9), map);
  return Math.round((price - next) * 100) / 100;
}

function isExcluded(product) {
  const text = `${product.title} ${product.handle} ${product.productType || ''} ${(product.tags || []).join(' ')}`;
  return /\b(head[- ]?only|standalone head|replacement head|accessor(?:y|ies)|system charge|hips?-only)\b/i.test(text);
}

async function getToken() {
  if (accessToken) {
    try {
      const data = await graphql('{ shop { name } }');
      if (data.data?.shop?.name) return accessToken;
    } catch {
      // fall through to client_credentials
    }
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET (admin token was rejected)');
  }
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`client_credentials failed: HTTP ${res.status}`);
  const tok = await res.json();
  accessToken = tok.access_token;
  return accessToken;
}

async function graphql(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json();
}

async function queryAllProducts(query) {
  const products = [];
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const data = await graphql(`
      query ($query: String!, $cursor: String) {
        products(first: 50, query: $query, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            status
            productType
            tags
            vendor
            priceRangeV2 { minVariantPrice { amount currencyCode } }
          }
        }
      }
    `, { query, cursor });
    const nodes = data.data?.products?.nodes || [];
    products.push(...nodes.filter((p) => p.status === 'ACTIVE'));
    hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
    cursor = data.data?.products?.pageInfo?.endCursor || null;
  }
  return products;
}

async function countActiveAutomaticDiscounts() {
  const data = await graphql(`
    query {
      automaticDiscountNodes(first: 100) {
        nodes {
          automaticDiscount {
            ... on DiscountAutomaticBasic { status title }
            ... on DiscountAutomaticBxgy { status }
            ... on DiscountAutomaticFreeShipping { status }
            ... on DiscountAutomaticApp { status }
          }
        }
      }
    }
  `);
  return (data.data?.automaticDiscountNodes?.nodes || []).filter((n) => n.automaticDiscount?.status === 'ACTIVE');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const startDateArg = args.find((arg) => arg.startsWith('--start-date='));
  const startDate = startDateArg ? startDateArg.split('=')[1] : new Date().toISOString();

  if (!SHOPIFY_DOMAIN) {
    console.error('Error: Missing SHOPIFY_STORE_DOMAIN');
    process.exit(1);
  }

  console.log('Fanreal November 2026 Automatic Discount Creation');
  console.log('================================================');
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log(`Start: ${startDate}`);
  console.log(`End:   ${ENDS_AT}`);
  console.log(`Shopify: ${SHOPIFY_DOMAIN}\n`);

  await getToken();
  const activeNodes = await countActiveAutomaticDiscounts();
  console.log(`Current active automatic discounts: ${activeNodes.length}/25`);
  for (const node of activeNodes) {
    if (node.automaticDiscount?.title) console.log(`  - ${node.automaticDiscount.title}`);
  }

  const all = await queryAllProducts('tag:fanreal OR vendor:Fanreal');
  const eligible = all.filter((p) => {
    if (isExcluded(p)) return false;
    const ident = `${p.vendor} ${p.title} ${p.handle} ${(p.tags || []).join(' ')}`.toLowerCase();
    return ident.includes('fanreal');
  });

  const groups = {};
  const skipped = [];
  for (const p of eligible) {
    const amount = cashOff(p);
    const price = parseFloat(p.priceRangeV2.minVariantPrice.amount);
    const map = mapPrice(p);
    if (amount <= 0) {
      skipped.push({ p, price, map, amount });
      continue;
    }
    const key = amount.toFixed(2);
    if (!groups[key]) groups[key] = [];
    groups[key].push({ ...p, price, map, amount });
  }

  console.log(`\nActive Fanreal products considered: ${eligible.length}`);
  console.log(`Skipped (no cash off, already at or below MAP, or MAP unknown): ${skipped.length}`);
  for (const row of skipped) {
    console.log(`  ${row.p.handle}: live $${row.price} MAP=${row.map ?? 'unknown'} off $0`);
  }

  const allDiscounts = [];
  for (const [amount, products] of Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const title = `Fanreal November 2026 $${amount}`;
    const mutation = `
      mutation ($discount: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicCreate(automaticBasicDiscount: $discount) {
          automaticDiscountNode { id automaticDiscount { ... on DiscountAutomaticBasic { title } } }
          userErrors { field message }
        }
      }
    `;
    const variables = {
      discount: {
        title,
        startsAt: startDate,
        endsAt: ENDS_AT,
        customerGets: {
          value: { discountAmount: { amount: parseFloat(amount), appliesOnEachItem: true } },
          items: { products: { productsToAdd: products.map((p) => p.id) } }
        },
        combinesWith: { orderDiscounts: true, productDiscounts: false, shippingDiscounts: false }
      }
    };
    allDiscounts.push({ title, mutation, variables, products, amount });
  }

  console.log(`\nTotal automatic discounts to create: ${allDiscounts.length}`);
  console.log(`After creation: ${activeNodes.length + allDiscounts.length}/25 automatic discounts`);
  if (activeNodes.length + allDiscounts.length > 25) {
    console.error(`\nERROR: would exceed Shopify's 25 active automatic discount limit.`);
    console.error('Pause or delete some existing discounts before --execute, or consolidate groups.');
    process.exit(1);
  }

  for (const d of allDiscounts) {
    console.log(`\n  Group: ${d.title} (${d.products.length} products) ends ${ENDS_AT} combinesWith order discounts`);
    for (const p of d.products) {
      console.log(`    ${p.handle}: $${p.price} → $${p.price - p.amount}  (MAP ${p.map})`);
    }
  }

  if (dryRun) {
    console.log('\nDry-run complete. Nothing was written to Shopify. Review the groups above before --execute, and only after Martin approves the preview.');
    return;
  }

  console.log('\nCreating discounts...');
  for (const spec of allDiscounts) {
    console.log(`\n[EXECUTE] Creating: ${spec.title}...`);
    const result = await graphql(spec.mutation, spec.variables);
    const errors = result.data?.discountAutomaticBasicCreate?.userErrors;
    if (errors?.length) {
      console.error('ERROR:', errors);
      throw new Error(`Failed to create discount: ${spec.title}`);
    }
    console.log(`Created: ${result.data.discountAutomaticBasicCreate.automaticDiscountNode.id}`);
  }
  console.log('\nExecution complete.');
}

main().catch((err) => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
