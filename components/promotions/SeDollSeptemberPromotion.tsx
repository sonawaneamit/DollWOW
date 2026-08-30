import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, Gift } from "lucide-react";
import {
  isSeDollSeptemberPromotionVisible,
  SE_DOLL_SEPTEMBER_PROMOTION,
  seDollSeptemberFreebiesForProduct,
  seDollSeptemberPromotionStatus
} from "@/lib/promotions/seDollSeptember2026";
import type { Product } from "@/types/product";

export function SeDollBrandPromotionBanner() {
  if (!isSeDollSeptemberPromotionVisible()) return null;

  return (
    <section className="mb-8 overflow-hidden rounded-[20px] border border-gold-500/18 bg-ink-950 shadow-panel" aria-labelledby="se-doll-promo-heading">
      <div className="relative aspect-[1920/750] min-h-[210px] w-full overflow-hidden bg-ink-950">
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
            Custom TPE and STPE orders include the six factory bonuses shown above. DollWOW’s sitewide 10% is applied at checkout.
          </p>
        </div>
        <Link href={SE_DOLL_SEPTEMBER_PROMOTION.promoHref} className="inline-flex min-h-11 items-center justify-center rounded-button bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover">
          View promotion details
        </Link>
      </div>
    </section>
  );
}

export function SeDollPdpFreebieBlock({ product }: { product: Pick<Product, "handle" | "extended"> }) {
  const promotion = seDollSeptemberFreebiesForProduct(product);
  if (!promotion) return null;

  const freebies = promotion.includesSoftBelly
    ? [...promotion.freebies, "Free soft belly"]
    : promotion.freebies;

  return (
    <section className="mt-6 overflow-hidden rounded-[16px] border border-gold-500/25 bg-ink-900/80" aria-labelledby="se-pdp-bonuses-heading">
      <div className="relative isolate overflow-hidden border-b border-gold-500/20 px-5 py-4">
        <Image
          src={SE_DOLL_SEPTEMBER_PROMOTION.heroImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="-z-20 object-cover object-center opacity-55"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/35" aria-hidden="true" />
        <div className="relative">
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-200">
            <Gift className="h-4 w-4" aria-hidden="true" /> SE Doll September bonus
          </p>
          <h2 id="se-pdp-bonuses-heading" className="mt-1 text-xl font-semibold text-ivory-50">
            Free {promotion.material} custom-order upgrades
          </h2>
          <p className="mt-1 text-sm leading-6 text-ivory-200">For custom orders placed 1–30 September 2026.</p>
        </div>
      </div>
      <ul className="grid gap-x-5 gap-y-2 px-5 py-5 sm:grid-cols-2" aria-label="Included September upgrades">
        {freebies.map((freebie) => (
          <li key={freebie} className="flex items-start gap-2 text-sm leading-6 text-ivory-200">
            <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
            <span>{freebie}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SeDollPromoIndexCard() {
  const promo = SE_DOLL_SEPTEMBER_PROMOTION;

  return (
    <article className="overflow-hidden rounded-[20px] border border-gold-500/18 bg-ink-900/72 shadow-panel">
      <div className="relative aspect-[1920/750] min-h-[210px] w-full overflow-hidden bg-ink-950">
        <Image
          src={promo.heroImage}
          alt={promo.heroAlt}
          fill
          priority
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="object-contain"
        />
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gold-500/14 px-3 py-1 text-sm font-semibold text-gold-200">{seDollSeptemberPromotionStatus()}</span>
          <span className="text-sm font-semibold text-ivory-400">{promo.dateLabel}</span>
        </div>
        <p className="mt-5 text-sm font-semibold text-gold-300">{promo.brand}</p>
        <h2 className="mt-2 text-3xl font-semibold text-ivory-50">{promo.shortTitle}</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ivory-300">{promo.summary}</p>
        <h3 className="mt-6 text-base font-semibold text-ivory-100">Included on eligible custom TPE and STPE orders</h3>
        <ul className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
          {promo.tpeFreebies.map((freebie) => (
            <li key={freebie} className="flex items-start gap-2 text-sm leading-6 text-ivory-300">
              <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" /> {freebie}
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-[12px] border border-gold-500/14 bg-ink-950/55 px-4 py-3 text-sm leading-6 text-ivory-300">
          DollWOW’s sitewide 10% is applied at checkout. Ready-to-ship dolls are already built and do not receive these custom-order upgrades.
        </p>
        <Link href={promo.brandHref} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-button bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover">
          Shop SE Doll custom models
        </Link>
      </div>
    </article>
  );
}
