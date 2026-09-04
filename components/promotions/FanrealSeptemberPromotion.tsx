"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarDays, Check, ChevronDown, Gift } from "lucide-react";
import {
  FANREAL_SEPTEMBER_PROMOTION,
  fanrealSeptemberOfferForProduct
} from "@/lib/promotions/fanrealSeptember2026";
import type { Product } from "@/types/product";

type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;

export function FanrealSeptemberPdpPromotion({ product, promoClock }: { product: PromotionProduct; promoClock?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const now = promoClock ? new Date(promoClock) : new Date();
  const offer = fanrealSeptemberOfferForProduct(product, now);
  if (!offer) return null;

  const detailsId = "fanreal-september-pdp-details";
  return (
    <section className="mt-4" aria-label="Fanreal September factory promotion" data-fanreal-september-pdp-promotion>
      <div className="w-full overflow-hidden rounded-[16px] border border-gold-500/25 bg-ink-900">
        <button
          type="button"
          className="group block w-full cursor-pointer bg-ink-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300"
          aria-expanded={isOpen}
          aria-controls={detailsId}
          onClick={() => setIsOpen((open) => !open)}
          data-fanreal-september-promotion-banner
        >
          <span className="relative block aspect-[4/5] w-full overflow-hidden bg-[#f5eee6] sm:aspect-[2/1]">
            <Image src={FANREAL_SEPTEMBER_PROMOTION.mobileHeroImage} alt={FANREAL_SEPTEMBER_PROMOTION.heroAlt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain sm:hidden" />
            <Image src={FANREAL_SEPTEMBER_PROMOTION.heroImage} alt={FANREAL_SEPTEMBER_PROMOTION.heroAlt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="hidden object-contain sm:block" />
          </span>
          <span className="flex min-h-12 items-center justify-between gap-3 border-t border-gold-500/20 bg-ink-950 px-4 py-3 text-sm font-semibold text-ivory-100 sm:px-5">
            <span>Fanreal September factory promotion — tap to view details</span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-gold-300 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </span>
        </button>
        <div id={detailsId} hidden={!isOpen} className="border-t border-gold-500/20 bg-ink-900 px-5 py-5 sm:px-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-300"><CalendarDays className="h-4 w-4" aria-hidden="true" /> {FANREAL_SEPTEMBER_PROMOTION.dateLabel}</p>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-gold-200"><Gift className="h-4 w-4" aria-hidden="true" /> Fanreal factory promo</p>
          <h2 className="mt-1 text-xl font-semibold text-ivory-50">Included with eligible custom silicone builds</h2>
          <ul className="mt-5 grid gap-2">
            {offer.included.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ivory-200">
                <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                <span>Free {item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-ivory-400">Custom full-body and eligible torso builds only. Ready-to-ship and warehouse products are excluded. DollWOW’s sitewide 10% is applied at checkout.</p>
        </div>
      </div>
    </section>
  );
}
