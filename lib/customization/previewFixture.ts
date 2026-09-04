import dianaFixture from "@/data/fanreal/diana-customization-groups.json";
import dianaEditorialIntro from "@/data/fanreal/diana-editorial-intro.json";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
import { hasEditorialIntro } from "@/lib/catalog/editorialIntro";
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
      editorialIntro: hasEditorialIntro(product.extended.editorialIntro)
        ? product.extended.editorialIntro
        : dianaEditorialIntro,
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
    ...(source.priceDelta !== null ? { priceDelta: source.priceDelta } : { priceLabel: "included" }),
    ...(source.swatch ? { swatch: { ...source.swatch, label: source.swatch.label?.replace(/\s*\(FREE this month\)$/i, "") } as CustomizationOption["swatch"] } : {})
  };

  // Extra Silicone Head lives inside Add Extra Head. Keep MAP catalog $550 on real head
  // choices so promotionOptionPrice can strike to $0 in-window; neutrals stay included.
  if (groupId === "add-extra-head") {
    if (/^(none|no-extra-head|no-add-on)$/i.test(source.id) || /^(no extra head|no add-on|none)$/i.test(customerLabel)) {
      option.priceDelta = 0;
      option.priceLabel = "included";
    } else {
      option.priceDelta = source.priceDelta ?? 550;
      delete option.priceLabel;
    }
  }
  if (source.id === "implanted-synthetic") {
    delete option.priceDelta;
    option.priceLabel = "included";
  }
  // Explicit $0 base choices (e.g. Standing with bolts / No extra head) are included, not promo freebies.
  if (option.priceDelta === 0 && groupId !== "add-extra-head") {
    option.priceLabel = "included";
  }
  if (option.priceDelta === 0 && groupId === "add-extra-head" && /^(none|no-extra-head)$/i.test(source.id)) {
    option.priceLabel = "included";
  }
  return option;
}
