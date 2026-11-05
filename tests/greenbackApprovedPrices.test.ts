import { describe, expect, it } from 'vitest';
import manifest from '@/data/pricing/dol255-approved-prices.json';
import registry from '@/lib/customization/evidence/template-release.json';
import { greenbackNonPriceFingerprint, greenbackPriceMutationVariables, validateGreenbackPriceScope } from '@/scripts/pricing/release-greenback-approved-prices.mjs';
import { greenbackApprovedPriceBinding, isGreenbackPricePreview } from '@/lib/catalog/greenbackApprovedPriceBinding';
import { sampleProducts } from '@/lib/data/sample-products';
import { getCustomizationConfig } from '@/lib/customization/configs';

function sourceFixture() {
  const products=manifest.rows.map(row=>({id:row.id,handle:row.handle,status:'ACTIVE',vendor:row.brand,productType:'Fixture',tags:['preserved'],metafields:{pageInfo:{hasNextPage:false},nodes:[{key:'source',type:'single_line_text_field',value:'unchanged'}]},variants:{pageInfo:{hasNextPage:false},nodes:[{id:row.variantIds[0],price:String(row.before),compareAtPrice:null,inventoryPolicy:'CONTINUE',inventoryItem:{sku:row.sku,tracked:false}}]}}));
  return {products,approved:{...manifest,rows:manifest.rows.map(row=>({...row,nonPriceFingerprint:greenbackNonPriceFingerprint(products.find(p=>p.id===row.id))}))}};
}
describe('Martin approved Greenback batch',()=>{
  it('preserves the exact 64-row scope, WM holds and existing bundle approvals',()=>{
    expect(manifest.rows).toHaveLength(64);expect(manifest.rows.filter(r=>r.before!==r.after)).toHaveLength(33);
    expect(manifest.rows.filter(r=>r.hold)).toHaveLength(29);
    expect(manifest.rows.some(r=>/top.?fire/i.test(r.brand+r.handle))).toBe(false);
    const bridged=manifest.rows.filter(r=>r.before!==r.after&&r.beforeRuntimeHash);expect(bridged).toHaveLength(21);
    for(const row of bridged)expect(row.beforeRuntimeHash).toBe(registry.payload.entries.find(e=>e.productId===row.id)?.runtimeHash);
    for(const row of manifest.rows.filter(r=>r.hold))expect([row.before,row.after]).toEqual([1777,1777]);
  });
  it('allows only a variant ID and retail price into the write',()=>{
    for(const row of manifest.rows.filter(r=>r.before!==r.after))expect(greenbackPriceMutationVariables(row)).toEqual({productId:row.id,variants:[{id:row.variantIds[0],price:row.after.toFixed(2)}]});
  });
  it('rejects price, identity, publication and non-price drift before writes',()=>{
    const {products,approved}=sourceFixture();expect(validateGreenbackPriceScope(approved,products)).toHaveLength(64);
    for(const mutate of [
      (p:typeof products)=>{p[0].status='DRAFT';},
      (p:typeof products)=>{p[0].variants.nodes[0].price='1';},
      (p:typeof products)=>{p[0].variants.nodes[0].inventoryItem.sku='wrong';},
      (p:typeof products)=>{p[0].metafields.nodes[0].value='new menu';},
      (p:typeof products)=>{p[0].tags.push('new-scope');}
    ]){const wrong=structuredClone(products);mutate(wrong);expect(()=>validateGreenbackPriceScope(approved,wrong)).toThrow();}
  });
  it('does not grant a recipe to an unreviewed product or enable production preview prices',()=>{
    const row=manifest.rows.find(r=>r.before!==r.after&&r.beforeRuntimeHash)!;
    expect(isGreenbackPricePreview(row,{VERCEL_ENV:'production',NEXT_PUBLIC_DOL255_PREVIEW:'1'})).toBe(false);
    expect(isGreenbackPricePreview(row,{VERCEL_ENV:'preview',NEXT_PUBLIC_DOL255_PREVIEW:'1'})).toBe(true);
    const product=structuredClone(sampleProducts[0]);product.id=row.id;product.handle=row.handle;product.extended.brand=row.brand;
    for(const money of [...product.variants.map(v=>v.price),product.priceRange.minVariantPrice,product.priceRange.maxVariantPrice])money.amount=row.after.toFixed(2);
    expect(greenbackApprovedPriceBinding(product,getCustomizationConfig(product))).toBe(product);
  });
});
