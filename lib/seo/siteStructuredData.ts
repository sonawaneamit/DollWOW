import { env } from "@/lib/utils/env";

const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export function buildSiteStructuredData() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "DollWow",
      url: siteUrl,
      logo: `${siteUrl}/images/brand/dollwow-black-gold.png`,
      description: "DollWow helps adults compare, customize, and buy companion dolls with clear product details, private checkout, and specialist support.",
      foundingDate: "2026",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${siteUrl}/support`,
          availableLanguage: ["en"]
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "DollWow",
      url: siteUrl,
      publisher: {
        "@id": `${siteUrl}/#organization`
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/shop?query={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    }
  ];
}
