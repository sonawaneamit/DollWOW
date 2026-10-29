import type { Product } from "@/types/product";
import type { CustomizationGroup } from "@/types/customization";

export const CHIKU_ID = "gid://shopify/Product/10676884078776";
export const CHIKU_PREVIEW_TAG = "dol313-private-preview";

export function isChikuPreview(product: Product) {
  return product.id === CHIKU_ID && product.tags.includes(CHIKU_PREVIEW_TAG);
}

export function applyChikuPreview(product: Product, enabled: boolean): Product {
  if (!enabled || product.id !== CHIKU_ID) return product;
  const eyeColors: CustomizationGroup = {
    id: "eye-color", label: "Eye color", required: true, selectionMode: "single", display: "cards",
    options: [
      { id: "purple", label: "Purple (#2)", priceDelta: 0, priceVerified: true },
      { id: "blue", label: "Blue (#1)", priceDelta: 0, priceVerified: true },
      { id: "amber", label: "Amber (#3)", priceDelta: 0, priceVerified: true },
      { id: "green", label: "Green (#4)", priceDelta: 0, priceVerified: true }
    ]
  };
  const groups = product.extended.customizationGroups ?? [];
  return {
    ...product,
    tags: [...product.tags.filter((tag) => tag !== CHIKU_PREVIEW_TAG), CHIKU_PREVIEW_TAG],
    extended: {
      ...product.extended,
      customizationGroups: [...groups.filter((group) => group.id !== eyeColors.id), eyeColors]
    }
  };
}

// Display source-backed fixed facts separately, without changing charge or cart resolution.
export function includedBuildItems(product: Product) {
  if (!isChikuPreview(product)) return [];
  return (product.extended.customizationGroups ?? []).flatMap((group) => {
    if (!group.required || group.selectionMode === "multiple" || group.options.length !== 1) return [];
    const option = group.options[0];
    if (option.priceDelta !== 0 || option.priceVerified !== true || option.displayable === false || option.factoryExists === false) return [];
    return [{ id: group.id, label: option.label }];
  });
}
