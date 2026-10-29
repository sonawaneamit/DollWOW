import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { seNovemberReviewQuote } from '../lib/promotions/seNovemberReview.ts';

const directory = 'data/exports/dol-285-2026-10-29';
const source = JSON.parse(await fs.readFile(`${directory}/admin-census-private.json`, 'utf8'));
const reviewed = JSON.parse(await fs.readFile('data/promotions/se-doll-september-2026-handles.json', 'utf8'));
const tpe = new Set(reviewed.tpe_custom_handles), silicone = new Set(reviewed.silicone_pro_custom_handles);
const elves = new Map([
  ['gid://shopify/Product/10691273261240', '153A'],
  ['gid://shopify/Product/10691273719992', '157H'],
  ['gid://shopify/Product/10691274014904', '161F'],
  ['gid://shopify/Product/10691274342584', '163E']
]);
const rows = source.products.filter(product => product.status === 'ACTIVE').map(product => {
  const bodyIdentity = product.catalog_body_identity_key?.value ?? '';
  const explicitBody = product.body_code?.value;
  const torsoBody = /^sedoll__(st[1-8])__/.exec(bodyIdentity)?.[1].toUpperCase();
  const torso = /^sedoll__st(?:[1-8]|2-long)__/.test(bodyIdentity);
  const stock = product.stock_status?.value;
  const material = product.material?.value;
  const cohort = stock === 'ready_to_ship' ? 'warehouse'
    : stock !== 'custom' ? 'held'
    : torso && material === 'Silicone' ? 'silicone-torso-custom'
    : material === 'TPE' && (tpe.has(product.handle) || elves.has(product.id) && elves.get(product.id) === explicitBody) ? 'tpe-custom'
    : material === 'Silicone' && silicone.has(product.handle) ? 'silicone-pro-custom' : 'held';
  const menu = product.customization_groups?.value ?? '[]';
  const menuSha256 = createHash('sha256').update(menu).digest('hex');
  const quotes = [];
  for (const group of JSON.parse(menu)) for (const option of group.options ?? []) {
    const quote = seNovemberReviewQuote({ cohort, bodyCode: explicitBody ?? torsoBody, menuSha256 }, group, option);
    if (quote) quotes.push({ groupId: group.id, optionId: option.id, label: option.label, ...quote });
  }
  return { id: product.id, handle: product.handle, title: product.title, cohort,
    bodyCode: explicitBody ?? torsoBody ?? null, bodyIdentity, menuSha256, quotes,
    warehouseCountry: product.warehouse_country?.value ?? null,
    baseRetail: product.variants.nodes[0].price,
    image: product.featuredMedia?.image ?? null,
    gates: [
      'No exact landed margin verification: Admin inventory unit costs absent; supplier costs, freight and fees still require reconciliation',
      ...(cohort === 'warehouse' ? ['Generic Silicone does not prove Silicone Pro; stock torso identities must not inherit full-body offers'] : []),
      ...(torso && !torsoBody ? ['ST2-long is not automatically ST2 for body-specific gel-butt offer'] : []),
      ...(cohort === 'silicone-pro-custom' ? ['Random supplier head does not entitle any named paid head', 'No soft-belly benefit from height-only proxy'] : [])
    ] };
});
await fs.writeFile(`${directory}/review-comparison-private.json`, JSON.stringify({ sourceAt: source.at, rows, shopifyWrites: 0, checkoutReady: false }, null, 2));
const counts = Object.fromEntries([...new Set(rows.map(row => row.cohort))].map(cohort => [cohort, rows.filter(row => row.cohort === cohort).length]));
console.log(JSON.stringify({ counts, exactComparedChoices: rows.reduce((sum, row) => sum + row.quotes.length, 0), checkoutReady: false, shopifyWrites: 0 }));
