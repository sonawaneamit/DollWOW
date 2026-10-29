import { open, readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { expect, it } from 'vitest';
import specs from '@/data/draft-previews/se-elf-oct27.json';
import { seElfEditorial } from '@/lib/catalog/seElfPreview';

type Draft = {id: string; handle: string; status: string; body: {value: string; compareDigest: string} | null;
  editorial: {value: string; compareDigest: string} | null;
  media: {nodes: Array<{id: string; status: string}>; pageInfo: {hasNextPage: boolean}};
  variants: {nodes: Array<{id: string; price: string; sku: string}>; pageInfo: {hasNextPage: boolean}}};
const directory = 'data/exports/dol-275-2026-10-29';
const expectedIds = ['10691273261240','10691273719992','10691274014904','10691274342584'];
const query = `query($id:ID!){product(id:$id){id handle status
  body:metafield(namespace:"custom",key:"body_code"){value compareDigest}
  editorial:metafield(namespace:"custom",key:"editorial_intro"){value compareDigest}
  media(first:10){pageInfo{hasNextPage}nodes{id status}}
  variants(first:10){pageInfo{hasNextPage}nodes{id price sku}}}}`;

// Explicitly authorized catalog writes only; no create, media, price or publish call.
it.skipIf(process.env.DOL275_METADATA !== '1')('sets body/editorial/SKU on only the four acknowledged drafts', async () => {
  expect(process.env.DOL275_METADATA_APPROVAL).toBe('b81fd5ef-fc1c-4c61-8d58-ff8a311eefd3');
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const { adminFetch } = await import('@/lib/shopify/admin');
  const created = JSON.parse(await readFile(`${directory}/created-drafts.json`, 'utf8')) as {
    results: Array<{productId: string; variantId: string; handle: string}>};
  expect(created.results.map(row => row.productId.split('/').at(-1))).toEqual(expectedIds);
  const journalPath = `${directory}/metadata-journal.json`;
  const journal: {state: string; acknowledged: unknown[]; current: unknown} = {state: 'PREFLIGHT', acknowledged: [], current: null};
  const file = await open(journalPath, 'wx');
  await file.close();
  const save = () => writeFile(journalPath, JSON.stringify(journal, null, 2));
  try {
    for (const [index, row] of created.results.entries()) {
      const {product} = await adminFetch<{product: Draft}>(query, {id: row.productId});
      expect(product.id).toBe(row.productId);
      expect(product.handle).toBe(row.handle);
      expect(product.status).toBe('DRAFT');
      expect(product.variants.pageInfo.hasNextPage).toBe(false);
      expect(product.variants.nodes).toHaveLength(1);
      expect(product.variants.nodes[0].id).toBe(row.variantId);
      expect(Number(product.variants.nodes[0].price)).toBe(specs[index].priceUsd);
      expect(product.media.pageInfo.hasNextPage).toBe(false);
      expect(product.media.nodes).toHaveLength(3);
      expect(product.media.nodes.every(media => media.status === 'READY')).toBe(true);
      const body = `${specs[index].heightCm}${specs[index].cup}`;
      const editorial = JSON.stringify(seElfEditorial[specs[index].sku]);
      journal.current = {id: row.productId, step: 'METAFIELDS_SUBMITTING'};
      await save();
      const result = await adminFetch<{metafieldsSet: {userErrors: unknown[]}}>(
        `mutation($metafields:[MetafieldsSetInput!]!){metafieldsSet(metafields:$metafields){userErrors{field message code}}}`,
        {metafields: [
          {ownerId: row.productId, namespace: 'custom', key: 'body_code', type: 'single_line_text_field', value: body, compareDigest: product.body?.compareDigest ?? null},
          {ownerId: row.productId, namespace: 'custom', key: 'editorial_intro', type: 'json', value: editorial, compareDigest: product.editorial?.compareDigest ?? null}
        ]});
      expect(result.metafieldsSet.userErrors).toEqual([]);
      journal.acknowledged.push({id: row.productId, step: 'METAFIELDS_ACKNOWLEDGED'});
      journal.current = {id: row.productId, variant: row.variantId, step: 'SKU_SUBMITTING'};
      await save();
      const sku = specs[index].sku;
      const updated = await adminFetch<{productVariantsBulkUpdate: {userErrors: unknown[]}}>(
        `mutation($productId:ID!,$variants:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$productId,variants:$variants){userErrors{field message}}}`,
        {productId: row.productId, variants: [{id: row.variantId, inventoryItem: {sku}}]});
      expect(updated.productVariantsBulkUpdate.userErrors).toEqual([]);
      const fresh = (await adminFetch<{product: Draft}>(query, {id: row.productId})).product;
      expect(fresh.body?.value).toBe(body);
      expect(JSON.parse(fresh.editorial!.value)).toEqual(seElfEditorial[sku]);
      expect(fresh.variants.nodes[0]).toMatchObject({id: row.variantId, sku});
      expect(fresh.variants.nodes[0].price).toBe(product.variants.nodes[0].price);
      expect(fresh.status).toBe('DRAFT');
      expect(fresh.media).toEqual(product.media);
      journal.acknowledged.push({id: row.productId, step: 'SKU_ACKNOWLEDGED_AND_READBACK_VERIFIED', product: fresh});
      journal.current = null;
      await save();
    }
    journal.state = 'COMPLETE_VERIFIED_UNPUBLISHED';
    await save();
  } catch (error) {
    journal.state = 'STOPPED_INSPECT_BEFORE_ANY_RETRY';
    await save();
    throw error;
  }
}, 120_000);
