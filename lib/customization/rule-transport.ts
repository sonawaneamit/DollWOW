import type { BrandCustomizationConfig, CustomizationRule } from '@/types/customization';

type RuleRow = [string, number, number, number, number, number];
export type PackedCustomizationConfig = Omit<BrandCustomizationConfig, 'rules'> & {
  ruleEncoding: 'incompatible-v1';
  ruleStrings: string[];
  ruleRows: RuleRow[];
};
export type CustomizationConfigTransport = BrandCustomizationConfig | PackedCustomizationConfig;

export function packCustomizationConfig(config: BrandCustomizationConfig): CustomizationConfigTransport {
  if (config.rules.length < 64 || config.rules.some(rule =>
    rule.type !== 'incompatible' ||
    Object.keys(rule).some(key => !['id', 'type', 'message', 'when', 'conflictsWith'].includes(key)) ||
    [rule.when, rule.conflictsWith].some(choice => Object.keys(choice).some(key => !['groupId', 'optionId'].includes(key)))
  )) return config;
  const ruleStrings: string[] = [];
  const indices = new Map<string, number>();
  function intern(value: string) {
    const existing = indices.get(value);
    if (existing !== undefined) return existing;
    const index = ruleStrings.length;
    indices.set(value, index);
    ruleStrings.push(value);
    return index;
  }
  const ruleRows: RuleRow[] = config.rules.map(rule => [rule.id,
    intern(rule.when.groupId), intern(rule.when.optionId),
    intern(rule.conflictsWith.groupId), intern(rule.conflictsWith.optionId), intern(rule.message)]);
  const { rules: _rules, ...rest } = config;
  void _rules;
  return { ...rest, ruleEncoding: 'incompatible-v1', ruleStrings, ruleRows };
}

export function unpackCustomizationConfig(config: CustomizationConfigTransport): BrandCustomizationConfig {
  if (!('ruleEncoding' in config)) return config;
  if (config.ruleEncoding !== 'incompatible-v1' || !Array.isArray(config.ruleStrings) ||
    config.ruleStrings.some(value => typeof value !== 'string') || !Array.isArray(config.ruleRows)) {
    throw new Error('Invalid customization rule transport');
  }
  function lookup(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= configAsPacked.ruleStrings.length) {
      throw new Error('Invalid customization rule index');
    }
    return configAsPacked.ruleStrings[index];
  }
  const configAsPacked = config;
  const rules: CustomizationRule[] = config.ruleRows.map(row => {
    if (!Array.isArray(row) || row.length !== 6 || typeof row[0] !== 'string') {
      throw new Error('Invalid customization rule row');
    }
    return { id: row[0], type: 'incompatible',
      when: { groupId: lookup(row[1]), optionId: lookup(row[2]) },
      conflictsWith: { groupId: lookup(row[3]), optionId: lookup(row[4]) }, message: lookup(row[5]) };
  });
  const { ruleEncoding: _encoding, ruleStrings: _strings, ruleRows: _rows, ...rest } = config;
  void [_encoding, _strings, _rows];
  return { ...rest, rules };
}
