import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { expect, it } from 'vitest';
import snapshots from '@/data/draft-previews/se-elf-pdps.json';
import specs from '@/data/draft-previews/se-elf-oct27.json';
import { ownedOptionGroups, optionAssetViolations } from '@/lib/assets/option-assets.mjs';
import { seElfEditorial } from '@/lib/catalog/seElfPreview';
import type { Product } from '@/types/product';

// Read-only live evidence. Never creates products, carts, media or publications.
it.skipIf(process.env.DOL275_LIVE_PREFLIGHT !== '1')('captures exact Elf duplicates and current parent menus', async () => {
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const { adminFetch } = await import('@/lib/shopify/admin');
  const { getProductByHandle } = await import('@/lib/shopify/storefront');
  const { getCustomizationConfig } = await import('@/lib/customization/configs');
  const { getDefaultSelections } = await import('@/lib/customization/resolve');
  const parents = JSON.parse(await readFile('data/exports/dol-275-2026-10-28/parent-map.json', 'utf8')) as Array<{handle: string; parentHandle: string}>;
  const results = [];
  const products = [];
  for (const [index, mapping] of parents.entries()) {
    expect(mapping.handle).toBe(snapshots[index].handle);
    const sku = snapshots[index].id.split(':').at(-1)!;
    expect(specs[index].sku).toBe(sku);
    const duplicates = await adminFetch<{products: {nodes: unknown[]; pageInfo: {hasNextPage: boolean}}}>(
      `query($query:String!){products(first:50,query:$query){pageInfo{hasNextPage}nodes{id handle title status tags variants(first:10){nodes{id price sku}}}}}`,
      {query: `handle:${mapping.handle} OR sku:${sku} OR title:${sku}`});
    expect(duplicates.products.pageInfo.hasNextPage).toBe(false);
    const parent = await getProductByHandle(mapping.parentHandle, {strict: true, cache: 'no-store'});
    expect(parent, mapping.parentHandle).not.toBeNull();
    const config = getCustomizationConfig(parent!);
    const defaults = getDefaultSelections(config);
    results.push({sku, ...mapping, duplicates: duplicates.products.nodes, parent, config, defaults});
    const candidate = structuredClone(snapshots[index]) as unknown as Product;
    candidate.tags = candidate.tags.filter(tag => tag !== 'dollwow-test');
    candidate.extended.customizationGroups = ownedOptionGroups(parent!.extended.customizationGroups);
    expect(optionAssetViolations(candidate.extended.customizationGroups)).toEqual([]);
    candidate.images = candidate.images.map(image => ({...image, url: `https://dollwow.com${image.url}`}));
    candidate.featuredImage = candidate.images[0];
    products.push({...candidate, sku, sourceUrl: `https://drive.google.com/drive/folders/${specs[index].sourceFolder}`,
      reviewFlags: {ticket: 'DOL-275', approval: 'b81fd5ef-fc1c-4c61-8d58-ff8a311eefd3'},
      editorialIntro: seElfEditorial[sku]});
  }
  const directory = 'data/exports/dol-275-2026-10-29';
  await mkdir(directory, {recursive: true});
  await writeFile(`${directory}/live-preflight.json`, JSON.stringify({at: new Date().toISOString(), writes: 0, results}, null, 2));
  await writeFile(`${directory}/prepared-products.json`, JSON.stringify(products, null, 2));
  console.log(JSON.stringify({rows: results.length, duplicates: results.map(row => ({sku: row.sku, count: row.duplicates.length})), writes: 0}));
}, 120_000);
