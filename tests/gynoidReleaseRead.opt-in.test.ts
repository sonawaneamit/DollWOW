import { test, expect, vi } from 'vitest';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { isAbsolute, join } from 'node:path';
import reviewed from '@/data/catalog/gynoid-approved-configurations.json';
import type { Product } from '@/types/product';
import type { CustomizationGroup } from '@/types/customization';
import type { ExactUpgradeBinding } from '@/lib/cart/exact-upgrade-lines';
import { gynoidProductFixture } from './fixtures/gynoid-product';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { prepareGynoidTemplateCandidate } from '@/lib/customization/gynoid';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';

const mocked = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getProductsByVariantIds: mocked.lookup }));

type Node = {
  id: string; handle: string; title: string; vendor: string; productType: string; status: string; tags: string[];
  menu: { value: string; definition: { access: { storefront: string } } | null } | null;
  head: { value: string } | null;
  variants: { nodes: Array<{ id: string; title: string; price: string; selectedOptions: Array<{ name: string; value: string }> }>;
    pageInfo: { hasNextPage: boolean } };
  resourcePublications: { nodes: Array<{ isPublished: boolean }>; pageInfo: { hasNextPage: boolean } };
};

test.skipIf(process.env.GYNOID_RELEASE_READ !== '1')('reads exact current parents/charges and exercises local server repricing without carts or writes', async () => {
  const output = process.env.GYNOID_RELEASE_READ_OUTPUT, source = process.env.GYNOID_BINDINGS_SOURCE;
  expect(output && isAbsolute(output)).toBeTruthy(); expect(source && isAbsolute(source)).toBeTruthy();
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const { adminFetch } = await import('@/lib/shopify/admin');
  const { serverValidateAndRepriceLine } = await import('@/lib/cart/server-validation');
  const prior = process.env.GYNOID_RELEASE_READ_FROM
    ? JSON.parse(await readFile(process.env.GYNOID_RELEASE_READ_FROM, 'utf8')) as {
      at: string; adminReadAt?: string; current: { shop: { currencyCode: string }; nodes: Node[] };
      charges: { nodes: Array<{ id: string; price: string; inventoryItem: { requiresShipping: boolean };
        product: { id: string; title: string; status: string } }> };
    } : null;
  const saved = JSON.parse(await readFile(source!, 'utf8')) as { rows: Array<{ bindings: ExactUpgradeBinding[] }> };
  const bindings = [...new Map(saved.rows.flatMap(row => row.bindings).map(binding => [binding.merchandiseId, binding])).values()];
  expect(bindings).toHaveLength(10);
  const current = prior?.current ?? await adminFetch<{ shop: { currencyCode: string }; nodes: Node[] }>(`query GynoidCurrentMenus($ids: [ID!]!) {
    shop { currencyCode }
    nodes(ids: $ids) { ... on Product {
      id handle title vendor productType status tags
      menu: metafield(namespace: "custom", key: "customization_groups") { value definition { access { storefront } } }
      head: metafield(namespace: "custom", key: "head_model") { value }
      variants(first: 3) { nodes { id title price selectedOptions { name value } } pageInfo { hasNextPage } }
      resourcePublications(first: 10) { nodes { isPublished } pageInfo { hasNextPage } }
    } }
  }`, { ids: reviewed.products.map(row => row.productId) });
  expect(current.shop.currencyCode).toBe('USD');
  const charges = prior?.charges ?? await adminFetch<{ nodes: Array<{ id: string; price: string;
    inventoryItem: { requiresShipping: boolean }; product: { id: string; title: string; status: string } }> }>(
    `query GynoidCurrentCharges($ids: [ID!]!) {
      nodes(ids: $ids) { ... on ProductVariant { id price inventoryItem { requiresShipping } product { id title status } } }
    }`, { ids: bindings.map(binding => binding.merchandiseId) });
  await mkdir(output!, { recursive: true });
  const evidence: Record<string, unknown> = { at: new Date().toISOString(), adminReadAt: prior?.adminReadAt ?? prior?.at ?? new Date().toISOString(),
    reusedAdminSnapshot: Boolean(prior), current, charges, source,
    qualification: 'Read-only Admin evidence plus local server calls with simulated publication availability. No Storefront/cart/browser/discount/country/shipping acceptance.',
    shopifyWrites: 0, carts: 0, releaseStatus: 'BLOCKED', results: [] };
  await writeFile(join(output!, 'before.json'), JSON.stringify(evidence, null, 2), { flag: 'wx', mode: 0o600 });
  expect(current.nodes).toHaveLength(11);
  const results: unknown[] = [];
  for (const [index, row] of reviewed.products.entries()) {
    const node = current.nodes.find(node => node?.id === row.productId && node.handle === row.handle)!;
    expect(node?.status).toBe('DRAFT'); expect(node.head?.value).toBe(row.headModel);
    expect(node.resourcePublications.pageInfo.hasNextPage).toBe(false);
    expect(node.resourcePublications.nodes.every(p => !p.isPublished)).toBe(true);
    expect(node.variants.pageInfo.hasNextPage).toBe(false);
    expect(node.variants.nodes[0].id).toBe(row.standardVariantId);
    expect(Number(node.variants.nodes[0].price)).toBe(row.standardUSD);
    expect(node.menu?.definition?.access.storefront).toBe('PUBLIC_READ');
    const product: Product = { id: node.id, handle: node.handle, title: node.title, description: '', vendor: node.vendor,
      productType: node.productType, tags: node.tags, featuredImage: null, images: [],
      variants: node.variants.nodes.map(v => ({ ...v, availableForSale: true, price: { amount: v.price, currencyCode: 'USD' } })),
      priceRange: { minVariantPrice: { amount: node.variants.nodes[0].price, currencyCode: 'USD' },
        maxVariantPrice: { amount: node.variants.nodes.at(-1)!.price, currencyCode: 'USD' } },
      extended: { brand: 'Gynoid', headModel: node.head?.value, stockStatus: 'custom', customAvailable: true,
        customizationGroups: JSON.parse(node.menu!.value) as CustomizationGroup[] } };
    const config = getCustomizationConfig(product), fixture = getCustomizationConfig(gynoidProductFixture(index));
    expect(config).toEqual(fixture);
    const defaults = getDefaultSelections(config), recipe = prepareGynoidTemplateCandidate(product, config)!;
    mocked.lookup.mockResolvedValue(new Map(product.variants.map(v => [v.id, product])));
    for (const variant of product.variants) {
      const base = Number(variant.price.amount);
      const presets = templateConfigurationPresets(recipe, config, config, base, defaults);
      expect(presets.map(p => p.totalPrice)).toEqual([base, base + 150, base + 250]);
      for (const preset of presets) {
        const result = await serverValidateAndRepriceLine({ merchandiseId: variant.id, quantity: 1, selections: preset.selections });
        expect(result.customizationCharge?.amount ?? 0).toBe(preset.totalPrice - base);
        expect(result.namedUpgradeAttributes).toBeDefined();
        results.push({ handle: row.handle, variantId: variant.id, preset: preset.id, base, charge: result.customizationCharge ?? null });
      }
      for (const group of config.groups) for (const option of group.options.filter(option => (option.priceDelta ?? 0) > 0)) {
        const selections = { ...defaults, [group.id]: [option.id],
          ...(option.id === 'implanted-synthetic-hair' ? { 'implanted-hair-color': 'black' } : {}) };
        const resolved = resolveCustomization(config, selections, base);
        expect(resolved.issues).toEqual([]);
        const result = await serverValidateAndRepriceLine({ merchandiseId: variant.id, quantity: 1, selections });
        expect(result.customizationCharge?.amount).toBe(option.priceDelta);
        expect(result.namedUpgradeAttributes).toBeDefined();
        const item = result.customizationCharge!.items[0];
        const binding = bindings.find(b => b.group === item.group && b.label === item.label && b.unitAmount === item.amount);
        expect(binding, `${row.handle}: ${item.label}`).toBeTruthy();
        const charge = charges.nodes.find(v => v?.id === binding!.merchandiseId)!;
        expect(Number(charge?.price)).toBe(item.amount);
        expect(charge.product.title).toBe(binding!.productTitle);
        expect(charge.inventoryItem.requiresShipping).toBe(false);
        results.push({ handle: row.handle, variantId: variant.id, optionId: option.id, base, charge: result.customizationCharge });
      }
    }
  }
  await writeFile(join(output!, 'verified.json'), JSON.stringify({ ...evidence, results }, null, 2), { flag: 'wx', mode: 0o600 });
}, 180000);
