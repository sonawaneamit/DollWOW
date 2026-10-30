import { test, expect, vi } from 'vitest';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { isAbsolute, join } from 'node:path';
import type { Product } from '@/types/product';
import type { CustomizationSelections } from '@/types/customization';
import type { ExactUpgradeBinding } from '@/lib/cart/exact-upgrade-lines';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { prepareGynoidTemplateCandidate } from '@/lib/customization/gynoid';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { createVerifiedNamedUpgradeCart, type Request } from '@/lib/cart/exact-upgrade-pilot';

const staged = vi.hoisted(() => new Map<string, Product>());
vi.mock('server-only', () => ({}));
vi.mock('@/lib/shopify/storefront', () => ({ getProductsByVariantIds: async () => staged }));
type Parent = { id: string; handle: string; status: string; tags: string[];
  variants: { nodes: Array<{ id: string; price: string }>; pageInfo: { hasNextPage: boolean } };
  resourcePublications: { nodes: Array<{ isPublished: boolean }>; pageInfo: { hasNextPage: boolean } } };
type CountryNode = { id: string; availableForSale: boolean; price: { amount: string; currencyCode: string } } | null;

test.skipIf(process.env.GYNOID_CHECKOUT_QA !== '1')('stages only retained drafts, checks real carts, and restores every staged product', async () => {
  const output = process.env.GYNOID_CHECKOUT_OUTPUT;
  expect(output && isAbsolute(output)).toBeTruthy();
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  process.env.VERCEL_ENV = 'preview'; process.env.NEXT_PUBLIC_DOL273_RELEASE_PREVIEW = '1';
  const { adminFetch } = await import('@/lib/shopify/admin');
  const { serverValidateAndRepriceLine } = await import('@/lib/cart/server-validation');
  const { gynoidReleasePreviewProducts } = await import('@/lib/catalog/gynoidReleasePreview');
  const saved = JSON.parse(await readFile('data/exports/dol-273-approved-2026-10-30/menu-charge-read-1552/verified.json', 'utf8'));
  const candidate = JSON.parse(await readFile('data/exports/dol-273-approved-2026-10-30/named-upgrades-candidate-1552.json', 'utf8'));
  expect(candidate.releaseStatus).toBe('BLOCKED'); expect(candidate.approval).toBeNull();
  const products = gynoidReleasePreviewProducts(); expect(products).toHaveLength(11);
  const bindings: ExactUpgradeBinding[] = Object.entries(candidate.payload.parents).flatMap(([parentVariantId, group]) =>
    candidate.payload.groups[group as string].map((b: ExactUpgradeBinding) => ({ ...b, parentVariantId })));
  const draftCharges = saved.charges.nodes.filter((n: { product: { status: string } }) => n.product.status === 'DRAFT');
  expect(draftCharges).toHaveLength(8);
  const parentIds = products.map(p => p.id), chargeIds: string[] = draftCharges.map((n: { product: { id: string } }) => n.product.id);
  const ids = [...parentIds, ...chargeIds]; expect(new Set(ids).size).toBe(19);
  // The existing Storefront token did not expose headless-only staging. Both
  // existing storefront channels are required; parents retain test exclusion.
  const publicationInput = ['321446248632', '321372946616'].map(id => ({ publicationId: `gid://shopify/Publication/${id}` }));
  const read = async () => (await adminFetch<{ nodes: Parent[] }>(`query GynoidQaScope($ids:[ID!]!) {
    nodes(ids:$ids) { ... on Product { id handle status tags
      variants(first:3) { nodes { id price } pageInfo { hasNextPage } }
      resourcePublications(first:20) { nodes { isPublished } pageInfo { hasNextPage } }
    } }
  }`, { ids })).nodes;
  const before = await read();
  expect(before).toHaveLength(19);
  for (const p of before) {
    expect(p.status).toBe('DRAFT'); expect(p.tags).not.toContain('dollwow-test');
    expect(p.variants.pageInfo.hasNextPage || p.resourcePublications.pageInfo.hasNextPage).toBe(false);
    expect(p.resourcePublications.nodes.some(n => n.isPublished)).toBe(false);
  }
  for (const product of products) expect(before.find(p => p.id === product.id)?.variants.nodes).toEqual(
    product.variants.map(v => ({ id: v.id, price: Number(v.price.amount).toFixed(2) })));
  await mkdir(output!, { recursive: false });
  const save = (name: string, value: unknown) => writeFile(join(output!, `${name}.json`), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
  await save('before', { at: new Date().toISOString(), approval: '7bc009b1-0291-4544-9c8a-0ee213b2eacb', before });
  const changed: Parent[] = [], results: unknown[] = [], countries: unknown[] = [], restoration: unknown[] = [];
  const mutate = async (query: string, variables: Record<string, unknown>) => {
    const data = await adminFetch<Record<string, { userErrors: unknown[] }>>(query, variables);
    for (const payload of Object.values(data)) expect(payload.userErrors).toEqual([]);
    return data;
  };
  const request: Request = async <T>(query: string, variables: Record<string, unknown>) => {
    const r = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, '')}/api/2026-07/graphql.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN! },
      body: JSON.stringify({ query, variables }), cache: 'no-store'
    });
    const d = await r.json(); if (!r.ok || d.errors?.length) throw new Error(JSON.stringify(d.errors ?? r.status));
    return d.data as T;
  };
  let failure: unknown;
  try {
    for (const p of before) {
      changed.push(p); // Reconcile even an ambiguous mutation response in finally.
      await mutate(`mutation GynoidQaActive($product:ProductUpdateInput!) { productUpdate(product:$product) { userErrors { field message } } }`,
        { product: { id: p.id, status: 'ACTIVE', ...(parentIds.includes(p.id) ? { tags: [...p.tags, 'dollwow-test'] } : {}) } });
      await mutate(`mutation GynoidQaPublish($id:ID!, $input:[PublicationInput!]!) { publishablePublish(id:$id,input:$input) { userErrors { field message } } }`,
        { id: p.id, input: publicationInput });
    }
    const allVariants = [...new Set([...products.flatMap(p => p.variants.map(v => v.id)), ...bindings.map(b => b.merchandiseId)])];
    const countryData = new Map<string, CountryNode[]>();
    for (const country of ['US', 'DE', 'GB', 'FR']) {
      const data = await request<{ nodes: CountryNode[] }>(`query($ids:[ID!]!,$country:CountryCode!) @inContext(country:$country) {
        nodes(ids:$ids) { ... on ProductVariant { id availableForSale price { amount currencyCode } } }
      }`, { ids: allVariants, country }, { cache: 'no-store' });
      countryData.set(country, data.nodes);
      countries.push({ country, requested: allVariants.length, available: data.nodes.filter(n => n?.availableForSale).length,
        unavailableIds: allVariants.filter(id => !data.nodes.some(n => n?.id === id && n.availableForSale)),
        currencies: [...new Set(data.nodes.flatMap(n => n ? [n.price.currencyCode] : []))] });
    }
    await save('countries', { at: new Date().toISOString(), countries });
    expect(countryData.get('US')!.filter(n => n?.availableForSale)).toHaveLength(23);
    for (const product of products) {
      const live = countryData.get('US')!;
      product.variants.forEach(v => { v.availableForSale = Boolean(live.find(n => n?.id === v.id)?.availableForSale); });
      product.variants.forEach(v => staged.set(v.id, product));
      const config = getCustomizationConfig(product), defaults = getDefaultSelections(config);
      for (const variant of product.variants) {
        const base = Number(variant.price.amount), recipe = prepareGynoidTemplateCandidate(product, config)!;
        const cases: Array<{ name: string; selections: CustomizationSelections }> = templateConfigurationPresets(recipe, config, config, base, defaults).map(p => ({ name: p.id, selections: p.selections }));
        if (product === products[0] && variant === product.variants[0]) {
          for (const group of config.groups) for (const option of group.options.filter(o => (o.priceDelta ?? 0) > 0)) {
            const selections = { ...defaults, [group.id]: [option.id], ...(option.id === 'implanted-synthetic-hair' ? { 'implanted-hair-color': 'black' } : {}) };
            cases.push({ name: option.id, selections: resolveCustomization(config, selections, base).selections });
          }
        }
        for (const c of cases) {
          const line = await serverValidateAndRepriceLine({ merchandiseId: variant.id, quantity: 1, selections: c.selections });
          const cart = await createVerifiedNamedUpgradeCart([line], ['HALLOWEEN299'], request, bindings);
          const data = await request<{ cart: { cost: { subtotalAmount: { amount: string; currencyCode: string } }; discountCodes: Array<{ code: string; applicable: boolean }> } }>(
            `query($id:ID!) { cart(id:$id) { cost { subtotalAmount { amount currencyCode } } discountCodes { code applicable } } }`, { id: cart.id }, { cache: 'no-store' });
          expect(data.cart.cost.subtotalAmount.currencyCode).toBe('USD');
          expect(Number(data.cart.cost.subtotalAmount.amount)).toBe(base + (line.customizationCharge?.amount ?? 0));
          expect(data.cart.discountCodes.find(d => d.code === 'HALLOWEEN299')?.applicable).toBe(false);
          results.push({ handle: product.handle, variantId: variant.id, case: c.name, cartId: cart.id,
            total: data.cart.cost.subtotalAmount, discountExcluded: true });
          await save(`cart-${results.length}`, results.at(-1));
        }
      }
    }
  } catch (error) { failure = error; }
  finally {
    for (const p of changed.reverse()) {
      try {
        await mutate(`mutation GynoidQaUnpublish($id:ID!,$input:[PublicationInput!]!) { publishableUnpublish(id:$id,input:$input) { userErrors { field message } } }`,
          { id: p.id, input: publicationInput });
        await mutate(`mutation GynoidQaRestore($product:ProductUpdateInput!) { productUpdate(product:$product) { userErrors { field message } } }`,
          { product: { id: p.id, status: p.status, tags: p.tags } });
        restoration.push({ id: p.id, restored: true });
      } catch (error) { restoration.push({ id: p.id, restored: false, error: String(error) }); }
    }
    const after = await read();
    const preserved = after.every(p => {
      const original = before.find(v => v.id === p.id)!;
      return p.status === original.status && JSON.stringify([...p.tags].sort()) === JSON.stringify([...original.tags].sort()) &&
        JSON.stringify(p.variants) === JSON.stringify(original.variants) && !p.resourcePublications.nodes.some(n => n.isPublished) && !p.resourcePublications.pageInfo.hasNextPage;
    });
    await save('final', { at: new Date().toISOString(), results, countries, restoration, after, preserved,
      failure: failure ? String(failure) : null, shippingVerified: false,
      qualification: 'Actual Shopify merchandise/carts with intended local server repricing and actual US availability; not deployed browser or settled shipping/tax proof. No order/payment/email/settings.' });
    expect(preserved, 'Restore exact drafts before any further release work').toBe(true);
    expect(restoration.every((r: unknown) => (r as { restored: boolean }).restored)).toBe(true);
  }
  if (failure) throw failure;
  expect(results).toHaveLength(49);
}, 480000);
