import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {expect, it} from 'vitest';

const directory = 'data/exports/dol-275-2026-10-29';
type File = {id: string; sku: string; name: string; size: number; path: string; sha256: string};
type Media = {id: string; alt: string; status: string; image: {url: string; width: number; height: number}};
type Product = {id: string; handle: string; title: string; status: string; tags: string[];
  variants: {nodes: Array<{id: string; price: string; inventoryItem: {sku: string}}>};
  media: {nodes: Media[]; pageInfo: {hasNextPage: boolean}}};

// Appends reviewed originals only. A journal prevents replays after ambiguous API responses.
it.skipIf(process.env.DOL275_GALLERY_APPEND !== '1')('expands only the four live supplier galleries, retaining their original three images', async () => {
  expect(process.env.DOL275_METADATA_APPROVAL).toBe('b81fd5ef-fc1c-4c61-8d58-ff8a311eefd3');
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {adminFetch} = await import('@/lib/shopify/admin');
  const {readSeElfAdminSnapshot} = await import('@/scripts/lib/se-elf-admin-snapshot');
  const {getCustomizationConfig} = await import('@/lib/customization/configs');
  const {templateRuntimeHash} = await import('@/lib/customization/template-release-registry');
  const stage = JSON.parse(await readFile(`${directory}/binding-stage-proof.json`, 'utf8'));
  const materialized = JSON.parse(await readFile(`${directory}/materialized-gallery.json`, 'utf8')) as {files: File[]};
  const review = JSON.parse(await readFile(`${directory}/gallery-content-review.json`, 'utf8')) as {files: File[]; excluded: unknown[]};
  const provenance = JSON.parse(await readFile('data/exports/dol-275-2026-10-27/source/provenance.json', 'utf8'));
  expect(materialized.files).toHaveLength(215);
  expect(review.files).toHaveLength(215);
  expect(review.excluded).toEqual([]);
  expect(stage.rows.map((row: {product: {id: string}}) => row.product.id)).toEqual([
    'gid://shopify/Product/10691273261240', 'gid://shopify/Product/10691273719992',
    'gid://shopify/Product/10691274014904', 'gid://shopify/Product/10691274342584']);
  const fields = `id handle title status tags variants(first:2){nodes{id price inventoryItem{sku}}}
    media(first:100){pageInfo{hasNextPage}nodes{id alt status ... on MediaImage{image{url width height}}}}`;
  const read = async (id: string) => (await adminFetch<{product: Product}>(`query($id:ID!){product(id:$id){${fields}}}`, {id})).product;
  const before: Product[] = [];
  for (const row of stage.rows) {
    const product = await read(row.product.id);
    expect(product.handle).toBe(row.product.handle);
    expect(product.status).toBe('ACTIVE');
    expect(product.variants.nodes).toHaveLength(1);
    expect(product.variants.nodes[0]).toMatchObject({id: row.product.variants[0].id,
      price: `${Number(row.product.priceRange.minVariantPrice.amount)}.00`, inventoryItem: {sku: row.sku}});
    expect(product.media.pageInfo.hasNextPage).toBe(false);
    expect(product.media.nodes).toHaveLength(3);
    expect(product.media.nodes.every(media => media.status === 'READY' && media.image)).toBe(true);
    before.push(product);
  }
  for (const file of materialized.files) {
    expect(review.files.find(item => item.id === file.id)).toMatchObject({sku: file.sku, sha256: file.sha256});
    const bytes = await readFile(file.path);
    expect(bytes.length).toBe(file.size);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
  }
  const path = `${directory}/gallery-append-journal.json`;
  const journal: {state: string; before: Product[]; pending: unknown; uploads: unknown[]; attached: unknown[]; verified: Product[]} = {
    state: 'IN_PROGRESS_APPEND_ONLY', before, pending: null, uploads: [], attached: [], verified: []};
  await writeFile(path, JSON.stringify(journal, null, 2), {flag: 'wx'});
  const save = () => writeFile(path, JSON.stringify(journal, null, 2));
  for (const [index, row] of stage.rows.entries()) {
    const existingIds = provenance.products[row.sku].selectedPhotos.map((file: {id: string}) => file.id);
    expect(existingIds).toHaveLength(3);
    const files = materialized.files.filter(file => file.sku === row.sku && !existingIds.includes(file.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'en', {numeric: true}));
    expect(files).toHaveLength([53,49,55,46][index]);
    const staged = await adminFetch<{stagedUploadsCreate: {stagedTargets: Array<{
      url: string; resourceUrl: string; parameters: Array<{name: string; value: string}>}>; userErrors: unknown[]}}>(
      `mutation($input:[StagedUploadInput!]!){stagedUploadsCreate(input:$input){stagedTargets{url resourceUrl parameters{name value}}userErrors{message}}}`,
      {input: files.map(file => ({resource: 'IMAGE', filename: `${row.sku}-${file.name.replace(/[^A-Za-z0-9._-]/g, '')}`,
        mimeType: 'image/jpeg', httpMethod: 'POST', fileSize: String(file.size)}))});
    expect(staged.stagedUploadsCreate.userErrors).toEqual([]);
    expect(staged.stagedUploadsCreate.stagedTargets).toHaveLength(files.length);
    const media = [];
    for (const [i, target] of staged.stagedUploadsCreate.stagedTargets.entries()) {
      const file = files[i];
      const form = new FormData();
      for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
      form.append('file', new Blob([await readFile(file.path)], {type: 'image/jpeg'}), `${row.sku}-${file.name.replace(/[^A-Za-z0-9._-]/g, '')}`);
      const response = await fetch(target.url, {method: 'POST', body: form});
      expect(response.ok, `Staged original upload ${row.sku}/${file.name}`).toBe(true);
      const alt = `${row.product.title} - supplier photograph ${file.name.replace(/[^A-Za-z0-9._-]/g, '')}`;
      media.push({originalSource: target.resourceUrl, mediaContentType: 'IMAGE', alt});
      journal.uploads.push({sku: row.sku, sourceId: file.id, sha256: file.sha256, resourceUrl: target.resourceUrl});
      await save();
    }
    const current = await read(row.product.id);
    expect(current).toEqual(before[index]);
    journal.pending = {sku: row.sku, productId: row.product.id, sources: files.map(file => file.id)};
    await save();
    const result = await adminFetch<{productCreateMedia: {media: Array<{id: string; alt: string; status: string}>; mediaUserErrors: unknown[]}}>(
      'mutation($id:ID!,$media:[CreateMediaInput!]!){productCreateMedia(productId:$id,media:$media){media{id alt status}mediaUserErrors{message}}}',
      {id: row.product.id, media});
    journal.attached.push({sku: row.sku, productId: row.product.id, sourceIds: files.map(file => file.id), response: result.productCreateMedia});
    await save();
    expect(result.productCreateMedia.mediaUserErrors).toEqual([]);
    expect(result.productCreateMedia.media).toHaveLength(files.length);
    const expectedIds = [...before[index].media.nodes.map(media => media.id), ...result.productCreateMedia.media.map(media => media.id)];
    let verified = await read(row.product.id);
    for (const delay of [5000,10000,20000,30000,30000,30000]) {
      if (verified.media.nodes.every(media => media.status === 'READY')) break;
      expect(verified.media.nodes.some(media => media.status === 'FAILED')).toBe(false);
      await new Promise(resolve => setTimeout(resolve, delay));
      verified = await read(row.product.id);
    }
    expect(verified.media.pageInfo.hasNextPage).toBe(false);
    expect(verified.media.nodes.map(media => media.id)).toEqual(expectedIds);
    expect(verified.media.nodes).toHaveLength([56,52,58,49][index]);
    expect(verified.media.nodes.every(media => media.status === 'READY' && media.image?.width > 0 && media.image?.height > 0)).toBe(true);
    expect(verified.media.nodes.slice(0,3)).toEqual(before[index].media.nodes);
    const {media: ignoredBefore, ...protectedBefore} = before[index];
    const {media: ignoredAfter, ...protectedAfter} = verified;
    void ignoredBefore; void ignoredAfter;
    expect(protectedAfter).toEqual(protectedBefore);
    const snapshot = await readSeElfAdminSnapshot(row.product.id);
    expect(templateRuntimeHash(snapshot.product, getCustomizationConfig(snapshot.product))).toBe(row.runtimeHash);
    journal.verified.push(verified);
    journal.pending = null;
    await save();
  }
  journal.state = 'COMPLETE_ALL_215_READY_ORIGINAL_MEDIA_AND_CONFIGURATION_PRESERVED';
  await save();
}, 900_000);
