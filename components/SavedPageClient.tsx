"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, X } from "lucide-react";
import { RecentlyViewedRail } from "@/components/RecentlyViewedRail";
import { removeFromWishlist, useWishlist } from "@/lib/cart/wishlist";
import { formatMoney } from "@/lib/utils/currency";
import { useMounted } from "@/lib/utils/storageStore";

export function SavedPageClient() {
  const items = useWishlist();
  const mounted = useMounted();

  if (!mounted) {
    return <div className="min-h-48 rounded-[18px] border border-gold-500/14 bg-ivory-50/[0.03]" aria-hidden="true" />;
  }

  return (
    <>
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((entry) => (
            <article
              key={entry.productHandle}
              className="group relative overflow-hidden rounded-[18px] border border-gold-500/14 bg-ivory-50/[0.035] transition hover:border-gold-300/50"
            >
              <Link href={`/products/${entry.productHandle}`} className="block">
                <div className="relative aspect-[4/5] bg-ink-900">
                  {entry.imageUrl ? (
                    <Image
                      src={entry.imageUrl}
                      alt={entry.imageAlt ?? entry.productTitle}
                      fill
                      sizes="(min-width: 1024px) 24vw, (min-width: 640px) 30vw, 46vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-gold-300">
                      <Heart className="h-7 w-7" />
                    </span>
                  )}
                  {entry.readyToShip ? (
                    <span className="absolute left-2.5 top-2.5 rounded-full border border-emerald-300/30 bg-emerald-900/85 px-2 py-0.5 text-sm font-bold  text-emerald-100">
                      Ready to ship
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  {entry.brand ? (
                    <p className="text-sm font-bold  text-gold-300">{entry.brand}</p>
                  ) : null}
                  <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-ivory-100">{entry.productTitle}</h2>
                  <p className="mt-1.5 text-sm font-semibold text-gold-200">{formatMoney(entry.unitPrice, entry.currencyCode)}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => removeFromWishlist(entry.productHandle)}
                aria-label={`Remove ${entry.productTitle} from saved dolls`}
                className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/55 text-ivory-200 transition hover:border-danger/60 hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-gold-500/16 bg-ink-800/72 p-8 text-center">
          <Heart className="mx-auto h-9 w-9 text-gold-300" />
          <h2 className="mt-3 text-2xl font-semibold text-ivory-50">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ivory-400">
            Tap the heart on any doll to keep it here while you compare. Your saved list stays private on this device.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition"
            >
              Browse the catalog <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/help-me-choose"
              className="inline-flex items-center gap-2 rounded-full border border-gold-500/24 px-5 py-2.5 text-sm font-semibold text-ivory-100 transition hover:border-gold-300/60"
            >
              Help me choose
            </Link>
          </div>
        </div>
      )}

      <RecentlyViewedRail />
    </>
  );
}
