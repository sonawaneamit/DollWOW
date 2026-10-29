import {readFile, writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {expect, it} from 'vitest';

it.skipIf(process.env.DOL275_ACTIVATE_CHARGES !== '1')('activates only the acknowledged four catalog charges on Headless', async () => {
  expect(process.env.DOL275_METADATA_APPROVAL).toBe('b81fd5ef-fc1c-4c61-8d58-ff8a311eefd3');
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {adminFetch} = await import('@/lib/shopify/admin');
  const directory = 'data/exports/dol-275-2026-10-29';
  const source = JSON.parse(await readFile(`${directory}/catalog-charge-journal.json`, 'utf8'));
  expect(source.state).toBe('COMPLETE_VERIFIED_DRAFTS_UNPUBLISHED');
  expect(source.bindings.map((binding: {productId: string}) => binding.productId)).toEqual([
    'gid://shopify/Product/10691311272120', 'gid://shopify/Product/10691311337656',
    'gid://shopify/Product/10691311403192', 'gid://shopify/Product/10691311468728']);
  const publicationId = 'gid://shopify/Publication/321446248632';
  const publications = await adminFetch<{publications: {nodes: Array<{id: string; name: string}>; pageInfo: {hasNextPage: boolean}}}>(
    'query{publications(first:100){pageInfo{hasNextPage}nodes{id name}}}');
  expect(publications.publications.pageInfo.hasNextPage).toBe(false);
  expect(publications.publications.nodes.find(node => node.id === publicationId)?.name).toBe('DollWOW! Headless');
  const fields = `id title status tags variants(first:2){nodes{id price inventoryItem{requiresShipping tracked}}}
    resourcePublicationsV2(first:100){pageInfo{hasNextPage}nodes{isPublished publication{id name}}}`;
  type Product = {id: string; title: string; status: string; tags: string[];
    variants: {nodes: Array<{id: string; price: string; inventoryItem: {requiresShipping: boolean; tracked: boolean}}>};
    resourcePublicationsV2: {pageInfo: {hasNextPage: boolean}; nodes: Array<{isPublished: boolean; publication: {id: string; name: string}}>}};
  const read = async (id: string) => (await adminFetch<{product: Product}>(`query($id:ID!){product(id:$id){${fields}}}`, {id})).product;
  for (const binding of source.bindings) {
    const product = await read(binding.productId);
    expect(product.status).toBe('DRAFT');
    expect(product.title).toBe(binding.productTitle);
    expect(product.tags).toContain('dol275-catalog-price');
    expect(product.variants.nodes).toHaveLength(1);
    expect(product.variants.nodes[0]).toMatchObject({id: binding.merchandiseId,
      price: `${binding.unitAmount}.00`, inventoryItem: {requiresShipping: false, tracked: false}});
    expect(product.resourcePublicationsV2.pageInfo.hasNextPage).toBe(false);
    expect(product.resourcePublicationsV2.nodes.some(node => node.isPublished)).toBe(false);
  }
  const path = `${directory}/catalog-charge-activation.json`;
  const journal: {state: string; pending: string | null; acknowledged: unknown[]} = {state: 'IN_PROGRESS_HEADLESS_ONLY', pending: null, acknowledged: []};
  await writeFile(path, JSON.stringify(journal, null, 2), {flag: 'wx'});
  const save = () => writeFile(path, JSON.stringify(journal, null, 2));
  for (const binding of source.bindings) {
    journal.pending = binding.productId;
    await save();
    const updated = await adminFetch<{productUpdate: {userErrors: unknown[]}}>(
      'mutation($product:ProductUpdateInput!){productUpdate(product:$product){userErrors{message}}}',
      {product: {id: binding.productId, status: 'ACTIVE'}});
    expect(updated.productUpdate.userErrors).toEqual([]);
    journal.acknowledged.push({id: binding.productId, stage: 'ACTIVE_UNPUBLISHED'});
    await save();
    const published = await adminFetch<{publishablePublish: {userErrors: unknown[]}}>(
      'mutation($id:ID!,$input:[PublicationInput!]!){publishablePublish(id:$id,input:$input){userErrors{message}}}',
      {id: binding.productId, input: [{publicationId}]});
    expect(published.publishablePublish.userErrors).toEqual([]);
    const product = await read(binding.productId);
    expect(product.status).toBe('ACTIVE');
    expect(product.resourcePublicationsV2.pageInfo.hasNextPage).toBe(false);
    expect(product.resourcePublicationsV2.nodes.filter(node => node.isPublished).map(node => node.publication.id)).toEqual([publicationId]);
    journal.acknowledged.push({id: binding.productId, stage: 'HEADLESS_ONLY_VERIFIED', readback: product});
    journal.pending = null;
    await save();
  }
  journal.state = 'COMPLETE_HEADLESS_ONLY_VERIFIED';
  await save();
}, 120_000);

it.skipIf(process.env.DOL275_STOREFRONT_CHARGES !== '1')('adds only the storefront channel used by existing SE named charges', async () => {
  expect(process.env.DOL275_METADATA_APPROVAL).toBe('b81fd5ef-fc1c-4c61-8d58-ff8a311eefd3');
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {adminFetch} = await import('@/lib/shopify/admin');
  const directory = 'data/exports/dol-275-2026-10-29';
  const source = JSON.parse(await readFile(`${directory}/catalog-charge-journal.json`, 'utf8'));
  const activated = JSON.parse(await readFile(`${directory}/catalog-charge-activation.json`, 'utf8'));
  expect(activated.state).toBe('COMPLETE_HEADLESS_ONLY_VERIFIED');
  expect(source.bindings).toHaveLength(4);
  const online = 'gid://shopify/Publication/321372946616';
  const headless = 'gid://shopify/Publication/321446248632';
  type Product = {id: string; status: string; title: string; resourcePublicationsV2: {
    pageInfo: {hasNextPage: boolean}; nodes: Array<{isPublished: boolean; publication: {id: string; name: string}}>}};
  const read = async (id: string) => (await adminFetch<{product: Product}>(`query($id:ID!){product(id:$id){id status title
    resourcePublicationsV2(first:100){pageInfo{hasNextPage}nodes{isPublished publication{id name}}}}}`, {id})).product;
  const baseline = await read('gid://shopify/Product/10591745507512');
  expect(baseline.resourcePublicationsV2.nodes.filter(node => node.isPublished).map(node => node.publication.id).sort()).toEqual([headless, online].sort());
  expect(baseline.resourcePublicationsV2.nodes.find(node => node.publication.id === online)?.publication.name).toBe('Online Store');
  for (const binding of source.bindings) {
    const product = await read(binding.productId);
    expect(product.title).toBe(binding.productTitle);
    expect(product.status).toBe('ACTIVE');
    expect(product.resourcePublicationsV2.pageInfo.hasNextPage).toBe(false);
    expect(product.resourcePublicationsV2.nodes.filter(node => node.isPublished).map(node => node.publication.id)).toEqual([headless]);
  }
  const path = `${directory}/catalog-charge-storefront.json`;
  const journal: {state: string; pending: string | null; acknowledged: unknown[]} = {state: 'IN_PROGRESS_STOREFRONT_ONLY', pending: null, acknowledged: []};
  await writeFile(path, JSON.stringify(journal, null, 2), {flag: 'wx'});
  for (const binding of source.bindings) {
    journal.pending = binding.productId;
    await writeFile(path, JSON.stringify(journal, null, 2));
    const result = await adminFetch<{publishablePublish: {userErrors: unknown[]}}>(
      'mutation($id:ID!,$input:[PublicationInput!]!){publishablePublish(id:$id,input:$input){userErrors{message}}}',
      {id: binding.productId, input: [{publicationId: online}]});
    expect(result.publishablePublish.userErrors).toEqual([]);
    const product = await read(binding.productId);
    expect(product.resourcePublicationsV2.pageInfo.hasNextPage).toBe(false);
    expect(product.resourcePublicationsV2.nodes.filter(node => node.isPublished).map(node => node.publication.id).sort()).toEqual([headless, online].sort());
    journal.acknowledged.push(product);
    journal.pending = null;
    await writeFile(path, JSON.stringify(journal, null, 2));
  }
  journal.state = 'COMPLETE_STOREFRONT_ONLY_VERIFIED_NO_OTHER_CHANNELS';
  await writeFile(path, JSON.stringify(journal, null, 2));
}, 120_000);
