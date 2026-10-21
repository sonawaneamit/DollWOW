import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Disposable carts only. No customer identity, order creation or payment.
process.loadEnvFile('.env.local');
const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '');
const audit = JSON.parse(await fs.readFile('data/exports/dol-217/release-eligibility-audit.json', 'utf8'));
const custom = audit.eligible.find(p => p.handle === 'irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli') || audit.eligible.find(p => p.stock?.value !== 'ready_to_ship');
const rts = audit.eligible.find(p => p.variants.nodes.some(v => v.id === 'gid://shopify/ProductVariant/54335377080504'));
const rts2 = audit.eligible.find(p => p.variants.nodes.some(v => v.id === 'gid://shopify/ProductVariant/54335385534648'));
const excluded = ['Partial-body product', 'Mini (site boundary: up to 120cm)', 'Standalone head', 'Accessory or part'].map(reason => audit.excluded.find(p => p.reason === reason)).filter(Boolean);
const charge = audit.excluded.find(p => p.tags.includes('custom-option-charge') && Number(p.variants.nodes[0].price) > 0);
assert(custom && rts && rts2 && charge);
const line = (p, quantity = 1) => ({ merchandiseId: p.variants.nodes[0].id, quantity });
const cases = [
  { name: 'custom', lines: [line(custom)], expected: 299 },
  { name: 'approved-near-cost-rts-170', lines: [line(rts)], expected: 299 },
  { name: 'approved-near-cost-rts-165', lines: [line(rts2)], expected: 299 },
  { name: 'quantity-two-once-per-order', lines: [line(custom, 2)], expected: 299 },
  { name: 'two-dolls-once-per-order', lines: [line(custom), line(rts)], expected: 299 },
  { name: 'base-plus-paid-charge', lines: [line(custom), line(charge)], expected: 299, excluded: [charge.variants.nodes[0].id] },
  ...excluded.map(p => ({ name: `excluded-${p.reason}`, lines: [line(p)], expected: 0 })),
  { name: 'charge-only', lines: [line(charge)], expected: 0 },
  { name: 'mixed-base-partial-charge', lines: [line(custom), line(excluded[0]), line(charge)], expected: 299, excluded: [excluded[0].variants.nodes[0].id, charge.variants.nodes[0].id] },
  { name: 'no-code-no-old-10', lines: [line(custom)], expected: 0, noCode: true },
  { name: 'international-GB', lines: [line(custom)], country: 'GB', expected: 'converted' }
];
const receipts = [];
const money = 'amount currencyCode';
const allocation = `discountedAmount{${money}} ... on CartCodeDiscountAllocation{code}`;
const document = `mutation($input:CartInput!,$country:CountryCode!) @inContext(country:$country) {
  cartCreate(input:$input) {
    cart {
      id checkoutUrl
      cost { subtotalAmount { ${money} } totalAmount { ${money} } }
      discountCodes { code applicable }
      discountAllocations { ${allocation} }
      lines(first:20) { nodes {
        quantity merchandise { ... on ProductVariant { id price { ${money} } } }
        cost { totalAmount { ${money} } }
        discountAllocations { ${allocation} }
      } }
    }
    userErrors { field message code }
  }
}`;
for (const c of cases) {
  const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-shopify-storefront-access-token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN }, body: JSON.stringify({ query: document, variables: { country: c.country || 'US', input: { lines: c.lines, discountCodes: c.noCode ? [] : ['HALLOWEEN299'], buyerIdentity: { countryCode: c.country || 'US' } } } }) });
  const result = await response.json();
  assert(!result.errors?.length, JSON.stringify(result.errors));
  assert(!result.data.cartCreate.userErrors.length, JSON.stringify(result.data.cartCreate.userErrors));
  const cart = result.data.cartCreate.cart;
  const coupon = [...cart.discountAllocations, ...cart.lines.nodes.flatMap(l => l.discountAllocations)].filter(a => a.code === 'HALLOWEEN299');
  const amount = coupon.reduce((sum, a) => sum + Number(a.discountedAmount.amount), 0);
  const totalDiscount = [...cart.discountAllocations, ...cart.lines.nodes.flatMap(l => l.discountAllocations)].reduce((sum, a) => sum + Number(a.discountedAmount.amount), 0);
  const problems = [];
  if (typeof c.expected === 'number' && Math.abs(amount - c.expected) > 0.01) problems.push(`Expected ${c.expected}, got ${amount}`);
  if (c.expected === 'converted' && (!amount || cart.cost.totalAmount.currencyCode === 'USD')) problems.push('Expected actual non-USD checkout conversion');
  if (c.noCode && totalDiscount !== 0) problems.push(`Unexpected automatic discount ${totalDiscount}`);
  for (const l of cart.lines.nodes) if (c.excluded?.includes(l.merchandise.id) && l.discountAllocations.some(a => a.code === 'HALLOWEEN299')) problems.push('Excluded line received coupon allocation');
  receipts.push({ name: c.name, at: new Date().toISOString(), amount, totalDiscount, currency: cart.cost.totalAmount.currencyCode, passed: !problems.length, problems, cart });
  console.log(JSON.stringify({ name: c.name, amount, totalDiscount, currency: cart.cost.totalAmount.currencyCode, passed: !problems.length, problems }));
}
await fs.writeFile('data/exports/dol-217/release-checkout-carts.json', JSON.stringify(receipts, null, 2));
assert(receipts.every(r => r.passed), 'See private checkout receipts for failed cases');
