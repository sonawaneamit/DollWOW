"use client";

import { useState } from "react";
import { Loader2, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { GoldButton } from "./GoldButton";

export function ProductBuyActions({ merchandiseId, productTitle }: { merchandiseId: string; productTitle: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          Customize her
        </GoldButton>
      </div>
      <p className="text-xs leading-5 text-ivory-500">
        Buy as shown uses the base configuration for {productTitle}. Custom builds are reviewed by our team before production or shipment.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
