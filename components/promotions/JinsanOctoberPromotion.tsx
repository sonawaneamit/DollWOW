"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { isJinsanOctoberActive, jinsanOctoberBrandForProduct, JINSAN_OCTOBER_OFFERS, JINSAN_OCTOBER_TIMING, type JinsanOctoberBrand } from "@/lib/promotions/jinsanOctober2026";
import type { Product } from "@/types/product";

export function JinsanOctoberPdpPromotion({ product, promoClock }: { product: Pick<Product, "title" | "handle" | "vendor" | "productType" | "tags" | "extended">; promoClock: string }) {
  const brand = jinsanOctoberBrandForProduct(product, new Date(promoClock));
  return brand ? <div className="mt-4"><FactoryOffer brand={brand} placement="pdp" /></div> : null;
}

export function JinsanOctoberIndexCards({ promoClock }: { promoClock: string }) {
  if (!isJinsanOctoberActive(new Date(promoClock))) return null;
  return <>{(["lusandy", "wm"] as const).map(brand => <FactoryOffer key={brand} brand={brand} placement="index" />)}</>;
}

function FactoryOffer({ brand, placement }: { brand: JinsanOctoberBrand; placement: "pdp" | "index" }) {
  const offer = JINSAN_OCTOBER_OFFERS[brand];
  const [open, setOpen] = useState(false);
  const detailsId = `${offer.id}-${placement}-details`;
  return (
    <section id={placement === "index" ? offer.id : undefined} data-jinsan-october={brand} aria-label={`${offer.brand} October factory promotion`} className="overflow-hidden rounded-lg border border-border bg-surface text-text">
      <button type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(value => !value)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
        <Image src={offer.image} alt={`${offer.brand} official factory promotion, 1-31 October 2026. Benefits listed in the expandable details below.`} width={offer.width} height={offer.height} sizes="(min-width: 1024px) 55vw, 100vw" className="h-auto w-full object-contain" />
        <span className="flex min-h-12 items-center justify-between gap-3 border-t border-border px-4 py-3 text-base font-semibold">
          <span>{offer.brand} October offer - view details</span>
          <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div id={detailsId} hidden={!open} className="border-t border-border px-5 py-5 sm:px-6">
        <p className="flex items-center gap-2 text-base font-semibold text-accent"><CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />{JINSAN_OCTOBER_TIMING.dateLabel}</p>
        <p className="mt-3 text-base leading-7 text-text-dim">{offer.scope}</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <OfferList title="Free factory upgrades" items={offer.included} />
          {offer.standard.length ? <OfferList title="Standard options included" items={offer.standard} /> : null}
          {offer.discounts.length ? <OfferList title="Factory discounts" items={offer.discounts} /> : null}
        </div>
        {brand === "wm" ? <p className="mt-5 text-base leading-7 text-text-dim">Breathing is free with eligible builds through October 31. For the suction-feature discount, <Link href="/support?subject=WM%20October%20factory%20offer" className="font-semibold text-accent underline underline-offset-4">confirm your build and promotional price with us before ordering</Link>. The suction-feature discount is not automatically applied by the online configurator. Choose your extra head; we won&apos;t choose a face for you.</p> : null}
      </div>
    </section>
  );
}

function OfferList({ title, items }: { title: string; items: readonly string[] }) {
  return <div><h3 className="text-lg font-semibold">{title}</h3><ul className="mt-3 grid gap-2">{items.map(item => <li key={item} className="flex gap-2 text-base leading-7 text-text-dim"><Check className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>;
}
