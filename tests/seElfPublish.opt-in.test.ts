import {readFile, writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {expect, it} from 'vitest';

const directory = 'data/exports/dol-275-2026-10-29';
it.skipIf(process.env.DOL275_PUBLISH !== '1')('publishes only the four already acknowledged approved Elf drafts', async () => {
  expect(process.env.DOL275_METADATA_APPROVAL).toBe('b81fd5ef-fc1c-4c61-8d58-ff8a311eefd3');
  const release = JSON.parse(await readFile(`${directory}/binding-deployment.json`, 'utf8'));
  expect(release.state).toBe('READY');
  expect(release.production).toBe(true);
  expect(release.source).toMatch(/^[a-f0-9]{40}$/);
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {adminFetch} = await import('@/lib/shopify/admin');
  const {readSeElfAdminSnapshot} = await import('@/scripts/lib/se-elf-admin-snapshot');
  const {getCustomizationConfig} = await import('@/lib/customization/configs');
  const {templateRuntimeHash} = await import('@/lib/customization/template-release-registry');
  const staged = JSON.parse(await readFile(`${directory}/binding-stage-proof.json`, 'utf8'));
  expect(staged.rows.map((row: {product: {id: string}}) => row.product.id)).toEqual([
    'gid://shopify/Product/10691273261240', 'gid://shopify/Product/10691273719992',
    'gid://shopify/Product/10691274014904', 'gid://shopify/Product/10691274342584']);
  const ids = ['gid://shopify/Publication/321446248632', 'gid://shopify/Publication/321372946616'];
  const publicationRead = await adminFetch<{publications: {nodes: Array<{id: string; name: string}>; pageInfo: {hasNextPage: boolean}}}>(
    'query{publications(first:100){pageInfo{hasNextPage}nodes{id name}}}');
  expect(publicationRead.publications.pageInfo.hasNextPage).toBe(false);
  expect(publicationRead.publications.nodes.filter(node => ids.includes(node.id)).map(node => node.name).sort()).toEqual(['DollWOW! Headless', 'Online Store'].sort());
  const readPublications = async (id: string) => (await adminFetch<{product: {status: string; resourcePublicationsV2: {
    pageInfo: {hasNextPage: boolean}; nodes: Array<{isPublished: boolean; publication: {id: string; name: string}}>}}}>(
      'query($id:ID!){product(id:$id){status resourcePublicationsV2(first:100){pageInfo{hasNextPage}nodes{isPublished publication{id name}}}}}', {id})).product;
  for (const row of staged.rows) {
    const snapshot = await readSeElfAdminSnapshot(row.product.id);
    expect(snapshot.raw.status).toBe('DRAFT');
    expect(snapshot.raw.variants.nodes[0].inventoryItem.sku).toBe(row.sku);
    expect(snapshot.raw.media.nodes).toHaveLength(3);
    expect(snapshot.raw.media.nodes.every(node => node.status === 'READY')).toBe(true);
    expect(templateRuntimeHash(snapshot.product, getCustomizationConfig(snapshot.product))).toBe(row.runtimeHash);
    const product = await readPublications(row.product.id);
    expect(product.resourcePublicationsV2.pageInfo.hasNextPage).toBe(false);
    expect(product.resourcePublicationsV2.nodes.some(node => node.isPublished)).toBe(false);
  }
  const path = `${directory}/publication-journal.json`;
  const journal: {state: string; pending: string | null; acknowledged: unknown[]} = {state: 'IN_PROGRESS', pending: null, acknowledged: []};
  await writeFile(path, JSON.stringify(journal, null, 2), {flag: 'wx'});
  for (const row of staged.rows) {
    journal.pending = row.product.id;
    await writeFile(path, JSON.stringify(journal, null, 2));
    const active = await adminFetch<{productUpdate: {userErrors: unknown[]}}>(
      'mutation($product:ProductUpdateInput!){productUpdate(product:$product){userErrors{message}}}',
      {product: {id: row.product.id, status: 'ACTIVE'}});
    expect(active.productUpdate.userErrors).toEqual([]);
    journal.acknowledged.push({productId: row.product.id, stage: 'ACTIVE'});
    await writeFile(path, JSON.stringify(journal, null, 2));
    const published = await adminFetch<{publishablePublish: {userErrors: unknown[]}}>(
      'mutation($id:ID!,$input:[PublicationInput!]!){publishablePublish(id:$id,input:$input){userErrors{message}}}',
      {id: row.product.id, input: ids.map(publicationId => ({publicationId}))});
    expect(published.publishablePublish.userErrors).toEqual([]);
    const product = await readPublications(row.product.id);
    expect(product.status).toBe('ACTIVE');
    expect(product.resourcePublicationsV2.pageInfo.hasNextPage).toBe(false);
    expect(product.resourcePublicationsV2.nodes.filter(node => node.isPublished).map(node => node.publication.id).sort()).toEqual([...ids].sort());
    journal.acknowledged.push({productId: row.product.id, stage: 'PUBLISHED_EXACT_TWO_CHANNELS', readback: product});
    journal.pending = null;
    await writeFile(path, JSON.stringify(journal, null, 2));
  }
  journal.state = 'COMPLETE_PUBLISHED_PENDING_LIVE_QA';
  await writeFile(path, JSON.stringify(journal, null, 2));
}, 120_000);
