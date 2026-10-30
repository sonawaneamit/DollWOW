import { IDO_MENU_TAG, MD_MENU_TAG } from '@/lib/customization/ido-md';
import { groupedCartAttributes } from '@/lib/customization/resolve';
import type { BrandCustomizationConfig, SelectedCustomizationOption } from '@/types/customization';

type Attribute = { key: string; value: string };
export type DependencyDetails = { scope: 'ido-md-v1' | 'firefly-free-details-v1'; included: Attribute[]; configured: Attribute[] };
export type DependencyChargeItem = { group: string; label: string; amount: number; dependencyDetails?: DependencyDetails };
const headGroups = new Set([
  'custom-options-for-extra-head', 'head-type-for-extra-head', 'extra-head-choice', 'extra-head-type',
  'hairstyle-for-extra-head', 'eye-color-for-extra-head', 'premium-head-options-for-extra-head',
  'implanted-eyebrows-eyelashes-for-extra-head', 'premium-head-options-for-extra-head-multiple'
]);
const paidHeadOptions = [
  { groupId: 'hairstyle-for-extra-head', optionId: 'implanted-synthetic-hair', label: 'Implanted synthetic hair', amount: 199 },
  { groupId: 'hairstyle-for-extra-head', optionId: 'implanted-human-hair', label: 'Implanted human hair', amount: 499 },
  { groupId: 'premium-head-options-for-extra-head-multiple', optionId: 'facial-freckles', label: 'Facial freckles', amount: 70 },
  { groupId: 'premium-head-options-for-extra-head-multiple', optionId: 'movable-eyelids', label: 'Movable eyelids', amount: 149 }
];
const key = (option: SelectedCustomizationOption) => `${option.groupId}/${option.optionId}`;

/** Eleven exact MD identities; free head codes/details do not multiply variants. */
export const MD_CONFIGURED_HEAD_BINDINGS = [undefined, paidHeadOptions[0], paidHeadOptions[1]].flatMap(hair =>
  [false, true].flatMap(freckles => [false, true].flatMap(eyelids => {
    const extras = [hair, freckles ? paidHeadOptions[2] : undefined, eyelids ? paidHeadOptions[3] : undefined]
      .filter((option): option is typeof paidHeadOptions[number] => Boolean(option));
    if (!extras.length) return [];
    const label = ['Extra head', ...extras.map(option => option.label)].join(' + ');
    return [{ group: 'Configured extra head', label, unitAmount: 599 + extras.reduce((sum, option) => sum + option.amount, 0),
      currencyCode: 'USD', productTitle: `MD Doll - ${label}`, optionKeys: extras.map(option => `${option.groupId}/${option.optionId}`) }];
  }))
);

/** Only reviewed IDO/MD dependency families may bypass the legacy guard. */
export function idoMdDependencyPlan(config: BrandCustomizationConfig, selected: SelectedCustomizationOption[], quantity: number) {
  if (![IDO_MENU_TAG.slice(8), MD_MENU_TAG.slice(8)].includes(config.id)) return undefined;
  const isMd = config.id === MD_MENU_TAG.slice(8);
  const paid = selected.filter(option => option.priceDelta > 0);
  const head = paid.find(option => option.groupId === (isMd ? 'an-extra-free-head' : 'an-extra-head'));
  const bionic = isMd ? paid.find(option => key(option) === 'premium-head-body-options-multiple/bionic-skin-softer-skin') : undefined;
  const owners = new Map<string, SelectedCustomizationOption>();
  // Traverse active conditions through free intermediate groups, not labels.
  function paidAncestors(option: SelectedCustomizationOption, visiting = new Set<string>()): Set<string> {
    if (visiting.has(key(option))) throw new Error('Cyclic customization dependency.');
    const next = new Set(visiting).add(key(option));
    const roots = new Set<string>();
    for (const branch of config.groups.find(group => group.id === option.groupId)?.visibleWhen ?? []) {
      const conditions = branch.map(condition => selected.find(item => item.groupId === condition.groupId && item.optionId === condition.optionId));
      if (conditions.some(item => !item)) continue;
      for (const condition of conditions) {
        if (condition!.priceDelta > 0) roots.add(key(condition!));
        for (const root of paidAncestors(condition!, next)) roots.add(root);
      }
    }
    return roots;
  }
  for (const option of selected) {
    const roots = paidAncestors(option);
    if (roots.size) {
      if (!head || !headGroups.has(option.groupId) || [...roots].some(root => root !== key(head))) {
        throw new Error('This selected dependency needs a verified checkout mapping.');
      }
      owners.set(key(option), head);
    }
    if (bionic && key(option) === 'premium-head-body-options-multiple/soft-butt' && option.priceDelta === 0) owners.set(key(option), bionic);
  }
  const items: DependencyChargeItem[] = paid.filter(option => !owners.has(key(option))).map(owner => {
    const dependents = selected.filter(option => owners.get(key(option)) === owner);
    const paidDependents = dependents.filter(option => option.priceDelta > 0);
    let group = owner.groupLabel, label = owner.optionLabel;
    if (paidDependents.length) {
      const keys = paidDependents.map(key);
      const binding = isMd && owner === head && MD_CONFIGURED_HEAD_BINDINGS.find(candidate =>
        candidate.optionKeys.length === keys.length && candidate.optionKeys.every(id => keys.includes(id)));
      const total = owner.priceDelta + paidDependents.reduce((sum, option) => sum + option.priceDelta, 0);
      if (!binding || owner.priceDelta !== 599 || binding.unitAmount !== total || paidDependents.some(option =>
        paidHeadOptions.find(spec => `${spec.groupId}/${spec.optionId}` === key(option))?.amount !== option.priceDelta)) {
        throw new Error('This configured extra head needs a verified exact-price mapping.');
      }
      group = binding.group;
      label = binding.label;
    }
    return { group, label, amount: Math.round((owner.priceDelta + paidDependents.reduce((sum, option) => sum + option.priceDelta, 0)) * quantity * 100) / 100,
      ...(dependents.length ? { dependencyDetails: {
        scope: 'ido-md-v1' as const,
        included: groupedCartAttributes(dependents.filter(option => option.priceDelta === 0), 'Included: '),
        configured: paidDependents.length ? groupedCartAttributes([owner, ...paidDependents], 'Configured: ') : []
      } } : {}) };
  });
  return { items, included: selected.filter(option => option.priceDelta === 0 && !owners.has(key(option))) };
}
