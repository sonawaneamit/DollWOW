import dianaFixture from "@/data/fanreal/diana-customization-groups.json";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";

export const FANREAL_DIANA_PREVIEW_HANDLE = "fanreal-diana-168cm-f-cup-real-skin-silicone-companion-doll";

type PreviewFixtureOption = {
  id: string;
  label: string;
  priceDelta: number | null;
  swatch?: { kind: string; value: string; label?: string };
};

export function withPreviewCustomizationFixture(product: Product, vercelEnvironment = process.env.VERCEL_ENV): Product {
  if (vercelEnvironment !== "preview" || product.handle !== FANREAL_DIANA_PREVIEW_HANDLE) return product;

  return {
    ...product,
    extended: {
      ...product.extended,
      customizationGroups: normalizePreviewGroups(dianaFixture.customization_groups),
      previewCustomizationFixture: true
    }
  };
}

function normalizePreviewGroups(groups: typeof dianaFixture.customization_groups): CustomizationGroup[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    required: group.required,
    selectionMode: group.selectionMode as CustomizationGroup["selectionMode"],
    display: group.display as CustomizationGroup["display"],
    options: group.options.map((option) => normalizePreviewOption(group.id, option))
  }));
}

function normalizePreviewOption(groupId: string, source: PreviewFixtureOption): CustomizationOption {
  const customerLabel = source.label.replace(/\s*\(FREE this month\)$/i, "");
  const option: CustomizationOption = {
    id: source.id,
    label: customerLabel,
    ...(source.priceDelta !== null ? { priceDelta: source.priceDelta } : {}),
    ...(source.swatch ? { swatch: { ...source.swatch, label: source.swatch.label?.replace(/\s*\(FREE this month\)$/i, "") } as CustomizationOption["swatch"] } : {})
  };

  // The disk fixture carries source-working notes and in-window display prices.
  // Keep those out of customer UI and restore only the one MAP catalog delta supplied.
  if (groupId === "fanreal-sept-free-add-ons") {
    if (source.id === "extra-silicone-head") option.priceDelta = 550;
    else delete option.priceDelta;
  }
  if (source.id === "implanted-synthetic") delete option.priceDelta;
  return option;
}
