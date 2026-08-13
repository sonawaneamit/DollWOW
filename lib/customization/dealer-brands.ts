import type { Product } from "@/types/product";
import type { CustomizationGroup } from "@/types/customization";
import { normalizeDealerHeadGroups } from "@/lib/customization/dealer-heads";

export function getSeCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible SE Doll head. A standard head identity switch is included; any special construction is priced separately where offered.",
    extraDescription: "Optional paid add-on. Each selected additional head is charged separately.",
    // SE Doll's official single-TPE-head listing is currently $399.
    fallbackExtraPrice: 399,
    fallbackExtraPriceApplies: (candidate) => /\btpe\b/.test(identity(candidate)) && !/silicone head|silicone body|full silicone/.test(identity(candidate))
  });
}

export function getSixYeCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible 6YE head. The standard head identity switch is included with the doll.",
    extraDescription: "Optional paid TPE head ordered with this doll. Every selected additional head is charged separately.",
    // Current dealer evidence values the same-manufacturer 6YE TPE head at $299.
    fallbackExtraPrice: 299,
    fallbackExtraPriceApplies: (candidate) => /\btpe\b|hybrid|silicone head/.test(identity(candidate))
  });
}

export function getAngelkissCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Angelkiss head. A standard head identity switch is included with the doll.",
    extraDescription: "Optional paid additional head. Only heads with a verified current price are available for online checkout."
  });
}

export function getYlCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible YL head where the product offers a head library. Standard head identity switches are included.",
    extraDescription: "Optional paid YL head. Each selected additional head is charged separately."
  });
}

export function getErovenusCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Erovenus head where supported by this body.",
    extraDescription: "Optional paid Erovenus head. Each selected additional head is charged separately."
  });
}

export function getPiperCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Piper head where supported by this body.",
    extraDescription: "Optional paid Piper head. Each selected additional head is charged separately."
  });
}

export function getTantalyCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Tantaly head where supported by this product.",
    extraDescription: "Optional paid Tantaly head. Each selected additional head is charged separately."
  });
}

function identity(product: Product) {
  return [product.title, product.handle, product.productType, product.extended.brand, product.extended.material, product.extended.sourceTitle, ...product.tags]
    .filter(Boolean).join(" ").toLowerCase();
}
