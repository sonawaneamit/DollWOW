import { canonicalBrandValue } from '@/lib/catalog/brands';
import { seHalloweenPreviewClockEnabled } from '@/lib/promotions/seHalloween2026';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationRule } from '@/types/customization';

export function withSeOct27PreviewRules(product: Product, config: BrandCustomizationConfig): BrandCustomizationConfig {
  if (!seHalloweenPreviewClockEnabled() || canonicalBrandValue(product.extended.brand ?? product.vendor) !== 'sedoll') return config;
  const groups = config.groups.map(group => ({ ...group, options: group.options
    .filter(option => !/hip[ -]?thrust/i.test(option.label))
    .filter(option => !/robot/i.test(group.label)
      || /^(?:nodding|waist[ -]?spin)$/i.test(option.label.replace(/\([^)]*\)/g, '').trim())
      || option.priceDelta === 0 && /^(?:no\b|none\b|without\b)/i.test(option.label))
    .map(option => /loose[ -]?joint/i.test(option.label) ? { ...option,
      description: 'For supported lying positions only. Cannot stand alone, sit unsupported or retain strong poses.'
    } : option)
  }));
  const heads = groups.filter(group => /head/i.test(group.label) && !/extra|second|additional/i.test(group.label))
    .flatMap(group => group.options.filter(option => /\b120\b/.test(option.label) && /melody/i.test(option.label))
      .map(option => ({ groupId: group.id, optionId: option.id })));
  const eyelids = groups.flatMap(group => group.options.filter(option => /movable eyelids/i.test(option.label))
    .map(option => ({ groupId: group.id, optionId: option.id })));
  const rules: CustomizationRule[] = heads.flatMap(head => eyelids.map(eyelid => ({
    id: `se120-no-eyelids-${head.groupId}-${head.optionId}-${eyelid.groupId}-${eyelid.optionId}`,
    type: 'incompatible' as const, when: head, conflictsWith: eyelid,
    message: 'Movable eyelids are not available on head #120 Melody.'
  })));
  return { ...config, groups, rules: [...config.rules, ...rules] };
}
