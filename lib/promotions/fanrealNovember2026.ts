import { canonicalBrandValue } from '@/lib/catalog/brands';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption } from '@/types/customization';

/**
 * Fanreal November 2026 factory promotion.
 *
 * Source (do not invent terms):
 * - sales@ email from jocelyn@fanreal.com, 2 Nov 2026 02:25 UTC, subject "Nov promotion"
 *   (message 1a19a148ff5466e3): "please check November promotion banner" plus Drive folder
 *   https://drive.google.com/drive/folders/1joMd0HkravbBEThbDOwJ1Fcp53Ez6OPJ
 * - Official "November Promotion.docx" in that folder (modified 3 Nov 2026 01:22 UTC)
 * - Official horizontal and vertical banners in the same folder
 *
 * Dates: Nov 1 to Nov 30, 2026. Window ends at the close of 30 Nov, America/Los_Angeles
 * (same convention as the Lusandy November promo).
 *
 * Custom-made silicone dolls: 10% off, plus the free extras listed below.
 * In-stock Fanreal dolls (EU/US/CA stock): 10% off. No free extras on in-stock dolls.
 *
 * Free extras (custom only), official English from the doc / banners:
 * - Free Second Head (excluding UniSeries, available for torsos and full-size dolls)
 * - Free ROS (including the second head; Chinese: 含第二个头)
 * - Free Implanted Synthetic Hair (one head only)
 * - Free Implanted Eyebrows & Eyelashes
 * - Free Movable Toes & Articulated Fingers
 * - Free Hard Hand & Hard Feet
 * - Free EVO Skeleton
 * - Free Hyper-Realism Makeup
 * - Free Hyper-Realism Body Painting
 * - Free Soft Butt
 * - Free Gel Breast
 * - Free Soft Vagina
 *
 * Not included: a 2 Nov working copy of the doc mentioned "50% Implanted Synthetic Hair
 * (for second head)". That line is absent from the current official docx and from both
 * banners, so it is not offered.
 *
 * Cash deals go into the page price, floored at Fanreal's official MAP from the
 * 4 Nov 2026 price list. Brand-funded: vendor cost drops by the same amount at go-live.
 * Stacks with BLACKFRIDAYWOW26 ($299 off orders of $900+).
 *
 * Flags are separate from BFCM_BRAND_PROMO_LIVE / DOL371_BRAND_PREVIEW:
 * - Preview only: FANREAL_NOV_PROMO_PREVIEW=1 on a Vercel preview
 * - Production: FANREAL_NOV_PROMO_LIVE=1 (off until Martin approves the preview)
 */

export const FANREAL_NOVEMBER_STARTS_AT = '2026-11-01T07:00:00.000Z';
export const FANREAL_NOVEMBER_ENDS_AT = '2026-12-01T08:00:00.000Z';
export const FANREAL_NOVEMBER_DATE_LABEL = '1–30 November 2026';

export const FANREAL_NOVEMBER_PROMOTION = {
  id: 'fanreal-november-2026',
  brand: 'Fanreal' as const,
  title: 'Fanreal November factory promotion',
  dateLabel: FANREAL_NOVEMBER_DATE_LABEL,
  heroImage: '/promo/fanreal-november-2026/banner-desktop.jpg',
  mobileHeroImage: '/promo/fanreal-november-2026/banner-mobile.jpg',
  heroAlt: 'Fanreal November 2026 factory promotion: custom and in-stock dolls 10% off, plus free extras on custom dolls, 1 to 30 November.',
  startsAt: FANREAL_NOVEMBER_STARTS_AT,
  endsAt: FANREAL_NOVEMBER_ENDS_AT,
  customHeadline: 'Custom-made silicone dolls 10% off',
  inStockHeadline: 'In-stock Fanreal dolls 10% off (EU, US and CA stock)',
  includedLabels: [
    'Free Second Head (excluding UniSeries; available for torsos and full-size dolls)',
    'Free ROS (including on the second head)',
    'Free Implanted Synthetic Hair (one head only)',
    'Free Implanted Eyebrows & Eyelashes',
    'Free Movable Toes & Articulated Fingers',
    'Free Hard Hand & Hard Feet',
    'Free EVO Skeleton',
    'Free Hyper-Realism Makeup',
    'Free Hyper-Realism Body Painting',
    'Free Soft Butt',
    'Free Gel Breast',
    'Free Soft Vagina'
  ]
} as const;

export const FANREAL_NOVEMBER_PROMO_LABEL = 'Fanreal November deal';

const CUSTOM_GIFTS = [
  'second-head',
  'ros',
  'implanted-synthetic-hair',
  'implanted-eyebrows-eyelashes',
  'movable-toes-articulated-fingers',
  'hard-hands-feet',
  'evo-skeleton',
  'hyper-realism-makeup',
  'hyper-realism-body-painting',
  'soft-butt',
  'gel-breast',
  'soft-vagina'
] as const;

export type FanrealNovemberGift = (typeof CUSTOM_GIFTS)[number];

export type FanrealNovemberPreview = {
  brand: 'Fanreal';
  kind: 'custom' | 'in_stock';
  originalPrice: number;
  price: number;
  mapPrice: number | null;
  flooredAtMap: boolean;
  cashOff: number;
  gifts: FanrealNovemberGift[];
  startsAt: string;
  endsAt: string;
  dateLabel: string;
};

/** True when the customer actually gets cash off or free extras. */
export function fanrealNovemberHasCustomerOffer(offer: FanrealNovemberPreview | null | undefined): offer is FanrealNovemberPreview {
  return Boolean(offer && (offer.cashOff > 0 || offer.gifts.length > 0));
}

type PromoProduct = Pick<Product, 'handle' | 'title' | 'vendor' | 'productType' | 'tags' | 'extended' | 'priceRange'>;

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function isFanrealNovPromoLive(): boolean {
  const previewEnv = process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  if (previewEnv) {
    return process.env.FANREAL_NOV_PROMO_PREVIEW === '1' || process.env.NEXT_PUBLIC_FANREAL_NOV_PROMO_PREVIEW === '1';
  }
  return process.env.FANREAL_NOV_PROMO_LIVE === '1';
}

export function isFanrealNovemberActive(now = new Date()) {
  const ts = now.getTime();
  return ts >= Date.parse(FANREAL_NOVEMBER_STARTS_AT) && ts < Date.parse(FANREAL_NOVEMBER_ENDS_AT);
}

function identityText(product: PromoProduct) {
  return [product.title, product.handle, product.productType, product.extended.brand, product.vendor, product.extended.material, product.extended.stockStatus, ...(product.tags ?? [])]
    .filter(Boolean)
    .join(' ');
}

export function isFanrealProduct(product: PromoProduct) {
  return canonicalBrandValue(product.extended.brand ?? product.vendor) === 'fanreal';
}

function isExcludedForm(product: PromoProduct) {
  const text = identityText(product);
  return /\b(head[- ]?only|standalone head|replacement head|accessor(?:y|ies)|system charge|hips?-only)\b/i.test(text);
}

function isTorso(product: PromoProduct) {
  const text = identityText(product);
  return /\btorso\b/i.test(text) || /\bt-?\d{2,3}[a-z]?\b/i.test(`${product.title} ${product.handle}`);
}

function isUniSeries(product: PromoProduct) {
  return /\buniseries\b|\buni-series\b|\buni series\b/i.test(identityText(product));
}

function isRealSkin(product: PromoProduct) {
  return /\breal[ -]?skin\b/i.test(identityText(product));
}

function isMale(product: PromoProduct) {
  const text = identityText(product);
  return /\bmale\b/i.test(text) && !/\bfemale\b/i.test(text);
}

function isInStockEuUsCa(product: PromoProduct) {
  if (product.extended.stockStatus === 'ready_to_ship') {
    return isEuUsCaWarehouse(product);
  }
  const text = identityText(product);
  return /ready[ _-]?to[ _-]?ship|\bin-stock\b|\brts\b/i.test(text) && isEuUsCaWarehouse(product);
}

function isEuUsCaWarehouse(product: PromoProduct) {
  const regions = (product.extended.warehouseRegions ?? []).join(' ');
  const country = product.extended.warehouseCountry ?? '';
  const text = `${identityText(product)} ${regions} ${country}`;
  return /united states|\busa\b|\bus\b|warehouse-united-states|europe|\beu\b|warehouse-eu|canada|\bca\b|warehouse-ca|warehouse-canada/i.test(text);
}

function isCustomSilicone(product: PromoProduct) {
  if (product.extended.stockStatus && product.extended.stockStatus !== 'custom') return false;
  if (!product.extended.stockStatus) {
    const tags = (product.tags ?? []).join(' ');
    if (!/\bcustom\b/i.test(tags) && !/custom/i.test(product.productType)) return false;
  }
  const text = identityText(product);
  return /silicone/i.test(text);
}

type BodyInfo = { heightCm: number | null; cup: string | null };

export function parseFanrealBody(product: PromoProduct): BodyInfo {
  const title = product.title ?? '';
  const handle = product.handle ?? '';
  let heightCm = typeof product.extended.heightCm === 'number' ? product.extended.heightCm : null;
  let cup = (product.extended.cupSize ?? '').replace(/[^A-Ma-m]/g, '').toUpperCase() || null;

  const titleSize = title.match(/(\d{2,3})\s*cm\s+([A-M])-?cup/i);
  if (titleSize) {
    heightCm = heightCm ?? Number(titleSize[1]);
    cup = cup ?? titleSize[2].toUpperCase();
  } else {
    const torso = title.match(/T-?(\d{2,3})\s*([A-M])\b/i) || `${title} ${handle}`.match(/T-?(\d{2,3})([A-M])\b/i);
    if (torso) {
      heightCm = heightCm ?? Number(torso[1]);
      cup = cup ?? torso[2].toUpperCase();
    } else {
      const fallback = title.match(/(\d{3})\s*cm/i) || handle.match(/-(\d{3})cm-/i);
      if (fallback) heightCm = heightCm ?? Number(fallback[1]);
    }
  }
  return { heightCm, cup };
}

/**
 * Official reseller website minimum prices (USD) from the 4 Nov 2026 Fanreal price list
 * (sales@ email 1a1a4d8628a30bfe, file fanreal-price-list-20261103US.xlsx).
 */
export function fanrealMapPrice(product: PromoProduct): number | null {
  const { heightCm, cup } = parseFanrealBody(product);
  if (isTorso(product)) {
    if (heightCm === 95 || heightCm === 109 || heightCm === 110) return 1680;
    if (heightCm === 111 || heightCm === 108) return 1580;
    return null;
  }
  if (isUniSeries(product)) {
    if (heightCm === 155 && cup === 'F') return 3080;
    if (heightCm === 170 || heightCm === 166) return 3180;
    return null;
  }
  if (isMale(product)) return 2880;
  if (isRealSkin(product)) {
    if ((heightCm === 155 && cup === 'F') || (heightCm === 158 && cup === 'B')) return 2780;
    if (heightCm != null) return 2880;
    return null;
  }
  if (heightCm != null && heightCm >= 152 && heightCm <= 159) return 2580;
  if (heightCm != null && heightCm >= 162 && heightCm <= 173) return 2680;
  return null;
}

export function fanrealNovemberCashPrice(originalPrice: number, mapPrice: number | null) {
  if (!Number.isFinite(originalPrice) || originalPrice < 0) {
    return { price: originalPrice, cashOff: 0, flooredAtMap: false };
  }
  const tenOff = Math.floor(originalPrice * 0.9);
  if (mapPrice == null) {
    // Safer reading: do not invent a discount that could break MAP.
    return { price: originalPrice, cashOff: 0, flooredAtMap: false };
  }
  if (originalPrice <= mapPrice) {
    return { price: originalPrice, cashOff: 0, flooredAtMap: false };
  }
  const price = Math.max(tenOff, mapPrice);
  return { price, cashOff: round(originalPrice - price), flooredAtMap: tenOff < mapPrice };
}

export function fanrealNovemberOffer(product: PromoProduct, now = new Date()): FanrealNovemberPreview | null {
  if (!isFanrealNovemberActive(now)) return null;
  if (!isFanrealProduct(product)) return null;
  if (isExcludedForm(product)) return null;

  const originalPrice = Number(product.priceRange?.minVariantPrice?.amount);
  if (!Number.isFinite(originalPrice) || product.priceRange?.minVariantPrice?.currencyCode !== 'USD') {
    return null;
  }

  const custom = isCustomSilicone(product) && !isInStockEuUsCa(product);
  const inStock = isInStockEuUsCa(product);
  if (!custom && !inStock) return null;

  const mapPrice = fanrealMapPrice(product);
  const cash = fanrealNovemberCashPrice(originalPrice, mapPrice);
  const gifts: FanrealNovemberGift[] = custom
    ? CUSTOM_GIFTS.filter((gift) => !(gift === 'second-head' && isUniSeries(product)))
    : [];

  return {
    brand: 'Fanreal',
    kind: custom ? 'custom' : 'in_stock',
    originalPrice,
    price: cash.price,
    mapPrice,
    flooredAtMap: cash.flooredAtMap,
    cashOff: cash.cashOff,
    gifts,
    startsAt: FANREAL_NOVEMBER_STARTS_AT,
    endsAt: FANREAL_NOVEMBER_ENDS_AT,
    dateLabel: FANREAL_NOVEMBER_DATE_LABEL
  };
}

export function withFanrealNovemberPreview(product: Product, now = new Date()): Product {
  if (!isFanrealNovPromoLive()) return product;
  const offer = fanrealNovemberOffer(product, now);
  if (!offer) return product;

  const reprice = (value: string) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || offer.cashOff <= 0) return value;
    const next = fanrealNovemberCashPrice(amount, offer.mapPrice).price;
    return next.toFixed(2);
  };

  return {
    ...product,
    extended: { ...product.extended, fanrealNovember: offer },
    variants: product.variants.map((v) => ({
      ...v,
      price: { ...v.price, amount: reprice(v.price.amount) }
    })),
    priceRange: {
      minVariantPrice: { ...product.priceRange.minVariantPrice, amount: reprice(product.priceRange.minVariantPrice.amount) },
      maxVariantPrice: { ...product.priceRange.maxVariantPrice, amount: reprice(product.priceRange.maxVariantPrice.amount) }
    }
  };
}

function isNoneOption(option: Pick<CustomizationOption, 'id' | 'label'>) {
  return /^(no[- ]?(thanks|add-on|extra-head)?|none|no extra head|as shown|factory default)$/i.test(option.label.trim())
    || /^(none|no-extra-head|no-add-on|no-more-features)$/i.test(option.id);
}

export function matchFanrealNovemberGift(
  group: Pick<CustomizationGroup, 'id' | 'label'>,
  option: Pick<CustomizationOption, 'id' | 'label'>
): FanrealNovemberGift | null {
  if (isNoneOption(option)) return null;
  const groupId = group.id.toLowerCase();
  const groupLabel = group.label.toLowerCase();
  const optionId = option.id.toLowerCase();
  const optionLabel = option.label.toLowerCase();
  const all = `${groupId} ${groupLabel} ${optionId} ${optionLabel}`;

  // One head only: do not free extra-head hair.
  if (/extra-head/.test(groupId) && /hair|wig|transplant/.test(`${groupId} ${optionId}`)) return null;
  // Human hair stays paid.
  if (/human/.test(all) && /hair|transplant/.test(all)) return null;
  // Articulated toes are a paid factory option, not in this promo (movable toes are).
  if (/foot-joint|articulated toes|jointed toes/.test(all)) return null;

  if (/^(add-extra-head|second-head|an-extra(?:-free)?-head)$/.test(groupId) || /add extra head/i.test(group.label) || /extra silicone head/i.test(optionLabel)) {
    return 'second-head';
  }
  if (/\bros\b/.test(all) || /soft silicone head/.test(optionLabel) && /moveable jaw|movable jaw/.test(optionLabel) || optionId.includes('soft-silicone-head-moveable-jaw')) {
    return 'ros';
  }
  if (/wig-transplant-ht-fiber|implanted synthetic|high temperature fiber implant|synthetic hair/.test(all) && !/style|wig-0/.test(optionId)) {
    if (/hair-options|hair options/.test(`${groupId} ${groupLabel}`) || optionId === 'wig-transplant-ht-fiber') {
      return 'implanted-synthetic-hair';
    }
  }
  if (/implanted eyebrow|implanted eyelash|eyebrows? & eyelashes?/.test(all)) {
    return 'implanted-eyebrows-eyelashes';
  }
  if (/finger-skeleton-upgrade|articulated fingers|movable toes|moveable toes/.test(all)) {
    return 'movable-toes-articulated-fingers';
  }
  if (/hard hands?|hard feet|hard hand/.test(all) && !/standing without bolts/.test(optionLabel)) {
    return 'hard-hands-feet';
  }
  if (/\bevo\b/.test(all) && /skeleton/.test(all)) {
    return 'evo-skeleton';
  }
  if (/hyper-?realism makeup|hyper realism makeup/.test(all)) {
    return 'hyper-realism-makeup';
  }
  if (/hyper-?realism body painting|hyper realism body painting/.test(all)) {
    return 'hyper-realism-body-painting';
  }
  if (/soft butt|soft buttocks/.test(all)) {
    return 'soft-butt';
  }
  if (/gel[- ]?(filled )?breast/.test(all)) {
    return 'gel-breast';
  }
  if (/soft vagina|extra-soft vagina|soft vaginal/.test(all)) {
    return 'soft-vagina';
  }
  return null;
}

const GIFT_LABELS: Record<FanrealNovemberGift, string> = {
  'second-head': 'One extra head',
  ros: 'ROS (movable jaw)',
  'implanted-synthetic-hair': 'Implanted synthetic hair (one head)',
  'implanted-eyebrows-eyelashes': 'Implanted eyebrows & eyelashes',
  'movable-toes-articulated-fingers': 'Movable toes & articulated fingers',
  'hard-hands-feet': 'Hard hands & hard feet',
  'evo-skeleton': 'EVO skeleton',
  'hyper-realism-makeup': 'Hyper-realism makeup',
  'hyper-realism-body-painting': 'Hyper-realism body painting',
  'soft-butt': 'Soft butt',
  'gel-breast': 'Gel breast',
  'soft-vagina': 'Soft vagina'
};

const GIFTS_ALREADY_STANDARD: FanrealNovemberGift[] = ['gel-breast'];

export function fanrealNovemberConfig(
  config: BrandCustomizationConfig,
  offer: FanrealNovemberPreview,
  now = new Date()
) {
  if (+now >= Date.parse(offer.endsAt) || offer.kind !== 'custom') {
    return { config, flags: [] as string[] };
  }

  const mapped = new Set<FanrealNovemberGift>();
  const groups = config.groups.map((group) => {
    const options = group.options.map((option) => {
      const gift = matchFanrealNovemberGift(group, option);
      if (!gift || !offer.gifts.includes(gift) || option.factoryExists === false || option.displayable === false) {
        return option;
      }
      mapped.add(gift);
      if ((option.priceDelta ?? 0) === 0) return option;
      return {
        ...option,
        priceDelta: 0,
        priceVerified: true,
        purchasable: true,
        priceLabel: 'included' as const
      };
    });
    return { ...group, options };
  });

  const hasHeadStep = groups.some((group) =>
    /^(?:add\s+)?(?:second|extra|add[\s-]extra)[\s-]?head/i.test(group.label)
    || group.id === 'add-extra-head'
    || group.id === 'second-head'
  );

  const addGift = (id: FanrealNovemberGift, label: string) => {
    groups.push({
      id: `fanreal-nov-${id}`,
      label,
      required: false,
      selectionMode: 'single',
      display: 'compact',
      options: [
        {
          id,
          label: `${label} (included)`,
          priceDelta: 0,
          priceVerified: true,
          purchasable: true,
          priceLabel: 'included'
        },
        {
          id: `no-${id}`,
          label: 'No thanks',
          priceDelta: 0,
          priceVerified: true,
          purchasable: true
        }
      ]
    } as CustomizationGroup);
    mapped.add(id);
  };

  for (const gift of offer.gifts) {
    if (mapped.has(gift) || GIFTS_ALREADY_STANDARD.includes(gift)) continue;
    if (gift === 'second-head') {
      if (!hasHeadStep) addGift(gift, GIFT_LABELS[gift]);
      continue;
    }
    addGift(gift, GIFT_LABELS[gift]);
  }

  return { config: { ...config, groups }, flags: [] as string[] };
}

export function fanrealNovemberCart(subtotal: number) {
  const discount = subtotal >= 900 ? 299 : 0;
  return { subtotal: round(subtotal), discount, total: round(subtotal - discount) };
}
