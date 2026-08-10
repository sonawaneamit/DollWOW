"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, ShoppingBag, SlidersHorizontal, Truck, Zap } from "lucide-react";
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
  readyToShip: boolean;
  customAvailable?: boolean;
  warehouseCountry?: string;
  warehouseRegions?: string[];
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
  readyToShip,
  customAvailable,
  warehouseCountry,
  warehouseRegions
}: ProductBuyActionsProps) {
  const router = useRouter();
  const cart = useCart();
  const [buyNowPending, setBuyNowPending] = useState(false);
  const [buyNowError, setBuyNowError] = useState("");

  const name = productDisplayName || productTitle;
  const installments = installmentLabel(unitPrice, currencyCode, formatMoney);
  const canCustomize = !readyToShip || customAvailable === true;
  const buildAttributes = [
    ...(productDisplayName ? [{ key: "DollWow Reference Name", value: productDisplayName }] : []),
    { key: "Selected configuration", value: "As shown" }
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
    <div className="mt-6 rounded-lg bg-surface p-5 text-text shadow-card sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[15px] font-semibold text-text-dim">Buy as shown</p>
        {installments ? <p className="text-sm text-text-faint">{installments}</p> : null}
      </div>

      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={addToBag}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button bg-accent px-5 py-3 text-[17px] font-semibold text-white shadow-card transition-colors hover:bg-accent-hover"
        >
          <ShoppingBag className="h-5 w-5" />
          Add to bag · {formatMoney(unitPrice, currencyCode)}
        </button>
        <div className={`grid gap-3 ${canCustomize ? "sm:grid-cols-2" : ""}`}>
          <button
            type="button"
            onClick={buyNow}
            disabled={buyNowPending}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-button border-2 border-accent bg-transparent px-4 py-3 text-[17px] font-semibold text-accent transition-colors hover:bg-accent-tint disabled:opacity-60"
          >
            {buyNowPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            Buy now
          </button>
          {canCustomize ? (
            <button
              type="button"
              onClick={scrollToCustomizer}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-button border-2 border-accent bg-transparent px-4 py-3 text-[17px] font-semibold text-accent transition-colors hover:bg-accent-tint"
            >
              <SlidersHorizontal className="h-5 w-5" />
              {readyToShip ? "Available customizations" : "Customize your doll"}
            </button>
          ) : null}
        </div>
        {buyNowError ? <p className="text-sm text-danger">{buyNowError}</p> : null}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-md bg-surface-tint p-4">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stock-tint text-stock">
          <Truck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-semibold text-text">
            {readyToShip
              ? `In stock in ${(warehouseRegions?.length ? warehouseRegions.join(", ") : warehouseCountry) || "a supplier warehouse"}`
              : "Built to order for you"}
          </p>
          <p className="mt-1 text-[15px] leading-6 text-text-dim">
            {readyToShip
              ? `${deliveryEstimate ? `${deliveryEstimate}. ` : ""}${canCustomize ? "The available options below are supported for this stock unit. " : "This is the fixed configuration shown; factory options do not apply. "}Leaves the warehouse in 1-3 business days after stock confirmation.`
              : "You approve detailed factory photos and videos before anything ships. Timing is confirmed before you pay."}
          </p>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-[15px] text-text-dim">
        <Lock className="h-4 w-4" /> Secure checkout by Shopify · plain packaging · neutral billing
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[15px] font-semibold text-accent">
        <Link href="/buyer-protection" className="min-h-11 py-2 underline underline-offset-4">Buyer protection</Link>
        <span className="py-2 text-text-faint" aria-hidden="true">·</span>
        <Link href="/shipping-protection" className="min-h-11 py-2 underline underline-offset-4">Shipping protection</Link>
        <span className="py-2 text-text-faint" aria-hidden="true">·</span>
        <Link href="/how-ordering-works" className="min-h-11 py-2 underline underline-offset-4">How ordering works</Link>
      </div>

      <div className="mt-4">
        <TrustLogoStrip compact />
      </div>
    </div>
  );
}
