import type { CustomizationGroup, CustomizationRule } from '@/types/customization';

// PDF p38 plus current official M55 page selectors (2026-10-14) for M52/M53/M55.
// A code missing from both sources remains unverified.
export const MD_ROS_HEAD_CODES = new Set([
  'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm11', 'm12', 'm14', 'm15', 'm16',
  'm17', 'm18', 'm20', 'm21', 'm22', 'm23', 'm24', 'm25', 'm26', 'm27',
  'm28', 'm29', 'm30', 'm31', 'm32', 'm33', 'm34', 'm35', 'm36', 'm37',
  'm38', 'm39', 'm40', 'm41', 'm42', 'm43', 'm44', 'm45', 'm46', 'm48',
  'm49', 'm50', 'm51', 'm52', 'm53', 'm55', 'm57', 'm58', 'm59', 'm60', 'm61', 'm62', 'm63',
  'm64', 'm65', 'm66', 'm67', 'm68', 'm69', 'm70', 'm71', 'm72', 'm73',
  'm74', 'm75', 'm76', 'm77'
]);

export function mdRosRules(groups: CustomizationGroup[], listingHead?: string): CustomizationRule[] {
  const rules: CustomizationRule[] = [];
  for (const [headGroup, typeGroup] of [['head', 'head-type'], ['other-heads', 'head-type'], ['extra-head-choice', 'extra-head-type']]) {
    if (!groups.find(group => group.id === typeGroup)?.options.some(option => option.id === 'ros-head-movable-jaw')) continue;
    for (const option of groups.find(group => group.id === headGroup)?.options ?? []) {
      // The unchosen placeholder blocks checkout, not entry into the head picker.
      if (option.id === 'choose-a-head' && option.purchasable === false) continue;
      if (headGroup === 'head' && option.id !== 'no-change') continue;
      const code = option.id === 'no-change' ? listingHead?.trim().toLowerCase() : option.id;
      if (code && MD_ROS_HEAD_CODES.has(code)) continue;
      rules.push({ id: `md-ros-${headGroup}-${option.id}`, type: 'incompatible',
        when: { groupId: headGroup, optionId: option.id },
        conflictsWith: { groupId: typeGroup, optionId: 'ros-head-movable-jaw' },
        message: 'Choose a ROS-compatible head for the movable-jaw construction.' });
    }
  }
  return rules;
}
