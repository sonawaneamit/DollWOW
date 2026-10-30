import { test, expect, vi } from 'vitest';
import fs from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { isAbsolute, join } from 'node:path';
import type { Product } from '@/types/product';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { selectReleasedTemplateRecipe, type TemplateReleaseRegistry } from '@/lib/customization/template-release-registry';
import { releasedNamedBindings } from '@/lib/cart/named-upgrade-release';
vi.mock('server-only', () => ({}));

type Node = { id: string; title: string; handle: string; status: string; tags: string[];
  variants: { nodes: Array<{ id: string; price: string }>; pageInfo: { hasNextPage: boolean } };
  resourcePublications: { nodes: Array<{ isPublished: boolean; publication: { id: string; name: string; autoPublish: boolean } }>; pageInfo: { hasNextPage: boolean } } };

test.skipIf(process.env.GYNOID_PUBLICATION !== '1')('publishes only the approved retained cohort after exact production deployment verification', async () => {
  const output = process.env.GYNOID_PUBLICATION_OUTPUT, execute = process.env.GYNOID_PUBLICATION_EXECUTE === '1';
  expect(output && isAbsolute(output)).toBeTruthy();
  Object.assign(process.env, parseEnv(await fs.readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const read = async (path: string) => JSON.parse(await fs.readFile(path, 'utf8'));
  const root = 'data/exports/dol-273-approved-2026-10-30';
  const products = await read(`${root}/approved-publication-products.json`) as Product[];
  const source = await read(`${root}/source-parity-normalized-1653/source-products.json`) as Product[];
  const charges = (await read(`${root}/menu-charge-read-1552/verified.json`)).charges.nodes
    .filter((n: { product: { status: string } }) => n.product.status === 'DRAFT') as Array<{ id: string; price: string; product: { id: string; title: string } }>;
  expect(products).toHaveLength(11); expect(charges).toHaveLength(8);
  const registry = await read('lib/customization/evidence/template-release.json') as TemplateReleaseRegistry;
  for (const p of products) {
    expect(p.tags).not.toContain('catalog-review-hold'); expect(p.tags).not.toContain('dollwow-test');
    expect(selectReleasedTemplateRecipe(registry, p, getCustomizationConfig(p))).not.toBeNull();
  }
  expect(releasedNamedBindings(await read('lib/cart/evidence/named-upgrades-release.json'), products.flatMap(p => p.variants.map(v => v.id)))).toHaveLength(130);
  let proof: unknown = null;
  if (execute) {
    expect(process.env.GYNOID_PRODUCTION_PROOF && isAbsolute(process.env.GYNOID_PRODUCTION_PROOF)).toBeTruthy();
    const deployment = await read(process.env.GYNOID_PRODUCTION_PROOF!);
    expect(deployment.readyState).toBe('READY'); expect(deployment.target).toBe('production');
    expect(deployment.projectId).toBe('prj_vXPmttmXdGny6MMGqCtKABx1Iqvm');
    expect(deployment.meta.githubCommitSha).toBe(process.env.GYNOID_APPROVED_PRODUCTION_SHA);
    expect(deployment.meta.githubCommitSha).toMatch(/^[a-f0-9]{40}$/);
    expect(deployment.meta.githubCommitRef).toBe('main');
    expect(deployment.alias).toEqual(expect.arrayContaining(['dollwow.com', 'www.dollwow.com']));
    proof = { id: deployment.id, sha: deployment.meta.githubCommitSha, target: deployment.target, readyState: deployment.readyState, alias: deployment.alias };
  }
  const { adminFetch } = await import('@/lib/shopify/admin');
  const ids = [...charges.map(c => c.product.id), ...products.map(p => p.id)];
  expect(new Set(ids).size).toBe(19);
  const channels = ['gid://shopify/Publication/321446248632', 'gid://shopify/Publication/321372946616'];
  const automaticCatalogs = new Map([
    ['gid://shopify/Publication/321373110456', 'Microsoft Copilot'],
    ['gid://shopify/Publication/336936665272', 'Meta AI and Muse'],
  ]);
  const current = async (readIds = ids) => (await adminFetch<{ nodes: Node[] }>(`query GynoidPublicationRead($ids:[ID!]!) {
    nodes(ids:$ids) { ... on Product { id title handle descriptionHtml status tags vendor productType category { id fullName }
      variants(first:3) { nodes { id title price taxable sku inventoryPolicy selectedOptions { name value } inventoryItem { requiresShipping tracked } } pageInfo { hasNextPage } }
      metafields(first:100) { nodes { namespace key type value } pageInfo { hasNextPage } }
      media(first:100) { nodes { id } pageInfo { hasNextPage } }
      resourcePublications(first:20) { nodes { isPublished publication { id name autoPublish } } pageInfo { hasNextPage } }
    } }
  }`, { ids: readIds })).nodes;
  const before = await current(); expect(before).toHaveLength(19);
  const plans = before.map(p => {
    expect(p).toBeTruthy(); expect(['DRAFT', 'ACTIVE']).toContain(p.status); expect(p.tags).not.toContain('dollwow-test');
    for (const key of ['variants', 'metafields', 'media', 'resourcePublications'] as const) expect((p as unknown as Record<string, { pageInfo: { hasNextPage: boolean } }>)[key].pageInfo.hasNextPage).toBe(false);
    const parent = products.find(v => v.id === p.id), charge = charges.find(v => v.product.id === p.id);
    if (parent) {
      expect(p.handle).toBe(parent.handle); expect(p.title).toBe(parent.title);
      expect(p.variants.nodes.map(v => ({ id: v.id, price: Number(v.price) }))).toEqual(parent.variants.map(v => ({ id: v.id, price: Number(v.price.amount) })));
      expect([...p.tags].sort()).toEqual([...(p.status === 'DRAFT' ? source.find(s => s.id === p.id)!.tags : parent.tags)].sort());
    } else {
      expect(charge).toBeTruthy(); expect(p.title).toBe(charge!.product.title);
      expect(p.variants.nodes.map(v => ({ id: v.id, price: Number(v.price) }))).toEqual([{ id: charge!.id, price: Number(charge!.price) }]);
    }
    const desiredTags = parent?.tags ?? p.tags;
    return { id: p.id, desiredTags, update: p.status !== 'ACTIVE' || JSON.stringify([...p.tags].sort()) !== JSON.stringify([...desiredTags].sort()),
      missingChannels: channels.filter(id => !p.resourcePublications.nodes.some(n => n.isPublished && n.publication.id === id)) };
  });
  await fs.mkdir(output!, { recursive: false });
  const save = (name: string, value: unknown) => fs.writeFile(join(output!, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
  await save('before', { at: new Date().toISOString(), approval: '7bc009b1-0291-4544-9c8a-0ee213b2eacb', before, plans, proof, execute });
  if (!execute) return;
  for (const plan of plans) {
    if (plan.update) {
      const response = await adminFetch<{ productUpdate: { userErrors: unknown[] } }>(`mutation GynoidGoLive($product:ProductUpdateInput!) {
        productUpdate(product:$product) { userErrors { field message } }
      }`, { product: { id: plan.id, status: 'ACTIVE', tags: plan.desiredTags } });
      await save(`active-${plan.id.split('/').at(-1)}`, response); expect(response.productUpdate.userErrors).toEqual([]);
    }
    if (plan.missingChannels.length) {
      const response = await adminFetch<{ publishablePublish: { userErrors: unknown[] } }>(`mutation GynoidPublish($id:ID!,$input:[PublicationInput!]!) {
        publishablePublish(id:$id,input:$input) { userErrors { field message } }
      }`, { id: plan.id, input: plan.missingChannels.map(publicationId => ({ publicationId })) });
      await save(`published-${plan.id.split('/').at(-1)}`, response); expect(response.publishablePublish.userErrors).toEqual([]);
    }
    const after = (await current([plan.id]))[0];
    const extra = after.resourcePublications.nodes.filter(n => n.isPublished && !channels.includes(n.publication.id));
    // Native Agentic review is separate from selected sales channels. Record
    // these existing automatic catalogs, without claiming AI eligibility.
    expect(extra.every(n => automaticCatalogs.get(n.publication.id) === n.publication.name && n.publication.autoPublish)).toBe(true);
    expect(after.status).toBe('ACTIVE'); expect([...after.tags].sort()).toEqual([...plan.desiredTags].sort());
    expect(after.resourcePublications.nodes.filter(n => n.isPublished && channels.includes(n.publication.id)).map(n => n.publication.id).sort()).toEqual([...channels].sort());
    const preserved = (p: Node) => {
      const { status, tags, resourcePublications, ...rest } = p; void status; void tags; void resourcePublications;
      const full = rest as typeof rest & { metafields: { nodes: Array<{ namespace: string; key: string }>; pageInfo: { hasNextPage: boolean } } };
      // The existing product-update webhook owns this IndexNow delivery ledger.
      // Preserve every merchant metafield; retain the ledger in raw evidence.
      return { ...full, metafields: { ...full.metafields, nodes: full.metafields.nodes.filter(m => !(m.namespace === 'app--373284667393--indexnow' && m.key === 'notification_state')) } };
    };
    expect(preserved(after)).toEqual(preserved(before.find(p => p.id === plan.id)!));
    await save(`verified-${plan.id.split('/').at(-1)}`, { at: new Date().toISOString(), after });
  }
  await save('final', { at: new Date().toISOString(), after: await current(), proof, products: 11, charges: 8,
    qualification: 'Exact approved web-store publication. Existing automatic AppCatalog membership is not AI eligibility, live-browser acceptance, delivery guarantee, order or payment.' });
}, 240000);
