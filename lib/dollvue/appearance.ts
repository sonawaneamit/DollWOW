import type { CustomizationGroup, CustomizationOption } from '@/types/customization';

export const DOLLVUE_APPEARANCE_POLICY = 'appearance-v1';
export type AppearanceAttribute = 'skin-tone' | 'hair-color' | 'hair-style' | 'eye-color' | 'makeup' | 'freckles' | 'nail-color';
export type AppearanceDecision = { status: 'candidate'; attribute: AppearanceAttribute } |
  { status: 'excluded' | 'review'; reason: string };

/** Classifies meaning only. A candidate still needs product/photo/reference QA. */
export function classifyAppearance(group: Pick<CustomizationGroup, 'label'>, option: Pick<CustomizationOption, 'label' | 'factoryExists' | 'displayable'>): AppearanceDecision {
  const groupName = group.label.toLowerCase().replace(/^select\s+/, '').replace(/\s+/g, ' ').trim();
  const label = option.label.toLowerCase().replace(/\s*\(free\)\s*$/, '').trim();
  const text = `${groupName} ${label}`;
  if (option.factoryExists === false || option.displayable === false) return {status: 'excluded', reason: 'unavailable-option'};
  if (/^(none|no thanks|no add-on|no change|default|factory default|as shown|same as (?:photo|picture)|random)(\b|$)/.test(label)) return {status: 'excluded', reason: 'no-specific-change'};
  if (/extra(?: free)? head|additional head|for (?:the )?(?:extra|second) head|head (?:model|selection|number|type)|choose (?:a )?head|face (?:model|swap)|other head/.test(text)) return {status: 'excluded', reason: 'head-identity-change'};
  if (/vagina|labia|areola|nipple|pubic|genital|penis|anal|anus|bikini line/.test(text)) return {status: 'excluded', reason: 'outside-non-explicit-scope'};
  if (/heating|moaning|skeleton|standing|weight reduction|movable jaw|breathing|flight case|storage|gel breast|soft (?:breast|butt)|care kit|finger|foot joint|articulated|lingerie|accessories/.test(text)) return {status: 'excluded', reason: 'functional-or-accessory'};
  if (/^(skin tone|skin color|skin colour)$/.test(groupName)) return {status: 'candidate', attribute: 'skin-tone'};
  if (/^(eye color|eye colour|eyes color)$/.test(groupName)) return {status: 'candidate', attribute: 'eye-color'};
  if (/^(hair color|hair colour|hair implanted color|implanted hair color|wig color)$/.test(groupName)) return {status: 'candidate', attribute: 'hair-color'};
  if (/^(hairstyle|hair style|wig style)$/.test(groupName)) {
    if (/implanted|implanting|human hair|synthetic hair|wig only/.test(label)) return {status: 'review', reason: 'hair-construction-not-defined-look'};
    return {status: 'candidate', attribute: 'hair-style'};
  }
  if (/^(nail color|nail colour|toe nail color|toenail color)$/.test(groupName)) return {status: 'candidate', attribute: 'nail-color'};
  if (/makeup|finishing|premium|painting/.test(groupName)) {
    if (/freckle/.test(label)) return {status: 'candidate', attribute: 'freckles'};
    if (/makeup|painting/.test(label) && !/body/.test(label)) return {status: 'candidate', attribute: 'makeup'};
  }
  return {status: 'review', reason: 'unclassified-meaning'};
}

export function appearanceReferenceProperty(attribute: AppearanceAttribute) {
  return {
    'skin-tone': 'the synthetic-skin color only',
    'hair-color': 'the visible hair color only',
    'hair-style': 'the visible wig style, color, length, texture, part, and fringe',
    'eye-color': 'the visible iris color only',
    makeup: 'the visible facial makeup colors and placement only',
    freckles: 'the visible freckle placement, density, scale, and color only',
    'nail-color': 'the visible nail polish color only',
  }[attribute];
}
