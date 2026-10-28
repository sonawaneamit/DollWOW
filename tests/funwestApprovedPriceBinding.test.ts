import { describe, expect, it } from 'vitest';
import manifest from '@/data/pricing/dol276-approved-price-release.json';
import registry from '@/lib/customization/evidence/template-release.json';
import { funwestApprovedPriceBinding } from '@/lib/catalog/funwestApprovedPriceBinding';
import { sampleProducts } from '@/lib/data/sample-products';
import { getCustomizationConfig } from '@/lib/customization/configs';

describe('exact approved FunWest price-only preset transition', () => {
  it('binds only the164approved identities and153already-released runtime records', () => {
    expect(manifest.rows).toHaveLength(164);
    expect(new Set(manifest.rows.map(r=>r.id)).size).toBe(164);
    expect(new Set(manifest.rows.flatMap(r=>r.variantIds)).size).toBe(164);
    expect(manifest.rows.filter(r=>r.beforeRuntimeHash)).toHaveLength(153);
    for (const row of manifest.rows) {
      expect(row.handle).toMatch(/^funwest-dolls-/);
      expect(row.after-row.before).toBeGreaterThan(100);
      const entry=registry.payload.entries.find(e=>e.productId===row.id);
      if (!entry) {
        expect(row.beforeRuntimeHash).toBeNull();
        expect(row.afterRuntimeHash).toBeNull();
      } else {
        expect(entry.handle).toBe(row.handle);
        expect(row.beforeRuntimeHash).toBe(entry.runtimeHash);
        expect(row.afterRuntimeHash).toMatch(/^[a-f0-9]{64}$/);
        expect(row.afterRuntimeHash).not.toBe(row.beforeRuntimeHash);
      }
    }
  });
  it('does not alter unrelated products or accept an identity without its exact runtime', () => {
    const product=structuredClone(sampleProducts[0]);
    const config=getCustomizationConfig(product);
    expect(funwestApprovedPriceBinding(product,config)).toBe(product);
    const row=manifest.rows[0];
    product.id=row.id; product.handle=row.handle;
    product.extended.brand='FunWest Dolls';
    product.variants.forEach(v=>v.price.amount=row.after.toFixed(2));
    product.priceRange.minVariantPrice.amount=row.after.toFixed(2);
    product.priceRange.maxVariantPrice.amount=row.after.toFixed(2);
    const before=JSON.stringify(product);
    expect(funwestApprovedPriceBinding(product,config)).toBe(product);
    expect(JSON.stringify(product)).toBe(before);
  });
});
