"use client";

import { useId, useState } from "react";
import Image from 'next/image';
import { CalendarDays, Check, ChevronDown, Gift } from "lucide-react";
import { octoberOfferForProduct, octoberSupportedBenefits, type OctoberProduct, type OctoberPricingContext } from "@/lib/promotions/october2026";

export function OctoberSupplierPdpPromotion({ product, promoClock, context }: {
  product: OctoberProduct; promoClock: string; context: OctoberPricingContext
}) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date(promoClock);
  const offer = octoberOfferForProduct(product, now);
  const benefits = octoberSupportedBenefits(product, context, now);
  if (!offer || !benefits.length) return null;
  return (
    <section className="mb-6 border-y border-border py-3 text-text" aria-label={offer.title} data-october-supplier-promotion>
      {offer.facts.brand === 'irontech' || offer.facts.brand === 'real-lady' ? <Image src={`/promo/october-2026/${offer.facts.brand}.jpg`} alt={`${offer.facts.brand === 'irontech' ? 'Irontech' : 'Real Lady'} factory Halloween offer, ${offer.campaign.startsOn} through ${offer.campaign.endsOn}`} width={1920} height={offer.facts.brand === 'irontech' ? 1080 : 1312} sizes="(max-width: 768px) 100vw, 60vw" className="mb-3 h-auto w-full rounded-lg" /> : null}
      <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-base font-semibold text-text focus-visible:outline focus-visible:outline-accent"
        aria-expanded={isOpen} aria-controls={id} onClick={() => setIsOpen((open) => !open)}>
        <span className="flex min-w-0 items-center gap-2"><Gift className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />{offer.title}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-accent ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id={id} hidden={!isOpen} className="py-3 text-base leading-7 text-text-dim">
        <p className="flex items-start gap-2 text-accent"><CalendarDays className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          {offer.campaign.startsOn} through {offer.campaign.endsOn}, US Pacific time.
        </p>
        <p className="mt-3">Eligible custom {offer.facts.form === "head" ? "silicone heads" : offer.facts.form === "torso" ? "silicone torsos" : "full-body dolls"} only. Available upgrades depend on the selected body and head. Ready-to-ship stock is excluded.</p>
        <ul className="mt-3 grid gap-2">
          {benefits.map((item) => <li key={item} className="flex items-start gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><span>{item}</span></li>)}
        </ul>
      </div>
    </section>
  );
}
