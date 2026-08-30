import type { Metadata } from "next";
import Link from "next/link";
import { SeDollPromoIndexCard } from "@/components/promotions/SeDollSeptemberPromotion";
import { isSeDollSeptemberPromotionVisible, SE_DOLL_SEPTEMBER_PROMOTION } from "@/lib/promotions/seDollSeptember2026";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Active Sex Doll Brand Promotions & Bonuses",
  description: "See current sex doll brand promotions, exact dates, eligible custom orders, and factory-confirmed bonus upgrades at DollWOW.",
  alternates: { canonical: "/promo" },
  openGraph: {
    title: "Active Sex Doll Brand Promotions & Bonuses | DollWOW",
    description: "Current sex doll brand promotion dates and eligible factory bonus upgrades at DollWOW.",
    url: `${siteUrl}/promo`,
    type: "website"
  }
};

export default function PromoIndexPage() {
  const hasSeDollPromotion = isSeDollSeptemberPromotionVisible();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Active DollWOW brand promotions",
    url: `${siteUrl}/promo`,
    description: "Current brand promotion dates and eligible factory bonus upgrades at DollWOW.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: hasSeDollPromotion ? 1 : 0,
      itemListElement: hasSeDollPromotion
        ? [{
            "@type": "ListItem",
            position: 1,
            name: SE_DOLL_SEPTEMBER_PROMOTION.shortTitle,
            url: `${siteUrl}${SE_DOLL_SEPTEMBER_PROMOTION.brandHref}`
          }]
        : []
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="rounded-[20px] bg-surface-tint px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold text-accent">Current offers</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-text sm:text-5xl">Active sex doll brand promotions</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-dim">
          Find the promotion dates, eligible order types, and included factory bonuses currently published by DollWOW. Product eligibility is shown on each qualifying product page before checkout.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="active-promotions-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gold-300">Published now</p>
            <h2 id="active-promotions-heading" className="mt-1 text-2xl font-semibold text-text">Brand offers and bonuses</h2>
          </div>
          <Link href="/brands" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Browse all brands</Link>
        </div>
        {hasSeDollPromotion ? (
          <SeDollPromoIndexCard />
        ) : (
          <div className="rounded-[16px] border border-border bg-surface p-6 text-text-dim">
            No brand promotions are active right now. Browse the current catalog or ask our team about model-specific options.
          </div>
        )}
      </section>
    </div>
  );
}
