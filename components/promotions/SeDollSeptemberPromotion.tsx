import Image from "next/image";
import Link from "next/link";
import { BadgePercent, CalendarDays, Check, CircleAlert, Gift } from "lucide-react";
import {
  isSeDollSeptemberPromotionVisible,
  SE_DOLL_LOOSE_JOINT_SYSTEM,
  SE_DOLL_SEPTEMBER_OFFERS,
  SE_DOLL_SEPTEMBER_PROMOTION,
  seDollSeptemberOfferForProduct,
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
  if (!offer) return null;

  const included = offer.includesSoftBelly
    ? [...offer.included, "Free soft belly"]
    : offer.included;
  const isWarehouse = offer.kind.startsWith("warehouse_");

  return (
    <section className="mt-6 overflow-hidden rounded-[16px] border border-gold-500/25 bg-ink-900" aria-labelledby="se-pdp-bonuses-heading">
      <div className="w-full bg-ink-950" data-se-pdp-promotion-banner>
        <Image
          src={offer.image}
          alt=""
          width={1920}
          height={750}
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="h-auto w-full"
          aria-hidden="true"
        />
      </div>

      <div className="border-t border-gold-500/20 bg-ink-900 px-5 py-5" data-se-pdp-promotion-details>
        <div>
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
        </div>

        {included.length || offer.discounts.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {included.length ? <OfferList title="Included factory bonuses" items={included} /> : null}
            {offer.discounts.length ? <OfferList title="Factory discount" items={offer.discounts} /> : null}
          </div>
        ) : null}

        {included.some((item) => item === SE_DOLL_LOOSE_JOINT_SYSTEM.title) ? <LooseJointSystemDetails /> : null}

        {offer.makeupPriceNote ? (
          <div className="mt-5 flex gap-3 rounded-[12px] border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm leading-6 text-ivory-100">
            <CircleAlert className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
            <p><strong className="text-gold-200">Warehouse STPE makeup pricing:</strong> {offer.makeupPriceNote}</p>
          </div>
        ) : null}
      </div>
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
        <article id={offer.id} key={offer.id} className="scroll-mt-24 overflow-hidden rounded-[20px] border border-gold-500/18 bg-ink-900/72 shadow-panel">
          <div className="relative aspect-[1920/750] min-h-[210px] w-full overflow-hidden bg-ink-950">
            <Image
              src={offer.heroImage}
              alt={offer.heroAlt}
              fill
              priority={index === 0}
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-contain"
            />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-gold-500/14 px-3 py-1 text-sm font-semibold text-gold-200">{seDollSeptemberPromotionStatus()}</span>
              <span className="text-sm font-semibold text-ivory-400">{SE_DOLL_SEPTEMBER_PROMOTION.dateLabel}</span>
            </div>
            <p className="mt-5 text-sm font-semibold text-gold-300">SE Doll factory offer {index + 1} of 4</p>
            <h2 className="mt-2 text-3xl font-semibold text-ivory-50">{offer.shortTitle}</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-ivory-300">{offer.summary}</p>

            {offer.included.length ? (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-ivory-100">{offer.includedTitle}</h3>
                <ul className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  {offer.included.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-6 text-ivory-300">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {offer.included.some((item) => item === SE_DOLL_LOOSE_JOINT_SYSTEM.title) ? <LooseJointSystemDetails /> : null}

            {offer.discounts.length ? (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-ivory-100">Factory option discounts</h3>
                <ul className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  {offer.discounts.map((discount) => (
                    <li key={discount} className="flex items-start gap-2 text-sm leading-6 text-ivory-300">
                      <BadgePercent className="mt-1 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" /> {discount}
                    </li>
                  ))}
                </ul>
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
        </article>
      ))}
    </div>
  );
}

function LooseJointSystemDetails() {
  return (
    <aside className="mt-6 rounded-[14px] border border-gold-500/20 bg-ink-950/55 p-4 sm:p-5" aria-label="Loose Joint System details">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
        <div>
          <p className="text-sm font-semibold text-gold-300">September full-doll freebie</p>
          <h3 className="mt-1 text-lg font-semibold text-ivory-50">Loose Joint System</h3>
          <p className="mt-2 text-sm leading-6 text-ivory-300">{SE_DOLL_LOOSE_JOINT_SYSTEM.summary}</p>
          <p className="mt-2 text-sm leading-6 text-ivory-400">{SE_DOLL_LOOSE_JOINT_SYSTEM.note}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-500">Custom full-size TPE / STPE and Silicone Pro only · Not torsos · Not ready to ship</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SE_DOLL_LOOSE_JOINT_SYSTEM.images.map((image) => (
            <Image
              key={image.src}
              src={image.src}
              alt={image.alt}
              width={500}
              height={500}
              sizes="(min-width: 640px) 20vw, 42vw"
              className="h-auto w-full rounded-[10px] border border-white/10"
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

// Backward-compatible name for any stale import during rolling deployments.
export const SeDollPromoIndexCard = SeDollPromoIndexCards;
