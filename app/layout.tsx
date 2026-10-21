import type { Metadata } from "next";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/hanken-grotesk/600.css";
import "@fontsource/hanken-grotesk/700.css";
import "@fontsource/schibsted-grotesk/400.css";
import "@fontsource/schibsted-grotesk/500.css";
import "@fontsource/schibsted-grotesk/600.css";
import "@fontsource/schibsted-grotesk/700.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { ConsentBanner } from "@/components/ConsentBanner";
import { StorefrontZipper } from "@/components/StorefrontZipper";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { ComparisonProvider } from "@/components/compare/ComparisonProvider";
import { ComparisonDrawer } from "@/components/compare/ComparisonDrawer";
import { ChatraWidget } from "@/components/ChatraWidget";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { HalloweenSpiders } from "@/components/promotions/HalloweenSpiders";
import { isHalloweenPreview, isHalloweenVisible } from "@/lib/promotions/halloween2026";
import { buildSiteStructuredData } from "@/lib/seo/siteStructuredData";
import { buildStorefrontThemeInitScript } from "@/lib/storefrontTheme";
import { analyticsBootstrap, analyticsConfig } from "@/lib/analytics/config";
import "./globals.css";
import "./v2-storefront.css";

const STOREFRONT_THEME_INIT_SCRIPT = buildStorefrontThemeInitScript();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "DollWow | Find, compare, customize, and buy with confidence",
    template: "%s | DollWow"
  },
  description: "A simpler way to find, compare, customize, and buy the right doll with clear pricing, delivery, and specialist support.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }]
  },
  openGraph: {
    images: [
      {
        url: "/images/brand/dollwow-black-gold.png",
        width: 768,
        height: 512,
        alt: "DollWow.com"
      }
    ]
  },
  robots: {
    index: true,
    follow: true
  },
  verification: {
    other: {
      "msvalidate.01": "9A6C8A58EBCAAC65B76DC2B06AF37246"
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteStructuredData = buildSiteStructuredData();
  const analytics = analyticsConfig(process.env);
  const chatraId = process.env.NEXT_PUBLIC_CHATRA_ID;

  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="DollWow machine-readable site guide" />
        <link rel="alternate" type="application/json" href="/agent-index.json" title="DollWow structured site index" />
        <script
          id="dollwow-theme-init"
          dangerouslySetInnerHTML={{
            __html: STOREFRONT_THEME_INIT_SCRIPT
          }}
        />
        {analytics ? (
          <>
            <script
              id="ga4-consent-and-init"
              dangerouslySetInnerHTML={{
                __html: analyticsBootstrap(analytics)
              }}
            />
          </>
        ) : null}
      </head>
      <body className="font-sans antialiased">
        {siteStructuredData.map((entry) => (
          <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
        ))}
        <CurrencyProvider>
          <ComparisonProvider>
            <CartProvider>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <AnnouncementBar />
            <Header />
            {chatraId ? <ChatraWidget chatraId={chatraId} /> : null}
            <StorefrontZipper />
            <main id="main-content" tabIndex={-1}>{children}</main>
            <Footer />
            <CartDrawer />
            <ComparisonDrawer />
            {isHalloweenVisible() ? <HalloweenSpiders preview={isHalloweenPreview()} /> : null}
            </CartProvider>
          </ComparisonProvider>
        </CurrencyProvider>
        <ConsentBanner />
        <Analytics measurementId={analytics?.measurementId} />
      </body>
    </html>
  );
}
