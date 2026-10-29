import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";

export const CHIKU_ID = "gid://shopify/Product/10676884078776";
export const CHIKU_PREVIEW_TAG = "dol313-private-preview";
export const CHIKU_EYE_IMAGES = {
  blue: "/images/options/dolls-castle/chiku-eyes/blue-1.png",
  purple: "/images/options/dolls-castle/chiku-eyes/purple-2.png",
  amber: "/images/options/dolls-castle/chiku-eyes/amber-3.png",
  green: "/images/options/dolls-castle/chiku-eyes/green-4.png"
} as const;

export function isChikuEyeImage(option: CustomizationOption) {
  return option.swatch?.kind === "image" && Object.entries(CHIKU_EYE_IMAGES)
    .some(([id, value]) => option.id === id && option.swatch?.value === value);
}

export function isChikuProduct(product: Product) {
  return product.id === CHIKU_ID && product.handle === "dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll";
}

export function isChikuPreview(product: Product) {
  return isChikuProduct(product) && product.tags.includes(CHIKU_PREVIEW_TAG);
}

export function chikuCustomizationGroups(product: Product, groups: CustomizationGroup[]): CustomizationGroup[] {
  if (!isChikuProduct(product)) return groups;
  const eyeColors: CustomizationGroup = {
    id: "eye-color", label: "Eye color", required: true, selectionMode: "single", display: "cards",
    options: [
      { id: "purple", label: "Purple (#2)", priceDelta: 0, priceVerified: true },
      { id: "blue", label: "Blue (#1)", priceDelta: 0, priceVerified: true },
      { id: "amber", label: "Amber (#3)", priceDelta: 0, priceVerified: true },
      { id: "green", label: "Green (#4)", priceDelta: 0, priceVerified: true }
    ]
  };
  if (isChikuPreview(product)) {
    eyeColors.options = eyeColors.options.map(option => ({
      ...option,
      swatch: { kind: "image", value: CHIKU_EYE_IMAGES[option.id as keyof typeof CHIKU_EYE_IMAGES] }
    }));
  }
  return [...groups.filter((group) => group.id !== eyeColors.id), eyeColors];
}

export function applyChikuPreview(product: Product, enabled: boolean): Product {
  if (!enabled || !isChikuProduct(product)) return product;
  const preview = { ...product, tags: [...product.tags.filter((tag) => tag !== CHIKU_PREVIEW_TAG), CHIKU_PREVIEW_TAG] };
  return {
    ...preview,
    extended: {
      ...product.extended,
      customizationGroups: chikuCustomizationGroups(preview, product.extended.customizationGroups ?? [])
    }
  };
}

// Display source-backed fixed facts separately, without changing charge or cart resolution.
export function includedBuildItems(product: Product) {
  if (!isChikuProduct(product)) return [];
  return (product.extended.customizationGroups ?? []).flatMap((group) => {
    if (!group.required || group.selectionMode === "multiple" || group.options.length !== 1) return [];
    const option = group.options[0];
    if (option.priceDelta !== 0 || option.priceVerified !== true || option.displayable === false || option.factoryExists === false) return [];
    return [{ id: group.id, label: option.label }];
  });
}
