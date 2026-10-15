import { describe, expect, it } from 'vitest';
import { withoutOtherHeads } from '@/lib/customization/other-heads';

describe('Other Heads pause', () => {
  it('keeps a named-head Other Heads list and its entry, hides placeholder picks and head-number groups', () => {
    const config = withoutOtherHeads({ id: 'x', brandLabel: 'X', leadTimeNote: '', groups: [
      { id: 'head', label: 'Head', required: true, options: [{ id: 'no-change', label: 'No Change' }, { id: 'other-heads', label: 'Other Heads' }] },
      { id: 'other-heads', label: 'Other Heads', required: true, visibleWhen: [[{ groupId: 'head', optionId: 'other-heads' }]], options: [{ id: 'm1', label: 'M1' }, { id: 'm2', label: 'M2' }, { id: 'blank', label: 'Other Head' }] },
      { id: 'extra', label: 'Extra head', options: [{ id: 'none', label: 'None' }, { id: 'extra-other', label: 'Other Head' }] },
      { id: 'note', label: 'Other Lusandy Doll Head Number/Name', options: [{ id: 'free', label: '(free text field)' }] },
      { id: 'type', label: 'Head type', options: [{ id: 'ros', label: 'ROS' }, { id: 'hard', label: 'Hard' }] }
    ], rules: [{ id: 'r', type: 'incompatible', when: { groupId: 'other-heads', optionId: 'm1' }, conflictsWith: { groupId: 'type', optionId: 'ros' }, message: '' }] } as any);
    expect(config.groups.map(group => group.id)).toEqual(['head', 'other-heads', 'extra', 'type']);
    expect(config.groups[0].options.map(option => option.id)).toEqual(['no-change', 'other-heads']);
    expect(config.groups[1].options.map(option => option.id)).toEqual(['m1', 'm2']);
    expect(config.groups[2].options.map(option => option.id)).toEqual(['none']);
    expect(config.rules).toHaveLength(1);
  });

  it('still hides a lone Other Head pick when the brand has no named-head list', () => {
    const config = withoutOtherHeads({ id: 'y', brandLabel: 'Y', leadTimeNote: '', rules: [], groups: [
      { id: 'head', label: 'Head', options: [{ id: 'shown', label: 'As shown' }, { id: 'other-head', label: 'Other Head' }] }] } as any);
    expect(config.groups[0].options.map(option => option.id)).toEqual(['shown']);
  });
});
