import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { isSeSeptemberPromotionPublished, SE_SEPTEMBER_PROMOTION } from "@/lib/promotions/seSeptember2026";

export const metadata: Metadata = {
  title: "Active Brand Promotions",
  description: "See active DollWow brand promotions, eligible products, dates, and included factory bonuses in one place.",
  alternates: { canonical: "/promo" },
  openGraph: {
    title: "Active Brand Promotions | DollWow",
    description: "Current brand promotions with clear dates, eligible products, and included factory bonuses.",
    images: [{
      url: SE_SEPTEMBER_PROMOTION.banner.hero,
      width: 1920,
      height: 750,
      alt: SE_SEPTEMBER_PROMOTION.banner.alt
    }]
  }
};

export const revalidate = 3600;

export default function PromoPage() {
  const promotion = SE_SEPTEMBER_PROMOTION;
  const hasPublishedPromotion = isSeSeptemberPromotionPublished();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Active DollWow brand promotions",
    url: "https://dollwow.com/promo",
    description: "Current brand promotions with dates, eligible products, and included factory bonuses.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: hasPublishedPromotion ? 1 : 0,
      itemListElement: hasPublishedPromotion ? [{
        "@type": "ListItem",
        position: 1,
        name: "SE Doll TPE September 2026 custom-order bonuses",
        url: "https://dollwow.com/brands/se-doll"
      }] : []
    }
  };

  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="shop-visual-hero">
        <div>
          <p className="text-sm text-gold-300">Current offers</p>
          <h1 className="collection-hero__title mt-2 text-4xl font-semibold text-ivory-50">Active brand promotions</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ivory-300">Find current factory-backed promotions, exact dates, eligible order types, and included bonuses. Product availability and supported options still vary by model.</p>
        </div>
      </div>

      {hasPublishedPromotion ? <article className="overflow-hidden rounded-[8px] border border-gold-500/18 bg-ink-900/72" aria-labelledby="se-tpe-promo-heading">
        <div className="grid lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
          <div className="relative min-h-[360px] bg-ink-950 sm:min-h-[480px] lg:min-h-0">
            <Image
              src={promotion.banner.card}
              alt={promotion.banner.alt}
              fill
              priority
              sizes="(min-width: 1024px) 39vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-sm font-semibold text-gold-300">SE Doll · TPE / STPE custom orders</p>
            <h2 id="se-tpe-promo-heading" className="mt-2 text-3xl font-semibold text-ivory-50">September factory bonuses</h2>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-ivory-200">
              <CalendarDays className="h-4 w-4 text-gold-300" aria-hidden="true" /> {promotion.displayDates}
            </p>
            <p className="mt-4 max-w-2xl leading-7 text-ivory-300">Eligible SE Doll TPE and STPE custom orders include all six factory bonuses below during the promotion period.</p>
            <ul className="mt-6 grid gap-3 text-sm text-ivory-100 sm:grid-cols-2">
              {promotion.tpeFrees.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <span>Free {item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-ivory-400">DollWow’s sitewide 10% remains applied at checkout.</p>
            <Link href={promotion.brandHref} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-button bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover">
              Shop SE Doll <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article> : (
        <section className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-8" aria-labelledby="no-active-promotions-heading">
          <h2 id="no-active-promotions-heading" className="text-2xl font-semibold text-ivory-50">No active brand promotions</h2>
          <p className="mt-3 max-w-2xl leading-7 text-ivory-300">There are no current factory-backed brand promotions to list. Browse the catalog for current products and options.</p>
          <Link href="/shop/sex-dolls" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-button bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover">Browse all dolls <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
      )}
    </section>
  );
}
