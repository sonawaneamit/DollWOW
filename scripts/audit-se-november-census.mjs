import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const directory = 'data/exports/dol-285-2026-10-29';
const bytes = await fs.readFile(`${directory}/admin-census-private.json`);
const source = JSON.parse(bytes);
assert.equal(source.shop.ianaTimezone, 'America/New_York', 'Reconcile reviewed window if store timezone changes');
assert.equal(source.shopifyWrites, 0);
const choices = new Map();
const products = source.products.filter(product => product.status === 'ACTIVE').map(product => {
  const groups = JSON.parse(product.customization_groups?.value ?? '[]');
  assert(Array.isArray(groups), `Invalid menu for ${product.id}`);
  for (const group of groups) for (const option of group.options ?? []) {
    const facts = { groupId: group.id, groupLabel: group.label, optionId: option.id, label: option.label,
      priceDelta: typeof option.priceDelta === 'number' ? option.priceDelta : null,
      factoryExists: option.factoryExists ?? null, priceVerified: option.priceVerified ?? null,
      purchasable: option.purchasable ?? null, visibleWhen: group.visibleWhen ?? null,
      sourceOptionSha256: createHash('sha256').update(JSON.stringify(option)).digest('hex') };
    const key = JSON.stringify(facts);
    if (!choices.has(key)) choices.set(key, { ...facts, parents: [] });
    choices.get(key).parents.push(product.id);
  }
  return { id: product.id, handle: product.handle, title: product.title, productType: product.productType,
    material: product.material?.value ?? null, stockStatus: product.stock_status?.value ?? null,
    warehouseCountry: product.warehouse_country?.value ?? null, warehouseRegions: product.warehouse_regions?.value ?? null,
    bodyCode: product.body_code?.value ?? null, identity: product.catalog_identity_key?.value ?? null,
    bodyIdentity: product.catalog_body_identity_key?.value ?? null,
    menuSha256: createHash('sha256').update(product.customization_groups?.value ?? '').digest('hex'),
    groupCount: groups.length, variants: product.variants.nodes };
});
const audit = { at: new Date().toISOString(), sourceAt: source.at,
  sourceSha256: createHash('sha256').update(bytes).digest('hex'), shop: source.shop,
  products, choices: [...choices.values()],
  limitations: ['Raw census is not an eligibility manifest', 'Labels are not proof of retail entitlement or margin',
    'Missing body identities and hybrid/partial construction require exact source mapping',
    'Inventory unit cost alone does not prove freight, duties, fees or option costs'], shopifyWrites: 0 };
await fs.writeFile(`${directory}/menu-audit-private.json`, JSON.stringify(audit, null, 2));
console.log(JSON.stringify({ activeParents: products.length, distinctChoiceFacts: choices.size,
  missingBodyCode: products.filter(product => !product.bodyCode).length,
  missingBodyIdentity: products.filter(product => !product.bodyIdentity).length,
  parentsWithoutMenus: products.filter(product => product.groupCount === 0).length, shopifyWrites: 0 }));
