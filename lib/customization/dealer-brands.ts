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
    authoritativeHeadOptions: ANGELKISS_PROMOTIONAL_HEADS,
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

const ANGELKISS_STANDARD_HEADS = [
  ["ls4-1-s70", "LS4-1 / S70", "LS4-1-S70"],
  ["ls4-2-s70", "LS4-2 / S70", "LS4-2-S70"],
  ["ls5-1-s85", "LS5-1 / S85", "LS5-1-S85"],
  ["ls5-2-s85", "LS5-2 / S85", "LS5-2-S85"],
  ["ls7-1-s120", "LS7-1 / S120", "LS7-1-S120"],
  ["ls7-2-s120", "LS7-2 / S120", "LS7-2-S120"],
  ["ls8-s142", "LS8 / S142", "LS8-S142"],
  ["ls10-1-s159", "LS10-1 / S159", "LS10-1-S159"],
  ["ls10-2-s159", "LS10-2 / S159", "LS10-2-S159"],
  ["ls10-3-s159", "LS10-3 / S159", "LS10-3-S159"],
  ["ls10-4-s159", "LS10-4 / S159", "LS10-4-S159"],
  ["ls12-s198", "LS12 / S198", "LS12-S198"],
  ["ls14-1-s266", "LS14-1 / S266", "LS14-1-S266"],
  ["ls14-2-s266", "LS14-2 / S266", "LS14-2-S266"],
  ["ls14-3-s266", "LS14-3 / S266", "LS14-3-S266"],
  ["ls15-1-s273", "LS15-1 / S273", "LS15-1-S273"],
  ["ls15-2-s273", "LS15-2 / S273", "LS15-2-S273"],
  ["ls17-1-s370", "LS17-1 / S370", "LS17-1-S370"],
  ["ls17-2-s370", "LS17-2 / S370", "LS17-2-S370"],
  ["ls18", "LS18", "LS18"], ["ls19", "LS19", "LS19"],
  ["ls20-s33", "LS20 / S33", "LS20-S33"], ["ls23", "LS23", "LS23"],
  ["ls27", "LS27", "LS27"], ["ls29", "LS29", "LS29"],
  ["ls31", "LS31", "LS31"], ["ls32", "LS32", "LS32"],
  ["ls33-1", "LS33-1", "LS33-1"], ["ls33-2", "LS33-2", "LS33-2"],
  ["ls34", "LS34", "LS34"], ["ls35-1", "LS35-1", "LS35-1"],
  ["ls35-2", "LS35-2", "LS35-2"], ["ls42", "LS42", "LS42"],
  ["ls43", "LS43", "LS43"], ["ls44", "LS44", "LS44"],
  ["ls45-1", "LS45-1", "LS45-1"], ["ls45-2", "LS45-2", "LS45-2"],
  ["ls46", "LS46", "LS46"], ["ls50-1", "LS50-1", "LS50-1"],
  ["ls50-2", "LS50-2", "LS50-2"], ["ls51", "LS51", "LS51"],
  ["ls53", "LS53", "LS53"], ["ls54", "LS54", "LS54"],
  ["ls59", "LS59", "LS59"], ["ls60", "LS60", "LS60"],
  ["ls63", "LS63", "LS63"], ["ls64", "LS64", "LS64"],
  ["ls67", "LS67", "LS67"], ["ls68", "LS68", "LS68"]
] as const;

const ANGELKISS_ROS_HEADS = [
  ["ls12-s198", "LS12 / S198", "LS12_S198"],
  ["ls14-2-s266", "LS14-2 / S266", "LS14-2_S266"],
  ["ls14-3-s266", "LS14-3 / S266", "LS14-3_S266"],
  ["ls15-1-s273", "LS15-1 / S273", "LS15-1_S273"],
  ["ls15-2-s273", "LS15-2 / S273", "LS15-2_S273"],
  ["ls50", "LS50", "LS50"], ["ls54", "LS54", "LS54"],
  ["ls59", "LS59", "LS59"], ["ls60", "LS60", "LS60"],
  ["ls63", "LS63", "LS63"], ["ls64", "LS64", "LS64"],
  ["ls65", "LS65", "LS65"], ["ls69", "LS69", "LS69"],
  ["ss111", "SS111", "SS111"], ["ss167", "SS167", "SS167"],
  ["ss168", "SS168", "SS168"], ["ss174", "SS174", "SS174"],
  ["ss182", "SS182", "SS182"], ["ss194", "SS194", "SS194"]
] as const;

const ANGELKISS_PROMOTIONAL_HEADS: CustomizationOption[] = [
  ...ANGELKISS_STANDARD_HEADS.map(([id, label, file]) => [
    `standard-${id}`, `Standard Silicone · ${label}`, `WM-Silicone-Faces-${file}.webp`
  ]),
  ...ANGELKISS_ROS_HEADS.map(([id, label, file]) => [
    `ros-${id}`, `ROS Silicone · ${label}`, `WM-SSSeries-Facemovablejaw-${file}.webp`
  ])
].map(([id, label, file]) => ({
  id,
  label,
  priceDelta: 0,
  priceVerified: true,
  purchasable: true,
  dollVueEnabled: false,
  swatch: {
    kind: "image" as const,
    value: `https://cdn.myrobotdoll.com/wp-content/uploads/2025/03/${file}`,
    label: `${label} Angelkiss head reference`
  }
}));
