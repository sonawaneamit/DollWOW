import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { getCustomizationConfig, getFactoryCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import type { CustomizationGroup } from '@/types/customization';

const option = (id: string, priceDelta = 0) => ({ id, label: id, priceDelta, priceVerified: true });
const rule = (groupId: string, optionId: string) => ({ groupId, optionId });
function groups(): CustomizationGroup[] {
  return [
    { id: 'body-material', label: 'Body Material', display: 'compact', options: [option('silicone-body')] },
    { id: 'finish', label: 'Finish', display: 'compact', options: [option('standard'), option('premium', 125)], visibleWhen: [[rule('body-material', 'silicone-body')]] },
    { id: 'unrelated', label: 'Unrelated', display: 'compact', options: [option('fixed')] }
  ];
}
function product(menu: CustomizationGroup[]) {
  return mapShopifyProduct({
    id: 'gid://shopify/Product/1', handle: 'fu-regression', title: 'FUDOLL regression',
    description: '', vendor: 'FUDOLL', productType: 'Custom Silicone doll', tags: [],
    featuredImage: null, images: { edges: [] }, variants: { edges: [] },
    priceRange: { minVariantPrice: { amount: '2000', currencyCode: 'USD' }, maxVariantPrice: { amount: '2000', currencyCode: 'USD' } },
    customizationGroups: { value: JSON.stringify(menu) }
  });
}

describe('imported singleton dependencies', () => {
  it('preserves the mapped fixed parent, defaults, paid selection and original menu', () => {
    const p = product(groups()), before = JSON.stringify(p);
    const config = getCustomizationConfig(p);
    expect(config.groups.map(g => g.id)).toEqual(['body-material', 'finish']);
    expect(config.groups[0].options[0]).toMatchObject(option('silicone-body'));
    expect(getDefaultSelections(config)).toEqual({ 'body-material': 'silicone-body', finish: 'standard' });
    const result = resolveCustomization(config, { ...getDefaultSelections(config), finish: 'premium' }, 2000);
    expect(result).toMatchObject({ issues: [], totalPrice: 2125, requiresPriceConfirmation: false });
    expect(result.cartAttributes).toContainEqual({ key: 'DollWow Finish', value: 'premium (+$125)' });
    expect(getFactoryCustomizationConfig(p).groups.map(g => g.id)).toEqual(['body-material', 'finish']);
    expect(JSON.stringify(p)).toBe(before);
  });

  it('retains a singleton ancestor chain but never charges a hidden branch', () => {
    const menu = groups();
    menu.unshift({ id: 'mode', label: 'Mode', display: 'compact', options: [option('shown'), option('hidden')] });
    menu[1].visibleWhen = [[rule('mode', 'shown')]];
    const config = getCustomizationConfig(product(menu));
    expect(resolveCustomization(config, { mode: 'shown', finish: 'premium' }, 2000)).toMatchObject({ issues: [], totalPrice: 2125 });
    const hidden = resolveCustomization(config, { mode: 'hidden', finish: 'premium' }, 2000);
    expect(hidden).toMatchObject({ issues: [], totalPrice: 2000 });
    expect(hidden.selections).not.toHaveProperty('finish');
    expect(hidden.cartAttributes.some(a => a.key === 'DollWow Finish')).toBe(false);
  });

  it('keeps an orderable parent reduced to one option during checkout filtering', () => {
    const menu = groups();
    menu[0].options.push({ id: 'unknown', label: 'Unknown price' });
    expect(getCustomizationConfig(product(menu)).groups[0].options).toHaveLength(1);
    expect(getFactoryCustomizationConfig(product(menu)).groups[0].options).toHaveLength(2);
  });

  it.each(['unknown-price', 'unverified', 'unavailable', 'missing-parent', 'missing-option', 'cycle', 'malformed'])('fails closed for %s', kind => {
    const menu = groups();
    if (kind === 'unknown-price') menu[0].options = [{ id: 'silicone-body', label: 'Silicone Body' }];
    if (kind === 'unverified') menu[0].options[0].priceVerified = false;
    if (kind === 'unavailable') menu[0].options[0].purchasable = false;
    if (kind === 'missing-parent') menu.shift();
    if (kind === 'missing-option') menu[0].options[0].id = 'different';
    if (kind === 'cycle') menu[0].visibleWhen = [[rule('finish', 'standard')]];
    if (kind === 'malformed') menu[1].visibleWhen = [null] as unknown as CustomizationGroup['visibleWhen'];
    const result = resolveCustomization(getCustomizationConfig(product(menu)), {}, 2000);
    expect(result.issues.length > 0 || result.requiresPriceConfirmation).toBe(true);
  });
});

it.skipIf(!process.env.DOLLVUE_DEPENDENCY_RECHECK_ROOT)('rechecks four FUDOLL and ten TOP blockers via read-only Admin query', async () => {
  const root = process.env.DOLLVUE_DEPENDENCY_RECHECK_ROOT!;
  const bytes = readFileSync(`${root}/top-cydoll-family-preparation/ready-checkout-menu-diagnostics-v3.json`);
  const previous = JSON.parse(bytes.toString()) as { rows: Array<{ id: string; index: number; issues: unknown[] }> };
  const top = previous.rows.filter(r => r.issues.length);
  expect(top).toHaveLength(10);
  const ids = ['10638363754680', '10638363852984', '10638363951288', '10638364049592'].map(id => `gid://shopify/Product/${id}`).concat(top.map(r => r.id));
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe(process.env.SHOPIFY_STORE_DOMAIN);
    if (url.pathname.endsWith('/graphql.json')) {
      const body = JSON.parse(String(init?.body));
      expect(body.query).toMatch(/^query\b/);
      expect(body.query).not.toMatch(/\bmutation\b/);
    } else expect(url.pathname).toBe('/admin/oauth/access_token');
    return nativeFetch(input, init);
  });
  try {
    const { adminFetch } = await import('@/lib/shopify/admin');
    type Node = Parameters<typeof mapShopifyProduct>[0];
    type AdminNode = Omit<Node, 'variants' | 'priceRange'> & { status: string; variants: { edges: Array<{ node: { id: string; title: string; availableForSale: boolean; price: string; selectedOptions: Array<{ name: string; value: string }> } }> } };
    const data = await adminFetch<{ nodes: AdminNode[]; shop: { currencyCode: string } }>(`query SingletonDependencyAudit($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle title description vendor productType tags status featuredImage{url} images(first:1){edges{node{url}}} brand:metafield(namespace:"custom",key:"brand"){value} material:metafield(namespace:"custom",key:"material"){value} stockStatus:metafield(namespace:"custom",key:"stock_status"){value} customizationGroups:metafield(namespace:"custom",key:"customization_groups"){value} variants(first:1){edges{node{id title availableForSale price selectedOptions{name value}}}}}} shop{currencyCode}}`, { ids });
    expect(data.nodes.map(n => n.id)).toEqual(ids);
    const rows = data.nodes.map(n => {
      const price = { amount: n.variants.edges[0].node.price, currencyCode: data.shop.currencyCode };
      const p = mapShopifyProduct({ ...n, priceRange: { minVariantPrice: price, maxVariantPrice: price }, variants: { edges: n.variants.edges.map(({ node }) => ({ node: { ...node, price } })) } });
      const before = JSON.stringify(p);
      const config = getCustomizationConfig(p), result = resolveCustomization(config, getDefaultSelections(config), Number(price.amount));
      expect(JSON.stringify(p)).toBe(before);
      return { id: n.id, status: n.status, menuSha256: createHash('sha256').update(n.customizationGroups!.value!).digest('hex'), issues: result.issues, requiresPriceConfirmation: result.requiresPriceConfirmation, totalPrice: result.totalPrice, singletonParents: config.groups.filter(g => g.options.length === 1).map(g => g.id) };
    });
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), diagnosticsSha256: createHash('sha256').update(bytes).digest('hex'), rows, mutations: 0, generationCalls: 0 }));
    expect(rows.every(r => r.issues.length === 0)).toBe(true);
    expect(rows.every(r => !r.requiresPriceConfirmation)).toBe(true);
    expect(rows.slice(0, 4).every(r => r.singletonParents.includes('body-material'))).toBe(true);
    expect(rows.slice(4).every(r => r.singletonParents.includes('head') || r.singletonParents.includes('ros-head'))).toBe(true);
  } finally { vi.unstubAllGlobals(); }
}, 120000);
