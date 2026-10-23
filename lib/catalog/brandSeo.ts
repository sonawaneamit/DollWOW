import type { Metadata } from "next";
import type { Product } from "@/types/product";
import { catalogBrands, type CatalogBrand } from "@/lib/catalog/brands";
import { productPublicTitle } from "@/lib/catalog/naming";
import { env } from "@/lib/utils/env";

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
  comparisonBullets?: string[];
  faqs: Array<{ question: string; answer: string }>;
};

const brandProfiles: Record<string, Partial<BrandSeoProfile>> = {
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
  "moonvale": {
    "metaTitle": "Moonvale Dolls: Silicone Fantasy Models",
    "metaDescription": "Compare Moonvale Lyora, Sorelle, Velara and Cerina silicone dolls by height, character styling, current price and product-specific options.",
    "positioning": "Explore Moonvale's silicone fantasy dolls and their leopard, fox, panther and deer-inspired looks.",
    "intro": "Meet Moonvale's Lyora, Sorelle, Velara and Cerina silicone fantasy dolls. Explore their character styling, colors and measurements to find your favorite look. Each product page shows its photos, price and available choices.",
    "buyerNotes": [
      {
        "title": "Find your favorite look",
        "body": "The same model family can have different colors and styling. Browse the full title and gallery for the version you like."
      },
      {
        "title": "Check the size and weight",
        "body": "Compare the measurements and listed weight. Ask us for a missing detail before choosing."
      },
      {
        "title": "See what comes with it",
        "body": "Check the listing for included hair, clothes and accessories. We can help you check a pictured item."
      }
    ],
    "comparisonBullets": [
      "Browse each model's colors and styling in its full gallery.",
      "Compare the measurements, weight and available choices on the product page.",
      "Ask us to check included accessories or help compare two looks."
    ],
    "faqs": [
      {
        "question": "Which Moonvale models can I find here?",
        "answer": "The collection includes Lyora, Sorelle, Velara and Cerina. Open their listings to explore the different looks and current choices."
      },
      {
        "question": "Why do some listings share a model name?",
        "answer": "A model family can have several colors or named looks. The full title and photos show the version on each listing."
      },
      {
        "question": "Where can I check the weight?",
        "answer": "Check your chosen listing. If the weight is missing, ask us to confirm it for that model."
      },
      {
        "question": "Are the pictured accessories included?",
        "answer": "Check the listing for its included hair, clothing and accessories. Ask us about a particular pictured item before ordering."
      }
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
    "positioning": "Browse realistic and fantasy Dolls Castle designs in different sizes and constructions.",
    "intro": "Explore Dolls Castle's realistic faces, fantasy designs and varied body shapes. Compare photos, measurements, materials and custom choices to find your favorite. We are an approved Dolls Castle seller, and you can view our certificate below.",
    "metaDescription": "Shop approved Dolls Castle models by fantasy or realistic design, TPE, silicone or hybrid build, size, weight, price, availability, and options.",
    "buyerNotes": [
      {
        "title": "Find your style",
        "body": "Explore realistic faces, fantasy colors and unusual designs. The gallery and measurements help you see how each model differs."
      },
      {
        "title": "Compare the materials",
        "body": "Check the head and body materials on the listing. The range includes TPE, silicone and silicone-head/TPE-body builds."
      },
      {
        "title": "Ask an approved seller",
        "body": "Our Dolls Castle certificate is below. Ask us about a model, custom choice or detail you would like checked."
      }
    ],
    "comparisonBullets": [
      "Compare the photos, measurements and weight of the model you like.",
      "Explore its custom choices and prices, and ask us about combinations that need checking.",
      "View our seller certificate below and read about Care for Life for ownership support."
    ],
    "faqs": [
      {
        "question": "What can I find in the Dolls Castle range?",
        "answer": "Browse realistic and fantasy designs, from full-body dolls to compact and partial-body products. Each listing shows its construction, photos and measurements."
      },
      {
        "question": "Is DollWow approved to sell Dolls Castle?",
        "answer": "Yes. You can view our authorization certificate in the Seller authorization section below and on our authorized-vendors page."
      },
      {
        "question": "Can I choose TPE or silicone?",
        "answer": "The range includes TPE, silicone and silicone-head/TPE-body builds. Check the head and body materials on your chosen listing."
      },
      {
        "question": "Are fantasy designs available?",
        "answer": "Yes. Browse the current listings for fantasy colors, distinctive faces and unusual body designs alongside realistic models."
      },
      {
        "question": "Can you help check a product?",
        "answer": "Send us the model or listing you are considering. We can help check its details and the choices available for your order."
      },
      {
        "question": "Can you find a model that is missing?",
        "answer": "Send its name or a link through live chat or hello@dollwow.com and we will check whether we can add it."
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
    "positioning": "Climax Doll, also called CLM, offers full dolls, mini dolls, torsos and smaller designs in TPE and silicone.",
    "intro": "Explore Climax Doll, also called CLM, at DollWOW. Browse full dolls, mini dolls, torsos and smaller designs in TPE and silicone. Compare the photos, measurements and listed weight to choose the size and shape you want.",
    "metaDescription": "Explore CLM and Climax Doll full dolls, mini dolls and torsos in TPE and silicone. Compare measurements, listed weights, prices and available choices.",
    "buyerNotes": [
      {
        "title": "Choose what you want",
        "body": "A full doll, mini doll and torso include different body areas. Compare the photos and measurements before choosing."
      },
      {
        "title": "Compare the materials",
        "body": "Check the head and body materials, finish and available choices on the listing. Ask us about care or a detail you cannot find."
      },
      {
        "title": "Check the weight",
        "body": "Some CLM models are sold as ultra-lightweight. Compare each model's listed pounds and kilograms rather than assuming they all weigh the same."
      }
    ],
    "faqs": [
      {
        "question": "Is CLM the same as Climax Doll?",
        "answer": "Yes. The manufacturer uses both CLM and Climax Doll. DollWOW groups its current listings in this brand collection."
      },
      {
        "question": "What types of Climax dolls can I find?",
        "answer": "The range includes full dolls, mini dolls, torsos and smaller designs. The photos and measurements show what each model includes."
      },
      {
        "question": "Does Climax make TPE and silicone dolls?",
        "answer": "Yes. Check the head and body materials on your chosen listing, along with its weight, finish, care instructions and available options."
      },
      {
        "question": "Are all Climax dolls ultra-lightweight?",
        "answer": "No. That label applies to selected models. Compare the listed weight in pounds and kilograms for the doll you want."
      },
      {
        "question": "How do I compare a Climax torso with a full doll?",
        "answer": "Start with the body areas you want, then compare measurements, weight and material. Think about where you will carry, clean and store it, too."
      },
      {
        "question": "Can DollWOW find a Climax model that is not listed?",
        "answer": "Send us the model name or link and we'll check whether we can add it."
      }
    ],
    "comparisonBullets": [
      "Compare full dolls, mini dolls and torsos by what they include and their measurements.",
      "Check the exact model's materials, weight and available choices before comparing prices.",
      "Care for Life includes first-year ownership support and ongoing repair guidance."
    ]
  },
  piper: {
    positioning:
      "Piper Dolls is often compared by buyers looking for compact sizes, stylized or realistic presentations, and practical storage considerations.",
    guideHref: "/learn/piper-dolls-buying-guide",
    guideLabel: "Piper Dolls buying guide"
  },
  "tantaly": {
    "metaTitle": "Tantaly Dolls: Torso & Compact Models",
    "metaDescription": "Shop Tantaly compact and torso dolls by product form, dimensions, weight, material, price, storage needs, and current availability.",
    "positioning": "Explore Tantaly torso and compact dolls in a range of shapes and sizes.",
    "intro": "Explore Tantaly's torso and compact dolls in a range of shapes and sizes. Compare the photos, material, dimensions and weight to find one that suits your space. Our team can help you check what comes with the model you like.",
    "guideHref": "/learn/tantaly-buying-guide",
    "guideLabel": "Tantaly buying guide",
    "buyerNotes": [
      {
        "title": "Choose your shape",
        "body": "Browse the photos to find the shape and format you like, then check the description for what you are buying."
      },
      {
        "title": "Measure your space",
        "body": "Compare length, width, depth and weight, and think about where you will clean and store the product."
      },
      {
        "title": "Check the care instructions",
        "body": "Use the instructions for your product's material and removable parts. Ask us if you are unsure about cleaning or storage."
      }
    ],
    "comparisonBullets": [
      "Compare the photos and description to find the shape and format you want.",
      "Check the full dimensions, material and weight, or ask us for a missing measurement.",
      "Care for Life includes first-year ownership support and ongoing repair guidance; see the coverage details for what is included."
    ],
    "faqs": [
      {
        "question": "What is a Tantaly doll?",
        "answer": "Tantaly makes torso and compact adult products in several shapes and sizes. Browse the photos and description for each model."
      },
      {
        "question": "Are these full-body dolls?",
        "answer": "Many are torsos or other compact formats. Check the photos, description and measurements to see exactly what you are buying."
      },
      {
        "question": "What materials can I choose?",
        "answer": "Tantaly offers TPE and silicone products. Check the material on your chosen listing, or ask us to confirm it."
      },
      {
        "question": "Are they easy to store?",
        "answer": "Compare the full dimensions and weight against your space. Follow the product's recommended resting position when storing it."
      },
      {
        "question": "Are male Tantaly products available?",
        "answer": "Yes. Browse the male models and compare their shape, dimensions, material and weight."
      },
      {
        "question": "Can you find a Tantaly model that is missing?",
        "answer": "Send its name or a link through live chat or hello@dollwow.com and we will check whether we can add it."
      }
    ]
  },
  erovenus: {
    "positioning": "Erovenus describes its range as silicone torsos and compact designs with detailed sculpting and layered body painting.",
    "intro": "Explore Erovenus silicone torsos and compact designs at DollWOW. Erovenus describes its range as detailed sculpts with layered body painting. Compare the photos, measurements and weight to find a model that fits your space.",
    "metaDescription": "Explore Erovenus silicone torsos and compact designs at DollWOW. Compare photos, dimensions, listed weight, current prices and care needs.",
    "metaTitle": "Erovenus Dolls: Silicone Torso Models",
    "guideHref": "/learn/erovenus-dolls-review-guide",
    "guideLabel": "Erovenus review guide",
    "buyerNotes": [
      {
        "title": "Choose your shape",
        "body": "Compare hips, compact designs and larger torsos. The photos show which body areas each model includes."
      },
      {
        "title": "Plan your space",
        "body": "Check width, depth and weight as well as height. Think about carrying, cleaning and storage."
      },
      {
        "title": "Follow the care instructions",
        "body": "Use the instructions for your model. Erovenus recommends gentle cleaning and avoiding silicone-based products on its silicone."
      }
    ],
    "faqs": [
      {
        "question": "What is Erovenus known for?",
        "answer": "Erovenus describes its range as silicone torsos and compact designs with detailed sculpting and layered body painting."
      },
      {
        "question": "When did Erovenus begin?",
        "answer": "Erovenus says its development followed the creation of LoveNestle in 2023. Its current listings show the models and choices available now."
      },
      {
        "question": "Are Erovenus dolls made from silicone?",
        "answer": "Erovenus describes its current range as silicone. Check your chosen DollWOW listing for the material, or ask us about a missing detail."
      },
      {
        "question": "Are all Erovenus products full-body dolls?",
        "answer": "No. You can find hips, compact designs and larger torsos. Check the photos and measurements to see what each model includes."
      },
      {
        "question": "How should I clean an Erovenus silicone doll?",
        "answer": "Follow your model's instructions. Erovenus recommends gentle cleaning with mild soap, rinsing where supported and thorough drying. Avoid silicone-based products that can damage its silicone."
      },
      {
        "question": "Can DollWOW find an Erovenus model that is not listed?",
        "answer": "Send us the model name or link and we'll check whether we can add it."
      }
    ],
    "comparisonBullets": [
      "Compare the body areas included, full measurements and listed weight.",
      "Check the finish, included accessories and care instructions on your chosen listing.",
      "Care for Life includes first-year ownership support and ongoing repair guidance."
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

export function buildBrandStructuredData(brand: CatalogBrand, products: Product[]) {
  const url = brandCanonicalUrl(brand);
  const profile = brandSeoProfile(brand);
  const itemListProducts = products.slice(0, 24);

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
  const custom = brandProfiles[brand.value] ?? {};
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
    comparisonBullets: custom.comparisonBullets,
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
