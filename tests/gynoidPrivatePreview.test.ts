import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import snapshots from '@/data/draft-previews/gynoid-oct28.json';
import rules from '@/data/draft-previews/gynoid-oct28-rules.json';
import { getPrivateDraftPreview, privateDraftRecipe } from '@/lib/catalog/privateDraftPreview';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { publicProductPayload } from '@/lib/catalog/publicPayload';
import { serverValidateAndRepriceLine, serverValidateAndRepriceLines } from '@/lib/cart/server-validation';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';

afterEach(() => vi.unstubAllEnvs());
function enable() { vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('NEXT_PUBLIC_DOL273_PREVIEW', '1'); }

describe('Gynoid saved draft previews', () => {
  it('is absent in production/development even with flag and in unflagged preview', async () => {
    for (const env of ['production', 'development', 'preview']) {
      vi.stubEnv('VERCEL_ENV', env); vi.stubEnv('NEXT_PUBLIC_DOL273_PREVIEW', env === 'preview' ? '' : '1');
      for (const p of snapshots) expect(await getPrivateDraftPreview(p.handle)).toBeNull();
    }
  });
  it('keeps eleven exact saved identities and 94 owned images without sale-capable IDs', async () => {
    enable();
    expect(snapshots).toHaveLength(11);
    expect(snapshots.reduce((n, p) => n + p.images.length, 0)).toBe(94);
    for (const raw of snapshots) {
      const p = (await getPrivateDraftPreview(raw.handle))!;
      expect(p.tags).toContain('dollwow-test');
      expect(p.tags.filter(t => t.startsWith('options:'))).toHaveLength(1);
      expect(p.variants.every(v => !v.availableForSale && v.id.startsWith('preview:'))).toBe(true);
      expect(p.images.every(i => new URL(i.url).hostname === 'cdn.shopify.com')).toBe(true);
      expect(JSON.stringify(publicProductPayload(p))).not.toMatch(/rosemarydoll\.com|drive\.google|supplierCost|marginVerified|sourceUrl/);
      const c = getCustomizationConfig(p);
      expect(c.rules).toEqual(rules[p.id as keyof typeof rules]);
      for (const g of c.groups) for (const o of g.options) if (o.swatch?.kind === 'image') expect(isOwnedOptionAsset(o.swatch.value)).toBe(true);
    }
  });
  it('resolves all three retained presets with the exact compatibility graph', async () => {
    enable();
    for (const raw of snapshots) {
      const p = (await getPrivateDraftPreview(raw.handle))!, c = getCustomizationConfig(p);
      const base = Number(p.priceRange.minVariantPrice.amount), defaults = getDefaultSelections(c);
      expect(resolveCustomization(c, defaults, base).issues, p.handle).toEqual([]);
      const recipe = await privateDraftRecipe(p, c);
      const presets = templateConfigurationPresets(recipe ?? null, c, c, base, defaults);
      expect(presets.map(t => t.label), p.handle).toEqual(['Starter', 'Enthusiast', 'Collector']);
      expect(presets.map(t => t.totalPrice), p.handle).toEqual([base, base + 150, base + 250]);
      for (const preset of presets) expect(resolveCustomization(c, preset.selections, base).issues, p.handle).toEqual([]);
    }
  });
  it('rejects preview cart requests before any upstream lookup', async () => {
    const input = { merchandiseId: snapshots[0].variants[0].id, quantity: 1 };
    await expect(serverValidateAndRepriceLine(input)).rejects.toThrow('Preview products');
    await expect(serverValidateAndRepriceLines([input])).rejects.toThrow('Preview products');
  });
  it('retains the original certificate and its preview image', () => {
    for (const p of ['public/images/authorizations/gynoid-authorized.png', 'public/images/authorizations/previews/gynoid-authorized.webp']) expect(fs.statSync(p).size).toBeGreaterThan(10000);
  });
});
