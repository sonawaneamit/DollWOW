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
  irontech: {
    positioning:
      "Irontech has produced dolls since 2015 and is known for a broad choice of full-silicone, TPE, hybrid, female, and male models, including advanced head and skeleton options on supported builds.",
    intro:
      "Compare current Irontech Dolls on DollWow by material, body size, listed weight, head system, price, availability, and supported options. Irontech has produced dolls since 2015 and offers full-silicone, TPE, hybrid, female, and male models. Because compatibility varies by body and head, DollWow reviews complex custom builds before production.",
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
      "Starpery Dolls is often evaluated for realistic styling, silicone-focused builds, and product-photo presentation.",
    guideHref: "/learn/starpery-dolls-buying-guide",
    guideLabel: "Starpery Dolls buying guide"
  },
  sedoll: {
    positioning:
      "SE Doll is commonly compared by buyers looking at realistic face detail, body proportions, and silicone or hybrid build options.",
    guideHref: "/learn/se-doll-buying-guide",
    guideLabel: "SE Doll buying guide"
  },
  zelex: {
    positioning:
      "Zelex Dolls is often compared for premium realism, detailed facial work, and silicone-focused catalog options.",
    guideHref: "/learn/zelex-dolls-buying-guide",
    guideLabel: "Zelex Dolls buying guide"
  },
  "6ye": {
    positioning:
      "6YE Dolls is often compared by buyers reviewing price, body scale, and practical catalog options across silicone and related builds.",
    guideHref: "/learn/6ye-dolls-buying-guide",
    guideLabel: "6YE Dolls buying guide"
  },
  piper: {
    positioning:
      "Piper Dolls is often compared by buyers looking for compact sizes, anime-inspired styling, and practical storage considerations.",
    guideHref: "/learn/piper-dolls-buying-guide",
    guideLabel: "Piper Dolls buying guide"
  },
  tantaly: {
    positioning:
      "Tantaly is often compared by buyers looking for compact, storage-friendly, or budget-aware doll options.",
    guideHref: "/learn/tantaly-buying-guide",
    guideLabel: "Tantaly buying guide"
  },
  erovenus: {
    positioning:
      "Erovenus focuses on silicone torso and compact body formats with detailed sculpting, layered body painting, and model-specific proportions.",
    intro:
      "Compare current Erovenus dolls on DollWow by product form, silicone construction, height, width, depth, proportions, starting price, and current ordering path. Erovenus describes its development as following the creation of LoveNestle in 2023, with a focus on silicone torso products and hand-finished surface detail. Confirm the exact model, dimensions, weight, included body areas, and care instructions before ordering.",
    metaDescription:
      "Shop Erovenus silicone torso and compact dolls by product form, dimensions, proportions, price, care needs, and current ordering details.",
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
  const title = `${brandHubTitle(brand)}: Shop ${brand.label} Models`;
  const profile = brandSeoProfile(brand);
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
