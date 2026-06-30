import type { Metadata } from "next";
import { Hanken_Grotesk, Schibsted_Grotesk } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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

  return (
    <html lang="en" data-theme="boudoir" data-scroll-behavior="smooth">
      <body className={`${display.variable} ${sans.variable} font-sans antialiased`}>
        {siteStructuredData.map((entry) => (
          <script key={entry["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
        ))}
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
