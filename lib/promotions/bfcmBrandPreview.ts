import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';

export const BFCM_REVERT_AT = '2026-12-11T04:59:00Z';
export const IDO_REVERT_AT = '2026-12-01T00:00:00Z';
export type BfcmBrand = 'Top Fire' | 'Galatea' | 'Climax' | '6YE' | 'IDO';
export type BfcmPreview = { brand: BfcmBrand; originalPrice: number; price: number; endsAt: string; gifts: string[] };
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Exact DOL-371 Nov 18 scope. No Shopify writes; callers must opt into preview. */
export function bfcmOffer(product: Product, now = new Date()): BfcmPreview | null {
  const identity = `${product.extended.brand ?? ''} ${product.vendor} ${product.title} ${product.tags.join(' ')}`;
  const originalPrice = Number(product.priceRange.minVariantPrice.amount);
  if (!Number.isFinite(originalPrice) || product.priceRange.minVariantPrice.currencyCode !== 'USD') return null;
  const torso = /torso|hips-only/i.test(`${product.productType} ${product.handle}`);
  const full = !torso && !/head.only|accessor|charge|system/i.test(product.productType) && /doll/i.test(product.productType);
  const custom = product.extended.stockStatus === 'custom';
  let brand: BfcmBrand; let price = originalPrice; let gifts: string[] = [];
  let startsAt = '2026-11-18T00:00:00Z'; let endsAt = BFCM_REVERT_AT;
  if (/\btop[ -]?fire\b/i.test(identity)) {
    if (!full || !/^(full )?silicone$/i.test(product.extended.material ?? '')) return null;
    brand = 'Top Fire'; price = round(originalPrice - 150); gifts = ['second-head']; startsAt = '2026-11-15T00:00:00Z';
  } else if (/\bgalatea\b/i.test(identity) && custom) {
    brand = 'Galatea'; gifts = ['body-heating', 'vaginal-suction', 'oral-heating'];
  } else if (/\bclimax\b/i.test(identity) && custom && (full || torso)) {
    brand = 'Climax'; price = full && originalPrice >= 900 ? round(originalPrice * .9) : originalPrice;
    gifts = ['second-head', 'gel-butt', ...(full ? ['hands-feet'] : [])]; startsAt = '2026-11-13T00:00:00Z';
  } else if (/\b6ye\b/i.test(identity)) {
    brand = '6YE'; price = round(originalPrice * .95); gifts = full && (product.extended.heightCm ?? 0) >= 135 ? ['second-head'] : [];
  } else if (/\bido(?:doll)?\b/i.test(identity) && full && (custom || product.extended.stockStatus === 'ready_to_ship')) {
    brand = 'IDO'; price = custom ? 2599 : 2499; gifts = custom ? ['random-wig', 'moving-pad'] : [];
    startsAt = '2026-11-01T00:00:00Z'; endsAt = IDO_REVERT_AT;
  } else return null;
  if (+now < Date.parse(startsAt) || +now >= Date.parse(endsAt) || price < 0) return null;
  return { brand, originalPrice, price, gifts, endsAt };
}

export function withBfcmPreview(product: Product, environment = process.env.VERCEL_ENV, now = new Date(), enabled = process.env.DOL371_BRAND_PREVIEW === '1'): Product {
  if (environment !== 'preview' || !enabled) return product;
  const offer = bfcmOffer(product, now);
  if (!offer) return product;
  const reprice = (value: string) => {
    const amount = Number(value);
    return (offer.brand === 'Top Fire' ? amount - 150 : offer.brand === '6YE' ? round(amount * .95)
      : offer.brand === 'Climax' && offer.price !== offer.originalPrice ? round(amount * .9)
      : offer.brand === 'IDO' ? offer.price : amount).toFixed(2);
  };
  return { ...product, extended: { ...product.extended, bfcmPreview: offer },
    variants: product.variants.map(v => ({ ...v, price: { ...v.price, amount: reprice(v.price.amount) } })),
    priceRange: { minVariantPrice: { ...product.priceRange.minVariantPrice, amount: reprice(product.priceRange.minVariantPrice.amount) },
      maxVariantPrice: { ...product.priceRange.maxVariantPrice, amount: reprice(product.priceRange.maxVariantPrice.amount) } } };
}

export function bfcmPreviewConfig(config: BrandCustomizationConfig, offer: BfcmPreview, now = new Date()) {
  if (+now >= Date.parse(offer.endsAt)) return { config, flags: [] as string[] };
  const flags: string[] = []; const mapped = new Set<string>();
  const handKinds = new Set(config.groups.flatMap(g => g.options.flatMap(o => {
    const s = o.label.toLowerCase();
    return /\b(hands?|feet)\b/.test(s) && /\b(hard|wired)\b/.test(s) ? [/\bhard\b/.test(s) ? 'hard' : 'wired'] : [];
  })));
  const groups = config.groups.map(g => {
    const extraHead = /^(an-extra(?:-free)?-head|additional-head)$/.test(g.id);
    const options = g.options.map(o => {
      let gift = '';
      if (extraHead && !/^(no-|none$)/.test(o.id)) gift = 'second-head';
      else if (['body-heating', 'vaginal-suction', 'oral-heating'].includes(o.id)) gift = o.id;
      else if (/^gel-butt(?:-free)?$/.test(o.id)) gift = 'gel-butt';
      else if (handKinds.size === 1 && /\b(hands?|feet)\b/i.test(o.label) && /\b(hard|wired)\b/i.test(o.label)) gift = 'hands-feet';
      if (!offer.gifts.includes(gift) || o.factoryExists === false || o.displayable === false) return o;
      mapped.add(gift);
      return { ...o, priceDelta: 0, priceVerified: true, purchasable: true, priceLabel: 'included' as const };
    });
    return { ...g, ...(extraHead && offer.gifts.includes('second-head') ? { selectionMode: 'single' as const } : {}), options };
  });
  const addGift = (id: string, label: string) => {
    groups.push({ id: `bfcm-${id}`, label, required: true, selectionMode: 'single', display: 'compact',
      options: [{ id, label, priceDelta: 0, priceVerified: true, purchasable: true, priceLabel: 'included' }] } as CustomizationGroup);
    mapped.add(id);
  };
  for (const gift of offer.gifts) {
    if (mapped.has(gift)) continue;
    if (gift === 'random-wig') addGift(gift, 'One extra random wig');
    else if (gift === 'moving-pad') addGift(gift, 'Doll moving pad');
    else if (gift === 'second-head') addGift(gift, 'One extra head');
    else if (gift === 'gel-butt') addGift(gift, 'Gel butt upgrade');
    else if (gift === 'hands-feet') flags.push(`Climax hands/feet: ${handKinds.size ? 'both hard and wired options exist' : 'no matching upgrade exists'}; left unset`);
    else flags.push(`Missing confirmed gift option: ${gift}`);
  }
  return { config: { ...config, groups }, flags };
}

export function bfcmCalculatedCart(subtotal: number) {
  const discount = subtotal >= 900 ? 299 : 0;
  return { subtotal: round(subtotal), discount, total: round(subtotal - discount) };
}
