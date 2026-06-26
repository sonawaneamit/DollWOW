import type { Metadata } from "next";
import { env } from "@/lib/utils/env";
import type { Product } from "@/types/product";
import { productBodyLabel } from "@/lib/catalog/bodyType";
import { productDisplayNameForUi, productPublicTitle, productSeoAliases, productSeoTitle } from "./naming";
import { productMeasurementSpecs } from "./productSpecs";

type IntentChip = {
  label: string;
  keyword: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type DecisionNote = {
  title: string;
  body: string;
};

type TrustSignal = {
  title: string;
  body: string;
  href: string;
  label: string;
};

type FitCheck = {
  title: string;
  body?: string;
  lines?: string[];
};

const HIGH_CUPS = new Set(["F", "G", "H", "I", "J", "K", "L", "M"]);
const SMALL_CUPS = new Set(["A", "B", "C"]);

export function buildPdpMetadata(product: Product): Metadata {
  const title = productSeoTitle(product);
  const description = buildPdpMetaDescription(product);
  const keywords = productKeywordSet(product);
  const canonicalUrl = productCanonicalUrl(product);
  const image = product.featuredImage?.url;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "DollWow",
      images: image ? [{ url: image, alt: product.featuredImage?.altText || title }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export function buildPdpSearchFit(product: Product) {
  const brand = product.extended.brand || product.vendor || "DollWow";
  const brandCopy = cleanText(brand).replace(/\s+dolls$/i, "");
  const orderType = product.extended.stockStatus === "ready_to_ship" ? "ready to ship" : product.extended.customAvailable ? "custom order" : "special order";
  const material = product.extended.material || inferredMaterial(product);
  const bodyLabel = productBodyLabel(product);
  const height = product.extended.heightCm ? `${product.extended.heightCm} cm` : "confirmed size";
  const normalizedCup = normalizeCup(product.extended.cupSize);
  const cup = normalizedCup ? `${normalizedCup}-Cup` : "body profile";
  const chips = buildIntentChips(product).slice(0, 6);
  const materialPhrase = materialLabel(material);
  const fitPhrase = buildFitPhrase(product, height, cup);
  const customPhrase =
    product.extended.customAvailable === false
      ? "base setup shown on the page"
      : "base setup first, with custom options shown before checkout";

  return {
    title: "At a glance",
    summary: `${capitalize(orderType)} ${brandCopy} ${bodyLabel} with ${fitPhrase}, ${materialPhrase}, and ${customPhrase}. Most shoppers compare full measurements, options, and discreet checkout details before deciding.`,
    chips
  };
}

export function buildPdpDecisionNotes(product: Product): DecisionNote[] {
  const height = product.extended.heightCm ? `${product.extended.heightCm} cm` : "Confirmed size";
  const normalizedCup = normalizeCup(product.extended.cupSize);
  const cup = normalizedCup ? `${normalizedCup}-Cup` : "profile";
  const cupPhrase = cup === "profile" ? cup : phraseWithArticle(cup, "profile");
  const material = product.extended.material || inferredMaterial(product);
  const bodyLabel = productBodyLabel(product);
  const stock = product.extended.stockStatus === "ready_to_ship" ? "Ready to ship after stock confirmation." : "Built to order with timing confirmed before production.";
  const custom = product.extended.customAvailable === false ? "The page shows a fixed setup." : "The page starts from the factory default, then shows available custom choices and pricing.";
  const sizeNote =
    product.extended.heightCm && product.extended.heightCm <= 155
      ? "Shorter frame that is easier to compare for storage, display, and handling."
      : product.extended.heightCm && product.extended.heightCm >= 170
        ? "Taller frame with longer limb proportions and a bigger overall footprint."
        : "Mid-height frame with balanced proportions for everyday comparison.";

  return [
    {
      title: "Frame and fit",
      body: `${height} ${bodyLabel} with ${cupPhrase}. ${sizeNote}`
    },
    {
      title: "Build and options",
      body: `${materialLabel(material, false)}. ${custom}`
    },
    {
      title: "Order timing",
      body: stock
    }
  ];
}

export function buildPdpTrustSignals(product: Product): TrustSignal[] {
  const readyToShip = product.extended.stockStatus === "ready_to_ship";
  const timing = readyToShip
    ? "Stock is confirmed first, then warehouse release usually follows in 2-3 business days."
    : `Custom builds usually take about ${product.extended.deliveryEstimate ?? "3-5 weeks"} before release, with approval before shipment.`;

  return [
    {
      title: "Buyer protection",
      body: "Arrival issues, major transit damage, and final-build review all have clear support rules.",
      href: "/buyer-protection",
      label: "See protection"
    },
    {
      title: readyToShip ? "Warehouse shipping" : "Factory photo approval",
      body: readyToShip
        ? timing
        : "Detailed factory photos and videos are shared before shipment, with cosmetic revisions allowed before final approval.",
      href: readyToShip ? "/shipping-protection" : "/how-ordering-works",
      label: readyToShip ? "Shipping details" : "How approval works"
    },
    {
      title: "Private delivery",
      body: "Plain packaging, neutral billing, and team review are included from checkout to delivery.",
      href: "/shipping-protection",
      label: "Delivery details"
    }
  ];
}

export function buildPdpFitChecks(product: Product): FitCheck[] {
  const measurements = productMeasurementSpecs(product);
  const measurementMap = new Map(measurements.map((item) => [item.label, item.value]));
  const bust = measurementMap.get("Bust");
  const waist = measurementMap.get("Waist");
  const hip = measurementMap.get("Hip");
  const legs = measurementMap.get("Legs Length");
  const height = measurementMap.get("Height");
  const weight = measurementMap.get("Weight");
  const cupSize = measurementMap.get("Cup size");
  const feet = measurementMap.get("Feet Length");
  const vaginaDepth = measurementMap.get("Vagina Depth");
  const anusDepth = measurementMap.get("Anus Depth");
  const oralDepth = measurementMap.get("Oral Depth");
  const material = (product.extended.material || inferredMaterial(product)).toLowerCase();
  const stockStatus = product.extended.stockStatus;
  const numericHeight = Number(product.extended.heightCm || 0);
  const numericWeight = Number(product.extended.weightLb || 0);

  const sizeLine = [labeledMeasurement("Height", height), labeledMeasurement("Weight", weight), labeledMeasurement("Cup size", cupSize)]
    .filter(Boolean)
    .join(" • ");
  const fitLine = [
    labeledMeasurement("Bust", bust),
    labeledMeasurement("Waist", waist),
    labeledMeasurement("Hip", hip),
    labeledMeasurement("Legs", legs)
  ]
    .filter(Boolean)
    .join(" • ");
  const depthLine = [
    labeledMeasurement("Vagina depth", vaginaDepth),
    labeledMeasurement("Anus depth", anusDepth),
    labeledMeasurement("Oral depth", oralDepth)
  ]
    .filter(Boolean)
    .join(" • ");
  const feetLine = labeledMeasurement("Feet", feet);
  const materialNote = material.includes("silicone head")
    ? "Silicone head build with a lighter body-oriented setup and more face-detail focus."
    : material.includes("silicone")
      ? "Full silicone build with a denser, premium-feel material and more carrying weight."
      : material.includes("tpe")
        ? "TPE build with a softer, more flexible feel that many shoppers compare on value and realism."
        : "Material details can be confirmed with the team before checkout.";
  const handlingNote =
    numericWeight >= 90 || numericHeight >= 170
      ? "Larger overall footprint. Worth checking lifting comfort, storage, and room setup before ordering."
      : numericHeight > 0 && numericHeight <= 155
        ? "Smaller frame that is usually easier to compare for storage, handling, and display."
        : "Mid-range size profile that usually balances presence, handling, and storage more easily.";
  const orderNote =
    stockStatus === "ready_to_ship"
      ? "Ready-to-ship orders usually leave within 1-3 business days after stock confirmation, and tracking is issued once the shipment is booked."
      : "Custom orders usually take about 3-5 weeks from order to delivery, with option review and factory approval before shipment is released.";

  return [
    {
      title: "Core size reference",
      body: sizeLine ? undefined : "Height, carrying weight, and cup profile are confirmed before checkout.",
      lines: sizeLine ? sizeLine.split(" • ") : undefined
    },
    {
      title: "Clothing and fit",
      body: fitLine ? undefined : "Bust, waist, and hip are the main checks for lingerie, dresses, and close-fitting outfits.",
      lines: fitLine ? fitLine.split(" • ") : undefined
    },
    {
      title: "Material and handling",
      body: `${materialNote} ${handlingNote}`
    },
    {
      title: "Shoes and depth",
      body: [feetLine, depthLine].filter(Boolean).length
        ? "Feet length helps with shoe sizing. Depth measurements help compare inserts and fit preferences."
        : `${orderNote} Feet length and depth specs can be confirmed with our team before checkout.`,
      lines: [feetLine, depthLine].filter(Boolean).length
        ? [feetLine, depthLine].filter(Boolean).flatMap((entry) => String(entry).split(" • ").filter(Boolean))
        : undefined
    },
    {
      title: "Order timing",
      body: orderNote
    }
  ];
}

function labeledMeasurement(label: string, value?: string) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  if (/^confirm with team$/i.test(cleaned)) return "";
  if (/^(n\/a|na|not applicable)$/i.test(cleaned)) return "";
  return `${label}: ${cleaned}`;
}

export function buildProductStructuredData(product: Product) {
  const publicTitle = productPublicTitle(product);
  const canonicalUrl = productCanonicalUrl(product);
  const brand = product.extended.brand || product.vendor || "DollWow";
  const material = product.extended.material || inferredMaterial(product);
  const measurements = productMeasurementSpecs(product);
  const keywords = productKeywordSet(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: publicTitle,
    description: buildPdpMetaDescription(product),
    url: canonicalUrl,
    image: product.images.map((image) => image.url).filter(Boolean),
    brand: {
      "@type": "Brand",
      name: brand
    },
    category: material ? `${material} companion doll` : "Companion doll",
    material: material || undefined,
    sku: product.handle,
    mpn: product.extended.catalogIdentityKey || product.extended.catalogBodyIdentityKey || undefined,
    keywords: keywords.join(", "),
    additionalProperty: measurements.map((measurement) => ({
      "@type": "PropertyValue",
      name: measurement.label,
      value: measurement.value
    })),
    offers: {
      "@type": "Offer",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      availability:
        product.extended.stockStatus === "ready_to_ship"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
      url: canonicalUrl
    }
  };
}

export function buildProductFaqStructuredData(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pdpFaqItems(product).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function pdpFaqItems(product: Product): FaqItem[] {
  const readyToShip = product.extended.stockStatus === "ready_to_ship";
  const hasCustom = product.extended.customAvailable !== false;
  const delivery = product.extended.deliveryEstimate || (readyToShip ? "warehouse timing is confirmed after stock check" : "timing depends on the selected build");

  return [
    {
      question: "How does delivery work for this build?",
      answer: readyToShip
        ? `This model is listed as ready to ship. Our team confirms stock, timing, and release details before it moves out for discreet delivery. Current timing: ${delivery}.`
        : `This model is built to order. We confirm timing, compatibility, and order notes before production starts. Current timing: ${delivery}.`
    },
    {
      question: "Can I customize this doll before checkout?",
      answer: hasCustom
        ? "Yes. The page shows the default build first, then lets you review available options and price changes before checkout."
        : "This listing is treated as a fixed configuration. If you need a different setup, our team can confirm whether another version is available."
    },
    {
      question: "Do I get factory approval photos before shipment?",
      answer: readyToShip
        ? "Warehouse dolls usually move faster, but our team can still confirm what final approval material is available before the order ships."
        : "Yes. For custom builds, we request detailed factory photos and videos before shipment so you can approve the final look or ask for revisions."
    },
    {
      question: "Can DollWow check a lower price on another site?",
      answer:
        "Yes. Send us the listing and our team can compare the product match, shipping, and total price before we confirm any price-match support."
    }
  ];
}

function buildPdpMetaDescription(product: Product) {
  const publicTitle = productPublicTitle(product);
  const material = product.extended.material || inferredMaterial(product);
  const bodyLabel = productBodyLabel(product);
  const stock = product.extended.stockStatus === "ready_to_ship" ? "ready to ship" : product.extended.customAvailable ? "customizable" : "made to order";
  const height = product.extended.heightCm ? `${product.extended.heightCm} cm` : "";
  const weight = product.extended.weightLb ? `${product.extended.weightLb} lb` : "";
  const cup = product.extended.cupSize ? `${normalizeCup(product.extended.cupSize)}-Cup` : "";
  const factLine = [height, weight, cup].filter(Boolean).join(", ");
  const compareTerms = buildIntentChips(product)
    .slice(0, 4)
    .map((chip) => chip.label.toLowerCase())
    .join(", ");

  const description = [
    `${publicTitle} is a ${stock} ${material.toLowerCase()} ${bodyLabel}.`,
    factLine ? `Compare ${factLine}, detailed measurements, and option depth before checkout.` : "Compare detailed measurements and option depth before checkout.",
    compareTerms ? `Useful for ${compareTerms} searches.` : "",
    "Private checkout and team review included."
  ]
    .filter(Boolean)
    .join(" ");

  return truncate(description, 158);
}

function buildFitPhrase(product: Product, height: string, cup: string) {
  const fitBits = [];
  if (height) fitBits.push(phraseWithArticle(height, "frame"));
  if (cup) fitBits.push(`${cup} profile`);
  if (!fitBits.length) {
    const displayName = productDisplayNameForUi(product);
    return displayName ? `${displayName.toLowerCase()} styling cues` : "confirmed proportions";
  }
  return fitBits.join(" and ");
}

function productKeywordSet(product: Product) {
  const aliases = productSeoAliases(product);
  const intentKeywords = buildIntentChips(product).map((chip) => chip.keyword);
  return Array.from(
    new Set(
      [...aliases, ...intentKeywords]
        .map((value) => cleanText(value))
        .filter(Boolean)
    )
  );
}

function buildIntentChips(product: Product): IntentChip[] {
  const text = searchableText(product);
  const chips: IntentChip[] = [];
  const material = (product.extended.material || inferredMaterial(product)).toLowerCase();
  const brand = cleanText(product.extended.brand || product.vendor);
  const height = Number(product.extended.heightCm || 0);
  const cup = normalizeCup(product.extended.cupSize);

  if (material.includes("silicone head")) chips.push({ label: "Silicone head build", keyword: "silicone head sex doll" });
  else if (material.includes("silicone")) chips.push({ label: "Silicone build", keyword: "silicone sex doll" });
  else if (material.includes("tpe")) chips.push({ label: "TPE build", keyword: "tpe sex doll" });

  chips.push({ label: "Realistic build", keyword: "realistic sex doll" });

  if (product.extended.stockStatus === "ready_to_ship") chips.push({ label: "Ready to ship", keyword: "ready to ship sex doll" });
  else if (product.extended.customAvailable) chips.push({ label: "Custom order", keyword: "custom sex doll" });

  if (height && height <= 155) chips.push({ label: "Petite size", keyword: "petite sex doll" });
  if (height >= 170) chips.push({ label: "Tall size", keyword: "tall sex doll" });

  if (cup && HIGH_CUPS.has(cup)) chips.push({ label: "Full bust profile", keyword: "big breast sex doll" });
  if (cup && SMALL_CUPS.has(cup)) chips.push({ label: "Smaller bust profile", keyword: "small breast sex doll" });

  if (/\banime\b/.test(text)) chips.push({ label: "Anime style", keyword: "anime sex doll" });
  if (/\b(asian|oriental|japanese|korean)\b/.test(text)) chips.push({ label: "Asian-inspired look", keyword: "asian sex doll" });

  if (hasOptionLabel(product, ["black skin", "dark skin", "dark tanned skin"])) {
    chips.push({ label: "Black skin option", keyword: "black sex doll" });
  }

  if (brand) chips.push({ label: brand, keyword: `${brand.toLowerCase()} dolls` });

  return dedupeChips(chips);
}

function hasOptionLabel(product: Product, labels: string[]) {
  const wanted = labels.map((label) => label.toLowerCase());
  return (
    product.extended.customizationGroups?.some((group) =>
      group.options.some((option) => wanted.includes(cleanText(option.label).toLowerCase()))
    ) ?? false
  );
}

function dedupeChips(chips: IntentChip[]) {
  const seen = new Set<string>();
  return chips.filter((chip) => {
    const key = chip.keyword.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchableText(product: Product) {
  return cleanText(
    [
      product.title,
      product.description,
      product.extended.sourceTitle,
      product.extended.sourceHandle?.replace(/-/g, " "),
      product.tags.join(" "),
      ...(product.extended.customizationGroups?.flatMap((group) => [group.label, ...group.options.map((option) => option.label)]) ?? [])
    ].join(" ")
  ).toLowerCase();
}

function productCanonicalUrl(product: Product) {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/products/${product.handle}`;
}

function normalizeCup(value?: string | null) {
  const text = cleanText(value);
  const normalized = text
    .toLowerCase()
    .replace(/(?:-|\/|\s)*cup$/i, "")
    .replace(/[^a-z0-9]+/g, "");
  if (!normalized || ["na", "nacup", "none", "notapplicable", "nocup"].includes(normalized)) return "";
  const match = text.match(/[A-Z]/i);
  return match ? match[0].toUpperCase() : "";
}

function materialLabel(material: string, withArticle = true) {
  const normalized = cleanText(material).toLowerCase();
  if (normalized === "silicone head") return withArticle ? "a silicone head build" : "Silicone head build";
  if (normalized === "silicone") return withArticle ? "a silicone build" : "Silicone build";
  if (normalized === "tpe") return withArticle ? "a TPE build" : "TPE build";
  if (!normalized) return withArticle ? "a confirmed build" : "Confirmed build";
  return withArticle ? phraseWithArticle(normalized, "build") : `${cleanText(material)} build`;
}

function phraseWithArticle(value: string, suffix: string) {
  const text = cleanText(value);
  const article = /^[aeiou]/i.test(text) ? "an" : "a";
  return `${article} ${text} ${suffix}`;
}

function inferredMaterial(product: Product) {
  const text = `${product.title} ${product.description} ${product.productType}`.toLowerCase();
  if (text.includes("silicone head")) return "Silicone Head";
  if (text.includes("silicone")) return "Silicone";
  if (text.includes("tpe")) return "TPE";
  return "Companion Doll";
}

function truncate(value: string, max = 160) {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).replace(/\s+\S*$/, "").trimEnd();
}

function cleanText(value: string | undefined | null) {
  return String(value || "")
    .replace(/\.([A-Z])/g, ". $1")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalize(value: string) {
  const text = cleanText(value);
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : "";
}
