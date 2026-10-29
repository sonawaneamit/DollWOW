import type { CustomizationGroup, CustomizationRule } from "@/types/customization";

export type IncludedBuildFact = {
  groupId: string;
  optionId: string;
  groupLabel: string;
  optionLabel: string;
};

export function includedBuildFactLabel(fact: IncludedBuildFact) {
  const groupLabel = fact.groupLabel.replace(/^included\s*:\s*/i, "").trim();
  return groupLabel.toLowerCase() === fact.optionLabel.toLowerCase()
    ? fact.optionLabel
    : `${groupLabel}: ${fact.optionLabel}`;
}

const placeholder = /^(?:no|none|n\/?a|not applicable|not selected|without|default|standard|factory default|as pictured|yes|included)(?:\s|$)/i;

// Display-only candidates: never used to grant choices or calculate checkout prices.
export function verifiedFixedBuildFacts(
  groups: readonly CustomizationGroup[],
  rules: readonly CustomizationRule[]
): IncludedBuildFact[] {
  const constrained = new Set(rules.flatMap((rule) => [rule.when.groupId, rule.conflictsWith.groupId]));
  const counts = new Map<string, number>();
  for (const group of groups) counts.set(group.id, (counts.get(group.id) ?? 0) + 1);

  return groups.flatMap((group) => {
    if (!group.id.trim() || !group.label.trim() || counts.get(group.id) !== 1 ||
        group.required !== true || group.selectionMode === "multiple" ||
        group.visibleWhen !== undefined || constrained.has(group.id) || group.options.length !== 1) return [];
    const option = group.options[0];
    if (!option.id.trim() || !option.label.trim() || placeholder.test(option.label.trim()) ||
        option.priceDelta !== 0 || option.priceVerified !== true ||
        option.factoryExists === false || option.displayable === false || option.purchasable === false) return [];
    return [{ groupId: group.id, optionId: option.id, groupLabel: group.label.trim(), optionLabel: option.label.trim() }];
  });
}
