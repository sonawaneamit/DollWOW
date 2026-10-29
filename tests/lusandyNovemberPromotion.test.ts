import { createElement } from 'react';
import fs from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LusandyNovemberPdpPromotion, LusandyNovemberIndexCard } from '@/components/promotions/LusandyNovemberPromotion';
import { isLusandyNovemberActive, lusandyNovemberOfferForProduct, LUSANDY_NOVEMBER_OFFER } from '@/lib/promotions/lusandyNovember2026';
import { isJinsanOctoberActive } from '@/lib/promotions/jinsanOctober2026';
import { promotionOptionPrice, withPromotionOptionPricing } from '@/lib/promotions/optionPricing';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationOption } from '@/types/customization';

type PromoProduct = Pick<Product, 'title' | 'handle' | 'vendor' | 'productType' | 'tags' | 'extended'>;
const now = new Date('2026-11-02T12:00:00Z');
const product: PromoProduct = {title:'Lusandy adult companion',handle:'lusandy-adult-companion',vendor:'DollWOW',productType:'Silicone Doll',tags:['lusandy'],extended:{brand:'Lusandy',material:'Silicone',heightCm:165,stockStatus:'custom'}};
const group = {id:'select-premium-head-body-options-multiple',label:'SELECT PREMIUM HEAD & BODY OPTIONS (MULTIPLE)'};
const option: CustomizationOption = {id:group.id+'--implanted-eyebrows-free',label:'Implanted Eyebrows (FREE)',priceDelta:0};

beforeEach(() => {vi.stubEnv('NEXT_PUBLIC_DOL286_PREVIEW','1');vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','preview');});
afterEach(() => vi.unstubAllEnvs());

describe('Lusandy November preview', () => {
  it('guards both hero purchase and configured checkout in the private preview', () => {
    const source=fs.readFileSync('app/(store)/products/[handle]/page.tsx','utf8');
    expect(source).toContain('firstAvailable && !promotionPreview');
    expect(source).toContain('draftPreview={isPrivateDraft || promotionPreview}');
    expect(source).toContain('!promotionPreview ? <PdpTrackers');
  });
  it.each([
    ['2026-11-01T06:59:59.999Z',false],['2026-11-01T07:00:00Z',true],
    ['2026-11-01T09:00:00Z',true],['2026-12-01T07:59:59.999Z',true],
    ['2026-12-01T08:00:00Z',false],['invalid',false]
  ])('uses the explicit Pacific/DST boundary at%s', (date,active) => expect(isLusandyNovemberActive(new Date(date))).toBe(active));
  it('has no gap or overlap with October at rollover', () => {
    const before=new Date('2026-11-01T06:59:59.999Z'), after=new Date('2026-11-01T07:00:00Z');
    expect([isJinsanOctoberActive(before),isLusandyNovemberActive(before)]).toEqual([true,false]);
    expect([isJinsanOctoberActive(after),isLusandyNovemberActive(after)]).toEqual([false,true]);
  });
  it('fails closed outside the explicitly enabled preview', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','production'); expect(isLusandyNovemberActive(now)).toBe(false);
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','preview'); vi.stubEnv('NEXT_PUBLIC_DOL286_PREVIEW','');expect(isLusandyNovemberActive(now)).toBe(false);
  });
  it('targets only full-size custom Lusandy silicone dolls', () => {
    expect(lusandyNovemberOfferForProduct(product,now)).not.toBeNull();
    for(const title of ['Torso','Head-only','Body-only','Anime','Hips']) expect(lusandyNovemberOfferForProduct({...product,title},now)).toBeNull();
    for(const extended of [{...product.extended,brand:'WM Doll'},{...product.extended,stockStatus:'ready_to_ship' as const},{...product.extended,material:'TPE'},{...product.extended,heightCm:120},{...product.extended,heightCm:undefined}]) expect(lusandyNovemberOfferForProduct({...product,extended},now)).toBeNull();
  });
  it('keeps eight campaign and six standard benefits separate', () => {
    expect(LUSANDY_NOVEMBER_OFFER.included).toHaveLength(8);expect(LUSANDY_NOVEMBER_OFFER.standard).toHaveLength(6);
  });
  it('labels exact zero-priced primary options without inventing a paid price after expiry', () => {
    const active=promotionOptionPrice(product,group,option,now);
    expect(active).toMatchObject({catalogDelta:0,displayDelta:0,active:true,strike:false});
    const expired=promotionOptionPrice(product,group,option,new Date('2026-12-01T08:00:00Z'));
    expect(expired).toMatchObject({catalogDelta:0,displayDelta:0,active:false});
    for(const changed of [{...option,priceDelta:130},{...option,label:'Implanted Eyebrows + paid extras'},{...option,purchasable:false},{...option,priceVerified:false},{...option,factoryExists:false}]) expect(promotionOptionPrice(product,group,changed,now).active).toBe(false);
    expect(promotionOptionPrice(product,{...group,id:'extra-select-premium-head-options-multiple'},option,now).active).toBe(false);
    expect(promotionOptionPrice(product,group,option,now,false).active).toBe(false);
  });
  it('preserves paid upgrades and incompatible/conditional menus', () => {
    const paid={id:group.id+'--ultra-soft-body',label:'Ultra Soft Body',priceDelta:130};
    const config: BrandCustomizationConfig={id:'lusandy-source-verified',brandLabel:'Lusandy',leadTimeNote:'Factory configuration',groups:[{...group,display:'cards',selectionMode:'multiple',options:[option,paid]}],rules:[]};
    const effective=withPromotionOptionPricing(product,config,now);
    expect(effective.groups[0].options.map(o=>o.priceDelta)).toEqual([0,130]);
    const conditional: BrandCustomizationConfig={...config,groups:[{...config.groups[0],visibleWhen:[[{groupId:'head',optionId:'a'}]]}]};
    expect(withPromotionOptionPricing(product,conditional,now)).toBe(conditional);
  });
  it('renders only inside dates, and shows stacking copy only until Halloween ends', () => {
    const render=(date:string)=>renderToStaticMarkup(createElement(LusandyNovemberPdpPromotion,{product,promoClock:date,freezeClock:true}));
    expect(render('2026-10-31T12:00:00Z')).toBe('');
    expect(render('2026-11-02T12:00:00Z')).toContain('HALLOWEEN299');
    expect(render('2026-11-02T12:00:00Z')).toContain('aria-controls="lusandy-november-2026-pdp-details"');
    expect(render('2026-11-09T12:00:00Z')).not.toContain('HALLOWEEN299');
    expect(render('2026-12-01T08:00:00Z')).toBe('');
    expect(renderToStaticMarkup(createElement(LusandyNovemberIndexCard,{promoClock:now.toISOString(),freezeClock:true}))).toContain('id="lusandy-november-2026"');
  });
});
