import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import rows from '@/data/draft-previews/gynoid-final-price-review.json';
import snapshots from '@/data/draft-previews/gynoid-oct28.json';
import additions from '@/data/draft-previews/gynoid-oct28-additions.json';
import { gynoidPreviewEnabled, gynoidPreviewProducts, gynoidPreviewStoreDiscount } from '@/lib/catalog/gynoidPreview';
import {applyGynoidVersionPreview,gynoidVersionPreviewMappings} from '@/lib/catalog/gynoidVersionPreview';
import type {Product} from '@/types/product';

afterEach(()=>vi.unstubAllEnvs());
describe('Gynoid29October final price-only review',()=>{
  it('matches all eight final sheet amounts, not the rejected30% proposal',()=>{
    expect(rows.map(r=>[r.model,r.version,r.proposedUSD])).toEqual([
      ['M10','Standard',5299],['M11','Standard',4799],['M13','Standard',5299],['M13','Deluxe',5799],
      ['M16','Standard',4799],['M18','Standard',4999],['M21','Standard',4799],['M21','Deluxe',5099]
    ]);
    expect(rows.filter(r=>r.proposedUSD!==r.priorUSD).map(r=>r.proposedUSD-r.priorUSD)).toEqual([500,300]);
  });
  it('does not invent Deluxe identities or expand the reviewed source cohort',()=>{
    expect(rows.filter(r=>r.version==='Deluxe').every(r=>r.referenceHandle===null)).toBe(true);
    for(const row of rows.filter(r=>r.referenceHandle))expect(snapshots.some(p=>p.handle===row.referenceHandle)).toBe(true);
    vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('NEXT_PUBLIC_DOL273_PREVIEW','1');
    const products=gynoidPreviewProducts();expect(products).toHaveLength(12);
    for(const p of products){
      const old=[...snapshots,...additions].find(s=>s.id===p.id)!;
      const mapped=gynoidVersionPreviewMappings.find(row=>row.handle===p.handle);
      if(mapped){
        expect(p.variants.map(v=>[v.title,Number(v.price.amount)])).toEqual([['Standard body',mapped.standardUSD],['Deluxe body',mapped.deluxeUSD]]);
        expect(p.variants[0].id).toBe(old.variants[0].id);expect(p.variants[1].id).toBe(`${old.variants[0].id}:deluxe`);
        expect(p.images).toEqual(old.images);
        expect(p.extended.measurements?.['Body weight by version']).toContain('body only');
      }else{expect(p.variants).toEqual(old.variants);expect(p.priceRange).toEqual(old.priceRange);}
      expect(gynoidPreviewStoreDiscount(p,Number(p.priceRange.minVariantPrice.amount))?.discountAmount).toBe(0);
      expect(p.variants.every(v=>!v.availableForSale)).toBe(true);
    }
    expect(snapshots.reduce((n,p)=>n+p.images.length,0)).toBe(94);
  });
  it('does not guess body versions from another product identity or price',()=>{
    const original=structuredClone(snapshots.find(p=>p.handle===gynoidVersionPreviewMappings[0].handle)!) as unknown as Product;
    const wrong={...original,id:'preview:gynoid:other'};
    applyGynoidVersionPreview(wrong);expect(wrong.variants).toEqual(original.variants);
    const changed=structuredClone(original);changed.variants[0].price.amount='1';
    expect(()=>applyGynoidVersionPreview(changed)).toThrow('exact retained Standard');
  });
  it('is preview-only and explicitly noindex',()=>{
    vi.stubEnv('NEXT_PUBLIC_DOL273_PREVIEW','1');vi.stubEnv('VERCEL_ENV','production');
    expect(gynoidPreviewEnabled()).toBe(false);
    const source=fs.readFileSync('app/review/gynoid-prices/page.tsx','utf8');
    expect(source).toContain('if(!gynoidPreviewEnabled())notFound()');
    expect(source).toContain('robots:{index:false,follow:false}');
  });
});
