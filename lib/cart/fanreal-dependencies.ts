import { createHash } from 'node:crypto';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, SelectedCustomizationOption } from '@/types/customization';
import { groupedCartAttributes } from '@/lib/customization/resolve';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import scope from './evidence/fanreal-nov10-dependency-scope.json';

export function fanrealDependencyMenuHash(config: BrandCustomizationConfig) {
  return createHash('sha256').update(templateConfigSignature(config)).digest('hex');
}

/** Only exact reviewed menus may move their included style details onto a paid hair line. */
export function createFanrealDependencyPlanner(parents: Record<string, string>) {
  return (product: Product, config: BrandCustomizationConfig, selected: SelectedCustomizationOption[], quantity: number) => {
    if (!Object.hasOwn(parents, product.id)) return undefined;
    if (parents[product.id] !== fanrealDependencyMenuHash(config)) throw new Error('This Fanreal configuration needs a fresh checkout review.');
    const paid = selected.filter(option => option.priceDelta > 0);
    const hair = paid.find(option => option.groupId === 'hair-options');
    const owned = new Set<SelectedCustomizationOption>();
    for (const option of selected) {
      const group = config.groups.find(group => group.id === option.groupId);
      const activeBranches = group?.visibleWhen?.filter(branch => branch.every(condition => selected.some(choice => choice.groupId === condition.groupId && choice.optionId === condition.optionId))) ?? [];
      const paidConditions = activeBranches.flat().filter(condition => paid.some(choice => choice.groupId === condition.groupId && choice.optionId === condition.optionId));
      if (!paidConditions.length) continue;
      const approvedChild = hair?.optionId === 'wig-transplant-ht-fiber' && hair.priceDelta === 249 && option.groupId === 'high-temperature-fiber' ||
        hair?.optionId === 'hair-transplant-human' && hair.priceDelta === 399 && option.groupId === 'human-hair';
      if (!approvedChild || option.priceDelta !== 0 || paidConditions.some(condition => condition.groupId !== 'hair-options' || condition.optionId !== hair!.optionId)) {
        throw new Error('This Fanreal option dependency needs an exact checkout mapping.');
      }
      owned.add(option);
    }
    return {
      items: paid.map(option => ({ group: option.groupLabel, label: option.optionLabel, amount: Math.round(option.priceDelta * quantity * 100) / 100,
        ...(option === hair && owned.size ? { dependencyDetails: { scope: 'fanreal-v1' as const, included: groupedCartAttributes([...owned], 'Included: '), configured: [] } } : {}) })),
      included: selected.filter(option => option.priceDelta === 0 && !owned.has(option))
    };
  };
}
export const fanrealDependencyPlan = createFanrealDependencyPlanner(scope.parents);
