import type { Metadata } from "next";
import { Hanken_Grotesk, Schibsted_Grotesk } from "next/font/google";
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
import { buildSiteStructuredData } from "@/lib/seo/siteStructuredData";
import "./globals.css";
import "./v2-storefront.css";

const DEFAULT_GA_MEASUREMENT_ID = "G-4V999366W5";

const display = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

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
  const measurementId = process.env.GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_MEASUREMENT_ID;
  const chatraId = process.env.NEXT_PUBLIC_CHATRA_ID;

  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          id="dollwow-theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('dollwow-theme');var theme=saved==='dark'?'dark':'light';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';}})();`
          }}
        />
        {measurementId ? (
          <>
            <script
              id="ga4-consent-and-init"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', '${measurementId}', {
  send_page_view: true,
  anonymize_ip: true,
  linker: { domains: ['dollwow.com', 'checkout.dollwow.com'] }
});`
              }}
            />
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
          </>
        ) : null}
      </head>
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        {siteStructuredData.map((entry) => (
          <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
        ))}
        <CurrencyProvider>
          <ComparisonProvider>
            <CartProvider>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <Header />
            <StorefrontZipper />
            <main id="main-content" tabIndex={-1}>{children}</main>
            <Footer />
            <CartDrawer />
            <ComparisonDrawer />
            </CartProvider>
          </ComparisonProvider>
        </CurrencyProvider>
        <ConsentBanner />
        <Analytics measurementId={measurementId} />
        {chatraId ? <ChatraWidget chatraId={chatraId} /> : null}
      </body>
    </html>
  );
}
