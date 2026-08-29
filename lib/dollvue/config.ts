import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";
import type { DollVueGroup } from "./public";

export const DOLLVUE_PRODUCT_HANDLES = [
  "irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb",
  "irontech-penny-164cm-f-cup-silicone-head-companion-doll-1ttey",
  "irontech-dark-164cm-f-cup-silicone-companion-doll-1k1t7",
  "real-lady-shizuka-159cm-h-cup-silicone-companion-doll-1ldrw",
  "wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj",
  "lusandy-nadia-159cm-g-cup-silicone-companion-doll"
] as const;
const DOLLVUE_PRODUCT_HANDLE_PREFIXES = ["irontech-", "starpery-"] as const;
export const DOLLVUE_DEFAULT_PRODUCT_HANDLE = DOLLVUE_PRODUCT_HANDLES[0];
export const DOLLVUE_FREE_PREVIEWS = 5;
export const DOLLVUE_PROMPT_VERSION = "two-option-preview-v1";

export type DollVueSelection = { groupId: string; optionId: string };

export function isDollVueProduct(handle: string) {
  return DOLLVUE_PRODUCT_HANDLES.includes(handle as (typeof DOLLVUE_PRODUCT_HANDLES)[number]) ||
    DOLLVUE_PRODUCT_HANDLE_PREFIXES.some((prefix) => handle.startsWith(prefix));
}

export function isDollVueCatalogProduct(product: Product) {
  const explicitlyEnabledLusandy = product.handle === "lusandy-nadia-159cm-g-cup-silicone-companion-doll";
  return (explicitlyEnabledLusandy || DOLLVUE_PRODUCT_HANDLE_PREFIXES.some((prefix) => product.handle.startsWith(prefix))) &&
    product.extended.stockStatus !== "ready_to_ship";
}

export function dollVueUrl(handle: string) {
  return `/dollvue/${handle}`;
}

export function dollVueConfigForProduct(product: Product, fallback: BrandCustomizationConfig): BrandCustomizationConfig {
  // `fallback` is the resolved brand/family configuration. It already merges
  // product-specific supplier groups with shared defaults, normalized prices,
  // compatibility rules and DollVue eligibility. Returning the raw metafield
  // groups here would discard that reviewed normalization.
  return fallback;
}

export function dollVueGroups(config: BrandCustomizationConfig): DollVueGroup[] {
  return config.groups.flatMap((group) => {
    const options = group.options
      .filter((option) => option.dollVueEnabled === true && option.swatch?.kind === "image" && isAppearancePreview(group.label, option.label))
      .map(({ id, label, swatch }) => ({ id, label: cleanLabel(label), swatch }));
    if (!options.length) return [];
    return [{
      id: group.id,
      label: group.label,
      options
    }];
  });
}

function isAppearancePreview(groupLabel: string, optionLabel: string) {
  const group = groupLabel.trim().toLowerCase().replace(/^select\s+/, "");
  if (/^(skin tone|hairstyle|wig style|hair color|hair implanted color|eye color|nail color|toe nail color|nipple color|areola color|labia color|vagina color|vagina hair|vagina hair type|pubic hair|pubic hair type)$/.test(group)) return true;
  if (/makeup|finishing detail|^premium\b|hair implant add-on/.test(group)) {
    return /makeup|painting|realism|moles|freckles|bikini line|moustache|goatee|chest hair|arms hair|pubic hair|armpit hair/i.test(optionLabel);
  }
  return false;
}

export function resolveDollVueSelections(config: BrandCustomizationConfig, selections: DollVueSelection[]) {
  const groups = dollVueGroups(config);
  const resolved = selections.flatMap((selection) => {
    const group = groups.find((item) => item.id === selection.groupId);
    const option = group?.options.find((item) => item.id === selection.optionId);
    return group && option ? [{ group, option }] : [];
  });
  const unique = new Map(resolved.map((item) => [`${item.group.id}:${item.option.id}`, item]));
  return [...unique.values()].slice(0, 2);
}

export function buildDollVuePrompt(product: Product, selections: ReturnType<typeof resolveDollVueSelections>) {
  const imageMap = selections.map(({ group, option }, index) =>
    `Image ${index + 2}: ${group.label} reference only. Transfer only ${referenceProperty(group.id)} for the selected ${option.label} option. Unless the selected attribute explicitly includes shape or size, preserve Image 1's exact original geometry, boundaries, scale, placement, and proportions. Do not copy the reference image's identity, anatomy, pose, clothing, accessories, setting, text, logo, watermark, or unselected properties.`
  );
  const requestedEdits = selections.map(({ group, option }, index) =>
    `${group.label.toUpperCase()}: ${option.label}, guided only by Image ${index + 2}. Apply only this named selected attribute to its corresponding already-existing visible feature in Image 1. Adapt it naturally to Image 1's original product, material, local lighting, and presentation. Unless size, shape, placement, geometry, texture, or finish is explicitly named by this option, preserve those properties exactly as they appear in Image 1.`
  );

  return [
    "TASK",
    "Edit Image 1, the authoritative product photograph, into an accurate visual preview of the selected customization. This is the same exact adult-proportioned DollWOW catalog doll and the same photograph. Change only the attributes explicitly listed under REQUESTED EDITS.",
    "IMAGE MAP",
    "Image 1: authoritative base product, identity, geometry, pose, camera, lighting, clothing, setting, and crop reference. Image 1 wins every conflict.",
    ...imageMap,
    "PRESERVE EXACTLY",
    "Preserve the doll's facial geometry, sculpt, body geometry and proportions, pose, expression, gaze, camera angle, perspective, crop, composition, lighting direction, shadows, highlights, synthetic material texture, seams and joints where visible, clothing, accessories, background, and all other product details. Preserve the original number and shape of limbs, hands, fingers, feet, and toes. Keep every unselected attribute unchanged.",
    "REQUESTED EDITS",
    ...(requestedEdits.length ? requestedEdits : ["Keep the complete factory look unchanged."]),
    "PROHIBITED CHANGES",
    "DO NOT ADD OR INVENT ANYTHING. Do not redesign, beautify, retouch, age-shift, or reinterpret the doll. Do not change anatomy, body shape, facial features, expression, pose, clothing, accessories, setting, framing, exposure, contrast, or color grade. Do not add, invent, remove, cover, or replace objects, masks, eyewear, clothing, text, logos, watermarks, body parts, accessories, decorations, or product features. Do not copy identity, anatomy, geometry, pose, clothing, background, text, branding, or accessories from option-reference images.",
    "OUTPUT",
    "Create one photorealistic retail product-preview edit at the requested dimensions and original source aspect ratio. Keep the image opaque. The result must look like the same source photograph with only the selected options changed.",
    "FINAL COVERAGE CHECK BEFORE OUTPUT",
    "Return the same exact product photograph as Image 1 with only the named selected customizations changed. Verify no unselected attribute changed and no new element appeared. If anything unselected changed, restore it to Image 1 before output."
  ].join("\n\n");
}

function referenceProperty(groupId: string) {
  if (groupId === "skin-tone") return "the synthetic-skin color and finish";
  if (groupId === "hairstyle") return "the visible wig style, color, length, texture, part, and fringe";
  if (groupId === "hair-color") return "the visible wig color only";
  if (groupId === "eye-color") return "the visible iris color only";
  return "the approved finishing-detail placement, density, scale, and color only";
}

function cleanLabel(value: string) {
  return value.replace(/^Natrual\b/i, "Natural").replace(/\s*\(FREE\)\s*$/i, "").trim();
}
