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
  guideHref?: string;
  guideLabel?: string;
  buyerNotes: Array<{ title: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

const brandProfiles: Record<string, Partial<BrandSeoProfile>> = {
  wm: {
    positioning:
      "WM Dolls is usually compared for broad catalog depth, many body styles, and a wide range of customization paths.",
    guideHref: "/learn/wm-dolls-buying-guide",
    guideLabel: "WM Dolls buying guide"
  },
  irontech: {
    positioning:
      "Irontech Dolls is often compared by buyers who care about detailed sculpting, fantasy styling, male dolls, and premium silicone-style presentation.",
    guideHref: "/learn/irontech-dolls-buying-guide",
    guideLabel: "Irontech Dolls buying guide"
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
  }
};

export function buildBrandMetadata(brand: CatalogBrand): Metadata {
  const title = `${brand.label} Dolls: Shop ${brand.label} Models`;
  const description = `${brand.label} models on DollWow with product facts, pricing, material, size, stock path, customization notes, buyer guides, and discreet support.`;
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
      name: `${brand.label} Dolls`,
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
    `${brand.label} is part of the DollWow catalog and should be compared by product facts, current options, material, size, and support-confirmed order path.`;

  return {
    intro:
      custom.intro ??
      `Shop ${brand.label} dolls on DollWow with crawlable product facts for material, size, price, stock path, and customization. ${positioning} Use this brand hub to compare current catalog listings, then open each product page for exact measurements, images, options, and support confirmation before checkout.`,
    positioning,
    guideHref: custom.guideHref,
    guideLabel: custom.guideLabel,
    buyerNotes: custom.buyerNotes ?? defaultBuyerNotes(brand),
    faqs: custom.faqs ?? defaultFaqs(brand)
  };
}

export function brandRelatedLinks(brand: CatalogBrand) {
  const profile = brandSeoProfile(brand);
  return [
    ...(profile.guideHref && profile.guideLabel ? [{ label: profile.guideLabel, href: profile.guideHref }] : []),
    { label: "Compare all sex dolls", href: "/shop/sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Ready-to-ship vs custom", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Ask about price match", href: "/compare" }
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
      body: "Compare base price, options, shipping path, support confirmation, and privacy needs before choosing a listing."
    }
  ];
}

function defaultFaqs(brand: CatalogBrand) {
  return [
    {
      question: `How should I compare ${brand.label} dolls?`,
      answer: `Compare ${brand.label} models by material, height, weight, measurements, body type, stock path, customization availability, and delivered value.`
    },
    {
      question: `Can every ${brand.label} model use the same custom options?`,
      answer:
        "No. Option availability can vary by body, head, material, supplier rules, and current product setup. Confirm product-specific options before ordering."
    },
    {
      question: `Does DollWow confirm ${brand.label} stock and order details?`,
      answer:
        "Yes. Current stock, custom timing, option compatibility, and delivery expectations should be confirmed before checkout when those details affect the order."
    }
  ];
}
