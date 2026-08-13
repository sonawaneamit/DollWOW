function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeOption(value) {
  const normalized = normalize(value);
  if (["no change", "factory default", "as shown", "as shown in product photos"].includes(normalized)) return "__default__";
  if (["no add on", "no thanks", "none"].includes(normalized)) return "__none__";
  return normalized;
}

function labeledOptions(group) {
  return (group?.options || [])
    .map((option) => ({ label: String(option?.label || "").trim(), key: normalizeOption(option?.label) }))
    .filter((option) => option.label && option.key);
}

export function compareOptionCoverage(storedGroups = [], sourceGroups = []) {
  const storedByGroup = new Map(storedGroups.map((group) => [normalize(group.label), group]));
  const sourceByGroup = new Map(sourceGroups.map((group) => [normalize(group.label), group]));
  const missingSourceGroups = [];
  const extraStoredGroups = [];
  const missingSourceOptions = [];
  const extraStoredOptions = [];
  let matchedGroups = 0;
  let matchedOptions = 0;

  for (const [groupKey, sourceGroup] of sourceByGroup) {
    const storedGroup = storedByGroup.get(groupKey);
    if (!storedGroup) {
      missingSourceGroups.push({
        label: sourceGroup.label,
        sourceOptionCount: labeledOptions(sourceGroup).length
      });
      continue;
    }
    matchedGroups += 1;
    const storedOptions = new Map(labeledOptions(storedGroup).map((option) => [option.key, option.label]));
    const sourceOptions = new Map(labeledOptions(sourceGroup).map((option) => [option.key, option.label]));
    for (const [optionKey, optionLabel] of sourceOptions) {
      if (storedOptions.has(optionKey)) matchedOptions += 1;
      else missingSourceOptions.push({ group: sourceGroup.label, option: optionLabel });
    }
    for (const [optionKey, optionLabel] of storedOptions) {
      if (!sourceOptions.has(optionKey)) extraStoredOptions.push({ group: storedGroup.label, option: optionLabel });
    }
  }

  for (const [groupKey, storedGroup] of storedByGroup) {
    if (!sourceByGroup.has(groupKey)) {
      extraStoredGroups.push({
        label: storedGroup.label,
        storedOptionCount: labeledOptions(storedGroup).length
      });
    }
  }

  return {
    complete: missingSourceGroups.length === 0 && missingSourceOptions.length === 0,
    sourceGroupCount: sourceGroups.length,
    storedGroupCount: storedGroups.length,
    matchedGroups,
    matchedOptions,
    missingSourceGroups,
    missingSourceOptions,
    extraStoredGroups,
    extraStoredOptions
  };
}
