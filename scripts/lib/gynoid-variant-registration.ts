import assert from 'node:assert/strict';
import { gynoidBodyVersionMappings } from '../../lib/catalog/gynoid-body-versions';

type Connection<T> = { nodes: T[]; pageInfo: { hasNextPage: boolean } };
export type GynoidVariantSnapshot = {
  id: string; handle: string; title: string; status: string; tags: string[]; descriptionHtml: string;
  options: Array<{ id: string; name: string; optionValues: Array<{ id: string; name: string }> }>;
  variants: Connection<{
    id: string; title: string; price: string; compareAtPrice: string | null;
    selectedOptions: Array<{ name: string; value: string }>;
    inventoryPolicy: string; taxable: boolean; taxCode: string | null;
    inventoryItem: { id: string; tracked: boolean; requiresShipping: boolean; sku: string | null };
  }>;
  media: Connection<{ id: string }>;
  metafields: Connection<{ id: string; namespace: string; key: string; type: string; value: string }>;
  resourcePublications: Connection<{ isPublished: boolean; publication: { id: string; name: string } }>;
};

export const gynoidVersionSnapshotQuery = `query GynoidVersionRegistration($ids: [ID!]!) {
  shop { currencyCode }
  nodes(ids: $ids) { ... on Product {
    id handle title status tags descriptionHtml
    options { id name optionValues { id name } }
    variants(first: 10) { nodes {
      id title price compareAtPrice selectedOptions { name value }
      inventoryPolicy taxable taxCode inventoryItem { id tracked requiresShipping sku }
    } pageInfo { hasNextPage } }
    media(first: 100) { nodes { id } pageInfo { hasNextPage } }
    metafields(first: 100) { nodes { id namespace key type value } pageInfo { hasNextPage } }
    resourcePublications(first: 30) { nodes { isPublished publication { id name } } pageInfo { hasNextPage } }
  } }
}`;

export const gynoidOptionRenameMutation = `mutation GynoidBodyOption($productId: ID!, $option: OptionUpdateInput!, $values: [OptionValueUpdateInput!]!) {
  productOptionUpdate(productId: $productId, option: $option, optionValuesToUpdate: $values, variantStrategy: LEAVE_AS_IS) {
    userErrors { field message } product { id }
  }
}`;
export const gynoidDeluxeCreateMutation = `mutation GynoidDeluxeVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: PRESERVE_STANDALONE_VARIANT) {
    userErrors { field message } productVariants { id }
  }
}`;

export function prepareGynoidVariantRegistration(product: GynoidVariantSnapshot, currency: string) {
  const row = gynoidBodyVersionMappings.find(r => r.productId === product.id && r.handle === product.handle);
  assert(row && currency === 'USD', 'Exact approved parent and base USD required');
  assert.equal(product.status, 'DRAFT', 'Variant registration cannot publish or modify a live parent');
  for (const connection of [product.variants, product.media, product.metafields, product.resourcePublications]) {
    assert(!connection.pageInfo.hasNextPage, 'Incomplete snapshot');
  }
  assert(product.resourcePublications.nodes.every(p => !p.isPublished), 'Parent must remain unpublished');
  assert.equal(product.options.length, 1, 'Unexpected option axis');
  const option = product.options[0];
  const standard = product.variants.nodes.find(v => v.id === row.standardVariantId);
  assert(standard && Number(standard.price) === row.standardUSD, 'Retained Standard ID/price drift');
  assert.equal(standard.inventoryPolicy, 'CONTINUE');
  assert.equal(standard.inventoryItem.tracked, false);
  assert.equal(standard.inventoryItem.requiresShipping, true);
  const standardValue = option.optionValues.find(v => v.name === 'Standard');
  const isVersioned = option.name === 'Body version' && standardValue &&
    standard.selectedOptions.length === 1 && standard.selectedOptions[0].name === 'Body version' &&
    standard.selectedOptions[0].value === 'Standard';
  if (product.variants.nodes.length === 2) {
    const deluxe = product.variants.nodes.find(v => v.id !== row.standardVariantId)!;
    assert(isVersioned && deluxe.selectedOptions.length === 1 && deluxe.selectedOptions[0].name === 'Body version' &&
      deluxe.selectedOptions[0].value === 'Deluxe' && Number(deluxe.price) === row.deluxeUSD,
    'Existing variant needs reconciliation; never create a duplicate');
    assert.equal(option.optionValues.length, 2);
    assert(option.optionValues.some(v => v.name === 'Deluxe'));
    assert.equal(deluxe.id, row.deluxeVariantId, 'Unexpected existing Deluxe identity');
    assert.equal(deluxe.inventoryPolicy, standard.inventoryPolicy);
    assert.equal(deluxe.inventoryItem.tracked, false);
    assert.equal(deluxe.inventoryItem.requiresShipping, true);
    assert.equal(deluxe.taxable, standard.taxable);
    assert.equal(deluxe.taxCode, standard.taxCode);
    return { row, rename: null, create: null, registeredDeluxeId: deluxe.id };
  }
  assert.equal(product.variants.nodes.length, 1, 'Unexpected existing variants');
  assert.equal(option.optionValues.length, 1, 'Unexpected unused option values');
  const initial = option.name === 'Title' && option.optionValues[0].name === 'Default Title' &&
    standard.selectedOptions.length === 1 && standard.selectedOptions[0].name === 'Title' &&
    standard.selectedOptions[0].value === 'Default Title';
  assert(initial || isVersioned, 'Unexpected option identity');
  return {
    row, registeredDeluxeId: null,
    rename: initial ? { productId: row.productId, option: { id: option.id, name: 'Body version' },
      values: [{ id: option.optionValues[0].id, name: 'Standard' }] } : null,
    create: { productId: row.productId, variants: [{
      price: row.deluxeUSD.toFixed(2), optionValues: [{ optionId: option.id, name: 'Deluxe' }],
      inventoryPolicy: standard.inventoryPolicy, taxable: standard.taxable, taxCode: standard.taxCode,
      inventoryItem: { tracked: false, requiresShipping: true }
    }] }
  };
}

export function assertGynoidVersionPreservation(before: GynoidVariantSnapshot, after: GynoidVariantSnapshot) {
  const excluding = (record: object, fields: string[]) => Object.fromEntries(
    Object.entries(record).filter(([key]) => !fields.includes(key))
  );
  assert.deepEqual(excluding(after, ['options', 'variants']), excluding(before, ['options', 'variants']),
    'Fields outside body versions changed');
  const standard = before.variants.nodes[0];
  const retained = after.variants.nodes.find(v => v.id === standard.id);
  assert(retained, 'Original Standard variant removed');
  assert.deepEqual(excluding(retained, ['title', 'selectedOptions']), excluding(standard, ['title', 'selectedOptions']),
    'Original variant fields changed');
}
