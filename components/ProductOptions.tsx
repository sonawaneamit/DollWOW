"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  PackageCheck,
  Palette,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  X
} from "lucide-react";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, getOptionConflict, resolveCustomization } from "@/lib/customization/resolve";
import { formatMoney } from "@/lib/utils/currency";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";

export function ProductOptions({ product }: { product: Product }) {
  const router = useRouter();
  const stepPanelRef = useRef<HTMLElement>(null);
  const optionScrollerRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const config = useMemo(() => getCustomizationConfig(product), [product]);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [activeGroupId, setActiveGroupId] = useState(config.groups[0]?.id ?? "");
  const [selected, setSelected] = useState(() => getDefaultSelections(config));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const variant = product.variants.find((item) => item.id === variantId) ?? firstAvailable;
  const basePrice = Number(variant?.price.amount ?? product.priceRange.minVariantPrice.amount);
  const currencyCode = variant?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode;
  const resolved = useMemo(() => resolveCustomization(config, selected, basePrice), [basePrice, config, selected]);
  const activeGroupIndex = Math.max(0, config.groups.findIndex((group) => group.id === activeGroupId));
  const activeGroup = config.groups[activeGroupIndex] ?? config.groups[0];
  const previousGroup = config.groups[activeGroupIndex - 1] ?? null;
  const nextGroup = config.groups[activeGroupIndex + 1] ?? null;
  const heroImage = product.featuredImage ?? product.images[0] ?? null;
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const hasIssues = resolved.issues.length > 0;
  const canCheckout = Boolean(variantId && variant?.availableForSale && !hasIssues);

  useEffect(() => {
    optionScrollerRef.current?.scrollTo({ top: 0 });
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;

    window.requestAnimationFrame(() => {
      const panel = stepPanelRef.current;
      if (!panel) return;
      const stickyHeaderOffset = 112;
      const top = panel.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset;
      const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.scrollTo({ top: Math.max(0, top), behavior });
    });
  }, [activeGroupId]);

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

  function selectOption(groupId: string, optionId: string) {
    setSelected((current) => ({ ...current, [groupId]: optionId }));
  }

  function goToPreviousGroup() {
    if (previousGroup) setActiveGroupId(previousGroup.id);
  }

  function goToNextGroup() {
    if (nextGroup) setActiveGroupId(nextGroup.id);
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-gold-500/20 bg-[linear-gradient(135deg,rgba(26,17,13,0.96),rgba(7,4,3,0.98))] shadow-soft">
      <div className="grid min-h-[720px] lg:h-[760px] lg:min-h-0 lg:grid-cols-[132px_minmax(0,1fr)_390px] xl:grid-cols-[144px_minmax(0,1fr)_420px]">
        <CategoryRail groups={config.groups} activeGroupId={activeGroup.id} selected={selected} onSelect={setActiveGroupId} />

        <div className="relative flex min-h-[560px] flex-col justify-between overflow-hidden border-y border-gold-500/20 bg-[linear-gradient(180deg,rgba(245,225,210,0.035),rgba(217,154,111,0.025))] p-5 sm:p-8 lg:min-h-0 lg:border-x lg:border-y-0">
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(246,233,221,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(246,233,221,0.08)_1px,transparent_1px)] [background-size:46px_46px]" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold-300">Build studio</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ivory-50">Make her yours</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ivory-500">Choose what matters. The price updates as you go, and our team checks it all before anything is made or shipped.</p>
            </div>
            <div className="rounded-full border border-gold-500/20 bg-ivory-50/[0.045] px-4 py-2 text-sm text-ivory-300">
              {resolved.selectedOptions.length} selections
            </div>
          </div>

          <div className="relative z-10 mx-auto my-5 flex min-h-0 w-full max-w-[560px] flex-1 items-center justify-center">
            <div className="absolute inset-x-10 bottom-5 h-16 rounded-full bg-gold-500/12 blur-3xl" />
            <div className="noir-media-wrap studio-float relative aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-[30px] border border-gold-500/18 bg-ink-950 shadow-[0_30px_90px_rgba(0,0,0,0.42)] xl:max-w-[390px]">
              {heroImage ? (
                <button type="button" onClick={() => setPreviewOpen(true)} className="relative block h-full w-full" aria-label="Open product image preview">
                  <Image src={heroImage.url} alt={heroImage.altText ?? product.title} fill sizes="(min-width: 1024px) 36vw, 92vw" className="object-cover noir-media" />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ivory-500">{product.title}</div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(0,0,0,0.62))]" />
              <div className="absolute bottom-4 left-4 right-4 rounded-[18px] border border-gold-500/18 bg-ink-950/78 p-4 backdrop-blur">
                <p className="line-clamp-1 text-sm font-semibold text-ivory-50">{product.title}</p>
                <p className="mt-1 text-xs text-ivory-500">{product.extended.brand ?? product.vendor}</p>
              </div>
            </div>
          </div>

          <SelectedTray selectedOptions={resolved.selectedOptions} currencyCode={currencyCode} />
        </div>

        <aside ref={stepPanelRef} className="scroll-mt-28 flex min-h-[620px] flex-col overflow-hidden bg-ink-800 text-ivory-50 lg:min-h-0">
          <div className="border-b border-gold-500/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-300">Now choosing</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold">{activeGroup.label}</h3>
              <span className="rounded-full border border-gold-500/20 bg-ivory-50/[0.06] px-3 py-1 text-xs font-semibold text-ivory-400">
                {activeGroupIndex + 1}/{config.groups.length}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ivory-400">{activeGroup.description}</p>
          </div>

          {product.variants.length > 1 && (
            <label className="mx-5 mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-ivory-300">Build</span>
              <select
                value={variantId}
                onChange={(event) => setVariantId(event.target.value)}
                className="w-full rounded-[14px] border-gold-500/20 bg-ink-950 text-ivory-50 focus:border-gold-300 focus:ring-gold-300"
              >
                {product.variants.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div ref={optionScrollerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
            <OptionPalette
              group={activeGroup}
              selected={selected[activeGroup.id]}
              selections={selected}
              onSelect={(optionId) => selectOption(activeGroup.id, optionId)}
              config={config}
              currencyCode={currencyCode}
            />

            {hasIssues && (
              <div className="mt-5 space-y-2 rounded-[18px] border border-danger/35 bg-danger/10 p-4 text-sm text-ivory-300">
                {resolved.issues.map((issue) => (
                  <p key={`${issue.ruleId}-${issue.groupId}-${issue.optionId}`} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    {issue.message}
                  </p>
                ))}
              </div>
            )}

            {!variant?.availableForSale && (
              <p className="mt-5 rounded-[18px] border border-danger/25 bg-danger/10 p-4 text-sm text-ivory-300">
                This configuration is not available for checkout yet. Contact support and we will confirm it manually.
              </p>
            )}
          </div>

          <div className="border-t border-gold-500/20 bg-ivory-50/[0.06] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ivory-500">Your build</p>
                <p className="mt-1 text-3xl font-semibold">{formatMoney(resolved.totalPrice, currencyCode)}</p>
              </div>
              <div className="text-right text-xs text-ivory-500">
                <p>Base {formatMoney(basePrice, currencyCode)}</p>
                <p>Options {formatMoney(resolved.optionPriceDelta, currencyCode)}</p>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-5 grid gap-2">
              {nextGroup ? (
                <button
                  type="button"
                  onClick={goToNextGroup}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-gold-200 to-gold-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-ink-950 transition hover:-translate-y-0.5"
                >
                  Next: {nextGroup.label}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canCheckout || loading}
                  onClick={addToCart}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#4f9c8a] px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#438b7a] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  Checkout
                </button>
              )}
              {previousGroup && (
                <button
                  type="button"
                  onClick={goToPreviousGroup}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-gold-500/20 bg-ivory-50/[0.045] px-5 py-3 text-sm font-semibold text-ivory-50 transition hover:border-gold-300/60"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back: {previousGroup.label}
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-2 text-xs text-ivory-400">
              <Assurance icon={<ShieldCheck className="h-4 w-4" />} text="Discreet Shopify checkout" />
              <Assurance icon={<Clock3 className="h-4 w-4" />} text="Final specs confirmed by support" />
            </div>
          </div>
        </aside>
      </div>

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
      {isPreviewOpen && heroImage && (
        <ImagePreview imageUrl={heroImage.url} alt={heroImage.altText ?? product.title} onClose={() => setPreviewOpen(false)} />
      )}
    </section>
  );
}

function CategoryRail({
  groups,
  activeGroupId,
  selected,
  onSelect
}: {
  groups: CustomizationGroup[];
  activeGroupId: string;
  selected: Record<string, string>;
  onSelect: (groupId: string) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-gold-500/20 bg-ivory-50/[0.035] p-4 lg:h-full lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:p-4">
      {groups.map((group) => {
        const active = group.id === activeGroupId;
        return (
          <button
            type="button"
            key={group.id}
            onClick={() => onSelect(group.id)}
            className={clsx(
              "group flex min-w-32 items-center gap-3 rounded-[18px] border p-3 text-left transition lg:min-w-0 lg:flex-col lg:items-start lg:p-3",
              active ? "border-gold-300 bg-ivory-50 text-ink-950" : "border-transparent bg-transparent text-ivory-400 hover:border-gold-500/30 hover:bg-ivory-50/[0.045] hover:text-ivory-50"
            )}
          >
            <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border", active ? "border-ink-950/25 bg-ink-950/10" : "border-gold-500/18 bg-ink-950/65 text-gold-300")}>
              {groupIcon(group.id)}
            </span>
            <span>
              <span className="block text-sm font-semibold">{group.label}</span>
              <span className={clsx("mt-1 block text-xs", active ? "text-ink-500" : "text-ivory-600")}>{active ? "Now" : selected[group.id] ? "Selected" : "Choose"}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function OptionPalette({
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
    <div
      className={clsx(
        "grid gap-4",
        group.display === "swatches" && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2",
        group.display === "cards" && "grid-cols-1",
        group.display === "compact" && "grid-cols-2"
      )}
    >
      {group.options.map((option) => {
        const conflict = getOptionConflict(config, selections, group.id, option.id);
        const isSelected = selected === option.id;
        const isDisabled = Boolean(conflict) && !isSelected;
        return (
          <OptionTile
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
  );
}

function OptionTile({
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
        "group relative flex min-h-36 flex-col items-center justify-start overflow-hidden rounded-[22px] border p-4 text-center transition duration-200",
        selected ? "border-[#4f9c8a] bg-[linear-gradient(180deg,rgba(79,156,138,0.09),rgba(7,4,3,0.62))] shadow-[0_16px_40px_rgba(79,156,138,0.16)]" : "border-gold-500/20 bg-ink-950/62 hover:-translate-y-0.5 hover:border-gold-300/60 hover:shadow-[0_16px_40px_rgba(20,6,4,0.32)]",
        disabled && "cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-gold-500/20 hover:shadow-none"
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#4f9c8a] text-white shadow-[0_8px_24px_rgba(79,156,138,0.28)]">
          <Check className="h-4 w-4" />
        </span>
      )}
      <span className="flex min-h-full flex-col items-center gap-3">
        <OptionMark option={option} selected={selected} />
        <span className="min-w-0 flex-1">
          <span className="block">
            <span className="font-semibold text-ivory-50">{option.label}</span>
          </span>
          {option.description && <span className="mt-2 block text-xs leading-5 text-ivory-500">{option.description}</span>}
          <span className="mt-3 inline-flex rounded-full bg-ivory-50/[0.06] px-3 py-1 text-xs font-semibold text-gold-300">
            {option.priceDelta ? `+ ${formatMoney(option.priceDelta, currencyCode)}` : "Included"}
          </span>
          {option.productionNote && <span className="mt-2 block text-xs text-ivory-500">{option.productionNote}</span>}
          {disabled && group.display === "cards" && <span className="mt-2 block text-xs text-danger">{conflict}</span>}
        </span>
      </span>
    </button>
  );
}

function ImagePreview({ imageUrl, alt, onClose }: { imageUrl: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/92 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Product image preview">
      <button
        type="button"
        aria-label="Close image preview"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/25 bg-ink-900/80 text-ivory-50 transition hover:border-gold-300"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative h-[88vh] w-full max-w-5xl overflow-hidden rounded-[24px] border border-gold-500/25 bg-ink-950 shadow-soft">
        <Image src={imageUrl} alt={alt} fill sizes="95vw" className="object-contain" />
      </div>
    </div>
  );
}

function OptionMark({ option, selected }: { option: CustomizationOption; selected: boolean }) {
  if (option.swatch?.kind === "image") {
    return (
      <span className={clsx("relative mt-0.5 h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border bg-ink-900", selected ? "border-[#4f9c8a]" : "border-gold-500/20")} aria-hidden="true">
        <Image src={option.swatch.value} alt="" fill sizes="80px" className="object-cover" loading="lazy" unoptimized />
      </span>
    );
  }
  if (option.swatch?.kind === "color") {
    return (
      <span
        className={clsx("mt-0.5 h-14 w-14 shrink-0 rounded-full border-[6px]", selected ? "border-[#4f9c8a]/35" : "border-ivory-50/10")}
        style={{ backgroundColor: option.swatch.value }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={clsx("mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-lg font-semibold", selected ? "border-[#4f9c8a] bg-[#4f9c8a]/15 text-[#9bd7c9]" : "border-gold-500/20 bg-ivory-50/[0.045] text-ivory-500")}>
      {option.swatch?.label ?? option.label.slice(0, 1)}
    </span>
  );
}

function SelectedTray({ selectedOptions, currencyCode }: { selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"]; currencyCode: string }) {
  return (
    <div className="relative z-10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ivory-100">Selected items ({selectedOptions.length})</h3>
        <div className="hidden gap-2 text-ivory-500 sm:flex">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {selectedOptions.map((option) => (
          <div key={`${option.groupId}-${option.optionId}`} className="flex min-w-56 items-center gap-3 rounded-[18px] border border-gold-500/20 bg-ivory-50/[0.045] p-3 text-ivory-50">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#4f9c8a]/15 text-[#9bd7c9]">{groupIcon(option.groupId)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{option.optionLabel}</span>
              <span className="mt-1 block truncate text-xs text-ivory-500">{option.groupLabel}</span>
              <span className="mt-1 block text-sm font-semibold text-[#2d7d6c]">{option.priceDelta ? formatMoney(option.priceDelta, currencyCode) : "Included"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Assurance({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-gold-500/10 bg-ivory-50/[0.045] px-3 py-2">
      <span className="text-[#4f9c8a]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function groupIcon(groupId: string) {
  if (groupId.includes("skin")) return <Palette className="h-5 w-5" />;
  if (groupId.includes("eye")) return <Eye className="h-5 w-5" />;
  if (groupId.includes("hair")) return <Scissors className="h-5 w-5" />;
  if (groupId.includes("body") || groupId.includes("head")) return <Sparkles className="h-5 w-5" />;
  if (groupId.includes("care")) return <PackageCheck className="h-5 w-5" />;
  return <Sparkles className="h-5 w-5" />;
}
