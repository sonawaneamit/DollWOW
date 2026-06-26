"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { writeBrowserCartState } from "@/lib/cart/browser";
import type { CatalogBodyType } from "@/lib/catalog/bodyType";
import type { ProductImage } from "@/types/product";
import { GoldButton } from "./GoldButton";
import { TrustLogoStrip } from "./TrustLogoStrip";

export function ProductBuyActions({
  merchandiseId,
  productTitle,
  productDisplayName,
  productHandle,
  productImage,
  bodyType = "unknown",
  readyToShip = false
}: {
  merchandiseId: string;
  productTitle: string;
  productDisplayName?: string;
  productHandle: string;
  productImage?: ProductImage | null;
  bodyType?: CatalogBodyType;
  readyToShip?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const customizeLabel =
    bodyType === "male" ? "Customize him" : bodyType === "female" ? "Customize her" : "Customize this build";

  async function buyAsShown() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchandiseId,
        quantity: 1,
        attributes: [
          ...(productDisplayName ? [{ key: "DollWow Reference Name", value: productDisplayName }] : []),
          { key: "DollWow Build", value: "Buy as shown" },
          { key: "DollWow Fulfillment Note", value: "Base configuration selected; team confirms final specs before fulfillment." }
        ]
      })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not start checkout.");
      return;
    }
    writeBrowserCartState({
      checkoutUrl: payload.checkoutUrl,
      totalQuantity: payload.totalQuantity ?? 1,
      productTitle,
      productDisplayName,
      productHandle,
      productImageUrl: productImage?.url,
      productImageAlt: productImage?.altText ?? productTitle
    });
    router.push(payload.checkoutUrl);
  }

  function scrollToCustomizer() {
    document.getElementById("build-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <GoldButton onClick={buyAsShown} disabled={!merchandiseId || loading} className="min-h-14">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
          Buy as shown
        </GoldButton>
        <GoldButton variant="secondary" onClick={scrollToCustomizer} className="min-h-14">
          <SlidersHorizontal className="h-4 w-4" />
          {customizeLabel}
        </GoldButton>
      </div>
      <p className="text-xs leading-5 text-ivory-500">
        {readyToShip
          ? `Buy as shown uses the exact warehouse configuration for ${productTitle}. Ready-to-ship orders are stock-confirmed, reviewed by our team, and released in plain packaging as quickly as possible.`
          : `Buy as shown uses the base configuration for ${productTitle}. Custom builds are reviewed by our team and move through factory photo approval before shipment.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/buyer-protection" className="rounded-[12px] border border-gold-500/16 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-300 transition hover:border-gold-300/45 hover:text-ivory-50">
          Buyer protection
        </Link>
        <Link href="/shipping-protection" className="rounded-[12px] border border-gold-500/16 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-300 transition hover:border-gold-300/45 hover:text-ivory-50">
          Shipping protection
        </Link>
        <Link href="/how-ordering-works" className="rounded-[12px] border border-gold-500/16 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-300 transition hover:border-gold-300/45 hover:text-ivory-50">
          How ordering works
        </Link>
      </div>
      <TrustLogoStrip compact />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
