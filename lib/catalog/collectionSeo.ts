import type { Metadata } from "next";
import type { Product } from "@/types/product";
import { env } from "@/lib/utils/env";
import type { CatalogFilters } from "./filters";
import { productPublicTitle } from "./naming";

type CollectionPreset = {
  title: string;
  filters: CatalogFilters;
};

type CollectionContext = {
  handle: string;
  preset: CollectionPreset;
  products: Product[];
};

type RelatedLink = {
  label: string;
  href: string;
};

type CollectionBuyerNote = {
  title: string;
  body: string;
};

export type CollectionComparisonRow = {
  factor: string;
  whyItMatters: string;
  dollWowAdvantage: string;
};

const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export function buildCollectionMetadata(
  handle: string,
  preset: CollectionPreset,
  searchParams: Record<string, string | string[] | undefined> = {}
): Metadata {
  const title = collectionTitle(preset);
  const description = collectionDescription(handle, preset);
  const canonicalUrl = collectionCanonicalUrl(handle);
  const isFacetView = hasFacetParams(searchParams);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: isFacetView ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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

export function buildCollectionStructuredData({ handle, preset, products }: CollectionContext) {
  const title = collectionTitle(preset);
  const description = collectionDescription(handle, preset);
  const url = collectionCanonicalUrl(handle);
  const faq = collectionFaqItems(handle, preset);
  const itemListProducts = products.slice(0, 24);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
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
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Shop",
          item: `${siteUrl}/shop/sex-dolls`
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: url
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ];
}

export function collectionIntro(preset: CollectionPreset, handle = "") {
  const title = collectionTitle(preset);
  const handleIntro = collectionIntroByHandle[handle];
  if (handleIntro) return handleIntro;
  if (preset.filters.availability === "ready_to_ship") {
    return `${title} are already held in a warehouse for faster dispatch. Compare available models by material, size, price, and included configuration, then ask us to confirm the exact unit and expected dispatch time before payment.`;
  }
  if (preset.filters.availability === "custom") {
    return `${title} let you choose details such as material, skin tone, hair, eyes, skeleton features, functions, and accessories. Use the filters to compare starting prices and body sizes, then open a product to see the exact choices and production time available for that doll.`;
  }
  if (preset.filters.material) {
    return `${title} help buyers compare material feel, care needs, price range, weight, and customization tradeoffs across DollWow's catalog. Start with the product facts on this page, then use the related guides below to compare TPE, silicone, hybrid builds, shipping expectations, and maintenance before you choose a specific model.`;
  }
  if (preset.filters.bodyType === "male") {
    return `${title} bring together male sex dolls by height, material, body proportions, availability, and custom options. Review the measurements and weight carefully, then ask us to confirm any option or delivery detail that matters to you.`;
  }
  if (preset.filters.brand) {
    return `${title} brings together DollWow catalog listings for this brand with practical filters for size, material, price, availability, and customization.`;
  }
  return `${title} are organized for private, practical comparison across price, material, size, warehouse status, and customization options. Use filters to narrow the catalog, compare product facts side by side, and move into the Learning Center when you need help with materials, cost, realistic features, discreet shipping, or custom order timing.`;
}

export function collectionRelatedLinks(handle: string, preset: CollectionPreset): RelatedLink[] {
  const byHandle = collectionLinksByHandle[handle];
  if (byHandle) return byHandle;
  if (preset.filters.material) {
    return [
      { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
      { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
      { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
    ];
  }
  if (preset.filters.bodyType === "male") {
    return [
      { label: "Read the male doll buying guide", href: "/learn/male-sex-doll-buying-guide" },
      { label: "Compare ready-to-ship and custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
      { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
    ];
  }
  return [
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" }
  ];
}

export function collectionBuyerNotes(handle: string, preset: CollectionPreset): CollectionBuyerNote[] {
  const byHandle = collectionBuyerNotesByHandle[handle];
  if (byHandle) return byHandle;
  if (preset.filters.material) {
    return [
      {
        title: "Compare material with handling",
        body: "Material affects feel and cleaning, but height, weight, skeleton support, and storage space often decide whether a listing is practical."
      },
      {
        title: "Check the exact build",
        body: "Confirm whether the product is full TPE, full silicone, silicone-head, or another mixed construction before comparing price."
      },
      {
        title: "Use product facts first",
        body: "A category is a useful starting point. Open each product page for its exact measurements, photos, materials, options, and delivery information."
      }
    ];
  }
  return [
    {
      title: "Start with measurable facts",
      body: "Compare height, weight, material, measurements, availability, and custom options before judging photos or headline price."
    },
    {
      title: "Confirm timing before checkout",
      body: "Ready-to-ship and made-to-order dolls have different delivery times, available options, and approval steps."
    },
    {
      title: "Match the product to the buyer",
      body: "The best listing is the one that fits budget, privacy needs, handling comfort, storage space, and support expectations."
    }
  ];
}

export function collectionComparisonRows(handle: string, preset: CollectionPreset): CollectionComparisonRow[] {
  const byHandle = collectionComparisonRowsByHandle[handle];
  if (byHandle) return byHandle;
  if (preset.filters.material) {
    return [
      {
        factor: "Material facts",
        whyItMatters: "Material labels can hide differences in head, body, surface finish, care, and weight.",
        dollWowAdvantage: "DollWow keeps material filters connected to product photos, measurements, care guides, and available options."
      },
      {
        factor: "Handling and storage",
        whyItMatters: "A material choice can still be wrong if the doll is too heavy or hard to store.",
        dollWowAdvantage: "Product cards and filters help compare height, weight, body type, and availability together."
      },
      {
        factor: "Final configuration",
        whyItMatters: "Photos and category labels do not always prove the exact build a buyer receives.",
        dollWowAdvantage: "Buyers can ask support to confirm the current product path before checkout."
      }
    ];
  }
  return [];
}

function collectionTitle(preset: CollectionPreset) {
  return preset.title;
}

function collectionDescription(handle: string, preset: CollectionPreset) {
  const handleDescription = collectionMetaDescriptions[handle];
  if (handleDescription) return handleDescription;
  return truncate(`${collectionIntro(preset, handle)} Use filters to compare product facts, pricing, measurements, and discreet delivery details.`, 155);
}

function collectionCanonicalUrl(handle: string) {
  return `${siteUrl}/shop/${handle}`;
}

function hasFacetParams(searchParams: Record<string, string | string[] | undefined>) {
  return Object.entries(searchParams).some(([key, value]) => key !== "sort" && value !== undefined);
}

export function collectionFaqItems(handle: string, preset: CollectionPreset) {
  const handleFaq = collectionFaqByHandle[handle];
  if (handleFaq) return handleFaq;
  const title = preset.title.toLowerCase();
  return [
    {
      question: `How should I compare ${title}?`,
      answer:
        "Start with material, height, weight, measurements, stock status, delivery timing, and customization options. DollWow product pages show catalog facts and support links so buyers can verify details before checkout."
    },
    {
      question: "Are all options available on every product in this collection?",
      answer:
        "No. Available choices vary by brand, body, head, and material. Each product page shows the options offered for that specific doll, including any known incompatibilities."
    },
    {
      question: "Does DollWow confirm stock and shipping details?",
      answer:
        "Yes. Ready-to-ship listings still require stock confirmation, and custom builds require timing and final approval checks before shipment."
    }
  ];
}

const collectionIntroByHandle: Record<string, string> = {
  "sex-dolls":
    "Shop sex dolls across the full DollWow catalog with filters for material, body type, height, weight, price, availability, and custom options. Compare measurements, photos, delivery timing, and buyer protection before making a private purchase. If a specific detail matters, ask our team to confirm it before checkout.",
  "realistic-sex-dolls":
    "Realistic sex dolls should be compared by more than face photos. Use this collection to review body proportions, material, skin finish, measurements, weight, and customization options across DollWow listings. A realistic look can depend on the exact head, body, wig, eyes, faceup, and final configuration, so compare the product page carefully and ask support to confirm any detail that affects the finished build.",
  "mini-sex-dolls":
    "Shop full mini sex dolls with a known height up to 120 cm / 3 ft 11 in. Mini describes physical size only, and every DollWow product is sold for adults. Compare listed weight, complete measurements, material, stock status, customization, storage orientation, and handling needs. If you can accommodate a taller compact body, compare the separate petite collection from 121 to 154 cm / 4 ft to 5 ft 1 in.",
  "cheap-sex-dolls":
    "Affordable sex dolls can offer a practical entry point without reducing the decision to price alone. This collection uses current DollWow starting prices to show models at $1,000 or less, sorted from lowest to highest. Compare material, size, weight, product form, availability, and included features, then open the product page to check the live price and exact configuration before ordering.",
  tpe:
    "TPE dolls are often chosen for their softer feel, flexible posing, and lower starting price compared with many silicone dolls. Compare TPE sex dolls by height, weight, body shape, availability, and custom options, then read the material guide for cleaning, storage, and handling advice.",
  silicone:
    "Shop full silicone sex dolls by height, weight, body shape, finish, availability, and custom options. Silicone is often chosen for crisp sculpt detail, a firmer feel, and a less porous surface than many TPE formulations, but softness and handling vary by manufacturer and body design. A silicone head on a TPE body is a hybrid build, not a full silicone doll. Check the material listed for both the head and body, then compare the exact measurements, carrying weight, photos, options, and production path before choosing a model.",
  "male-dolls":
    "Shop adult male sex dolls across full-body and compact designs from DollWow brands. Compare height, listed weight, shoulder and body proportions, TPE, full silicone, or hybrid construction, intimate configuration, skeleton support, starting price, and made-to-order status. Product-specific anatomy and options vary, so open the exact listing and ask our team to confirm any decision-critical detail before production.",
  "ready-to-ship":
    "Ready-to-ship sex dolls are the best place to start when timing matters. Compare warehouse dolls by material, size, price, body type, and location. Availability can change quickly, so we confirm the exact unit and expected dispatch time before payment.",
  custom:
    "Custom sex dolls give you more control over the final appearance and features. Compare body sizes, materials, starting prices, and available choices, then customize the exact doll you want. Options vary by model, and prices update as you build.",
  customizable:
    "Custom sex dolls give you more control over the final appearance and features. Compare body sizes, materials, starting prices, and available choices, then customize the exact doll you want. Options vary by model, and prices update as you build."
};

const collectionMetaDescriptions: Record<string, string> = {
  "sex-dolls": "Shop sex dolls by material, height, weight, price, stock status, and custom options with DollWow buyer guides and support links.",
  "realistic-sex-dolls": "Compare realistic sex dolls by proportions, material, measurements, finish, weight, and customization before choosing a DollWow listing.",
  "mini-sex-dolls": "Compare mini sex dolls up to 120 cm / 3 ft 11 in by weight, measurements, material, storage needs, stock status, and options.",
  "cheap-sex-dolls": "Shop affordable sex dolls with current starting prices up to $1,000. Compare material, size, weight, product form, stock, and options.",
  tpe: "Shop TPE dolls by height, weight, body shape, price, stock status, and options, with DollWow material and care guidance.",
  silicone: "Shop full silicone sex dolls by height, weight, finish, stock status, and custom options. Compare construction, care, handling, and product details.",
  "male-dolls": "Shop male sex dolls by full-body or compact form, height, weight, proportions, TPE or silicone, anatomy, skeleton, price, and custom options.",
  "ready-to-ship": "Browse ready-to-ship sex dolls organized for faster fulfillment, with stock, configuration, shipping, and support details to confirm.",
  custom: "Compare custom sex dolls and factory-order listings by base model, material, size, options, compatibility, and production timing.",
  customizable: "Compare custom sex dolls and factory-order listings by base model, material, size, options, compatibility, and production timing."
};

const collectionBuyerNotesByHandle: Record<string, CollectionBuyerNote[]> = {
  "sex-dolls": [
    {
      title: "Compare the full purchase, not the headline",
      body: "A sex doll listing should be judged by material, height, weight, measurements, stock status, customization path, shipping expectations, and support quality."
    },
    {
      title: "Use filters to narrow risk",
      body: "Start broad, then filter by material, body type, height, price, stock status, and brand so the remaining choices are easier to verify."
    },
    {
      title: "Confirm sensitive details early",
      body: "If privacy, timing, packaging, billing, or exact configuration matters, ask support before checkout instead of relying on category copy."
    }
  ],
  "realistic-sex-dolls": [
    {
      title: "Realism starts with proportions",
      body: "Face detail matters, but height, body proportions, skin finish, eyes, hands, poseability, and final configuration shape the realistic effect."
    },
    {
      title: "Photos need context",
      body: "Product images may show a sample or a specific option set. Confirm the exact head, body, wig, eyes, and material before treating photos as a match."
    },
    {
      title: "Balance realism with handling",
      body: "Larger and more detailed builds can be heavier or harder to store. Check weight and dimensions alongside appearance."
    }
  ],
  "mini-sex-dolls": [
    {
      title: "Shorter does not always mean easy",
      body: "Mini sex dolls can be easier to store, but weight, boxed size, material, and storage orientation still matter."
    },
    {
      title: "Keep mini and petite separate",
      body: "DollWow uses up to 120 cm / 3 ft 11 in for mini dolls and 121 to 154 cm / 4 ft to 5 ft 1 in for petite dolls. Compare exact measurements before choosing."
    },
    {
      title: "Size never describes age",
      body: "Mini is a measurement category for adult products. DollWow does not use age-coded merchandising language."
    }
  ],
  "cheap-sex-dolls": [
    {
      title: "Start with the live product price",
      body: "This collection updates from current catalog starting prices. Open the product page for the latest price and any option costs before checkout."
    },
    {
      title: "Compare value, not price alone",
      body: "Material, size, weight, product form, included features, care needs, shipping, and support all affect the real ownership value."
    },
    {
      title: "Check full dolls and compact formats",
      body: "Lower-priced results can include full dolls, torsos, hips, or smaller models. Use the product-form and measurement filters to compare like with like."
    }
  ],
  tpe: [
    {
      title: "TPE is often value-focused",
      body: "Many TPE dolls start at a lower price than comparable silicone builds, but final cost can change with size, options, shipping, and availability."
    },
    {
      title: "Care routine matters",
      body: "TPE can require careful cleaning, drying, powdering, and storage. Product-specific care guidance should beat generic assumptions."
    },
    {
      title: "Check the material claim",
      body: "Some listings mix TPE and silicone elements. Confirm the exact construction before comparing feel, price, or care needs."
    }
  ],
  silicone: [
    {
      title: "Start with the exact construction",
      body: "Full silicone means the body is silicone. A silicone head paired with a TPE body is a hybrid, with different feel, care, weight, and pricing tradeoffs."
    },
    {
      title: "Compare firmness and detail by model",
      body: "Silicone formulations vary. Material alone does not prove softness or realism, so compare the body design, surface finish, faceup, eyes, hands, and current product photos."
    },
    {
      title: "Plan for weight, care, and storage",
      body: "Check the listed weight and dimensions before ordering. Clean and dry every area according to the manufacturer's instructions, even when the surface is less porous than TPE."
    }
  ],
  "male-dolls": [
    {
      title: "Choose the product form first",
      body: "Full-body dolls and compact male products differ in weight, storage, posing, cleaning, and price. Compare equivalent forms before judging value."
    },
    {
      title: "Weight determines daily fit",
      body: "Height alone can be misleading. Check the listed weight, body proportions, carrying route, cleaning space, and storage setup for the exact model."
    },
    {
      title: "Confirm anatomy and options",
      body: "Intimate configuration, head pairing, skeleton features, hair, heating, and other choices vary by body and manufacturer. Confirm the selected build before production."
    }
  ],
  "ready-to-ship": [
    {
      title: "Fast comparison still needs confirmation",
      body: "Ready-to-ship dolls move faster, but we still confirm the exact unit, included configuration, and expected dispatch time before payment."
    },
    {
      title: "Expect fewer changes",
      body: "Warehouse-style listings may have less customization flexibility than factory-order builds. Compare what is fixed before checkout."
    },
    {
      title: "Use timing as one factor",
      body: "A faster path is useful, but material, size, weight, privacy, and support clarity still matter."
    }
  ],
  custom: [
    {
      title: "Custom starts with compatibility",
      body: "Custom choices depend on the brand, body, head, and material. Check the product page for the options available on that doll."
    },
    {
      title: "Production timing is part of the choice",
      body: "Made-to-order dolls take time to build. We check your choices and send factory photos and videos for approval before shipment."
    },
    {
      title: "Confirm what is included",
      body: "Do not assume accessories, wigs, eyes, functions, or upgrades are included unless the product page or support confirms them."
    }
  ],
  customizable: [
    {
      title: "Custom starts with compatibility",
      body: "Custom choices depend on the brand, body, head, and material. Check the product page for the options available on that doll."
    },
    {
      title: "Production timing is part of the choice",
      body: "Made-to-order dolls take time to build. We check your choices and send factory photos and videos for approval before shipment."
    },
    {
      title: "Confirm what is included",
      body: "Do not assume accessories, wigs, eyes, functions, or upgrades are included unless the product page or support confirms them."
    }
  ]
};

const collectionLinksByHandle: Record<string, RelatedLink[]> = {
  "sex-dolls": [
    { label: "Read the complete sex doll guide", href: "/learn/sex-doll-guide" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "YourDoll alternatives", href: "/learn/yourdoll-alternatives" },
    { label: "BestRealDoll alternatives", href: "/learn/bestrealdoll-alternatives" }
  ],
  "realistic-sex-dolls": [
    { label: "Most realistic sex dolls guide", href: "/learn/most-realistic-sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Silicon Wives alternatives", href: "/learn/siliconwives-alternatives" }
  ],
  "mini-sex-dolls": [
    { label: "Mini sex dolls guide", href: "/learn/mini-sex-dolls" },
    { label: "Compare petite sex dolls", href: "/shop/petite-dolls" },
    { label: "Plan compact storage", href: "/learn/sex-doll-storage" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  "cheap-sex-dolls": [
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "Compare ready-to-ship and custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" }
  ],
  "height-under-155": [
    { label: "Mini sex dolls guide", href: "/learn/mini-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  tpe: [
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "What TPE material means", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "RosemaryDoll alternatives", href: "/learn/rosemarydoll-alternatives" }
  ],
  silicone: [
    { label: "Read the complete sex doll guide", href: "/learn/sex-doll-guide" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Most realistic sex dolls guide", href: "/learn/most-realistic-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "Silicon Wives alternatives", href: "/learn/siliconwives-alternatives" }
  ],
  "male-dolls": [
    { label: "Male sex doll buying guide", href: "/learn/male-sex-doll-buying-guide" },
    { label: "Compare TPE and silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Compare ready-to-ship and custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Plan cleaning and care", href: "/learn/how-to-clean-a-sex-doll" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "JoyLoveDolls alternatives", href: "/learn/joylovedolls-alternatives" }
  ],
  "ready-to-ship": [
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "YourDoll alternatives", href: "/learn/yourdoll-alternatives" }
  ],
  custom: [
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Silicon Wives alternatives", href: "/learn/siliconwives-alternatives" }
  ],
  customizable: [
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Silicon Wives alternatives", href: "/learn/siliconwives-alternatives" }
  ]
};

const collectionComparisonRowsByHandle: Record<string, CollectionComparisonRow[]> = {
  "sex-dolls": [
    {
      factor: "Catalog breadth",
      whyItMatters: "Broad doll searches can quickly become messy if every product is shown with the same priority.",
      dollWowAdvantage: "DollWow lets buyers narrow by material, body type, height, price, availability, brand, and custom options."
    },
    {
      factor: "Buyer guidance",
      whyItMatters: "A private high-ticket purchase needs education before checkout alongside product photos.",
      dollWowAdvantage: "Collection pages connect directly to cost, material, realistic-feature, shipping, and alternative-store guides."
    },
    {
      factor: "Pre-checkout support",
      whyItMatters: "Price, stock, options, and delivery timing can change the final decision.",
      dollWowAdvantage: "DollWow gives buyers support and listing-comparison paths before they pay."
    }
  ],
  "realistic-sex-dolls": [
    {
      factor: "Realism criteria",
      whyItMatters: "Realism depends on proportions, face detail, eyes, skin finish, pose support, and final configuration.",
      dollWowAdvantage: "DollWow pairs realistic listings with guides that explain what to verify beyond photos."
    },
    {
      factor: "Product proof",
      whyItMatters: "A photo may show a sample, reference build, or a specific option set.",
      dollWowAdvantage: "Product pages and support help buyers confirm the exact head, body, material, and options."
    },
    {
      factor: "Practical fit",
      whyItMatters: "The most realistic-looking doll can still be too heavy, too large, or wrong for storage.",
      dollWowAdvantage: "Filters and product cards keep height, weight, material, and delivery path visible during comparison."
    }
  ],
  "mini-sex-dolls": [
    {
      factor: "Compact size",
      whyItMatters: "Mini labels vary, and shorter dolls can still be dense or awkward to store.",
      dollWowAdvantage: "DollWow filters compact listings by height and keeps weight, material, and availability visible."
    },
    {
      factor: "Clear category boundary",
      whyItMatters: "Retailers often mix mini, petite, torso, hips, and unknown-height products in one result set.",
      dollWowAdvantage: "DollWow limits this collection to full dolls with a known height up to 120 cm / 3 ft 11 in and gives petite products their own path."
    },
    {
      factor: "Adult-only framing",
      whyItMatters: "A size label should never be used to imply age.",
      dollWowAdvantage: "Mini describes dimensions only. DollWow sells adult products to adults and avoids age-coded merchandising."
    }
  ],
  "cheap-sex-dolls": [
    {
      factor: "Current starting price",
      whyItMatters: "Catalog prices and available configurations can change, so an old article or fixed list can become misleading.",
      dollWowAdvantage: "This collection qualifies products from the current DollWow catalog and sorts them by live starting price."
    },
    {
      factor: "Comparable product type",
      whyItMatters: "A torso, hips model, mini doll, and full-size doll are different purchases even when their prices are similar.",
      dollWowAdvantage: "Product-form, size, material, and body-type filters help buyers compare products with similar practical uses."
    },
    {
      factor: "Delivered value",
      whyItMatters: "Options, shipping path, care needs, storage, and support can matter more than a small difference in starting price.",
      dollWowAdvantage: "DollWow connects live products with cost, material, fulfillment, and buyer-protection guidance before checkout."
    }
  ],
  silicone: [
    {
      factor: "Construction clarity",
      whyItMatters: "Full silicone and silicone-head/TPE-body hybrids are different products even when both use the word silicone.",
      dollWowAdvantage: "DollWow separates material paths and keeps the head, body, measurements, photos, and available options tied to the individual listing."
    },
    {
      factor: "Practical ownership",
      whyItMatters: "A realistic finish is not useful if the doll is too heavy to handle or difficult to clean and store.",
      dollWowAdvantage: "Buyers can compare size, listed weight, availability, care guidance, and support before choosing a build."
    },
    {
      factor: "Build confirmation",
      whyItMatters: "Material, head, body, color, functions, and accessories can change the finished doll and final price.",
      dollWowAdvantage: "DollWow reviews supported choices and provides a factory-approval path for eligible custom builds before shipment."
    }
  ],
  "male-dolls": [
    {
      factor: "Comparable product form",
      whyItMatters: "Full-body dolls and compact male products are different purchases even when they appear in the same search results.",
      dollWowAdvantage: "DollWow shows the dimensions, weight, material, price, and product page needed to compare like with like."
    },
    {
      factor: "Practical ownership",
      whyItMatters: "Height, weight, proportions, cleaning access, and storage space affect every day of ownership.",
      dollWowAdvantage: "The collection connects live products with a male-specific guide, care guidance, shipping information, and support before checkout."
    },
    {
      factor: "Build confidence",
      whyItMatters: "Anatomy, head pairing, material, skeleton, functions, and styling options can vary by exact body.",
      dollWowAdvantage: "DollWow reviews eligible custom selections before production and provides a factory-media approval path where supported."
    }
  ],
  "ready-to-ship": [
    {
      factor: "Timing",
      whyItMatters: "Fast delivery only helps when the exact doll is confirmed as available.",
      dollWowAdvantage: "DollWow separates ready-to-ship listings and tells buyers to confirm current availability before checkout."
    },
    {
      factor: "Configuration",
      whyItMatters: "Warehouse-style listings can have fewer change options than factory orders.",
      dollWowAdvantage: "DollWow links ready-to-ship buyers to custom-order guidance so tradeoffs are clear."
    },
    {
      factor: "Privacy",
      whyItMatters: "Timing and delivery details often matter most when discretion is important.",
      dollWowAdvantage: "The collection links directly to shipping guidance and support."
    }
  ],
  custom: [
    {
      factor: "Option compatibility",
      whyItMatters: "Custom choices can depend on the brand, body, head, and material.",
      dollWowAdvantage: "Each DollWow product page shows the choices and prices available for that specific doll."
    },
    {
      factor: "Production timing",
      whyItMatters: "Custom orders require production time and final photo approval before shipment.",
      dollWowAdvantage: "DollWow links custom buyers to timing and ready-to-ship comparison guidance."
    },
    {
      factor: "Final value",
      whyItMatters: "Options, accessories, shipping, and production path can change the real cost.",
      dollWowAdvantage: "DollWow connects custom pages to cost guides and listing review."
    }
  ],
  customizable: [
    {
      factor: "Option compatibility",
      whyItMatters: "Custom choices can depend on the brand, body, head, and material.",
      dollWowAdvantage: "Each DollWow product page shows the choices and prices available for that specific doll."
    },
    {
      factor: "Production timing",
      whyItMatters: "Custom orders require production time and final photo approval before shipment.",
      dollWowAdvantage: "DollWow links custom buyers to timing and ready-to-ship comparison guidance."
    },
    {
      factor: "Final value",
      whyItMatters: "Options, accessories, shipping, and production path can change the real cost.",
      dollWowAdvantage: "DollWow connects custom pages to cost guides and listing review."
    }
  ]
};

const collectionFaqByHandle: Record<string, { question: string; answer: string }[]> = {
  "sex-dolls": [
    {
      question: "How should I compare sex dolls online?",
      answer:
        "Start with material, height, weight, measurements, stock status, customization options, shipping path, and support quality. Then review the product page for the exact configuration before checkout."
    },
    {
      question: "Are sex doll prices final on collection pages?",
      answer:
        "Collection pages show starting prices. Your final total can change when you add custom options, accessories, or shipping. The product page updates the price as you choose."
    },
    {
      question: "Can DollWow help confirm the exact product before I order?",
      answer:
        "Yes. Ask us to confirm current availability, custom options, or delivery timing whenever those details affect your decision."
    }
  ],
  "realistic-sex-dolls": [
    {
      question: "What makes a sex doll look realistic?",
      answer:
        "Realism usually comes from balanced proportions, face sculpt, skin finish, eyes, hands, material, and how well the final configuration matches the listing photos."
    },
    {
      question: "Do realistic sex dolls always cost more?",
      answer:
        "Not always. Price depends on material, size, brand, customization, stock status, and included options. Compare the exact product facts rather than relying on the realism label alone."
    },
    {
      question: "Should I confirm photos before ordering a realistic doll?",
      answer:
        "Yes. Product photos may show a sample, reference build, or specific configuration. Confirm the exact head, body, material, wig, eyes, and options before checkout."
    }
  ],
  "mini-sex-dolls": [
    {
      question: "What height counts as a mini sex doll?",
      answer:
        "There is no universal industry standard. DollWow uses 120 cm / 3 ft 11 in and under as the mini collection boundary so buyers have a consistent size filter."
    },
    {
      question: "Are mini sex dolls easier to store?",
      answer:
        "Usually, but height is only one factor. Weight, boxed size, storage orientation, material care, and handling needs also matter."
    },
    {
      question: "Are small sex dolls always lightweight?",
      answer:
        "No. A compact doll can still be dense depending on material and internal structure. Check the listed weight before deciding."
    },
    {
      question: "What is the difference between mini and petite sex dolls?",
      answer:
        "DollWow uses mini for full dolls up to 120 cm / 3 ft 11 in and petite for full dolls from 121 to 154 cm / 4 ft to 5 ft 1 in. Compare exact height, weight, and measurements rather than relying on the label alone."
    },
    {
      question: "Does the mini collection include torsos or hips?",
      answer:
        "No. The mini collection is intended for compact full dolls with a known height. Torso and hips products have separate DollWow collection pages."
    }
  ],
  "cheap-sex-dolls": [
    {
      question: "What counts as an affordable sex doll in this collection?",
      answer:
        "The collection currently includes DollWow products with a live starting catalog price of $1,000 or less. The exact total can change with options, shipping, and catalog updates."
    },
    {
      question: "Does a lower price mean lower quality?",
      answer:
        "Not by itself. Price can reflect product form, size, material, brand, included features, stock status, and customization. Compare those facts before judging value."
    },
    {
      question: "Are all results full-size sex dolls?",
      answer:
        "No. Affordable results can include full dolls, mini dolls, torsos, or hips models. Check product form, height, weight, and measurements so you know exactly what you are comparing."
    },
    {
      question: "Is the price shown on the collection page final?",
      answer:
        "It is the current starting catalog price. Open the product page to review the latest price, supported options, and any additional costs before checkout."
    }
  ],
  "height-under-155": [
    {
      question: "Are dolls under 155 cm the same as mini sex dolls?",
      answer:
        "They often overlap, but the labels are not identical across brands. Compare exact height, weight, measurements, and storage needs before deciding."
    },
    {
      question: "Are shorter dolls easier to move?",
      answer:
        "Often, but material and internal structure still matter. A shorter doll can be dense, so use listed weight and boxed dimensions where available."
    },
    {
      question: "What should I confirm before buying a compact doll?",
      answer:
        "Confirm height, weight, key measurements, material, stock status, packaging, and whether the selected options are available for that exact model."
    }
  ],
  tpe: [
    {
      question: "What should I compare on a TPE doll?",
      answer:
        "Compare height, weight, body measurements, TPE formulation notes, stock status, skeleton options, care needs, and whether the product page clearly confirms the exact build."
    },
    {
      question: "Are TPE dolls cheaper than silicone dolls?",
      answer:
        "Many TPE dolls start at a lower price than comparable silicone builds, but final cost depends on size, brand, options, shipping, and availability."
    },
    {
      question: "Do TPE dolls need special care?",
      answer:
        "TPE usually needs careful surface cleaning, drying, and storage. Follow product-specific care guidance because material blends and finishes can vary."
    }
  ],
  silicone: [
    {
      question: "What is a full silicone sex doll?",
      answer:
        "A full silicone sex doll has a silicone body. A product with a silicone head and TPE body is a hybrid build, not a full silicone doll, so check the listed material for both the head and body."
    },
    {
      question: "Are silicone sex dolls more realistic than TPE dolls?",
      answer:
        "Silicone can hold fine sculpt and surface detail well, but the more realistic choice depends on the specific face, proportions, finish, eyes, hands, hair, pose support, and final configuration. Material alone does not guarantee realism."
    },
    {
      question: "Are silicone dolls easier to clean than TPE dolls?",
      answer:
        "Silicone is often less porous than TPE and can be easier to clean at the surface. Every area still needs complete cleaning and drying, and the routine should follow the manufacturer guidance for that product and finish."
    },
    {
      question: "Are all silicone sex dolls soft?",
      answer:
        "No. Silicone formulations, body designs, internal foams, and breast options can produce different firmness levels. Compare model-specific details instead of assuming every silicone doll will feel the same."
    },
    {
      question: "Does platinum silicone mean medical grade?",
      answer:
        "Not by itself. Platinum silicone describes a curing system. A medical-grade or safety certification is a separate claim that should be supported by documentation for the exact material or product."
    },
    {
      question: "What should I compare before buying a silicone sex doll?",
      answer:
        "Compare full-silicone versus hybrid construction, height, listed weight, measurements, firmness, surface finish, stock or production status, supported options, care needs, storage space, and the final configured price."
    }
  ],
  "male-dolls": [
    {
      question: "What should I check first when buying a male sex doll?",
      answer:
        "Start with full-body versus compact form, height, listed weight, body proportions, material, anatomy, storage fit, and whether the exact body supports the options you want."
    },
    {
      question: "How heavy is a full-size male sex doll?",
      answer:
        "Weight varies by height, body sculpt, material, and internal construction. Check the exact listing in pounds and kilograms because similar-height dolls can differ greatly in handling weight."
    },
    {
      question: "Are male sex dolls available in TPE and silicone?",
      answer:
        "Yes. The DollWow catalog includes TPE, full-silicone, and silicone-head/TPE-body hybrid male builds. Compare model-specific feel, weight, finish, care, and price rather than treating one material as universally better."
    },
    {
      question: "Can male sex dolls be customized?",
      answer:
        "Many can, but anatomy, head pairing, skin tone, hair, skeleton features, and other options vary by manufacturer and body. Confirm compatibility for the exact product before production."
    },
    {
      question: "Are male sex dolls only for gay men?",
      answer:
        "No. Adult buyers of different genders and orientations choose male dolls. Compare products around the body, experience, and features you want rather than a marketing label."
    },
    {
      question: "How should I store a male sex doll?",
      answer:
        "Store the doll clean, fully dry, away from heat and direct sunlight, and without concentrated pressure or dark staining fabrics. Use the support position recommended for the exact build."
    },
    {
      question: "Can DollWow review a custom male doll build before production?",
      answer:
        "Eligible custom orders receive a Human Build Check for selected options and obvious compatibility issues before production. Product and manufacturer limits still apply."
    }
  ],
  "ready-to-ship": [
    {
      question: "Are ready-to-ship sex dolls available immediately?",
      answer:
        "They are held in a warehouse for faster dispatch. We still confirm the exact doll, included configuration, and expected dispatch time before payment."
    },
    {
      question: "How are ready-to-ship dolls different from custom orders?",
      answer:
        "Ready-to-ship dolls usually offer fewer changes but dispatch faster. Made-to-order dolls offer more choices and usually take about 3–4 weeks from order to delivery."
    },
    {
      question: "Should I ask for confirmation before buying ready-to-ship?",
      answer:
        "Yes, especially if timing matters. Ask support to confirm the exact unit, current availability, and expected shipping path."
    }
  ],
  custom: [
    {
      question: "What can be customized on a sex doll?",
      answer:
        "Custom options may include the head, skin tone, eyes, hair, makeup, skeleton features, heating, standing feet, and accessories. Available choices vary by model."
    },
    {
      question: "Are all custom options compatible?",
      answer:
        "No. Some options depend on the body, material, or head. The configurator shows the choices available for that specific doll."
    },
    {
      question: "Do custom sex dolls take longer?",
      answer:
        "Yes. Custom dolls need production time, and factory photos and videos are sent for your approval before shipment."
    }
  ],
  customizable: [
    {
      question: "What can be customized on a sex doll?",
      answer:
        "Custom options may include the head, skin tone, eyes, hair, makeup, skeleton features, heating, standing feet, and accessories. Available choices vary by model."
    },
    {
      question: "Are all custom options compatible?",
      answer:
        "No. Some options depend on the body, material, or head. The configurator shows the choices available for that specific doll."
    },
    {
      question: "Do custom sex dolls take longer?",
      answer:
        "Yes. Custom dolls need production time, and factory photos and videos are sent for your approval before shipment."
    }
  ]
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}.`;
}
