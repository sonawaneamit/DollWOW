import { env } from "@/lib/utils/env";
import type { CatalogBrand } from "@/lib/catalog/brands";

const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export const brandDirectoryIntro =
  "Compare the sex doll brands currently available through DollWow, then open any manufacturer page to review real products, materials, measurements, listed weight, supported options, and buyer guidance. There is no single best brand for everyone. The right choice depends on the exact body, head, construction, handling needs, appearance, budget, and support you want.";

export const brandDirectoryComparisonRows = [
  {
    factor: "Material and finish",
    whatToCompare: "Check the body and head separately. TPE, full silicone, and hybrid builds can differ in feel, finish, care, weight, and price.",
    dollWowPath: "Use the material collections and each brand page to compare current products without assuming every model uses the same construction."
  },
  {
    factor: "Size and handling",
    whatToCompare: "Compare height, listed weight, measurements, body proportions, doorway access, lifting, and storage before choosing from photographs.",
    dollWowPath: "Product pages show imperial and metric measurements where supplied, and our team can help confirm missing details before you order."
  },
  {
    factor: "Body and head pairing",
    whatToCompare: "A face may be shown on several bodies, while neck connections, skin tone, material, finish, and powered features can limit compatibility.",
    dollWowPath: "Human Build Check reviews supported custom combinations before production so the final configuration is clear."
  },
  {
    factor: "Customization",
    whatToCompare: "Hair, eyes, skin tone, skeleton, feet, softness, heating, and head functions vary by manufacturer and sometimes by individual body or head.",
    dollWowPath: "Choose from the options shown on the exact product. For an unlisted choice, ask us to verify it with the supplier rather than guessing."
  },
  {
    factor: "Availability and ownership",
    whatToCompare: "Separate ready-to-ship inventory from factory orders, then compare support, discreet delivery, arrival checks, care, and repair help.",
    dollWowPath: "DollWow connects the order record, Doll Passport, Care 365, price protection, and lifetime repair guidance around the doll you choose."
  }
];

export const brandDirectoryChecklist = [
  {
    title: "Start with your non-negotiables",
    body: "Set your preferred material, maximum handling weight, size range, product form, appearance, budget, and ready-to-ship or custom-build preference first."
  },
  {
    title: "Compare products, not reputations alone",
    body: "A manufacturer can offer many body and head systems. Judge the exact listing and configuration instead of treating every product from one brand as identical."
  },
  {
    title: "Ask before compromising",
    body: "If a brand or model is missing, contact us through live chat or hello@dollwow.com. Most approved requests can be added within 4 to 6 hours once authorization and product details are confirmed."
  }
];

export const brandDirectoryFaqs = [
  {
    question: "What are the best sex doll brands?",
    answer:
      "There is no universal best brand. Compare the exact doll's body and head materials, measurements, listed weight, construction, supported options, price, availability, and ownership support. DollWow's manufacturer pages help you compare those details across the brands currently carried."
  },
  {
    question: "How do I compare two sex doll manufacturers?",
    answer:
      "Begin with the same requirements for both: material, product form, height, weight, measurements, body and head compatibility, customization, availability, care, and total configured price. Then compare exact products rather than broad brand claims."
  },
  {
    question: "Does every doll from one brand use the same material?",
    answer:
      "No. Some manufacturers offer TPE, full-silicone, hybrid, or silicone-head combinations across different products. Confirm the body and head material on the exact listing before ordering or choosing care supplies."
  },
  {
    question: "Can every head fit every body from the same brand?",
    answer:
      "Not necessarily. Neck connection, material, skin tone, finish, scale, hair, and powered features can affect compatibility. DollWow reviews supported custom combinations before production through Human Build Check."
  },
  {
    question: "How can I check whether DollWow carries a particular brand or model?",
    answer:
      "Use this directory or search the store. If you cannot find the exact model, contact DollWow through live chat or hello@dollwow.com. The team can check authorization, supplier details, and how quickly an approved product can be added."
  },
  {
    question: "Should I choose a ready-to-ship doll or a custom factory order?",
    answer:
      "Choose ready-to-ship when current inventory and a mostly fixed configuration suit you. Choose a factory order when supported appearance or build options matter more. Confirm the exact unit, warehouse, configuration, and timing before checkout."
  }
];

export function buildBrandDirectoryStructuredData(brands: CatalogBrand[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Sex Doll Brands", item: `${siteUrl}/brands` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Sex doll brands available through DollWow",
      itemListElement: brands.map((brand, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: brand.label,
        url: `${siteUrl}/brands/${brand.collectionHandle}`
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: brandDirectoryFaqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }
  ];
}
