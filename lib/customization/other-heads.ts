import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';

// Paused 2026-10-15 (Martin): "Other Heads" picks reach checkout with no way to say which head,
// so orders arrive without the head number. Hidden sitewide until the picker gets a text input
// for the head number/note. Remove this filter (one call in configs.ts) to re-enable.
export const OTHER_HEADS_PAUSED = true;

const OTHER_HEAD_OPTION = /^\s*other\s+heads?\s*$/i;
const OTHER_HEAD_LIST = /^\s*other\s+heads?\s*$/i;
const HEAD_NOTE_GROUP = /head\s+number\s*\/\s*name/i;
const isOtherHead = (option: { label: string; sourceLabel?: string }) => OTHER_HEAD_OPTION.test(option.label) || OTHER_HEAD_OPTION.test(option.sourceLabel ?? '');
const isNoteGroup = (group: CustomizationGroup) => HEAD_NOTE_GROUP.test(group.label) || HEAD_NOTE_GROUP.test(group.sourceLabel ?? '');

export function isPausedOtherHeadOption(label: string | undefined) {
  return OTHER_HEADS_PAUSED && OTHER_HEAD_OPTION.test(label ?? '');
}

/**
 * Keeps real named-head lists (Lusandy/MD "Other Heads" groups with photos) and the entry option that opens them.
 * Hides only the blank "Other Head(s)" placeholder picks that lead to no named head, and the fake free-text
 * "Head Number/Name" groups.
 */
export function withoutOtherHeads(config: BrandCustomizationConfig): BrandCustomizationConfig {
  if (!OTHER_HEADS_PAUSED) return config;
  const touched = config.groups.some(group => isNoteGroup(group) || group.options.some(isOtherHead));
  if (!touched) return config;
  const isHeadList = (group: CustomizationGroup) => (OTHER_HEAD_LIST.test(group.label) || OTHER_HEAD_LIST.test(group.sourceLabel ?? '')) &&
    group.options.some(option => !isOtherHead(option));
  const hasHeadList = config.groups.some(isHeadList);
  const gates = (groupId: string, optionId: string) => config.groups.some(group => group.visibleWhen?.some(branch => branch.some(rule => rule.groupId === groupId && rule.optionId === optionId)) && !isNoteGroup(group));
  let groups: CustomizationGroup[] = config.groups
    .filter(group => !isNoteGroup(group))
    .map(group => ({ ...group, options: group.options.filter(option => !isOtherHead(option) ||
      (!isHeadList(group) && (gates(group.id, option.id) || hasHeadList) && !/extra/i.test(group.id))) }))
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
