import fs from 'node:fs/promises';

// Read-only release inventory: no product, discount, order or publication writes.
process.loadEnvFile('.env.local');
const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '');
let token = process.env.SHOPIFY_APP_AUTOMATION_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET) {
  const r = await fetch(`https://${domain}/admin/oauth/access_token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }) });
  const data = await r.json(); if (r.ok && data.access_token) token = data.access_token;
}
if (!token) throw new Error('Existing Shopify Admin access is unavailable.');
async function query(document, variables = {}, storefront = false) {
  const r = await fetch(`https://${domain}/${storefront ? 'api' : 'admin/api'}/2026-04/graphql.json`, { method: 'POST', headers: { 'content-type': 'application/json', [storefront ? 'x-shopify-storefront-access-token' : 'x-shopify-access-token']: storefront ? process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN : token }, body: JSON.stringify({ query: document, variables }) });
  const data = await r.json();
  if (!r.ok || data.errors?.length) throw new Error(`Shopify read failed: ${r.status} ${JSON.stringify(data.errors || [])}`);
  return data.data;
}
const publicIds = new Set();
let cursor = null;
do {
  const data = await query('query($after:String){products(first:250,after:$after){nodes{id}pageInfo{hasNextPage endCursor}}}', { after: cursor }, true);
  data.products.nodes.forEach(p => publicIds.add(p.id)); cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
} while (cursor);

const products = [];
do {
  const data = await query(`query($after:String){products(first:100,after:$after,query:"status:active"){
    nodes{id handle title status productType vendor tags
      height:metafield(namespace:"custom",key:"height_cm"){value}
      stock:metafield(namespace:"custom",key:"stock_status"){value}
      brand:metafield(namespace:"custom",key:"brand"){value}
      variants(first:10){nodes{id title sku price inventoryItem{unitCost{amount currencyCode}}}pageInfo{hasNextPage endCursor}}
    }pageInfo{hasNextPage endCursor}}}`, { after: cursor });
  products.push(...data.products.nodes); cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  if (cursor) await new Promise(resolve => setTimeout(resolve, 300));
} while (cursor);
const eligible = [], excluded = [], unresolved = [], nearCostRts = [], unknownCostRts = [];
for (const p of products) {
  const identity = `${p.title} ${p.handle} ${p.productType}`.replace(/[-_]/g, ' ').toLowerCase();
  const tags = p.tags.map(t => t.toLowerCase());
  const h = Number(p.height?.value) || Number(p.title.match(/\b(\d{2,3}(?:\.\d+)?)\s*cm\b/i)?.[1]);
  let reason;
  if (!publicIds.has(p.id)) reason = 'Not published to the public Storefront channel';
  else if ([p.vendor, p.brand?.value, ...tags].some(v => /^(?:zelex|zelex doll|zelex dolls)$/i.test(v || ''))) reason = 'Brand hidden by current storefront registry';
  else if (tags.some(t => /^(?:dollwow-system|dollwow-test|custom-option-charge|head-only)$/.test(t))) reason = 'System, test, option charge or standalone-head tag';
  else if (/\b(?:torsos?|hips?|partial body|half body|lower body|body only|body part)\b/.test(identity)) reason = 'Partial-body product';
  else if (/\b(?:standalone head|single head|replacement head|head only|ironai head|doll head)\b/.test(identity) || /^(?:custom )?(?:silicone )?heads?$/i.test(p.productType)) reason = 'Standalone head';
  else if (/\b(?:accessor(?:y|ies)|wig|care kit|storage case|flight case|doll stand|cleaning kit|repair kit)\b/.test(identity)) reason = 'Accessory or part';
  else if (h && h <= 120) reason = 'Mini (site boundary: up to 120cm)';
  const row = { ...p, inferredHeightCm: h || null };
  if (reason) { excluded.push({ ...row, reason }); continue; }
  if (!h || p.variants.pageInfo.hasNextPage || !/\bdoll\b/.test(identity)) { unresolved.push({ ...row, reason: !h ? 'No verified height' : p.variants.pageInfo.hasNextPage ? 'Variant pagination required' : 'Product form unclear' }); continue; }
  eligible.push(row);
  if (p.stock?.value === 'ready_to_ship' || /\b(?:rts|ready to ship)\b/.test(identity)) for (const v of p.variants.nodes) {
    const cost = v.inventoryItem?.unitCost;
    const item = { handle: p.handle, title: p.title, variant: v.id, sku: v.sku, retailUsd: Number(v.price), afterDiscountUsd: Number(v.price) - 299, recordedUnitCost: cost };
    if (!cost || Number(cost.amount) <= 0 || cost.currencyCode !== 'USD') unknownCostRts.push(item);
    else if (item.afterDiscountUsd <= Number(cost.amount) * 1.1) nearCostRts.push({ ...item, remainingOverRecordedCostUsd: item.afterDiscountUsd - Number(cost.amount) });
  }
}
const variantIds = [...new Set(eligible.flatMap(p => p.variants.nodes.map(v => v.id)))];
const result = { at: new Date().toISOString(), readOnly: true, publicProducts: publicIds.size, activeProducts: products.length, eligible, excluded, unresolved, variantIds, nearCostRts, unknownCostRts, costCaveat: 'Shopify unit cost is not assumed to include freight, fees, tax or other landed costs. Near-cost signal uses <=10% above recorded unit cost after $299, not an approved margin floor. Missing/zero/non-USD costs are unknown, never zero cost.' };
await fs.writeFile('data/exports/dol-217/release-eligibility-audit.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ publicProducts: publicIds.size, activeProducts: products.length, eligibleProducts: eligible.length, eligibleVariants: variantIds.length, excluded: excluded.length, unresolved: unresolved.length, nearCostRts: nearCostRts.length, unknownCostRts: unknownCostRts.length }));
