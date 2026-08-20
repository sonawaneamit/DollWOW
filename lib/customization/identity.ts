import type { CustomizationSelections } from "@/types/customization";

/** Stable semantic identity: object key and multi-select order are irrelevant. */
export function customizationSelectionIdentity(selections?: CustomizationSelections) {
  if (!selections) return "";
  return JSON.stringify(
    Object.keys(selections)
      .sort()
      .map((groupId) => {
        const value = selections[groupId];
        return [groupId, Array.isArray(value) ? [...value].sort() : value];
      })
  );
}
