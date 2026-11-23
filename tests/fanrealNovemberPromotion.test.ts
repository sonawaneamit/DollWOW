import { describe, expect, it, afterEach } from 'vitest';
import {
  FANREAL_NOVEMBER_ENDS_AT,
  FANREAL_NOVEMBER_STARTS_AT,
  fanrealMapPrice,
  fanrealNovemberCashPrice,
  fanrealNovemberCart,
  fanrealNovemberConfig,
  fanrealNovemberOffer,
  isFanrealNovPromoLive,
  isFanrealNovemberActive,
  matchFanrealNovemberGift,
  withFanrealNovemberPreview,
  type FanrealNovemberPreview
} from '@/lib/promotions/fanrealNovember2026';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';

const inside = new Date('2026-11-23T12:00:00.000Z');
const before = new Date('2026-11-01T06:59:59.000Z');
const after = new Date('2026-12-01T08:00:00.000Z');

function product(partial: Partial<Product> & { title: string; handle: string; price: number; stockStatus?: Product['extended']['stockStatus']; tags?: string[]; heightCm?: number; cupSize?: string; warehouseRegions?: string[] }): Product {
  const amount = partial.price.toFixed(1).endsWith('.0') ? String(partial.price) : String(partial.price);
  return {
    id: partial.id ?? 'gid://shopify/Product/1',
    handle: partial.handle,
    title: partial.title,
    description: '',
    descriptionHtml: '',
    vendor: 'Fanreal',
    productType: partial.productType ?? 'Custom silicone doll',
    tags: partial.tags ?? ['custom', 'customizable', 'fanreal', 'silicone', 'female-doll'],
    featuredImage: null,
    images: [],
    variants: [{ id: 'v1', title: 'Default Title', availableForSale: true, price: { amount, currencyCode: 'USD' } }],
    priceRange: {
      minVariantPrice: { amount, currencyCode: 'USD' },
      maxVariantPrice: { amount, currencyCode: 'USD' }
    },
    extended: {
      brand: 'Fanreal',
      material: 'Silicone',
      stockStatus: partial.stockStatus ?? 'custom',
      heightCm: partial.heightCm,
      cupSize: partial.cupSize,
      warehouseRegions: partial.warehouseRegions
    }
  } as Product;
}

describe('Fanreal November 2026 promo', () => {
  afterEach(() => {
    delete process.env.FANREAL_NOV_PROMO_PREVIEW;
    delete process.env.FANREAL_NOV_PROMO_LIVE;
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    delete process.env.BFCM_BRAND_PROMO_LIVE;
    delete process.env.DOL371_BRAND_PREVIEW;
  });

  it('is active from 1 Nov through the end of 30 Nov PT', () => {
    expect(isFanrealNovemberActive(new Date(FANREAL_NOVEMBER_STARTS_AT))).toBe(true);
    expect(isFanrealNovemberActive(inside)).toBe(true);
    expect(isFanrealNovemberActive(before)).toBe(false);
    expect(isFanrealNovemberActive(after)).toBe(false);
    expect(isFanrealNovemberActive(new Date('2026-12-01T07:59:59.000Z'))).toBe(true);
  });

  it('uses its own flags and does not follow the BFCM live switch', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.BFCM_BRAND_PROMO_LIVE = '1';
    process.env.DOL371_BRAND_PREVIEW = '1';
    expect(isFanrealNovPromoLive()).toBe(false);
    process.env.FANREAL_NOV_PROMO_LIVE = '1';
    expect(isFanrealNovPromoLive()).toBe(true);
    delete process.env.FANREAL_NOV_PROMO_LIVE;
    process.env.VERCEL_ENV = 'preview';
    expect(isFanrealNovPromoLive()).toBe(false);
    process.env.FANREAL_NOV_PROMO_PREVIEW = '1';
    expect(isFanrealNovPromoLive()).toBe(true);
  });

  it('matches official MAP from the 4 Nov price list', () => {
    expect(fanrealMapPrice(product({ title: 'Fanreal Anne 155cm F-Cup Silicone Companion Doll', handle: 'fanreal-anne-155cm-f-cup-silicone-companion-doll', price: 2680, heightCm: 155, cupSize: 'F' }))).toBe(2580);
    expect(fanrealMapPrice(product({ title: 'Fanreal Fay 170cm G-Cup Silicone Companion Doll', handle: 'fanreal-fay-170cm-g-cup-silicone-companion-doll', price: 2780, heightCm: 170, cupSize: 'G' }))).toBe(2680);
    expect(fanrealMapPrice(product({ title: 'Fanreal Diana 168cm F-Cup Real Skin Silicone Companion Doll', handle: 'fanreal-diana-168cm-f-cup-real-skin-silicone-companion-doll', price: 2880, heightCm: 168, cupSize: 'F', tags: ['custom', 'real-skin', 'silicone'] }))).toBe(2880);
    expect(fanrealMapPrice(product({ title: 'Fanreal Nora 155cm F-Cup Real Skin Silicone Companion Doll', handle: 'fanreal-nora-155cm-f-cup-real-skin-silicone-companion-doll', price: 2780, heightCm: 155, cupSize: 'F', tags: ['custom', 'real-skin', 'silicone'] }))).toBe(2780);
    expect(fanrealMapPrice(product({ title: 'Fanreal Nora T-95G Silicone Customizable Companion Doll', handle: 'fanreal-nora-t95g-g-cup-silicone-torso-companion-doll', price: 1814, heightCm: 95, cupSize: 'G', tags: ['custom', 'torso', 'silicone'] }))).toBe(1680);
    expect(fanrealMapPrice(product({ title: 'Fanreal Maria T-109F Silicone Customizable Companion Doll', handle: 'fanreal-maria-t109f-f-cup-silicone-torso-companion-doll', price: 1814, heightCm: 109, cupSize: 'F', tags: ['custom', 'torso', 'silicone'] }))).toBe(1680);
    expect(fanrealMapPrice(product({ title: 'Fanreal Diana T110J J-Cup Real Skin Silicone Torso', handle: 'fanreal-diana-t110j-j-cup-real-skin-silicone-torso-companion-doll', price: 2358, heightCm: 110, cupSize: 'J', tags: ['custom', 'torso', 'real-skin'] }))).toBe(1680);
    expect(fanrealMapPrice(product({ title: 'Fanreal Maria 155cm F-Cup UniSeries Silicone Companion Doll', handle: 'fanreal-maria-155cm-f-cup-uniseries-silicone-companion-doll', price: 3180, heightCm: 155, cupSize: 'F', tags: ['custom', 'uni-series'] }))).toBe(3080);
    expect(fanrealMapPrice(product({ title: 'Fanreal Nora 166cm J-Cup UniSeries Silicone Companion Doll', handle: 'fanreal-nora-166cm-j-cup-uniseries-silicone-companion-doll', price: 3280, heightCm: 166, cupSize: 'J', tags: ['custom', 'uni-series'] }))).toBe(3180);
  });

  it('floors 10% off at MAP and never raises a price already below MAP', () => {
    expect(fanrealNovemberCashPrice(2780, 2680)).toEqual({ price: 2680, cashOff: 100, flooredAtMap: true });
    expect(fanrealNovemberCashPrice(1814, 1680)).toEqual({ price: 1680, cashOff: 134, flooredAtMap: true });
    expect(fanrealNovemberCashPrice(2358, 1680)).toEqual({ price: 2122, cashOff: 236, flooredAtMap: false });
    expect(fanrealNovemberCashPrice(2880, 2880)).toEqual({ price: 2880, cashOff: 0, flooredAtMap: false });
    expect(fanrealNovemberCashPrice(2380, 2780)).toEqual({ price: 2380, cashOff: 0, flooredAtMap: false });
    expect(fanrealNovemberCashPrice(2680, null)).toEqual({ price: 2680, cashOff: 0, flooredAtMap: false });
  });

  it('applies custom 10% + extras, excludes UniSeries from the extra head, and keeps RTS already under MAP unchanged', () => {
    const anne = fanrealNovemberOffer(product({ title: 'Fanreal Anne 155cm F-Cup Silicone Companion Doll', handle: 'fanreal-anne-155cm-f-cup-silicone-companion-doll', price: 2680, heightCm: 155, cupSize: 'F' }), inside);
    expect(anne?.kind).toBe('custom');
    expect(anne?.price).toBe(2580);
    expect(anne?.cashOff).toBe(100);
    expect(anne?.gifts).toContain('second-head');
    expect(anne?.gifts).toContain('soft-butt');

    const uni = fanrealNovemberOffer(product({ title: 'Fanreal Nora 166cm J-Cup UniSeries Silicone Companion Doll', handle: 'fanreal-nora-166cm-j-cup-uniseries-silicone-companion-doll', price: 3280, heightCm: 166, cupSize: 'J', tags: ['custom', 'customizable', 'silicone', 'uni-series'] }), inside);
    expect(uni?.kind).toBe('custom');
    expect(uni?.price).toBe(3180);
    expect(uni?.gifts).not.toContain('second-head');
    expect(uni?.gifts).toContain('ros');

    const nora = fanrealNovemberOffer(product({ title: 'Fanreal Nora T-95G Silicone Customizable Companion Doll', handle: 'fanreal-nora-t95g-g-cup-silicone-torso-companion-doll', price: 1814, heightCm: 95, cupSize: 'G', tags: ['custom', 'torso', 'silicone'] }), inside);
    expect(nora?.price).toBe(1680);
    expect(nora?.gifts).toContain('second-head');

    const rts = fanrealNovemberOffer(product({
      title: 'Fanreal Carlee 170cm G-Cup Real Skin Silicone Companion Doll — Ready to Ship US',
      handle: 'fanreal-carlee-170cm-g-cup-real-skin-silicone-companion-doll-rts-us',
      price: 2480,
      heightCm: 170,
      cupSize: 'G',
      stockStatus: 'ready_to_ship',
      productType: 'Ready-to-ship Silicone doll',
      tags: ['ready_to_ship', 'in-stock', 'real-skin', 'warehouse-united-states', 'silicone'],
      warehouseRegions: ['United States']
    }), inside);
    expect(rts?.kind).toBe('in_stock');
    expect(rts?.price).toBe(2480);
    expect(rts?.cashOff).toBe(0);
    expect(rts?.gifts).toEqual([]);

    expect(fanrealNovemberOffer(product({ title: 'Fanreal Anne 155cm F-Cup Silicone Companion Doll', handle: 'fanreal-anne-155cm-f-cup-silicone-companion-doll', price: 2680, heightCm: 155, cupSize: 'F' }), after)).toBeNull();
  });

  it('does not wrap prices unless the Fanreal preview or live flag is on', () => {
    const src = product({ title: 'Fanreal Anne 155cm F-Cup Silicone Companion Doll', handle: 'fanreal-anne-155cm-f-cup-silicone-companion-doll', price: 2680, heightCm: 155, cupSize: 'F' });
    expect(withFanrealNovemberPreview(src, inside).priceRange.minVariantPrice.amount).toBe('2680');
    process.env.VERCEL_ENV = 'preview';
    process.env.FANREAL_NOV_PROMO_PREVIEW = '1';
    const wrapped = withFanrealNovemberPreview(src, inside);
    expect(wrapped.priceRange.minVariantPrice.amount).toBe('2580.00');
    expect(wrapped.extended.fanrealNovember?.cashOff).toBe(100);
  });

  it('zeros known paid extras and does not free extra-head hair, human hair, or articulated toes', () => {
    expect(matchFanrealNovemberGift({ id: 'add-extra-head', label: 'Add Extra Head' }, { id: 'anne', label: 'Anne' })).toBe('second-head');
    expect(matchFanrealNovemberGift({ id: 'add-extra-head', label: 'Add Extra Head' }, { id: 'none', label: 'No extra head' })).toBeNull();
    expect(matchFanrealNovemberGift({ id: 'hair-options', label: 'Hair Options' }, { id: 'wig-transplant-ht-fiber', label: 'Wig transplant (High temperature fiber)' })).toBe('implanted-synthetic-hair');
    expect(matchFanrealNovemberGift({ id: 'hair-options', label: 'Hair Options' }, { id: 'hair-transplant-human', label: 'Hair transplant (Human hair)' })).toBeNull();
    expect(matchFanrealNovemberGift({ id: 'extra-head-hair-options', label: 'Extra Head Hair' }, { id: 'wig-transplant-ht-fiber', label: 'Wig transplant (High temperature fiber)' })).toBeNull();
    expect(matchFanrealNovemberGift({ id: 'more-features', label: 'More Features' }, { id: 'soft-buttocks', label: 'Soft buttocks' })).toBe('soft-butt');
    expect(matchFanrealNovemberGift({ id: 'more-features', label: 'More Features' }, { id: 'finger-skeleton-upgrade', label: 'Finger skeleton upgrade' })).toBe('movable-toes-articulated-fingers');
    expect(matchFanrealNovemberGift({ id: 'more-features', label: 'More Features' }, { id: 'foot-joint-upgrade', label: 'Foot joint upgrade' })).toBeNull();

    const offer = fanrealNovemberOffer(product({ title: 'Fanreal Anne 155cm F-Cup Silicone Companion Doll', handle: 'fanreal-anne-155cm-f-cup-silicone-companion-doll', price: 2680, heightCm: 155, cupSize: 'F' }), inside) as FanrealNovemberPreview;
    const config = {
      id: 'fanreal',
      groups: [
        { id: 'add-extra-head', label: 'Add Extra Head', required: false, selectionMode: 'single', display: 'swatches', options: [
          { id: 'none', label: 'No extra head', priceDelta: 0 },
          { id: 'anne', label: 'Anne', priceDelta: 550 }
        ] },
        { id: 'hair-options', label: 'Hair Options', required: true, selectionMode: 'single', display: 'compact', options: [
          { id: 'wig-cover', label: 'Wig cover', priceDelta: 0 },
          { id: 'wig-transplant-ht-fiber', label: 'Wig transplant (High temperature fiber)', priceDelta: 200 },
          { id: 'hair-transplant-human', label: 'Hair transplant (Human hair)', priceDelta: 300 }
        ] },
        { id: 'more-features', label: 'More Features', required: false, selectionMode: 'multiple', display: 'compact', options: [
          { id: 'no-more-features', label: 'None', priceDelta: 0 },
          { id: 'finger-skeleton-upgrade', label: 'Finger skeleton upgrade', priceDelta: 100 },
          { id: 'foot-joint-upgrade', label: 'Foot joint upgrade', priceDelta: 100 },
          { id: 'soft-buttocks', label: 'Soft buttocks', priceDelta: 100 }
        ] }
      ]
    } as BrandCustomizationConfig;

    const next = fanrealNovemberConfig(config, offer, inside).config;
    const extra = next.groups.find((g: CustomizationGroup) => g.id === 'add-extra-head')!;
    expect(extra.options.find((o) => o.id === 'anne')?.priceDelta).toBe(0);
    expect(extra.options.find((o) => o.id === 'none')?.priceDelta).toBe(0);
    const hair = next.groups.find((g: CustomizationGroup) => g.id === 'hair-options')!;
    expect(hair.options.find((o) => o.id === 'wig-transplant-ht-fiber')?.priceDelta).toBe(0);
    expect(hair.options.find((o) => o.id === 'hair-transplant-human')?.priceDelta).toBe(300);
    const more = next.groups.find((g: CustomizationGroup) => g.id === 'more-features')!;
    expect(more.options.find((o) => o.id === 'soft-buttocks')?.priceDelta).toBe(0);
    expect(more.options.find((o) => o.id === 'finger-skeleton-upgrade')?.priceDelta).toBe(0);
    expect(more.options.find((o) => o.id === 'foot-joint-upgrade')?.priceDelta).toBe(100);
    expect(next.groups.some((g: CustomizationGroup) => g.id === 'fanreal-nov-evo-skeleton')).toBe(true);
    expect(next.groups.some((g: CustomizationGroup) => g.id === 'fanreal-nov-gel-breast')).toBe(false);
  });

  it('stacks BLACKFRIDAYWOW26 on a $900+ subtotal', () => {
    expect(fanrealNovemberCart(2580)).toEqual({ subtotal: 2580, discount: 299, total: 2281 });
    expect(fanrealNovemberCart(800)).toEqual({ subtotal: 800, discount: 0, total: 800 });
  });
});
