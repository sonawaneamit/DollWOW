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

export function getHrCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible HR head where the product offers a replacement-head library.",
    freeHeadLibraryMode: "included-extra",
    includedExtraDescription: "This product includes one optional additional HR head from the compatible choices shown.",
    extraDescription: "Optional paid HR head. Each selected additional head is charged separately."
  });
}

export function getJarlietCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Jarliet head where the product offers a replacement-head library.",
    freeHeadLibraryMode: "included-extra",
    includedExtraDescription: "This product includes one optional additional Jarliet head from the compatible choices shown.",
    extraDescription: "Optional paid Jarliet head. Only choices with a verified current price are available for online checkout."
  });
}

export function getClimaxCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Climax head where a replacement-head library is offered.",
    freeHeadLibraryMode: "included-extra",
    includedExtraDescription: "This product includes one optional additional Climax head from the compatible choices shown.",
    extraDescription: "Optional paid Climax head. Each selected additional head is charged separately."
  });
}

export function getDollsCastleCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Dolls Castle head where a replacement-head library is offered.",
    freeHeadLibraryMode: "included-extra",
    includedExtraDescription: "This product includes one optional additional Dolls Castle head from the compatible choices shown.",
    extraDescription: "Optional paid Dolls Castle head. Only choices with a verified current price are available for online checkout."
  });
}

export function getRealLadyCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Real Lady head where a replacement-head library is offered.",
    freeHeadLibraryMode: "included-extra",
    includedExtraDescription: "This product includes one optional additional Real Lady head from the compatible choices shown.",
    extraDescription: "Optional paid Real Lady head. Only choices with a verified current price are available for online checkout."
  });
}

export function getIlCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible IL Doll head where a replacement-head library is offered.",
    extraDescription: "Optional paid IL Doll head. Each selected additional head is charged separately."
  });
}

export function getAiTechCustomizationGroups(product: Product, groups: CustomizationGroup[]) {
  return normalizeDealerHeadGroups(product, groups, {
    chooseDescription: "Choose one compatible Ai-Tech head where supported by this product.",
    extraDescription: "Optional paid Ai-Tech head. Only choices with a verified current price are available for online checkout."
  });
}

function identity(product: Product) {
  return [product.title, product.handle, product.productType, product.extended.brand, product.extended.material, product.extended.sourceTitle, ...product.tags]
    .filter(Boolean).join(" ").toLowerCase();
}
