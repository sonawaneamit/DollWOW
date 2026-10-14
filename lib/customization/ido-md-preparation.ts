import type { CustomizationGroup } from '@/types/customization';
import { MD_ROS_HEAD_CODES } from './md-ros';

type PriceChange = { groupId: string; optionId: string; before: number | undefined; after: number; evidence: string };

/** Pure draft preparation. Caller supplies the owner's commercial decisions. */
export function prepareMdFactoryMenu(input: CustomizationGroup[], decisions: {
  extraHeadRetailPrice: number;
  includesSkinTexture: boolean;
  listingHeadCode: string;
}) {
  if (!Number.isFinite(decisions.extraHeadRetailPrice) || decisions.extraHeadRetailPrice <= 0) throw new Error('An approved positive retail price is required for the extra head.');
  const groups = structuredClone(input);
  const priceChanges: PriceChange[] = [];
  const update = (groupId: string, optionId: string, after: number, evidence: string) => {
    const option = groups.find(group => group.id === groupId)?.options.find(option => option.id === optionId);
    if (!option) throw new Error(`Missing exact MD option ${groupId}/${optionId}`);
    priceChanges.push({ groupId, optionId, before: option.priceDelta, after, evidence });
    option.priceDelta = after;
    option.priceVerified = true;
    return option;
  };
  const body = 'premium-head-body-options-multiple';
  update(body, 'hard-hand', 0, 'MD catalog p39 default function: hard hands');
  if (decisions.includesSkinTexture) update(body, 'real-skin-texture', 0, 'MD catalog p39 body row7: 161cm includes real skin texture');
  // October bionic inclusion is scheduled in optionPricing, never persisted as free.
  const extra = update('an-extra-free-head', 'yes-i-need-free', decisions.extraHeadRetailPrice,
    'MD catalog p39 additional function row12: $360 agency cost; retail price is an explicit commercial decision');
  extra.label = 'Add an extra head';
  extra.purchasable = true;
  delete extra.sourceLabel;
  if (extra.swatch) extra.swatch.label = extra.label;
  // Retain group/choice IDs so visibility dependencies and charge identities survive.
  const extraGroup = groups.find(group => group.id === 'an-extra-free-head')!;
  extraGroup.label = 'Extra Head';
  delete extraGroup.sourceLabel;
  for (const group of ['head-type', 'extra-head-type']) {
    const ros = update(group, 'ros-head-movable-jaw', 0,
      'MD catalog p39: ROS included only if the selected head supports ROS');
    ros.purchasable = true;
  }
  if (MD_ROS_HEAD_CODES.has(decisions.listingHeadCode.trim().toLowerCase())) {
    const headType = groups.find(group => group.id === 'head-type')!;
    headType.options.sort((a, b) => Number(b.id === 'ros-head-movable-jaw') - Number(a.id === 'ros-head-movable-jaw'));
  }
  const ai = groups.find(group => group.id === 'accessories')?.options.find(option => option.id === 'vine-talk-ai-box-free');
  if (ai) {
    ai.label = 'AI Box';
    delete ai.sourceLabel;
    if (ai.swatch) ai.swatch.label = ai.label;
  }
  const standing = groups.find(group => group.id === 'standing-add-on');
  const standard = standing?.options.find(option => option.id === 'standing-without-bolts-hard-feet-free');
  if (!standing || !standard || standard.priceDelta !== 0) throw new Error('Exact included MD hard-standing choice required');
  standing.options = [standard, ...standing.options.filter(option => option !== standard)];
  return { groups, priceChanges, holds: [] as string[] };
}
