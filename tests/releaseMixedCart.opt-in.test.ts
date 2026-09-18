import { expect, test, vi } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { withPromotionOptionPricing } from '@/lib/promotions/optionPricing';
import { resolveCustomization } from '@/lib/customization/resolve';
vi.mock('server-only', () => ({}));

// Creates disposable carts only, never an order or payment. Explicit opt-in required.
test.skipIf(process.env.DOLLWOW_LIVE_MIXED_CART !== '1')('checks released and deferred builds together against Shopify', async () => {
  vi.stubEnv('DOLLWOW_TEMPLATE_RELEASE', '1');
  const { getProductByHandle, getProducts, createCartWithLines } = await import('@/lib/shopify/storefront');
  const { serverValidateAndRepriceLines } = await import('@/lib/cart/server-validation');
  const lita = await getProductByHandle('sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h');
  expect(lita).toBeTruthy();
  const candidates = await getProducts({query:'title:Fanreal*',first:100,includeCustomizationGroups:true,cache:'no-store'});
  const deferred = candidates.find(product => /fanreal/i.test(product.handle) && product.extended.stockStatus === 'custom' && product.variants[0]?.availableForSale);
  expect(deferred, 'Need an existing deferred custom product for regression').toBeTruthy();
  const inputs = [lita!, deferred!].map(product => {
    const config = withPromotionOptionPricing(product, getCustomizationConfig(product));
    const base = Number(product.variants[0].price.amount);
    for (const group of config.groups.filter(group => !group.visibleWhen)) {
      for (const option of group.options.filter(option => (option.priceDelta ?? 0) > 0 && option.purchasable !== false)) {
        const selections = {...resolveCustomization(config, {}, base).selections,
          [group.id]: group.selectionMode === 'multiple' ? [option.id] : option.id};
        const resolved = resolveCustomization(config, selections, base);
        if (!resolved.issues.length && !resolved.requiresPriceConfirmation && resolved.optionPriceDelta > 0) {
          return {merchandiseId:product.variants[0].id,quantity:1,selections};
        }
      }
    }
    if (product === deferred) return {merchandiseId:product.variants[0].id,quantity:1,selections:resolveCustomization(config,{},base).selections};
    throw new Error(`No valid paid sample for ${product.handle}`);
  });
  const validated = await serverValidateAndRepriceLines(inputs);
  expect(validated[0].customizationCharge!.amount).toBeGreaterThan(0);
  const mixed = await createCartWithLines({lines:validated});
  expect(mixed.id).not.toBe('mock-cart');
  expect(mixed.checkoutUrl).toContain('checkout.dollwow.com');
  const evidence = {status:'PASS_CART_ONLY',handles:[lita!.handle,deferred!.handle],deferredCharge:validated[1].customizationCharge?.amount ?? 0,checkoutUrl:mixed.checkoutUrl};
  if (process.env.DOLLWOW_MIXED_CART_EVIDENCE) await writeFile(process.env.DOLLWOW_MIXED_CART_EVIDENCE,JSON.stringify(evidence,null,2));
  console.log(JSON.stringify(evidence));
  vi.unstubAllEnvs();
}, 120000);
