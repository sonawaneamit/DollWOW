"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Loader2, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import { MAX_ITEM_QUANTITY } from "@/lib/cart/bag";
import { clearBrowserCartState, useLegacyCartState } from "@/lib/cart/browser";
import { formatMoney } from "@/lib/utils/currency";
import { useMounted } from "@/lib/utils/storageStore";

export function CartPageClient() {
  const cart = useCart();
  const legacy = useLegacyCartState();
  const mounted = useMounted();
  const viewTrackedRef = useRef(false);
  const { loadUpsells } = cart;

  useEffect(() => {
    loadUpsells();
  }, [loadUpsells]);

  useEffect(() => {
    if (!mounted || viewTrackedRef.current || !cart.items.length) return;
    viewTrackedRef.current = true;
    trackEvent(analyticsEvents.viewCart, {
      value: cart.subtotal,
      currency: cart.currencyCode,
      item_count: cart.count
    });
  }, [mounted, cart.items.length, cart.subtotal, cart.currencyCode, cart.count]);

  if (!mounted) {
    return <div className="min-h-48 rounded-[18px] border border-gold-500/14 bg-ivory-50/[0.03]" aria-hidden="true" />;
  }

  if (!cart.items.length) {
    return (
      <div className="grid gap-4">
        <div className="rounded-[18px] border border-gold-500/16 bg-ink-800/72 p-8 text-center">
          <ShoppingBag className="mx-auto h-9 w-9 text-gold-300" />
          <h2 className="mt-3 text-2xl font-semibold text-ivory-50">Your bag is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ivory-400">
            Add a doll or an accessory from any product page and it will wait for you here. Not sure where to start? The
            quiz builds a shortlist in about a minute.
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
        {legacy ? <LegacySavedCheckout onCleared={() => clearBrowserCartState()} /> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <ul className="grid gap-3">
          {cart.items.map((item) => (
            <li key={item.merchandiseId} className="rounded-[18px] border border-gold-500/14 bg-ink-800/72 p-4">
              <div className="flex gap-4">
                <Link
                  href={`/products/${item.productHandle}`}
                  className="relative h-32 w-24 shrink-0 overflow-hidden rounded-[14px] bg-ink-900"
                >
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.imageAlt ?? item.productTitle} fill sizes="96px" className="object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-gold-300">
                      <ShoppingBag className="h-6 w-6" />
                    </span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {item.brand ? (
                        <p className="text-sm font-semibold  text-gold-300">{item.brand}</p>
                      ) : null}
                      <Link
                        href={`/products/${item.productHandle}`}
                        className="mt-0.5 block text-base font-semibold text-ivory-50 hover:text-gold-200"
                      >
                        {item.productDisplayName || item.productTitle}
                      </Link>
                      <p className="mt-1 text-sm text-ivory-500">
                        {item.readyToShip ? "Ready to ship · timing confirmed before checkout" : "Made to order · reviewed by our team first"}
                      </p>
                      {item.attributes?.length ? (
                        <ul className="mt-2 grid gap-0.5">
                          {item.attributes.slice(0, 4).map((attribute) => (
                            <li key={attribute.key} className="text-sm text-ivory-500">
                              <span className="text-ivory-600">{attribute.key}:</span> {attribute.value}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.removeItem(item.merchandiseId)}
                      className="rounded-[10px] p-2 text-ivory-500 transition hover:bg-ivory-50/[0.06] hover:text-danger"
                      aria-label={`Remove ${item.productDisplayName || item.productTitle}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-gold-500/18">
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.merchandiseId, item.quantity - 1)}
                        className="px-3 py-2 text-ivory-300 hover:text-ivory-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-7 text-center text-sm font-semibold text-ivory-100">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => cart.updateQuantity(item.merchandiseId, Math.min(MAX_ITEM_QUANTITY, item.quantity + 1))}
                        className="px-3 py-2 text-ivory-300 hover:text-ivory-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-base font-semibold text-gold-200">{formatMoney(item.unitPrice * item.quantity, item.currencyCode)}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {cart.upsells.length ? (
          <section className="mt-8" aria-label="Pairs well with your bag">
            <p className="text-sm font-semibold  text-gold-300">Complete your order</p>
            <h2 className="mt-1 text-xl font-semibold text-ivory-50">Pairs well with your bag</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {cart.upsells.slice(0, 4).map((upsell) => (
                <div key={upsell.merchandiseId} className="flex items-center gap-3 rounded-[16px] border border-gold-500/14 bg-ink-800/72 p-3">
                  <Link href={`/products/${upsell.productHandle}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[12px] bg-ink-900">
                    {upsell.imageUrl ? (
                      <Image src={upsell.imageUrl} alt={upsell.imageAlt ?? upsell.productTitle} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${upsell.productHandle}`} className="block truncate text-sm font-semibold text-ivory-100 hover:text-gold-200">
                      {upsell.productTitle}
                    </Link>
                    <p className="mt-1 text-sm text-gold-200">{formatMoney(upsell.unitPrice, upsell.currencyCode)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      cart.addItem(
                        {
                          merchandiseId: upsell.merchandiseId,
                          productHandle: upsell.productHandle,
                          productTitle: upsell.productTitle,
                          brand: upsell.brand,
                          imageUrl: upsell.imageUrl,
                          imageAlt: upsell.imageAlt,
                          unitPrice: upsell.unitPrice,
                          currencyCode: upsell.currencyCode,
                          readyToShip: upsell.readyToShip
                        },
                        { openDrawer: false }
                      );
                      trackEvent(analyticsEvents.addUpsell, { item_name: upsell.productTitle, location: "cart_page" });
                    }}
                    className="shrink-0 rounded-full border border-gold-500/24 px-4 py-2 text-sm font-semibold  text-gold-200 transition hover:border-gold-300/60 hover:text-gold-100"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="h-fit rounded-[18px] border border-gold-500/16 bg-ink-800/72 p-5 lg:sticky lg:top-24">
        <p className="text-sm font-semibold  text-gold-300">Order summary</p>
        <div className="mt-3 flex items-center justify-between text-sm text-ivory-300">
          <span>Subtotal ({cart.count} item{cart.count === 1 ? "" : "s"})</span>
          <strong className="text-xl text-gold-200">{formatMoney(cart.subtotal, cart.currencyCode)}</strong>
        </div>
        <p className="mt-2 text-sm leading-5 text-ivory-500">
          Shipping, taxes, and any custom options are confirmed at checkout. Custom builds include factory photo
          approval before anything ships.
        </p>
        {cart.checkoutError ? <p className="mt-3 text-sm text-danger">{cart.checkoutError}</p> : null}
        <button
          type="button"
          onClick={cart.checkout}
          disabled={cart.checkoutPending}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition disabled:opacity-60"
        >
          {cart.checkoutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Secure checkout
        </button>
        <p className="mt-3 text-center text-sm leading-4 text-ivory-500">
          Plain packaging · neutral billing · buyer protection
        </p>
        <Link
          href="/shop"
          className="mt-4 block text-center text-sm font-semibold text-ivory-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}

function LegacySavedCheckout({ onCleared }: { onCleared: () => void }) {
  const legacy = useLegacyCartState();
  if (!legacy) return null;

  return (
    <div className="rounded-[18px] border border-gold-500/16 bg-ink-800/72 p-5">
      <div className="flex flex-wrap items-center gap-4">
        {legacy.productImageUrl ? (
          <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[12px] bg-ink-900">
            <Image
              src={legacy.productImageUrl}
              alt={legacy.productImageAlt ?? legacy.productTitle ?? "Saved checkout"}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold  text-gold-300">Saved checkout</p>
          <p className="mt-1 text-sm font-semibold text-ivory-100">
            {legacy.productDisplayName || legacy.productTitle || "Your previous checkout"} is still saved
          </p>
          <p className="mt-1 text-sm leading-5 text-ivory-500">
            {legacy.totalQuantity} item{legacy.totalQuantity === 1 ? "" : "s"} · saved {new Date(legacy.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={legacy.checkoutUrl}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold  text-white transition"
          >
            <Lock className="h-3.5 w-3.5" /> Resume checkout
          </a>
          <button
            type="button"
            onClick={onCleared}
            className="rounded-full border border-gold-500/24 px-4 py-2 text-sm font-semibold  text-ivory-300 transition hover:border-gold-300/50 hover:text-ivory-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
