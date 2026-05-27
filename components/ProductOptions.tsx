"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/utils/currency";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";

const optionGroups = [
  { name: "Skin tone", options: ["Factory default", "Light", "Tan", "Deep"] },
  { name: "Eyes", options: ["Factory default", "Brown", "Blue", "Green"] },
  { name: "Wig", options: ["Factory default", "Brunette", "Blonde", "Black"] },
  { name: "Skeleton", options: ["Standard", "Flexible hands", "Standing feet"] },
  { name: "Add-ons", options: ["None", "Care kit", "Storage bag", "Extra wig"] }
];

export function ProductOptions({ product }: { product: Product }) {
  const router = useRouter();
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(optionGroups.map((group) => [group.name, group.options[0]]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const variant = product.variants.find((item) => item.id === variantId) ?? firstAvailable;
  const attributes = useMemo(
    () => Object.entries(selected).map(([key, value]) => ({ key, value })),
    [selected]
  );

  async function addToCart() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchandiseId: variantId, quantity: 1, attributes })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not start checkout.");
      return;
    }
    router.push(payload.checkoutUrl);
  }

  return (
    <aside className="rounded-[20px] border border-gold-500/18 bg-ink-800/78 p-5 lg:sticky lg:top-28">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-300">Customize this doll</p>
          <h2 className="mt-2 text-2xl font-semibold text-ivory-50">{formatMoney(variant?.price.amount ?? product.priceRange.minVariantPrice.amount, variant?.price.currencyCode)}</h2>
          <p className="mt-1 text-sm text-ivory-500">{product.extended.deliveryEstimate ?? "Delivery is confirmed before checkout."}</p>
        </div>
      </div>

      {product.variants.length > 1 && (
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-ivory-200">Build</span>
          <select
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            className="w-full rounded-[14px] border-gold-500/20 bg-ink-950/70 text-ivory-50 focus:border-gold-300 focus:ring-gold-300"
          >
            {product.variants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-5 space-y-4">
        {optionGroups.map((group) => (
          <div key={group.name}>
            <p className="mb-2 text-sm font-medium text-ivory-200">{group.name}</p>
            <div className="grid grid-cols-2 gap-2">
              {group.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected((current) => ({ ...current, [group.name]: option }))}
                  className={`rounded-[14px] border px-3 py-2 text-left text-sm ${
                    selected[group.name] === option
                      ? "border-gold-300 bg-gold-400 text-ink-950"
                      : "border-gold-500/18 bg-ink-950/55 text-ivory-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] bg-ink-950/55 p-4">
        <p className="text-sm font-semibold text-ivory-100">Selected details</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(selected).map(([key, value]) => (
            <span key={key} className="rounded-full border border-gold-500/14 px-3 py-1 text-xs text-ivory-400">
              {key}: {value}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <GoldButton className="mt-5 w-full" disabled={!variantId || loading} onClick={addToCart}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
        Add to cart
      </GoldButton>
      <p className="mt-3 text-xs text-ivory-600">Custom details are confirmed before production. AI visuals are not a delivery guarantee.</p>
    </aside>
  );
}
