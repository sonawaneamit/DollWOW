import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';

export const BFCM_REVERT_AT = '2026-12-11T04:59:00Z'; // Dec 10, 11:59 PM US Eastern
export const IDO_REVERT_AT = '2026-12-01T00:00:00Z'; // End of Nov 30

export type BfcmBrand = 'Top Fire' | 'Galatea' | 'Climax' | '6YE' | 'IDO';
export type BfcmPreview = { 
  brand: BfcmBrand; 
  originalPrice: number; 
  price: number; 
  endsAt: string; 
  gifts: string[] 
};

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * DOL-371 Nov 20 confirmed scope. No Shopify writes; callers must opt into preview.
 * 
 * Promo Terms:
 * - Top Fire: $150 off + free second head (full silicone only)
 * - Galatea: 3 free custom upgrades (body heating, vaginal suction, oral heating)
 * - Climax: 10% off large dolls (>=$900) + free extras
 * - 6YE: 5% off + free extra head on large dolls (>=135cm, treat all 150-173cm as large)
 * - IDO: Fixed $2599 custom / $2499 RTS + free wig/pad (Nov promo, ends Nov 30)
 * 
 * All stack with BLACKFRIDAYWOW26 code ($299 off >= $900)
 */
export function bfcmOffer(product: Product, now = new Date()): BfcmPreview | null {
  const identity = `${product.extended.brand ?? ''} ${product.vendor} ${product.title} ${product.tags.join(' ')}`;
  const originalPrice = Number(product.priceRange.minVariantPrice.amount);
  
  if (!Number.isFinite(originalPrice) || product.priceRange.minVariantPrice.currencyCode !== 'USD') {
    return null;
  }
  
  const torso = /torso|hips-only/i.test(`${product.productType} ${product.handle}`);
  const full = !torso && !/head.only|accessor|charge|system/i.test(product.productType) && /doll/i.test(product.productType);
  const custom = product.extended.stockStatus === 'custom';
  
  let brand: BfcmBrand;
  let price = originalPrice;
  let gifts: string[] = [];
  let startsAt = '2026-11-18T00:00:00Z';
  let endsAt = BFCM_REVERT_AT;
  
  // Top Fire: $150 off + free second head (full silicone only)
  if (/\btop[ -]?fire\b/i.test(identity)) {
    if (!full || !/^(full )?silicone$/i.test(product.extended.material ?? '')) {
      return null;
    }
    brand = 'Top Fire';
    price = round(originalPrice - 150);
    gifts = ['second-head'];
    startsAt = '2026-11-15T00:00:00Z';
  }
  // Galatea: 3 free custom upgrades
  else if (/\bgalatea\b/i.test(identity) && custom) {
    brand = 'Galatea';
    // Price stays same, free options
    gifts = ['body-heating', 'vaginal-suction', 'oral-heating'];
  }
  // Climax: 10% off large dolls (>=$900) + free extras
  else if (/\bclimax\b/i.test(identity) && custom && (full || torso)) {
    brand = 'Climax';
    price = full && originalPrice >= 900 ? Math.floor(originalPrice * 0.9) : originalPrice;
    gifts = ['second-head', 'gel-butt', ...(full ? ['hands-feet'] : [])];
    startsAt = '2026-11-13T00:00:00Z';
  }
  // 6YE: 5% off + free extra head on large dolls (>=135cm, treat all 150-173cm as large)
  else if (/\b6ye\b/i.test(identity)) {
    brand = '6YE';
    price = Math.floor(originalPrice * 0.95);
    // Free extra head on dolls >= 135cm (treat all current 150-173cm as large)
    gifts = full && (product.extended.heightCm ?? 0) >= 135 ? ['second-head'] : [];
  }
  // IDO: Custom keeps current price + free wig/pad, RTS dolls $2499 (November promo, ends Nov 30)
  else if (/\bido(?:doll)?\b/i.test(identity) && full && (custom || product.extended.stockStatus === 'ready_to_ship')) {
    brand = 'IDO';
    // Custom (China-shipped): keep current price, add free wig + pad
    // US/EU stock (RTS): $2499 until Dec 1
    const isRTS = product.extended.stockStatus === 'ready_to_ship' || /\b(in.stock|ready.to.ship)\b/i.test(identity);
    price = isRTS ? 2499 : originalPrice; // RTS gets fixed price, custom keeps current
    gifts = !isRTS ? ['random-wig', 'moving-pad'] : []; // Only custom gets free extras
    startsAt = '2026-11-01T00:00:00Z';
    endsAt = IDO_REVERT_AT; // Ends Nov 30
  }
  else {
    return null;
  }
  
  // Check timing
  if (+now < Date.parse(startsAt) || +now >= Date.parse(endsAt) || price < 0) {
    return null;
  }
  
  return { brand, originalPrice, price, gifts, endsAt };
}

/**
 * Apply BFCM preview pricing to product (preview environment only)
 */
export function withBfcmPreview(
  product: Product, 
  environment = process.env.VERCEL_ENV, 
  now = new Date(), 
  enabled = process.env.DOL371_BRAND_PREVIEW === '1'
): Product {
  if (environment !== 'preview' || !enabled) {
    return product;
  }
  
  const offer = bfcmOffer(product, now);
  if (!offer) {
    return product;
  }
  
  const reprice = (value: string) => {
    const amount = Number(value);
    return (
      offer.brand === 'Top Fire' ? amount - 150 
      : offer.brand === '6YE' ? Math.floor(amount * 0.95)
      : offer.brand === 'Climax' && offer.price !== offer.originalPrice ? Math.floor(amount * 0.9)
      : offer.brand === 'IDO' ? offer.price 
      : amount
    ).toFixed(2);
  };
  
  return {
    ...product,
    extended: {
      ...product.extended,
      bfcmPreview: offer,
    },
    variants: product.variants.map(v => ({
      ...v,
      price: { ...v.price, amount: reprice(v.price.amount) },
    })),
    priceRange: {
      minVariantPrice: { 
        ...product.priceRange.minVariantPrice, 
        amount: reprice(product.priceRange.minVariantPrice.amount) 
      },
      maxVariantPrice: { 
        ...product.priceRange.maxVariantPrice, 
        amount: reprice(product.priceRange.maxVariantPrice.amount) 
      },
    },
  };
}

/**
 * Apply BFCM preview to customization config (add free options)
 */
export function bfcmPreviewConfig(
  config: BrandCustomizationConfig, 
  offer: BfcmPreview, 
  now = new Date()
) {
  if (+now >= Date.parse(offer.endsAt)) {
    return { config, flags: [] as string[] };
  }
  
  const flags: string[] = [];
  const mapped = new Set<string>();
  
  // Detect hand/feet upgrade types
  const handKinds = new Set(
    config.groups.flatMap(g =>
      g.options.flatMap(o => {
        const s = o.label.toLowerCase();
        return /\b(hands?|feet)\b/.test(s) && /\b(hard|wired)\b/.test(s)
          ? [/\bhard\b/.test(s) ? 'hard' : 'wired']
          : [];
      })
    )
  );
  
  // Process existing groups
  const groups = config.groups.map(g => {
    const extraHead = /^(an-extra(?:-free)?-head|additional-head|included-extra-head)$/.test(g.id);
    
    const options = g.options.map(o => {
      let gift = '';
      
      // Map option to gift type
      if (extraHead && !/^(no-|none$)/.test(o.id)) {
        gift = 'second-head';
      } else if (['body-heating', 'vaginal-suction', 'oral-heating'].includes(o.id)) {
        gift = o.id;
      } else if (/^gel-butt(?:-free)?$/.test(o.id)) {
        gift = 'gel-butt';
      } else if (
        handKinds.size === 1 && 
        /\b(hands?|feet)\b/i.test(o.label) && 
        /\b(hard|wired)\b/i.test(o.label)
      ) {
        gift = 'hands-feet';
      }
      
      // If this option is a promo gift, make it free
      if (!offer.gifts.includes(gift) || o.factoryExists === false || o.displayable === false) {
        return o;
      }
      
      mapped.add(gift);
      
      return {
        ...o,
        priceDelta: 0,
        priceVerified: true,
        purchasable: true,
        priceLabel: 'included' as const,
        ...(gift !== 'second-head' ? { bfcmIncluded: true } : {}),
      };
    });
    
    return {
      ...g,
      ...(extraHead && offer.gifts.includes('second-head')
        ? { selectionMode: 'single' as const }
        : {}),
      options,
    };
  });
  
  // Add missing gifts as new groups
  const addGift = (id: string, label: string) => {
    groups.push({
      id: `bfcm-${id}`,
      label,
      required: true,
      selectionMode: 'single',
      display: 'compact',
      options: [
        {
          id,
          label,
          priceDelta: 0,
          priceVerified: true,
          purchasable: true,
          priceLabel: 'included',
        },
      ],
    } as CustomizationGroup);
    mapped.add(id);
  };
  
  for (const gift of offer.gifts) {
    if (mapped.has(gift)) continue;
    
    if (gift === 'random-wig') {
      addGift(gift, 'One extra random wig');
    } else if (gift === 'moving-pad') {
      addGift(gift, 'Doll moving pad');
    } else if (gift === 'second-head') {
      addGift(gift, 'One extra head');
    } else if (gift === 'gel-butt') {
      addGift(gift, 'Gel butt upgrade');
    } else if (gift === 'hands-feet') {
      flags.push(
        `Climax hands/feet: ${
          handKinds.size
            ? 'both hard and wired options exist'
            : 'no matching upgrade exists'
        }; left unset`
      );
    } else {
      flags.push(`Missing confirmed gift option: ${gift}`);
    }
  }
  
  return { config: { ...config, groups }, flags };
}

/**
 * Apply BLACKFRIDAYWOW26 discount code to cart (stacks with brand promos)
 */
export function bfcmCalculatedCart(subtotal: number) {
  const discount = subtotal >= 900 ? 299 : 0;
  return { 
    subtotal: round(subtotal), 
    discount, 
    total: round(subtotal - discount) 
  };
}
