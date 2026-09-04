"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, ChevronDown, Gift } from "lucide-react";
import {
  IRONTECH_AUTUMN_OFFERS,
  IRONTECH_AUTUMN_PROMOTION,
  irontechAutumnOfferForProduct,
  irontechAutumnPromotionStatus,
  isIrontechAutumnPromotionActive
} from "@/lib/promotions/irontechAutumn2026";
import type { Product } from "@/types/product";

type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;

export function IrontechAutumnPdpPromotion({ product, promoClock }: { product: PromotionProduct; promoClock?: string }) {
  const now = promoClock ? new Date(promoClock) : new Date();
  const offer = irontechAutumnOfferForProduct(product, now);
  const [isOpen, setIsOpen] = useState(false);
  if (!offer) return null;

  return (
    <section className="mt-4" aria-label="Irontech autumn factory promotion" data-irontech-autumn-pdp-promotion>
      <IrontechPromotionAccordion
        id={`irontech-autumn-pdp-${offer.kind}`}
        label={`${offer.title} — tap to view details`}
        isOpen={isOpen}
        onToggle={() => setIsOpen((open) => !open)}
        sizes="(min-width: 1024px) 55vw, 100vw"
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-gold-200">
          <Gift className="h-4 w-4" aria-hidden="true" /> Irontech autumn factory offer
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ivory-50">{offer.title}</h2>
        <p className="mt-1 text-sm leading-6 text-ivory-200">For eligible custom orders placed {IRONTECH_AUTUMN_PROMOTION.dateLabel}.</p>
        <OfferList items={offer.included} />
        <BonusNote />
        <p className="mt-3 text-sm leading-6 text-ivory-400">DollWOW’s sitewide 10% is applied at checkout.</p>
      </IrontechPromotionAccordion>
    </section>
  );
}

export function IrontechAutumnPromoIndexCard() {
  const [isOpen, setIsOpen] = useState(false);
  // Active only — do not advertise Free TalkX / freebie lists before the 7 Sept window.
  if (!isIrontechAutumnPromotionActive()) return null;

  return (
    <article id={IRONTECH_AUTUMN_PROMOTION.id} className="scroll-mt-24 rounded-[20px] border border-gold-500/18 bg-ink-900/72 p-3 shadow-panel sm:p-4">
      <IrontechPromotionAccordion
        id="irontech-autumn-promo-index"
        label="Irontech autumn factory promotion — tap to view details"
        isOpen={isOpen}
        onToggle={() => setIsOpen((open) => !open)}
        sizes="(min-width: 1280px) 1184px, 100vw"
        priority
      >
        <div className="p-1 sm:p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gold-500/14 px-3 py-1 text-sm font-semibold text-gold-200">{irontechAutumnPromotionStatus()}</span>
            <span className="text-sm font-semibold text-ivory-400">{IRONTECH_AUTUMN_PROMOTION.dateLabel}</span>
          </div>
          <p className="mt-5 text-sm font-semibold text-gold-300">Irontech factory offer</p>
          <h2 className="mt-2 text-3xl font-semibold text-ivory-50">{IRONTECH_AUTUMN_PROMOTION.title}</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ivory-300">{IRONTECH_AUTUMN_PROMOTION.summary}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {Object.values(IRONTECH_AUTUMN_OFFERS).map((offer) => (
              <section key={offer.kind}>
                <h3 className="text-base font-semibold text-ivory-100">{offer.title}</h3>
                <OfferList items={offer.included} compact />
              </section>
            ))}
          </div>
          <BonusNote />
          <p className="mt-3 text-sm leading-6 text-ivory-400">Custom full dolls and silicone single heads only. Ready-to-ship and warehouse products are not eligible. DollWOW’s sitewide 10% is applied at checkout.</p>
          <Link href={IRONTECH_AUTUMN_PROMOTION.brandHref} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-button bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover">
            Shop Irontech Dolls
          </Link>
        </div>
      </IrontechPromotionAccordion>
    </article>
  );
}

function OfferList({ items, compact = false }: { items: readonly string[]; compact?: boolean }) {
  return (
    <ul className={`${compact ? "mt-3" : "mt-5"} grid gap-2`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ivory-200">
          <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BonusNote() {
  return (
    <div className="mt-5 rounded-[12px] border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm leading-6 text-ivory-200">
      <strong className="text-gold-200">All-customer TalkX bonus:</strong> {IRONTECH_AUTUMN_PROMOTION.bonus}
    </div>
  );
}

function IrontechPromotionAccordion({ id, label, isOpen, onToggle, sizes, priority = false, children }: {
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  sizes: string;
  priority?: boolean;
  children: React.ReactNode;
}) {
  const detailsId = `${id}-details`;
  return (
    <div className="w-full overflow-hidden rounded-[16px] border border-gold-500/25 bg-ink-900">
      <button type="button" className="group block w-full cursor-pointer bg-ink-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300" aria-expanded={isOpen} aria-controls={detailsId} onClick={onToggle} data-irontech-autumn-promotion-banner>
        <span className="relative block aspect-[1042/1563] w-full overflow-hidden bg-[#f5eee6] sm:aspect-[1920/750]">
          <Image src={IRONTECH_AUTUMN_PROMOTION.mobileHeroImage} alt={IRONTECH_AUTUMN_PROMOTION.heroAlt} fill priority={priority} sizes={sizes} className="object-contain sm:hidden" />
          <Image src={IRONTECH_AUTUMN_PROMOTION.heroImage} alt={IRONTECH_AUTUMN_PROMOTION.heroAlt} fill priority={priority} sizes={sizes} className="hidden object-contain sm:block" />
        </span>
        <span className="flex min-h-12 items-center justify-between gap-3 border-t border-gold-500/20 bg-ink-950 px-4 py-3 text-sm font-semibold text-ivory-100 sm:px-5">
          <span>{label}</span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-gold-300 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
      </button>
      <div id={detailsId} hidden={!isOpen} className="border-t border-gold-500/20 bg-ink-900 px-5 py-5 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-gold-300"><CalendarDays className="h-4 w-4" aria-hidden="true" /> {IRONTECH_AUTUMN_PROMOTION.dateLabel}</p>
        {children}
      </div>
    </div>
  );
}
