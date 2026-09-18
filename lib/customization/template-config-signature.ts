import type { BrandCustomizationConfig } from '@/types/customization';

/** Exact checkout-relevant menu identity; excludes images and editorial text. */
export function templateConfigSignature(config: BrandCustomizationConfig) {
  return JSON.stringify({
    groups: config.groups.map(group => ({
      id: group.id,
      required: Boolean(group.required),
      multiple: group.selectionMode === 'multiple',
      ...(group.visibleWhen === undefined ? {} : { visibleWhen: group.visibleWhen }),
      options: group.options.map(option => ({
        id: option.id,
        price: option.priceDelta ?? null,
        purchasable: option.purchasable ?? null,
        verified: option.priceVerified ?? null,
        exists: option.factoryExists ?? null,
        displayable: option.displayable ?? null,
        signals: option.sourceProductionNoteSignals ?? null
      }))
    })),
    rules: config.rules.map(rule => ({ type: rule.type, when: rule.when, conflictsWith: rule.conflictsWith }))
  });
}
