import { describe, expect, it, vi } from 'vitest';
import { zargaPreviewProduct, zargaLocalImagePath } from '@/lib/catalog/zargaPreview';
import { isZargaReleasedProduct, ZARGA_PRODUCT_ID, ZARGA_VARIANT_ID } from '@/lib/catalog/zargaRelease';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { loadTemplateRecipe } from '@/lib/customization/template-loader';
import { releasedNamedBindings } from '@/lib/cart/named-upgrade-release';
import registry from '@/lib/cart/evidence/named-upgrades-release.json';

function product() {
  const source = zargaPreviewProduct();
  return { ...source, id: ZARGA_PRODUCT_ID,
    tags: source.tags.filter(tag => tag !== 'dollwow-test'),
    variants: [{ ...source.variants[0], id: ZARGA_VARIANT_ID, availableForSale: true }],
    extended: { ...source.extended, previewCustomizationFixture: undefined } };
}

describe('DOL-248 approved real Zarga release', () => {
  it('requires both the pinned real ID and exact handle', () => {
    expect(isZargaReleasedProduct(product())).toBe(true);
    expect(isZargaReleasedProduct(zargaPreviewProduct())).toBe(false);
    expect(isZargaReleasedProduct({ ...product(), handle: 'another' })).toBe(false);
    expect(zargaLocalImagePath(product(), product().images[0].url)).toBeNull();
  });
  it('preserves the approved fixed build and optional 65USD without invented recipes', async () => {
    const p = product();
    const config = getCustomizationConfig(p);
    expect(config.groups.map(g => g.id)).toEqual(['photographed-build', 'gel-butt']);
    const defaults = getDefaultSelections(config);
    expect(resolveCustomization(config, defaults, 850)).toMatchObject({ totalPrice: 850, issues: [], requiresPriceConfirmation: false });
    expect(resolveCustomization(config, { ...defaults, 'gel-butt': 'gel-butt' }, 850)).toMatchObject({ totalPrice: 915, issues: [], requiresPriceConfirmation: false });
    vi.stubEnv('DOLLWOW_TEMPLATE_RELEASE', '1');
    try { expect(await loadTemplateRecipe(p)).toBeNull(); } finally { vi.unstubAllEnvs(); }
  });
  it('fails closed if the pinned real product loses its reviewed menu', () => {
    expect(() => getCustomizationConfig({ ...product(), extended: { ...product().extended, customizationGroups: [] } })).toThrow('needs verification');
  });
  it('has a signed exact named charge, not a generic denomination fallback', () => {
    expect(releasedNamedBindings(registry, [ZARGA_VARIANT_ID])).toEqual([expect.objectContaining({
      parentVariantId: ZARGA_VARIANT_ID, group: 'Gel buttocks', choiceLabels: ['Gel buttocks'], unitAmount: 65,
      merchandiseId: 'gid://shopify/ProductVariant/54573732004024', productTitle: 'Climax Zarga - Gel buttocks'
    })]);
  });
});
