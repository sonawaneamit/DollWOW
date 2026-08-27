"use client";

import Link from "next/link";
import { Lock, ShoppingBag, SlidersHorizontal, Truck } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { WarehouseLocationBadge } from "@/components/WarehouseLocationBadge";
import { installmentLabel } from "@/lib/commerce/installments";
import { formatMoney } from "@/lib/utils/currency";
import { estimatedDeliveryDate } from "@/lib/catalog/delivery";
import type { ProductImage, Product } from "@/types/product";
import { Care365Seal } from "@/components/care/Care365Seal";
import { PaymentLogos } from "@/components/PaymentLogos";

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
  stockStatus?: Product["extended"]["stockStatus"];
  readyToShip: boolean;
  customAvailable?: boolean;
  warehouseCountry?: string;
  warehouseRegions?: string[];
};

/**
 * PDP buy box. Warehouse products lead with Add to Cart. Made-to-order
 * products lead with configuration and retain a quieter standard-build path.
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
  stockStatus,
  readyToShip,
  customAvailable,
  warehouseCountry,
  warehouseRegions
}: ProductBuyActionsProps) {
  const cart = useCart();

  const installments = installmentLabel(unitPrice, currencyCode, formatMoney);
  const canCustomize = !readyToShip || customAvailable === true;
  const buildAttributes = [
    ...(productDisplayName ? [{ key: "DollWow Reference Name", value: productDisplayName }] : []),
    { key: "Selected configuration", value: "As shown" }
  ];
  
  const estimatedDate = stockStatus ? estimatedDeliveryDate(stockStatus) : undefined;

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

  function scrollToCustomizer() {
    const target = document.getElementById("build-studio");
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="mt-6 rounded-lg bg-surface p-5 text-text shadow-card sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[15px] font-semibold text-text-dim">{readyToShip ? "Ready to ship" : "Choose how to order"}</p>
        {installments ? <p className="text-sm text-text-faint">{installments}</p> : null}
      </div>

      <div className="mt-4 grid gap-3">
        {readyToShip ? (
          <button
            type="button"
            onClick={addToBag}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button bg-accent px-5 py-3 text-[17px] font-semibold text-white shadow-card transition-colors hover:bg-accent-hover"
          >
            <ShoppingBag className="h-5 w-5" />
            Add to Cart
          </button>
        ) : (
          <button
            type="button"
            onClick={scrollToCustomizer}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button bg-accent px-5 py-3 text-[17px] font-semibold text-white shadow-card transition-colors hover:bg-accent-hover"
          >
            <SlidersHorizontal className="h-5 w-5" />
            Customize your doll
          </button>
        )}
        {readyToShip && canCustomize ? (
          <button
            type="button"
            onClick={scrollToCustomizer}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button border-2 border-accent bg-transparent px-4 py-2.5 text-[15px] font-semibold text-accent transition-colors hover:bg-accent-tint"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Available customizations
          </button>
        ) : null}
        {!readyToShip ? (
            <button
              type="button"
              onClick={addToBag}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button border-2 border-accent bg-transparent px-4 py-2.5 text-[15px] font-semibold text-accent transition-colors hover:bg-accent-tint"
            >
              <ShoppingBag className="h-4 w-4" />
              Buy As Shown In Photos · {formatMoney(unitPrice, currencyCode)}
            </button>
        ) : null}
      </div>
      
      {estimatedDate ? (
        <p className="mt-3 text-center text-[15px] text-text-dim">
          Est. delivery <span className="font-semibold text-text">{estimatedDate.formatted}</span>
        </p>
      ) : null}

      <Care365Seal purchase className="mt-4" />

      <div className="mt-5 flex items-start gap-3 rounded-md bg-surface-tint p-4">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stock-tint text-stock">
          <Truck className="h-5 w-5" />
        </span>
        <div>
          {readyToShip ? (
            <div className="mb-2">
              <WarehouseLocationBadge regions={warehouseRegions} country={warehouseCountry} compact />
            </div>
          ) : null}
          <p className="text-base font-semibold text-text">
            {readyToShip
              ? `In stock in ${(warehouseRegions?.length ? warehouseRegions.join(", ") : warehouseCountry) || "a supplier warehouse"}`
              : "Built to order for you"}
          </p>
          <p className="mt-1 text-[15px] leading-6 text-text-dim">
            {readyToShip
              ? `${deliveryEstimate ? `${deliveryEstimate}. ` : ""}${canCustomize ? "The available options below are supported for this stock unit." : "This is the fixed configuration shown; factory options do not apply."}`
              : "You approve detailed factory photos and videos before anything ships."}
          </p>
        </div>
      </div>

      <PaymentLogos className="mt-4" />

      <p className="mt-3 flex items-center justify-center gap-2 text-center text-[15px] text-text-dim">
        <Lock className="h-4 w-4" /> Secure checkout by Shopify · plain packaging · neutral billing
      </p>

      <div className="mt-3 flex justify-center text-sm font-semibold text-accent">
        <Link href="/buyer-protection" className="min-h-11 py-2 underline underline-offset-4">View buyer protection</Link>
      </div>
    </div>
  );
}
