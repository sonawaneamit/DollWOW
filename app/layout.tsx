import type { Metadata } from "next";
import { Hanken_Grotesk, Schibsted_Grotesk } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { ConsentBanner } from "@/components/ConsentBanner";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { buildSiteStructuredData } from "@/lib/seo/siteStructuredData";
import "./globals.css";

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
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteStructuredData = buildSiteStructuredData();
  const measurementId = process.env.GA_MEASUREMENT_ID;

  return (
    <html lang="en" data-theme="boudoir" data-scroll-behavior="smooth">
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        {siteStructuredData.map((entry) => (
          <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
        ))}
        {measurementId ? (
          // GA4 Consent Mode v2 defaults: everything denied until the visitor
          // chooses via the consent banner. Must run before the gtag loader.
          <script
            id="ga4-consent-defaults"
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
});`
            }}
          />
        ) : null}
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
        <ConsentBanner />
        <Analytics measurementId={measurementId} />
      </body>
    </html>
  );
}
