import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { packCustomizationConfig, unpackCustomizationConfig, type PackedCustomizationConfig } from '@/lib/customization/rule-transport';
import { getDefaultSelections, getOptionConflict, resolveCustomization } from '@/lib/customization/resolve';
import type { BrandCustomizationConfig } from '@/types/customization';

const config: BrandCustomizationConfig = {
  id: 'transport-test', brandLabel: 'Fixture', leadTimeNote: 'Confirmed separately',
  groups: ['a', 'b'].map(id => ({ id, label: id, display: 'cards', required: true,
    options: [{ id: 'free', label: 'Included', priceDelta: 0 }, { id: 'paid', label: 'Paid', priceDelta: 90 }] })),
  rules: Array.from({ length: 70 }, (_, i) => ({ id: `rule-${i}`, type: 'incompatible',
    when: { groupId: 'a', optionId: 'paid' }, conflictsWith: { groupId: 'b', optionId: 'paid' }, message: 'Choose one paid option.' }))
};

describe('lossless public compatibility rule transport', () => {
  it('preserves every rule, ID, message, order and non-rule field through JSON', () => {
    const before = structuredClone(config);
    const packed = packCustomizationConfig(config);
    expect('ruleEncoding' in packed).toBe(true);
    expect(unpackCustomizationConfig(JSON.parse(JSON.stringify(packed)))).toEqual(config);
    expect(config).toEqual(before);
    expect(JSON.stringify(packed).length).toBeLessThan(JSON.stringify(config).length);
  });

  it('keeps defaults, conflict messages, totals, issues and cart attributes identical', () => {
    const decoded = unpackCustomizationConfig(JSON.parse(JSON.stringify(packCustomizationConfig(config))));
    expect(getDefaultSelections(decoded)).toEqual(getDefaultSelections(config));
    for (const a of ['free', 'paid']) for (const b of ['free', 'paid']) {
      const selected = { a, b };
      expect(resolveCustomization(decoded, selected, 1000)).toEqual(resolveCustomization(config, selected, 1000));
      expect(getOptionConflict(decoded, selected, 'a', a)).toEqual(getOptionConflict(config, selected, 'a', a));
    }
  });

  it('leaves small, empty and future extended rule formats untouched', () => {
    for (const rules of [[], config.rules.slice(0, 1)]) {
      const small = { ...config, rules };
      expect(packCustomizationConfig(small)).toBe(small);
      expect(unpackCustomizationConfig(small)).toBe(small);
    }
    const future = structuredClone(config);
    Object.assign(future.rules[0], { futureMetadata: true });
    expect(packCustomizationConfig(future)).toBe(future);
  });

  it('rejects malformed transport instead of dropping constraints', () => {
    const packed = packCustomizationConfig(config) as PackedCustomizationConfig;
    for (const index of [-1, 99999, 0.5, NaN]) {
      const broken = structuredClone(packed);
      broken.ruleRows[0][1] = index;
      expect(() => unpackCustomizationConfig(broken)).toThrow();
    }
    const broken = structuredClone(packed);
    broken.ruleRows[0].pop();
    expect(() => unpackCustomizationConfig(broken)).toThrow();
  });

  it.skipIf(!process.env.DOL328_RULE_CONFIG)('round-trips the complete saved actual public configuration', () => {
    const actual: BrandCustomizationConfig = JSON.parse(fs.readFileSync(process.env.DOL328_RULE_CONFIG!, 'utf8'));
    const decoded = unpackCustomizationConfig(JSON.parse(JSON.stringify(packCustomizationConfig(actual))));
    expect(decoded).toEqual(actual);
    expect(decoded.rules).toHaveLength(3246);
    expect(getDefaultSelections(decoded)).toEqual(getDefaultSelections(actual));
    expect(resolveCustomization(decoded, getDefaultSelections(decoded), 1899))
      .toEqual(resolveCustomization(actual, getDefaultSelections(actual), 1899));
  });
});
