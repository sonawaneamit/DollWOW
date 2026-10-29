import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { expect, it } from 'vitest';

it.skipIf(process.env.DOL275_ADMIN_PROJECTION !== '1')('checks the draft projection against all four actual live parent controls', async () => {
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {readSeElfAdminSnapshot} = await import('@/scripts/lib/se-elf-admin-snapshot');
  const {getProductByHandle} = await import('@/lib/shopify/storefront');
  const {getProductAdminMetafieldsByHandle} = await import('@/lib/shopify/admin');
  const {getCustomizationConfig} = await import('@/lib/customization/configs');
  const {templateRuntimeHash} = await import('@/lib/customization/template-release-registry');
  const source = JSON.parse(await readFile('data/exports/dol-275-2026-10-29/live-preflight.json', 'utf8')) as {
    results: Array<{sku: string; parent: {id: string; handle: string}}>};
  const created = JSON.parse(await readFile('data/exports/dol-275-2026-10-29/created-drafts.json', 'utf8')) as {
    results: Array<{productId: string; handle: string}>};
  const controls = [];
  const drafts = [];
  for (const [index, row] of source.results.entries()) {
    const snapshot = await readSeElfAdminSnapshot(row.parent.id);
    const storefront = await getProductByHandle(row.parent.handle, {strict: true, cache: 'no-store'});
    expect(storefront).not.toBeNull();
    const extra = await getProductAdminMetafieldsByHandle(row.parent.handle);
    const live = {...storefront!, extended: {...storefront!.extended,
      ...(extra?.bodyCode ? {bodyCode: extra.bodyCode} : {})}};
    const projectedHash = templateRuntimeHash(snapshot.product, getCustomizationConfig(snapshot.product));
    const liveHash = templateRuntimeHash(live, getCustomizationConfig(live));
    await writeFile(`data/exports/dol-275-2026-10-29/projection-control-${row.sku}.json`,
      JSON.stringify({projected: snapshot.product, live, projectedConfig: getCustomizationConfig(snapshot.product), liveConfig: getCustomizationConfig(live)}, null, 2));
    expect(projectedHash, row.parent.handle).toBe(liveHash);
    controls.push({handle: row.parent.handle, projectedHash, liveHash});
    const draft = await readSeElfAdminSnapshot(created.results[index].productId);
    expect(draft.raw.status).toBe('DRAFT');
    expect(draft.product.handle).toBe(created.results[index].handle);
    expect(draft.raw.media.nodes.every(media => media.status === 'READY')).toBe(true);
    drafts.push({sku: row.sku, ...draft, config: getCustomizationConfig(draft.product),
      runtimeHash: templateRuntimeHash(draft.product, getCustomizationConfig(draft.product))});
  }
  await writeFile('data/exports/dol-275-2026-10-29/admin-projection.json', JSON.stringify({at: new Date().toISOString(), controls, drafts}, null, 2));
}, 120_000);
