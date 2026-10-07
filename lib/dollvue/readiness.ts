import { createHash } from 'node:crypto';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { classifyAppearance, DOLLVUE_APPEARANCE_POLICY } from './appearance';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';
import { productImageSources } from '@/lib/catalog/productImage';

export type DollVueReadinessRecord = {
  productId: string;
  policy: string;
  fingerprint: string;
  status: 'ready' | 'excluded' | 'needs-review';
  sourcePositions: number[];
  imageDigests?: Record<string, string>;
  choices: Array<{ groupId: string; optionId: string; reference: string }>;
};

// Prices and private provenance do not change appearance. Menu meaning and photos do.
export function dollVueReadinessFingerprint(product: Product, config: BrandCustomizationConfig) {
  return createHash('sha256').update(JSON.stringify({
    policy: DOLLVUE_APPEARANCE_POLICY,
    id: product.id,
    brand: product.extended.brand || product.vendor,
    stock: product.extended.stockStatus,
    groups: config.groups.map(group => ({
      id: group.id, label: group.label, selectionMode: group.selectionMode,
      visibleWhen: group.visibleWhen,
      options: group.options.map(option => ({
        id: option.id, label: option.label, swatch: option.swatch,
        factoryExists: option.factoryExists, displayable: option.displayable,
      })),
    })),
    rules: config.rules.map(rule => ({ type: rule.type, when: rule.when, conflictsWith: rule.conflictsWith })),
    photos: productImageSources(product).slice(0, 8).map(photo => ({ url: photo.url, width: photo.width, height: photo.height })),
  })).digest('hex');
}

export function evaluateDollVueReadiness(product: Product, config: BrandCustomizationConfig,
  record: DollVueReadinessRecord | undefined,
  context: { published: boolean; privateReview?: boolean; contentExcluded: boolean }) {
  const unavailable = { ready: false, publiclyAvailable: false, privatelyAvailable: false, choices: [], sourcePositions: [] } as const;
  if (product.extended.stockStatus === 'ready_to_ship' || context.contentExcluded) return { ...unavailable, reason: 'excluded' };
  if (!record || record.status !== 'ready') return { ...unavailable, reason: record?.status || 'needs-review' };
  if (record.productId !== product.id || record.policy !== DOLLVUE_APPEARANCE_POLICY ||
    record.fingerprint !== dollVueReadinessFingerprint(product, config)) return { ...unavailable, reason: 'stale-review' };
  if (!record.choices.length || !record.sourcePositions.length) return { ...unavailable, reason: 'incomplete-review' };
  const photos = productImageSources(product);
  const validPhotos = record.sourcePositions.every(position => Number.isInteger(position) && position >= 0 && position < 8 &&
    isOwnedOptionAsset(photos[position]?.url));
  const validChoices = record.choices.every(choice => {
    const group = config.groups.find(item => item.id === choice.groupId);
    const option = group?.options.find(item => item.id === choice.optionId);
    return group && option && !group.visibleWhen?.length && classifyAppearance(group, option).status === 'candidate' &&
      option.swatch?.kind === 'image' && option.swatch.value === choice.reference && isOwnedOptionAsset(choice.reference);
  });
  if (!validPhotos || !validChoices) return { ...unavailable, reason: 'invalid-reviewed-reference' };
  const reviewedImages = [...record.sourcePositions.map(position => photos[position].url),
    ...record.choices.map(choice => choice.reference)];
  if (reviewedImages.some(url => !/^[a-f0-9]{64}$/.test(record.imageDigests?.[url] ?? ''))) {
    return { ...unavailable, reason: 'missing-image-binding' };
  }
  return { ready: true, publiclyAvailable: context.published, privatelyAvailable: Boolean(context.privateReview),
    choices: record.choices.map(({ groupId, optionId }) => ({ groupId, optionId })),
    sourcePositions: record.sourcePositions, reason: 'ready' };
}

export function reviewedDollVueConfig(config: BrandCustomizationConfig,
  readiness: ReturnType<typeof evaluateDollVueReadiness>, audience: 'public' | 'private'): BrandCustomizationConfig {
  const available = readiness.ready && (audience === 'public' ? readiness.publiclyAvailable : readiness.privatelyAvailable);
  return { ...config, groups: config.groups.map(group => ({ ...group, options: group.options.map(option => ({
    ...option, dollVueEnabled: Boolean(available && readiness.choices.some(choice =>
      choice.groupId === group.id && choice.optionId === option.id)),
  })) })) };
}
