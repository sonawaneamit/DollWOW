import type { Product } from "@/types/product";
import type { BrandCustomizationConfig } from "@/types/customization";
import { canonicalBrandValue } from "@/lib/catalog/brands";

export const oralGuideSources = [
  { title: "Irontech: oral movement and care", href: "https://www.irontechdoll.com/oral-sex-movement-2/" },
  { title: "Irontech: ROS MAX head design", href: "https://de.irontechdoll.com/ros-silicone-head/" },
  { title: "SE Doll: neck movement and body restrictions", href: "https://www.sedoll.com/sex-doll-news-new-blowjob-sexbot-brings-more-realistic-oral-action/" },
  { title: "SE Doll: head suction, sound and heating", href: "https://www.sedoll.com/silicone-doll-head-oral-heating-suction-sound-features-a-complete-guide/" },
  { title: "Top Fire: Wendy's current build options", href: "https://dollwow.com/products/top-fire-doll-wendy-170cm-h-cup-silicone-companion-doll" },
  { title: "Angelkiss: manufacturer's ROS-head announcement", href: "https://dollforum.com/forum/viewtopic.php?t=170072" },
  { title: "Yeloly: model descriptions and three-opening terminology", href: "https://www.yeloly.com/" },
  { title: "WM: Karola's current custom build options", href: "https://dollwow.com/products/wm-karola-170cm-h-cup-tpe-companion-doll-1ckgq" },
  { title: "MD: Mary's current custom build options", href: "https://dollwow.com/products/md-mary-168cm-silicone-companion-doll" },
  { title: "SY: Lirael's head and oral choices", href: "https://dollwow.com/products/sy-doll-lirael-170cm-silicone-efd59b6" },
  { title: "TOP-CYDOLL: Elva's factory upgrade menu", href: "https://www.topcydoll.com/shop/elva/" },
  { title: "Dolls Castle / Galatea: Emma's head functions", href: "https://dollwow.com/products/dolls-castle-galatea-emma-gt06-163cm-c-cup-silicone-doll" }
] as const;

export const oralGuideExamples = [
  {
    id: "gid://shopify/Product/10664680456376",
    handle: "irontech-molly-166cm-2-0-s44-ros-max-silicone-doll",
    name: "Molly", brand: "Irontech", catalogBrand: "irontech", category: "Head suction",
    description: "S44 ROS MAX head on the 166cm 2.0 silicone body. Oral suction and oral heating are separate add-ons. This is not a recommendation for powered neck movement.",
    options: [
      { groupId: "premium-head-body-options", optionId: "oral-auto-sucking", label: "Oral suction" },
      { groupId: "premium-head-body-options", optionId: "oral-heating", label: "Oral heating" }
    ]
  },
  {
    id: "gid://shopify/Product/10433164214456",
    handle: "wm-karola-170cm-h-cup-tpe-companion-doll-1ckgq",
    name: "Karola", brand: "WM", catalogBrand: "wm", category: "Factory robot option",
    description: "A 170cm H-cup custom TPE body with a separately priced Auto Blowjob Sex Robot option. Choose an oral-capable head and the ROS mouth option; do not confuse the separate vaginal suction feature with oral suction.",
    prerequisites: [{ groupId: "premium-head-body-options", optionId: "real-oral-sex-ros-free", price: 0 }],
    options: [{ groupId: "premium-head-body-options", optionId: "auto-blowjob-sex-robot", label: "Auto Blowjob Sex Robot" }]
  },
  {
    id: "gid://shopify/Product/10640043442360",
    handle: "md-mary-168cm-silicone-companion-doll",
    name: "Mary", brand: "MD Doll", catalogBrand: "md", category: "Factory robot option",
    description: "A 168cm custom silicone doll. Choose the ROS movable-jaw head type when configuring oral use; Auto Blowjob is a separate body upgrade, not a feature supplied by a hard head.",
    prerequisites: [{ groupId: "head-type", optionId: "ros-head-movable-jaw", price: 0 }],
    options: [{ groupId: "premium-head-body-options-multiple", optionId: "auto-blowjob", label: "Auto Blowjob" }]
  },
  {
    id: "gid://shopify/Product/10676884308152",
    handle: "dolls-castle-galatea-emma-gt06-163cm-c-cup-silicone-doll",
    name: "Emma", brand: "Dolls Castle / Galatea", catalogBrand: "dolls-castle", category: "Head suction",
    description: "ROS head with a movable jaw on the 163cm C-cup silicone body. Optional oral suction is different from moving the whole head.",
    options: [
      { groupId: "oral-functions", optionId: "oral-auto-suction", label: "Oral suction" },
      { groupId: "oral-functions", optionId: "oral-heating", label: "Oral heating" }
    ]
  },
  {
    id: "gid://shopify/Product/10663304167608",
    handle: "top-fire-doll-wendy-170cm-h-cup-silicone-companion-doll",
    name: "Wendy", brand: "Top Fire", catalogBrand: "top-fire", category: "Head functions or robot options",
    description: "A 170cm H-cup custom silicone doll. The three-in-one mouth package and powered robot options are separate choices, not standard equipment. Select a compatible ROS head when configuring oral features.",
    options: [
      { groupId: "premium-head-body-options-multiple", optionId: "oral-suction", label: "Oral suction" },
      { groupId: "premium-head-body-options-multiple", optionId: "3-in-1-licking-suction-heating", label: "Tongue, suction & heat bundle" },
      { groupId: "robotic-functions", optionId: "auto-blowjob-plug-in", label: "Auto blowjob (plug-in)" },
      { groupId: "robotic-functions", optionId: "auto-blowjob-rechargeable", label: "Auto blowjob (rechargeable)" }
    ]
  },
  {
    id: "gid://shopify/Product/10512378364088",
    handle: "sy-doll-lirael-170cm-silicone-efd59b6",
    name: "Lirael", brand: "SY", catalogBrand: "sy", category: "Head choice first",
    description: "A movable-jaw head on a 170cm silicone body. The price below is for the base doll, not powered oral functions. Choose head functions separately; a movable jaw alone does not make the head move automatically.",
    requiredMeasurements: [{ key: "Material", value: "Movable jaw head+Silicone body" }],
    options: []
  },
  {
    id: "gid://shopify/Product/10676884078776",
    handle: "dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll",
    name: "Chiku", brand: "Dolls Castle", catalogBrand: "dolls-castle", category: "Manual oral structure",
    description: "Fixed teeth and tongue are included. They are not removable, and their presence does not mean the head has powered oral suction or neck movement.",
    options: []
  }
] as const;

export function oralGuideExampleMatches(product: Product, example: typeof oralGuideExamples[number]) {
  return product.id === example.id && product.handle === example.handle &&
    canonicalBrandValue(product.extended.brand ?? product.vendor) === example.catalogBrand &&
    !product.tags.some(tag => /(?:review|source|safety|content)[-:]hold|dollwow-test/i.test(tag)) &&
    (!("requiredMeasurements" in example) || example.requiredMeasurements.every(ref => product.extended.measurements?.[ref.key] === ref.value));
}

// A catalog label alone is not proof of a purchasable, unconditional price.
export function oralGuideOptionPrice(
  product: Product,
  config: BrandCustomizationConfig,
  example: typeof oralGuideExamples[number],
  groupId: string,
  optionId: string
) {
  if (!oralGuideExampleMatches(product, example)) return null;
  if (product.extended.stockStatus === "ready_to_ship" || product.tags.some(tag => /^(?:ready_to_ship|in-stock|warehouse-.+)$/i.test(tag))) return null;
  if (!example.options.some(option => option.groupId === groupId && option.optionId === optionId)) return null;
  function verifiedPrice(groupId: string, optionId: string) {
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
  if ("prerequisites" in example && !example.prerequisites.every(ref => verifiedPrice(ref.groupId, ref.optionId) === ref.price)) return null;
  return verifiedPrice(groupId, optionId);
}

export const oralGuideQuestions = [
  { question: "Does three-in-one always mean three powered mouth features?", answer: "No. Read the named functions. Top Fire's mouth package lists tongue movement, oral suction and heating. Yeloly's Violet torso description uses three-in-one for oral, vaginal and anal openings. Three openings do not establish a powered oral system." },
  { question: "Does ROS mean the doll moves automatically?", answer: "No. ROS describes the mouth structure. Powered suction, a moving tongue and powered neck movement are separate features. Check which ones are included or selected on the exact doll." },
  { question: "Is oral heating the same as suction?", answer: "No. Heating warms the mouth; suction uses a powered mechanism. A heated mouth does not automatically move or create suction." },
  { question: "Can I add powered movement to any head and body?", answer: "No. The head needs a suitable oral channel, and the body must support the mechanism. Body version matters as well as height. Confirm the exact head and body combination before choosing motorized movement." },
  { question: "Does a US-stock listing include all these functions?", answer: "Not necessarily. A warehouse body listing may still need a head choice. Confirm the head, installed functions and current location together before relying on a delivery estimate." }
] as const;

export function oralGuideFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: oralGuideQuestions.map(item => ({
      "@type": "Question", name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };
}
