import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { IDO_MENU_TAG } from '@/lib/customization/ido-md';
import { octoberCampaignDay } from './october2026';
import { inFactoryDateWindow } from './october2026Runtime';

// IDO-October-promo.jpg: China orders receive a lingerie set, not a paid-choice discount.
export function withIdoOctoberGift(product: Pick<Product, 'tags' | 'extended'>, config: BrandCustomizationConfig, now: Date): BrandCustomizationConfig {
  if (config.id !== IDO_MENU_TAG.slice(8) || !product.tags.includes(IDO_MENU_TAG) ||
    product.extended.stockStatus !== 'custom' ||
    !inFactoryDateWindow(octoberCampaignDay(now), '2026-10-01', '2026-10-31')) return config;
  if (config.groups.some(group => group.id === 'ido-october-gifts')) return config;
  return { ...config, groups: [...config.groups, {
    id: 'ido-october-gifts', label: 'October Included Gift', display: 'compact', selectionMode: 'multiple', required: true,
    options: [{ id: 'lingerie-set', label: 'Lingerie Set', priceDelta: 0, priceVerified: true,
      priceLabel: 'included', sourceProductionNoteSignals: { defaultSupplierSelection: true } }]
  }] };
}

// Same US Pacific clock as the gift step above and the Jinsan October cards.
export const IDO_OCTOBER_TIMING = {
  startsAt: '2026-10-01T07:00:00.000Z',
  endsAt: '2026-11-01T07:00:00.000Z',
  dateLabel: '1-31 October 2026'
} as const;

export const IDO_OCTOBER_OFFER = {
  id: 'ido-october-2026', brand: 'IDO',
  image: '/promo/ido-october-2026/ido.jpg', width: 1280, height: 600,
  scope: 'Custom IDO full-body silicone dolls made to order at the factory. The factory gift is added to your order automatically at no charge.',
  included: ['Lingerie set (October factory gift)'],
  standardGifts: ['White gloves', 'Powder brush', 'Genital cleaning device', 'Wedding-style lingerie set', '"I Do" ring', 'Veil accessory']
} as const;

export function isIdoOctoberActive(now: Date) {
  return now.getTime() >= Date.parse(IDO_OCTOBER_TIMING.startsAt) && now.getTime() < Date.parse(IDO_OCTOBER_TIMING.endsAt);
}

export function idoOctoberOfferForProduct(product: Pick<Product, 'tags' | 'extended'>, now: Date) {
  return isIdoOctoberActive(now) && product.tags.includes(IDO_MENU_TAG) && product.extended.stockStatus === 'custom';
}
