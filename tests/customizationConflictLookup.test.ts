import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { getDefaultSelections, getOptionConflict, nextMultipleSelection, resolveCustomization, selectionIds } from '@/lib/customization/resolve';
import type { BrandCustomizationConfig, CustomizationSelections } from '@/types/customization';

function fullResolverConflict(config: BrandCustomizationConfig, selections: CustomizationSelections, groupId: string, optionId: string) {
  const group = config.groups.find(item => item.id === groupId);
  const currentValue = selections[groupId] ?? getDefaultSelections(config)[groupId];
  const nextValue = group?.selectionMode === 'multiple' ? nextMultipleSelection(group.options, currentValue, optionId) : optionId;
  const normalized = resolveCustomization(config, { ...selections, [groupId]: nextValue }, 0).selections;
  return config.rules.find(rule => selectionIds(normalized[rule.when.groupId]).includes(rule.when.optionId) &&
    selectionIds(normalized[rule.conflictsWith.groupId]).includes(rule.conflictsWith.optionId))?.message ?? null;
}

const fixture: BrandCustomizationConfig = {
  id: 'lookup-fixture', brandLabel: 'Fixture', leadTimeNote: 'Fixture',
  groups: [
    { id: 'base', label: 'Base', display: 'cards', required: true, options: [
      { id: 'free', label: 'Default', priceDelta: 0 }, { id: 'paid', label: 'Paid', priceDelta: 10 }
    ] },
    { id: 'extras', label: 'Extras', display: 'cards', selectionMode: 'multiple', options: [
      { id: 'none', label: 'None', priceDelta: 0 }, { id: 'a', label: 'A', priceDelta: 20 },
      { id: 'b', label: 'B', purchasable: false }
    ] }
  ],
  rules: [
    { id: 'first', type: 'incompatible', when: { groupId: 'base', optionId: 'paid' }, conflictsWith: { groupId: 'extras', optionId: 'a' }, message: 'First reason' },
    { id: 'second', type: 'incompatible', when: { groupId: 'base', optionId: 'paid' }, conflictsWith: { groupId: 'extras', optionId: 'a' }, message: 'Second reason' }
  ]
};

function compareEveryOption(config: BrandCustomizationConfig, states: CustomizationSelections[]) {
  const before = JSON.stringify(config);
  let comparisons = 0;
  for (const state of states) {
    const stateBefore = JSON.stringify(state);
    for (const group of config.groups) for (const option of group.options) {
      expect(getOptionConflict(config, state, group.id, option.id))
        .toBe(fullResolverConflict(config, state, group.id, option.id));
      comparisons++;
    }
    expect(JSON.stringify(state)).toBe(stateBefore);
  }
  expect(JSON.stringify(config)).toBe(before);
  return comparisons;
}

describe('selection-only conflict lookup', () => {
  it('preserves first-rule ordering, defaults, invalid choices and multiple toggles without mutation', () => {
    compareEveryOption(fixture, [{}, { base: 'paid', extras: ['a'] }, { base: 'invalid', extras: [] }, { extras: ['b', 'a'] }]);
    expect(getOptionConflict(fixture, { extras: ['a'] }, 'base', 'paid')).toBe('First reason');
    expect(getOptionConflict(fixture, {}, 'missing', 'unknown')).toBe(fullResolverConflict(fixture, {}, 'missing', 'unknown'));
  });

  it('preserves visibility filtering and conditional unverified choices', () => {
    const conditional = structuredClone(fixture);
    conditional.groups[1].visibleWhen = [[{ groupId: 'base', optionId: 'paid' }]];
    for (const group of conditional.groups) for (const option of group.options) {
      option.priceVerified = option.priceDelta !== undefined;
    }
    compareEveryOption(conditional, [{}, { base: 'free', extras: ['a'] }, { base: 'paid', extras: ['a'] }, { base: 'paid', extras: ['invalid'] }]);
  });

  it.skipIf(!process.env.DOL328_RULE_CONFIG)('matches the saved actual rules and records a bounded CPU-only comparison', () => {
    const actual: BrandCustomizationConfig = JSON.parse(fs.readFileSync(process.env.DOL328_RULE_CONFIG!, 'utf8'));
    const defaults = getDefaultSelections(actual);
    const comparisons = compareEveryOption(actual, [defaults,
      { ...defaults, material: 'stpe-free' },
      { ...defaults, material: 'stpe-free', 'body-weight': 'lstpe-lightweight' },
      { ...defaults, 'body-weight': 'lstpe-lightweight' },
      { ...defaults, 'premium-head-body-options-multiple': [] }
    ]);
    const group = actual.groups[0];
    const run = (lookup: typeof getOptionConflict) => {
      const start = performance.now();
      for (const option of group.options) lookup(actual, defaults, group.id, option.id);
      return performance.now() - start;
    };
    run(fullResolverConflict); run(getOptionConflict);
    const samples = Array.from({ length: 5 }, () => ({ fullResolverMs: run(fullResolverConflict), selectionOnlyMs: run(getOptionConflict) }));
    if (process.env.DOL328_CONFLICT_PROOF) fs.writeFileSync(process.env.DOL328_CONFLICT_PROOF, JSON.stringify({
      at: new Date().toISOString(), rules: actual.rules.length, comparisons, activeGroupOptions: group.options.length, samples,
      limitation: 'Same-process CPU-only lookup batch, unfrozen scheduler/JIT, not browser input latency, page speed, field data or 90+ proof.'
    }, null, 2));
    expect(comparisons).toBeGreaterThan(0);
  });
});
