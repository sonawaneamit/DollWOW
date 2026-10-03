import fs from 'node:fs/promises';
import {parseEnv} from 'node:util';

const source = process.argv[2];
if (!source) throw new Error('Provide the SE charge manifest JSON path.');
const rows = JSON.parse(await fs.readFile(source, 'utf8'));
const env = {...parseEnv(await fs.readFile('.env.local', 'utf8')), ...process.env};
const checks = [];
for (const country of ['US', 'PT', 'GB', 'DE']) {
  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '')}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': env.SHOPIFY_STOREFRONT_ACCESS_TOKEN},
    body: JSON.stringify({
      query: 'query($ids:[ID!]!,$country:CountryCode!) @inContext(country:$country){nodes(ids:$ids){...on ProductVariant{id availableForSale requiresShipping price{amount currencyCode}product{title}}}}',
      variables: {ids: rows.map(row => row.merchandiseId), country}
    })
  });
  const body = await response.json();
  if (!response.ok || body.errors || !body.data?.nodes) throw new Error(`Storefront read failed in ${country}: ${JSON.stringify(body.errors)}`);
  for (const row of rows) {
    const variant = body.data.nodes.find(node => node?.id === row.merchandiseId);
    const passed = Boolean(variant?.availableForSale && variant.requiresShipping === false
      && variant.product.title === row.productTitle
      && (country !== 'US' || variant.price.currencyCode === 'USD' && Number(variant.price.amount) === row.unitAmount));
    checks.push({country, label: row.productTitle, id: row.merchandiseId, passed, price: variant?.price ?? null});
  }
}
console.log(JSON.stringify({at: new Date().toISOString(), passed: checks.every(check => check.passed), checks}, null, 2));
if (checks.some(check => !check.passed)) process.exitCode = 1;
