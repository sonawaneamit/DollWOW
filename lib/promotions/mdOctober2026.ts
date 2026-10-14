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
      priceLabel: 'included', sourceProductionNoteSignals: { defaultSupplierSelection: true } }]
  });
  return { ...config, groups };
}
