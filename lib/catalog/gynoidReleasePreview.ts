import 'server-only';
import snapshots from '@/data/draft-previews/gynoid-oct28.json';
import approved from '@/data/catalog/gynoid-approved-configurations.json';
import type { Product } from '@/types/product';
import { gynoidBodyVersionMappings } from './gynoid-body-versions';
import { gynoidReleasePreviewEnabled } from './gynoid-release-preview-flag';
import { getGynoidCustomizationConfig } from '@/lib/customization/gynoid';

/** Saved authorized photos/specs with 30 Oct real IDs/prices; never a production fallback. */
export function gynoidReleasePreviewProducts(): Product[] {
  if (!gynoidReleasePreviewEnabled()) return [];
  return snapshots.map(saved => {
    const row = approved.products.find(row => row.handle === saved.handle &&
      row.productId.split('/').at(-1) === saved.id.split(':').at(-1));
    if (!row) throw new Error('Unreviewed Gynoid preview identity.');
    const product = structuredClone(saved) as unknown as Product;
    product.id = row.productId;
    delete product.extended.previewCustomizationFixture;
    const body = gynoidBodyVersionMappings.find(body => body.productId === row.productId && body.handle === row.handle);
    product.variants = [{ id: row.standardVariantId, title: body ? 'Standard' : 'Base custom build', availableForSale: false,
      price: { amount: row.standardUSD.toFixed(2), currencyCode: 'USD' },
      selectedOptions: body ? [{ name: 'Body version', value: 'Standard' }] : saved.variants[0].selectedOptions }];
    if (body) product.variants.push({ id: body.deluxeVariantId, title: 'Deluxe', availableForSale: false,
      price: { amount: body.deluxeUSD.toFixed(2), currencyCode: 'USD' }, selectedOptions: [{ name: 'Body version', value: 'Deluxe' }] });
    product.priceRange = { minVariantPrice: product.variants[0].price, maxVariantPrice: product.variants.at(-1)!.price };
    product.extended.customizationGroups = getGynoidCustomizationConfig(product)!.groups;
    return product;
  });
}
