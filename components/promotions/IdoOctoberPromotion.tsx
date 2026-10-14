"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { IDO_OCTOBER_OFFER, IDO_OCTOBER_TIMING, idoOctoberOfferForProduct, isIdoOctoberActive } from "@/lib/promotions/idoOctober2026";
import type { Product } from "@/types/product";

export function IdoOctoberPdpPromotion({ product, promoClock }: { product: Pick<Product, "tags" | "extended">; promoClock: string }) {
  return idoOctoberOfferForProduct(product, new Date(promoClock)) ? <div className="mt-4"><IdoOffer placement="pdp" /></div> : null;
}

export function IdoOctoberIndexCard({ promoClock }: { promoClock: string }) {
  return isIdoOctoberActive(new Date(promoClock)) ? <IdoOffer placement="index" /> : null;
}

function IdoOffer({ placement }: { placement: "pdp" | "index" }) {
  const offer = IDO_OCTOBER_OFFER;
  const [open, setOpen] = useState(false);
  const detailsId = `${offer.id}-${placement}-details`;
  return (
    <section id={placement === "index" ? offer.id : undefined} data-ido-october="ido" aria-label={`${offer.brand} October factory promotion`} className="overflow-hidden rounded-lg border border-border bg-surface text-text">
      <button type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(value => !value)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
        <Image src={offer.image} alt={`${offer.brand} official factory promotion, 1-31 October 2026. Benefits listed in the expandable details below.`} width={offer.width} height={offer.height} sizes="(min-width: 1024px) 55vw, 100vw" className="h-auto w-full object-contain" />
        <span className="flex min-h-12 items-center justify-between gap-3 border-t border-border px-4 py-3 text-base font-semibold">
          <span>{offer.brand} October offer - view details</span>
          <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div id={detailsId} hidden={!open} className="border-t border-border px-5 py-5 sm:px-6">
        <p className="flex items-center gap-2 text-base font-semibold text-accent"><CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />{IDO_OCTOBER_TIMING.dateLabel}</p>
        <p className="mt-3 text-base leading-7 text-text-dim">{offer.scope}</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <OfferList title="Free factory gift" items={offer.included} />
          <OfferList title="Gifts included with every IDO doll" items={offer.standardGifts} />
        </div>
      </div>
    </section>
  );
}

function OfferList({ title, items }: { title: string; items: readonly string[] }) {
  return <div><h3 className="text-lg font-semibold">{title}</h3><ul className="mt-3 grid gap-2">{items.map(item => <li key={item} className="flex gap-2 text-base leading-7 text-text-dim"><Check className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>;
}
