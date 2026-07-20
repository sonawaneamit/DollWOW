"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRecentlyViewed } from "@/lib/cart/recentlyViewed";
import { formatMoney } from "@/lib/utils/currency";
import { useMounted } from "@/lib/utils/storageStore";

/**
 * "Recently viewed" rail for cart/saved pages. Renders nothing until mounted
 * (localStorage-backed) and nothing at all when there is no history.
 */
export function RecentlyViewedRail({ excludeHandle, title = "Recently viewed" }: { excludeHandle?: string; title?: string }) {
  const entries = useRecentlyViewed();
  const mounted = useMounted();
  const items = mounted ? entries.filter((entry) => entry.productHandle !== excludeHandle).slice(0, 6) : [];

  if (!items.length) return null;

  return (
    <section className="mt-10" aria-label={title}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Keep browsing</p>
          <h2 className="mt-1 text-xl font-semibold text-ivory-50">{title}</h2>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ivory-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
        >
          Browse catalog <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((entry) => (
          <Link
            key={entry.productHandle}
            href={`/products/${entry.productHandle}`}
            className="group overflow-hidden rounded-[16px] border border-gold-500/14 bg-ivory-50/[0.035] transition hover:-translate-y-0.5 hover:border-gold-300/50"
          >
            <div className="relative aspect-[4/5] bg-ink-900">
              {entry.imageUrl ? (
                <Image
                  src={entry.imageUrl}
                  alt={entry.imageAlt ?? entry.productTitle}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 44vw"
                  className="object-cover"
                />
              ) : null}
              {entry.readyToShip ? (
                <span className="absolute left-2 top-2 rounded-full border border-emerald-300/30 bg-emerald-900/85 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-emerald-100">
                  Ready
                </span>
              ) : null}
            </div>
            <div className="p-2.5">
              {entry.brand ? <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-gold-300">{entry.brand}</p> : null}
              <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-ivory-100">{entry.productTitle}</p>
              <p className="mt-1 text-xs font-semibold text-gold-200">{formatMoney(entry.unitPrice, entry.currencyCode)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
