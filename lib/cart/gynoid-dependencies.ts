import reviewed from '@/data/catalog/gynoid-approved-configurations.json';
import { groupedCartAttributes } from '@/lib/customization/resolve';
import type { BrandCustomizationConfig, SelectedCustomizationOption } from '@/types/customization';
import type { DependencyChargeItem } from './ido-md-dependencies';

const key = (option: SelectedCustomizationOption) => `${option.groupId}/${option.optionId}`;
const hairKey = 'premium-head-body-options-multiple/implanted-synthetic-hair';

/** Only the reviewed free hair-color detail belongs to Gynoid's paid hair line. */
export function gynoidDependencyPlan(config: BrandCustomizationConfig, selected: SelectedCustomizationOption[], quantity: number) {
  if (!reviewed.products.some(row => config.id === `gynoid-approved-${row.productId.split('/').at(-1)}`)) return undefined;
  const hair = selected.find(option => key(option) === hairKey && option.priceDelta > 0);
  const owned = new Set<string>();
  function paidAncestors(option: SelectedCustomizationOption, visited = new Set<string>()): Set<string> {
    if (visited.has(key(option))) throw new Error('Cyclic Gynoid customization dependency.');
    const next = new Set(visited).add(key(option)), roots = new Set<string>();
    for (const branch of config.groups.find(group => group.id === option.groupId)?.visibleWhen ?? []) {
      const conditions = branch.map(ref => selected.find(item => item.groupId === ref.groupId && item.optionId === ref.optionId));
      if (conditions.some(condition => !condition)) continue;
      for (const condition of conditions) {
        if (condition!.priceDelta > 0) roots.add(key(condition!));
        for (const root of paidAncestors(condition!, next)) roots.add(root);
      }
    }
    return roots;
  }
  for (const option of selected) {
    const roots = paidAncestors(option);
    if (!roots.size) continue;
    if (!hair || hair.priceDelta !== 599 || roots.size !== 1 || !roots.has(hairKey) ||
        option.groupId !== 'implanted-hair-color' || option.priceDelta !== 0 ||
        !['black', 'brown', 'yellow'].includes(option.optionId)) {
      throw new Error('This Gynoid dependency needs a verified checkout mapping.');
    }
    owned.add(key(option));
  }
  const items: DependencyChargeItem[] = selected.filter(option => option.priceDelta > 0).map(option => {
    const details = key(option) === hairKey ? selected.filter(item => owned.has(key(item))) : [];
    return { group: option.groupLabel, label: option.optionLabel,
      amount: Math.round(option.priceDelta * quantity * 100) / 100,
      ...(details.length ? { dependencyDetails: { scope: 'gynoid-v1' as const,
        included: groupedCartAttributes(details, 'Included: '), configured: [] } } : {}) };
  });
  return { items, included: selected.filter(option => option.priceDelta === 0 && !owned.has(key(option))) };
}
