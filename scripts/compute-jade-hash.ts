import type { Product } from '../types/product';
import { templateRuntimeHash } from '../lib/customization/template-release-registry';
import { getCustomizationConfig } from '../lib/customization/configs';

// Actual product data from Shopify
const product: Product = {
  id: 'gid://shopify/Product/10761476276408',
  handle: 'wm-jade-sterling-164cm-g-cup-silicone-companion-doll-js166',
  title: 'WM Jade Sterling 164cm G-Cup Silicone Customizable Companion Doll',
  vendor: 'DollWow',
  productType: 'Custom Silicone doll',
  description: '',
  tags: ["custom", "customizable", "female-doll", "height-160-164", "options:wm-female-silicone-softness", "silicone", "weight-75-89", "wm", "wm-dolls"],
  featuredImage: null,
  images: [],
  variants: [{
    id: 'gid://shopify/ProductVariant/54991796469944',
    title: 'Default Title',
    availableForSale: true,
    selectedOptions: [{ name: 'Title', value: 'Default Title' }],
    price: { amount: '2159.00', currencyCode: 'USD' }
  }],
  priceRange: {
    minVariantPrice: { amount: '2159.0', currencyCode: 'USD' },
    maxVariantPrice: { amount: '2159.0', currencyCode: 'USD' }
  },
  extended: {
    brand: 'WM Dolls',
    bodyType: 'female',
    material: 'Silicone',
    heightCm: 164,
    cupSize: 'G-Cup',
    catalogIdentityKey: 'wm__jade-sterling__164cm__g-cup__silicone__js166',
    headModel: 'JS166',
    stockStatus: 'custom',
    customAvailable: true
  }
};

const config = getCustomizationConfig(product);
const runtimeHash = templateRuntimeHash(product, config);

console.log('\n✅ CORRECT RUNTIME HASH FOR JADE STERLING:');
console.log(runtimeHash);
console.log('\n📝 Old (wrong) hash: b206dbb65a5fb6aac31299307a2cc5c51b06da6ddad424a454e0c49a76b3a431');
console.log('\nConfig ID:', config.id);
console.log('Product tags:', product.tags);
console.log('\nUpdate template-release.json entry at index 2049 with the CORRECT hash above.');
