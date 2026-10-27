import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPrivateDraftPreview, privateDraftRecipe } from '@/lib/catalog/privateDraftPreview';
import { ZARGA_HANDLE, zargaLocalImagePath, zargaPreviewProduct } from '@/lib/catalog/zargaPreview';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { cartCreateRequestSchema, cartCheckoutRequestSchema } from '@/lib/cart/input';
import { isZargaHalloweenActive, zargaHalloweenEndLabel } from '@/lib/promotions/zargaHalloween2026';
import { withPromotionOptionPricing } from '@/lib/promotions/optionPricing';

afterEach(() => vi.unstubAllEnvs());
function enable() { vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('DOLLWOW_ZARGA_PREVIEW', '1'); }

describe('DOL-248 exact Zarga preview', () => {
  it('is absent from production, development and unflagged previews', async () => {
    for (const environment of ['production', 'development', '']) {
      vi.stubEnv('VERCEL_ENV', environment); vi.stubEnv('DOLLWOW_ZARGA_PREVIEW', '1');
      expect(await getPrivateDraftPreview(ZARGA_HANDLE)).toBeNull();
    }
    vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('DOLLWOW_ZARGA_PREVIEW', '');
    expect(await getPrivateDraftPreview(ZARGA_HANDLE)).toBeNull();
  });
  it('has only the exact fixed build and approved $65 upgrade, without copied presets', async () => {
    enable();
    const product = (await getPrivateDraftPreview(ZARGA_HANDLE))!;
    const config = getCustomizationConfig(product);
    expect(config.groups.map(g => g.id)).toEqual(['photographed-build', 'gel-butt']);
    const defaults = getDefaultSelections(config);
    expect(defaults).toEqual({ 'photographed-build': 'as-shown', 'gel-butt': 'none' });
    expect(resolveCustomization(config, defaults, 850)).toMatchObject({ totalPrice: 850, issues: [], requiresPriceConfirmation: false });
    expect(resolveCustomization(config, { ...defaults, 'gel-butt': 'gel-butt' }, 850)).toMatchObject({ totalPrice: 915, optionPriceDelta: 65, issues: [], requiresPriceConfirmation: false });
    expect(await privateDraftRecipe(product, config)).toBeNull();
    expect(await getPrivateDraftPreview('other-zarga')).toBeNull();
  });
  it('does not apply unrelated factory price promotions to the gel-butt upgrade', () => {
    enable();
    const product = zargaPreviewProduct();
    const config = getCustomizationConfig(product);
    const priced = withPromotionOptionPricing(product, config, new Date('2026-10-28T12:00:00Z'));
    expect(resolveCustomization(priced, { ...getDefaultSelections(priced), 'gel-butt': 'gel-butt' }, 850).totalPrice).toBe(915);
  });
  it('cannot enter either cart API, has no sale variant, stock promise or private provenance', () => {
    const product = zargaPreviewProduct();
    const merchandiseId = product.variants[0].id;
    expect(product.variants[0].availableForSale).toBe(false);
    expect(cartCreateRequestSchema.safeParse({ merchandiseId }).success).toBe(false);
    expect(cartCheckoutRequestSchema.safeParse({ lines: [{ merchandiseId }] }).success).toBe(false);
    expect(product.extended.stockStatus).toBe('check_stock');
    expect(product.extended.deliveryEstimate).toBeUndefined();
    expect(product.tags).toContain('dollwow-test');
    expect(JSON.stringify(product)).not.toMatch(/drive\.google|gmail|FOB|440|unitCost|sourceUrl/);
    expect(product.images).toHaveLength(26);
  });
  it('reads only the exact owned gallery allowlist for the exact preview product', () => {
    enable();
    const product = zargaPreviewProduct();
    for (const image of product.images) expect(zargaLocalImagePath(product, image.url)).toBe(`public${image.url}`);
    for (const url of ['/images/products/climax-zarga-halloween/27.webp', '/images/products/climax-zarga-halloween/../secret', '/etc/passwd', 'https://example.com/01.webp']) expect(zargaLocalImagePath(product, url)).toBeNull();
    expect(zargaLocalImagePath({ ...product, id: 'another' }, product.images[0].url)).toBeNull();
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(zargaLocalImagePath(product, product.images[0].url)).toBeNull();
  });
  it('uses the Lisbon DST boundary and expires at the end of 7 November', () => {
    expect(isZargaHalloweenActive(new Date('2026-10-24T22:59:59.999Z'))).toBe(false);
    expect(isZargaHalloweenActive(new Date('2026-10-24T23:00:00Z'))).toBe(true);
    expect(isZargaHalloweenActive(new Date('2026-11-07T23:59:59.999Z'))).toBe(true);
    expect(isZargaHalloweenActive(new Date('2026-11-08T00:00:00Z'))).toBe(false);
    expect(zargaHalloweenEndLabel()).toBe('7 Nov');
  });
});
