import { expect, test, vi } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { grace160TemplateRecipe } from '@/lib/customization/grace160-template';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';

const handle = 'top-fire-doll-grace-160cm-f-cup-silicone-customizable-companion-doll';

test.skipIf(process.env.DOLLWOW_GRACE_REAL_CART !== '1')('verifies the three Grace package carts against Shopify', async () => {
  vi.stubEnv('DOLLWOW_TEMPLATE_RELEASE', '1');
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('NEXT_PUBLIC_DOL333_PREVIEW', '0');
  try {
    const { getProductByHandle, createCart } = await import('@/lib/shopify/storefront');
    const { serverValidateAndRepriceLine } = await import('@/lib/cart/server-validation');
    const product = await getProductByHandle(handle, { cache: 'no-store', strict: true });
    expect(product?.id).toBe('gid://shopify/Product/10699019059384');
    expect(product?.tags.includes('dollwow-test')).toBe(true);
    const config = getCustomizationConfig(product!);
    const recipe = grace160TemplateRecipe(product!, config, true);
    expect(recipe).toBeTruthy();
    const tiers = templateConfigurationPresets(recipe!, config, config, 2299, {});
    expect(tiers.map(tier => tier.totalPrice)).toEqual([2366, 2634, 3011]);
    const receipts = [];
    for (const [index, tier] of tiers.entries()) {
      const merchandiseId = product!.variants[0].id;
      const line = await serverValidateAndRepriceLine({ merchandiseId, quantity: 1, selections: tier.selections });
      expect(line.customizationCharge?.amount).toBe(tier.totalPrice - 2299);
      const cart = await createCart(line);
      expect(cart.id).not.toBe('mock-cart');
      expect(new URL(cart.checkoutUrl).hostname).toBe('checkout.dollwow.com');
      const domain = process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, '');
      const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...storefrontAuthHeaders(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!) },
        body: JSON.stringify({ query: `query($id:ID!){cart(id:$id){cost{subtotalAmount{amount currencyCode}}
          lines(first:20){nodes{id quantity ... on CartLine{parentRelationship{parent{id}}}
          merchandise{... on ProductVariant{id product{title} price{amount currencyCode} requiresShipping}}}}}}`, variables: { id: cart.id } })
      });
      const result = await response.json();
      expect(response.ok && !result.errors).toBe(true);
      const readback = result.data.cart;
      const rows = readback.lines.nodes;
      expect(rows).toHaveLength([4, 6, 9][index]);
      const parent = rows.find((row: { merchandise: { id: string } }) => row.merchandise.id === merchandiseId);
      expect(parent?.merchandise.price).toEqual({ amount: '2299.0', currencyCode: 'USD' });
      const upgrades = rows.filter((row: { id: string }) => row.id !== parent.id);
      for (const row of upgrades) {
        expect(row.parentRelationship?.parent.id).toBe(parent.id);
        expect(row.quantity).toBe(1);
        expect(row.merchandise.requiresShipping).toBe(false);
        expect(row.merchandise.product.title).toMatch(/^Top Fire Doll — /);
      }
      expect(Number(readback.cost.subtotalAmount.amount)).toBe(tier.totalPrice);
      receipts.push({ tier: tier.label, subtotal: tier.totalPrice, checkoutUrl: cart.checkoutUrl,
        lines: upgrades.map((row: { merchandise: { product: { title: string }; price: { amount: string } } }) =>
          ({ title: row.merchandise.product.title, price: Number(row.merchandise.price.amount) })) });
      await writeFile(process.env.DOLLWOW_GRACE_CART_RECEIPT!, JSON.stringify(receipts, null, 2), { mode: 0o600 });
      console.log({ tier: tier.label, subtotal: tier.totalPrice, namedUpgrades: upgrades.length });
    }
  } finally {
    vi.unstubAllEnvs();
  }
}, 120000);
