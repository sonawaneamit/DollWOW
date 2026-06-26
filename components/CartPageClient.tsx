"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, RotateCcw, ShoppingBag } from "lucide-react";
import { clearBrowserCartState, readBrowserCartState, type BrowserCartState } from "@/lib/cart/browser";
import { GoldButton } from "./GoldButton";

export function CartPageClient() {
  const [cartState, setCartState] = useState<BrowserCartState | null>(null);

  useEffect(() => {
    const sync = () => setCartState(readBrowserCartState());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("dollwow:cart-updated", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dollwow:cart-updated", sync as EventListener);
    };
  }, []);

  if (!cartState) {
    return (
      <div className="border border-gold-500/16 bg-ink-800/72 p-6 text-left sm:p-8">
        <div className="grid h-12 w-12 place-items-center bg-gold-300/10 text-gold-300">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-ivory-50">Your cart is empty</h2>
        <p className="mt-3 text-ivory-400">
          Start from a product page to choose options and open checkout. If you leave checkout and come back, we will
          show your saved checkout link here.
        </p>
        <div className="mt-6">
          <GoldButton href="/shop">Browse the catalog</GoldButton>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gold-500/16 bg-ink-800/72 text-left">
      <div className="grid gap-0 lg:grid-cols-[minmax(260px,380px)_1fr]">
        <div className="relative min-h-[320px] border-b border-gold-500/16 bg-ink-950/60 lg:border-b-0 lg:border-r">
          {cartState.productImageUrl ? (
            <Image
              src={cartState.productImageUrl}
              alt={cartState.productImageAlt ?? cartState.productTitle ?? "Saved product preview"}
              fill
              sizes="(min-width: 1024px) 380px, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center text-gold-300">
              <ShoppingBag className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/22 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Saved product</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-ivory-50">
              {cartState.productDisplayName || cartState.productTitle || "Your latest checkout"}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Ready to continue</p>
              <h2 className="mt-2 text-3xl font-semibold text-ivory-50">Your checkout is saved.</h2>
            </div>
            <div className="inline-flex items-center gap-2 border border-gold-500/16 bg-ink-950/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-300">
              <Lock className="h-4 w-4 text-gold-300" />
              Private checkout
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-ivory-400">
            {cartState.productTitle
              ? `${cartState.productTitle} is ready. Continue to Shopify checkout, or return to the product if you want to review options first.`
              : "Your latest checkout is ready. Continue to Shopify checkout, or keep browsing."}
          </p>
          {cartState.productDisplayName ? <p className="mt-2 text-sm text-ivory-500">Reference name: {cartState.productDisplayName}</p> : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border border-gold-500/16 bg-ink-950/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">Items</p>
              <p className="mt-2 text-lg font-semibold text-ivory-100">{cartState.totalQuantity}</p>
            </div>
            <div className="border border-gold-500/16 bg-ink-950/45 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">Saved</p>
              <p className="mt-2 text-sm text-ivory-300">
                {new Date(cartState.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={cartState.checkoutUrl}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-200 to-gold-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-glow transition duration-200 hover:-translate-y-0.5"
            >
              Continue checkout <ArrowRight className="h-4 w-4" />
            </a>
            {cartState.productHandle ? (
              <Link href={`/products/${cartState.productHandle}`} className="border border-gold-500/22 px-5 py-3 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
                Review product
              </Link>
            ) : null}
            <Link href="/shop" className="border border-gold-500/22 px-5 py-3 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
              Keep shopping
            </Link>
            <button
              type="button"
              onClick={() => clearBrowserCartState()}
              className="inline-flex items-center gap-2 border border-gold-500/22 px-5 py-3 text-sm font-semibold text-ivory-200 hover:border-gold-300/50"
            >
              <RotateCcw className="h-4 w-4" />
              Clear saved checkout
            </button>
          </div>
          {cartState.customizationSummary?.length ? (
            <div className="mt-7 border border-gold-500/16 bg-ink-950/38 p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Custom choices</p>
                  <h3 className="mt-1 text-xl font-semibold text-ivory-50">Options selected</h3>
                </div>
                <span className="text-sm text-ivory-500">{cartState.customizationSummary.length} groups</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {cartState.customizationSummary.map((item) => (
                  <div key={item.groupLabel} className="border border-gold-500/12 bg-ink-900/55 p-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-300">{item.groupLabel}</p>
                    <p className="mt-1 text-sm font-semibold text-ivory-100">{item.optionLabels.join(", ")}</p>
                    {item.priceDelta ? (
                      <p className="mt-1 text-xs font-semibold text-gold-200">+{formatCartMoney(item.priceDelta, cartState.currencyCode)}</p>
                    ) : (
                      <p className="mt-1 text-xs text-ivory-500">Included</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mt-5 text-sm leading-6 text-ivory-500">
            Product pages send you straight to secure Shopify checkout. This page simply saves your latest checkout link
            so you can get back to it.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatCartMoney(amount: number, currencyCode = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
