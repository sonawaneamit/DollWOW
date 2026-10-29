import { canonicalBrandValue } from '@/lib/catalog/brands';
import type { Product } from '@/types/product';
import type { CustomizationGroup, CustomizationOption } from '@/types/customization';

// Tentative existing factory-Pacific clock; requires Martin's exact release yes.
export const LUSANDY_NOVEMBER_TIMING = {
  startsAt: '2026-11-01T07:00:00.000Z',
  endsAt: '2026-12-01T08:00:00.000Z',
  timeZone: 'America/Los_Angeles',
  dateLabel: '1-30 November 2026'
} as const;

export const LUSANDY_NOVEMBER_OFFER = {
  id: 'lusandy-november-2026',
  image: '/promo/lusandy-november-2026/lusandy.jpg', width: 2048, height: 1075,
  included: ['Super weight reduction', 'Anti-puncture fingers', 'Movable jaw ROS', 'Realistic head painting', 'Realistic body painting', 'Implanted eyebrows', 'Implanted eyelashes', 'Extra-soft vagina'],
  standard: ['Gel breasts', 'Wire toes', 'Articulated fingers', 'Hard hands', 'Hard feet', 'EVO skeleton']
} as const;

export function lusandyNovemberPreviewEnabled() {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' && process.env.NEXT_PUBLIC_DOL286_PREVIEW === '1';
}

export function isLusandyNovemberActive(now: Date) {
  return lusandyNovemberPreviewEnabled() && now.getTime() >= Date.parse(LUSANDY_NOVEMBER_TIMING.startsAt)
    && now.getTime() < Date.parse(LUSANDY_NOVEMBER_TIMING.endsAt);
}

type PromotionProduct = Pick<Product, 'title' | 'handle' | 'vendor' | 'productType' | 'tags' | 'extended'>;
export function lusandyNovemberProductEligible(product: PromotionProduct) {
  if (canonicalBrandValue(product.extended.brand ?? product.vendor) !== 'lusandy'
    || product.extended.stockStatus !== 'custom'
    || !/^(?:full |medical[- ]grade )?silicone$/i.test(product.extended.material ?? '')) return false;
  const identity = [product.title, product.handle, product.productType, ...product.tags].join(' ');
  return !/\b(torso|hips?|partial|half[- ]body|body[- ]only|body[- ]parts?|head[- ]only|standalone[- ]head|single[- ]head|replacement[- ]head|anime)\b/i.test(identity)
    && /\bdoll\b/i.test(product.productType)
    && typeof product.extended.heightCm === 'number' && product.extended.heightCm > 120;
}

export function lusandyNovemberOfferForProduct(product: PromotionProduct, now: Date) {
  return isLusandyNovemberActive(now) && lusandyNovemberProductEligible(product) ? LUSANDY_NOVEMBER_OFFER : null;
}

// Exact observed primary choices only. Extra-head and combined paid upgrades are not campaign entitlements.
const primaryChoices = new Map([
  ['reduce-weight|reduce-weight--super-weight-reduction-free', 'super weight reduction'],
  ['select-head-type|select-head-type--ros-free', 'ros'],
  ['select-premium-head-body-options-multiple|select-premium-head-body-options-multiple--finger-puncture-protection-free', 'finger puncture protection'],
  ['select-premium-head-body-options-multiple|select-premium-head-body-options-multiple--realistic-head-painting-free', 'realistic head painting'],
  ['select-premium-head-body-options-multiple|select-premium-head-body-options-multiple--hyper-realism-body-painting-free', 'hyper realism body painting'],
  ['select-premium-head-body-options-multiple|select-premium-head-body-options-multiple--implanted-eyebrows-free', 'implanted eyebrows'],
  ['select-premium-head-body-options-multiple|select-premium-head-body-options-multiple--implanted-eyelashes-free', 'implanted eyelashes'],
  ['select-premium-head-body-options-multiple|select-premium-head-body-options-multiple--soft-vagina-free', 'soft vagina']
]);

export function lusandyNovemberOptionBenefit(product: PromotionProduct, group: Pick<CustomizationGroup, 'id'>, option: CustomizationOption, now: Date) {
  if (!lusandyNovemberOfferForProduct(product, now) || option.priceDelta !== 0
    || option.factoryExists === false || option.purchasable === false || option.priceVerified === false || option.displayable === false) return null;
  const label = option.label.replace(/\(FREE\)/gi, '').trim().toLowerCase();
  return primaryChoices.get(`${group.id}|${option.id}`) === label ? 'Lusandy November offer (Ends: 30 Nov)' : null;
}
