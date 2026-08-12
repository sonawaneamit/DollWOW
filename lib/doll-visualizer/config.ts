import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";
import type { VisualizerGroup } from "./public";

export const VISUALIZER_PRODUCT_HANDLES = [
  "irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb",
  "irontech-penny-164cm-f-cup-silicone-head-companion-doll-1ttey"
] as const;
export const VISUALIZER_DEFAULT_PRODUCT_HANDLE = VISUALIZER_PRODUCT_HANDLES[0];
export const VISUALIZER_FREE_PREVIEWS = 5;
export const VISUALIZER_COOKIE = "dw_visualizer_usage_v1";
export const VISUALIZER_PROMPT_VERSION = "identity-lock-v3";

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
  return [...unique.values()].slice(0, 5);
}

export function buildVisualizerPrompt(product: Product, selections: ReturnType<typeof resolveVisualizerSelections>) {
  const imageMap = selections.map(({ group, option }, index) =>
    `Image ${index + 2}: ${group.label} reference only. Transfer only ${referenceProperty(group.id)} for the selected ${option.label} option. Unless the selected attribute explicitly includes shape or size, preserve Image 1's exact original geometry, boundaries, scale, placement, and proportions. Do not copy the reference image's identity, anatomy, pose, clothing, accessories, setting, text, logo, watermark, or unselected properties.`
  );
  const requestedEdits = selections.map(({ group, option }, index) =>
    optionModule(group.id, group.label, option.label, index + 2)
  );

  return [
    "TASK",
    "Edit Image 1, the authoritative product photograph, into an accurate visual preview of the selected customization. The result must be the same exact adult-proportioned DollWOW catalog doll in the same exact photograph, as if this same doll changed only the selected appearance attributes and the same camera immediately took the same photograph again. Change only the attributes explicitly listed under REQUESTED EDITS.",
    "IMAGE MAP",
    "Image 1: authoritative base product, identity, geometry, pose, camera, lighting, clothing, setting, and crop reference. Image 1 wins every conflict.",
    ...imageMap,
    "PRESERVE EXACTLY",
    "Image 1 is the sole identity and composition authority. Preserve the exact face sculpt and identity: head shape, forehead, brows, eye shape and spacing, nose, cheeks, lips, jaw, chin, ears, expression, gaze, and apparent age. Preserve the exact body sculpt, breast and torso geometry, waist and hip shape, limb geometry, pose, hand placement, finger placement, foot placement, camera angle, perspective, framing, crop, background, furniture, props, lighting direction, exposure, white balance, shadows, highlights, synthetic material texture, seams and joints. Preserve the original number and shape of limbs, hands, fingers, feet, and toes. Keep every unselected attribute unchanged. Never replace the face or reinterpret the pose.",
    "REQUESTED EDITS",
    ...(requestedEdits.length ? requestedEdits : ["Keep the complete factory look unchanged."]),
    "PROHIBITED CHANGES",
    "DO NOT ADD OR INVENT ANYTHING. Do not redesign, beautify, retouch, age-shift, replace, or reinterpret the doll. Do not create a new face. Do not change anatomy, body shape, facial features, expression, gaze, pose, hand placement, limb placement, clothing, accessories, setting, framing, crop, exposure, contrast, white balance, or color grade. Do not zoom, recrop, or move the camera. Do not add, invent, remove, cover, or replace objects, masks, eyewear, clothing, text, logos, watermarks, body parts, accessories, decorations, or product features. Option-reference images are attribute swatches only: never copy their identity, face, head, anatomy, geometry, pose, styling, clothing, background, text, branding, camera, lighting, or accessories.",
    "OUTPUT",
    "Create one photorealistic retail product-preview edit at the requested dimensions and original source aspect ratio. Keep the image opaque. The result must look like the same source photograph with only the selected options changed.",
    "FINAL COVERAGE CHECK BEFORE OUTPUT",
    "Return the same exact product photograph as Image 1 with only the named selected customizations changed. Compare against Image 1 before output: the face identity, face geometry, body geometry, pose, hand placement, camera, crop, lighting, exposure, background, furniture, and props must match exactly. For a skin-tone selection, the selected tone must cover the face and every other visible synthetic-skin region consistently. Verify no unselected attribute changed and no new element appeared. If anything unselected changed or any selected region was missed, correct it before output."
  ].join("\n\n");
}

function optionModule(groupId: string, groupLabel: string, optionLabel: string, imageNumber: number) {
  const base = `${groupLabel.toUpperCase()}: ${optionLabel}, guided only by Image ${imageNumber}.`;
  if (groupId === "skin-tone") {
    return `${base} Transfer only the selected synthetic-skin color and material finish from Image ${imageNumber}; do not copy its face, anatomy, pose, hair, setting, lighting, or styling. Apply the selected tone continuously and consistently to every visible synthetic-skin surface belonging to the doll in Image 1, including the complete face, ears, neck, shoulders, chest, torso, arms, elbows, forearms, wrists, both hands, every visible finger, hips, legs, knees, calves, ankles, feet, and every visible toe. Include partially visible skin at hair and body edges. Do not stop at the body or leave the face in the original tone. Preserve Image 1's exact facial sculpt, body sculpt, pose, local shadows, highlights, texture, gloss, detail painting, seams, contours, camera, exposure, and white balance. Do not recolor hair, brows, lashes, irises, sclera, lips, nails, props, furniture, or background.`;
  }
  if (groupId === "hairstyle") {
    return `${base} Transfer only the selected wig's color, length, texture, part, fringe, and style from Image ${imageNumber}. Adapt that wig to Image 1's exact original head position, hairline placement, pose, camera, crop, and lighting. Preserve Image 1's exact face identity and face geometry; do not copy the reference model's face, head shape, body, pose, expression, or setting.`;
  }
  if (groupId === "hair-color") {
    return `${base} Change only the visible wig color. Preserve Image 1's exact wig length, cut, texture, volume, part, fringe, hairline, flyaways, face identity, pose, and lighting. Do not copy any other property from Image ${imageNumber}.`;
  }
  if (groupId === "eye-color") {
    return `${base} Change only the iris color in each visible eye. Preserve Image 1's exact face identity, eye shape, eye spacing, pupils, sclera, catchlights, corneal reflections, eyelids, lashes, gaze, and surrounding makeup. Do not copy the reference image's face or eye geometry.`;
  }
  return `${base} Apply only this named selected attribute to its corresponding already-existing visible feature in Image 1. Preserve Image 1's exact identity, geometry, boundaries, scale, placement, proportions, pose, lighting, and every unselected property. Do not copy any other property from Image ${imageNumber}.`;
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
