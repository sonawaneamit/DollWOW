"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AlertTriangle, Check, Clock3, Loader2, ShieldCheck, ShoppingBag } from "lucide-react";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, getOptionConflict, resolveCustomization } from "@/lib/customization/resolve";
import { formatMoney } from "@/lib/utils/currency";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";

export function ProductOptions({ product }: { product: Product }) {
  const router = useRouter();
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const config = useMemo(() => getCustomizationConfig(product), [product]);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [selected, setSelected] = useState(() => getDefaultSelections(config));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const variant = product.variants.find((item) => item.id === variantId) ?? firstAvailable;
  const basePrice = Number(variant?.price.amount ?? product.priceRange.minVariantPrice.amount);
  const currencyCode = variant?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode;
  const resolved = useMemo(() => resolveCustomization(config, selected, basePrice), [basePrice, config, selected]);
  const hasIssues = resolved.issues.length > 0;
  const hasPaidAddOns = resolved.optionPriceDelta > 0;
  const canCheckout = Boolean(variantId && variant?.availableForSale && !hasIssues);
  const checkoutLabel = product.extended.stockStatus === "ready_to_ship" ? "Continue to secure checkout" : "Start custom order";

  async function addToCart() {
    if (!canCheckout) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchandiseId: variantId, quantity: 1, attributes: resolved.cartAttributes })
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
          <p className="text-xs uppercase tracking-[0.18em] text-gold-300">{config.brandLabel} configurator</p>
          <h2 className="mt-2 text-2xl font-semibold text-ivory-50">{formatMoney(resolved.totalPrice, currencyCode)}</h2>
          <p className="mt-1 text-sm text-ivory-500">{config.leadTimeNote}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-[16px] border border-gold-500/12 bg-ink-950/45 p-3 text-sm">
        <SummaryItem label="Base" value={formatMoney(basePrice, currencyCode)} />
        <SummaryItem label="Options" value={formatMoney(resolved.optionPriceDelta, currencyCode)} />
      </div>

      <div className="mt-3 grid gap-2 text-xs text-ivory-400">
        <Assurance icon={<ShieldCheck className="h-4 w-4" />} text="Discreet checkout through Shopify" />
        <Assurance icon={<Clock3 className="h-4 w-4" />} text="Final specs and timing confirmed by support" />
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

      <div className="mt-5 space-y-5">
        {config.groups.map((group) => (
          <OptionGroup
            key={group.id}
            group={group}
            selected={selected[group.id]}
            selections={selected}
            onSelect={(optionId) => setSelected((current) => ({ ...current, [group.id]: optionId }))}
            config={config}
            currencyCode={currencyCode}
          />
        ))}
      </div>

      {hasIssues && (
        <div className="mt-5 space-y-2 rounded-[16px] border border-danger/35 bg-danger/10 p-4 text-sm text-ivory-100">
          {resolved.issues.map((issue) => (
            <p key={`${issue.ruleId}-${issue.groupId}-${issue.optionId}`} className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              {issue.message}
            </p>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-[16px] bg-ink-950/55 p-4">
        <p className="text-sm font-semibold text-ivory-100">Selected configuration</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {resolved.selectedOptions.map((option) => (
            <span key={`${option.groupId}-${option.optionId}`} className="rounded-full border border-gold-500/14 px-3 py-1 text-xs text-ivory-400">
              {option.groupLabel}: {option.optionLabel}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {!variant?.availableForSale && <p className="mt-4 rounded-[14px] border border-danger/25 bg-danger/10 p-3 text-sm text-ivory-100">This configuration is not available for checkout yet. Contact support and we will confirm it manually.</p>}
      <GoldButton className="mt-5 w-full" disabled={!canCheckout || loading} onClick={addToCart}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
        {checkoutLabel}
      </GoldButton>
      <p className="mt-3 text-xs text-ivory-600">
        {hasPaidAddOns
          ? "Paid customization selections are captured for support confirmation before fulfillment."
          : "Custom details are confirmed before production. Visual aids are not a delivery guarantee."}
      </p>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/16 bg-ink-950/95 p-3 shadow-soft backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ivory-500">{product.title}</p>
            <p className="text-base font-semibold text-gold-300">{formatMoney(resolved.totalPrice, currencyCode)}</p>
          </div>
          <GoldButton className="min-w-36 px-4" disabled={!canCheckout || loading} onClick={addToCart}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
            Checkout
          </GoldButton>
        </div>
      </div>
    </aside>
  );
}

function Assurance({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[12px] bg-ink-950/45 px-3 py-2">
      <span className="text-gold-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function OptionGroup({
  group,
  selected,
  selections,
  onSelect,
  config,
  currencyCode
}: {
  group: CustomizationGroup;
  selected: string;
  selections: Record<string, string>;
  onSelect: (optionId: string) => void;
  config: ReturnType<typeof getCustomizationConfig>;
  currencyCode: string;
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-ivory-200">{group.label}</p>
        <p className="mt-1 text-xs leading-5 text-ivory-600">{group.description}</p>
      </div>
      <div
        className={clsx(
          "grid gap-2",
          group.display === "swatches" && "grid-cols-2",
          group.display === "cards" && "grid-cols-1",
          group.display === "compact" && "grid-cols-2"
        )}
      >
        {group.options.map((option) => {
          const conflict = getOptionConflict(config, selections, group.id, option.id);
          const isSelected = selected === option.id;
          const isDisabled = Boolean(conflict) && !isSelected;
          return (
            <OptionButton
              key={option.id}
              group={group}
              option={option}
              selected={isSelected}
              disabled={isDisabled}
              conflict={conflict}
              currencyCode={currencyCode}
              onClick={() => onSelect(option.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function OptionButton({
  group,
  option,
  selected,
  disabled,
  conflict,
  currencyCode,
  onClick
}: {
  group: CustomizationGroup;
  option: CustomizationOption;
  selected: boolean;
  disabled: boolean;
  conflict: string | null;
  currencyCode: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? conflict ?? undefined : undefined}
      className={clsx(
        "relative rounded-[14px] border p-3 text-left text-sm transition",
        selected ? "border-gold-300 bg-gold-400 text-ink-950" : "border-gold-500/18 bg-ink-950/55 text-ivory-300 hover:border-gold-300/70",
        disabled && "cursor-not-allowed opacity-45 hover:border-gold-500/18"
      )}
    >
      <span className="flex items-start gap-3">
        {option.swatch && <Swatch option={option} selected={selected} />}
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="font-semibold">{option.label}</span>
            {selected && <Check className="h-4 w-4 shrink-0" />}
          </span>
          {option.description && <span className={clsx("mt-1 block text-xs leading-5", selected ? "text-ink-800" : "text-ivory-600")}>{option.description}</span>}
          <span className={clsx("mt-2 block text-xs font-semibold", selected ? "text-ink-950" : "text-gold-300")}>
            {option.priceDelta ? `+ ${formatMoney(option.priceDelta, currencyCode)}` : "Included"}
          </span>
          {option.productionNote && <span className={clsx("mt-1 block text-xs", selected ? "text-ink-800" : "text-ivory-600")}>{option.productionNote}</span>}
          {disabled && group.display === "cards" && <span className="mt-2 block text-xs text-danger">{conflict}</span>}
        </span>
      </span>
    </button>
  );
}

function Swatch({ option, selected }: { option: CustomizationOption; selected: boolean }) {
  if (!option.swatch) return null;
  if (option.swatch.kind === "color") {
    return (
      <span
        className={clsx("mt-0.5 h-7 w-7 shrink-0 rounded-full border", selected ? "border-ink-950" : "border-gold-500/30")}
        style={{ backgroundColor: option.swatch.value }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={clsx("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px]", selected ? "border-ink-950" : "border-gold-500/30")}>
      {option.swatch.label ?? option.swatch.value}
    </span>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-ivory-600">{label}</p>
      <p className="mt-1 font-semibold text-ivory-100">{value}</p>
    </div>
  );
}
