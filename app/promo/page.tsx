import type { Metadata } from "next";
import Link from "next/link";
import { SeDollPromoIndexCards } from "@/components/promotions/SeDollSeptemberPromotion";
import { isSeDollSeptemberPromotionVisible, SE_DOLL_SEPTEMBER_OFFERS } from "@/lib/promotions/seDollSeptember2026";
import { IrontechAutumnPromoIndexCard } from "@/components/promotions/IrontechAutumnPromotion";
import { IRONTECH_AUTUMN_PROMOTION, isIrontechAutumnPromotionVisible } from "@/lib/promotions/irontechAutumn2026";
import { JinsanOctoberIndexCards } from "@/components/promotions/JinsanOctoberPromotion";
import { isJinsanOctoberActive, JINSAN_OCTOBER_OFFERS } from "@/lib/promotions/jinsanOctober2026";
import { IdoOctoberIndexCard } from "@/components/promotions/IdoOctoberPromotion";
import { IDO_OCTOBER_OFFER, isIdoOctoberActive } from "@/lib/promotions/idoOctober2026";
import { MdOctoberIndexCard } from "@/components/promotions/MdOctoberPromotion";
import { MD_OCTOBER_OFFER, isMdOctoberActive } from "@/lib/promotions/mdOctober2026";
import { isHiddenCatalogBrand } from "@/lib/catalog/brands";
import { isHalloweenPreview, isHalloweenVisible } from "@/lib/promotions/halloween2026";
import { HalloweenWindow } from "@/components/promotions/HalloweenWindow";
import { HalloweenCampaignBanner } from "@/components/promotions/HalloweenCampaignBanner";
import { HalloweenLandingSections } from "@/components/promotions/HalloweenLandingSections";
import { zargaPreviewEnabled } from '@/lib/catalog/zargaPreview';
import { isZargaHalloweenActive } from '@/lib/promotions/zargaHalloween2026';
import { ZargaHalloweenPromotion } from '@/components/promotions/ZargaHalloweenPromotion';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

export const revalidate = 60;

function promoCopy() {
const halloween = isHalloweenVisible();
const title = halloween ? "Halloween Sex Doll Sale: $299 Off Full-Size Dolls" : "Active Sex Doll Brand Promotions & Bonuses";
const description = halloween ? "Save $299 USD on eligible full-size ready-to-ship and custom-made dolls with HALLOWEEN299. Ends 8 November 2026. Eligible factory bonuses stay included." : "See current sex doll brand promotions, exact dates, eligible custom orders, and factory-confirmed bonus upgrades at DollWOW.";
return { halloween, title, description };
}

export function generateMetadata(): Metadata {
  const { title, description } = promoCopy();
  return {
  title,
  description,
  alternates: { canonical: "/promo" },
  openGraph: {
    title: `${title} | DollWOW`,
    description,
    url: `${siteUrl}/promo`,
    type: "website"
  }
};
}

export default function PromoIndexPage() {
  const { halloween, title, description } = promoCopy();
  const preview = isHalloweenPreview();
  const promoClock = new Date().toISOString();
  const hasJinsanPromotion = isJinsanOctoberActive(new Date(promoClock));
  const hasIdoPromotion = isIdoOctoberActive(new Date(promoClock));
  const hasMdPromotion = !isHiddenCatalogBrand("md") && isMdOctoberActive(new Date(promoClock));
  const hasSeDollPromotion = isSeDollSeptemberPromotionVisible();
  const hasIrontechPromotion = isIrontechAutumnPromotionVisible();
  const hasZargaPromotion = zargaPreviewEnabled() && isZargaHalloweenActive(new Date(promoClock));
  const itemList = [
    ...(hasJinsanPromotion ? Object.values(JINSAN_OCTOBER_OFFERS).map(offer => ({ name: `${offer.brand} October factory promotion`, url: `${siteUrl}/promo#${offer.id}` })) : []),
    ...(hasIdoPromotion ? [{ name: `${IDO_OCTOBER_OFFER.brand} October factory promotion`, url: `${siteUrl}/promo#${IDO_OCTOBER_OFFER.id}` }] : []),
    ...(hasMdPromotion ? [{ name: `${MD_OCTOBER_OFFER.brand} October factory promotion`, url: `${siteUrl}/promo#${MD_OCTOBER_OFFER.id}` }] : []),
    ...(hasIrontechPromotion ? [{ name: IRONTECH_AUTUMN_PROMOTION.title, url: `${siteUrl}/promo#${IRONTECH_AUTUMN_PROMOTION.id}` }] : []),
    ...(hasSeDollPromotion ? Object.values(SE_DOLL_SEPTEMBER_OFFERS).map((offer) => ({ name: offer.shortTitle, url: `${siteUrl}/promo#${offer.id}` })) : [])
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: `${siteUrl}/promo`,
    description,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemList.length,
      itemListElement: itemList.map((offer, index) => ({
            "@type": "ListItem",
            position: index + 1,
            ...offer
          }))
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {halloween ? <HalloweenWindow preview={preview}><HalloweenCampaignBanner preview={preview} /><HalloweenLandingSections preview={preview} /></HalloweenWindow> : <header className="rounded-[20px] bg-surface-tint px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold text-accent">Current offers</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-text sm:text-5xl">Active sex doll brand promotions</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-dim">
          Find the promotion dates, eligible order types, and included factory bonuses currently published by DollWOW. Product eligibility is shown on each qualifying product page before checkout.
        </p>
      </header>}

      <section className="mt-8" aria-labelledby="active-promotions-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gold-300">Published now</p>
            <h2 id="active-promotions-heading" className="mt-1 text-2xl font-semibold text-text">Brand offers and bonuses</h2>
          </div>
          <Link href="/brands" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Browse all brands</Link>
        </div>
        {hasZargaPromotion || hasSeDollPromotion || hasIrontechPromotion || hasJinsanPromotion || hasIdoPromotion || hasMdPromotion ? (
          <div className="grid gap-8">
            {hasZargaPromotion ? <ZargaHalloweenPromotion enabled variant="card" promoClock={promoClock} /> : null}
            {hasJinsanPromotion ? <JinsanOctoberIndexCards promoClock={promoClock} /> : null}
            {hasIdoPromotion ? <IdoOctoberIndexCard promoClock={promoClock} /> : null}
            {hasMdPromotion ? <MdOctoberIndexCard promoClock={promoClock} /> : null}
            {hasIrontechPromotion ? <IrontechAutumnPromoIndexCard /> : null}
            {hasSeDollPromotion ? <SeDollPromoIndexCards /> : null}
          </div>
        ) : (
          <div className="rounded-[16px] border border-border bg-surface p-6 text-text-dim">
            No brand promotions are active right now. Browse the current catalog or ask our team about model-specific options.
          </div>
        )}
      </section>
    </div>
  );
}
