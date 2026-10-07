import 'server-only';
import type { Product } from '@/types/product';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import { dollVueConfigForProduct, dollVueGroups, isLegacyDollVueCatalogProduct } from './config';
import { evaluateDollVueReadiness, reviewedDollVueConfig, type DollVueReadinessRecord } from './readiness';
import registryData from './readiness-registry.json';
import { getCurrentDollVueHold } from './currentHold';

const registry = registryData as Readonly<Record<string, DollVueReadinessRecord>>;

export function isDollVueExcluded(product: Product) {
  return product.extended.stockStatus === 'ready_to_ship' ||
    product.tags.some(tag => /age.*hold|safety.*hold|content.*hold|^dollwow-system$|^custom-option-charge$|^dollwow-test$/i.test(tag)) ||
    /head only|head-only|torso|accessor|upgrade|customization|charge|^system\b/i.test(product.productType);
}

/** Product must come from a strict Storefront lookup before public use. */
export function resolveDollVueEligibility(product: Product) {
  const config = dollVueConfigForProduct(product, getCustomizationConfig(product));
  const record = registry[product.id];
  if (record) {
    const readiness = evaluateDollVueReadiness(product, config, record, {
      published: true, contentExcluded: isDollVueExcluded(product),
    });
    return { available: readiness.publiclyAvailable, config: reviewedDollVueConfig(config, readiness, 'public'),
      sourcePositions: [...readiness.sourcePositions], revision: record.fingerprint,
      imageDigests: record.imageDigests };
  }
  // Preserve the already released pilot. New brands require an exact reviewed record.
  // Conditional appearance support requires a reviewed record, never legacy option flags.
  const legacyConfig = { ...config, groups: config.groups.map(group => group.visibleWhen === undefined ? group : {
    ...group, options: group.options.map(option => ({ ...option, dollVueEnabled: false })),
  }) };
  const sourcePositions = productImageSources(product).slice(0, 8)
    .flatMap((photo, position) => isOwnedOptionAsset(photo.url) ? [position] : []);
  return { available: !isDollVueExcluded(product) && isLegacyDollVueCatalogProduct(product) &&
    dollVueGroups(legacyConfig).length > 0 && sourcePositions.length > 0,
    config: legacyConfig, sourcePositions, revision: 'legacy-appearance-v2', imageDigests: undefined };
}

/** Check private holds at the point of use; never expose their contents publicly. */
export async function resolveCurrentDollVueEligibility(product: Product) {
  const eligibility = resolveDollVueEligibility(product);
  if (!eligibility.available) return eligibility;
  const hold = await getCurrentDollVueHold(product.id);
  return hold === 'clear' ? eligibility : { ...eligibility, available: false, sourcePositions: [] };
}

/** Lightweight lists never include the private review record or full option menus. */
export function withDollVueCatalogEligibility(product: Product): Product {
  const record = registry[product.id];
  const available = !isDollVueExcluded(product) && (record ? record.status === 'ready' : isLegacyDollVueCatalogProduct(product));
  return { ...product, dollVueAvailable: available };
}
