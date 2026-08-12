import type { Metadata } from "next";
import type { Product } from "@/types/product";
import { env } from "@/lib/utils/env";
import { productPublicTitle } from "./naming";

const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
const warehouseUrl = `${siteUrl}/warehouse`;

export const warehouseIntro =
  "US warehouse sex dolls are listings associated with ready stock in a United States warehouse. Use the regional filters to compare available products, then ask DollWow to verify the exact unit, fixed configuration, warehouse location, dispatch estimate, and carrier path before payment. A domestic warehouse can shorten the fulfillment path, but it does not guarantee an arrival date.";

export const warehouseBuyerNotes = [
  {
    title: "Verify the exact unit",
    body: "Confirm the body, head, material, skin tone, measurements, listed weight, condition, and current warehouse. A brand being stocked in the United States does not prove that every configuration is there."
  },
  {
    title: "Compare the fixed build",
    body: "Warehouse inventory is usually already produced. Ask which options and accessories are included and whether any requested change would require a new factory order."
  },
  {
    title: "Separate dispatch from arrival",
    body: "Warehouse handling, carrier transit, destination access, signature requirements, and local delivery can still affect timing. Use the current order-specific estimate instead of a broad promise."
  }
];

export const warehouseFaqItems = [
  {
    question: "Are all products on this page in a US warehouse?",
    answer:
      "No. The page includes ready inventory across supported warehouse regions. Select United States to narrow the catalog, then ask DollWow to confirm the exact unit and current location before payment."
  },
  {
    question: "Does a US warehouse mean guaranteed fast delivery?",
    answer:
      "No. Domestic inventory can shorten the path before delivery, but warehouse handling, carrier transit, destination access, weather, and signature requirements can still affect arrival. Confirm the current dispatch estimate for the exact unit."
  },
  {
    question: "Can I customize a warehouse doll?",
    answer:
      "Warehouse dolls usually have a mostly fixed body, head, material, skin tone, and installed options. Some styling or accessory changes may be possible. DollWow can confirm what can change without replacing it with a made-to-order build."
  },
  {
    question: "What should I confirm before buying a warehouse doll?",
    answer:
      "Confirm the exact body and head, materials, skin tone, measurements, listed weight, condition, included configuration, warehouse region, stock status, dispatch estimate, carrier path, packaging, and any signature requirement that matters to you."
  },
  {
    question: "Are warehouse shipments discreet?",
    answer:
      "DollWow plans for discreet delivery, but carton, sender, carrier, and label details can vary by supplier, warehouse, and destination. Ask for order-specific confirmation when an exterior detail is important."
  },
  {
    question: "How is this page different from the ready-to-ship collection?",
    answer:
      "This page is organized around warehouse region so you can narrow existing inventory by location. The ready-to-ship collection is the broader destination for comparing all currently listed stock, regardless of warehouse region."
  }
];

export function buildWarehouseMetadata(searchParams: Record<string, string | string[] | undefined> = {}): Metadata {
  const title = "US Warehouse Sex Dolls & Global Ready Stock";
  const description =
    "Compare US warehouse sex dolls and ready stock by region, material, size, weight, price, and fixed configuration. DollWow confirms the exact unit before payment.";
  const hasFacet = Object.entries(searchParams).some(([key, value]) => key !== "sort" && value !== undefined);

  return {
    title,
    description,
    alternates: { canonical: warehouseUrl },
    robots: hasFacet ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, url: warehouseUrl, type: "website", siteName: "DollWow" },
    twitter: { card: "summary", title, description }
  };
}

export function buildWarehouseStructuredData(products: Product[]) {
  const name = "US Warehouse Sex Dolls & Global Ready Stock";
  const description =
    "Compare ready-to-ship DollWow inventory by warehouse region, material, size, listed weight, price, and fixed configuration.";

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      description,
      url: warehouseUrl,
      isPartOf: { "@type": "WebSite", name: "DollWow", url: siteUrl },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products.slice(0, 24).map((product, index) => ({
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
        { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop/sex-dolls` },
        { "@type": "ListItem", position: 3, name: "Warehouse inventory", item: warehouseUrl }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: warehouseFaqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }
  ];
}
