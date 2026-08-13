import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
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
    extraDescription: "Optional additional Angelkiss head.",
    freeExtraAlongsideReplacement: true,
    includedExtraDescription: "Current Angelkiss promotion: choose one compatible additional head at no extra cost.",
    additionalHeadOptions: ANGELKISS_PROMOTIONAL_HEADS,
    includedExtraOptions: ANGELKISS_PROMOTIONAL_HEADS
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

const ANGELKISS_PROMOTIONAL_HEADS: CustomizationOption[] = [
  ["ls12-s198", "LS12 / S198", "WM-SSSeries-Facemovablejaw-LS12_S198.webp"],
  ["ls14-2-s266", "LS14-2 / S266", "WM-SSSeries-Facemovablejaw-LS14-2_S266.webp"],
  ["ls14-3-s266", "LS14-3 / S266", "WM-SSSeries-Facemovablejaw-LS14-3_S266.webp"],
  ["ls15-1-s273", "LS15-1 / S273", "WM-SSSeries-Facemovablejaw-LS15-1_S273.webp"],
  ["ls15-2-s273", "LS15-2 / S273", "WM-SSSeries-Facemovablejaw-LS15-2_S273.webp"],
  ["ls50", "LS50", "WM-SSSeries-Facemovablejaw-LS50.webp"],
  ["ls54", "LS54", "WM-SSSeries-Facemovablejaw-LS54.webp"],
  ["ls59", "LS59", "WM-SSSeries-Facemovablejaw-LS59.webp"],
  ["ls60", "LS60", "WM-SSSeries-Facemovablejaw-LS60.webp"],
  ["ls63", "LS63", "WM-SSSeries-Facemovablejaw-LS63.webp"],
  ["ls64", "LS64", "WM-SSSeries-Facemovablejaw-LS64.webp"],
  ["ls65", "LS65", "WM-SSSeries-Facemovablejaw-LS65.webp"],
  ["ls69", "LS69", "WM-SSSeries-Facemovablejaw-LS69.webp"],
  ["ss111", "SS111", "WM-SSSeries-Facemovablejaw-SS111.webp"],
  ["ss167", "SS167", "WM-SSSeries-Facemovablejaw-SS167.webp"],
  ["ss168", "SS168", "WM-SSSeries-Facemovablejaw-SS168.webp"],
  ["ss174", "SS174", "WM-SSSeries-Facemovablejaw-SS174.webp"],
  ["ss182", "SS182", "WM-SSSeries-Facemovablejaw-SS182.webp"],
  ["ss194", "SS194", "WM-SSSeries-Facemovablejaw-SS194.webp"]
].map(([id, label, file]) => ({
  id,
  label,
  priceDelta: 0,
  priceVerified: true,
  purchasable: true,
  visualizable: false,
  swatch: {
    kind: "image" as const,
    value: `https://cdn.myrobotdoll.com/wp-content/uploads/2025/03/${file}`,
    label: `${label} Angelkiss head reference`
  }
}));
