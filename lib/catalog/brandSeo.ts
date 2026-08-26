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
  faqs: Array<{ question: string; answer: string }>;
};

const brandProfiles: Record<string, Partial<BrandSeoProfile>> = {
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
    positioning:
      "Piper Dolls is often compared by buyers looking for compact sizes, stylized or realistic presentations, and practical storage considerations.",
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
