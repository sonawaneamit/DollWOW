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
import { templateRuntimeHash } from '@/lib/customization/template-release-registry';
import { importedProductionNoteSignals, sanitizeImportedProductionNote } from '@/lib/customization/production-notes';

const staged = vi.hoisted(() => new Map<string, Product>());
vi.mock('server-only', () => ({}));
vi.mock('@/lib/shopify/storefront', () => ({ getProductsByVariantIds: async () => staged }));
type Parent = { id: string; handle: string; status: string; tags: string[];
  category: { id: string } | null;
  variants: { nodes: Array<{ id: string; price: string }>; pageInfo: { hasNextPage: boolean } };
  resourcePublications: { nodes: Array<{ isPublished: boolean }>; pageInfo: { hasNextPage: boolean } } };
type CountryNode = { id: string; availableForSale: boolean; price: { amount: string; currencyCode: string } } | null;

test.skipIf(process.env.GYNOID_CHECKOUT_QA !== '1')('stages only retained drafts, checks real carts, and restores every staged product', async () => {
  const output = process.env.GYNOID_CHECKOUT_OUTPUT;
  const eligibilityOnly = process.env.GYNOID_ELIGIBILITY_ONLY === '1';
  const shippingOnly = process.env.GYNOID_SHIPPING_ONLY === '1';
  const sourceOnly = process.env.GYNOID_SOURCE_ONLY === '1';
  expect([eligibilityOnly, shippingOnly, sourceOnly].filter(Boolean).length).toBeLessThanOrEqual(1);
  expect(output && isAbsolute(output)).toBeTruthy();
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  process.env.VERCEL_ENV = 'preview'; process.env.NEXT_PUBLIC_DOL273_RELEASE_PREVIEW = '1';
  const { adminFetch } = await import('@/lib/shopify/admin');
  const { serverValidateAndRepriceLine } = await import('@/lib/cart/server-validation');
  const { gynoidReleasePreviewProducts } = await import('@/lib/catalog/gynoidReleasePreview');
  if (sourceOnly) {
    const { isHiddenCatalogBrand } = await import('@/lib/catalog/brands');
    expect(isHiddenCatalogBrand('gynoid'), 'Source QA must start with preview flags already set before module initialization').toBe(false);
  }
  const saved = JSON.parse(await readFile('data/exports/dol-273-approved-2026-10-30/menu-charge-read-1552/verified.json', 'utf8'));
  const candidate = JSON.parse(await readFile('data/exports/dol-273-approved-2026-10-30/named-upgrades-candidate-1552.json', 'utf8'));
  expect(candidate.releaseStatus).toBe('BLOCKED'); expect(candidate.approval).toBeNull();
  const products = gynoidReleasePreviewProducts(); expect(products).toHaveLength(11);
  const bindings: ExactUpgradeBinding[] = Object.entries(candidate.payload.parents).flatMap(([parentVariantId, group]) =>
    candidate.payload.groups[group as string].map((b: ExactUpgradeBinding) => ({ ...b, parentVariantId })));
  const draftCharges = saved.charges.nodes.filter((n: { product: { status: string } }) => n.product.status === 'DRAFT');
  expect(draftCharges).toHaveLength(8);
  const qaProducts = shippingOnly ? products.filter(p => p.handle === 'gynoid-lisa-170cm-silicone-companion-doll-model-13') : products;
  expect(qaProducts).toHaveLength(shippingOnly ? 1 : 11);
  const parentIds = qaProducts.map(p => p.id), chargeIds: string[] = draftCharges.map((n: { product: { id: string } }) => n.product.id);
  const ids = eligibilityOnly ? chargeIds : sourceOnly ? parentIds : [...parentIds, ...chargeIds];
  expect(new Set(ids).size).toBe(eligibilityOnly ? 8 : sourceOnly ? 11 : shippingOnly ? 9 : 19);
  // The existing Storefront token did not expose headless-only staging. Both
  // existing storefront channels are required; parents retain test exclusion.
  const publicationInput = ['321446248632', '321372946616'].map(id => ({ publicationId: `gid://shopify/Publication/${id}` }));
  const read = async () => (await adminFetch<{ nodes: Parent[] }>(`query GynoidQaScope($ids:[ID!]!) {
    nodes(ids:$ids) { ... on Product { id handle status tags category { id }
      variants(first:3) { nodes { id price } pageInfo { hasNextPage } }
      resourcePublications(first:20) { nodes { isPublished } pageInfo { hasNextPage } }
    } }
  }`, { ids })).nodes;
  const before = await read();
  expect(before).toHaveLength(ids.length);
  for (const p of before) {
    expect(p.status).toBe('DRAFT'); expect(p.tags).not.toContain('dollwow-test');
    expect(p.variants.pageInfo.hasNextPage || p.resourcePublications.pageInfo.hasNextPage).toBe(false);
    expect(p.resourcePublications.nodes.some(n => n.isPublished)).toBe(false);
    if (eligibilityOnly) expect(p.category?.id).toBe('gid://shopify/TaxonomyCategory/ma-1-4');
  }
  for (const product of eligibilityOnly ? [] : qaProducts) expect(before.find(p => p.id === product.id)?.variants.nodes).toEqual(
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
    const allVariants: string[] = sourceOnly ? qaProducts.flatMap(p => p.variants.map(v => v.id)) : eligibilityOnly ? draftCharges.map((n: { id: string }) => n.id)
      : [...new Set([...qaProducts.flatMap(p => p.variants.map(v => v.id)), ...bindings.map(b => b.merchandiseId)])];
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
    expect(countryData.get('US')!.filter(n => n?.availableForSale)).toHaveLength(allVariants.length);
    for (const product of eligibilityOnly || shippingOnly || sourceOnly ? [] : qaProducts) {
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
    if (sourceOnly) {
      // Exercise the real strict Shopify mapper, never the dated private draft fallback.
      vi.doMock('@/lib/catalog/privateDraftPreview', () => ({ getPrivateDraftPreview: async () => null }));
      const actual = await vi.importActual<typeof import('@/lib/shopify/storefront')>('@/lib/shopify/storefront');
      const checkout = await actual.getProductsByVariantIds(allVariants);
      expect(checkout.size).toBe(13);
      const sourceProducts: Product[] = [];
      for (const expected of qaProducts) {
        const product = await actual.getProductByHandle(expected.handle, { cache: 'no-store', strict: true });
        await save(`source-observed-${sourceProducts.length + 1}`, product);
        expect(product?.id).toBe(expected.id); expect(product!.tags).toContain('dollwow-test');
        expect(product!.variants.map(v => ({ id: v.id, amount: Number(v.price.amount), currency: v.price.currencyCode })))
          .toEqual(expected.variants.map(v => ({ id: v.id, amount: Number(v.price.amount), currency: v.price.currencyCode })));
        expect(product!.variants.every(v => v.availableForSale)).toBe(true);
        const config = getCustomizationConfig(product!);
        // The established production mapper derives annotations from note text;
        // old preview fixtures also carry pre-parsed default-only annotations.
        const normalizedExpected = structuredClone(expected);
        normalizedExpected.extended.customizationGroups?.forEach(g => g.options.forEach(o => {
          o.sourceProductionNoteSignals = importedProductionNoteSignals(o.productionNote);
          o.productionNote = sanitizeImportedProductionNote(o.productionNote);
        }));
        expect(JSON.parse(JSON.stringify(config))).toEqual(JSON.parse(JSON.stringify(getCustomizationConfig(normalizedExpected))));
        expect(getDefaultSelections(config)).toEqual(getDefaultSelections(getCustomizationConfig(expected)));
        const tiers = product!.variants.map(v => {
          const checkoutProduct = checkout.get(v.id)!;
          expect(JSON.parse(JSON.stringify(getCustomizationConfig(checkoutProduct)))).toEqual(JSON.parse(JSON.stringify(config)));
          expect(checkoutProduct.variants.some(row => row.id === v.id && row.availableForSale)).toBe(true);
          const base = Number(v.price.amount);
          const presets = templateConfigurationPresets(prepareGynoidTemplateCandidate(product!, config)!, config, config, base, getDefaultSelections(config));
          expect(presets.map(p => p.totalPrice)).toEqual([base, base + 150, base + 250]);
          return { variantId: v.id, totals: presets.map(p => p.totalPrice) };
        });
        // Only the temporary QA exclusion tag is removed from the saved release candidate.
        const candidateProduct = structuredClone(product!);
        candidateProduct.tags = candidateProduct.tags.filter(tag => tag !== 'dollwow-test');
        sourceProducts.push(candidateProduct);
        results.push({ handle: product!.handle, tiers, runtimeHash: templateRuntimeHash(candidateProduct, config) });
        await save(`source-${sourceProducts.length}`, { product: candidateProduct, result: results.at(-1) });
      }
      await save('source-products', sourceProducts);
    }
    if (shippingOnly) {
      const product = qaProducts[0], variant = product.variants.find(v => v.title === 'Deluxe')!;
      product.variants.forEach(v => { v.availableForSale = Boolean(countryData.get('US')!.find(n => n?.id === v.id)?.availableForSale); staged.set(v.id, product); });
      const config = getCustomizationConfig(product), base = Number(variant.price.amount);
      const preset = templateConfigurationPresets(prepareGynoidTemplateCandidate(product, config)!, config, config, base, getDefaultSelections(config))[2];
      const destinations = [
        { countryCode: 'US', city: 'New York', zip: '10001', provinceCode: 'NY' },
        { countryCode: 'DE', city: 'Berlin', zip: '10115' },
        { countryCode: 'GB', city: 'London', zip: 'SW1A 1AA' },
        { countryCode: 'FR', city: 'Paris', zip: '75001' }
      ];
      for (const destination of destinations) {
        const line = await serverValidateAndRepriceLine({ merchandiseId: variant.id, quantity: 1, selections: preset.selections });
        const cart = await createVerifiedNamedUpgradeCart([line], ['HALLOWEEN299'], request, bindings);
        const identity = await request<{ cartBuyerIdentityUpdate: { userErrors: unknown[] } }>(
          `mutation($id:ID!,$buyerIdentity:CartBuyerIdentityInput!) { cartBuyerIdentityUpdate(cartId:$id,buyerIdentity:$buyerIdentity) { userErrors { message } } }`,
          { id: cart.id, buyerIdentity: { countryCode: destination.countryCode } }, { cache: 'no-store' });
        expect(identity.cartBuyerIdentityUpdate.userErrors).toEqual([]);
        // Postal/country-only synthetic QA: no person, street, email or phone.
        // These rates cannot establish deliverability or final tax at a full address.
        const address = await request<{ cartDeliveryAddressesAdd: { userErrors: unknown[] } }>(
          `mutation($id:ID!,$addresses:[CartSelectableAddressInput!]!) { cartDeliveryAddressesAdd(cartId:$id,addresses:$addresses) { userErrors { message } } }`,
          { id: cart.id, addresses: [{ selected: true, oneTimeUse: true, address: { deliveryAddress: destination } }] }, { cache: 'no-store' });
        expect(address.cartDeliveryAddressesAdd.userErrors).toEqual([]);
        const data = await request<{ cart: { buyerIdentity: { countryCode: string }; checkoutUrl: string;
          cost: { subtotalAmount: { amount: string; currencyCode: string }; totalAmount: { amount: string; currencyCode: string } };
          discountCodes: Array<{ code: string; applicable: boolean }>;
          lines: { nodes: Array<{ quantity: number; merchandise: { id: string; price: { amount: string; currencyCode: string } } }> };
          deliveryGroups: { nodes: Array<{ deliveryOptions: Array<{ title: string; estimatedCost: { amount: string; currencyCode: string } }> }> } } }>(
          `query($id:ID!) { cart(id:$id) { buyerIdentity { countryCode } checkoutUrl
            cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
            discountCodes { code applicable }
            lines(first:20) { nodes { quantity merchandise { ... on ProductVariant { id price { amount currencyCode } } } } }
            deliveryGroups(first:10) { nodes { deliveryOptions { title estimatedCost { amount currencyCode } } } }
          } }`, { id: cart.id }, { cache: 'no-store' });
        await save(`shipping-${destination.countryCode}`, { at: new Date().toISOString(), destination, cartId: cart.id, data });
        expect(data.cart.buyerIdentity.countryCode).toBe(destination.countryCode);
        expect(data.cart.lines.nodes).toHaveLength(3);
        expect(Number(data.cart.cost.subtotalAmount.amount)).toBeCloseTo(data.cart.lines.nodes.reduce((sum, l) => sum + Number(l.merchandise.price.amount) * l.quantity, 0), 2);
        expect(data.cart.discountCodes.find(d => d.code === 'HALLOWEEN299')?.applicable).toBe(false);
        const options = data.cart.deliveryGroups.nodes.flatMap(g => g.deliveryOptions);
        results.push({ country: destination.countryCode, cartId: cart.id, cost: data.cart.cost, options,
          qualification: 'Actual postal/country-only static rate response; not full-address deliverability, carrier-calculated rates or settled tax/duty.' });
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
        JSON.stringify(p.variants) === JSON.stringify(original.variants) && JSON.stringify(p.category) === JSON.stringify(original.category) &&
        !p.resourcePublications.nodes.some(n => n.isPublished) && !p.resourcePublications.pageInfo.hasNextPage;
    });
    await save('final', { at: new Date().toISOString(), results, countries, restoration, after, preserved,
      failure: failure ? String(failure) : null, eligibilityOnly, shippingOnly, sourceOnly, shippingVerified: false,
      qualification: 'Actual Shopify merchandise/carts with intended local server repricing and actual US availability; not deployed browser or settled shipping/tax proof. No order/payment/email/settings.' });
    expect(preserved, 'Restore exact drafts before any further release work').toBe(true);
    expect(restoration.every((r: unknown) => (r as { restored: boolean }).restored)).toBe(true);
  }
  if (failure) throw failure;
  expect(results).toHaveLength(eligibilityOnly ? 0 : sourceOnly ? 11 : shippingOnly ? 4 : 49);
}, 480000);
