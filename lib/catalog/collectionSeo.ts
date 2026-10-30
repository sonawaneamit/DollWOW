import type { Metadata } from "next";
import type { Product } from "@/types/product";
import { env } from "@/lib/utils/env";
import { isIndexableShopCollectionHandle, type CatalogFilters } from "./filters";
import { productPublicTitle } from "./naming";
import { batchEBuyerPreviewEnabled } from "./batchEBuyerPreview";

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
  const title = collectionMetadataTitle(handle, preset);
  const description = collectionDescription(handle, preset);
  const canonicalUrl = collectionCanonicalUrl(handle);
  const isFacetView = hasFacetParams(searchParams);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: isFacetView || !isIndexableShopCollectionHandle(handle) ? { index: false, follow: true } : { index: true, follow: true },
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

export function buildCollectionStructuredData({ handle, preset, products }: CollectionContext, { visiblePage = false }: { visiblePage?: boolean } = {}) {
  const title = collectionTitle(preset);
  const description = collectionDescription(handle, preset);
  const url = collectionCanonicalUrl(handle);
  const faq = collectionFaqItems(handle, preset);
  const itemListProducts = visiblePage ? products : products.slice(0, 24);

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
  if (batchEBuyerPreviewEnabled(`/shop/${handle}`)) {
    if (handle === "hips") return "Explore lower-body doll designs and compare their photos, waist and hip measurements, listed weight and material. Hips and full torsos are different shapes, so check what is included on each listing. Match the dimensions to your space before choosing.";
    if (handle === "redhead-dolls") return "Explore dolls photographed with red or auburn hair. The pictured wig may not be included, and each model offers its own hair choices. Compare the head, body measurements and listed weight, then check the included hair on your chosen product page.";
  }
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

function collectionMetadataTitle(handle: string, preset: CollectionPreset) {
  const titleByHandle: Record<string, string> = {
    "sex-dolls": "Sex Dolls for Sale | TPE, Silicone & Custom Dolls",
    silicone: "Silicone Sex Dolls for Sale | Full Silicone Dolls",
    tpe: "TPE Sex Dolls for Sale | Full-Body TPE Dolls",
    "mini-sex-dolls": "Mini Sex Dolls for Sale | Full Dolls Up to 120 cm",
    "male-dolls": "Male Sex Dolls for Sale | TPE, Silicone & Custom",
    "female-dolls": "Female Sex Dolls for Sale",
    "cheap-sex-dolls": "Affordable Sex Dolls for Sale | Options Under $1,000",
    "realistic-sex-dolls": "Most Realistic Sex Dolls for Sale | Compare Realism",
    custom: "Custom Sex Dolls for Sale | Build & Compare Options",
    "curvy-dolls": "Curvy Sex Dolls | Compare Shapes & Measurements",
    "brunette-dolls": "Brunette Sex Dolls | Compare Hair & Styling",
    "blonde-dolls": "Blonde Sex Dolls | Compare Hair & Styling",
    "tan-skin-dolls": "Tan Skin Sex Dolls | Compare Shades & Builds",
    hips: "Hips Sex Dolls | Compare Lower-Body Products",
    "redhead-dolls": "Redhead Sex Dolls | Compare Hair & Styling"
  };
  return titleByHandle[handle] ?? collectionTitle(preset);
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
  hips: "Compare lower-body hips products by the exact body areas included, complete dimensions, listed weight, material, starting price and ordering path. A hips model is not a complete doll or an upper-body torso, and product names or photographs do not guarantee identical anatomy, included accessories or supported options. Check width, depth and height together, then plan the space and handling needed for cleaning, drying and storage. Use the exact product specification rather than treating the category as a standard size or construction.",
  "redhead-dolls": "Compare sex dolls presented with red, auburn or similar hair in current catalog imagery and styling. Confirm the exact listing's included hair and supported choices: the photograph does not guarantee a red wig, fixed hair color, implanted construction or every alternative look. Compare the underlying head and body pairing, product form, material, complete measurements, listed weight, price and availability separately from the hairstyle.",
  "blonde-dolls": "Compare sex dolls presented with blonde or light-colored hair in current catalog imagery. The pictured look does not guarantee an included wig, a permanently fixed hair color, implanted hair, or every styling choice. Check the exact listing's included hair and supported alternatives, then compare head and body pairing, product form, material, measurements, listed weight, starting price, and ordering path. A hairstyle is one part of the presentation, not proof that the underlying doll or its available options match another model.",
  "tan-skin-dolls": "Compare sex dolls presented with tan skin tones, using the exact shade name and product gallery for the manufacturer and build you are considering. Lighting, photography, makeup and screen settings can change how a tone appears. This category does not assign ethnicity or guarantee one universal tan shade, material, product form or set of options. Confirm the included skin tone and exact head and body pairing; fixed warehouse builds and custom-made choices should be checked separately.",
  "curvy-dolls": "Compare sex dolls grouped by curvy or full-bust appearance cues in the current catalog. This category does not guarantee the same bust, waist, hip proportions, weight, or product form across results. Read the exact measurements and full gallery, then compare body and head construction, included body areas, starting price, availability, and supported options. The separate Fuller collection uses its own fuller-build grouping; appearance categories can overlap, so choose from the actual product details rather than treating either label as a standardized body size.",
  "brunette-dolls": "Compare sex dolls presented with brown or brunette hair in current catalog imagery and styling. The photographed hairstyle does not establish a permanently fixed color, an included wig, an implanted-hair option, or availability of every styling choice. Check the exact listing's included hair and supported choices alongside the head and body pairing, product form, material, measurements, listed weight, price, and ordering path. Hair presentation does not determine the doll's construction, skin tone, size, or finished configuration.",
  "sex-dolls":
    "Browse the complete current DollWow sex doll catalog and filter by material, body type, height, weight, price, availability, brand, and custom options. Open any product to compare its exact measurements, photos, starting price, configuration, and ordering path. If a model or detail you need is missing, ask our team through live chat or hello@dollwow.com and we will check it for you.",
  "realistic-sex-dolls":
    "Shop full-body, full-silicone candidates for the most realistic sex doll based on proportions, face sculpt, skin finish, eyes, hands, feet, measurements, weight, and final configuration. Full silicone is a useful starting pool for fine sculpt detail, but material and price do not create an objective realism ranking. Compare several angles, verify the exact head-and-body pairing, and consider TPE or hybrid builds when softness, feel, or a different construction matters more to you.",
  "mini-sex-dolls":
    "Compare full mini sex dolls with a known height up to 120 cm / 3 ft 11 in. Mini describes physical size only, and every DollWow product is sold for adults. DollWow keeps torsos, hips, unknown-height products, and taller petite dolls out of this collection rather than filling it with misleading results. Compare listed weight, complete measurements, material, availability, customization, storage orientation, and handling needs. If no matching model is currently shown, ask our team to check an approved product or compare the separate petite collection from 121 to 154 cm / 4 ft to 5 ft 1 in.",
  "petite-dolls":
    "Shop petite sex dolls with a known height from 121 to 154 cm / 4 ft to 5 ft 1 in. This collection is limited to complete dolls and keeps mini dolls up to 120 cm / 3 ft 11 in, torsos, hips products, and standalone heads on separate paths. Compare listed weight, body measurements, material, proportions, delivery route, cleaning space, storage, and supported options before choosing a compact full-body model.",
  "cheap-sex-dolls":
    "Affordable sex dolls can offer a practical entry point without reducing the decision to price alone. This collection uses current DollWow starting prices to show models at $1,000 or less, sorted from lowest to highest. Compare material, size, weight, product form, availability, and included features, then open the product page to check the live price and exact configuration before ordering.",
  "lightweight-sex-dolls":
    "Shop full-body lightweight sex dolls with a positive listed weight of 74 lb or less (about 33.6 kg). This is the collection's current filter boundary, not a universal industry standard or a promise that every model will feel easy for every buyer to lift. Compare exact weight, height, width, material, grip points, delivery access, cleaning route, and storage position before choosing. If a reduced-weight option matters, ask our team to confirm that it is supported on the exact body.",
  "new-sex-dolls":
    "Browse new sex dolls and recent DollWow catalog additions, with the most recently created listings shown first. This is our catalog order, not a manufacturer's worldwide launch date. New does not automatically mean more realistic, easier to handle, ready to ship, or better for your needs. Compare the exact brand, head and body pairing, TPE or silicone construction, measurements, listed weight, options, starting price, availability, and production path. If a newly announced model is missing, send its name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed.",
  "futa-sex-dolls":
    "Futa is short for futanari, an adult fantasy term commonly used when searching for a feminine doll with a penis option. Compare full-body models listed with support for an insertable penis add-on, from the actual manufacturers named on each card. On custom-made listings, review the available sizes and prices on the product page; the standard build may not include it. Fixed warehouse builds cannot be changed through the custom configurator: check the included configuration rather than assuming the add-on is supplied or selectable. Compare body and head pairing, material, height, weight, compatibility, and care. FutaDoll is a separate seller and brand identity; DollWow does not currently list FutaDoll products.",
  "asian-dolls":
    "Shop Asian sex dolls and Japanese-inspired styles selected from current catalog presentation and product details. The collection includes varied faces, bodies, heights, and proportions across TPE, silicone, and hybrid construction. Asian or Japanese-inspired appearance describes visual styling, not a model's nationality, manufacturing origin, quality, or technical specification. Compare the exact head and body, several gallery angles, measurements, listed weight, material, skin tone, hair, makeup, availability, and supported options before choosing. If a Japanese- or Korean-inspired model you want is missing, send its name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed.",
  "black-dolls":
    "Shop Black sex dolls presented with deep or dark skin tones across current DollWow brands. Some shoppers and retailers use ebony as a search synonym; DollWow uses Black dolls and the exact supported skin-tone name in customer-facing descriptions. This is an appearance category, not an assigned ethnicity, nationality, body type, hair texture, material, or feature set. Compare several photographs, the pictured head and body, available skin tone, measurements, listed weight, TPE or silicone construction, hair, availability, and supported options. If another approved model or tone is missing, send the name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed.",
  "anime-dolls":
    "Shop adult anime sex dolls with stylized, manga-inspired, cosplay, elf, and fantasy presentation across current DollWow brands. This is a visual category for adults, not an age, character-identity, or body-size label. Compare the exact face, body, product form, height, listed weight, TPE or silicone construction, photographs, availability, and supported styling options. If a particular approved design is missing, send our team the model name or supplier link and we will check whether it can be added.",
  "fuller-dolls":
    "Shop fuller and curvy sex dolls with a fuller bust, wider hips, softer midsection, or plus-size-inspired proportions in the current product data and styling. These traits can appear separately, so the category does not claim that every doll has the same body shape or physical weight. Compare the full gallery, bust, waist, hips, height, listed weight, material, product form, and supported options before choosing. If another approved body is missing, send our team the model name or supplier link and we will check whether it can be added.",
  "slim-dolls":
    "Shop slim sex dolls with a narrow waist, slender frame, or lean body proportions in the current product data and styling. Slim does not mean short, lightweight, small-busted, or easier to handle, and some designs combine a narrow waist with fuller curves. Compare the complete bust, waist, hips, height, listed weight, material, product form, and photographs before choosing. If another approved body is missing, send our team the model name or supplier link and we will check whether it can be added.",
  tpe:
    "Shop full-body TPE sex dolls by height, listed weight, proportions, brand, starting price, availability, and custom options. TPE is often chosen for a softer, more flexible feel and a lower starting price than many comparable full-silicone builds, but formulations, firmness, weight, finish, and care needs vary by manufacturer and body. This collection excludes silicone-head/TPE-body hybrids, torsos, and hips so you can compare full TPE dolls with the same basic construction.",
  silicone:
    "Compare full-body silicone dolls, torsos, and hips. Match the product form before comparing height, weight, or starting price. A silicone head on a TPE body is a hybrid build and belongs on a separate shopping path. Compare these full silicone sex dolls by height, listed weight, body shape, surface finish, availability, and custom options. Silicone is often chosen for crisp sculpt detail, a firmer feel, and a less porous surface than many TPE formulations, but softness and handling vary by manufacturer and body design. Check the exact measurements, photos, supported options, and production path before choosing a model.",
  "male-dolls":
    "Shop adult male sex dolls across full-body and compact designs from DollWow brands. Compare height, listed weight, shoulder and body proportions, TPE, full silicone, or hybrid construction, intimate configuration, skeleton support, starting price, and made-to-order status. Product-specific anatomy and options vary, so open the exact listing and ask our team to confirm any decision-critical detail before production.",
  "female-dolls":
    "Shop female-bodied sex dolls across full-body, torso, and hips designs. Compare product form first, then height, listed weight, proportions, material, starting price, and warehouse or custom-made availability. Check each listing for its exact construction, anatomy, photos, measurements, supported options, and delivery information; these vary by model and manufacturer.",
  torsos:
    "Shop torso sex dolls by product form, material, height, width, depth, listed weight, body proportions, brand, and starting price. A torso is a partial-body product, not a lower-priced full doll, and this collection keeps separate hips products and full-body dolls on their own paths. Compare what the product physically includes, how it can be cleaned and stored, and whether the exact material and dimensions are confirmed before ordering.",
  "ready-to-ship":
    "Shop ready-to-ship and in-stock sex dolls that are listed against current warehouse inventory for faster dispatch than a made-to-order build. Compare the exact product form, body and head combination, material, height, listed weight, measurements, price, warehouse region, and included configuration. Ready to ship describes current availability, not a guaranteed delivery date. Ask DollWow to confirm the exact unit, warehouse location, dispatch estimate, carrier route, and any important detail before payment.",
  custom:
    "Shop full-body custom sex dolls by brand, material, body, head, height, listed weight, starting price, and supported options. Made-to-order choices can include skin tone, eyes, hair, faceup, skeleton features, standing support, heating, and other functions, but availability and compatibility vary by exact model. DollWow reviews eligible selections before production and provides a factory-media approval path where supported.",
  customizable:
    "Shop full-body custom sex dolls by brand, material, body, head, height, listed weight, starting price, and supported options. Made-to-order choices can include skin tone, eyes, hair, faceup, skeleton features, standing support, heating, and other functions, but availability and compatibility vary by exact model. DollWow reviews eligible selections before production and provides a factory-media approval path where supported."
};

const collectionMetaDescriptions: Record<string, string> = {
  hips: "Compare hips and lower-body doll products by included body areas, width, depth, height, listed weight, material, price, care needs, and availability.",
  "redhead-dolls": "Compare redhead sex dolls by pictured hair, included styling, supported choices, exact head and body, material, measurements, price, and availability.",
  "blonde-dolls": "Compare blonde sex dolls by pictured hair, included styling, supported choices, head and body pairing, material, measurements, price, and availability.",
  "tan-skin-dolls": "Compare tan skin sex dolls by exact supplier shade, product photographs, head and body pairing, material, measurements, price, and ordering options.",
  "curvy-dolls": "Compare curvy sex dolls by exact bust, waist and hip measurements, product form, construction, listed weight, price, availability, and supported options.",
  "brunette-dolls": "Compare brunette sex dolls by pictured hair, included styling, supported choices, head and body pairing, material, measurements, price, and availability.",
  "sex-dolls": "Shop TPE, silicone, ready-to-ship, and custom sex dolls. Compare exact size, weight, price, options, buyer protection, and Care 365 support.",
  "realistic-sex-dolls": "Shop realistic sex dolls and compare proportions, face sculpt, skin finish, eyes, hands, weight, product photos, and the exact final configuration.",
  "mini-sex-dolls": "Compare mini sex dolls up to 120 cm / 3 ft 11 in by weight, measurements, material, storage needs, stock status, and options.",
  "petite-dolls": "Shop petite sex dolls from 121 to 154 cm / 4 ft to 5 ft 1 in by weight, measurements, material, proportions, stock, and options.",
  "cheap-sex-dolls": "Shop affordable sex dolls with current starting prices up to $1,000. Compare product form, material, size, weight, stock, options, and support.",
  "lightweight-sex-dolls": "Compare full-body lightweight sex dolls with a positive listed weight of 74 lb or less (about 33.6 kg), including size, material, handling, storage, and options.",
  "new-sex-dolls": "Shop new sex dolls and latest arrivals. Compare current models by brand, TPE or silicone, size, weight, options, price, and availability.",
  "futa-sex-dolls": "Compare full-body dolls listed with an insertable penis option. Check custom-made choices, fixed warehouse builds, materials, sizes, prices, and care.",
  "asian-dolls": "Shop Asian sex dolls and Japanese-inspired styles by face, body, TPE or silicone, height, weight, price, availability, and custom options.",
  "black-dolls": "Shop Black sex dolls with deep and dark skin tones. Compare face, body, TPE or silicone, height, weight, price, availability, and options.",
  "anime-dolls": "Shop adult anime sex dolls with manga-inspired, cosplay, elf, and fantasy styling. Compare product form, size, weight, material, price, and options.",
  "fuller-dolls": "Shop fuller and curvy sex dolls by bust, waist, hips, height, listed weight, material, product form, availability, price, and supported options.",
  "slim-dolls": "Shop slim sex dolls by bust, waist, hips, height, listed weight, material, product form, availability, price, and supported options.",
  tpe: "Shop full-body TPE sex dolls by height, weight, proportions, brand, price, availability, and custom options with material and care guidance.",
  silicone: "Shop full silicone sex dolls by size, weight, finish, availability, and options. Compare exact construction, handling, care, and Care 365 support.",
  "male-dolls": "Shop male sex dolls by full-body or compact form, height, weight, proportions, TPE or silicone, anatomy, skeleton, price, and custom options.",
  "female-dolls": "Shop female-bodied sex dolls by full-body, torso or hips form. Compare materials, measurements, starting prices, warehouse stock and custom-made options.",
  torsos: "Shop torso sex dolls by form, TPE or silicone, height, width, depth, weight, brand, price, cleaning access, and storage needs.",
  "ready-to-ship": "Shop ready-to-ship and in-stock sex dolls by product form, material, size, weight, price, warehouse region, and included configuration.",
  custom: "Shop custom sex dolls by brand, material, body, head, size, weight, price, options, compatibility, Human Build Check, and production path.",
  customizable: "Shop custom sex dolls by brand, material, body, head, size, weight, price, options, compatibility, build review, and production path."
};

const collectionBuyerNotesByHandle: Record<string, CollectionBuyerNote[]> = {
  hips: [
    { title: "Confirm included body areas", body: "Lower-body hips products, upper-body torsos and complete dolls are different formats. Check the complete gallery and listed inclusions before comparing price." },
    { title: "Measure the full footprint", body: "Width, depth and height together describe space better than one dimension. Check listed weight and plan how the product will be moved, cleaned, dried and stored." },
    { title: "Check material and choices", body: "Confirm the exact product's construction, care instructions, supported choices and included accessories rather than assuming every hips model shares the same features." }
  ],
  "redhead-dolls": [
    { title: "Separate styling from inclusions", body: "A red-haired photograph does not prove which wig, clothing or accessories come with the order. Confirm the exact product's stated contents." },
    { title: "Check hair construction", body: "Color alone does not establish whether hair is a wig or implanted, or which alternatives are supported on the chosen head and build." },
    { title: "Compare the actual doll", body: "Use product form, body and head material, measurements, listed weight, current price and ordering path alongside the hairstyle." }
  ],
  "blonde-dolls": [
    { title: "Confirm the included hairstyle", body: "A blonde photograph is not a guarantee that its wig, clothing or accessories are included. Check the exact product's stated order contents." },
    { title: "Check supported hair choices", body: "Color alone does not reveal whether hair is a wig or implanted. Supported colors, hair arrangements and compatibility depend on the specific head and build." },
    { title: "Compare the complete product", body: "Keep material, product form, measurements, weight, availability and supported options separate from the photographed styling when comparing value." }
  ],
  "tan-skin-dolls": [
    { title: "Use the exact shade name", body: "Tan is a broad appearance label. Compare the manufacturer's supported shade names and the exact product gallery rather than assuming shades match across brands." },
    { title: "Allow for photographic differences", body: "Lighting, makeup, photography and display settings can change apparent color. A product image is not a calibrated guarantee of the finished tone." },
    { title: "Check the included build", body: "Confirm the selected or included skin tone, head and body pairing, material and ordering path. Do not assume a fixed warehouse unit can use every custom-made choice." }
  ],
  "curvy-dolls": [
    { title: "Read the complete measurements", body: "Curvy and full-bust labels are appearance cues, not standard sizes. Compare bust, waist, hips, height and listed weight together rather than assuming one body shape." },
    { title: "Compare equivalent product forms", body: "Full dolls, torsos and other partial products can share an appearance tag but include different body areas. Check the photographs and exact included form before comparing prices." },
    { title: "Check the exact build", body: "Body proportions do not establish material, softness, handling needs or supported upgrades. Confirm the actual head, body, construction and current ordering options." }
  ],
  "brunette-dolls": [
    { title: "Check what hair is included", body: "A brown-haired photograph is a styling reference, not proof that its wig or every pictured accessory comes with the order. Confirm the exact listing's inclusions." },
    { title: "Separate wigs from implanted hair", body: "Do not infer hair construction from color. Wigs, implanted hair and supported alternatives vary by head, manufacturer and build; check the specific product." },
    { title: "Compare the doll beyond the hairstyle", body: "Use the body and head pairing, material, product form, full measurements, weight, price and availability to decide whether the underlying product fits your needs." }
  ],
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
      title: "There is no universal number one",
      body: "Realism depends on your preferred face, proportions, finish, softness, styling, and practical limits. Use this collection as a full-silicone candidate pool, not a fixed ranking."
    },
    {
      title: "Compare the complete build",
      body: "Review full-body proportions, face angles, eyes, hands, feet, skin finish, listed weight, and pose support before focusing on one close-up image."
    },
    {
      title: "Confirm the photographed options",
      body: "A gallery may show a reference build. Match the selected head, body, tone, eyes, hair, faceup, and options to what you can actually order."
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
  "petite-dolls": [
    {
      title: "Petite means a defined height range",
      body: "DollWow uses 121 to 154 cm / 4 ft to 5 ft 1 in for this collection so buyers can compare compact full dolls within one consistent boundary."
    },
    {
      title: "Shorter does not guarantee lighter",
      body: "Material, body proportions, internal construction, and options affect weight. Check pounds and kilograms plus the route between delivery, cleaning, and storage."
    },
    {
      title: "Keep product forms separate",
      body: "This collection excludes torsos, hips products, and standalone heads. Use their dedicated paths when a partial-body product better fits your space or budget."
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
  "lightweight-sex-dolls": [
    {
      title: "Use the listed weight",
      body: "This collection currently includes full dolls with a positive listed weight of 74 lb or less (about 33.6 kg). Check the exact pounds and kilograms because a difference of 10 to 20 lb / 4.5 to 9 kg can materially change handling."
    },
    {
      title: "Plan the full route",
      body: "Measure doors, stairs, cleaning space, drying space, and storage access. A doll can be lighter than another model and still be awkward because of its height, width, or balance."
    },
    {
      title: "Keep product forms separate",
      body: "This collection focuses on full dolls. Mini and petite full dolls, torsos, and hips products have separate paths so you can compare the format that best fits your space and handling needs."
    }
  ],
  "new-sex-dolls": [
    {
      title: "Recent catalog additions first",
      body: "This page orders listings by their creation date in DollWow's catalog, not a manufacturer's worldwide launch date. Open the exact product for current specifications, options, price, and availability."
    },
    {
      title: "Compare the improvement",
      body: "A new head, body, material, or feature only matters when it improves realism, handling, care, compatibility, or another priority you actually value."
    },
    {
      title: "Ask for a model you have seen",
      body: "Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "futa-sex-dolls": [
    {
      title: "Confirm the selected configuration",
      body: "Collection membership indicates listed support, not an included or currently selectable add-on. On custom-made listings, review the supported size and price; on fixed warehouse builds, check the included configuration before checkout."
    },
    {
      title: "Compare the complete body",
      body: "Height, weight, material, body measurements, head pairing, storage, and cleaning remain important even when this add-on is your starting requirement."
    },
    {
      title: "Ask before production",
      body: "Add-on sizes, pricing, fit, care, and compatibility can vary. DollWow can confirm the exact combination during Human Build Check before an eligible order enters production."
    }
  ],
  "asian-dolls": [
    {
      title: "Compare the exact face and body",
      body: "Asian appearance covers many face shapes, body proportions, heights, and styles. Use the complete gallery and measurements instead of relying on the category label."
    },
    {
      title: "Separate styling from construction",
      body: "Hair, makeup, clothing, and photography can change the presentation. Confirm the head, body, material, skin tone, weight, and included configuration."
    },
    {
      title: "Ask us to find a missing model",
      body: "Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "black-dolls": [
    {
      title: "Check the pictured skin tone",
      body: "Deep and dark tones vary by brand, material, lighting, and finish. Review several product photos and confirm the selected tone before production."
    },
    {
      title: "Choose features individually",
      body: "Black dolls are not one body type, face, hair texture, or material. Compare the exact proportions, head, hair, TPE or silicone build, weight, and options."
    },
    {
      title: "Ask us to expand the choice",
      body: "Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "anime-dolls": [
    {
      title: "Style never describes age",
      body: "Anime, manga, cosplay, elf, and fantasy describe adult product styling only. DollWow does not use underage-coded or school-themed merchandising."
    },
    {
      title: "Check the exact photographed build",
      body: "Hair, ears, eyes, makeup, clothing, props, and image editing can change the presentation. Confirm the head, body, material, measurements, listed weight, and included configuration."
    },
    {
      title: "Ask us to find a missing design",
      body: "Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "fuller-dolls": [
    {
      title: "Compare all three body measurements",
      body: "A fuller bust, waist, and hips do not always increase together. Read the exact measurements and several product angles instead of relying on one label."
    },
    {
      title: "Do not confuse shape with weight",
      body: "Material, height, internal construction, and body volume affect handling. Check pounds and kilograms separately from the visual proportions."
    },
    {
      title: "Ask us to find another body",
      body: "Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "slim-dolls": [
    {
      title: "Use measurements, not one adjective",
      body: "A narrow waist can appear with different heights, busts, hips, and overall proportions. Compare bust, waist, hips, and several gallery angles together."
    },
    {
      title: "Slim does not guarantee lightweight",
      body: "Material, height, skeleton, and internal construction affect handling. Check pounds and kilograms plus your delivery, cleaning, and storage route."
    },
    {
      title: "Ask us to find another body",
      body: "Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  tpe: [
    {
      title: "Compare full TPE builds",
      body: "This collection excludes hybrids, torsos, and hips. Use the separate product-form and hybrid collections when those formats fit your needs."
    },
    {
      title: "Softness varies by model",
      body: "TPE is often softer than silicone, but formulation, body design, internal foam, and finish can change feel, flexibility, and handling weight."
    },
    {
      title: "Plan the care routine",
      body: "TPE generally needs gentle cleaning, complete drying, stain prevention, and careful storage. Follow the exact manufacturer guidance for the selected body."
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
  torsos: [
    {
      title: "Compare the product form first",
      body: "A torso, hips product, compact full doll, and standard full doll are different purchases. Check which body areas are included before comparing price or height."
    },
    {
      title: "Use every available dimension",
      body: "Torso height does not describe a full-body scale. Compare width, depth, weight, base shape, cleaning access, and the private storage position for the exact product."
    },
    {
      title: "Confirm material-specific care",
      body: "TPE and silicone products can need different cleaners, drying, surface treatment, stain prevention, and repair methods. Ask our team when the material or care path is unclear."
    }
  ],
  "ready-to-ship": [
    {
      title: "Confirm the exact warehouse unit",
      body: "Inventory can change quickly. Ask DollWow to confirm that the exact body, head, material, color, and listed configuration are still available before payment."
    },
    {
      title: "Separate dispatch from delivery",
      body: "Ready to ship can shorten the pre-dispatch path, but carrier transit, customs, destination, and appointment or signature requirements still affect arrival timing."
    },
    {
      title: "Treat the configuration as mostly fixed",
      body: "A warehouse unit usually offers fewer changes than a factory build. Confirm what can be adjusted without requiring a new made-to-order doll."
    }
  ],
  custom: [
    {
      title: "Start with body and head",
      body: "Choose the practical body first, then a compatible head. Material, height, weight, proportions, and storage fit matter before styling options."
    },
    {
      title: "Compatibility controls the build",
      body: "Hair, eyes, tone, skeleton, standing, heating, and electronic choices can vary or conflict. The exact product rules decide what can be ordered."
    },
    {
      title: "Review before production and shipping",
      body: "Eligible orders receive a Human Build Check before production and factory media before shipment where the manufacturer supports it."
    }
  ],
  customizable: [
    {
      title: "Start with body and head",
      body: "Choose the practical body first, then a compatible head. Material, height, weight, proportions, and storage fit matter before styling options."
    },
    {
      title: "Compatibility controls the build",
      body: "Hair, eyes, tone, skeleton, standing, heating, and electronic choices can vary or conflict. The exact product rules decide what can be ordered."
    },
    {
      title: "Review before production and shipping",
      body: "Eligible orders receive a Human Build Check before production and factory media before shipment where the manufacturer supports it."
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
    { label: "Learn how to judge doll realism", href: "/learn/most-realistic-sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Browse TPE sex dolls", href: "/shop/tpe" },
    { label: "Browse hybrid dolls", href: "/shop/hybrid" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "Silicon Wives alternatives", href: "/learn/siliconwives-alternatives" }
  ],
  "mini-sex-dolls": [
    { label: "Mini sex dolls guide", href: "/learn/mini-sex-dolls" },
    { label: "Compare petite sex dolls", href: "/shop/petite-dolls" },
    { label: "Plan compact storage", href: "/learn/sex-doll-storage" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  "petite-dolls": [
    { label: "Compare mini and petite sizes", href: "/learn/mini-sex-dolls" },
    { label: "Browse torso sex dolls", href: "/shop/torsos" },
    { label: "Browse mini sex dolls", href: "/shop/mini-sex-dolls" },
    { label: "Plan private storage", href: "/learn/sex-doll-storage" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  torsos: [
    { label: "Read the Tantaly buying guide", href: "/learn/tantaly-buying-guide" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Plan cleaning and drying", href: "/learn/how-to-clean-a-sex-doll" },
    { label: "Plan private storage", href: "/learn/sex-doll-storage" },
    { label: "Compare male doll formats", href: "/learn/male-sex-doll-buying-guide" },
    { label: "Browse hips products", href: "/shop/hips" }
  ],
  "cheap-sex-dolls": [
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "Compare ready-to-ship and custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" }
  ],
  "lightweight-sex-dolls": [
    { label: "Read the size and weight guide", href: "/learn/sex-doll-size-weight-guide" },
    { label: "Compare mini and petite sizes", href: "/learn/mini-sex-dolls" },
    { label: "Plan private storage", href: "/learn/sex-doll-storage" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Ask how ordering works", href: "/how-ordering-works" }
  ],
  "new-sex-dolls": [
    { label: "Browse all sex dolls", href: "/shop/sex-dolls" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Explore custom builds", href: "/shop/custom" },
    { label: "Browse ready-to-ship dolls", href: "/shop/ready-to-ship" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "futa-sex-dolls": [
    { label: "Explore custom builds", href: "/shop/custom" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Read the complete buying guide", href: "/learn/sex-doll-guide" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Ask how ordering works", href: "/how-ordering-works" }
  ],
  "asian-dolls": [
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Learn how to judge realism", href: "/learn/most-realistic-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Explore custom builds", href: "/shop/custom" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "black-dolls": [
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Learn how to judge realism", href: "/learn/most-realistic-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Explore custom builds", href: "/shop/custom" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "anime-dolls": [
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare product size and weight", href: "/learn/mini-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Explore custom builds", href: "/shop/custom" },
    { label: "Review the adult-only standard", href: "/adult-only" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "fuller-dolls": [
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare size and listed weight", href: "/learn/mini-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Explore custom builds", href: "/shop/custom" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "slim-dolls": [
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Compare lightweight dolls", href: "/shop/lightweight-sex-dolls" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Explore custom builds", href: "/shop/custom" },
    { label: "Plan private storage", href: "/learn/sex-doll-storage" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" }
  ],
  "height-under-155": [
    { label: "Mini sex dolls guide", href: "/learn/mini-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" }
  ],
  tpe: [
    { label: "TPE sex doll buying guide", href: "/learn/best-tpe-sex-dolls" },
    { label: "Read the complete sex doll guide", href: "/learn/sex-doll-guide" },
    { label: "Compare TPE vs silicone", href: "/learn/tpe-vs-silicone-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Learn how to clean a sex doll", href: "/learn/how-to-clean-a-sex-doll" },
    { label: "Plan safe storage", href: "/learn/sex-doll-storage" },
    { label: "Compare hybrid dolls", href: "/shop/hybrid" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "RosemaryDoll alternatives", href: "/learn/rosemarydoll-alternatives" }
  ],
  silicone: [
    { label: "Silicone sex doll buying guide", href: "/learn/silicone-sex-doll-guide" },
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
    { label: "Filter stock by warehouse region", href: "/warehouse" },
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "Discreet shipping guide", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review Care for Life", href: "/care-for-life" },
    { label: "Review buyer protection", href: "/buyer-protection" }
  ],
  custom: [
    { label: "Browse dolls with an insertable penis option", href: "/shop/futa-sex-dolls" },
    { label: "Explore the Factory Approval Archive", href: "/factory-photos" },
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "See how ordering works", href: "/how-ordering-works" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Review Care for Life", href: "/care-for-life" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "Silicon Wives alternatives", href: "/learn/siliconwives-alternatives" }
  ],
  customizable: [
    { label: "Ready-to-ship vs custom orders", href: "/learn/ready-to-ship-vs-custom-sex-dolls" },
    { label: "See how ordering works", href: "/how-ordering-works" },
    { label: "Best sex dolls buying guide", href: "/learn/best-sex-dolls" },
    { label: "Understand sex doll cost", href: "/learn/sex-doll-cost" },
    { label: "Review discreet shipping", href: "/learn/discreet-sex-doll-shipping" },
    { label: "Review Care for Life", href: "/care-for-life" },
    { label: "Review buyer protection", href: "/buyer-protection" },
    { label: "Silicon Wives alternatives", href: "/learn/siliconwives-alternatives" }
  ]
};

const collectionComparisonRowsByHandle: Record<string, CollectionComparisonRow[]> = {
  hips: [
    { factor: "Product form", whyItMatters: "A hips product does not include the same body areas as an upper torso or a complete doll.", dollWowAdvantage: "Compare the exact included areas and full gallery rather than assuming one standard form from the category name." },
    { factor: "Footprint and handling", whyItMatters: "One height figure cannot establish storage fit or ease of moving a dense lower-body product.", dollWowAdvantage: "Read width, depth, height and listed weight together, then consider cleaning access and storage position." },
    { factor: "Construction", whyItMatters: "Materials, finish, included accessories and supported options can differ between products.", dollWowAdvantage: "Check the exact specification, care guidance and current order contents before comparing total value." }
  ],
  "redhead-dolls": [
    { factor: "Pictured hair", whyItMatters: "A photographed hairstyle can be a reference or optional item, not an included wig.", dollWowAdvantage: "Check the exact listing's included hair and styling before selecting a pictured look." },
    { factor: "Supported choices", whyItMatters: "Hair construction and alternatives depend on the exact head, manufacturer and build.", dollWowAdvantage: "Confirm the specific product's choices and compatibility rather than assuming universal color or implanted-hair options." },
    { factor: "Underlying product", whyItMatters: "Hair color does not predict body form, material, weight, size or availability.", dollWowAdvantage: "Compare the complete product specification, price and ordering path separately from styling." }
  ],
  "blonde-dolls": [
    { factor: "Pictured hair", whyItMatters: "A hairstyle may be a reference or optional item rather than an included part of the order.", dollWowAdvantage: "Compare the exact listing's included hair and supported alternatives before choosing the photographed look." },
    { factor: "Hair arrangement", whyItMatters: "A blonde color does not establish wig or implanted-hair construction, or compatibility with other head options.", dollWowAdvantage: "Review the specific head and build's supported choices instead of assuming one brand-wide hair package." },
    { factor: "Underlying build", whyItMatters: "Hair styling does not determine body form, material, dimensions, weight or stock status.", dollWowAdvantage: "Keep the complete product specification, current price and ordering path alongside the styling reference." }
  ],
  "tan-skin-dolls": [
    { factor: "Shade identity", whyItMatters: "Different manufacturers can use different names and finishes for tones described as tan.", dollWowAdvantage: "Check the exact supplier shade and model gallery rather than treating the category label as a universal color standard." },
    { factor: "Photographic appearance", whyItMatters: "Lighting, makeup and screen settings can alter apparent color and contrast.", dollWowAdvantage: "Compare several product views and confirm any decision-critical tone detail before ordering." },
    { factor: "Configuration", whyItMatters: "A pictured skin tone does not prove every head, body or stock unit supports a change.", dollWowAdvantage: "Separate the included warehouse configuration from supported custom-made choices and confirm the exact pairing." }
  ],
  "curvy-dolls": [
    { factor: "Body proportions", whyItMatters: "A full bust, narrow waist and fuller hips are different traits and do not occur together in every design.", dollWowAdvantage: "Compare the exact bust, waist and hip measurements with several product photographs instead of relying on an appearance label." },
    { factor: "Product form and handling", whyItMatters: "A partial product and a complete doll are different purchases, and similar silhouettes do not imply similar weight.", dollWowAdvantage: "Keep included body areas, dimensions, listed weight and storage needs alongside the current product price." },
    { factor: "Configuration", whyItMatters: "Material, head compatibility and supported options depend on the exact model, not a curvy tag.", dollWowAdvantage: "Review the current listing and ask support to confirm any decision-critical detail before ordering." }
  ],
  "brunette-dolls": [
    { factor: "Photographed styling", whyItMatters: "The pictured hair color does not establish which wig, accessories or optional styling are included.", dollWowAdvantage: "Check the exact product inclusions and current supported choices before choosing a pictured look." },
    { factor: "Hair construction", whyItMatters: "Color alone does not reveal whether the hair is a wig or implanted, or whether an alternative is supported.", dollWowAdvantage: "Confirm the head and build-specific hair arrangement rather than assuming every result offers the same options." },
    { factor: "Underlying doll", whyItMatters: "Hair styling does not predict product form, material, weight, measurements or availability.", dollWowAdvantage: "Compare the complete product specification, price and ordering path along with the hairstyle." }
  ],
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
      factor: "Transparent candidate rule",
      whyItMatters: "No catalog tag or material can objectively identify one most-realistic doll for every buyer.",
      dollWowAdvantage: "DollWow starts with full-body, full-silicone candidates and explains the rule instead of presenting an invented ranking."
    },
    {
      factor: "Complete visual test",
      whyItMatters: "A close face photo can hide proportions, hand detail, body finish, posing limits, and configuration mismatches.",
      dollWowAdvantage: "Product pages, filters, and the realism guide help buyers compare full-body facts, multiple angles, measurements, and handling weight."
    },
    {
      factor: "Build confirmation",
      whyItMatters: "Head, body, tone, eyes, hair, faceup, skeleton, and functions can change what the finished doll looks like.",
      dollWowAdvantage: "DollWow reviews eligible custom selections before production and provides a factory-media approval path where supported."
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
  "petite-dolls": [
    {
      factor: "Stable size boundary",
      whyItMatters: "Petite, mini, small, and compact are used inconsistently across retailers, which can mix very different heights and product forms.",
      dollWowAdvantage: "DollWow limits this collection to full dolls from 121 to 154 cm / 4 ft to 5 ft 1 in and gives mini and partial-body products separate paths."
    },
    {
      factor: "Handling evidence",
      whyItMatters: "A shorter body can still be dense, wide, or difficult to carry when material and internal construction add weight.",
      dollWowAdvantage: "Product pages keep the available height, listed weight, measurements, material, photographs, and options tied to the exact model."
    },
    {
      factor: "Practical ownership",
      whyItMatters: "Delivery access, cleaning space, drying, storage, stain prevention, and support still matter for a compact doll.",
      dollWowAdvantage: "The collection connects directly to size, storage, shipping, cost, and Care 365 guidance before checkout."
    }
  ],
  torsos: [
    {
      factor: "Product-form clarity",
      whyItMatters: "Torso search results often mix partial bodies, hips products, compact full dolls, and full-size dolls that are not equivalent purchases.",
      dollWowAdvantage: "DollWow gives torso and hips products separate collection paths and keeps the included form tied to the exact product page."
    },
    {
      factor: "Practical dimensions",
      whyItMatters: "Height alone cannot predict storage fit, cleaning access, balance, or how manageable a dense torso will be.",
      dollWowAdvantage: "Buyers can compare product photographs, available measurements, listed weight, material, and brand, then ask support to confirm a missing decision-critical fact."
    },
    {
      factor: "Ownership support",
      whyItMatters: "A compact product still needs the correct cleaning, drying, storage, stain prevention, and repair path for its material.",
      dollWowAdvantage: "Every DollWow doll includes Care 365, with a clear first-year path for arrival questions, care guidance, and repair triage."
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
  "lightweight-sex-dolls": [
    {
      factor: "Exact handling weight",
      whyItMatters: "Lightweight is not standardized, and the same height can have very different finished weights across materials and internal construction.",
      dollWowAdvantage: "This collection currently uses a positive listed weight of 74 lb or less (about 33.6 kg), with the exact listed weight tied to each product."
    },
    {
      factor: "Size and balance",
      whyItMatters: "A lighter doll can still be difficult to move through doors, stairs, bathrooms, or storage spaces.",
      dollWowAdvantage: "Buyers can compare height, measurements, material, and weight across full dolls while torsos and hips products remain on separate paths."
    },
    {
      factor: "Reduced-weight build",
      whyItMatters: "Weight-reduction systems can vary by manufacturer, body, material, production batch, and selected options.",
      dollWowAdvantage: "DollWow can confirm supported weight-reduction options and the expected finished build before an eligible custom order enters production."
    }
  ],
  "new-sex-dolls": [
    {
      factor: "Release context",
      whyItMatters: "New-arrival labels can refer to a manufacturer release, a retailer addition, a new head, or a new body, which are not always the same event.",
      dollWowAdvantage: "DollWow shows its most recently created catalog listings first and keeps the exact brand, head, body, materials, and photographs tied to each product."
    },
    {
      factor: "Practical improvement",
      whyItMatters: "A newer model is not automatically easier to handle, more realistic, better value, or better suited to your storage and care routine.",
      dollWowAdvantage: "Buyers can compare measurements, listed weight, material, price, availability, and options before deciding whether the newer release is a meaningful upgrade."
    },
    {
      factor: "Missing release",
      whyItMatters: "A recently announced model may not yet be published in every approved retailer catalog.",
      dollWowAdvantage: "Send live chat or hello@dollwow.com the model name or supplier link. Most approved additions can go live within 4 to 6 hours after confirmation."
    }
  ],
  "futa-sex-dolls": [
    {
      factor: "Listed option support",
      whyItMatters: "A product title or category label does not prove that an insertable penis is available on the exact body.",
      dollWowAdvantage: "Compare listings with recorded option support, then check whether the exact build is custom-made or fixed warehouse stock. Membership does not verify inclusion or current selectability."
    },
    {
      factor: "Exact configuration",
      whyItMatters: "The add-on may be optional, offered in more than one size, and priced separately from the standard body.",
      dollWowAdvantage: "Use the product page to check custom choices and price changes, or the listed inclusions of a fixed warehouse build, alongside its body, head, material, measurements, and photographs."
    },
    {
      factor: "Build confirmation",
      whyItMatters: "Compatibility and production details can change by brand, body, and selected options.",
      dollWowAdvantage: "Human Build Check can confirm an eligible configuration before production instead of asking you to rely on a category name."
    }
  ],
  "asian-dolls": [
    {
      factor: "Appearance accuracy",
      whyItMatters: "An Asian-style label cannot describe one face, body shape, nationality, skin tone, or finished configuration.",
      dollWowAdvantage: "DollWow keeps the exact head, body, photographs, measurements, material, and current options tied to each product."
    },
    {
      factor: "Practical ownership",
      whyItMatters: "Styling does not predict weight, softness, cleaning, storage, stock status, or delivery timing.",
      dollWowAdvantage: "Use filters and product pages to compare construction, dimensions, listed weight, price, availability, and care needs together."
    },
    {
      factor: "Choice beyond the current grid",
      whyItMatters: "The exact approved model or head a buyer wants may not be published yet.",
      dollWowAdvantage: "Send live chat or hello@dollwow.com the model name or supplier link. Most approved additions can go live within 4 to 6 hours after confirmation."
    }
  ],
  "black-dolls": [
    {
      factor: "Skin-tone confirmation",
      whyItMatters: "Brand labels, studio lighting, image editing, material, and finish can make deep or dark tones appear different on screen.",
      dollWowAdvantage: "DollWow keeps the selected product and its current photos together and can confirm the supported skin-tone path before production."
    },
    {
      factor: "Individual product fit",
      whyItMatters: "Black dolls can have different faces, body types, hair, materials, heights, weights, prices, and options.",
      dollWowAdvantage: "Filters and product pages help buyers compare the complete build instead of relying on stereotypes or one category label."
    },
    {
      factor: "Choice beyond the current grid",
      whyItMatters: "A buyer may want an approved model, head, or configuration that is not published yet.",
      dollWowAdvantage: "Send live chat or hello@dollwow.com the model name or supplier link. Most approved additions can go live within 4 to 6 hours after confirmation."
    }
  ],
  "anime-dolls": [
    {
      factor: "Adult-only styling",
      whyItMatters: "Anime and fantasy labels can be used carelessly to imply age or to mix unrelated novelty products into the same result set.",
      dollWowAdvantage: "DollWow treats anime, manga, cosplay, elf, and fantasy as adult visual styles and excludes underage-coded or school-themed merchandising."
    },
    {
      factor: "Exact product evidence",
      whyItMatters: "Costumes, wigs, ears, makeup, props, and edited backgrounds can make the same body look like a different product.",
      dollWowAdvantage: "Each listing keeps the current product photographs connected to the manufacturer, body, head, material, measurements, listed weight, and ordering path."
    },
    {
      factor: "Build and styling support",
      whyItMatters: "A pictured head, outfit, accessory, or fantasy detail is not automatically included or compatible with every body.",
      dollWowAdvantage: "DollWow can confirm the exact configuration and supported styling choices before an eligible custom order enters production."
    }
  ],
  "fuller-dolls": [
    {
      factor: "Measurable proportions",
      whyItMatters: "Fuller, curvy, plump, BBW, and plus size are used inconsistently and can refer to the bust, waist, hips, or overall silhouette.",
      dollWowAdvantage: "DollWow keeps available bust, waist, hips, height, listed weight, product form, and photographs tied to each current product."
    },
    {
      factor: "Handling fit",
      whyItMatters: "A curvier shape does not predict the finished weight or whether the doll fits a buyer's delivery, cleaning, and storage route.",
      dollWowAdvantage: "Buyers can compare dimensions, pounds and kilograms, material, and product form before judging practical fit."
    },
    {
      factor: "Exact body confirmation",
      whyItMatters: "A photographed head, body, skin tone, or softness option may not be the default configuration.",
      dollWowAdvantage: "DollWow can confirm the exact body and supported options before an eligible custom order enters production."
    }
  ],
  "slim-dolls": [
    {
      factor: "Measurable proportions",
      whyItMatters: "Slim and skinny are used inconsistently, and a narrow waist can be paired with different bust, hip, height, and body-shape choices.",
      dollWowAdvantage: "DollWow keeps available bust, waist, hips, height, listed weight, product form, and photographs tied to each current product."
    },
    {
      factor: "Handling fit",
      whyItMatters: "A lean silhouette does not prove that a doll is short, lightweight, compact, or easy for a particular buyer to carry.",
      dollWowAdvantage: "Buyers can compare dimensions, pounds and kilograms, material, and the route from delivery to cleaning and storage."
    },
    {
      factor: "Exact body confirmation",
      whyItMatters: "Head, body, tone, softness, skeleton, and styling choices can change the final product and price.",
      dollWowAdvantage: "DollWow can confirm the exact body and supported options before an eligible custom order enters production."
    }
  ],
  tpe: [
    {
      factor: "Material boundary",
      whyItMatters: "A full TPE body and a silicone-head/TPE-body hybrid have different construction, care, appearance, and pricing tradeoffs.",
      dollWowAdvantage: "DollWow keeps full-body TPE dolls in this collection and gives hybrids, torsos, and hips their own comparison paths."
    },
    {
      factor: "Practical fit",
      whyItMatters: "TPE softness does not predict height, carrying weight, storage needs, or how easy a doll will be to clean.",
      dollWowAdvantage: "Filters and product pages keep dimensions, listed weight, body type, brand, availability, and options tied to the exact model."
    },
    {
      factor: "Ownership guidance",
      whyItMatters: "TPE formulations and finishes vary, so generic care claims can damage the wrong product.",
      dollWowAdvantage: "The collection links directly to material, cleaning, storage, cost, shipping, and buyer-protection guidance before checkout."
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
      factor: "Exact inventory",
      whyItMatters: "A warehouse label is useful only when the precise body, head, material, color, and configuration are still available.",
      dollWowAdvantage: "DollWow confirms the exact unit and included configuration before payment when timing is decision-critical."
    },
    {
      factor: "Dispatch and arrival",
      whyItMatters: "Warehouse availability can shorten pre-dispatch time, but it does not remove carrier, customs, destination, or delivery-handoff variables.",
      dollWowAdvantage: "DollWow separates the warehouse dispatch estimate from the carrier delivery path and avoids promising an unsupported arrival date."
    },
    {
      factor: "Configuration and support",
      whyItMatters: "Ready-to-ship units are commonly closer to fixed builds, so material, measurements, handling weight, privacy, and aftercare still need review.",
      dollWowAdvantage: "DollWow connects the live unit to discreet-shipping guidance, buyer protection, Care 365, and direct support before checkout."
    }
  ],
  custom: [
    {
      factor: "Product-specific options",
      whyItMatters: "A generic option list cannot prove that a feature works with a particular body, head, material, or skeleton.",
      dollWowAdvantage: "DollWow ties available choices and price changes to the exact product and reviews eligible selections before production."
    },
    {
      factor: "Build approval",
      whyItMatters: "The finished build should be compared with the confirmed order before it enters the shipping path.",
      dollWowAdvantage: "Eligible custom builds receive factory photos or video for approval before shipment where supported."
    },
    {
      factor: "Ownership continuity",
      whyItMatters: "Build details, care documents, approval media, and support history are useful long after checkout.",
      dollWowAdvantage: "The Doll Passport and Care for Life program keep the build and ownership support connected after purchase."
    }
  ],
  customizable: [
    {
      factor: "Product-specific options",
      whyItMatters: "A generic option list cannot prove that a feature works with a particular body, head, material, or skeleton.",
      dollWowAdvantage: "DollWow ties available choices and price changes to the exact product and reviews eligible selections before production."
    },
    {
      factor: "Build approval",
      whyItMatters: "The finished build should be compared with the confirmed order before it enters the shipping path.",
      dollWowAdvantage: "Eligible custom builds receive factory photos or video for approval before shipment where supported."
    },
    {
      factor: "Ownership continuity",
      whyItMatters: "Build details, care documents, approval media, and support history are useful long after checkout.",
      dollWowAdvantage: "The Doll Passport and Care for Life program keep the build and ownership support connected after purchase."
    }
  ]
};

const collectionFaqByHandle: Record<string, { question: string; answer: string }[]> = {
  hips: [
    { question: "What is a hips doll product?", answer: "It is a lower-body product format, not a complete doll or an upper-body torso. Included body areas and proportions vary; check the exact product's full gallery and specification." },
    { question: "Do all hips products include the same anatomy or accessories?", answer: "Do not assume so. Confirm the exact included body areas, product features and accessories rather than inferring them from a category name or one photograph." },
    { question: "Which measurements matter for a hips product?", answer: "Compare width, depth, height and listed weight together, including any boxed dimensions available. Plan handling, cleaning access, drying and storage rather than relying on height alone." },
    { question: "Are hips products all made from one material?", answer: "No. Confirm the exact material and construction on the listing and use its supplied care instructions. A similar appearance does not establish identical care, feel or weight." },
    { question: "Can every hips model be customized?", answer: "No. Supported choices and included configurations depend on the exact product and ordering path. Check the listing rather than assuming the same options across the collection." }
  ],
  "redhead-dolls": [
    { question: "What does the redhead category describe?", answer: "It groups current products presented with red, auburn or similar hair in catalog imagery and styling. It does not guarantee a fixed hair color or an included wig." },
    { question: "Is the red wig in the photographs included?", answer: "Do not assume so. Check the exact listing's included hair, clothing and accessories; pictured styling may be a reference or optional item." },
    { question: "Do redhead dolls have wigs or implanted hair?", answer: "Hair arrangement depends on the exact head and build. Color alone does not establish wig or implanted construction, or availability of alternative colors and options." },
    { question: "Can I change the photographed hairstyle?", answer: "Some builds support hair choices, but availability and compatibility are product-specific. Confirm supported choices before ordering rather than assuming the pictured look can always be changed." },
    { question: "Does red hair determine the skin tone, size or material?", answer: "No. Hair presentation does not determine the doll's skin tone, body or head material, product form, measurements or listed weight. Compare those details separately." }
  ],
  "blonde-dolls": [
    { question: "What does the blonde category describe?", answer: "It groups products presented with blonde or light-colored hair in current catalog imagery and styling. It does not guarantee a fixed color, included wig or every photographed accessory." },
    { question: "Is the pictured blonde wig included?", answer: "Do not assume so. Check the exact product's included hair, clothing and accessories; photographed styling can be a reference or optional item." },
    { question: "Do blonde dolls have wigs or implanted hair?", answer: "Hair arrangement varies by specific head and build. Color alone does not establish whether it is a wig or implanted, or which alternatives are supported." },
    { question: "Can I choose a different hair color?", answer: "Some builds support hair choices, but availability and compatibility are product-specific. Confirm the exact listing rather than assuming a color change or implanted-hair upgrade is available." },
    { question: "Does blonde hair mean a particular skin tone or material?", answer: "No. Hair presentation does not establish skin tone, body or head material, product form, measurements or weight. Compare those product details separately." }
  ],
  "tan-skin-dolls": [
    { question: "Is tan the same shade for every brand?", answer: "No. Tan is a broad appearance grouping, not one standardized supplier shade. Check the exact manufacturer's supported tone name and the product gallery for the build you are considering." },
    { question: "Will the finished tone look exactly like one photograph?", answer: "Do not treat a single photograph as a calibrated color guarantee. Lighting, makeup, photography and display settings can change apparent tone. Compare multiple views and confirm important details before ordering." },
    { question: "Does tan skin describe the doll's ethnicity or material?", answer: "No. It describes skin-tone presentation, not an assigned ethnicity or a material specification. Check body and head construction, measurements, product form and available choices separately." },
    { question: "Can I change the skin tone on every tan-skin listing?", answer: "No. Supported tones and compatible head and body pairings vary by exact build. A fixed warehouse unit has its included configuration; do not assume the custom-made configurator applies to that unit." },
    { question: "What should I check when choosing a tan skin doll?", answer: "Confirm the exact shade name, current product photographs, head and body pairing, included or selected tone, material, measurements, listed weight, price and ordering path." }
  ],
  "curvy-dolls": [
    { question: "What does curvy mean in this collection?", answer: "It groups current catalog products with curvy or full-bust appearance cues. It is not a standardized size or a promise that every result has the same bust, waist, hip proportions or weight. Compare the exact measurements and gallery." },
    { question: "Are Curvy and Fuller the same collection?", answer: "No. They are separate appearance groupings in the catalog and can overlap. Fuller uses its existing fuller-build criteria, while Curvy uses curvy or full-bust cues. Exact proportions are more useful than either label alone." },
    { question: "Are all curvy dolls full-body products?", answer: "No. The appearance category can include different product forms. Check whether the listing is a complete doll, torso or another partial product, and confirm the body areas and dimensions included." },
    { question: "Does curvy mean heavier or softer?", answer: "Not necessarily. Finished weight and feel depend on the exact size, material and construction. Read the listed weight and product details; do not infer them from body styling." },
    { question: "Can I change the body proportions or options?", answer: "Do not assume that a category label makes body proportions adjustable. Supported bodies, head pairings and options vary by model and manufacturer. Check the exact listing and confirm important requirements before ordering." }
  ],
  "brunette-dolls": [
    { question: "What makes a doll part of the brunette collection?", answer: "Current catalog imagery and styling present the product with brown or brunette hair. This is an appearance grouping, not a guarantee of fixed hair color, an included wig or every pictured styling choice." },
    { question: "Is the brown wig in the photographs included?", answer: "Do not assume so. Confirm the exact listing's included hair, clothing and accessories. Photographs can show styling references or optional items rather than the final order contents." },
    { question: "Do brunette dolls have wigs or implanted hair?", answer: "Hair construction varies by head, manufacturer and build. Brown hair in a photograph does not establish whether it is a wig or implanted, or whether alternatives are supported. Check the exact product." },
    { question: "Can I choose another hair color?", answer: "Some builds support hair choices, but availability and compatibility are product-specific. A brunette category label does not guarantee a color change or an implanted-hair upgrade." },
    { question: "Does hair color affect the doll's material or size?", answer: "Hair presentation does not determine the body or head material, measurements, listed weight, skin tone or product form. Compare those specifications separately before choosing." }
  ],
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
    },
    {
      question: "What if the sex doll I want is not listed?",
      answer:
        "Send the product name or supplier link through live chat or hello@dollwow.com. If it is from a supported, approved brand, DollWow will verify the product details and check whether it can be added. Most approved requests can go live within 4 to 6 hours once authorization and product information are confirmed."
    },
    {
      question: "What support is included after I buy a doll from DollWow?",
      answer:
        "Every DollWow doll includes Care 365 for ownership guidance during the first year, plus continuing help through the lifetime repair concierge. Eligible orders can also include Human Build Check, factory media before shipment where supported, a Doll Passport, and the 30-Day Price Lock. The linked program pages explain the exact terms and eligibility."
    }
  ],
  "realistic-sex-dolls": [
    {
      question: "What makes a sex doll look realistic?",
      answer:
        "Balanced proportions, coherent head scale, face sculpt, eye placement, skin finish, hands, feet, hair, natural posing, and a well-matched final configuration work together to create realism."
    },
    {
      question: "Are silicone sex dolls more realistic than TPE dolls?",
      answer:
        "Silicone can hold fine sculpt and surface detail, while TPE is often chosen for a softer feel. Either can look realistic, so compare the exact face, proportions, finish, eyes, styling, and photographs rather than material alone."
    },
    {
      question: "Why does this collection start with full-silicone dolls?",
      answer:
        "Full silicone is a useful candidate pool for fine sculpt and surface detail and aligns with this search cluster. It is not an objective realism score, and buyers should also compare TPE or hybrid construction when softness or feel matters more."
    },
    {
      question: "Do expensive dolls always look more realistic?",
      answer:
        "No. Price can reflect material, size, brand, labor, options, freight, and production complexity. It does not guarantee better proportions, face detail, or a more coherent final configuration."
    },
    {
      question: "Should I confirm product photos before ordering?",
      answer:
        "Yes. A gallery may show a sample or specific option set. Confirm the exact head, body, material, skin tone, eyes, hair, faceup, and supported options before checkout."
    },
    {
      question: "Does a heavier doll feel more realistic?",
      answer:
        "Weight can add physical presence, but heavier is not automatically more realistic. Use listed weight to judge carrying, positioning, cleaning, and storage fit."
    },
    {
      question: "Can custom options improve realism?",
      answer:
        "They can when the eyes, hair, skin tone, faceup, head, and body work together. A mismatched or incompatible option set can make the finished build less coherent."
    },
    {
      question: "Can I preview appearance options before ordering?",
      answer:
        "Eligible product pages include DollVue™ so you can preview selected appearance choices on a real product photo. The result is an approximate visual preview, not a photograph of the finished doll, and DollWow confirms supported options before production."
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
    },
    {
      question: "What if no mini sex doll is currently listed?",
      answer:
        "DollWow will not fill this collection with torsos, hips products, unknown-height listings, or taller dolls just to show results. Send an approved model name or supplier link through live chat or hello@dollwow.com and the team will verify its full-body form, adult presentation, height, availability, and authorization. You can also compare petite or lightweight full dolls while we check."
    }
  ],
  "petite-dolls": [
    {
      question: "What height counts as a petite sex doll?",
      answer:
        "There is no universal industry definition. DollWow uses 121 to 154 cm / 4 ft to 5 ft 1 in for petite full dolls so the collection has a consistent comparison boundary."
    },
    {
      question: "What is the difference between a mini and petite sex doll?",
      answer:
        "DollWow uses mini for full dolls up to 120 cm / 3 ft 11 in and petite for full dolls from 121 to 154 cm / 4 ft to 5 ft 1 in. Both labels describe adult-product dimensions only."
    },
    {
      question: "Does this petite collection include torso dolls?",
      answer:
        "No. This collection is limited to complete dolls in the petite height range. Torso and hips products have separate collection pages."
    },
    {
      question: "Are petite sex dolls lightweight?",
      answer:
        "Not always. Material, proportions, internal construction, and options can make two dolls of similar height weigh very different amounts. Check pounds and kilograms for the exact model."
    },
    {
      question: "Are petite dolls easier to store?",
      answer:
        "They may need less length than a taller doll, but complete measurements, listed weight, storage orientation, material care, and safe handling still determine the practical fit."
    },
    {
      question: "Can petite sex dolls be customized?",
      answer:
        "Many can, but options vary by exact body, head, material, and manufacturer. Review the product page and ask DollWow to confirm any decision-critical option before production."
    }
  ],
  torsos: [
    {
      question: "What is a torso sex doll?",
      answer:
        "A torso sex doll is a partial-body adult product that can include the chest, waist, hips, thighs, shoulders, or another defined body area. The included form varies, so check the complete photographs and dimensions for the exact product."
    },
    {
      question: "Is a torso sex doll easier to store than a full doll?",
      answer:
        "It often needs less length than a full-body doll, but width, depth, weight, base shape, material, and the recommended resting position still determine whether it fits your storage space."
    },
    {
      question: "Are torso dolls lightweight?",
      answer:
        "Not always. A short torso can still be dense because its material is concentrated in a smaller form. Compare the listed weight and plan the route between delivery, cleaning, drying, and storage."
    },
    {
      question: "What is the difference between a torso and a hips product?",
      answer:
        "A torso generally includes more of the upper or central body, while a hips product focuses on the lower body. Product naming varies, so photographs, dimensions, and included body areas provide the clearest distinction."
    },
    {
      question: "Are torso dolls made from TPE or silicone?",
      answer:
        "Both material paths exist. Check the exact listing because TPE and silicone can differ in feel, surface detail, stain risk, care, repair, weight, and price."
    },
    {
      question: "How should I clean and store a torso doll?",
      answer:
        "Follow the instructions for the exact material and product. Use compatible cleaning products, rinse where supported, dry every surface and internal area completely, and store the product in a relaxed position away from heat, pressure, sunlight, and dye-transfer risks."
    },
    {
      question: "Can DollWow help me find a torso that is not listed?",
      answer:
        "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once supplier authorization and product details are confirmed."
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
    },
    {
      question: "Do affordable dolls include the same DollWow ownership support?",
      answer:
        "Yes. Every DollWow doll includes Care 365 under the current published terms, regardless of its starting price. You can also ask our team to compare the complete delivered value before ordering."
    }
  ],
  "lightweight-sex-dolls": [
    {
      question: "What counts as a lightweight sex doll on DollWow?",
      answer: "This collection currently uses a positive listed full-doll weight of 74 lb or less (about 33.6 kg). There is no universal industry definition, so compare the exact weight and dimensions rather than relying on the label alone."
    },
    {
      question: "Are lightweight sex dolls easy to lift?",
      answer: "They can be easier to handle than heavier models, but ability, grip, height, width, balance, stairs, and storage access all matter. Plan the complete route before ordering."
    },
    {
      question: "Are mini or petite sex dolls always lightweight?",
      answer: "No. Height and weight are different measurements. A shorter doll can still be dense, while a taller body may use a supported weight-reduction system. Check both measurements."
    },
    {
      question: "Does TPE or silicone weigh less?",
      answer: "Material alone does not determine the finished weight. Body size, internal foam, skeleton, head, and options all contribute, so compare the exact listed pounds and kilograms."
    },
    {
      question: "Can I request an ultra-lightweight build?",
      answer: "Some manufacturers offer reduced-weight or ultra-lightweight options on selected bodies. Send the product link through live chat or hello@dollwow.com and our team will confirm whether the option is supported and how it affects the build."
    },
    {
      question: "Can DollWow help find a lighter model that is not listed?",
      answer: "Yes. Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "new-sex-dolls": [
    {
      question: "How does DollWow order new sex dolls?",
      answer: "Listings are ordered by their creation date in DollWow's catalog, with the most recently created first. That date is not necessarily the manufacturer's announcement date, the day the listing became public, or the date another retailer added the same model."
    },
    {
      question: "Are all products on this page newly released?",
      answer: "No. The most recently created DollWow listings appear first, while deeper pages can include earlier products. A new listing does not establish a new manufacturer release. Open the exact product and ask support if release timing affects your decision."
    },
    {
      question: "Does new mean ready to ship?",
      answer: "No. A new model can be made to order or held in a warehouse. Check the exact availability and ask DollWow to confirm the unit and expected timing before payment."
    },
    {
      question: "Are newer sex dolls always more realistic?",
      answer: "No. Realism depends on the specific face, body, skin finish, eyes, hair, proportions, material, articulation, and final configuration. Compare the actual build rather than its release order."
    },
    {
      question: "Can I customize a new sex doll?",
      answer: "Many new models support custom choices, but availability and compatibility vary by brand, body, head, and material. Review the product page and ask support to confirm any important option."
    },
    {
      question: "Can DollWow add a new model that is missing?",
      answer: "Yes. Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "futa-sex-dolls": [
    {
      question: "What is a futa sex doll?",
      answer: "Futa is short for futanari, an adult fantasy term commonly used for a feminine doll configured with a penis. This collection compares full-body models listed with support for an insertable penis option from the manufacturer shown on each card, not products from the separate FutaDoll seller. Custom-made choices and fixed warehouse configurations differ."
    },
    {
      question: "Are futa and transgender sex dolls the same thing?",
      answer: "Not exactly. Futa is an adult fantasy and product-search term, while transgender describes a person's gender identity. Some shoppers use both phrases for similar products, but DollWow describes the physical configuration rather than assigning a human identity to a doll."
    },
    {
      question: "Is the insertable penis included in the displayed price?",
      answer: "Not always. Collection membership is not proof that the add-on is included in the displayed price or fixed warehouse build. On a custom-made listing, review the supported size and current price change. On a stock listing, check the included configuration."
    },
    {
      question: "Are all products in this collection full dolls?",
      answer: "Yes. This collection is limited to feminine full-body products listed with support for the add-on option. Torso and partial-body products remain in their own collections."
    },
    {
      question: "Can I choose TPE, silicone, or hybrid construction?",
      answer: "Available materials vary by product and brand. Use the material filter, then confirm the body and head construction on the exact listing before ordering."
    },
    {
      question: "Can I select this add-on on a ready-to-ship doll?",
      answer: "A fixed warehouse build does not use the custom configurator. Check the exact listing's included configuration; appearing in this collection does not mean that the warehouse unit includes the add-on or can be changed before shipment. Compatible extras require model-specific confirmation."
    }
  ],
  "asian-dolls": [
    {
      question: "What does Asian sex doll mean on DollWow?",
      answer: "It is a visual shopping category based on current catalog styling and product details. It can include Japanese-inspired and other East Asian presentation, but it does not assign a nationality or manufacturing origin to a product and does not imply one face, body type, material, or specification."
    },
    {
      question: "Are Japanese sex dolls included in this collection?",
      answer: "Japanese-inspired styles share this collection because current search results and catalog presentation overlap strongly with broader Asian styling. Confirm the exact face, head, body, photographs, and product details rather than relying on the regional label alone."
    },
    {
      question: "Are Asian sex dolls made from TPE or silicone?",
      answer: "Both materials and hybrid constructions can appear in the collection. Confirm the body and head materials on the exact product page before ordering."
    },
    {
      question: "Can Asian dolls be customized?",
      answer: "Many models support appearance or build choices, but options vary by brand, body, head, and material. Review the product page and ask DollWow to confirm any important selection."
    },
    {
      question: "How should I compare Asian doll faces and bodies?",
      answer: "Compare several gallery angles, the exact head and body pairing, height, weight, measurements, material, skin tone, hair, eyes, makeup, and supported options."
    },
    {
      question: "Can DollWow add an Asian doll that is not listed?",
      answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "black-dolls": [
    {
      question: "What is included in the Black sex dolls collection?",
      answer: "The collection shows current DollWow products presented with deep or dark skin tones. Exact faces, bodies, materials, hair, measurements, and options vary by model, and the category does not assign an ethnicity or nationality to a product."
    },
    {
      question: "Are ebony sex dolls included here?",
      answer: "Yes. Ebony is commonly used as a search synonym for dolls with deep or dark skin tones. DollWow keeps those products in this one collection and uses the exact supported skin-tone name when confirming a custom build."
    },
    {
      question: "Are Black sex dolls made from TPE or silicone?",
      answer: "Both material paths can be available. Confirm the exact body and head materials because TPE, full silicone, and hybrid builds differ in feel, care, weight, finish, and price."
    },
    {
      question: "Does every Black doll have the same body type or hair?",
      answer: "No. Skin tone does not determine face, proportions, hair, height, cup size, material, or feature set. Compare each product individually."
    },
    {
      question: "Can I choose a deep or dark skin tone on another doll?",
      answer: "Some manufacturers support additional skin tones on selected bodies, but availability and the final finish are product-specific. Ask DollWow to confirm the exact build before production."
    },
    {
      question: "Can DollWow add a Black doll that is not listed?",
      answer: "Yes. Send the product name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "anime-dolls": [
    {
      question: "What is an anime sex doll?",
      answer: "It is an adult doll with stylized features or presentation inspired by anime, manga, cosplay, elf, or fantasy aesthetics. The label describes visual style, not age, material, body size, or product form."
    },
    {
      question: "Are anime sex dolls full size?",
      answer: "Some are full size and others are compact or partial-body products. Check the product form, height in ft/in and cm, listed weight in lb and kg, and complete measurements before comparing price or storage fit."
    },
    {
      question: "Are anime dolls made from TPE or silicone?",
      answer: "Both material paths can appear, along with hybrid construction. Confirm the body and head materials because feel, finish, care, weight, repair, and price can differ."
    },
    {
      question: "Is the costume or wig shown in the photos included?",
      answer: "Do not assume so. Clothing, wigs, ears, props, and other styling can be photographic references or optional items. Check the exact product listing and ask DollWow to confirm what the order includes."
    },
    {
      question: "Can I customize an anime or fantasy doll?",
      answer: "Many factory-order products support selected head, hair, eye, makeup, skin-tone, skeleton, or styling choices, but availability and compatibility vary by exact body and manufacturer."
    },
    {
      question: "Can DollWow add an anime doll that is not listed?",
      answer: "Yes. Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "fuller-dolls": [
    {
      question: "What is a fuller or curvy sex doll?",
      answer: "It is an adult doll with a fuller bust, wider hips, softer midsection, or plus-size-inspired proportions in the available product data and styling. The exact combination varies by body."
    },
    {
      question: "Are fuller sex dolls heavier?",
      answer: "Not always. Height, material, body volume, internal construction, skeleton, and options determine finished weight. Check the exact pounds and kilograms on the product page."
    },
    {
      question: "Does fuller mean the same thing as BBW or plus size?",
      answer: "Retailers use these labels differently. DollWow treats them as related search language, then asks buyers to rely on bust, waist, hips, height, listed weight, and photographs for the exact body."
    },
    {
      question: "Are fuller dolls made from TPE or silicone?",
      answer: "Both materials and hybrid construction can appear. Confirm the body and head materials because feel, finish, care, repair, weight, and price can differ."
    },
    {
      question: "Can I customize a fuller or curvy doll?",
      answer: "Many factory-order products support selected appearance or build choices, but availability and compatibility vary by exact body, head, material, and manufacturer."
    },
    {
      question: "Can DollWow add a fuller body that is not listed?",
      answer: "Yes. Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
    }
  ],
  "slim-dolls": [
    {
      question: "What is a slim sex doll?",
      answer: "It is an adult doll with a narrow waist, slender frame, or lean body proportions in the available product data and styling. Slim does not define height, cup size, weight, or material."
    },
    {
      question: "Are slim sex dolls lightweight?",
      answer: "Not necessarily. Height, material, internal construction, skeleton, and options determine finished weight. Compare the exact pounds and kilograms before planning handling or storage."
    },
    {
      question: "Can a slim doll have a fuller bust or hips?",
      answer: "Yes. Body traits can overlap. A narrow waist may be paired with different bust and hip proportions, so compare all measurements and several product photographs."
    },
    {
      question: "Are slim dolls made from TPE or silicone?",
      answer: "Both materials and hybrid construction can appear. Confirm the body and head materials because feel, finish, care, repair, weight, and price can differ."
    },
    {
      question: "Can I customize a slim doll?",
      answer: "Many factory-order products support selected appearance or build choices, but availability and compatibility vary by exact body, head, material, and manufacturer."
    },
    {
      question: "Can DollWow add a slim body that is not listed?",
      answer: "Yes. Send the model name or supplier link through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
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
      question: "What is a TPE sex doll?",
      answer:
        "A TPE sex doll uses thermoplastic elastomer for the body. TPE formulations differ by manufacturer, so compare the exact model's feel, firmness, weight, finish, care instructions, and construction rather than assuming all TPE is identical."
    },
    {
      question: "Are TPE dolls cheaper than silicone dolls?",
      answer:
        "Many TPE dolls start at a lower price than comparable full-silicone builds, but the final cost depends on product form, size, brand, options, availability, and delivery path. Compare equivalent products and the configured total."
    },
    {
      question: "Are TPE sex dolls soft?",
      answer:
        "TPE is often chosen for softness and flexibility, but firmness varies by formulation, body design, internal foam, and manufacturer. Material alone cannot predict the feel of an exact model."
    },
    {
      question: "How do you clean a TPE sex doll?",
      answer:
        "Use gentle, material-compatible products and follow the manufacturer's instructions for the exact doll. Avoid harsh chemicals and abrasion, rinse as directed, and dry every cleaned area completely before storage."
    },
    {
      question: "Can TPE sex dolls stain?",
      answer:
        "Yes. Dark or untested fabrics, dyes, inks, and prolonged contact can transfer color to some TPE surfaces. Wash new clothing separately, test uncertain materials on a hidden area, and avoid long storage in dark garments."
    },
    {
      question: "Is a silicone-head doll a TPE doll?",
      answer:
        "A silicone head paired with a TPE body is a hybrid. It is not a full TPE or full-silicone build, and the head and body may require different care. DollWow lists hybrids separately."
    },
    {
      question: "What should I compare before buying a TPE sex doll?",
      answer:
        "Compare full-body versus compact form, height, listed weight, measurements, manufacturer, material notes, skeleton, supported options, availability, care needs, storage space, and final configured price."
    },
    {
      question: "What ownership help comes with a TPE doll from DollWow?",
      answer:
        "Every DollWow doll includes Care 365 for first-year ownership guidance and continuing access to the lifetime repair concierge. Because TPE formulations vary, support follows the instructions and repair methods confirmed for the exact product rather than a universal TPE rule."
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
    },
    {
      question: "Can DollWow confirm a silicone model or option before I order?",
      answer:
        "Yes. Ask through live chat or hello@dollwow.com if the exact body material, head pairing, firmness, weight, option, or availability affects your decision. If an approved model is missing, send its product name or supplier link and the team will check whether it can be added."
    },
    {
      question: "What ownership help comes with a silicone doll from DollWow?",
      answer:
        "Every DollWow doll includes Care 365 for first-year ownership guidance and continuing access to the lifetime repair concierge. Support remains product-specific, so follow the exact manufacturer's instructions for cleaning, storage, powered features, and repairs."
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
    },
    {
      question: "What support comes with a male doll from DollWow?",
      answer:
        "Every DollWow doll includes Care 365 for first-year ownership guidance and continuing access to the lifetime repair concierge. Eligible custom orders can also receive Human Build Check and factory media before shipment where the manufacturer supports it."
    }
  ],
  "ready-to-ship": [
    {
      question: "Are ready-to-ship sex dolls available immediately?",
      answer:
        "They are listed against warehouse inventory for a faster dispatch path than a made-to-order build. Availability can change, so DollWow confirms the exact unit, included configuration, warehouse location, and current dispatch estimate before payment when timing matters."
    },
    {
      question: "How are ready-to-ship dolls different from custom orders?",
      answer:
        "Ready-to-ship dolls are existing warehouse configurations and usually offer fewer changes. Made-to-order dolls can support more choices but require confirmation, production, review, and shipping. Exact timing depends on the product, supplier, queue, destination, and carrier."
    },
    {
      question: "Does ready to ship mean fast delivery?",
      answer:
        "It can reduce the time before dispatch, but it is not a guaranteed delivery date. Warehouse handling, carrier transit, customs, destination, signature requirements, and local delivery conditions can still affect arrival."
    },
    {
      question: "Can I customize an in-stock sex doll?",
      answer:
        "Some small changes may be possible, but many warehouse units are sold in a mostly fixed configuration. Ask DollWow what can be changed without turning the order into a factory build."
    },
    {
      question: "Where is a ready-to-ship doll stored?",
      answer:
        "Warehouse region varies by product. Check the listing and ask DollWow to confirm the current location, because a unit stored outside your destination country can follow a different carrier and customs path."
    },
    {
      question: "What should I confirm before ordering an in-stock doll?",
      answer:
        "Confirm the exact body and head, material, skin tone, measurements, listed weight, included configuration, warehouse region, stock status, dispatch estimate, carrier path, packaging, and any signature or handoff requirement that matters to you."
    }
  ],
  custom: [
    {
      question: "What can be customized on a sex doll?",
      answer:
        "Depending on the exact model, choices may include the head, skin tone, eyes, hair, faceup, skeleton features, standing support, heating, functions, and accessories. Availability varies by product."
    },
    {
      question: "Are all custom options compatible?",
      answer:
        "No. Some options depend on the body, material, or head. The configurator shows the choices available for that specific doll."
    },
    {
      question: "How long does a custom sex doll take?",
      answer:
        "Timing varies by manufacturer, body, options, production queue, factory review, and shipping route. Use the current order-specific estimate rather than a universal promise."
    },
    {
      question: "Does DollWow review custom options before production?",
      answer:
        "Eligible custom orders receive a Human Build Check for obvious compatibility issues, missing required choices, and details that need clarification before production."
    },
    {
      question: "Do custom dolls receive factory photos?",
      answer:
        "Eligible custom builds can receive factory photos or video before shipment. Available media and process depend on the product, order, and manufacturer."
    },
    {
      question: "Is the collection price the final custom price?",
      answer:
        "Collection pages show starting prices. The total changes as priced options are selected, and supplier-dependent choices may still require confirmation."
    },
    {
      question: "Does Care 365 apply to custom dolls?",
      answer:
        "Care 365 is included with every DollWow doll under the current published coverage terms. Review the Care for Life page for the latest details."
    },
    {
      question: "Can I preview custom appearance options before ordering?",
      answer:
        "Eligible product pages include DollVue™ so you can preview selected appearance choices on a real product photo. The result is an approximate visual preview, not a photograph of the finished doll. DollWow confirms which options are supported before production."
    }
  ],
  customizable: [
    {
      question: "What can be customized on a sex doll?",
      answer:
        "Depending on the exact model, choices may include the head, skin tone, eyes, hair, faceup, skeleton features, standing support, heating, functions, and accessories. Availability varies by product."
    },
    {
      question: "Are all custom options compatible?",
      answer:
        "No. Some options depend on the body, material, or head. The configurator shows the choices available for that specific doll."
    },
    {
      question: "How long does a custom sex doll take?",
      answer:
        "Timing varies by manufacturer, body, options, production queue, factory review, and shipping route. Use the current order-specific estimate rather than a universal promise."
    },
    {
      question: "Does DollWow review custom options before production?",
      answer:
        "Eligible custom orders receive a Human Build Check for obvious compatibility issues, missing required choices, and details that need clarification before production."
    },
    {
      question: "Do custom dolls receive factory photos?",
      answer:
        "Eligible custom builds can receive factory photos or video before shipment. Available media and process depend on the product, order, and manufacturer."
    },
    {
      question: "Is the collection price the final custom price?",
      answer:
        "Collection pages show starting prices. The total changes as priced options are selected, and supplier-dependent choices may still require confirmation."
    },
    {
      question: "Does Care 365 apply to custom dolls?",
      answer:
        "Care 365 is included with every DollWow doll under the current published coverage terms. Review the Care for Life page for the latest details."
    }
  ]
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}.`;
}
