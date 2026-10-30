import menus from './gynoid-reviewed-menus.json';
import { sampleProducts } from '@/lib/data/sample-products';
import type { Product } from '@/types/product';
import type { CustomizationGroup } from '@/types/customization';
import reviewed from '@/data/catalog/gynoid-approved-configurations.json';

export function gynoidProductFixture(index = 0): Product {
  const saved = menus.products[index];
  return {
    ...structuredClone(sampleProducts[0]), id: saved.productId, handle: saved.handle,
    vendor: 'Gynoid', tags: ['gynoid', 'customizable', saved.tag],
    extended: { brand: 'Gynoid', headModel: reviewed.products[index].headModel, stockStatus: 'custom', customAvailable: true,
      customizationGroups: saved.groupKeys.map(key => structuredClone(menus.groups[key as keyof typeof menus.groups])) as CustomizationGroup[] }
  };
}
