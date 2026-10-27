import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sampleProducts } from '@/lib/data/sample-products';
import { isSeHalloweenActive, isSeHalloweenPreview, seHalloweenCampaignDay } from '@/lib/promotions/seHalloween2026';
import { isHalloweenInWindow } from '@/lib/promotions/halloween2026';
import { octoberOfferForProduct } from '@/lib/promotions/october2026';
import { promotionOptionPrice } from '@/lib/promotions/optionPricing';
import { withSeOct27PreviewRules } from '@/lib/customization/se-oct27-preview';
import { resolveCustomization } from '@/lib/customization/resolve';
import { SeHalloweenPromotion } from '@/components/promotions/SeHalloweenPromotion';
import listings from '@/data/draft-previews/se-elf-oct27.json';
import type { BrandCustomizationConfig } from '@/types/customization';

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function preview(){vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','preview');vi.stubEnv('NEXT_PUBLIC_DOL275_PREVIEW','1');}
const se={...sampleProducts[0],handle:'sedoll-review',title:'SE Doll Custom TPE Doll',vendor:'SE Doll',productType:'Custom TPE doll',tags:['sedoll'],extended:{brand:'SE Doll',material:'TPE',stockStatus:'custom' as const}};
const menu:BrandCustomizationConfig={id:'review',brandLabel:'SE Doll',leadTimeNote:'',rules:[],groups:[
 {id:'head',label:'Choose a head',display:'cards',options:[{id:'default',label:'As shown',priceDelta:0},{id:'120',label:'#120 Melody',priceDelta:0}]},
 {id:'finish',label:'Head finish',display:'cards',options:[{id:'none',label:'None',priceDelta:0},{id:'eyelids',label:'Movable eyelids',priceDelta:100}]},
 {id:'skeleton',label:'Skeleton',display:'cards',options:[{id:'standard',label:'Standard',priceDelta:0},{id:'loose',label:'Loose Joints',priceDelta:50}]},
 {id:'robot',label:'Robot options',display:'cards',options:[{id:'none',label:'None',priceDelta:0},{id:'nodding',label:'Nodding',priceDelta:100},{id:'waist',label:'Waist-spin',priceDelta:100},{id:'hip',label:'Hip-thrusting',priceDelta:200},{id:'unknown',label:'Unconfirmed function',priceDelta:300}]}
]};
describe('isolated SE Halloween preview',()=>{
 it('requires explicit preview flag and environment, never production',()=>{
  expect(isSeHalloweenPreview({VERCEL_ENV:'preview',NEXT_PUBLIC_DOL275_PREVIEW:'1'})).toBe(true);
  for(const env of [{VERCEL_ENV:'production',NEXT_PUBLIC_DOL275_PREVIEW:'1'},{VERCEL_ENV:'preview'},{}])expect(isSeHalloweenPreview(env)).toBe(false);
 });
 it('uses the exact Portugal month boundary, not US Pacific',()=>{
  expect(seHalloweenCampaignDay(new Date('2026-09-30T23:00:00Z'))).toBe('2026-10-01');
  expect(isSeHalloweenActive(Date.parse('2026-10-31T23:59:59.999Z'))).toBe(true);
  expect(isSeHalloweenActive(Date.parse('2026-11-01T00:00:00Z'))).toBe(false);
  expect(isSeHalloweenActive(NaN)).toBe(false);
 });
 it('ends SE option benefits independently, while preserving HALLOWEEN299 and other brands',()=>{
  preview();const group={id:'skeleton',label:'Skeleton'},option={id:'evo',label:'EVO skeleton',priceDelta:100};
  expect(promotionOptionPrice(se,group,option,new Date('2026-10-31T23:59:59Z')).displayDelta).toBe(0);
  expect(promotionOptionPrice(se,group,option,new Date('2026-11-01T00:00:00Z')).displayDelta).toBe(100);
  expect(isHalloweenInWindow(Date.parse('2026-11-01T00:00:00Z'))).toBe(true);
  const iron={...se,title:'Irontech Silicone Doll',vendor:'Irontech',productType:'Custom silicone doll',extended:{brand:'Irontech',material:'Silicone',stockStatus:'custom' as const}};
  expect(octoberOfferForProduct(iron,new Date('2026-11-01T00:00:00Z'))).not.toBeNull();
 });
 it('does not alter production campaign behavior even with a stray public flag',()=>{
  preview();vi.stubEnv('VERCEL_ENV','production');
  expect(octoberOfferForProduct(se,new Date('2026-11-01T00:00:00Z'))).not.toBeNull();
  expect(withSeOct27PreviewRules(se,menu)).toBe(menu);
 });
 it('renders complete responsive supplier artwork only inside the active window',()=>{
  vi.stubGlobal('React',React);
  const html=renderToStaticMarkup(<SeHalloweenPromotion enabled initialClock="2026-10-27T19:00:00Z" />);
  expect(html).toContain('crimson-mobile.jpg');expect(html).toContain('dark-desktop.jpg');expect(html).toContain('HALLOWEEN299');
  expect(renderToStaticMarkup(<SeHalloweenPromotion enabled initialClock="2026-11-01T00:00:00Z" />)).toBe('');
  expect(renderToStaticMarkup(<SeHalloweenPromotion enabled={false} initialClock="2026-10-27T19:00:00Z" />)).toBe('');
 });
 it('preserves approved base prices and primary metric weights',()=>{
  expect(listings.map(p=>p.priceUsd)).toEqual([1429,1599,1659,1659]);
  expect(listings.map(p=>p.weightKg)).toEqual([28.7,41,35,37]);
  expect((listings[1].weightKg*2.2046226218).toFixed(1)).toBe('90.4');
 });
 it('limits robot choices, adds the loose-joint warning and enforces Melody eyelid compatibility',()=>{
  preview();const adjusted=withSeOct27PreviewRules(se,menu);
  expect(adjusted.groups.find(g=>g.id==='robot')!.options.map(o=>o.id)).toEqual(['none','nodding','waist']);
  expect(adjusted.groups.find(g=>g.id==='skeleton')!.options[1].description).toContain('Cannot stand alone, sit unsupported');
  expect(resolveCustomization(adjusted,{head:'120',finish:'eyelids',skeleton:'standard',robot:'none'},1000).issues.some(i=>i.message.includes('Melody'))).toBe(true);
  expect(resolveCustomization(adjusted,{head:'default',finish:'eyelids',skeleton:'standard',robot:'none'},1000).issues).toEqual([]);
  expect(menu.groups[3].options).toHaveLength(5);
 });
 it('leaves other brands unchanged',()=>{preview();expect(withSeOct27PreviewRules({...se,vendor:'Irontech',extended:{brand:'Irontech'}},menu)).toBe(menu);});
});
