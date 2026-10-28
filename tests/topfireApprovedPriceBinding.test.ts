import { describe, expect, it } from 'vitest';
import manifest from '@/data/pricing/dol257-approved-price-release.json';
import registry from '@/lib/customization/evidence/template-release.json';
import { topfireApprovedPriceBinding } from '@/lib/catalog/topfireApprovedPriceBinding';
import { sampleProducts } from '@/lib/data/sample-products';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { validateTopfirePriceScope, topfirePriceMutationVariables } from '@/scripts/pricing/release-topfire-approved-prices.mjs';

describe('seven approved Top Fire retail changes',()=>{
  it('binds exactly four existing runtime records and preserves three absences',()=>{
    expect(manifest.rows).toHaveLength(7);expect(manifest.rows.filter(r=>r.beforeRuntimeHash)).toHaveLength(4);
    expect(manifest.rows.map(r=>r.after)).toEqual([2065,2065,2399,2399,1299,1299,1299]);
    for(const row of manifest.rows){
      const entry=registry.payload.entries.find(e=>e.productId===row.id);
      expect(row.beforeRuntimeHash).toBe(entry?.runtimeHash??null);
      if(entry)expect(row.afterRuntimeHash).toMatch(/^[a-f0-9]{64}$/);
      expect(topfirePriceMutationVariables(row)).toEqual({productId:row.id,variants:row.variantIds.map(id=>({id,price:row.after.toFixed(2)}))});
    }
  });
  it('does not bind unrelated or unreviewed runtimes',()=>{
    const product=structuredClone(sampleProducts[0]);const config=getCustomizationConfig(product);
    expect(topfireApprovedPriceBinding(product,config)).toBe(product);
    product.id=manifest.rows[0].id;product.handle=manifest.rows[0].handle;product.extended.brand='Top Fire Doll';
    expect(topfireApprovedPriceBinding(product,config)).toBe(product);
  });
  it('validates all scope before execution and rejects drift',()=>{
    const products=manifest.rows.map(r=>({id:r.id,handle:r.handle,status:'ACTIVE',brand:{value:r.brand},variants:{pageInfo:{hasNextPage:false},nodes:r.variantIds.map(id=>({id,sku:r.sku,price:String(r.before),compareAtPrice:null}))}}));
    expect(validateTopfirePriceScope(manifest,products)).toHaveLength(7);
    for(const mutate of [(p:typeof products)=>{p[0].variants.nodes[0].price='1';},(p:typeof products)=>{p[0].variants.nodes[0].sku='WRONG';},(p:typeof products)=>{p[0].status='DRAFT';},(p:typeof products)=>{p[0].variants.pageInfo.hasNextPage=true;}]){
      const wrong=structuredClone(products);mutate(wrong);expect(()=>validateTopfirePriceScope(manifest,wrong)).toThrow();
    }
  });
});
