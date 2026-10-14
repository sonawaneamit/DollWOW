import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationOption } from '@/types/customization';
import { octoberCampaignDay } from './october2026';
import { inFactoryDateWindow } from './october2026Runtime';
import { MD_MENU_TAG } from '@/lib/customization/ido-md';

type PromotionProduct = Pick<Product, 'tags' | 'extended'>;

export function mdOctoberActive(product: PromotionProduct, now: Date) {
  return product.tags.includes(MD_MENU_TAG) && product.extended.stockStatus === 'custom' &&
    product.extended.material?.toLowerCase() === 'silicone' &&
    inFactoryDateWindow(octoberCampaignDay(now), '2026-10-01', '2026-10-31');
}

export function mdOctoberBionic(product: PromotionProduct, groupId: string, option: CustomizationOption, now: Date) {
  return mdOctoberActive(product, now) && groupId === 'premium-head-body-options-multiple' &&
    option.id === 'bionic-skin-softer-skin' && option.priceVerified === true && option.purchasable !== false;
}

export function withMdOctoberPricing(product: PromotionProduct, config: BrandCustomizationConfig, now: Date): BrandCustomizationConfig {
  if (config.id !== MD_MENU_TAG.slice(8) || !mdOctoberActive(product, now)) return config;
  const groups = config.groups.map(group => ({ ...group, options: group.options.map(option => {
    if (mdOctoberBionic(product, group.id, option, now)) return { ...option, priceDelta: 0 };
    if (group.id === 'accessories' && option.id === 'vine-talk-ai-box-free' && option.priceDelta === 0) return {
      ...option, sourceProductionNoteSignals: { ...option.sourceProductionNoteSignals, defaultSupplierSelection: true as const }
    };
    return option;
  }) }));
  if (!groups.some(group => group.id === 'md-october-gifts')) groups.push({
    id: 'md-october-gifts', label: 'October Included Gift', display: 'compact', selectionMode: 'multiple', required: true,
    options: [{ id: 'three-in-one-head-stand', label: '3-in-1 Head Stand', priceDelta: 0, priceVerified: true,
      priceLabel: 'included', sourceProductionNoteSignals: { defaultSupplierSelection: true },
      // Same factory head-stand image as the MD accessories menu.
      swatch: { kind: 'image', value: '/option-assets/550bd517c0ce7522100e8402ade9a58b37cbc0e16b38db5836f328d11ae8686a.webp', label: '3-in-1 Head Stand' } }]
  });
  return { ...config, groups };
}

// MD "US stock dolls / custom dolls special offer" October banner (sunny@mddoll.com, 8 Oct 2026).
// Same US Pacific clock as the IDO and Jinsan October cards; reverts automatically after 31 Oct PT.
export const MD_OCTOBER_TIMING = {
  startsAt: '2026-10-01T07:00:00.000Z',
  endsAt: '2026-11-01T07:00:00.000Z',
  dateLabel: '1-31 October 2026'
} as const;

export const MD_OCTOBER_OFFER = {
  id: 'md-october-2026', brand: 'MD Doll',
  image: '/promo/md-october-2026/md.jpg', width: 1280, height: 720,
  scope: 'Custom MD Doll full-silicone dolls made to order at the factory. The October benefits are applied to your build automatically.',
  included: ['Bionic skin upgrade at no charge', 'AI box included', '3-in-1 head stand holder included'],
  standardGifts: ['Hard hands with articulated fingers', 'Hard standing feet', 'Body makeup']
} as const;

export function isMdOctoberActive(now: Date) {
  return now.getTime() >= Date.parse(MD_OCTOBER_TIMING.startsAt) && now.getTime() < Date.parse(MD_OCTOBER_TIMING.endsAt);
}

export function mdOctoberOfferForProduct(product: PromotionProduct, now: Date) {
  return isMdOctoberActive(now) && mdOctoberActive(product, now);
}
