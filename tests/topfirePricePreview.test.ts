import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
import manifest from '@/data/pricing/dol257-topfire-preview.json';
import { applyTopfirePricePreview, assertTopfirePricePreviewReadOnly, topfirePricePreviewSourceProduct } from '@/lib/catalog/topfirePricePreview';

afterEach(() => vi.unstubAllEnvs());
function source(index = 0): Product {
 const row = manifest[index]; const price = { amount: String(row.before), currencyCode: 'USD' };
 return { id: row.id, handle: row.handle, title: row.title, description: '', vendor: 'DollWow', productType: 'Doll', tags: ['brand:top-fire'], featuredImage: null, images: [], variants: [{id:row.variantIds[0],title:'Default Title',availableForSale:true,price,selectedOptions:[]}], priceRange:{minVariantPrice:price,maxVariantPrice:price},extended:{brand:'Top Fire Doll',customizationGroups:[{id:'unchanged',label:'Unchanged',display:'cards',options:[{id:'add-on',label:'Existing option',priceDelta:100}]}]} };
}
function enable() { vi.stubEnv('VERCEL_ENV','preview'); vi.stubEnv('DOLLWOW_TOPFIRE_PRICE_PREVIEW','1'); }

describe('DOL-257 seven-price preview',()=>{
 it('keeps production/development/unflagged preview byte-equivalent and checkout available',()=>{
  for(const env of ['production','development','preview']) {
   vi.stubEnv('VERCEL_ENV',env); vi.stubEnv('DOLLWOW_TOPFIRE_PRICE_PREVIEW',env==='preview'?'':'1');
   const p=source(); expect(applyTopfirePricePreview(p)).toBe(p); expect(()=>assertTopfirePricePreviewReadOnly()).not.toThrow();
  }
 });
 it('changes only exact approved base prices, preserving source inputs, options, tags and preset identity',()=>{
  enable(); expect(manifest).toHaveLength(7); expect(manifest.every(r=>r.compareAtPrice===null)).toBe(true);
  for(let i=0;i<manifest.length;i++) {
   const p=source(i),before=structuredClone(p),row=manifest[i],preview=applyTopfirePricePreview(p);
   expect(p).toEqual(before); expect(preview.priceRange.minVariantPrice.amount).toBe(row.after.toFixed(2));
   expect(preview.variants[0].price.amount).toBe(row.after.toFixed(2)); expect(preview.extended).toBe(p.extended); expect(preview.tags).toBe(p.tags);
   expect(topfirePricePreviewSourceProduct(preview)).toBe(p);
  }
 });
 it('fails closed on changed handle, variant set, source price or currency',()=>{
  enable();
  for(const change of [(p:Product)=>{p.handle+='-changed';},(p:Product)=>{p.variants[0].id+='0';},(p:Product)=>{p.variants[0].price.amount='1';},(p:Product)=>{p.priceRange.minVariantPrice.currencyCode='EUR';}]) {
   const p=source(); change(p); expect(()=>applyTopfirePricePreview(p)).toThrow('source changed');
  }
 });
 it('leaves unrelated products untouched and blocks direct checkout helpers',()=>{
  enable(); const p=source(); p.id='gid://shopify/Product/unrelated'; expect(applyTopfirePricePreview(p)).toBe(p);
  expect(()=>assertTopfirePricePreviewReadOnly()).toThrow('Pricing review only');
 });
});
