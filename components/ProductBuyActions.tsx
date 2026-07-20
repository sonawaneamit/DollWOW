"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Loader2, Lock, ShieldCheck, ShoppingBag, Sparkles, Truck, Zap } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { TrustLogoStrip } from "@/components/TrustLogoStrip";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import { writeBrowserCartState } from "@/lib/cart/browser";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { installmentLabel } from "@/lib/commerce/installments";
import { formatMoney } from "@/lib/utils/currency";
import type { ProductImage } from "@/types/product";

type ProductBuyActionsProps = {
  merchandiseId: string;
  productTitle: string;
  productDisplayName?: string;
  productHandle: string;
  productImage: ProductImage | null;
  brand?: string;
  unitPrice: number;
  currencyCode: string;
  deliveryEstimate?: string;
  bodyType?: string;
  readyToShip: boolean;
};

/**
 * PDP buy box. Two lanes: "Add to bag" (multi-item bag + drawer, buy as
 * shown) and "Buy it now" (legacy single-line express checkout). Customizing
 * scrolls to the Build Studio below the fold.
 */
export function ProductBuyActions({
  merchandiseId,
  productTitle,
  productDisplayName,
  productHandle,
  productImage,
  brand,
  unitPrice,
  currencyCode,
  deliveryEstimate,
  bodyType,
  readyToShip
}: ProductBuyActionsProps) {
  const router = useRouter();
  const cart = useCart();
  const [buyNowPending, setBuyNowPending] = useState(false);
  const [buyNowError, setBuyNowError] = useState("");

  const name = productDisplayName || productTitle;
  const customizeLabel = bodyType === "male" ? "Customize him" : bodyType === "female" ? "Customize her" : "Customize this build";
  const installments = installmentLabel(unitPrice, currencyCode, formatMoney);
  const buildAttributes = [
    { key: "DollWow Build", value: "Buy as shown" },
    ...(productDisplayName ? [{ key: "DollWow Reference Name", value: productDisplayName }] : [])
  ];

  function addToBag() {
    cart.addItem({
      merchandiseId,
      productHandle,
      productTitle,
      productDisplayName,
      brand,
      imageUrl: productImage?.url,
      imageAlt: productImage?.altText ?? productTitle,
      unitPrice,
      currencyCode,
      readyToShip,
      attributes: buildAttributes
    });
  }

  async function buyNow() {
    if (buyNowPending) return;
    setBuyNowPending(true);
    setBuyNowError("");
    try {
      const response = await fetch("/api/cart/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ merchandiseId, quantity: 1, attributes: buildAttributes })
      });
      const payload = await response.json();
      if (!response.ok) {
        setBuyNowError(payload.error ?? "Could not start checkout.");
        return;
      }
      const checkoutUrl = normalizeCheckoutUrl(payload.checkoutUrl);
      writeBrowserCartState({
        checkoutUrl,
        totalQuantity: payload.totalQuantity ?? 1,
        productTitle,
        productDisplayName,
        productHandle,
        productImageUrl: productImage?.url,
        productImageAlt: productImage?.altText ?? productTitle,
        merchandiseId,
        quantity: 1,
        readyToShip,
        currencyCode
      });
      trackEvent(analyticsEvents.addToCart, {
        item_id: merchandiseId,
        item_name: name,
        item_brand: brand,
        price: unitPrice,
        currency: currencyCode,
        quantity: 1
      });
      trackEvent(analyticsEvents.beginCheckout, { value: unitPrice, currency: currencyCode, item_count: 1 });
      router.push(checkoutUrl);
    } catch {
      setBuyNowError("Could not start checkout. Please try again.");
    } finally {
      setBuyNowPending(false);
    }
  }

  function scrollToCustomizer() {
    const target = document.getElementById("build-studio");
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="mt-6 rounded-[22px] border border-gold-500/20 bg-ivory-50/[0.04] p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Buy as shown</p>
        {installments ? <p className="text-xs text-ivory-500">{installments}</p> : null}
      </div>

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={addToBag}
          className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-200 to-gold-500 px-5 py-3.5 text-base font-semibold text-ink-950 shadow-glow transition hover:-translate-y-0.5"
        >
          <ShoppingBag className="h-5 w-5" />
          Add to bag · {formatMoney(unitPrice, currencyCode)}
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={buyNow}
            disabled={buyNowPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold-500/24 bg-ivory-50/[0.05] px-4 py-2.5 text-sm font-semibold text-ivory-50 transition hover:border-gold-300/60 disabled:opacity-60"
          >
            {buyNowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-gold-300" />}
            Buy it now
          </button>
          <button
            type="button"
            onClick={scrollToCustomizer}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold-500/24 bg-ivory-50/[0.05] px-4 py-2.5 text-sm font-semibold text-ivory-50 transition hover:border-gold-300/60"
          >
            <Sparkles className="h-4 w-4 text-gold-300" />
            {customizeLabel}
          </button>
        </div>
        {buyNowError ? <p className="text-sm text-danger">{buyNowError}</p> : null}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-gold-500/14 bg-ink-950/45 p-3.5">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-300/10 text-gold-300">
          <Truck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ivory-100">
            {readyToShip ? "In the warehouse now" : "Built to order for you"}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-ivory-400">
            {readyToShip
              ? `${deliveryEstimate ? `${deliveryEstimate}. ` : ""}Leaves the warehouse in 1-3 business days after stock confirmation.`
              : "You approve detailed factory photos and videos before anything ships. Timing is confirmed before you pay."}
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.72rem] text-ivory-500">
        <Lock className="h-3.5 w-3.5" /> Secure Shopify checkout · plain packaging · neutral billing
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2 text-[0.72rem]">
        <Link href="/buyer-protection" className="inline-flex items-center gap-1 rounded-full border border-gold-500/14 px-2.5 py-1 font-semibold text-ivory-400 transition hover:border-gold-300/45 hover:text-ivory-100">
          <ShieldCheck className="h-3 w-3" /> Buyer protection
        </Link>
        <Link href="/shipping-protection" className="inline-flex items-center gap-1 rounded-full border border-gold-500/14 px-2.5 py-1 font-semibold text-ivory-400 transition hover:border-gold-300/45 hover:text-ivory-100">
          <Truck className="h-3 w-3" /> Shipping protection
        </Link>
        <Link href="/how-ordering-works" className="inline-flex items-center gap-1 rounded-full border border-gold-500/14 px-2.5 py-1 font-semibold text-ivory-400 transition hover:border-gold-300/45 hover:text-ivory-100">
          <Camera className="h-3 w-3" /> How ordering works
        </Link>
      </div>

      <div className="mt-4">
        <TrustLogoStrip compact />
      </div>
    </div>
  );
}
