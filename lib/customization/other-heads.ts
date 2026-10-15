import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';

// Paused 2026-10-15 (Martin): "Other Heads" picks reach checkout with no way to say which head,
// so orders arrive without the head number. Hidden sitewide until the picker gets a text input
// for the head number/note. Remove this filter (one call in configs.ts) to re-enable.
export const OTHER_HEADS_PAUSED = true;

const OTHER_HEAD_OPTION = /^\s*other\s+heads?\s*$/i;
const OTHER_HEAD_GROUP = /^\s*other\s+heads?\s*$|head\s+number\s*\/\s*name/i;

export function isPausedOtherHeadOption(label: string | undefined) {
  return OTHER_HEADS_PAUSED && OTHER_HEAD_OPTION.test(label ?? '');
}

export function withoutOtherHeads(config: BrandCustomizationConfig): BrandCustomizationConfig {
  if (!OTHER_HEADS_PAUSED) return config;
  const touched = config.groups.some(group => OTHER_HEAD_GROUP.test(group.sourceLabel ?? group.label) || OTHER_HEAD_GROUP.test(group.label) ||
    group.options.some(option => OTHER_HEAD_OPTION.test(option.label) || OTHER_HEAD_OPTION.test(option.sourceLabel ?? '')));
  if (!touched) return config;
  let groups: CustomizationGroup[] = config.groups
    .filter(group => !OTHER_HEAD_GROUP.test(group.label) && !OTHER_HEAD_GROUP.test(group.sourceLabel ?? ''))
    .map(group => ({ ...group, options: group.options.filter(option => !OTHER_HEAD_OPTION.test(option.label) && !OTHER_HEAD_OPTION.test(option.sourceLabel ?? '')) }))
    .filter(group => group.options.length > 0);
  // Conditional menus: drop branches that pointed at a removed choice; a group left with no branch is unreachable.
  for (let changed = true; changed;) {
    changed = false;
    const exists = (groupId: string, optionId: string) => groups.some(group => group.id === groupId && group.options.some(option => option.id === optionId));
    const next: CustomizationGroup[] = [];
    for (const group of groups) {
      if (group.visibleWhen === undefined) { next.push(group); continue; }
      const branches = group.visibleWhen.filter(branch => branch.every(rule => exists(rule.groupId, rule.optionId)));
      if (!branches.length) { changed = true; continue; }
      if (branches.length !== group.visibleWhen.length) changed = true;
      next.push(branches.length === group.visibleWhen.length ? group : { ...group, visibleWhen: branches });
    }
    groups = next;
  }
  const exists = (ref: { groupId: string; optionId: string }) => groups.some(group => group.id === ref.groupId && (!ref.optionId || group.options.some(option => option.id === ref.optionId)));
  const rules = config.rules.filter(rule => exists(rule.when) && exists(rule.conflictsWith));
  return { ...config, groups, rules };
}
