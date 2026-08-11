"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Loader2, Lock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { CompareButton } from "@/components/compare/CompareButton";
import { compareEntryFromCartItem } from "@/lib/compare/products";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/utils/currency";
import { MAX_ITEM_QUANTITY } from "@/lib/cart/bag";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";

export function CartDrawer() {
  const cart = useCart();
  const { drawerOpen, closeDrawer } = cart;
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [closeDrawer, drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[96]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button type="button" aria-label="Dismiss cart drawer" className="absolute inset-0 bg-black/62" onClick={cart.closeDrawer} />
      <aside ref={panelRef} className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-gold-500/20 bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-gold-500/16 px-5 py-4">
          <div>
            <p className="text-sm font-semibold  text-gold-300">Your cart</p>
            <p className="mt-1 text-sm text-ivory-400">
              {cart.count ? `${cart.count} item${cart.count === 1 ? "" : "s"}` : "Nothing here yet"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={cart.closeDrawer}
            className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-gold-500/20 text-ivory-300 transition hover:border-gold-300/50 hover:text-ivory-50"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.items.length ? (
            <ul className="grid gap-3">
              {cart.items.map((item) => (
                <li key={item.merchandiseId} className="rounded-[16px] border border-gold-500/14 bg-ivory-50/[0.035] p-3">
                  <div className="flex gap-3">
                    <Link href={`/products/${item.productHandle}`} onClick={cart.closeDrawer} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[12px] bg-ink-900">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.imageAlt ?? item.productTitle} fill sizes="80px" className="object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-gold-300">
                          <ShoppingBag className="h-5 w-5" />
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {item.brand ? <p className="text-sm font-semibold  text-gold-300">{item.brand}</p> : null}
                          <Link href={`/products/${item.productHandle}`} onClick={cart.closeDrawer} className="mt-0.5 block truncate text-sm font-semibold text-ivory-100 hover:text-gold-200">
                            {item.productDisplayName || item.productTitle}
                          </Link>
                          <p className="mt-0.5 text-sm text-ivory-500">{item.readyToShip ? "Ready to ship" : "Reviewed before production"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => cart.removeItem(item.merchandiseId)}
                          className="flex h-11 w-11 items-center justify-center rounded-[10px] text-ivory-500 transition hover:bg-ivory-50/[0.06] hover:text-danger"
                          aria-label={`Remove ${item.productDisplayName || item.productTitle}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-gold-500/18">
                          <button
                            type="button"
                            onClick={() => cart.updateQuantity(item.merchandiseId, item.quantity - 1)}
                            className="flex h-11 w-11 items-center justify-center text-ivory-300 hover:text-ivory-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold text-ivory-100">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => cart.updateQuantity(item.merchandiseId, Math.min(MAX_ITEM_QUANTITY, item.quantity + 1))}
                            className="flex h-11 w-11 items-center justify-center text-ivory-300 hover:text-ivory-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gold-200">{formatMoney(item.unitPrice * item.quantity, item.currencyCode)}</p>
                      </div>
                      <CompareButton
                        entry={compareEntryFromCartItem(item)}
                        label
                        onToggle={cart.closeDrawer}
                        className="mt-2 min-h-11 rounded-full border border-gold-500/20 px-3 text-sm font-semibold text-ivory-300 hover:border-gold-300/50 hover:text-gold-200"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[16px] border border-gold-500/14 bg-ivory-50/[0.03] p-6 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-gold-300" />
              <p className="mt-3 text-sm font-semibold text-ivory-100">Your cart is empty</p>
              <p className="mt-1 text-sm leading-5 text-ivory-400">Add a doll or an accessory and it will wait for you here.</p>
              <Link
                href="/shop/sex-dolls"
                onClick={cart.closeDrawer}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold  text-white"
              >
                Browse the catalog <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {cart.upsells.length ? (
            <div className="mt-6">
              <p className="text-sm font-semibold  text-gold-300">Complete your order</p>
              <div className="mt-3 grid gap-2">
                {cart.upsells.slice(0, 4).map((upsell) => (
                  <div key={upsell.merchandiseId} className="flex items-center gap-3 rounded-[14px] border border-gold-500/12 bg-ivory-50/[0.028] p-2.5">
                    <Link href={`/products/${upsell.productHandle}`} onClick={cart.closeDrawer} className="relative h-14 w-12 shrink-0 overflow-hidden rounded-[10px] bg-ink-900">
                      {upsell.imageUrl ? (
                        <Image src={upsell.imageUrl} alt={upsell.imageAlt ?? upsell.productTitle} fill sizes="48px" className="object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ivory-100">{upsell.productTitle}</p>
                      <p className="mt-0.5 text-sm text-gold-200">{formatMoney(upsell.unitPrice, upsell.currencyCode)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        cart.addItem({
                          merchandiseId: upsell.merchandiseId,
                          productHandle: upsell.productHandle,
                          productTitle: upsell.productTitle,
                          brand: upsell.brand,
                          imageUrl: upsell.imageUrl,
                          imageAlt: upsell.imageAlt,
                          unitPrice: upsell.unitPrice,
                          currencyCode: upsell.currencyCode,
                          readyToShip: upsell.readyToShip
                        });
                        trackEvent(analyticsEvents.addUpsell, { item_name: upsell.productTitle });
                      }}
                      className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-gold-500/24 px-3 text-sm font-semibold text-gold-200 transition hover:border-gold-300/60 hover:text-gold-100"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {cart.items.length ? (
          <div className="border-t border-gold-500/16 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ivory-400">Subtotal</span>
              <strong className="text-lg text-gold-200">{formatMoney(cart.subtotal, cart.currencyCode)}</strong>
            </div>
            <p className="mt-1 text-sm leading-4 text-ivory-500">Shipping and any custom options are confirmed at checkout.</p>
            {cart.checkoutError ? <p className="mt-2 text-sm text-danger">{cart.checkoutError}</p> : null}
            <button
              type="button"
              onClick={cart.checkout}
              disabled={cart.checkoutPending}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition disabled:opacity-60"
            >
              {cart.checkoutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Secure checkout
            </button>
            <div className="mt-3 flex items-center justify-between text-sm text-ivory-500">
              <Link href="/cart" onClick={cart.closeDrawer} className="inline-flex min-h-11 items-center font-semibold text-ivory-300 underline-offset-2 hover:underline">
                View full cart
              </Link>
              <span>Plain packaging · neutral billing</span>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
