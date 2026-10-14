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
