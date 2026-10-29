import { canonicalBrandValue } from '@/lib/catalog/brands';
import { seHalloweenPreviewClockEnabled } from '@/lib/promotions/seHalloween2026';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationRule } from '@/types/customization';

export const SE_ELF_FACTS: Record<string, {skin: 'Red' | 'Black'; body: string}> = {
  'sedoll-samantha-l-153cm-a-cup-red-tpe-elf-sed338': {skin: 'Red', body: '153A'},
  'sedoll-luis-g-157cm-h-cup-red-tpe-elf-sed339': {skin: 'Red', body: '157H'},
  'sedoll-samantha-k-161cm-f-cup-black-tpe-elf-sed340': {skin: 'Black', body: '161F'},
  'sedoll-luis-h-163cm-e-cup-black-tpe-elf-sed341': {skin: 'Black', body: '163E'}
};

export function withSeOct27PreviewRules(product: Product, config: BrandCustomizationConfig): BrandCustomizationConfig {
  const photographedSkin = SE_ELF_FACTS[product.handle]?.skin;
  if ((!photographedSkin && !seHalloweenPreviewClockEnabled()) || canonicalBrandValue(product.extended.brand ?? product.vendor) !== 'sedoll') return config;
  let groups = config.groups.map(group => ({ ...group, options: group.options
    .filter(option => !/hip[ -]?thrust/i.test(option.label))
    .filter(option => !/robot/i.test(group.label)
      || /^(?:nodding|waist[ -]?spin)$/i.test(option.label.replace(/\([^)]*\)/g, '').trim())
      || option.priceDelta === 0 && /^(?:no\b|none\b|without\b)/i.test(option.label))
    .map(option => /loose[ -]?joint/i.test(option.label) ? { ...option,
      description: 'For supported lying positions only. Cannot stand alone, sit unsupported or retain strong poses.'
    } : option)
  }));
  if (photographedSkin) groups = groups.map(group => group.id !== 'skin-tone' ? group : {
    ...group, options: [{id: 'photographed-skin', label: `${photographedSkin} (as photographed)`,
      priceDelta: 0, priceVerified: true, purchasable: true, dollVueEnabled: false,
      description: 'The photographed Elf skin colour is included in the base price.'},
    ...group.options.filter(option => option.id !== 'photographed-skin')]
  });
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
  // The supplied red/black TPE look is not evidence of silicone-head compatibility.
  if (photographedSkin) for (const head of groups.find(group => group.id === 'silicone-head-upgrade')?.options ?? []) {
    if (head.id === 'keep-original-head') continue;
    rules.push({id: `elf-skin-no-silicone-${head.id}`, type: 'incompatible',
      when: {groupId: 'silicone-head-upgrade', optionId: head.id},
      conflictsWith: {groupId: 'skin-tone', optionId: 'photographed-skin'},
      message: 'Silicone head upgrades are currently available in Light Tan only.'});
  }
  return { ...config, groups, rules: [...config.rules, ...rules] };
}
