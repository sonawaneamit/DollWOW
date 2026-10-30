import type { Metadata } from "next";
import type { Product } from "@/types/product";
import { catalogBrands, type CatalogBrand } from "@/lib/catalog/brands";
import { productPublicTitle } from "@/lib/catalog/naming";
import { env } from "@/lib/utils/env";
import { batchIBuyerPreviewEnabled } from "./batchIBuyerPreview";

const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export const brandHubHandles = catalogBrands.map((brand) => brand.collectionHandle);

type BrandSeoProfile = {
  intro: string;
  positioning: string;
  metaTitle?: string;
  metaDescription?: string;
  guideHref?: string;
  guideLabel?: string;
  buyerNotes: Array<{ title: string; body: string }>;
  comparisonRows?: Array<[string, string, string]>;
  faqs: Array<{ question: string; answer: string }>;
};

const brandProfiles: Record<string, Partial<BrandSeoProfile>> = {
  rosretty: {
    metaTitle: "Rosretty Dolls | Compare Forms & Confirm Build Details",
    metaDescription: "Compare Rosretty full dolls and torsos by exact materials, included body areas and supported choices. Confirm missing weight before planning handling.",
    positioning: "Compare each Rosretty product's form and construction, confirming missing weight or material details before deciding how to handle it.",
    intro: "Compare current Rosretty listings across complete dolls and torso products, checking the included body areas and exact head and body construction. Material labels can describe silicone, TPE or a silicone head, and a head label alone does not establish the body's material. If a usable finished weight or material detail is missing, ask for confirmation before planning lifting, cleaning or storage. Match the included build and appearance to the supported choices, configured price and ordering path rather than assuming every listing has complete specifications.",
    buyerNotes: [
      { title: "Confirm weight before handling plans", body: "A missing or zero weight is unknown, not a lightweight build. Ask for the exact finished weight before deciding how to lift, clean and store the product." },
      { title: "Check form and materials together", body: "Confirm complete doll versus torso, included head and separate body and head materials. Ask for any missing material detail and use the exact product's supplied care guidance." },
      { title: "Verify the included appearance", body: "A gallery does not establish every accessory or supported choice. Review the exact included configuration and ordering path before comparing totals." }
    ],
    comparisonRows: [
      ["Known handling weight", "Missing specifications cannot establish lightness or easy handling.", "Confirm the actual finished weight and full dimensions before planning the lift and storage route."],
      ["Form and construction", "A torso differs from a complete doll, and a silicone-head label is not a full-body specification.", "Check included body areas and both material specifications rather than guessing from the gallery."],
      ["Included build", "Reference photos and other models' choices do not establish what is supplied here.", "Match the listing's included appearance, supported options, configured total and ordering path."]
    ],
    faqs: [
      { question: "What if a Rosretty listing has no usable weight?", answer: "Ask for the exact finished build's weight before planning lifting, cleaning or storage. Missing or zero weight is unknown, not proof of a lightweight product." },
      { question: "Does this collection contain only complete dolls?", answer: "No. Current Rosretty listings include complete dolls and torso products. Confirm which body areas and any head are included before comparing dimensions or price." },
      { question: "Does a silicone-head label mean a full-silicone body?", answer: "No. Confirm head and body materials separately, asking for missing specifications. Use the exact product's supplied care instructions rather than inferring construction from appearance." },
      { question: "Are the photographed styling and options all included?", answer: "Only what the listing or confirmed configuration identifies as included. Check supported choices and do not assume every photographed outfit, wig or prop is supplied." }
    ]
  },
  sy: {
    metaTitle: "SY Dolls | Compare Full Dolls, Torsos & Materials",
    metaDescription: "Compare SY complete dolls and torsos by separate head and body materials, full measurements, listed weight, included features and supported choices.",
    positioning: "Compare SY complete dolls and torso builds separately, using exact materials and included configuration rather than a brand-wide option list.",
    intro: "Compare current SY listings across complete dolls and torso products, with TPE, silicone and silicone-head material labels in the collection. Confirm the included body areas and separate head and body specifications before treating different builds as equivalent. Use full dimensions and actual listed weight to plan handling; if a usable weight or material detail is missing, ask for it. Compare the included appearance, supported choices, configured total and ordering path without assuming similar names or photos describe the same product.",
    buyerNotes: [
      { title: "Compare equivalent product forms", body: "Check whether the product is a complete doll or a torso and which body areas and head are included before comparing price or dimensions." },
      { title: "Read both material specifications", body: "A silicone-head label does not establish a full-silicone body. Use the exact construction and supplied care guidance; confirm missing details rather than guessing." },
      { title: "Keep the final configuration together", body: "Review the included appearance, supported choices, actual weight, configured total and ordering path. Another SY model's options are not a universal specification." }
    ],
    comparisonRows: [
      ["Included form", "A complete doll and a torso can include different body areas and dimensions.", "Start from the exact product form and included head when comparing current listings."],
      ["Materials and handling", "Head material, body material and actual weight affect care and practical handling.", "Read both material details and confirm any missing weight before planning storage or lifting."],
      ["Supported choices", "Similar names or galleries do not establish an identical option set.", "Use the exact listing's included build, compatible choices, total and ordering path."]
    ],
    faqs: [
      { question: "Are all SY listings complete dolls?", answer: "No. The current collection includes complete dolls and torso products. Confirm included body areas and any head before comparing specifications or starting prices." },
      { question: "Are all SY dolls the same material?", answer: "No. Current listings include TPE, silicone and silicone-head labels. Check body and head materials separately, including the exact product's supplied care instructions." },
      { question: "What should I do if weight or material information is missing?", answer: "Ask for confirmation for the exact build. Missing weight is not a lightweight claim, and appearance alone does not establish construction or care requirements." },
      { question: "Can every SY model use the same upgrades?", answer: "Do not assume so. Supported choices depend on the exact head, body, material and ordering path; a fixed warehouse build may not offer custom-made selections." }
    ]
  },
  yl: {
    metaTitle: "YL Dolls | Compare Current Materials & Builds",
    metaDescription: "Compare current YL dolls by exact body and head construction, TPE or silicone labels, measurements, listed weight, included build and supported options.",
    positioning: "Compare current YL builds by exact construction and measurements rather than assuming one material or option set across the brand.",
    intro: "Compare current YL listings with TPE and silicone material labels, reading the exact body and head construction for the product you choose. Use full measurements and listed weight together: similar heights do not establish the same proportions, handling needs or supported options. Confirm the included head, appearance and accessories separately from custom choices, then compare the configured price and ordering path. A fixed warehouse build should be checked on its own terms rather than treated as the same selection as a custom-made order.",
    buyerNotes: [
      { title: "Check the exact material", body: "Current listings include more than one material label. Confirm separate body and head construction and use the supplied product-specific care guidance." },
      { title: "Compare dimensions with weight", body: "Use complete measurements and actual listed weight rather than height or photos alone when planning handling and storage." },
      { title: "Separate included and optional", body: "Review the included head, appearance, accessories and supported choices for the exact ordering path before comparing the configured total." }
    ],
    comparisonRows: [
      ["Construction", "One brand name does not establish a single material or head and body pairing.", "Check both material specifications and the exact product's supplied care instructions."],
      ["Proportions", "Similar heights can have different dimensions, weights and handling needs.", "Compare the full measurement table and listed weight alongside the gallery."],
      ["Ordering path", "A fixed warehouse build may differ from a custom-made configuration.", "Match included features, supported options, configured price and current ordering details before checkout."]
    ],
    faqs: [
      { question: "Are all current YL listings TPE?", answer: "No. Current YL listings include TPE and silicone material labels. Confirm body and head construction separately on the exact product." },
      { question: "Are YL dolls at the same height equivalent builds?", answer: "No. Compare the full measurements, actual listed weight, exact head and body pairing and supported choices rather than height alone." },
      { question: "Are photographed outfits and accessories included?", answer: "Only what the product listing or confirmed configuration identifies as included. Photographs alone do not establish every accessory or styling choice." },
      { question: "Can I apply custom-made options to a YL warehouse listing?", answer: "Do not assume so. Check the stocked unit's fixed configuration and the supported choices for its exact ordering path rather than transferring another listing's configurator." }
    ]
  },
  hr: {
    metaTitle: "HR Dolls | Compare Body & Head Construction",
    metaDescription: "Compare current HR Dolls by separate body and head materials, measurements, listed weight, included features, supported choices and ordering path.",
    positioning: "Compare each HR build's separate body and head construction rather than treating one material label as the complete specification.",
    intro: "Compare current HR Dolls across TPE, silicone and silicone-head material labels, checking the body and head construction separately on the exact listing. A silicone head does not by itself establish a full-silicone body or identical care requirements. Use complete measurements, listed weight, the gallery and included features to compare builds. Check the supported choices and any fixed warehouse configuration separately from custom-made options before comparing the configured total and ordering path.",
    buyerNotes: [
      { title: "Read both material specifications", body: "A head material label is not a complete body specification. Check the body, head and exact product's supplied care guidance together." },
      { title: "Confirm usable handling data", body: "Compare full dimensions and actual listed weight. Ask for missing weight rather than estimating from height or photographs." },
      { title: "Separate included and optional", body: "Confirm the included head, body and appearance before adding supported choices. A fixed warehouse build does not automatically offer custom-made options." }
    ],
    comparisonRows: [
      ["Body and head", "One material label may not describe both parts of the build.", "Check the exact body and head specification and use its supplied care guidance."],
      ["Handling", "Similar heights or photographs do not establish the same weight or storage needs.", "Compare complete dimensions and usable listed weight, confirming missing details before ordering."],
      ["Included build", "Photographed styling and another model's options do not establish what is included here.", "Review the exact configuration, supported choices, total and ordering path together."]
    ],
    faqs: [
      { question: "Are all HR Dolls made from the same material?", answer: "No. Current listings include TPE, silicone and silicone-head labels. Check the exact body and head materials separately rather than treating one label as the entire construction." },
      { question: "Does a silicone head mean the body is full silicone?", answer: "No. A head material label alone does not establish the body material. Read both specifications and the care instructions for the exact product." },
      { question: "What if a usable weight is missing?", answer: "Ask for the exact build's weight before planning lifting, cleaning and storage. Missing or zero weight is not a lightweight claim." },
      { question: "Are all photographed features and options included?", answer: "Only what the listing or confirmed build identifies as included. Check supported choices for the exact product and do not assume photographed clothing or props are supplied." },
      { question: "Can I customize every HR warehouse listing?", answer: "Do not assume so. A warehouse listing describes its fixed build; custom-made options apply only where supported by that exact ordering path." }
    ]
  },
  jarliet: {
    metaTitle: "Jarliet Dolls | Compare Materials & Proportions",
    metaDescription: "Compare current Jarliet dolls by exact head and body materials, proportions, full measurements, listed weight, included build and supported choices.",
    positioning: "Compare Jarliet head and body pairings using material details and complete proportions, not just height or a reference photograph.",
    intro: "Compare current Jarliet listings with TPE, silicone and silicone-head material labels by the exact head and body pairing. A similar height does not establish matching bust, waist and hip proportions, weight or construction. Use the complete measurements and gallery together, then confirm the included hair, appearance and accessories separately from supported choices. Check material-specific care, configured price and ordering path rather than transferring another model's build or options to your selection.",
    buyerNotes: [
      { title: "Compare complete proportions", body: "Use bust, waist and hip measurements with height and listed weight. Similar heights do not establish the same body shape or handling needs." },
      { title: "Check each material", body: "Read the body and head specifications separately. A silicone-head label alone does not establish a full-silicone body or universal care instructions." },
      { title: "Confirm the photographed build", body: "Match the head, body, hair and included appearance to the listing; accessories and other models' supported options are not automatically included." }
    ],
    comparisonRows: [
      ["Proportions", "Similar heights can represent different bust, waist and hip measurements.", "Compare the complete measurement table, gallery and actual listed weight together."],
      ["Material pairing", "A head-only material label does not establish the full body's construction.", "Check body and head materials and use the supplied product-specific care guidance."],
      ["Included appearance", "A reference gallery does not establish every accessory or alternative styling choice.", "Review included features, supported choices, configured price and ordering path before ordering."]
    ],
    faqs: [
      { question: "Are Jarliet dolls at the same height the same shape?", answer: "No. Compare bust, waist and hip measurements, the exact head and body pairing, listed weight and complete gallery rather than height alone." },
      { question: "Are all Jarliet dolls one material?", answer: "No. Current listings include TPE, silicone and silicone-head material labels. Confirm body and head materials separately on the exact product." },
      { question: "Does a silicone-head listing guarantee a full-silicone body?", answer: "No. That label alone describes a head material, not the complete body's construction. Check the exact specification and supplied care guidance." },
      { question: "Does the gallery show the included wig and accessories?", answer: "Check what the product or confirmed configuration explicitly includes. A reference photograph does not establish every wig, outfit, prop or alternative appearance choice." },
      { question: "Can another Jarliet model's options be used on my selection?", answer: "Only where supported for the exact body, head, material and ordering path. Do not assume the same custom choices or compatibility across the brand." }
    ]
  },
  "ai-tech": {
    metaTitle: "Ai-Tech Dolls | Compare Builds & Supported Features",
    metaDescription: "Compare current Ai-Tech dolls by exact head and body, material, dimensions, listed weight, included hardware, supported options and ordering path.",
    positioning: "Compare the included Ai-Tech build separately from any supported interactive hardware or optional features.",
    intro: "Compare current Ai-Tech listings by the exact head and body pairing, construction, complete measurements, listed weight, included features and ordering path. The brand name alone does not establish that every model includes interactive hardware or the same functions. Check what your chosen listing includes, what costs extra and any compatibility or setup requirements. Compare the finished build and configured total rather than assuming another Ai-Tech model has identical features.",
    buyerNotes: [
      { title: "Separate the doll from interactive features", body: "Confirm any hardware, function, setup or additional service against the exact listing. A brand label is not an included-feature specification." },
      { title: "Confirm handling information", body: "Use the exact listed weight and complete dimensions. Ask for a missing weight rather than estimating it from height or photographs." },
      { title: "Check the included build", body: "Keep the head and body pairing, materials, options, current price and ordering path together." }
    ],
    comparisonRows: [
      ["Included hardware", "A brand name does not establish which interactive functions or hardware are supplied.", "Check the exact listing's included features, required setup and any optional service before ordering."],
      ["Handling", "Height and photographs do not establish the finished weight or storage needs.", "Compare the complete dimensions and actual listed weight, asking for missing information rather than estimating."],
      ["Final build", "Different heads, bodies, materials and options can produce different configurations and totals.", "Keep the included build, supported choices, configured price and ordering path together."]
    ],
    faqs: [
      { question: "Does every Ai-Tech doll include the same interactive features?", answer: "Do not assume so. Confirm the exact product's included hardware and functions, any required setup or service, and what is optional before ordering." },
      { question: "Are Ai-Tech listings all one material?", answer: "Current listings include different material labels. Check body and head materials separately because the brand name does not establish one construction for every product." },
      { question: "Can I estimate weight from the photos?", answer: "No. Height and appearance do not establish the finished weight. Use the exact recorded weight or ask for confirmation if it is missing." },
      { question: "Can the same options be selected on every Ai-Tech model?", answer: "No. Check the exact head, body, material, supported choices and compatibility requirements rather than transferring another model's option list." },
      { question: "What should I compare before checkout?", answer: "The complete build, included features, supported options, configured price, current availability and ordering path." }
    ]
  },
  avant: {
    metaTitle: "Avant Doll Models | Compare Silicone Builds & Dimensions",
    metaDescription: "Compare current Avant listings by silicone construction, exact head and body, full dimensions, confirmed weight, supported options and ordering path.",
    positioning: "Compare each Avant build using confirmed dimensions and weight rather than treating a similar height as the same handling requirement.",
    intro: "Compare current Avant listings by the exact head and body pairing, silicone construction, full dimensions, included features, price and ordering path. A similar height or photograph does not establish the same weight or handling needs. Where a usable weight is not listed, ask for the finished build's weight before planning lifting, cleaning or storage. Verify the included appearance and supported choices for the exact product rather than treating the brand as one standard configuration.",
    buyerNotes: [
      { title: "Confirm missing weight first", body: "Do not interpret a missing or zero weight as a lightweight build. Get the actual finished weight before deciding how it will be moved and stored." },
      { title: "Compare the complete construction", body: "Check head and body pairing, dimensions and material details, not just the face photograph or brand name." },
      { title: "Check what the price includes", body: "Separate the listed build and supported extras, then compare the configured total and ordering path." }
    ],
    comparisonRows: [
      ["Confirmed weight", "Missing or zero values do not establish a lightweight product or easy handling.", "Ask for the exact finished weight before planning lifting, cleaning and storage."],
      ["Construction", "Similar photographs or height labels can hide different head and body pairings.", "Compare the full dimensions, materials and included build on the exact listing."],
      ["Included configuration", "A photograph may show styling or accessories beyond the listed build.", "Review included features, supported choices, current price and ordering path together."]
    ],
    faqs: [
      { question: "Are Avant dolls all the same weight?", answer: "No. Use the weight for the exact product and configuration. If it is missing or unusable, ask for confirmation rather than estimating from height or appearance." },
      { question: "Does a missing weight mean the doll is lightweight?", answer: "No. Missing data does not establish a low weight or easy handling." },
      { question: "What construction can I compare here?", answer: "The current collection is cataloged with silicone material labels. Confirm the exact head and body construction and supplied care instructions on the product you choose." },
      { question: "Are photographed accessories and options included?", answer: "Only what the listing or confirmed configuration identifies as included. A product photograph alone does not establish every accessory or supported choice." },
      { question: "What should I confirm for storage?", answer: "The finished build's weight, complete dimensions, suitable support and manufacturer storage guidance, along with the route used to move it." }
    ]
  },
  funwest: {
    metaTitle: "FunWest Dolls | Compare Materials & Product Forms",
    metaDescription: "Compare current FunWest full dolls and torsos by head and body construction, measurements, listed weight, included features, options and ordering path.",
    positioning: "Compare FunWest complete dolls and torso products by their exact form, construction and included build.",
    intro: "Compare current FunWest listings across complete dolls and torso products, with TPE and silicone material labels in the current collection. Start with the included body areas and exact head and body construction so that different product forms are not mistaken for equivalent builds. Compare full dimensions, listed weight, included appearance, supported options, configured price and ordering path. A similar name, photograph or brand label does not guarantee identical construction or customization.",
    buyerNotes: [
      { title: "Start with the included form", body: "Compare complete dolls and torsos separately, checking which body areas and any head are included." },
      { title: "Match construction and care", body: "Check body and head materials and the exact product's care instructions rather than relying on one brand-wide rule." },
      { title: "Review the final build", body: "Confirm photographed versus included features, supported options and any fixed warehouse configuration before comparing totals." }
    ],
    comparisonRows: [
      ["Product form", "A torso and a complete doll can have different included body areas and dimensions.", "Check the exact form and included head before comparing price or handling needs."],
      ["Materials", "TPE and silicone labels do not establish every head and body detail or care requirement.", "Use the exact product specification and supplied care guidance."],
      ["Configuration", "A similar name or gallery does not establish identical included features or supported extras.", "Review the listing's build, choices, configured total and ordering path together."]
    ],
    faqs: [
      { question: "Does this collection contain only complete dolls?", answer: "No. Current FunWest listings include complete dolls and torso products. Confirm the included body areas and head before comparing price or dimensions." },
      { question: "Are all FunWest products one material?", answer: "No. The current collection includes TPE and silicone material labels. Read the exact head and body specification and supplied care instructions." },
      { question: "Does the photograph show everything included?", answer: "Not necessarily. Check the listing's included configuration and accessories rather than assuming photographed clothing or props are supplied." },
      { question: "Can every FunWest listing use the same options?", answer: "No. Supported choices depend on the exact body, head, construction and ordering path. Do not transfer a custom-made option list to a fixed warehouse build." },
      { question: "What should I compare besides price?", answer: "Product form, complete dimensions, listed weight, materials, included build, supported choices, availability and the configured total." }
    ]
  },
  "il-doll": {
    metaTitle: "IL Doll Models | Compare Builds, Sizes & Options",
    metaDescription: "Compare current IL Doll models by exact head and body pairing, material, measurements, listed weight, price, availability, and supported options.",
    positioning: "Compare each IL Doll listing as its own build rather than assuming the same features or options across the brand.",
    intro: "Compare current IL Doll listings by exact head and body pairing, material, full measurements, listed weight, current price, ordering path and supported options. Check the included build and product-specific choices together; a feature shown on another model does not establish availability on the one you choose. Where a measurement, material detail, option or timing requirement matters to your decision, confirm it for that exact listing before ordering.",
    buyerNotes: [
      { title: "Compare the complete pairing", body: "Use the exact head, body, material, measurements and listed weight rather than treating similar product names or photographs as identical builds." },
      { title: "Separate included features from choices", body: "A feature shown on another IL Doll model is not proof that it is included or supported here. Review the current listing's build and option details together." },
      { title: "Confirm the ordering path", body: "Check current availability and any fixed warehouse configuration separately from custom-made choices, and confirm important timing details before ordering." }
    ],
    comparisonRows: [
      ["Exact model", "Head and body pairings, dimensions and materials can differ between listings.", "Keep the complete gallery, product specification and listed weight together when comparing current models."],
      ["Configuration", "Included features and supported options are specific to the exact build, not guaranteed by the brand name.", "Review the product's choices and price effects, and confirm any unclear compatibility requirement."],
      ["Availability", "A catalog listing does not establish immediate physical stock or a guaranteed delivery date.", "Check the ordering path, included build and current timing for the exact product before ordering."]
    ],
    faqs: [
      { question: "How should I compare IL Doll models?", answer: "Compare the exact head and body pairing, construction, complete measurements, listed weight, current price, availability and supported choices. Similar names or photographs are not proof of the same build." },
      { question: "Do all IL Doll models include the same upgrades?", answer: "Do not assume so. Included features, choices, compatibility and price changes depend on the exact product. A feature on another listing does not establish that it is included or available on yours." },
      { question: "Can I infer a missing measurement from a similar model?", answer: "No. Ask for confirmation of a decision-critical missing dimension or weight for the exact head and body build rather than substituting another model's figures." },
      { question: "Does an IL Doll listing mean it is ready to ship?", answer: "No. Check the current ordering path and any warehouse region or fixed configuration separately from custom-made choices. Confirm stock and important timing details before ordering." }
    ]
  },
  lusandy: {
    metaTitle: "Lusandy Dolls: Silicone Models, Sizes & Options",
    metaDescription: "Shop Lusandy silicone dolls at DollWow. Compare full dolls and torsos by size, listed weight, head, supported custom options and ready-to-ship availability.",
    positioning: "Lusandy's silicone range combines different body shapes and heads with model-specific appearance and construction choices.",
    intro: "Explore Lusandy silicone dolls at DollWow, from full dolls to torso models. Compare the exact body and head, height, listed weight and gallery before choosing your look. Lusandy offers features such as weight reduction, skin texture and realistic makeup, but the features included with your order depend on the model and selected configuration. For ready-to-ship listings, check the warehouse region and fixed build separately from custom-made options.",
    buyerNotes: [
      { title: "Compare the exact body", body: "Use the body measurements and listed weight, not the model name or photos alone. Similar names can appear on different bodies, and weight-reduction claims do not establish the finished weight of every model." },
      { title: "Match the head and features", body: "Compare the head, skin tone, hair and supported appearance choices together. Check your product's included features and option prices; a feature shown elsewhere in Lusandy's range is not automatically included." },
      { title: "Choose how it ships", body: "Custom-made listings offer the selections shown in their configurator. Ready-to-ship listings describe a fixed configuration and warehouse region. Keep those details separate when comparing price and availability." }
    ],
    comparisonRows: [
      ["Body and handling", "Compare full doll or torso construction, dimensions and the exact model's listed weight.", "Use the product measurements and filters to narrow the current collection."],
      ["Head and finish", "Check the head, skin tone, hair, makeup and any supported functions as one configuration.", "Each product page shows its own photos, included features and available choices."],
      ["Price and availability", "Distinguish a custom-made build from a fixed ready-to-ship listing and its warehouse region.", "Compare the current product price and selected options without assuming every photographed accessory is included."]
    ],
    faqs: [
      { question: "What kinds of Lusandy dolls can I compare here?", answer: "This collection brings together Lusandy silicone listings, including full dolls and torso models. Use the current product grid to compare the available bodies, heads, measurements, prices and ordering options." },
      { question: "Does every Lusandy model have the same weight reduction?", answer: "Do not assume a single weight or reduction applies across the range. Use the listed weight for the exact body and configuration; a factory weight-reduction example is not a handling-weight guarantee for another model." },
      { question: "Are Lusandy's photographed features and accessories all included?", answer: "Only the features and accessories identified as included on your chosen listing or configuration form part of that order. Check the head, finish, hair and supported options separately from the photographed clothing and props." },
      { question: "Can I customize a ready-to-ship Lusandy doll?", answer: "Ready-to-ship listings describe a fixed build in the stated warehouse region. Custom-made listings offer the supported choices shown on their product pages. Do not assume the custom-made configurator applies to a stocked unit." }
    ]
  },
  md: {
    metaTitle: "MD Doll: Silicone Dolls, Included Features & Options",
    metaDescription: "Shop MD Doll silicone models from 161 to 168 cm. Compare body shapes, heads, included EVO skeleton and body makeup, plus model-specific custom options.",
    positioning: "MD Doll combines silicone bodies, an included EVO skeleton and body makeup with a choice of heads and optional finishes.",
    intro: "Explore MD Doll silicone dolls, also known as MDDOLL, in a collection spanning 161 to 168 cm with different body shapes and head designs. The factory's standard full-doll package includes an EVO skeleton, hard hands, articulated or wire fingers, hard standing feet, body makeup and jelly breasts. Compare the face, proportions and listed weight, then choose the appearance and additional features available for your model.",
    buyerNotes: [
      {title: "Start with the included build", body: "Body makeup, the EVO skeleton, hard hands, standing feet and jelly breasts are standard features, not separate paid upgrades. Finger construction follows the model; eyebrows are drawn or implanted, and ROS is included on heads that support it."},
      {title: "Choose your finish and functions", body: "MD offers options such as implanted hair, mechanical closable eyelids, bionic skin and heating. Availability depends on the body and head. Real skin texture is included on the 161 cm body, while the 162 cm and 166B, 166C and 166D bodies list it as optional."},
      {title: "Find the right proportions", body: "Compare height, bust, waist and hips alongside the head and gallery. Use the listed weight to plan handling; where it is simply labeled Weight, confirm what it includes before comparing it with body-only or shipping figures."}
    ],
    comparisonRows: [
      ["Included construction", "EVO skeleton, hard hands, articulated or wire fingers, standing feet, body makeup and jelly breasts.", "Start with the standard build, then review any additional choices on your product."],
      ["Skin and finish", "Compare body makeup, real skin texture and optional bionic skin as distinct features.", "Check which finish is included for your body and which selections change the total."],
      ["Head and appearance", "Choose the face, eyebrow finish and available hair or eyelid options.", "Match your chosen head to its supported functions; ROS is included where the head supports it."]
    ],
    faqs: [
      {question: "Are MD Doll and MDDOLL the same brand?", answer: "Yes. MD Doll and MDDOLL are names used for the same manufacturer. This collection brings its silicone models together for comparison by body, head, measurements and available options."},
      {question: "What comes included with an MD full doll?", answer: "The factory lists hard hands, articulated or wire fingers, hard standing feet, body makeup, an EVO skeleton and jelly breasts as standard. Eyebrows are drawn or implanted, and ROS is included if the selected head supports it."},
      {question: "Is real skin texture included on every MD doll?", answer: "No. The factory lists real skin texture as included on the 161 cm body and optional on the 162 cm and 166B, 166C and 166D bodies. Body makeup is part of the standard package; real skin texture and bionic skin are separate features. Check the inclusions for your chosen body."},
      {question: "Which MD features can I customize?", answer: "Depending on the body and head, available options can include implanted synthetic or real hair, mechanical closable eyelids, bionic skin, heating and other functions. Choose from the options on your product page and review the final total."},
      {question: "How do I compare MD bodies at the same height?", answer: "Compare the body version and complete bust, waist and hip measurements. The collection includes different proportions at similar heights, so use the measurement table and gallery together."},
      {question: "Which MD weight should I use for handling?", answer: "Use the weight for your exact model. If the listing says only Weight, ask what that figure includes; body-only, complete-doll and packed shipping weights are different measurements."}
    ]
  },
  ido: {
    metaTitle: "IDO Dolls: Silicone Bodies & Included Factory Features",
    metaDescription: "Shop IDO silicone dolls with included skin texture, body makeup, weight reduction 4.0 and EVO skeleton. Compare body shapes, ID-series heads and appearance.",
    positioning: "IDO brings skin texture, capillary body makeup, weight reduction 4.0 and softness features together in its standard silicone build.",
    intro: "Explore IDO silicone dolls with a factory-included feature package: realistic skin texture and capillary body makeup, weight reduction 4.0, super softness, gel breasts and buttocks, and an EVO skeleton. Implanted eyebrows and eyelashes, handmade eyes and a wig are included too. Choose your body shape, then compare the ID-series code and face, skin tone and available wig choices to find your preferred look.",
    buyerNotes: [
      {title: "Features included from the start", body: "IDO's factory package includes articulated fingers, hard hands with bionic finger bones, wired toes and hard standing feet without bolts, alongside its texture, makeup, softness and weight-reduction features. These standard features carry no separate option charge."},
      {title: "Choose the body and face", body: "Compare height, bust, waist and hips with the head gallery. Select from the head, skin tone and wig choices offered for your model. ROS is standard on supported heads; ID1H does not have ROS."},
      {title: "Plan for handling", body: "Weight reduction 4.0 is included, but the finished weight still varies by body. Use the listed weight for your chosen model and keep any before-reduction or packed shipping figure separate."}
    ],
    comparisonRows: [
      ["Skin and softness", "Realistic skin texture, capillary body makeup, super softness, gel breasts and gel buttocks are included.", "Compare the finished appearance and body proportions without adding these standard features as paid upgrades."],
      ["Structure and handling", "EVO skeleton, weight reduction 4.0, articulated fingers, hard hands, wired toes and bolt-free standing feet are included.", "Read the exact body measurements and listed weight when planning space and handling."],
      ["Face and styling", "Implanted brows and lashes, handmade eyes and a wig are part of the standard package.", "Choose from the supported head and appearance options; ID1H has no ROS."]
    ],
    faqs: [
      {question: "What is included with an IDO silicone doll?", answer: "The factory package includes skin texture and capillary body makeup, weight reduction 4.0, super softness, gel breasts and buttocks, an EVO skeleton, articulated fingers, hard hands, wired toes and hard standing feet without bolts. Implanted eyebrows and eyelashes, handmade eyes and a wig are also included."},
      {question: "Does every IDO head include ROS?", answer: "ROS is a standard feature on supported IDO heads. The factory specifically identifies ID1H as a head without ROS, so keep the complete head code when choosing your face."},
      {question: "Which IDO weight should I compare?", answer: "Use the listed weight for your exact body and configuration. Weight reduction 4.0 is already included; before-reduction and packed shipping figures are separate measurements, not the finished doll's handling weight."},
      {question: "Do IDO's standard features cost extra?", answer: "No. The factory lists its standard feature package as included with no separate option charge. Head, skin tone and available wig choices personalize the look; they do not turn the included construction features into paid upgrades."},
      {question: "How do I choose an IDO body and head?", answer: "Start with the height and bust, waist and hip measurements that suit your preferences and space. Then compare ID-series heads and the available skin tone and wig choices. The same face can be paired with different body proportions."},
      {question: "Are photographed outfits included with an IDO doll?", answer: "A wig is part of the factory package. Other photographed outfits, jewelry and scene props are included only when the product or a current offer explicitly lists them."}
    ]
  },
  moonvale: {
    metaTitle: "Moonvale Dolls: Silicone Fantasy Models",
    metaDescription: "Compare Moonvale Lyora, Sorelle, Velara and Cerina silicone dolls by height, character styling, current price and product-specific options.",
    positioning: "Moonvale's DollWow collection features silicone fantasy dolls with leopard, fox, panther and deer-inspired styling.",
    intro: "Moonvale's DollWow collection features silicone fantasy dolls: Lyora, Sorelle, Velara and Cerina. Compare the exact character styling and listed measurements, then open the individual product for its photos, current price and available choices. Different looks can share a model name; the pictured styling does not by itself confirm which accessories are included.",
    buyerNotes: [
      { title: "Match the exact look", body: "Compare the full product title and gallery, not only Lyora, Sorelle, Velara or Cerina. Listings within a model family can show different colors and styling." },
      { title: "Confirm handling weight", body: "Height is not a weight estimate. If the product has no listed weight, ask our team to confirm the exact build's weight before ordering." },
      { title: "Separate styling from inclusions", body: "Check which head, finish, hair, clothing and accessories are included in your chosen configuration. Only use options offered for that exact product." }
    ],
    comparisonRows: [
      ["Character and styling", "Compare the named look as well as the model family: Lyora, Sorelle, Velara or Cerina.", "Keep the exact product page and its gallery as your reference when discussing a build."],
      ["Size and handling", "Read the listed height and body measurements; confirm weight separately when it is missing.", "Our team can check decision-critical specifications before you commit to an order."],
      ["Configuration and price", "Distinguish the photographed presentation from included items and selectable upgrades.", "Review the available choices and current total on the individual product page."]
    ],
    faqs: [
      { question: "Which Moonvale models does DollWow carry?", answer: "The current collection includes Lyora, Sorelle, Velara and Cerina. Open the individual listings to compare the available looks, measurements, prices and ordering details." },
      { question: "Why do some Moonvale listings share the same model name?", answer: "A model family can have several named looks or color presentations. Compare the complete product title, photos and selected configuration rather than assuming that shared names mean identical orders." },
      { question: "Does a Moonvale doll's height tell me its weight?", answer: "No. Height and weight are different measurements. Where weight is not listed, ask our team to confirm it for the exact build rather than estimating from a similar doll." },
      { question: "Are all photographed accessories included?", answer: "Do not assume so. Confirm the included hair, clothing, accessories and finish against the exact listing and your final configuration before ordering." }
    ]
  },
  wm: {
    positioning:
      "WM Doll traces its manufacturing history to 2010 and is known for a broad choice of TPE and silicone bodies, heads, sizes, and customization paths.",
    intro:
      "Compare current WM Dolls on DollWow by TPE or silicone construction, body and head pairing, measurements, listed weight, price, and supported options. WM traces its manufacturing history to 2010 and offers female and male models across a wide size range. DollWow is an approved WM seller and reviews complex custom builds before production.",
    metaTitle: "WM Dolls: TPE & Silicone Sex Dolls",
    metaDescription:
      "Shop approved WM Dolls by TPE or silicone material, body, head, size, weight, price, availability, and supported custom options.",
    guideHref: "/learn/wm-dolls-buying-guide",
    guideLabel: "WM Dolls buying guide",
    buyerNotes: [
      {
        title: "Set a handling limit",
        body: "WM models can differ sharply in weight even at similar heights. Compare pounds and kilograms before choosing a face or options."
      },
      {
        title: "Pair the exact body and head",
        body: "Confirm body, head, neck connection, material, skin tone, hair, eyes, and supported options as one build."
      },
      {
        title: "Keep the authenticity record",
        body: "DollWow is an approved WM seller. Retain the final build details and the manufacturer's anti-counterfeiting code or supplied documentation."
      }
    ],
    comparisonRows: [
      [
        "TPE or silicone",
        "Compare the exact body and head materials by feel, finish, listed weight, care needs, repair path, and price.",
        "DollWow keeps the confirmed construction and current choices tied to the exact WM product."
      ],
      [
        "Body and head pairing",
        "Check the body number, head number, neck fitting, skin tone, measurements, and supported appearance or powered options as one build.",
        "Our Human Build Check reviews supported selections before an eligible custom order enters production."
      ],
      [
        "Authenticity and ownership",
        "Keep the order record, final build details, supplied anti-counterfeiting code, care instructions, and arrival evidence together.",
        "DollWow is an approved WM seller and includes Care 365 with every DollWow doll."
      ]
    ],
    faqs: [
      {
        question: "When was WM Doll founded?",
        answer: "WM traces its manufacturing history to 2010. The company is based in Zhongshan, Guangdong, China."
      },
      {
        question: "Does WM make TPE and silicone dolls?",
        answer: "Yes. Current WM and DollWow catalogs include TPE and full-silicone products. Material, body, head, and option compatibility should be checked on the exact listing."
      },
      {
        question: "How can I check whether a WM doll is genuine?",
        answer: "Buy through an approved seller, retain the final build record, and keep the manufacturer's anti-counterfeiting code or supplied documentation."
      },
      {
        question: "Does WM make male dolls?",
        answer: "Yes. DollWow carries current WM male models. Compare anatomy, proportions, height, weight, material, skeleton, and storage needs before choosing."
      }
    ]
  },
  angelkiss: {
    positioning:
      "Angelkiss is a silicone-focused doll brand with full-silicone and silicone-head construction paths, varied body proportions, and model-specific customization choices.",
    intro:
      "Compare current Angelkiss dolls on DollWow by full-silicone or silicone-head construction, exact body and head pairing, height, listed weight, proportions, price, and supported options. Angel Kiss is also written as two words in some searches, but both names refer to the same brand hub here. Start with the body construction and handling needs, then confirm the appearance and build choices supported by the exact product. DollWow reviews complex custom orders before production and can help locate an approved Angelkiss model that is not yet listed.",
    metaDescription:
      "Shop Angelkiss and Angel Kiss dolls by silicone construction, body, head, height, weight, price, availability, and supported custom options.",
    buyerNotes: [
      {
        title: "Check body and head construction",
        body: "A silicone head does not automatically mean a full-silicone body. Confirm both materials, their care needs, the connector, and the final pairing."
      },
      {
        title: "Compare the finished weight",
        body: "Similar heights can have different listed weights and proportions. Check pounds and kilograms, the delivery route, cleaning space, and storage before choosing."
      },
      {
        title: "Confirm every selected option",
        body: "Skin tone, head, hair, eyes, skeleton, feet, softness, and other choices can be model-specific. DollWow can verify the supported combination before production."
      }
    ],
    comparisonRows: [
      [
        "Construction",
        "Separate full-silicone bodies from products that use a silicone head on another supported body construction.",
        "DollWow keeps body material, head material, measurements, and current choices tied to the exact product."
      ],
      [
        "Body and head pairing",
        "Compare the exact face, body, connector, skin tone, proportions, and supported appearance options as one build.",
        "Our Human Build Check reviews supported custom selections before an eligible order enters production."
      ],
      [
        "Handling and ownership",
        "Read height and listed weight together, then plan delivery access, lifting, cleaning, drying, and storage.",
        "Ask our team to confirm a missing decision-critical detail before checkout."
      ]
    ],
    faqs: [
      {
        question: "Is Angel Kiss the same brand as Angelkiss?",
        answer: "Yes. Buyers and sellers use both spellings for the brand. DollWow keeps current products under the canonical Angelkiss Dolls hub."
      },
      {
        question: "Are Angelkiss dolls made from silicone?",
        answer: "The current DollWow Angelkiss range is silicone-focused and includes full-silicone products plus products listed with a silicone head. Confirm the body and head materials separately on the exact product."
      },
      {
        question: "Does a silicone head mean the entire Angelkiss doll is silicone?",
        answer: "No. A silicone-head label describes the head, not automatically the body. Check the body material, head material, connector, finish match, care needs, and price before ordering."
      },
      {
        question: "Can every Angelkiss head and option fit every body?",
        answer: "Do not assume so. Body size, neck fitting, connector, material, skin tone, hair, skeleton, feet, softness, and other choices can follow product-specific compatibility rules."
      },
      {
        question: "How should I compare Angelkiss doll sizes?",
        answer: "Compare height, listed weight, bust, waist, hips, shoulders where available, delivery access, cleaning space, and storage. Height or cup size alone does not describe handling."
      },
      {
        question: "Can DollWow add an Angelkiss model that is missing?",
        answer: "Yes. Send the product name or official link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  },
  "top-fire": {
    // Keywords (DataForSEO, US, 2026-10-15): "top fire doll" / "top fire dolls" / "topfire doll" 320/mo each, "topfiredoll" 40/mo.
    metaTitle: "Top Fire Dolls: Silicone Sex Dolls, Heads & In-Stock Bodies",
    metaDescription:
      "Shop Top Fire Doll (TopFire) silicone dolls at DollWow, an authorized retailer: 155-176 cm custom builds, US, Canada and EU warehouse stock, heads and bodies.",
    positioning:
      "Top Fire Doll (also written TopFire or topfiredoll) makes full-silicone female and male dolls with ROS heads and optional oral, AI and motorised functions.",
    intro:
      "Top Fire Dolls on DollWow: full-silicone female dolls from 155 to 176 cm and male dolls at 173 cm, built to order with Top Fire's own head, skin, wig, eye and function options. In-stock Top Fire dolls ship from US, Canada and EU warehouses, alongside loose Top Fire heads and headless bodies with auto blowjob or hip swing functions. DollWow is an authorized Top Fire Doll retailer; the certificate is shown on this page.",
    buyerNotes: [
      {
        title: "Custom build or warehouse stock",
        body: "Custom Top Fire dolls are made to order (estimated 3 weeks) with your choice of head and options. Warehouse dolls ship in about 3 business days in the fixed configuration shown."
      },
      {
        title: "Pick the functions you need",
        body: "Heads can add auto licking, oral suction, oral heating and an AI voice chat unit. Bodies can add auto blowjob or hip swing and rotation. Each product page lists exactly what is fitted."
      },
      {
        title: "Plan for silicone weight",
        body: "Full-silicone bodies listed at 27 to 38 kg (59.5 to 83.8 lbs) depending on height. Check the listed weight in kilograms and pounds before ordering."
      }
    ],
    faqs: [
      {
        question: "Is DollWow an authorized Top Fire Doll retailer?",
        answer: "Yes. DollWow is authorized by Top Fire Doll, and the authorization certificate is displayed on this page."
      },
      {
        question: "Are Top Fire dolls TPE or silicone?",
        answer: "The Top Fire dolls sold on DollWow are full silicone, including the heads."
      },
      {
        question: "What sizes do Top Fire dolls come in?",
        answer: "Female Top Fire bodies on DollWow range from 155 cm to 176 cm with B-Cup to I-Cup busts. Male Top Fire dolls are 173 cm."
      },
      {
        question: "Can I buy a Top Fire doll in stock?",
        answer: "Yes. Selected Top Fire dolls, heads and headless bodies are stocked in US, Canadian and EU warehouses with an estimated 3-business-day delivery."
      },
      {
        question: "What functions can a Top Fire doll have?",
        answer: "Depending on the model: auto licking, oral suction and oral heating heads, an AI voice chat unit, auto blowjob and hip swing and rotation bodies, body heating, breathing and touch sensors."
      }
    ]
  },
  irontech: {
    positioning:
      "Irontech has produced dolls since 2015 and is known for a broad choice of full-silicone, TPE, hybrid, female, and male models, including advanced head and skeleton options on supported builds.",
    intro:
      "Compare current Irontech Dolls on DollWow by material, body size, listed weight, head system, price, availability, and supported options. Irontech has produced dolls since 2015 and offers full-silicone, TPE, hybrid, female, and male models. Because compatibility varies by body and head, DollWow reviews complex custom builds before production.",
    metaTitle: "Irontech Dolls: Silicone, TPE & Hybrid",
    metaDescription:
      "Shop Irontech dolls by silicone, TPE or hybrid build, body, head system, size, weight, price, availability, and supported options.",
    guideHref: "/learn/irontech-dolls-buying-guide",
    guideLabel: "Irontech Dolls buying guide",
    buyerNotes: [
      {
        title: "Choose a construction path",
        body: "Start with full silicone, TPE, or hybrid construction. Each path changes feel, care, finish, weight, and compatible options."
      },
      {
        title: "Match the body and head",
        body: "Hard, soft, ROS, ROS MAX, and TPE heads follow different compatibility rules. Confirm the exact body and head pairing before choosing hair, eyes, or functions."
      },
      {
        title: "Plan for real handling weight",
        body: "Compare pounds and kilograms, the delivery route, storage, and any weight added by selected options before approving the build."
      }
    ],
    comparisonRows: [
      [
        "Construction",
        "Compare full silicone, TPE, and hybrid builds by body and head material, feel, finish, listed weight, care, and price.",
        "DollWow keeps construction, measurements, photographs, and current choices tied to the exact Irontech product."
      ],
      [
        "Head and body system",
        "Confirm the exact body, standard or supported ROS-style head, connector, hair, eyes, mouth details, and compatible functions.",
        "Our Human Build Check reviews supported selections before an eligible custom order enters production."
      ],
      [
        "Handling and support",
        "Use the finished weight, delivery route, storage plan, arrival evidence, care instructions, and repair path to judge ownership fit.",
        "DollWow can confirm a missing decision-critical detail before checkout and includes Care 365 with every DollWow doll."
      ]
    ],
    faqs: [
      {
        question: "When was Irontech Doll founded?",
        answer: "Irontech's official company history dates the brand to 2015. The manufacturer is based in Zhongshan, Guangdong, China."
      },
      {
        question: "Does Irontech make TPE and silicone dolls?",
        answer: "Yes. Current Irontech and DollWow catalogs include TPE, full-silicone, and hybrid models. Material and option compatibility should be checked on the exact product."
      },
      {
        question: "Can every Irontech doll use the same head and custom options?",
        answer: "No. Head systems, hair, eyes, skeletons, feet, softness, and powered features can depend on the selected body, head, and material. DollWow reviews supported custom builds before production."
      },
      {
        question: "Does Irontech make male dolls?",
        answer: "Yes. DollWow carries current Irontech male models. Compare anatomy, proportions, height, weight, material, skeleton, and storage requirements before choosing."
      }
    ]
  },
  starpery: {
    positioning:
      "Starpery is known for silicone-focused construction, detailed head systems, realistic surface presentation, and ongoing weight-reduction development on supported bodies.",
    intro:
      "Compare current Starpery dolls on DollWow by full-silicone or silicone-head construction, body and head pairing, height, listed weight, finish, skeleton, price, and supported options. Starpery is a Shenzhen-based manufacturer with hard, soft, and selected ROS-style silicone heads across its range. DollWow checks complex custom builds before production and can help confirm whether a specific feature is available on the exact body and head you choose.",
    metaDescription:
      "Shop Starpery dolls by material, head type, height, weight, finish, price, availability, and supported custom options with DollWow guidance.",
    metaTitle: "Starpery Dolls: Silicone Models & Options",
    guideHref: "/learn/starpery-dolls-buying-guide",
    guideLabel: "Starpery Dolls buying guide",
    buyerNotes: [
      {
        title: "Separate body and head material",
        body: "A silicone head does not automatically mean a full-silicone body. Confirm both materials, the connector, finish match, and care requirements."
      },
      {
        title: "Check the head system",
        body: "Hard, soft, and selected ROS-style heads can support different hair, mouth, and care options. Match every choice to the exact head."
      },
      {
        title: "Verify the final weight",
        body: "Weight-reduction systems are model-specific. Compare the finished weight in pounds and kilograms rather than assuming every Starpery body is lightweight."
      }
    ],
    comparisonRows: [
      [
        "Construction",
        "Confirm whether the body is full silicone or uses another material with a silicone head.",
        "DollWow keeps body material, head material, measurements, and current options tied to the exact product."
      ],
      [
        "Head and appearance",
        "Compare hard, soft, or supported ROS-style heads, then confirm hair, eyes, mouth details, and body compatibility.",
        "Our Human Build Check reviews supported custom selections before production."
      ],
      [
        "Weight and ownership",
        "Check listed weight, weight-reduction version, delivery route, storage, and safe handling before ordering.",
        "Ask our team to confirm any missing decision-critical detail before checkout."
      ]
    ],
    faqs: [
      {
        question: "What is Starpery known for?",
        answer: "Starpery is known for silicone-focused dolls, detailed facial and surface presentation, several silicone head systems, and weight-reduction development on supported bodies."
      },
      {
        question: "Where is Starpery based?",
        answer: "Starpery's public company information identifies the manufacturer as Shenzhen Starpery Technology Co., Ltd. in Shenzhen, China."
      },
      {
        question: "Are all Starpery dolls full silicone?",
        answer: "No. DollWow carries full-silicone Starpery models and products with silicone heads on a different body-material path. Check body and head material separately."
      },
      {
        question: "What is a Starpery ROS head?",
        answer: "ROS is a selected-head system rather than a feature on every Starpery doll. Availability, body pairing, hair compatibility, price, and supported mouth details should be confirmed for the exact head."
      },
      {
        question: "Are Starpery dolls lightweight?",
        answer: "Weight varies by body, material, proportions, skeleton, and supported weight-reduction system. Compare the exact listed weight in pounds and kilograms before ordering."
      },
      {
        question: "Can DollWow help find a Starpery model that is not listed?",
        answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  },
  sedoll: {
    positioning:
      "SE Doll has produced dolls since 2016 and is known for a broad TPE range, full-silicone Silicone Pro models, detailed makeup, and varied body and head pairings.",
    intro:
      "Compare current SE Doll models on DollWow by TPE or full-silicone construction, body and head pairing, height, listed weight, makeup level, price, availability, and supported options. SE Doll is a Shenzhen-based manufacturer established in 2016, with compact and full-size products across several production and finish paths. DollWow reviews complex custom builds before production so the selected material, head, body, and options work together.",
    metaDescription:
      "Shop SE Doll TPE and Silicone Pro models by body, head, size, weight, makeup, price, availability, and supported custom options.",
    metaTitle: "SE Doll: TPE & Silicone Sex Dolls",
    guideHref: "/learn/se-doll-buying-guide",
    guideLabel: "SE Doll buying guide",
    buyerNotes: [
      {
        title: "Choose TPE or Silicone Pro",
        body: "Material changes feel, finish, weight, care, repair, and price. Confirm the body and head materials on the exact listing."
      },
      {
        title: "Compare finish levels carefully",
        body: "Standard, Body Makeup 2.0, and Master Makeup are not universal options. Confirm the supported finish and available skin tones for the selected build."
      },
      {
        title: "Pair the exact body and head",
        body: "Head shape, material, mouth type, hair, eyes, skeleton, hands, and feet can follow product-specific compatibility rules."
      }
    ],
    comparisonRows: [
      [
        "Material path",
        "Compare established TPE models with supported full-silicone Silicone Pro builds by feel, finish, weight, care, and price.",
        "DollWow identifies the body and head materials on each current product and can confirm unclear specifications."
      ],
      [
        "Makeup and finish",
        "Confirm whether standard makeup, Body Makeup 2.0, or Master Makeup is supported for the selected body and skin tone.",
        "Our Human Build Check reviews supported appearance selections before production."
      ],
      [
        "Size and handling",
        "Read height and weight together, then plan the delivery route, cleaning space, and storage position.",
        "Ask our team to confirm missing measurements or weight before checkout."
      ]
    ],
    faqs: [
      {
        question: "When was SE Doll founded?",
        answer: "SE Doll's official history dates the manufacturer to 2016 and identifies Shenzhen, China, as its main production base."
      },
      {
        question: "Does SE Doll make TPE and silicone dolls?",
        answer: "Yes. SE Doll has an established TPE range and a full-silicone Silicone Pro range. Confirm the exact body and head materials on the product page."
      },
      {
        question: "What is SE Doll Silicone Pro?",
        answer: "Silicone Pro is SE Doll's full-silicone product path. Exact softness, makeup, weight, head, skeleton, and available options can differ by model."
      },
      {
        question: "What are SE Doll's makeup options?",
        answer: "SE Doll publishes standard makeup, Body Makeup 2.0, and Master Makeup paths. Availability, price, finish, and supported skin tones depend on the selected product."
      },
      {
        question: "Does every SE Doll support the same options?",
        answer: "No. Available heads, mouths, hair, eyes, hands, feet, skeletons, makeup, and powered features can depend on the body, head, material, and current production rules."
      },
      {
        question: "Can DollWow help find an SE Doll model that is not listed?",
        answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  },
  zelex: {
    positioning:
      "Zelex Dolls is often compared for premium realism, detailed facial work, and silicone-focused catalog options."
  },
  "6ye": {
    positioning:
      "6YE Dolls is a TPE-focused manufacturer with a broad 6YE Premium range, an Amor premium label, silicone-head hybrid paths, and varied body formats.",
    intro:
      "Compare current 6YE Dolls on DollWow by 6YE Premium or Amor range, TPE body, TPE or silicone head, height, listed weight, measurements, body and head pairing, price, availability, and supported options. The wider manufacturer catalog includes female and male full dolls, compact formats, torsos, separate heads, and model-specific skeleton or head features. Start with the exact product form and construction, then confirm the final body, head, connector, standing, and custom-option combination with DollWow before production.",
    metaDescription:
      "Shop 6YE Dolls by Premium or Amor range, TPE body, TPE or silicone head, size, weight, price, availability, and custom options.",
    buyerNotes: [
      {
        title: "Start with the product form",
        body: "6YE's wider range includes full dolls, compact formats, torsos, separate heads, and male products. Check exactly which body areas are included before comparing price or dimensions."
      },
      {
        title: "Check body and head materials separately",
        body: "A TPE body can be paired with a TPE or supported silicone head. The choice affects appearance, feel, care, weight, price, and available head functions."
      },
      {
        title: "Plan the lift and route",
        body: "Use the listed body weight, head weight, height, and complete measurements to plan delivery access, lifting, posing, and storage in your space."
      }
    ],
    comparisonRows: [
      [
        "6YE Premium or Amor",
        "The range label, body sculpt, finish, included construction, and option set can differ between products.",
        "Compare the exact product page and final build rather than treating Amor as a universal upgrade package."
      ],
      [
        "Body and head pairing",
        "Body size, neck fitting, connector, head material, face, and optional functions must work together.",
        "DollWow checks the requested body and head combination with the supplier before an eligible custom order enters production."
      ],
      [
        "Skeleton, hands, and feet",
        "Gear skeletons, standing support, articulated details, and newer head features are model-specific.",
        "Confirm every required handling or posing feature on the exact listing instead of assuming it applies across 6YE."
      ]
    ],
    faqs: [
      {
        question: "What is the difference between 6YE Premium and Amor Doll?",
        answer: "6YE presents Amor as a premium label within its wider range. The exact body, head, material, finish, and options still depend on the product, so compare the final specification rather than the label alone."
      },
      {
        question: "Are 6YE Dolls made from TPE or silicone?",
        answer: "6YE is primarily TPE-focused. Current DollWow listings can pair a TPE body with a TPE or supported silicone head, so check the body and head materials separately."
      },
      {
        question: "Does 6YE make male dolls and compact products?",
        answer: "The wider 6YE catalog includes male products, compact formats, torsos, separate heads, and female full dolls. DollWow shows only the currently available models it can support."
      },
      {
        question: "Can every 6YE head fit every 6YE body?",
        answer: "Do not assume so. Body size, neck fitting, connector, head material, and optional functions can affect compatibility. Ask DollWow to confirm the exact pairing before production."
      },
      {
        question: "Do all 6YE Dolls have the same skeleton and standing features?",
        answer: "No. Gear skeletons, standing support, articulated hands or feet, and newer head functions vary by model and selected configuration. Confirm each required feature on the product page."
      },
      {
        question: "Can DollWow add a 6YE model that is missing?",
        answer: "Send the product name or official link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ],
    guideHref: "/learn/6ye-dolls-buying-guide",
    guideLabel: "6YE Dolls buying guide"
  },
  "dolls-castle": {
    positioning:
      "Dolls Castle combines conventional realistic bodies with distinctive fantasy designs, custom development, and a broad mix of TPE, full-silicone, and hybrid construction paths.",
    intro:
      "Compare current Dolls Castle models on DollWow by realistic or fantasy design, TPE, full-silicone, or hybrid construction, body and head pairing, complete measurements, listed weight, price, availability, and supported options. The manufacturer's range includes conventional bodies, compact formats, and distinctive character-led designs, so start with the exact product rather than assuming every Dolls Castle model follows the same material or ownership path. DollWow is an approved Dolls Castle seller and can help verify authenticity and supported custom choices before production.",
    metaDescription:
      "Shop approved Dolls Castle models by fantasy or realistic design, TPE, silicone or hybrid build, size, weight, price, availability, and options.",
    buyerNotes: [
      {
        title: "Choose realistic or fantasy styling",
        body: "Dolls Castle spans conventional faces and bodies as well as fantasy colors, character-led sculpts, and unusual proportions. Compare the exact gallery and measurements."
      },
      {
        title: "Confirm the construction",
        body: "Current listings can use TPE, full silicone, or a silicone-head hybrid path. Check the body and head materials separately because feel, finish, care, weight, and price can change."
      },
      {
        title: "Keep the authenticity record",
        body: "DollWow is an approved Dolls Castle seller. Retain the final build record, supplier documentation, and anti-counterfeiting details supplied with the product."
      }
    ],
    comparisonRows: [
      [
        "Design and product form",
        "A conventional full doll, fantasy body, compact product, torso, or hips product can solve a very different ownership need.",
        "DollWow keeps the exact photographs, included body areas, dimensions, material, and product link together."
      ],
      [
        "Material and custom build",
        "TPE, full silicone, hybrids, skin colors, heads, skeletons, and appearance options can follow model-specific rules.",
        "Our Human Build Check reviews supported selections before an eligible custom order enters production."
      ],
      [
        "Authenticity and ownership",
        "Distinctive products and high-value custom orders need a clear seller, build record, care path, and authenticity trail.",
        "DollWow publishes its Dolls Castle authorization certificate and includes Care 365 with every DollWow doll."
      ]
    ],
    faqs: [
      {
        question: "What is Dolls Castle known for?",
        answer: "Dolls Castle is known for custom doll development, conventional realistic bodies, distinctive fantasy designs, and varied product formats across current TPE, silicone, and hybrid listings."
      },
      {
        question: "Is DollWow approved to sell Dolls Castle?",
        answer: "Yes. DollWow has a Dolls Castle authorization certificate on file and displays it on the brand hub and authorized-vendors page."
      },
      {
        question: "Does Dolls Castle make TPE and silicone dolls?",
        answer: "Yes. Current Dolls Castle and DollWow listings include TPE, full-silicone, and silicone-head hybrid paths. Confirm the exact body and head materials on the product page."
      },
      {
        question: "Does Dolls Castle make fantasy dolls?",
        answer: "Yes. The range includes fantasy colors, character-led sculpts, animal-inspired details, and other unconventional designs alongside more traditional realistic models. Availability varies by exact product."
      },
      {
        question: "How can I check whether a Dolls Castle product is genuine?",
        answer: "Buy through an approved seller, retain the order and final build record, and keep the manufacturer's supplied documentation or anti-counterfeiting details. Ask DollWow if any authenticity step is unclear."
      },
      {
        question: "Can DollWow help find a Dolls Castle model that is not listed?",
        answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  },
  "real-lady": {
    positioning:
      "Real Lady is an Irontech sub-brand focused on high-end silicone dolls, lighter-weight luxury bodies, detailed head systems, and selected interactive features.",
    intro:
      "Compare current Real Lady dolls on DollWow by height, body weight, silicone body, head system, measurements, skin tone, price, availability, and supported options. Real Lady is an Irontech sub-brand, but its bodies, ROS and ROS MAX heads, IRON AI compatibility, hair choices, and mechanical features follow model-specific rules. Start with the exact body and head combination, then ask DollWow to confirm every selected feature before production. DollWow's Irontech authorization applies to Real Lady, and the supporting certificate is available below.",
    metaDescription:
      "Shop Real Lady dolls by height, weight, silicone body, head system, skin tone, price, availability, and supported custom options.",
    buyerNotes: [
      {
        title: "Compare body weight as well as height",
        body: "Two Real Lady dolls at similar heights can handle differently. Check the listed body weight, head weight, dimensions, and your lifting route before choosing."
      },
      {
        title: "Choose the head system carefully",
        body: "Standard silicone, ROS, and ROS MAX heads can differ in structure, movement, weight, compatible features, and care. Confirm the exact head rather than relying on the face name alone."
      },
      {
        title: "Verify interactive-feature compatibility",
        body: "IRON AI, oral functions, heating, and other mechanical choices are available only on supported products and can affect other options. DollWow will review the combination before production."
      }
    ],
    comparisonRows: [
      [
        "Body and handling",
        "Height, body weight, curves, balance, and storage route determine how practical a model feels at home.",
        "Compare the complete measurements and listed weight in both US and metric units before ordering."
      ],
      [
        "Head and appearance",
        "Head model, standard or ROS construction, makeup, skin tone, eyes, wig, and implanted-hair choices can change the final look and care routine.",
        "Use the exact product gallery, then ask DollWow to confirm which appearance choices are supported together."
      ],
      [
        "Interactive options",
        "IRON AI and mechanical functions are not universal, and some combinations have compatibility limits.",
        "Our Human Build Check reviews supported selections before an eligible custom order enters production."
      ]
    ],
    faqs: [
      {
        question: "Is Real Lady part of Irontech Dolls?",
        answer: "Yes. Real Lady identifies itself as an Irontech Doll sub-brand. DollWow's Irontech authorization applies to Real Lady, and the supporting certificate is displayed on this page."
      },
      {
        question: "Are Real Lady dolls made from silicone?",
        answer: "The current DollWow Real Lady collection focuses on silicone models. Confirm the exact body and head material on the product page because head construction and supported features can differ."
      },
      {
        question: "What are ROS and ROS MAX heads?",
        answer: "They are Real Lady silicone head systems with model-specific structures and functions. ROS MAX is a newer upgraded path on supported products. Compare the exact listing and ask DollWow to confirm compatibility before ordering."
      },
      {
        question: "Does every Real Lady doll support IRON AI?",
        answer: "No. IRON AI is limited to selected Real Lady products and requires the supported hardware and setup. It can also conflict with options such as implanted hair, so compatibility must be confirmed before production."
      },
      {
        question: "How can I verify a Real Lady doll is genuine?",
        answer: "Real Lady states that its dolls include an anti-fake code in the manual that can be checked through Irontech's anti-counterfeiting system. Keep the manual, order record, final build details, and supplied code together."
      },
      {
        question: "Can DollWow add a Real Lady model that is missing?",
        answer: "Yes. Send the product name or official link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  },
  climax: {
    positioning:
      "Climax Doll, also presented as CLM, offers a broad mix of full-size dolls, mini dolls, torsos, and other compact formats across TPE, silicone, and selected lightweight product lines.",
    intro:
      "Compare current Climax Doll models on DollWow by product form, TPE or silicone construction, complete dimensions, listed weight, body and head pairing, price, availability, and supported options. Climax Doll is also presented as CLM, and its range spans full-size dolls, mini dolls, torsos, and smaller compact products. Start with what the product physically includes, then compare material and handling so a polished photograph does not pull you toward the wrong ownership format.",
    metaDescription:
      "Shop Climax Doll and CLM models by full-size, mini, or torso form, TPE or silicone, dimensions, weight, price, availability, and options.",
    buyerNotes: [
      {
        title: "Choose the product form first",
        body: "A full-size doll, mini doll, torso, and smaller compact product have different uses, cleaning access, storage needs, handling, and prices."
      },
      {
        title: "Confirm TPE or silicone",
        body: "Climax products span multiple construction paths. Check the body and head materials, finish, softness, care routine, and repair path on the exact listing."
      },
      {
        title: "Verify the finished weight",
        body: "Ultra-lightweight applies only to supported product lines. Compare the listed pounds and kilograms for the exact body instead of assuming every CLM model is light."
      }
    ],
    comparisonRows: [
      [
        "Product form",
        "Confirm whether the listing is a full-size doll, mini doll, torso, or another compact partial-body product.",
        "DollWow keeps the complete photos, dimensions, material, price, and exact product link together so you can compare equivalent formats."
      ],
      [
        "Material and build",
        "Compare TPE, full silicone, or another stated construction, then confirm the exact body, head, skeleton, finish, and supported choices.",
        "Ask our team to confirm any decision-critical build detail that is unclear before checkout."
      ],
      [
        "Weight and storage",
        "Read height, width, depth, and listed weight together, then plan delivery access, cleaning, drying, and private storage.",
        "Every DollWow doll includes Care 365 for arrival questions, care guidance, and repair triage during the first year."
      ]
    ],
    faqs: [
      {
        question: "Is CLM the same as Climax Doll?",
        answer: "Yes. The manufacturer presents the brand as CLM and Climax Doll. DollWow groups current products under the Climax Doll brand hub."
      },
      {
        question: "What product types does Climax Doll make?",
        answer: "The current range includes full-size dolls, mini dolls, torsos, and smaller compact formats. Check the complete photographs and included body areas for the exact product."
      },
      {
        question: "Does Climax Doll make TPE and silicone products?",
        answer: "Yes. Current Climax and DollWow catalogs include TPE and silicone product paths. Confirm the exact body and head materials because care, feel, weight, finish, and price can differ."
      },
      {
        question: "Are all Climax dolls ultra-lightweight?",
        answer: "No. Ultra-lightweight is associated with selected products or series, not every Climax model. Compare the exact listed weight in pounds and kilograms before ordering."
      },
      {
        question: "How should I compare a Climax torso with a full doll?",
        answer: "Compare what the product includes, height, width, depth, weight, material, cleaning access, storage, mobility, and price. A torso and full-size doll are different ownership products."
      },
      {
        question: "Can DollWow help find a Climax model that is not listed?",
        answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  },
  piper: {
    metaTitle: "Piper Dolls | Compare Product Forms & Materials",
    metaDescription: "Compare Piper complete dolls and torso products by included body areas, TPE or silicone construction, measurements, listed weight and supported choices.",
    positioning: "Compare Piper complete dolls and torso products using the exact included form, construction and handling measurements.",
    intro: "Compare current Piper listings across complete dolls and torso products, with TPE and silicone material labels in the current collection. Start with the included body areas and head, then compare full dimensions, listed weight and material-specific care rather than assuming a shorter measurement describes a complete standing doll or easy handling. Match the included appearance and supported choices to the exact product and ordering path before comparing the configured total.",
    buyerNotes: [
      { title: "Confirm the complete product form", body: "Compare complete dolls and torsos separately. Check included body areas and any head before interpreting a listed dimension or starting price." },
      { title: "Plan handling from actual measurements", body: "A short listed dimension does not establish a low weight or easy storage. Use complete dimensions, actual weight and the manufacturer's support guidance." },
      { title: "Check materials and included styling", body: "Confirm body and head construction, supplied care guidance and included appearance separately from optional choices or photographed accessories." }
    ],
    comparisonRows: [
      ["Product form", "A torso's dimensions do not describe a complete doll's standing height.", "Check the included body areas and head before comparing equivalent builds."],
      ["Handling and care", "Material, full dimensions and actual weight affect lifting, cleaning and storage.", "Use the exact product specification and supplied material-specific care guidance."],
      ["Included appearance", "A photograph does not establish all supplied accessories or supported alternatives.", "Match the included build, product-specific choices, total and ordering path together."]
    ],
    faqs: [
      { question: "Does this collection contain only complete Piper dolls?", answer: "No. Current listings include complete dolls and torso products. Confirm the included body areas and head before comparing dimensions or starting prices." },
      { question: "Are all Piper products the same material?", answer: "No. Current listings include TPE and silicone material labels. Confirm separate head and body construction and use the supplied care guidance for the exact product." },
      { question: "Does a shorter listed dimension mean easy handling?", answer: "No. A partial-body dimension is not a complete standing height, and material, width, depth and actual weight still affect lifting and storage needs." },
      { question: "Are photographed appearance choices all included?", answer: "Only what the listing or confirmed configuration identifies as included. Check supported options and do not assume every wig, outfit, accessory or alternative appearance is supplied." }
    ],
    guideHref: "/learn/piper-dolls-buying-guide",
    guideLabel: "Piper Dolls buying guide"
  },
  tantaly: {
    positioning:
      "Tantaly specializes in compact and torso-style products across several sizes, including female and male formats designed for buyers who do not necessarily want a conventional full-body doll.",
    intro:
      "Compare current Tantaly dolls on DollWow by product form, included body areas, complete dimensions, listed weight, material, price, and storage needs. Tantaly specializes in compact and torso-style products, including very small, mid-size, larger, female, and male formats. Because the word torso can describe very different products, DollWow keeps the exact photographs and specifications with each listing and can help confirm any missing measurement before you order.",
    metaDescription:
      "Shop Tantaly compact and torso dolls by product form, dimensions, weight, material, price, storage needs, and current availability.",
    metaTitle: "Tantaly Dolls: Torso & Compact Models",
    guideHref: "/learn/tantaly-buying-guide",
    guideLabel: "Tantaly buying guide",
    buyerNotes: [
      {
        title: "Choose the product form first",
        body: "Confirm exactly which body areas are included. A small insert, hips product, torso, and larger partial-body design are not interchangeable."
      },
      {
        title: "Measure the full footprint",
        body: "Height alone is not enough. Compare width, depth, weight, base design, cleaning access, and the intended storage position."
      },
      {
        title: "Confirm material and removable parts",
        body: "TPE, silicone, seams, openings, and removable components can require different care. Use the exact product instructions."
      }
    ],
    comparisonRows: [
      [
        "Product form",
        "Confirm whether the listing is a small insert, hips product, compact torso, larger torso, male format, or another partial-body design.",
        "DollWow keeps the full photographs, included body areas, and exact product link together."
      ],
      [
        "Dimensions and weight",
        "Compare height, width, depth, relevant circumferences, listed weight, base, and storage position.",
        "Ask our team to confirm a missing measurement before you order."
      ],
      [
        "Material and care",
        "Check TPE or silicone, removable parts, cleaning access, compatible care products, and drying needs.",
        "Every DollWow doll includes Care 365 for arrival questions, care guidance, and repair triage during the first year."
      ]
    ],
    faqs: [
      {
        question: "What is a Tantaly doll?",
        answer: "Tantaly is known for compact and torso-style adult products in several sizes. The exact model may include different portions of the torso, hips, thighs, shoulders, or other anatomy."
      },
      {
        question: "Are Tantaly dolls full-body dolls?",
        answer: "Many Tantaly products are compact or torso formats rather than conventional head-to-toe dolls. Check the complete photographs and included body areas for the exact listing."
      },
      {
        question: "What materials are Tantaly dolls made from?",
        answer: "Tantaly discusses both TPE and silicone technologies, but material varies by product. Check the exact listing or ask DollWow for written confirmation."
      },
      {
        question: "Are Tantaly dolls lightweight and easy to store?",
        answer: "Some compact models may be easier to handle than many full-size dolls, but compact is not a weight rating. Compare height, width, depth, weight, and recommended storage position."
      },
      {
        question: "Does Tantaly make male torso products?",
        answer: "Yes. DollWow carries Tantaly male formats. Compare the exact included body areas, dimensions, material, weight, base design, and storage needs."
      },
      {
        question: "Can DollWow help find a Tantaly model that is not listed?",
        answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  },
  erovenus: {
    positioning:
      "Erovenus focuses on silicone torso and compact body formats with detailed sculpting, layered body painting, and model-specific proportions.",
    intro:
      "Compare current Erovenus dolls on DollWow by product form, silicone construction, height, width, depth, proportions, starting price, and current ordering path. Erovenus describes its development as following the creation of LoveNestle in 2023, with a focus on silicone torso products and hand-finished surface detail. Confirm the exact model, dimensions, weight, included body areas, and care instructions before ordering.",
    metaDescription:
      "Shop Erovenus silicone torso and compact dolls by product form, dimensions, proportions, price, care needs, and current ordering details.",
    metaTitle: "Erovenus Dolls: Silicone Torso Models",
    guideHref: "/learn/erovenus-dolls-review-guide",
    guideLabel: "Erovenus review guide",
    buyerNotes: [
      {
        title: "Choose the form before the finish",
        body: "Erovenus products span hips, smaller compact forms, and larger torsos. Confirm which body areas are included before comparing appearance or price."
      },
      {
        title: "Measure the complete footprint",
        body: "Height alone does not show how a torso will fit in storage or feel to handle. Compare width, depth, weight, base shape, and the cleaning route."
      },
      {
        title: "Follow silicone-specific care",
        body: "Use the instructions supplied for the exact product. Erovenus advises mild cleaning, complete drying, and avoiding silicone-based products that can damage its silicone material."
      }
    ],
    comparisonRows: [
      [
        "Product form",
        "Confirm whether the listing is hips, a compact torso, a larger torso, or another partial-body format.",
        "DollWow keeps the exact photographs, dimensions, material, and product link together so you can compare equivalent forms."
      ],
      [
        "Scale and handling",
        "Compare height, width, depth, listed weight, base design, cleaning access, and storage position.",
        "Ask our team to confirm a missing decision-critical measurement before you order."
      ],
      [
        "Finish and care",
        "Layered painting and detailed surface work still need material-compatible cleaning, pressure protection, and repair guidance.",
        "Every DollWow doll includes Care 365 for arrival questions, care guidance, and repair triage during the first year."
      ]
    ],
    faqs: [
      {
        question: "What is Erovenus known for?",
        answer: "Erovenus is known for silicone torso and compact body formats, detailed sculpting, layered body painting, and several product sizes rather than one standard full-body design."
      },
      {
        question: "When did Erovenus begin?",
        answer: "Erovenus describes its development as following the creation of LoveNestle in 2023. Buyers should focus on the exact current model because product series and specifications continue to evolve."
      },
      {
        question: "Are Erovenus dolls made from silicone?",
        answer: "Erovenus presents its current doll range as silicone. DollWow also keeps the confirmed material tied to each product page, so ask support if a specific listing is unclear."
      },
      {
        question: "Are all Erovenus products full-body dolls?",
        answer: "No. The range includes hips, compact products, and larger torso formats. Check the photographs, included body areas, and complete dimensions for the exact listing."
      },
      {
        question: "How should I clean an Erovenus silicone doll?",
        answer: "Follow the exact product instructions. Erovenus recommends gentle cleaning with mild soap, complete rinsing where supported, and thorough drying, and warns against silicone-based products that can damage its silicone material."
      },
      {
        question: "Can DollWow help find an Erovenus model that is not listed?",
        answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
      }
    ]
  }
};

export function buildBrandMetadata(brand: CatalogBrand): Metadata {
  const profile = brandSeoProfile(brand);
  const title = profile.metaTitle ?? `${brandHubTitle(brand)}: Shop ${brand.label} Models`;
  const description = profile.metaDescription ?? `${brand.label} models on DollWow with current prices, materials, measurements, custom options, buyer guides, and discreet support.`;
  const url = brandCanonicalUrl(brand);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "DollWow"
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}

export function buildBrandStructuredData(brand: CatalogBrand, products: Product[], { visiblePage = false }: { visiblePage?: boolean } = {}) {
  const url = brandCanonicalUrl(brand);
  const profile = brandSeoProfile(brand);
  const itemListProducts = visiblePage ? products : products.slice(0, 24);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: brandHubTitle(brand),
      description: profile.intro,
      url,
      isPartOf: {
        "@type": "WebSite",
        name: "DollWow",
        url: siteUrl
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: itemListProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}/products/${product.handle}`,
          name: productPublicTitle(product)
        }))
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Brands", item: `${siteUrl}/brands` },
        { "@type": "ListItem", position: 3, name: brand.label, item: url }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: profile.faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }
  ];
}

export function brandSeoProfile(brand: CatalogBrand): BrandSeoProfile {
  const privateIntros: Record<string, string> = {
    piper: "Compare Piper listings by the product form, included body areas, complete dimensions, listed weight and material. Full dolls and torsos are different builds. Check the exact configuration and care requirements before choosing: a short listed dimension alone does not establish standing height or easy handling.",
    rosretty: "Compare Rosretty listings by the exact product form and head-and-body construction. A silicone-head label does not establish a full-silicone body. Ask for the finished weight or any missing material details before planning lifting, cleaning and storage, then confirm what your chosen build includes.",
    sy: "Compare SY complete dolls and torsos separately, checking the exact head and body materials, dimensions and listed weight. Similar names or photographs do not guarantee the same build or options. Confirm included accessories, supported choices and the final configured price on your selected listing.",
    yl: "Compare YL dolls by their exact head and body construction, full dimensions and listed weight. Do not assume every model uses the same material or options. Check the included build and supported choices separately for custom orders and fixed warehouse configurations."
  };
  const custom = batchIBuyerPreviewEnabled(`/brands/${brand.collectionHandle}`)
    ? { ...brandProfiles[brand.value], intro: privateIntros[brand.value] }
    : brandProfiles[brand.value] ?? {};
  const positioning =
    custom.positioning ??
    `${brand.label} models are best compared by material, measurements, available options, current price, and expected delivery timing.`;

  return {
    intro:
      custom.intro ??
      `Shop ${brand.label} models on DollWow and compare material, size, price, availability, and custom options in one place. ${positioning} Open any product page for full photos, exact measurements, available choices, and delivery information before checkout.`,
    positioning,
    metaTitle: custom.metaTitle,
    metaDescription: custom.metaDescription,
    guideHref: custom.guideHref,
    guideLabel: custom.guideLabel,
    buyerNotes: custom.buyerNotes ?? defaultBuyerNotes(brand),
    comparisonRows: custom.comparisonRows,
    faqs: custom.faqs ?? defaultFaqs(brand)
  };
}

export function brandHubTitle(brand: CatalogBrand) {
  return /\bdolls?\b/i.test(brand.label) ? brand.label : `${brand.label} Dolls`;
}

export function brandRelatedLinks(brand: CatalogBrand) {
  const profile = brandSeoProfile(brand);
  return [
    ...(profile.guideHref && profile.guideLabel ? [{ label: profile.guideLabel, href: profile.guideHref }] : []),
    { label: "Compare all sex dolls", href: "/shop/sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Ready-to-ship vs custom", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Ask about price match", href: "/price-match" }
  ];
}

export function brandCanonicalUrl(brand: CatalogBrand) {
  return `${siteUrl}/brands/${brand.collectionHandle}`;
}

function defaultBuyerNotes(brand: CatalogBrand) {
  return [
    {
      title: "Compare the exact model",
      body: `${brand.label} listings can vary by body, head, height, material, and option set. Use product pages for exact measurements and photos.`
    },
    {
      title: "Check customization fit",
      body: "Brand-wide option patterns are useful, but product-specific availability, conflicts, and production timing should be confirmed before checkout."
    },
    {
      title: "Review final value",
      body: "Compare the starting price, available options, delivery time, measurements, and privacy details before choosing a doll."
    }
  ];
}

function defaultFaqs(brand: CatalogBrand) {
  return [
    {
      question: `How should I compare ${brand.label} dolls?`,
      answer: `Compare ${brand.label} models by material, height, weight, measurements, body type, availability, custom options, and total value.`
    },
    {
      question: `Can every ${brand.label} model use the same custom options?`,
      answer:
        "No. Available options can vary by body, head, and material. The product page shows the choices offered for that specific doll."
    },
    {
      question: `Does DollWow confirm ${brand.label} stock and order details?`,
      answer:
        "Yes. Current stock, custom timing, option compatibility, and delivery expectations should be confirmed before checkout when those details affect the order."
    }
  ];
}
