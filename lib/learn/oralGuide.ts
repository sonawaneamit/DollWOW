import type { Product } from "@/types/product";
import type { BrandCustomizationConfig } from "@/types/customization";

export const oralGuideSources = [
  { title: "Irontech: oral movement and care", href: "https://www.irontechdoll.com/oral-sex-movement-2/" },
  { title: "Irontech: ROS MAX head design", href: "https://de.irontechdoll.com/ros-silicone-head/" },
  { title: "SE Doll: neck movement and body restrictions", href: "https://www.sedoll.com/sex-doll-news-new-blowjob-sexbot-brings-more-realistic-oral-action/" },
  { title: "SE Doll: head suction, sound and heating", href: "https://www.sedoll.com/silicone-doll-head-oral-heating-suction-sound-features-a-complete-guide/" }
] as const;

export const oralGuideExamples = [
  {
    id: "gid://shopify/Product/10664680456376",
    handle: "irontech-molly-166cm-2-0-s44-ros-max-silicone-doll",
    name: "Molly", brand: "Irontech", category: "Head suction",
    description: "S44 ROS MAX head on the 166cm 2.0 silicone body. Oral suction and oral heating are separate add-ons. This is not a recommendation for powered neck movement.",
    options: [
      { groupId: "premium-head-body-options", optionId: "oral-auto-sucking", label: "Oral suction" },
      { groupId: "premium-head-body-options", optionId: "oral-heating", label: "Oral heating" }
    ]
  },
  {
    id: "gid://shopify/Product/10676884308152",
    handle: "dolls-castle-galatea-emma-gt06-163cm-c-cup-silicone-doll",
    name: "Emma", brand: "Dolls Castle / Galatea", category: "Head suction",
    description: "ROS head with a movable jaw on the 163cm C-cup silicone body. Optional oral suction is different from moving the whole head.",
    options: [
      { groupId: "oral-functions", optionId: "oral-auto-suction", label: "Oral suction" },
      { groupId: "oral-functions", optionId: "oral-heating", label: "Oral heating" }
    ]
  },
  {
    id: "gid://shopify/Product/10676884078776",
    handle: "dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll",
    name: "Chiku", brand: "Dolls Castle", category: "Manual oral structure",
    description: "Fixed teeth and tongue are included. They are not removable, and their presence does not mean the head has powered oral suction or neck movement.",
    options: []
  }
] as const;

// A catalog label alone is not proof of a purchasable, unconditional price.
export function oralGuideOptionPrice(
  product: Product,
  config: BrandCustomizationConfig,
  example: typeof oralGuideExamples[number],
  groupId: string,
  optionId: string
) {
  if (product.id !== example.id || product.handle !== example.handle) return null;
  if (!example.options.some(option => option.groupId === groupId && option.optionId === optionId)) return null;
  const groups = config.groups.filter(group => group.id === groupId);
  if (groups.length !== 1 || groups[0].visibleWhen !== undefined) return null;
  const options = groups[0].options.filter(option => option.id === optionId);
  if (options.length !== 1) return null;
  const option = options[0];
  if (option.priceVerified !== true || option.factoryExists === false || option.displayable === false || option.purchasable === false) return null;
  if (typeof option.priceDelta !== "number" || !Number.isFinite(option.priceDelta) || option.priceDelta < 0) return null;
  if (config.rules.some(rule => [rule.when, rule.conflictsWith].some(ref => ref.groupId === groupId && ref.optionId === optionId))) return null;
  return option.priceDelta;
}

export const oralGuideQuestions = [
  { question: "Does ROS mean the doll moves automatically?", answer: "No. ROS describes the mouth structure. Powered suction, a moving tongue and powered neck movement are separate features. Check which ones are included or selected on the exact doll." },
  { question: "Is oral heating the same as suction?", answer: "No. Heating warms the mouth; suction uses a powered mechanism. A heated mouth does not automatically move or create suction." },
  { question: "Can I add powered movement to any head and body?", answer: "No. The head needs a suitable oral channel, and the body must support the mechanism. Body version matters as well as height. Confirm the exact head and body combination before choosing motorized movement." },
  { question: "Does a US-stock listing include all these functions?", answer: "Not necessarily. A warehouse body listing may still need a head choice. Confirm the head, installed functions and current location together before relying on a delivery estimate." }
] as const;
