import { describe, expect, it } from 'vitest';
import { minimumRetailForMargin, fanrealPriceReviewEnabled } from '@/lib/catalog/landed-price-preview';
import rows from '@/data/price-previews/fanreal-landed.json';

describe('Fanreal approved landed-cost preview',()=>{
  it.each([223000,215000,163000])('rounds up rather than understating 30%% on %s cents',cost=>{
    const retail=minimumRetailForMargin(cost);
    expect((retail-cost)/retail).toBeGreaterThanOrEqual(.30);
    expect((retail-1-cost)/(retail-1)).toBeLessThan(.30);
    expect(minimumRetailForMargin(cost,3000,29900)-29900).toBe(retail);
  });
  it.each([-1,NaN,Infinity,1.5])('rejects invalid cost %s',cost=>{
    expect(()=>minimumRetailForMargin(cost)).toThrow();
  });
  it('does not confuse margin with 30% markup',()=>{
    expect(minimumRetailForMargin(223000)).toBeGreaterThan(223000*1.3);
  });
  it('never enables the review in production or without its explicit preview flag',()=>{
    expect(fanrealPriceReviewEnabled({VERCEL_ENV:'production',DOL295_PRICE_PREVIEW:'1'})).toBe(false);
    expect(fanrealPriceReviewEnabled({VERCEL_ENV:'preview'})).toBe(false);
    expect(fanrealPriceReviewEnabled({VERCEL_ENV:'preview',DOL295_PRICE_PREVIEW:'1'})).toBe(true);
  });
  it('keeps the exact ten existing identities, eight proposed customs and both unchanged US stock prices',()=>{
    expect(rows).toHaveLength(10);
    expect(new Set(rows.map(r=>r.variantId)).size).toBe(10);
    expect(rows.filter(r=>!r.inStock)).toHaveLength(8);
    for(const row of rows){
      expect(row.id).toMatch(/^gid:\/\/shopify\/Product\/\d+$/);
      expect(Object.keys(row)).not.toContain('exwUSD');
      if(row.inStock){expect(row.undiscountedMinimumUSD).toBe(row.currentUSD);expect(row.if299AppliesUSD).toBe(row.currentUSD);}
      else {expect(row.if299AppliesUSD-row.undiscountedMinimumUSD).toBe(299);}
    }
    expect(rows.filter(r=>r.inStock).map(r=>r.currentUSD)).toEqual([2380,2480]);
    expect(rows.filter(r=>r.halloweenEligible)).toHaveLength(8);
    for(const row of rows.filter(r=>!r.inStock)){
      expect(row.proposedUSD-(row.halloweenEligible?299:0)).toBe(row.undiscountedMinimumUSD);
    }
    expect(rows.filter(r=>!r.inStock&&!r.torso&&!r.handle.includes('-155cm-')).map(r=>r.undiscountedMinimumUSD)).toEqual([3186,3186,3186,3186,3186]);
  });
});
