import type { Product } from '@/types/product';

export const ZARGA_HANDLE = 'climax-zarga-70cm-silicone-halloween';
export const ZARGA_PREVIEW_ID = 'preview:zarga-halloween';

export function zargaPreviewEnabled() {
  return process.env.VERCEL_ENV === 'preview' && process.env.DOLLWOW_ZARGA_PREVIEW === '1';
}

export function isZargaPreviewProduct(product: Pick<Product, 'id' | 'handle'>) {
  return zargaPreviewEnabled() && product.id === ZARGA_PREVIEW_ID && product.handle === ZARGA_HANDLE;
}

export function zargaLocalImagePath(product: Pick<Product, 'id' | 'handle'>, url: string) {
  return isZargaPreviewProduct(product) && /^\/images\/products\/climax-zarga-halloween\/(0[1-9]|1[0-9]|2[0-6])\.webp$/.test(url)
    ? `public${url}` : null;
}

export function zargaPreviewProduct(): Product {
  const images = Array.from({ length: 26 }, (_, index) => ({
    url: `/images/products/climax-zarga-halloween/${String(index + 1).padStart(2, '0')}.webp`,
    altText: `Climax Zarga Halloween edition, ${index >= 23 ? 'size reference' : 'product view'} ${index + 1}`
  }));
  const price = { amount: '850.00', currencyCode: 'USD' };
  return {
    id: ZARGA_PREVIEW_ID, handle: ZARGA_HANDLE,
    title: 'Climax Zarga 70cm Silicone Halloween Edition',
    description: 'Zarga brings the photographed red-skin Halloween look to a compact 70cm full-silicone build. Gel breasts, a 3D soft vagina, hard hands and feet, shrugging shoulders and knee gear joints are included. Keep the photographed build or add gel buttocks. Confirm availability and delivery timing with our team before ordering.',
    vendor: 'Climax Doll', productType: 'Silicone Doll', tags: ['dollwow-test', 'brand:climax', 'options:zarga-halloween'],
    featuredImage: images[0], images,
    variants: [{ id: 'preview:variant:zarga-halloween', title: 'Photographed build', availableForSale: false, price, selectedOptions: [] }],
    priceRange: { minVariantPrice: price, maxVariantPrice: price },
    extended: {
      brand: 'Climax Doll', displayName: 'Zarga', bodyCode: 'Si70cm GB', material: 'Silicone', heightCm: 70,
      weightLb: 10.18 * 2.2046226218, stockStatus: 'check_stock', customAvailable: true,
      previewCustomizationFixture: true,
      editorialIntro: {
        eyebrow: 'Pumpkin light, red and black',
        heading: 'Zarga takes the Halloween spotlight',
        paragraph: 'Zarga stands against an iron gate and a scatter of Halloween pumpkins, her red finish set off by a draped black outfit. Short silver-grey hair frames her yellow-green eyes, while long pointed ears and dark nails keep the look unmistakably her own. A ringed choker and matching thigh strap add small flashes of metal to the red-and-black palette. The 70cm silicone build gives this Halloween edition a compact, sculptural presence. It is a character-led look, with as much attention in the face and styling as in the silhouette. Zarga brings a little theatrical mischief to a collection, without needing a grand stage.'
      },
      measurements: {
        Height: '70 cm', Weight: '10.18 kg', Bust: '58.2 cm', Underbust: '31 cm', Waist: '36.4 cm', Hip: '53 cm',
        'Shoulders Width': '23 cm', 'Neck circumference': '13.2 cm', 'Arms Length': '28.8 cm',
        'Upper arm circumference': '16.7 cm', 'Legs Length': '35.6 cm', 'Thigh circumference': '30.1 cm', 'Feet Length': '13 cm'
      },
      customizationGroups: [
        { id: 'photographed-build', label: 'Build', required: true, selectionMode: 'single', display: 'cards', options: [
          { id: 'as-shown', label: 'Photographed build', description: 'The red-skin Halloween look shown in the gallery, with the included factory features.', priceDelta: 0, priceVerified: true, purchasable: true }
        ] },
        { id: 'gel-butt', label: 'Gel buttocks', required: true, selectionMode: 'single', display: 'cards', options: [
          { id: 'none', label: 'No add-on', priceDelta: 0, priceVerified: true, purchasable: true },
          { id: 'gel-butt', label: 'Gel buttocks', description: 'Add the gel-butt upgrade to this build.', priceDelta: 65, priceVerified: true, purchasable: true }
        ] }
      ]
    }
  };
}
