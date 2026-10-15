import { describe, expect, it } from 'vitest';
import { withoutOtherHeads } from '@/lib/customization/other-heads';

describe('Other Heads pause', () => {
  it('removes Other Head(s) options and groups, conditional children and dangling rules', () => {
    const config = withoutOtherHeads({ id: 'x', brandLabel: 'X', leadTimeNote: '', groups: [
      { id: 'head', label: 'Head', required: true, options: [{ id: 'no-change', label: 'No Change' }, { id: 'other-heads', label: 'Other Heads' }] },
      { id: 'other-heads', label: 'Other Heads', required: true, visibleWhen: [[{ groupId: 'head', optionId: 'other-heads' }]], options: [{ id: 'm1', label: 'M1' }, { id: 'm2', label: 'M2' }] },
      { id: 'note', label: 'Other Lusandy Doll Head Number/Name', options: [{ id: 'free', label: '(free text field)' }] },
      { id: 'type', label: 'Head type', options: [{ id: 'ros', label: 'ROS' }, { id: 'hard', label: 'Hard' }] }
    ], rules: [{ id: 'r', type: 'incompatible', when: { groupId: 'other-heads', optionId: 'm1' }, conflictsWith: { groupId: 'type', optionId: 'ros' }, message: '' }] } as any);
    expect(config.groups.map(group => group.id)).toEqual(['head', 'type']);
    expect(config.groups[0].options.map(option => option.id)).toEqual(['no-change']);
    expect(config.rules).toEqual([]);
  });
});
