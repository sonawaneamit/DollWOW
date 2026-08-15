import type { Metadata } from "next";
import { DollVueLanding } from "@/components/dollvue/DollVueLanding";
import { isDollVueCatalogProduct } from "@/lib/dollvue/config";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");
const canonicalUrl = `${siteUrl}/dollvue`;
const heroImage = `${siteUrl}/images/dollvue/landing/00-dollvue-process-comparison.webp`;

export const metadata: Metadata = {
  title: "DollVue™ | Preview Custom Sex Doll Options Before You Buy",
  description:
    "See supported skin tone, hair, eye color, and finishing choices come together on real doll photography before you order. Meet DollVue™ by DollWOW.",
  alternates: {
    canonical: canonicalUrl,
    types: { "text/markdown": `${siteUrl}/markdown/dollvue` }
  },
  openGraph: {
    title: "DollVue™ | See Her Before She Arrives",
    description: "Preview supported appearance choices on real DollWOW product photography before you order.",
    type: "website",
    url: canonicalUrl,
    images: [{ url: heroImage, width: 2200, height: 1950, alt: "Before DollVue and DollVue preview comparison" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "DollVue™ | See Her Before She Arrives",
    description: "Preview supported appearance choices on real DollWOW product photography before you order.",
    images: [heroImage]
  },
  robots: { index: true, follow: true }
};

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function DollVueLandingPage() {
  const catalog = await getSeoCatalogProducts({ first: 5000 });
  const latestEligibleProducts = catalog
    .filter(isDollVueCatalogProduct)
    .sort((a, b) => (b.extended.sourceReleaseRank ?? 0) - (a.extended.sourceReleaseRank ?? 0))
    .slice(0, 9);
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DollVue",
    applicationCategory: "ShoppingApplication",
    operatingSystem: "Web",
    url: canonicalUrl,
    description:
      "DollVue creates approximate personalized visual previews of supported doll appearance choices using real product and option-reference photography.",
    publisher: { "@type": "Organization", name: "DollWOW", url: siteUrl },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Complimentary previews subject to current usage limits." }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />
      <DollVueLanding latestEligibleProducts={latestEligibleProducts} />
    </>
  );
}
