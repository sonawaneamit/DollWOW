import type { CustomizationGroup } from "@/types/customization";

const LUSANDY_DOLLVUE_GROUP_IDS = new Set([
  "select-skin-tone",
  "select-hairstyle",
  "select-hair-color",
  "select-eye-color",
  "select-nail-color",
  "select-toenail-color",
  "select-areola-color",
  "select-labia-color",
  "select-vagina-hair-type",
  "select-premium-head-body-options-multiple"
]);

/**
 * Preserve each Lusandy product's imported option set while enabling only its
 * approved, image-backed appearance references for DollVue.
 */
export function stampLusandyDollVueGroups(groups: CustomizationGroup[]): CustomizationGroup[] {
  return groups.map((group) => {
    if (!LUSANDY_DOLLVUE_GROUP_IDS.has(group.id)) return group;

    return {
      ...group,
      options: group.options.map((option) => ({
        ...option,
        dollVueEnabled:
          option.swatch?.kind === "image" &&
          !/^(?:no change|standard)(?:\s*\([^)]*\))?$/i.test(option.label.trim()) &&
          !/real skin texture/i.test(option.label)
      }))
    };
  });
}
