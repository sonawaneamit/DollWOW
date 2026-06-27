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
          item: `${siteUrl}/shop`
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
    return `${title} are catalog listings organized for faster warehouse-style comparison. Use this page to compare available models by material, size, price, and configuration before asking support to confirm current stock and delivery timing. Ready-to-ship listings can move faster than custom builds, but the exact product, warehouse status, approval materials, and shipping path should still be confirmed before checkout.`;
  }
  if (preset.filters.availability === "custom") {
    return `${title} help buyers compare build-to-order options, base pricing, material, size, and customization depth before committing to a final configuration. Use the filters to narrow the catalog, then review the product page for option compatibility, supplier limits, production timing, and any details support needs to confirm in writing.`;
  }
  if (preset.filters.material) {
    return `${title} help buyers compare material feel, care needs, price range, weight, and customization tradeoffs across DollWow's catalog. Start with the product facts on this page, then use the related guides below to compare TPE, silicone, hybrid builds, shipping expectations, and maintenance before you choose a specific model.`;
  }
  if (preset.filters.bodyType === "male") {
    return `${title} collect male body-type listings so shoppers can compare height, material, body proportions, stock status, and custom order options in one place. Review measurements and weight carefully, then confirm the exact build path, available options, and delivery timing before checkout.`;
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
        "No. Custom options vary by brand, body model, material, head model, and supplier rules. Product-specific options and incompatibilities should be reviewed on the product page before ordering."
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
    "Shop sex dolls across the full DollWow catalog with filters for material, body type, height, weight, price, stock status, and custom order path. This collection is built for practical comparison before a private purchase. Start with the product facts, then review the matching guide links for cost, materials, realistic features, shipping, and buyer protection. If timing, privacy, or exact configuration matters, ask support to confirm the current listing details before checkout.",
  "realistic-sex-dolls":
    "Realistic sex dolls should be compared by more than face photos. Use this collection to review body proportions, material, skin finish, measurements, weight, and customization options across DollWow listings. A realistic look can depend on the exact head, body, wig, eyes, faceup, and final configuration, so compare the product page carefully and ask support to confirm any detail that affects the finished build.",
  "mini-sex-dolls":
    "Mini sex dolls and compact dolls can be easier to store, move, and plan around, but height alone does not tell the full story. Use this collection to compare smaller listings by weight, measurements, material, stock status, and customization options. Check length, boxed size, storage orientation, and handling needs before choosing a product, especially if privacy or room size is the main reason for buying compact.",
  tpe:
    "TPE dolls are often chosen for a softer feel, flexible posing, and a lower starting price than many silicone builds. Use this collection to compare TPE listings by height, weight, body shape, stock status, and available options. TPE care, surface handling, and supplier formulation can vary, so review the product page and the material guide before choosing a specific doll.",
  silicone:
    "Silicone dolls are often chosen for firmer structure, detailed finish, and easier surface cleaning compared with many TPE builds. Use this collection to compare silicone listings by height, weight, sculpt detail, stock status, and customization depth. Silicone can still vary by brand and body design, so confirm the exact material, head and body construction, and available options before checkout.",
  "male-dolls":
    "Male dolls should be compared by exact body proportions, material, weight, skeleton support, stock status, and custom option limits. Use this collection to narrow DollWow listings by practical buyer needs, then review product pages for measurements, handling expectations, and supplier-specific options. If a build depends on confirmation, support can help verify the current path before checkout.",
  "ready-to-ship":
    "Ready-to-ship sex dolls are the right place to start when timing matters. This collection helps buyers compare listings that are organized for faster warehouse-style fulfillment, with filters for material, size, price, and body type. Stock can change quickly, so confirm the exact unit, current availability, approval materials, and delivery timing before checkout.",
  custom:
    "Custom sex dolls and factory-order listings are for buyers who want more control over the final build. Use this collection to compare base models, materials, size, and customization potential before choosing a configuration. Final options can depend on brand, body model, head model, material, and supplier rules, so confirm compatibility and production timing before checkout.",
  customizable:
    "Custom sex dolls and factory-order listings are for buyers who want more control over the final build. Use this collection to compare base models, materials, size, and customization potential before choosing a configuration. Final options can depend on brand, body model, head model, material, and supplier rules, so confirm compatibility and production timing before checkout."
};

const collectionMetaDescriptions: Record<string, string> = {
  "sex-dolls": "Shop sex dolls by material, height, weight, price, stock status, and custom options with DollWow buyer guides and support links.",
  "realistic-sex-dolls": "Compare realistic sex dolls by proportions, material, measurements, finish, weight, and customization before choosing a DollWow listing.",
  "mini-sex-dolls": "Compare mini sex dolls and compact models by height, weight, measurements, material, storage needs, stock status, and options.",
  tpe: "Shop TPE dolls by height, weight, body shape, price, stock status, and options, with DollWow material and care guidance.",
  silicone: "Shop silicone dolls by sculpt detail, height, weight, material, customization, and stock status with DollWow buying guidance.",
  "male-dolls": "Compare male dolls by body proportions, material, weight, measurements, stock status, and custom option limits.",
  "ready-to-ship": "Browse ready-to-ship sex dolls organized for faster fulfillment, with stock, configuration, shipping, and support details to confirm.",
  custom: "Compare custom sex dolls and factory-order listings by base model, material, size, options, compatibility, and production timing.",
  customizable: "Compare custom sex dolls and factory-order listings by base model, material, size, options, compatibility, and production timing."
};

const collectionLinksByHandle: Record<string, RelatedLink[]> = {
  "sex-dolls": [
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "realistic-sex-dolls": [
    { label: "Most realistic sex dolls guide", href: "/learn/most-realistic-sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" }
  ],
  "mini-sex-dolls": [
    { label: "Mini sex dolls guide", href: "/learn/mini-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  "height-under-155": [
    { label: "Mini sex dolls guide", href: "/learn/mini-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  tpe: [
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "What TPE material means", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  silicone: [
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Most realistic sex dolls guide", href: "/learn/most-realistic-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  "male-dolls": [
    { label: "Male sex doll buying guide", href: "/learn/male-sex-doll-buying-guide" },
    { label: "Compare ready-to-ship and custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "ready-to-ship": [
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" }
  ],
  custom: [
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  customizable: [
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
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
        "Collection pages show catalog pricing, but the final total can depend on options, shipping, and any required supplier confirmation. Review the product page and checkout details before paying."
    },
    {
      question: "Can DollWow help confirm the exact product before I order?",
      answer:
        "Yes. If a listing depends on current stock, supplier details, custom options, or timing, ask support to confirm the important details before checkout."
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
      question: "What should I compare first on a mini sex doll?",
      answer:
        "Compare height, weight, bust, waist, hips, material, stock status, and storage needs. If a key measurement is missing, ask support before ordering."
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
      question: "What should I compare on a silicone doll?",
      answer:
        "Compare sculpt detail, height, weight, body measurements, head and body construction, stock status, customization options, and care expectations."
    },
    {
      question: "Are silicone dolls more realistic?",
      answer:
        "Silicone can hold fine detail well, but realism also depends on face sculpt, proportions, skin finish, eyes, wig, pose, and the final configuration."
    },
    {
      question: "Are silicone dolls easier to clean than TPE dolls?",
      answer:
        "Silicone is often easier to clean at the surface, but care still depends on the exact product, finish, and manufacturer guidance."
    }
  ],
  "male-dolls": [
    {
      question: "What should I check first on a male sex doll?",
      answer:
        "Start with height, weight, shoulder width, waist, hips, material, stock status, and whether custom options are supported for that exact body."
    },
    {
      question: "Do male dolls have the same options as other dolls?",
      answer:
        "Not always. Supplier options can vary by body type, head model, material, and production path, so product-specific confirmation matters."
    },
    {
      question: "Can DollWow confirm a male doll build before checkout?",
      answer:
        "Yes. Support can help confirm current stock, available options, production timing, and any supplier details that affect the final order."
    }
  ],
  "ready-to-ship": [
    {
      question: "Are ready-to-ship sex dolls available immediately?",
      answer:
        "They are organized for faster fulfillment, but current stock, exact configuration, approval materials, and shipping timing should still be confirmed before checkout."
    },
    {
      question: "How are ready-to-ship dolls different from custom orders?",
      answer:
        "Ready-to-ship listings usually have less configuration flexibility but can move faster. Custom orders allow more choices but depend on supplier rules and production timing."
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
        "Custom options can include body model, head, skin tone, eyes, wig, makeup, skeleton features, heating, standing feet, and accessories, but availability varies by supplier and model."
    },
    {
      question: "Are all custom options compatible?",
      answer:
        "No. Some options depend on body type, material, head model, and supplier rules. Product-specific confirmation is important before checkout."
    },
    {
      question: "Do custom sex dolls take longer?",
      answer:
        "Usually yes. Custom builds can require supplier confirmation, production time, and final approval materials before shipment."
    }
  ],
  customizable: [
    {
      question: "What can be customized on a sex doll?",
      answer:
        "Custom options can include body model, head, skin tone, eyes, wig, makeup, skeleton features, heating, standing feet, and accessories, but availability varies by supplier and model."
    },
    {
      question: "Are all custom options compatible?",
      answer:
        "No. Some options depend on body type, material, head model, and supplier rules. Product-specific confirmation is important before checkout."
    },
    {
      question: "Do custom sex dolls take longer?",
      answer:
        "Usually yes. Custom builds can require supplier confirmation, production time, and final approval materials before shipment."
    }
  ]
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}.`;
}
