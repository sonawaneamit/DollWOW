import 'server-only';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import jevLookDecisions from './jev-mmxfanreal.json';
import { dollVueConfigForProduct, dollVueGroups, isLegacyDollVueCatalogProduct } from './config';
import { evaluateDollVueReadiness, reviewedDollVueConfig, type DollVueReadinessRecord } from './readiness';
import registryData from './readiness-registry.json';
import { getCurrentDollVueHold } from './currentHold';

const registry = registryData as Readonly<Record<string, DollVueReadinessRecord>>;
type Eligibility = {
  available: boolean;
  config: BrandCustomizationConfig;
  sourcePositions: number[];
  revision: string;
  imageDigests: DollVueReadinessRecord['imageDigests'];
  renderer?: DollVueReadinessRecord['renderer'];
  expandedLook?: boolean;
};

export function isDollVueExcluded(product: Product) {
  const isPreviewDeployment = process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  return product.extended.stockStatus === 'ready_to_ship' ||
    product.tags.some(tag => {
      if (/^dollwow-test$/i.test(tag)) return !isPreviewDeployment;
      return /age.*hold|safety.*hold|content.*hold|^dollwow-system$|^custom-option-charge$/i.test(tag);
    }) ||
    /head only|head-only|torso|accessor|upgrade|customization|charge|^system\b/i.test(product.productType);
}

/** Product must come from a strict Storefront lookup before public use. */
export function resolveDollVueEligibility(product: Product): Eligibility {
  const config = dollVueConfigForProduct(product, getCustomizationConfig(product));
  const record = registry[product.id];
  if (record) {
    const readiness = evaluateDollVueReadiness(product, config, record, {
      published: true, contentExcluded: isDollVueExcluded(product),
    });
    return { available: readiness.publiclyAvailable, config: reviewedDollVueConfig(config, readiness, 'public'),
      sourcePositions: [...readiness.sourcePositions], revision: record.fingerprint,
      imageDigests: record.imageDigests, renderer: record.renderer };
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
    config: legacyConfig, sourcePositions, revision: 'legacy-appearance-v2', imageDigests: undefined, renderer: undefined };
}

export function expandDollVueLook(product: Product, eligibility: Eligibility): Eligibility {
  if (!eligibility.available || eligibility.renderer !== 'protected-iris' || !/^(mmx|fanreal)-/.test(product.handle)) {
    return eligibility;
  }

  const sourceConfig = getCustomizationConfig(product);
  const brand = product.handle.startsWith('mmx-') ? 'MMX' : 'Fanreal';
  const verdicts: Record<string, string> = jevLookDecisions;
  const hairService = sourceConfig.groups.find(group => group.id === 'hair-options');
  const config = { ...sourceConfig, groups: sourceConfig.groups.map(group => ({
    ...group,
    visibleWhen: ['high-temperature-fiber', 'human-hair'].includes(group.id) &&
      group.visibleWhen?.length === 1 && group.visibleWhen[0].length === 1 &&
      group.visibleWhen[0][0].groupId === hairService?.id &&
      hairService.options.some(option => option.id === group.visibleWhen?.[0][0].optionId &&
        option.factoryExists !== false && option.displayable !== false && option.purchasable !== false)
      ? undefined : group.visibleWhen,
    options: group.options.map(option => ({
      ...option,
      dollVueEnabled: option.factoryExists !== false && option.displayable !== false && option.purchasable !== false &&
        option.swatch?.kind === 'image' && isOwnedOptionAsset(option.swatch.value) &&
        verdicts[JSON.stringify([brand, group.id, group.label, option.id, option.label])] === 'VISIBLE',
    })),
  })) };
  return { ...eligibility, config, expandedLook: true };
}

/** Check private holds at the point of use; never expose their contents publicly. */
export async function resolveCurrentDollVueEligibility(product: Product, options: { holdTimeoutMs?: number } = {}) {
  const eligibility = resolveDollVueEligibility(product);
  if (!eligibility.available) return eligibility;
  const hold = await getCurrentDollVueHold(product.id, options.holdTimeoutMs);
  return hold === 'clear' ? expandDollVueLook(product, eligibility) : { ...eligibility, available: false, sourcePositions: [] };
}

/** Lightweight lists never include the private review record or full option menus. */
export function withDollVueCatalogEligibility(product: Product): Product {
  const record = registry[product.id];
  const available = !isDollVueExcluded(product) && (record ? record.status === 'ready' : isLegacyDollVueCatalogProduct(product));
  return { ...product, dollVueAvailable: available };
}
