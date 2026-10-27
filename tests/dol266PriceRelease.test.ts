import { afterEach, describe, expect, it, vi } from 'vitest';
import delta from '@/data/pricing/dol266-approved-price-delta.json';
import registry from '@/lib/customization/evidence/template-release.json';
import { templateReleaseIssues } from '@/lib/customization/template-release-registry';
import { applyDol266PricePreview, assertDol266PricePreviewReadOnly } from '@/lib/catalog/dol266PricePreview';
import type { Product } from '@/types/product';
afterEach(()=>vi.unstubAllEnvs());

describe('DOL-266 exact approved repricing registry',()=>{
 it('cannot overlay or block production checkout through a flag alone',()=>{
  vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('DOLLWOW_DOL266_PRICE_PREVIEW','1');
  const product={} as Product;expect(applyDol266PricePreview(product)).toBe(product);expect(()=>assertDol266PricePreviewReadOnly()).not.toThrow();
 });
 it('overlays exactly the approved four IDs and fails closed on source drift',()=>{
  vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('DOLLWOW_DOL266_PRICE_PREVIEW','1');
  for(const row of delta){
   const price={amount:String(row.before),currencyCode:'USD'};
   const product={id:row.id,handle:row.handle,variants:[{id:row.variantId,price}],priceRange:{minVariantPrice:price,maxVariantPrice:price}} as Product;
   expect(applyDol266PricePreview(product).variants[0].price.amount).toBe(row.after.toFixed(2));
   expect(Number(product.variants[0].price.amount)).toBe(row.before);
   expect(()=>applyDol266PricePreview({...product,handle:'changed'})).toThrow('source changed');
  }
  const unrelated={id:'unrelated'} as Product;expect(applyDol266PricePreview(unrelated)).toBe(unrelated);
  expect(()=>assertDol266PricePreviewReadOnly()).toThrow('Pricing review only');
 });
 it('retains a fully hash-bound approved registry and exactly four intended new bindings',()=>{
  expect(templateReleaseIssues(registry)).toEqual([]);
  expect(delta).toHaveLength(4);
  expect(delta.map(r=>r.after)).toEqual([2499,2499,2499,1799]);
  for(const row of delta){
   expect(registry.payload.entries.find(e=>e.productId===row.id)).toMatchObject({handle:row.handle,runtimeHash:row.candidateHash});
   expect(row.actualBeforeHash).toBe(row.oldExpectedHash);
   expect(row.recipeAvailable).toBe(true);expect(row.missingNamed).toEqual([]);expect(row.dollVueFingerprintUnchanged).toBe(true);
   expect(row.afterPresets.map((value,i)=>value-row.beforePresets[i])).toEqual([row.after-row.before,row.after-row.before,row.after-row.before]);
  }
  expect(delta.some(r=>/freya|tantaly/i.test(r.handle))).toBe(false);
 });
});
