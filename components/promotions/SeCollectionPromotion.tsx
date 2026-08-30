import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SE_SEPTEMBER_PROMOTION } from "@/lib/promotions/seSeptember2026";

export function SeCollectionPromotion() {
  const promotion = SE_SEPTEMBER_PROMOTION;

  return (
    <section className="mb-8 overflow-hidden rounded-[8px] border border-gold-500/18 bg-ink-900/72" aria-labelledby="se-collection-promo-heading">
      <Link href={promotion.promoHref} className="relative block aspect-[64/25] overflow-hidden bg-ink-950">
        <Image
          src={promotion.banner.hero}
          alt={promotion.banner.alt}
          fill
          priority
          sizes="(min-width: 1280px) 1216px, calc(100vw - 2rem)"
          className="object-cover"
        />
      </Link>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:p-6">
        <div>
          <p className="text-sm font-semibold text-gold-300">{promotion.displayDates}</p>
          <h2 id="se-collection-promo-heading" className="mt-2 text-2xl font-semibold text-ivory-50">SE Doll TPE custom-order bonuses</h2>
          <p className="mt-3 text-sm leading-6 text-ivory-300">Eligible TPE and STPE custom orders include six factory bonuses during September.</p>
          <Link href={promotion.promoHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-200 hover:text-gold-100">
            View promotion details <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-2 text-sm text-ivory-200 sm:grid-cols-2">
          {promotion.tpeFrees.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <span>Free {item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

