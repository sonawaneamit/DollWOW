import {readFile, writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {expect, it} from 'vitest';

const directory = 'data/exports/dol-275-2026-10-29';
const specs = [
  {group: 'Breast Options', label: 'Gel', unitAmount: 69, title: 'SE Doll TPE Gel Breasts', key: 'gel-breasts'},
  {group: 'Skeleton Type', label: 'EVO', unitAmount: 50, title: 'SE Doll EVO Skeleton', key: 'evo-skeleton'},
  {group: 'Premium Head & Body Options (Multiple)', label: 'Loose Joint System', unitAmount: 100, title: 'SE Doll Loose Joint System', key: 'loose-joints'},
  {group: 'Premium Head & Body Options (Multiple)', label: 'Hyper-realism Body Painting', unitAmount: 99, title: 'SE Doll Hyper-realism Body Painting', key: 'body-painting'}
];

// Full-price bindings must survive expiration of the current free/discounted offers.
it.skipIf(process.env.DOL275_CATALOG_CHARGES !== '1')('prepares only the four missing named catalog charges as unpublished drafts', async () => {
  expect(process.env.DOL275_METADATA_APPROVAL).toBe('b81fd5ef-fc1c-4c61-8d58-ff8a311eefd3');
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {adminFetch} = await import('@/lib/shopify/admin');
  const projection = JSON.parse(await readFile(`${directory}/admin-projection.json`, 'utf8'));
  const existing = JSON.parse(await readFile(`${directory}/existing-charge-audit.json`, 'utf8'));
  expect(existing.totalSystemRead).toBeGreaterThan(0);
  const fields = `id title handle status tags variants(first:2){nodes{id price taxable inventoryPolicy inventoryItem{requiresShipping tracked}}}
    resourcePublicationsV2(first:30){nodes{isPublished publication{id name}}}`;
  type Charge = {id: string; title: string; handle: string; status: string; tags: string[];
    variants: {nodes: Array<{id: string; price: string; taxable: boolean; inventoryPolicy: string; inventoryItem: {requiresShipping: boolean; tracked: boolean}}>};
    resourcePublicationsV2: {nodes: Array<{isPublished: boolean}>}};
  for (const spec of specs) {
    for (const row of projection.drafts) {
      const group = row.config.groups.find((group: {label: string}) => group.label === spec.group);
      const option = group?.options.find((option: {label: string}) => option.label === spec.label);
      expect(option?.priceDelta).toBe(spec.unitAmount);
      expect(option?.priceVerified).toBe(true);
      expect(option?.purchasable).not.toBe(false);
    }
    expect(existing.products.nodes.some((product: Charge) => product.title === spec.title &&
      product.variants.nodes.some(variant => Number(variant.price) === spec.unitAmount))).toBe(false);
    const found = await adminFetch<{productByHandle: Charge | null}>(`query($handle:String!){productByHandle(handle:$handle){${fields}}}`,
      {handle: `dollwow-se-elf-${spec.key}-catalog-2026`});
    expect(found.productByHandle).toBeNull();
  }
  const journal: {state: string; approval: string; pending: string | null; bindings: unknown[]} = {
    state: 'DRAFT_ONLY_IN_PROGRESS', approval: process.env.DOL275_METADATA_APPROVAL!, pending: null, bindings: []};
  const path = `${directory}/catalog-charge-journal.json`;
  await writeFile(path, JSON.stringify(journal, null, 2), {flag: 'wx'});
  const save = () => writeFile(path, JSON.stringify(journal, null, 2));
  for (const spec of specs) {
    journal.pending = spec.key;
    await save();
    const handle = `dollwow-se-elf-${spec.key}-catalog-2026`;
    const created = await adminFetch<{productCreate: {product: Charge; userErrors: unknown[]}}>(
      `mutation($product:ProductCreateInput!){productCreate(product:$product){product{${fields}}userErrors{message}}}`,
      {product: {title: spec.title, handle, status: 'DRAFT', vendor: 'DollWOW', productType: 'System charge',
        descriptionHtml: `<p>${spec.title} selected for the associated SE Doll configuration. Supplied with that doll, not a standalone doll or delivery charge. The selected option is recorded in the order.</p>`,
        tags: ['dollwow-system', 'custom-option-charge', 'exact-upgrade-pilot', 'dol275-catalog-price']}});
    expect(created.productCreate.userErrors).toEqual([]);
    const product = created.productCreate.product;
    expect(product.status).toBe('DRAFT');
    expect(product.variants.nodes).toHaveLength(1);
    journal.bindings.push({spec, productId: product.id, variantId: product.variants.nodes[0].id, stage: 'CREATED_NOT_CONFIGURED'});
    await save();
    const updated = await adminFetch<{productVariantsBulkUpdate: {userErrors: unknown[]}}>(
      `mutation($id:ID!,$variants:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$id,variants:$variants){userErrors{message}}}`,
      {id: product.id, variants: [{id: product.variants.nodes[0].id, price: String(spec.unitAmount), taxable: true,
        inventoryPolicy: 'CONTINUE', inventoryItem: {requiresShipping: false, tracked: false}}]});
    expect(updated.productVariantsBulkUpdate.userErrors).toEqual([]);
    const readback = (await adminFetch<{product: Charge}>(`query($id:ID!){product(id:$id){${fields}}}`, {id: product.id})).product;
    expect(readback.status).toBe('DRAFT');
    expect(readback.title).toBe(spec.title);
    expect(readback.handle).toBe(handle);
    expect(readback.resourcePublicationsV2.nodes.some(node => node.isPublished)).toBe(false);
    expect(readback.variants.nodes).toHaveLength(1);
    expect(readback.variants.nodes[0]).toMatchObject({price: `${spec.unitAmount}.00`, taxable: true,
      inventoryPolicy: 'CONTINUE', inventoryItem: {requiresShipping: false, tracked: false}});
    journal.bindings[journal.bindings.length - 1] = {group: spec.group, label: spec.label, choiceLabels: [spec.label],
      unitAmount: spec.unitAmount, currencyCode: 'USD', merchandiseId: readback.variants.nodes[0].id,
      productTitle: spec.title, productId: readback.id, readback, stage: 'VERIFIED_DRAFT_UNPUBLISHED'};
    journal.pending = null;
    await save();
  }
  journal.state = 'COMPLETE_VERIFIED_DRAFTS_UNPUBLISHED';
  await save();
}, 120_000);
