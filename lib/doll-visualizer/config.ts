import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";
import type { VisualizerGroup } from "./public";

export const VISUALIZER_PRODUCT_HANDLES = [
  "irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb",
  "irontech-penny-164cm-f-cup-silicone-head-companion-doll-1ttey"
] as const;
export const VISUALIZER_DEFAULT_PRODUCT_HANDLE = VISUALIZER_PRODUCT_HANDLES[0];
export const VISUALIZER_FREE_PREVIEWS = 5;
export const VISUALIZER_PROMPT_VERSION = "two-option-preview-v1";

const visibleGroupIds = ["skin-tone", "hairstyle", "hair-color", "eye-color"] as const;
const visualOnlyOptionIds = new Set(["add-moles-freckles"]);

export type VisualizerSelection = { groupId: string; optionId: string };

export function isVisualizerProduct(handle: string): handle is (typeof VISUALIZER_PRODUCT_HANDLES)[number] {
  return VISUALIZER_PRODUCT_HANDLES.includes(handle as (typeof VISUALIZER_PRODUCT_HANDLES)[number]);
}

export function visualizerUrl(handle: string) {
  return `/ops/doll-visualizer/${handle}`;
}

export function visualizerConfigForProduct(product: Product, fallback: BrandCustomizationConfig): BrandCustomizationConfig {
  const supplierGroups = product.extended.customizationGroups?.filter(
    (group) => Array.isArray(group.options) && group.options.length > 0 && Boolean(group.id) && Boolean(group.label)
  );
  return supplierGroups?.length ? { ...fallback, groups: supplierGroups } : fallback;
}

export function visualizerGroups(config: BrandCustomizationConfig): VisualizerGroup[] {
  const groups = visibleGroupIds.flatMap((id) => {
    const group = config.groups.find((item) => item.id === id);
    if (!group) return [];
    return [{
      id: group.id,
      label: group.label,
      options: group.options
        .filter((option) => option.swatch?.kind === "image")
        .map(({ id: optionId, label, swatch }) => ({ id: optionId, label: cleanLabel(label), swatch }))
    }];
  });

  const freckles = config.groups
    .flatMap((group) => group.options.map((option) => ({ group, option })))
    .find(({ option }) => visualOnlyOptionIds.has(option.id));
  if (freckles?.option.swatch?.kind === "image") {
    groups.push({
      id: freckles.group.id,
      label: "Finishing detail",
      options: [{ id: freckles.option.id, label: "Moles & freckles", swatch: freckles.option.swatch }]
    });
  }
  return groups.filter((group) => group.options.length > 0);
}

export function resolveVisualizerSelections(config: BrandCustomizationConfig, selections: VisualizerSelection[]) {
  const groups = visualizerGroups(config);
  const resolved = selections.flatMap((selection) => {
    const group = groups.find((item) => item.id === selection.groupId);
    const option = group?.options.find((item) => item.id === selection.optionId);
    return group && option ? [{ group, option }] : [];
  });
  const unique = new Map(resolved.map((item) => [`${item.group.id}:${item.option.id}`, item]));
  return [...unique.values()].slice(0, 2);
}

export function buildVisualizerPrompt(product: Product, selections: ReturnType<typeof resolveVisualizerSelections>) {
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
