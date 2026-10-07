import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";
import type { DollVueGroup } from "./public";
import { appearanceReferenceProperty, classifyAppearance } from './appearance';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';

export const DOLLVUE_PRODUCT_HANDLES = [
  "irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb",
  "irontech-penny-164cm-f-cup-silicone-head-companion-doll-1ttey",
  "irontech-dark-164cm-f-cup-silicone-companion-doll-1k1t7",
  "real-lady-shizuka-159cm-h-cup-silicone-companion-doll-1ldrw",
  "wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj",
  "lusandy-nadia-159cm-g-cup-silicone-companion-doll"
] as const;
const DOLLVUE_PRODUCT_HANDLE_PREFIXES = ["irontech-", "starpery-", "lusandy-"] as const;
const DOLLVUE_EXCLUDED_HANDLES = new Set([
  "lusandy-sex-doll-heads"
]);
export const DOLLVUE_DEFAULT_PRODUCT_HANDLE = DOLLVUE_PRODUCT_HANDLES[0];
export const DOLLVUE_FREE_PREVIEWS = 5;
export const DOLLVUE_PROMPT_VERSION = "two-option-preview-appearance-v2";

export type DollVueSelection = { groupId: string; optionId: string };

export function isDollVueProduct(handle: string) {
  const normalizedHandle = handle.toLowerCase();
  if (isExcludedLusandyHandle(normalizedHandle)) return false;
  return DOLLVUE_PRODUCT_HANDLES.includes(normalizedHandle as (typeof DOLLVUE_PRODUCT_HANDLES)[number]) ||
    DOLLVUE_PRODUCT_HANDLE_PREFIXES.some((prefix) => normalizedHandle.startsWith(prefix));
}

export function isDollVueCatalogProduct(product: Product) {
  if (typeof product.dollVueAvailable === 'boolean') return product.dollVueAvailable;
  const handle = product.handle.toLowerCase();
  const excludedLusandyProduct = handle.startsWith("lusandy-") &&
    (isExcludedLusandyHandle(handle) || String(product.extended.bodyType).toLowerCase() === "torso");

  return isDollVueProduct(handle) &&
    product.extended.stockStatus !== "ready_to_ship" &&
    !excludedLusandyProduct;
}

function isExcludedLusandyHandle(handle: string) {
  return DOLLVUE_EXCLUDED_HANDLES.has(handle) ||
    (handle.startsWith("lusandy-") && handle.includes("torso"));
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
    if (group.visibleWhen?.length) return [];
    const options = group.options
      .filter((option) => option.dollVueEnabled === true && option.swatch?.kind === "image" && isOwnedOptionAsset(option.swatch.value) && classifyAppearance(group, option).status === 'candidate')
      .map(({ id, label, swatch }) => ({ id, label: cleanLabel(label), swatch }));
    if (!options.length) return [];
    return [{
      id: group.id,
      label: group.label,
      options
    }];
  });
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

export function areDollVueSelectionsValid(config: BrandCustomizationConfig, selections: DollVueSelection[]) {
  if (selections.length < 1 || selections.length > 2) return false;
  const resolved = resolveDollVueSelections(config, selections);
  if (resolved.length !== selections.length) return false;
  const includes = (choice: DollVueSelection) => selections.some(s => s.groupId === choice.groupId && s.optionId === choice.optionId);
  for (const {group} of resolved) {
    const original = config.groups.find(g => g.id === group.id)!;
    if (original.selectionMode !== 'multiple' && selections.filter(s => s.groupId === group.id).length > 1) return false;
    // The preview does not yet carry the customer's full configurator state.
    if (original.visibleWhen?.length) return false;
  }
  return !config.rules.some(rule => includes(rule.when) && includes(rule.conflictsWith));
}

export function buildDollVuePrompt(product: Product, selections: ReturnType<typeof resolveDollVueSelections>) {
  const imageMap = selections.map(({ group, option }, index) =>
    `Image ${index + 2}: ${group.label} reference only. Transfer only ${referenceProperty(group, option)} for the selected ${option.label} option. Unless the selected attribute explicitly includes shape or size, preserve Image 1's exact original geometry, boundaries, scale, placement, and proportions. Do not copy the reference image's identity, anatomy, pose, clothing, accessories, setting, text, logo, watermark, or unselected properties.`
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

function referenceProperty(group: DollVueGroup, option: DollVueGroup['options'][number]) {
  const decision = classifyAppearance(group, option);
  if (decision.status !== 'candidate') throw new Error('Unsupported DollVue appearance selection');
  return appearanceReferenceProperty(decision.attribute);
}

function cleanLabel(value: string) {
  return value.replace(/^Natrual\b/i, "Natural").replace(/\s*\(FREE\)\s*$/i, "").trim();
}
