import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption } from "@/types/customization";

// Keep this allowlist intentionally small. Factory labels often carry material,
// compatibility, or construction detail that must remain visible to customers.
const CUSTOMER_LABEL_REPLACEMENTS = new Map<string, string>([
  ["selec tattoo", "Tattoo"],
  ["selec ttattoo", "Tattoo"],
  ["selec tattoo position", "Tattoo position"],
  ["selec ttattoo position", "Tattoo position"]
]);

export function normalizeCustomerFacingLabel(label: string): string {
  return CUSTOMER_LABEL_REPLACEMENTS.get(label.trim().toLowerCase()) ?? label;
}

/**
 * Applies only approved customer-facing label corrections. IDs, prices,
 * compatibility rules, and all other option metadata remain unchanged.
 */
export function normalizeCustomerFacingCustomizationConfig(config: BrandCustomizationConfig): BrandCustomizationConfig {
  return {
    ...config,
    groups: config.groups.map(normalizeGroup)
  };
}

function normalizeGroup(group: CustomizationGroup): CustomizationGroup {
  const label = normalizeCustomerFacingLabel(group.label);
  return {
    ...group,
    ...(label === group.label ? {} : { label, sourceLabel: group.sourceLabel ?? group.label }),
    options: group.options.map(normalizeOption)
  };
}

function normalizeOption(option: CustomizationOption): CustomizationOption {
  const label = normalizeCustomerFacingLabel(option.label);
  return {
    ...option,
    ...(label === option.label ? {} : { label, sourceLabel: option.sourceLabel ?? option.label })
  };
}
