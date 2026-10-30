import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
vi.mock('server-only', () => ({}));

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
function enable() { vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview'); vi.stubEnv('NEXT_PUBLIC_DOL273_RELEASE_PREVIEW', '1'); }

describe('clean-base Gynoid private release integration', () => {
  it.each(['production', 'development', 'preview'])('keeps dated draft fallback private in %s while the approved brand is registered', async environment => {
    vi.stubEnv('VERCEL_ENV', environment); vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_DOL273_RELEASE_PREVIEW', environment === 'preview' ? '' : '1');
    const { gynoidReleasePreviewProducts } = await import('@/lib/catalog/gynoidReleasePreview');
    const { getPrivateDraftPreview } = await import('@/lib/catalog/privateDraftPreview');
    const { catalogBrands, isHiddenCatalogBrand } = await import('@/lib/catalog/brands');
    const { getBrandAuthorization, isLiveAuthorizedBrand } = await import('@/lib/catalog/authorizations');
    expect(gynoidReleasePreviewProducts()).toEqual([]);
    expect(await getPrivateDraftPreview('gynoid-lisa-170cm-silicone-companion-doll-model-13')).toBeNull();
    expect(catalogBrands.some(b => b.value === 'gynoid')).toBe(true);
    expect(isHiddenCatalogBrand('gynoid')).toBe(false);
    expect(getBrandAuthorization('gynoid')?.status).toBe('certificate'); expect(isLiveAuthorizedBrand('gynoid')).toBe(true);
  });
  it('shows only eleven retained products /94images/13real variants with disabled checkout and head holds', async () => {
    enable();
    const { gynoidReleasePreviewProducts } = await import('@/lib/catalog/gynoidReleasePreview');
    const { getPrivateDraftPreview, privateDraftRecipe } = await import('@/lib/catalog/privateDraftPreview');
    const { getCustomizationConfig } = await import('@/lib/customization/configs');
    const { getDefaultSelections } = await import('@/lib/customization/resolve');
    const { templateConfigurationPresets } = await import('@/lib/customization/template-presets');
    const products = gynoidReleasePreviewProducts();
    expect(products).toHaveLength(11);
    expect(products.reduce((n,p) => n + p.images.length, 0)).toBe(94);
    expect(products.reduce((n,p) => n + p.variants.length, 0)).toBe(13);
    expect(products.some(p => /laura|arina|leyla/.test(p.handle))).toBe(false);
    for (const product of products) {
      expect(product.tags).toContain('dollwow-test');
      expect(product.variants.every(v => !v.availableForSale && /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(v.id))).toBe(true);
      expect((await getPrivateDraftPreview(product.handle))?.id).toBe(product.id);
      const config = getCustomizationConfig(product), recipe = await privateDraftRecipe(product, config);
      for (const head of product.extended.customizationGroups!.find(g => g.id === 'head')!.options.filter(o => o.id !== 'no-change')) {
        expect(head.priceDelta).toBeUndefined(); expect(head.purchasable).toBe(false);
      }
      for (const variant of product.variants) {
        const base = Number(variant.price.amount);
        expect(templateConfigurationPresets(recipe!, config, config, base, getDefaultSelections(config)).map(p => p.totalPrice))
          .toEqual([base, base + 150, base + 250]);
      }
    }
  });
  it('uses the original certificate assets and limits their scope statement', async () => {
    enable();
    const { getBrandAuthorization } = await import('@/lib/catalog/authorizations');
    const authorization = getBrandAuthorization('gynoid')!;
    expect(authorization.scopeStatement).toContain('Europe and the Americas');
    expect(authorization.scopeStatement).toContain('22 October 2026 to 21 October 2027');
    for (const file of ['public/images/authorizations/gynoid-authorized.png', 'public/images/authorizations/previews/gynoid-authorized.webp', 'data/draft-previews/gynoid-oct28.json']) {
      const prior = execFileSync('git', ['show', `codex/dol-273-gynoid-preview:${file}`], { maxBuffer: 8 * 1024 * 1024 });
      expect(createHash('sha256').update(fs.readFileSync(file)).digest('hex')).toBe(createHash('sha256').update(prior).digest('hex'));
    }
  });
});
