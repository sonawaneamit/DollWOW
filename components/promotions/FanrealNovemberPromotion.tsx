"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarDays, Check, ChevronDown, Gift } from "lucide-react";
import { FANREAL_NOVEMBER_PROMOTION, fanrealNovemberHasCustomerOffer } from "@/lib/promotions/fanrealNovember2026";
import type { Product } from "@/types/product";

type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended" | "priceRange">;

export function FanrealNovemberPdpPromotion({ product, promoClock }: { product: PromotionProduct; promoClock?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  // Only render when the server attached the offer (flag is on). Do not read the
  // date window alone or this banner would appear on the live site before approval.
  const offer = product.extended.fanrealNovember;
  if (!fanrealNovemberHasCustomerOffer(offer)) return null;
  void promoClock;

  const detailsId = "fanreal-november-pdp-details";
  const included = offer.kind === "custom" ? FANREAL_NOVEMBER_PROMOTION.includedLabels : [];
  return (
    <section className="mt-4" aria-label="Fanreal November factory promotion" data-fanreal-november-pdp-promotion>
      <div className="w-full overflow-hidden rounded-[16px] border border-gold-500/25 bg-ink-900">
        <button
          type="button"
          className="group block w-full cursor-pointer bg-ink-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300"
          aria-expanded={isOpen}
          aria-controls={detailsId}
          onClick={() => setIsOpen((open) => !open)}
          data-fanreal-november-promotion-banner
        >
          <span className="relative block aspect-[4/5] w-full overflow-hidden bg-[#f5eee6] sm:aspect-[2/1]">
            <Image src={FANREAL_NOVEMBER_PROMOTION.mobileHeroImage} alt={FANREAL_NOVEMBER_PROMOTION.heroAlt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain sm:hidden" />
            <Image src={FANREAL_NOVEMBER_PROMOTION.heroImage} alt={FANREAL_NOVEMBER_PROMOTION.heroAlt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="hidden object-contain sm:block" />
          </span>
          <span className="flex min-h-12 items-center justify-between gap-3 border-t border-gold-500/20 bg-ink-950 px-4 py-3 text-sm font-semibold text-ivory-100 sm:px-5">
            <span>Fanreal November deal — {FANREAL_NOVEMBER_PROMOTION.dateLabel}</span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-gold-300 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </span>
        </button>
        <div id={detailsId} hidden={!isOpen} className="border-t border-gold-500/20 bg-ink-900 px-5 py-5 sm:px-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-300"><CalendarDays className="h-4 w-4" aria-hidden="true" /> {FANREAL_NOVEMBER_PROMOTION.dateLabel}</p>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-gold-200"><Gift className="h-4 w-4" aria-hidden="true" /> Fanreal factory promo</p>
          <h2 className="mt-1 text-xl font-semibold text-ivory-50">
            {offer.kind === "custom" ? FANREAL_NOVEMBER_PROMOTION.customHeadline : FANREAL_NOVEMBER_PROMOTION.inStockHeadline}
          </h2>
          {offer.kind === "custom" ? (
            <ul className="mt-5 grid gap-2">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ivory-200">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-ivory-200">This in-stock doll is part of Fanreal&apos;s November deal for EU, US and CA stock. Free custom extras apply to made-to-order dolls only.</p>
          )}
          <p className="mt-4 text-sm leading-6 text-ivory-400">Our $299 Black Friday code BLACKFRIDAYWOW26 still stacks at checkout on orders of $900 or more. This Fanreal deal ends 30 November 2026.</p>
        </div>
      </div>
    </section>
  );
}
