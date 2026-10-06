import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption } from '@/types/customization';
import { sanitizeImportedProductionNote } from '@/lib/customization/production-notes';
import { productDisplayName } from '@/lib/catalog/naming';
import { catalogLookOptions, productMatchesLook } from '@/lib/catalog/lookTags';
import { ownedOptionGroups } from '@/lib/assets/option-assets.mjs';

function pick<T, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]])) as Pick<T, K>;
}

function publicResource(href: string) {
  try {
    const url = new URL(href, 'https://dollwow.com');
    return ['http:', 'https:'].includes(url.protocol)
      && !/(^|\.)(?:drive|mail|docs)\.google\.com$/i.test(url.hostname);
  } catch { return false; }
}

export function publicCustomizationGroups(groups: CustomizationGroup[]): CustomizationGroup[] {
  return ownedOptionGroups(groups).map(group => ({
    ...pick(group, ['id', 'label', 'description', 'required', 'selectionMode', 'display']),
    ...(group.resources ? { resources: group.resources.filter(resource => publicResource(resource.href))
      .map(resource => pick(resource, ['label', 'href', 'kind'])) } : {}),
    ...(group.visibleWhen ? { visibleWhen: group.visibleWhen.map(branch => branch.map(choice => pick(choice, ['groupId', 'optionId']))) } : {}),
    options: group.options.map((option): CustomizationOption => ({
      ...pick(option, ['id', 'label', 'description', 'priceDelta', 'factoryExists', 'displayable', 'dollVueEnabled', 'priceVerified', 'priceLabel', 'purchasable']),
      productionNote: sanitizeImportedProductionNote(option.productionNote),
      // These boolean classifications participate in default selection and preset signatures.
      ...(option.sourceProductionNoteSignals ? { sourceProductionNoteSignals: pick(option.sourceProductionNoteSignals,
        ['defaultSupplierSelection', 'noPaidAddOn', 'photographedProductConfiguration']) } : {}),
      ...(option.swatch ? { swatch: pick(option.swatch, ['kind', 'value', 'label']) } : {})
    }))
  }));
}

export function publicCustomizationConfig(config: BrandCustomizationConfig): BrandCustomizationConfig {
  return {
    ...pick(config, ['id', 'brandLabel', 'leadTimeNote']),
    groups: publicCustomizationGroups(config.groups),
    rules: config.rules.map(rule => ({
      ...pick(rule, ['id', 'type', 'message']),
      when: pick(rule.when, ['groupId', 'optionId']),
      conflictsWith: pick(rule.conflictsWith, ['groupId', 'optionId'])
    }))
  };
}

/** Project only at the server/client boundary; never mutate checkout/source records. */
export function publicProductPayload(product: Product): Product {
  return {
    ...pick(product, ['id', 'handle', 'title', 'description', 'seo', 'vendor', 'productType', 'tags', 'featuredImage', 'images', 'media', 'variants', 'priceRange']),
    extended: {
      ...pick(product.extended, ['catalogIdentityKey', 'catalogBodyIdentityKey', 'headModel', 'bodyCode', 'displayName', 'bodyType', 'lookTags', 'brand', 'sourceTitle', 'sourceHandle', 'sourceReleaseRank', 'material', 'heightCm', 'weightLb', 'cupSize', 'measurements', 'warehouseCountry', 'warehouseRegions', 'stockStatus', 'deliveryEstimate', 'stockLastCheckedAt', 'customAvailable', 'penisAddOnAvailable']),
      ...(product.extended.customizationGroups ? { customizationGroups: publicCustomizationGroups(product.extended.customizationGroups) } : {}),
      ...(product.extended.editorialIntro ? { editorialIntro: pick(product.extended.editorialIntro, ['eyebrow', 'heading', 'paragraph']) } : {})
    }
  };
}

/** Product-shaped card props keep shared naming/filter helpers usable without shipping PDP data. */
export function homepageCardPayload(product: Product): Product {
  return {
    ...pick(product, ['id', 'handle', 'title', 'vendor', 'productType', 'tags', 'featuredImage', 'priceRange']),
    description: '',
    images: product.featuredImage ? [product.featuredImage] : product.images.slice(0, 1),
    variants: [],
    extended: {
      ...pick(product.extended, ['headModel', 'bodyType', 'lookTags', 'brand', 'material', 'heightCm', 'weightLb', 'cupSize', 'warehouseCountry', 'warehouseRegions', 'stockStatus', 'customAvailable']),
      displayName: productDisplayName(product),
      lookTags: catalogLookOptions.filter(look => productMatchesLook(product, look.value)).map(look => look.value)
    }
  };
}
