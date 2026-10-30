import { test, expect } from 'vitest';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { join, isAbsolute } from 'node:path';
import { gynoidBodyVersionMappings } from '@/lib/catalog/gynoid-body-versions';
import {
  gynoidVersionSnapshotQuery, gynoidOptionRenameMutation, gynoidDeluxeCreateMutation,
  prepareGynoidVariantRegistration, assertGynoidVersionPreservation, type GynoidVariantSnapshot
} from '../scripts/lib/gynoid-variant-registration';

test.skipIf(process.env.GYNOID_VERSION_REGISTRATION !== '1')('registers only the two approved body versions on unpublished drafts', async () => {
  const output = process.env.GYNOID_VERSION_OUTPUT;
  expect(output && isAbsolute(output)).toBeTruthy();
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const { adminFetch } = await import('@/lib/shopify/admin');
  await mkdir(output!, { recursive: true });
  const ids = gynoidBodyVersionMappings.map(r => r.productId);
  const read = async () => {
    const data = await adminFetch<{ shop: { currencyCode: string }; nodes: GynoidVariantSnapshot[] }>(gynoidVersionSnapshotQuery, { ids });
    expect(data.nodes.map(p => p?.id).sort()).toEqual([...ids].sort());
    return data;
  };
  const save = (name: string, value: unknown) => writeFile(join(output!, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
  const initial = await read();
  const plans = initial.nodes.map(p => prepareGynoidVariantRegistration(p, initial.shop.currencyCode));
  await save('before', { at: new Date().toISOString(), approval: '7bc009b1-0291-4544-9c8a-0ee213b2eacb', ...initial, plans });
  if (process.env.GYNOID_VERSION_EXECUTE !== '1') return;
  for (const plan of plans) {
    if (plan.rename) {
      const renamed = await adminFetch<{ productOptionUpdate: { userErrors: unknown[] } }>(gynoidOptionRenameMutation, plan.rename);
      await save(`${plan.row.model}-rename-response`, renamed);
      expect(renamed.productOptionUpdate.userErrors).toEqual([]);
    }
    // Reconcile after each request. A failed/ambiguous request is never retried here.
    const current = await read();
    const parent = current.nodes.find(p => p.id === plan.row.productId)!;
    const reconciled = prepareGynoidVariantRegistration(parent, current.shop.currencyCode);
    expect(reconciled.rename).toBeNull();
    assertGynoidVersionPreservation(initial.nodes.find(p => p.id === plan.row.productId)!, parent);
    if (reconciled.create) {
      const created = await adminFetch<{ productVariantsBulkCreate: { userErrors: unknown[] } }>(gynoidDeluxeCreateMutation, reconciled.create);
      await save(`${plan.row.model}-create-response`, created);
      expect(created.productVariantsBulkCreate.userErrors).toEqual([]);
    }
    const final = await read();
    const updated = final.nodes.find(p => p.id === plan.row.productId)!;
    const mapped = prepareGynoidVariantRegistration(updated, final.shop.currencyCode);
    expect(mapped.create).toBeNull();
    expect(mapped.registeredDeluxeId).toMatch(/^gid:\/\/shopify\/ProductVariant\/\d+$/);
    assertGynoidVersionPreservation(initial.nodes.find(p => p.id === plan.row.productId)!, updated);
    await save(`${plan.row.model}-verified`, { at: new Date().toISOString(), parent: updated, mapped });
  }
}, 180000);
