"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BadgePercent, CalendarDays, Check, ChevronDown, CircleAlert, Gift } from "lucide-react";
import {
  isSeDollSeptemberPromotionVisible,
  SE_DOLL_LOOSE_JOINT_SYSTEM,
  SE_DOLL_SEPTEMBER_OFFERS,
  SE_DOLL_SEPTEMBER_PROMOTION,
  seDollSeptemberOfferForProduct,
  seDollSeptemberPromotionStatus
} from "@/lib/promotions/seDollSeptember2026";
import type { Product } from "@/types/product";

const looseJointTitle = SE_DOLL_LOOSE_JOINT_SYSTEM.title;

export function nextOpenSePromotionPanel(currentId: string | null, selectedId: string) {
  return currentId === selectedId ? null : selectedId;
}

export function SeDollBrandPromotionBanner() {
  if (!isSeDollSeptemberPromotionVisible()) return null;

  return (
    <section className="mb-8 overflow-hidden rounded-[20px] border border-gold-500/18 bg-ink-950 shadow-panel" aria-labelledby="se-doll-promo-heading">
      <div className="relative aspect-[1920/750] w-full overflow-hidden bg-ink-950">
        <Image
          src={SE_DOLL_SEPTEMBER_PROMOTION.heroImage}
          alt={SE_DOLL_SEPTEMBER_PROMOTION.heroAlt}
          fill
          priority
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="grid gap-5 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-300">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> {SE_DOLL_SEPTEMBER_PROMOTION.dateLabel}
          </p>
          <h2 id="se-doll-promo-heading" className="mt-2 text-2xl font-semibold text-ivory-50">
            {SE_DOLL_SEPTEMBER_PROMOTION.shortTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ivory-300">
            Custom TPE/STPE and Silicone Pro full dolls now include the free Loose Joint System, alongside the other September factory offers. Torsos and ready-to-ship dolls are excluded from this free option. DollWOW’s sitewide 10% is applied at checkout.
          </p>
        </div>
        <Link href={SE_DOLL_SEPTEMBER_PROMOTION.promoHref} className="inline-flex min-h-11 items-center justify-center rounded-button bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover">
          View all four offers
        </Link>
      </div>
    </section>
  );
}

export function SeDollPdpFreebieBlock({ product }: { product: Pick<Product, "handle" | "extended"> }) {
  const offer = seDollSeptemberOfferForProduct(product);
  const [openPanelId, setOpenPanelId] = useState<string | null>(null);
  if (!offer) return null;

  const included = offer.includesSoftBelly
    ? [...offer.included, "Free soft belly"]
    : offer.included;
  const septemberIncluded = included.filter((item) => item !== looseJointTitle);
  const isWarehouse = offer.kind.startsWith("warehouse_");
  const mainPanelId = `se-pdp-${offer.kind}`;
  const togglePanel = (panelId: string) => {
    setOpenPanelId((currentId) => nextOpenSePromotionPanel(currentId, panelId));
  };

  return (
    <section className="mt-6 grid gap-4" aria-label="SE Doll September factory offers" data-se-pdp-promotion-stack>
      <PromotionAccordionPanel
        id={mainPanelId}
        image={offer.image}
        imageAlt={offer.imageAlt}
        label={`${offer.title} — tap to view details`}
        isOpen={openPanelId === mainPanelId}
        onToggle={() => togglePanel(mainPanelId)}
        sizes="(min-width: 1024px) 55vw, 100vw"
        priority
        bannerDataAttribute="pdp"
      >
        <div data-se-pdp-promotion-details>
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-200">
            {isWarehouse ? <BadgePercent className="h-4 w-4" aria-hidden="true" /> : <Gift className="h-4 w-4" aria-hidden="true" />}
            SE Doll September factory offer
          </p>
          <h2 id="se-pdp-bonuses-heading" className="mt-1 text-xl font-semibold text-ivory-50">
            {offer.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-ivory-200">
            {isWarehouse ? "For eligible ready-to-ship orders placed" : "For eligible custom orders placed"} 1–30 September 2026.
          </p>

          {septemberIncluded.length || offer.discounts.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {septemberIncluded.length ? <OfferList title="Included factory bonuses" items={septemberIncluded} /> : null}
              {offer.discounts.length ? <OfferList title="Factory discount" items={offer.discounts} /> : null}
            </div>
          ) : null}

          {offer.makeupPriceNote ? (
            <div className="mt-5 flex gap-3 rounded-[12px] border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm leading-6 text-ivory-100">
              <CircleAlert className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <p><strong className="text-gold-200">Warehouse STPE makeup pricing:</strong> {offer.makeupPriceNote}</p>
            </div>
          ) : null}
        </div>
      </PromotionAccordionPanel>

      {offer.includesLooseJointSystem ? (
        <PromotionAccordionPanel
          id={`${mainPanelId}-loose-joints`}
          image={SE_DOLL_LOOSE_JOINT_SYSTEM.heroImage}
          imageAlt={SE_DOLL_LOOSE_JOINT_SYSTEM.heroAlt}
          label="Free Loose Joint System — tap to view details"
          isOpen={openPanelId === `${mainPanelId}-loose-joints`}
          onToggle={() => togglePanel(`${mainPanelId}-loose-joints`)}
          sizes="(min-width: 1024px) 55vw, 100vw"
          containImage
          bannerDataAttribute="loose-joint"
        >
          <LooseJointSystemDetails />
        </PromotionAccordionPanel>
      ) : null}
    </section>
  );
}

function OfferList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ivory-100">{title}</h3>
      <ul className="mt-2 grid gap-2" aria-label={title}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ivory-200">
            <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SeDollPromoIndexCards() {
  const offers = Object.values(SE_DOLL_SEPTEMBER_OFFERS);

  return (
    <div className="grid gap-8">
      {offers.map((offer, index) => (
        <PromoIndexOfferCard key={offer.id} offer={offer} index={index} />
      ))}
    </div>
  );
}

function PromoIndexOfferCard({ offer, index }: {
  offer: (typeof SE_DOLL_SEPTEMBER_OFFERS)[keyof typeof SE_DOLL_SEPTEMBER_OFFERS];
  index: number;
}) {
  const [openPanelId, setOpenPanelId] = useState<string | null>(null);
  const hasLooseJoints = offer.included.some((item) => item === looseJointTitle);
  const septemberIncluded = offer.included.filter((item) => item !== looseJointTitle);
  const togglePanel = (panelId: string) => {
    setOpenPanelId((currentId) => nextOpenSePromotionPanel(currentId, panelId));
  };

  return (
    <article id={offer.id} className="scroll-mt-24 grid gap-4 rounded-[20px] border border-gold-500/18 bg-ink-900/72 p-3 shadow-panel sm:p-4">
      <PromotionAccordionPanel
        id={`${offer.id}-september`}
        image={offer.heroImage}
        imageAlt={offer.heroAlt}
        label={`${offer.shortTitle} — tap to view details`}
        isOpen={openPanelId === `${offer.id}-september`}
        onToggle={() => togglePanel(`${offer.id}-september`)}
        sizes="(min-width: 1280px) 1184px, 100vw"
        priority={index === 0}
      >
        <div className="p-1 sm:p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gold-500/14 px-3 py-1 text-sm font-semibold text-gold-200">{seDollSeptemberPromotionStatus()}</span>
            <span className="text-sm font-semibold text-ivory-400">{SE_DOLL_SEPTEMBER_PROMOTION.dateLabel}</span>
          </div>
          <p className="mt-5 text-sm font-semibold text-gold-300">SE Doll factory offer {index + 1} of 4</p>
          <h2 className="mt-2 text-3xl font-semibold text-ivory-50">{offer.shortTitle}</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ivory-300">{offer.summary}</p>

          {septemberIncluded.length ? (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-ivory-100">{offer.includedTitle}</h3>
              <PromoIndexList items={septemberIncluded} icon="check" />
            </div>
          ) : null}

          {offer.discounts.length ? (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-ivory-100">Factory option discounts</h3>
              <PromoIndexList items={offer.discounts} icon="discount" />
            </div>
          ) : null}

          <p className={`mt-6 rounded-[12px] border px-4 py-3 text-sm leading-6 text-ivory-300 ${offer.kind === "warehouse" ? "border-gold-500/30 bg-gold-500/10" : "border-gold-500/14 bg-ink-950/55"}`}>
            {offer.note}
          </p>
          <p className="mt-3 text-sm leading-6 text-ivory-400">DollWOW’s sitewide 10% is applied at checkout.</p>
          <Link href={SE_DOLL_SEPTEMBER_PROMOTION.brandHref} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-button bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover">
            Shop SE Doll
          </Link>
        </div>
      </PromotionAccordionPanel>

      {hasLooseJoints ? (
        <PromotionAccordionPanel
          id={`${offer.id}-loose-joints`}
          image={SE_DOLL_LOOSE_JOINT_SYSTEM.heroImage}
          imageAlt={SE_DOLL_LOOSE_JOINT_SYSTEM.heroAlt}
          label="Free Loose Joint System — tap to view details"
          isOpen={openPanelId === `${offer.id}-loose-joints`}
          onToggle={() => togglePanel(`${offer.id}-loose-joints`)}
          sizes="(min-width: 1280px) 1184px, 100vw"
          containImage
          bannerDataAttribute="loose-joint"
        >
          <LooseJointSystemDetails />
        </PromotionAccordionPanel>
      ) : null}
    </article>
  );
}

function PromoIndexList({ items, icon }: { items: readonly string[]; icon: "check" | "discount" }) {
  return (
    <ul className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ivory-300">
          {icon === "check" ? (
            <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
          ) : (
            <BadgePercent className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

function PromotionAccordionPanel({
  id,
  image,
  imageAlt,
  label,
  isOpen,
  onToggle,
  sizes,
  children,
  priority = false,
  containImage = false,
  bannerDataAttribute
}: {
  id: string;
  image: string;
  imageAlt: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  sizes: string;
  children: ReactNode;
  priority?: boolean;
  containImage?: boolean;
  bannerDataAttribute?: "pdp" | "loose-joint";
}) {
  const detailsId = `${id}-details`;
  const bannerAttributes = bannerDataAttribute === "pdp"
    ? { "data-se-pdp-promotion-banner": true }
    : bannerDataAttribute === "loose-joint"
      ? { "data-loose-joint-promotion-banner": true }
      : {};

  return (
    <div className="w-full overflow-hidden rounded-[16px] border border-gold-500/25 bg-ink-900">
      <button
        type="button"
        className="group block w-full cursor-pointer bg-ink-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300"
        aria-expanded={isOpen}
        aria-controls={detailsId}
        onClick={onToggle}
        {...bannerAttributes}
      >
        <span className={`relative block aspect-[1920/750] w-full overflow-hidden ${containImage ? "bg-[#f2f0ef]" : "bg-ink-950"}`}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority={priority}
            sizes={sizes}
            className={containImage ? "object-contain" : "object-cover"}
          />
        </span>
        <span className="flex min-h-12 items-center justify-between gap-3 border-t border-gold-500/20 bg-ink-950 px-4 py-3 text-sm font-semibold text-ivory-100 sm:px-5">
          <span>{label}</span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-gold-300 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
      </button>
      <div id={detailsId} hidden={!isOpen} className="border-t border-gold-500/20 bg-ink-900 px-5 py-5 sm:px-6">
        {children}
      </div>
    </div>
  );
}

function LooseJointSystemDetails() {
  return (
    <div aria-label="Loose Joint System details" data-loose-joint-promotion-details>
      <p className="text-sm font-semibold text-gold-300">September full-doll freebie</p>
      <h3 className="mt-1 text-lg font-semibold text-ivory-50">Loose Joint System</h3>
      <p className="mt-2 text-sm leading-6 text-ivory-300">{SE_DOLL_LOOSE_JOINT_SYSTEM.summary}</p>
      <p className="mt-2 text-sm leading-6 text-ivory-400">{SE_DOLL_LOOSE_JOINT_SYSTEM.note}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-500">Custom full-size TPE / STPE and Silicone Pro only · Not torsos · Not ready to ship</p>
    </div>
  );
}

// Backward-compatible name for any stale import during rolling deployments.
export const SeDollPromoIndexCard = SeDollPromoIndexCards;
