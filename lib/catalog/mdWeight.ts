import type { Product } from '@/types/product';
import { MD_MENU_TAG } from '@/lib/customization/ido-md';

export function isMdReleaseWeight(product: Pick<Product, 'vendor' | 'extended' | 'tags'>) {
  return product.tags.includes(MD_MENU_TAG) && isMdWeightBrand(product.extended.brand || product.vendor);
}

export function isMdWeightBrand(brand?: string) {
  return /^(md|mddoll|mddolls)$/.test((brand || '').toLowerCase().replace(/[\s-]/g, ''));
}

export function mdFactoryBodyKg(brand?: string, measurements?: Record<string, string>) {
  if (!isMdWeightBrand(brand)) return undefined;
  const match = measurements?.['Factory body weight']?.trim().match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  const kg = match ? Number(match[1]) : undefined;
  return kg && Number.isFinite(kg) ? kg : undefined;
}

// Factory body mass does not establish head inclusion or shipping mass.
export function catalogWeightLb(brand: string | undefined, measurements: Record<string, string> | undefined, fallback?: number, tags?: string[]) {
  if (!isMdWeightBrand(brand) || !tags?.includes(MD_MENU_TAG)) return fallback;
  const kg = mdFactoryBodyKg(brand, measurements);
  return kg === undefined ? fallback : Number((kg * 2.2046226218).toFixed(1));
}

export function productWeightLabel(product: Pick<Product, 'vendor' | 'extended' | 'tags'>) {
  const brand = product.extended.brand || product.vendor;
  if (!isMdReleaseWeight(product)) return 'Weight';
  return mdFactoryBodyKg(brand, product.extended.measurements) === undefined ? 'Listed weight' : 'Body weight';
}
