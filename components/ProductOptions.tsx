"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Info,
  Loader2,
  Maximize2,
  ShoppingBag
} from "lucide-react";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import { writeBrowserCartState } from "@/lib/cart/browser";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { productBuilderHeading } from "@/lib/catalog/bodyType";
import { productDisplayName, productPublicTitle } from "@/lib/catalog/naming";
import { getCustomizationConfig } from "@/lib/customization/configs";
import {
  defaultMultipleOptionId,
  getDefaultSelections,
  getOptionConflict,
  isOptionAvailableForCheckout,
  nextMultipleSelection,
  resolveCustomization,
  selectionIds
} from "@/lib/customization/resolve";
import { formatMoney } from "@/lib/utils/currency";
import type { CustomizationGroup, CustomizationOption, CustomizationSelections, CustomizationSelectionValue } from "@/types/customization";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { StyledSelect } from "./StyledSelect";

export function ProductOptions({ product }: { product: Product }) {
  const config = useMemo(() => getCustomizationConfig(product), [product]);
  return config.groups.length ? <ProductOptionsBuilder product={product} config={config} /> : <ProductOptionsOnRequest product={product} />;
}

function ProductOptionsBuilder({ product, config }: { product: Product; config: ReturnType<typeof getCustomizationConfig> }) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const didMountRef = useRef(false);
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [activeGroupId, setActiveGroupId] = useState(config.groups[0]?.id ?? "");
  const [isReviewing, setReviewing] = useState(false);
  const [selected, setSelected] = useState(() => getDefaultSelections(config));
  const [reviewedGroupIds, setReviewedGroupIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobileDockVisible, setMobileDockVisible] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);

  const variant = product.variants.find((item) => item.id === variantId) ?? firstAvailable;
  const basePrice = Number(variant?.price.amount ?? product.priceRange.minVariantPrice.amount);
  const currencyCode = variant?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode;
  const resolved = useMemo(() => resolveCustomization(config, selected, basePrice), [basePrice, config, selected]);
  const activeGroupIndex = Math.max(0, config.groups.findIndex((group) => group.id === activeGroupId));
  const activeGroup = config.groups[activeGroupIndex] ?? config.groups[0];
  const previousGroup = config.groups[activeGroupIndex - 1] ?? null;
  const nextGroup = config.groups[activeGroupIndex + 1] ?? null;
  const heroImage = product.featuredImage ?? product.images[0] ?? null;
  const displayTitle = productPublicTitle(product);
  const displayName = productDisplayName(product);
  const hasIssues = resolved.issues.length > 0;
  const canCheckout = Boolean(variantId && variant?.availableForSale && !hasIssues);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    const targetId = isReviewing ? "custom-step-review" : `custom-step-${activeGroupId}`;
    window.requestAnimationFrame(() => {
      const panel = document.getElementById(targetId);
      if (!panel) return;
      const top = panel.getBoundingClientRect().top + window.scrollY - 92;
      const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.scrollTo({ top: Math.max(0, top), behavior });
    });
  }, [activeGroupId, isReviewing]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let frame = 0;
    const updateDock = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const dockLine = window.innerHeight - 88;
        setMobileDockVisible(window.innerWidth < 1024 && rect.top < dockLine && rect.bottom > dockLine);
      });
    };

    updateDock();
    window.addEventListener("scroll", updateDock, { passive: true });
    window.addEventListener("resize", updateDock);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateDock);
      window.removeEventListener("resize", updateDock);
    };
  }, []);

  async function addToCart() {
    if (!canCheckout) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cart/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchandiseId: variantId,
          quantity: 1,
          attributes: displayName ? [{ key: "DollWow Reference Name", value: displayName }, ...resolved.cartAttributes] : resolved.cartAttributes,
          customizationCharge: resolved.optionPriceDelta
            ? {
                amount: resolved.optionPriceDelta,
                currencyCode,
                title: displayName || displayTitle,
                items: resolved.selectedOptions
                  .filter((option) => option.priceDelta > 0)
                  .map((option) => ({ group: option.groupLabel, label: option.optionLabel, amount: option.priceDelta }))
              }
            : undefined
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not start checkout.");
        return;
      }
      const checkoutUrl = normalizeCheckoutUrl(payload.checkoutUrl);
      writeBrowserCartState({
        checkoutUrl,
        totalQuantity: payload.totalQuantity ?? 1,
        productTitle: displayTitle,
        productDisplayName: displayName || undefined,
        productHandle: product.handle,
        productImageUrl: heroImage?.url,
        productImageAlt: heroImage?.altText ?? displayTitle,
        currencyCode,
        customizationSummary: cartCustomizationSummary(resolved.selectedOptions)
      });
      trackEvent(analyticsEvents.addToCart, {
        item_id: variantId,
        item_name: displayName || displayTitle,
        item_brand: product.extended.brand ?? product.vendor,
        price: resolved.totalPrice,
        currency: currencyCode,
        quantity: 1
      });
      trackEvent(analyticsEvents.beginCheckout, { value: resolved.totalPrice, currency: currencyCode, item_count: 1 });
      router.push(checkoutUrl);
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function selectOption(groupId: string, optionId: string) {
    if (!isOptionAvailableForCheckout(config, groupId, optionId)) return;
    const group = config.groups.find((item) => item.id === groupId);
    markGroupReviewed(groupId);
    setSelected((current) => ({
      ...current,
      [groupId]: group?.selectionMode === "multiple"
        ? nextMultipleSelection(defaultMultipleOptionId(group.options), current[groupId], optionId)
        : optionId
    }));
  }

  function markGroupReviewed(groupId: string) {
    setReviewedGroupIds((current) => new Set(current).add(groupId));
  }

  function goToPreviousGroup() {
    if (isReviewing) {
      const finalGroup = config.groups.at(-1);
      if (finalGroup) setActiveGroupId(finalGroup.id);
      setReviewing(false);
      return;
    }
    if (previousGroup) setActiveGroupId(previousGroup.id);
  }

  function goToNextGroup() {
    if (activeGroup) markGroupReviewed(activeGroup.id);
    if (nextGroup) setActiveGroupId(nextGroup.id);
    else setReviewing(true);
  }

  function goToGroup(groupId: string) {
    setReviewing(false);
    setActiveGroupId(groupId);
  }

  function showReview() {
    setReviewing(true);
  }

  const disabledReason = resolved.issues[0]?.message || (!variant?.availableForSale ? "This build is not available to order online." : "");

  return (
    <section ref={rootRef} className="product-builder relative rounded-lg bg-surface p-5 pb-24 text-text shadow-card sm:p-7 sm:pb-24 lg:p-8">
      <div className="product-builder__content">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold text-text-dim">{productBuilderHeading(product)}</p>
          <h2 className="mt-1 font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight">Customize your doll</h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-dim">
            Work through the steps below — defaults are already selected, so change only what you care about.
          </p>
        </div>
        <p className="rounded-sm bg-accent-tint px-4 py-2 text-[15px] font-semibold text-text">
          {reviewedGroupIds.size} of {config.groups.length} steps done
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="rounded-md bg-surface-tint p-4 lg:hidden">
          <p className="text-sm font-semibold text-text-dim">Current build</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-sm text-text-dim">Starting total</span>
            <strong className="text-xl text-text" aria-live="polite">{formatMoney(resolved.totalPrice, currencyCode)}</strong>
          </div>
          <p className="mt-2 text-sm leading-5 text-text-dim">Review the choice groups below; a full summary appears before checkout.</p>
        </div>
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="lg:sticky lg:top-24">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-tint">
              {heroImage ? (
                <button type="button" onClick={() => setPreviewOpen(true)} className="relative block h-full w-full" aria-label="Enlarge product image">
                  <Image src={heroImage.url} alt={displayTitle} fill sizes="(min-width: 1024px) 38vw, 92vw" className="object-cover" />
                  <span className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-sm bg-surface px-3 text-[15px] font-semibold text-text shadow-card">
                    <Maximize2 className="h-4 w-4" aria-hidden="true" /> Enlarge
                  </span>
                </button>
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-base text-text-dim">{displayTitle}</div>
              )}
            </div>
            <h3 className="mt-5 text-xl font-semibold leading-snug">{displayTitle}</h3>
            <p className="mt-1 text-[15px] text-text-dim">{product.extended.brand ?? product.vendor}</p>
            <BuildSummary
              groups={config.groups}
              selected={selected}
              selectedOptions={resolved.selectedOptions}
              basePrice={basePrice}
              optionPriceDelta={resolved.optionPriceDelta}
              totalPrice={resolved.totalPrice}
              currencyCode={currencyCode}
              leadTimeNote={config.leadTimeNote}
            />
          </div>
        </aside>

        <div className="space-y-3 lg:col-span-7">
          {product.variants.length > 1 ? (
            <label className="block rounded-md bg-surface-tint p-4">
              <span className="mb-2 block text-[15px] font-semibold text-text-dim">Choose a build</span>
              <StyledSelect value={variantId} onValueChange={setVariantId} ariaLabel="Choose a build" className="product-builder-variant-select" options={product.variants.map((item) => ({ label: item.title, value: item.id }))} />
            </label>
          ) : null}

          {config.groups.map((group, index) => {
            const active = !isReviewing && group.id === activeGroupId;
            return (
              <section
                key={group.id}
                id={`custom-step-${group.id}`}
                className={clsx("scroll-mt-24 rounded-md border bg-surface transition-colors", active ? "border-accent shadow-card" : "border-border")}
              >
                <button
                  type="button"
                  onClick={() => goToGroup(group.id)}
                  className="flex min-h-[72px] w-full items-center gap-4 rounded-md px-4 py-3 text-left sm:px-5"
                  aria-expanded={active}
                  aria-controls={`custom-options-${group.id}`}
                >
                  <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold", active ? "bg-accent text-white" : "bg-surface-tint text-text")}>{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-text">{group.label}</span>
                    {!active ? <span className="mt-0.5 block text-[15px] leading-6 text-text-dim">{selectedLabelForGroup(group, selected[group.id]) || "Factory default — included"}</span> : null}
                  </span>
                  {!active ? <span className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-accent">Change</span> : null}
                </button>

                {active ? (
                  <div id={`custom-options-${group.id}`} className="border-t border-border px-4 pb-5 pt-5 sm:px-5">
                    <p className="text-[15px] font-semibold text-text-dim">Step {index + 1} of {config.groups.length}</p>
                    {group.description ? <p className="mt-2 text-[15px] leading-6 text-text-dim">{group.description}</p> : null}
                    <div className="mt-5">
                      <OptionPalette
                        group={group}
                        selected={selected[group.id]}
                        selections={selected}
                        onSelect={(optionId) => selectOption(group.id, optionId)}
                        config={config}
                        currencyCode={currencyCode}
                      />
                    </div>
                    <div className="product-builder-step-actions mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                      {previousGroup ? (
                        <button type="button" onClick={goToPreviousGroup} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button border border-border-strong px-5 text-[17px] font-semibold text-text hover:bg-surface-tint">
                          <ChevronLeft className="h-5 w-5" /> Back
                        </button>
                      ) : <span />}
                      <button type="button" onClick={goToNextGroup} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-button bg-accent px-5 text-[17px] font-semibold text-white hover:bg-accent-hover">
                        {nextGroup ? `Next: ${nextGroup.label}` : "Review your build"}<ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}

          <section id="custom-step-review" className={clsx("scroll-mt-24 rounded-md border bg-surface", isReviewing ? "border-accent shadow-card" : "border-border")}>
            {!isReviewing ? (
              <button type="button" onClick={showReview} className="flex min-h-[72px] w-full items-center gap-4 rounded-md px-4 text-left sm:px-5" aria-expanded="false">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-text"><Check className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1 text-[17px] font-semibold">Review your build</span>
                <span className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-accent">Review</span>
              </button>
            ) : (
              <div className="p-4 sm:p-6">
                <p className="text-[15px] font-semibold text-text-dim">Review</p>
                <h3 className="mt-1 font-display text-2xl font-semibold">Review your build</h3>
                <p className="mt-2 text-[15px] leading-6 text-text-dim">Check each choice, then continue to checkout. You can still change anything.</p>

                <ReviewRows groups={config.groups} selected={selected} selectedOptions={resolved.selectedOptions} currencyCode={currencyCode} onEdit={goToGroup} />
                <PriceSummary basePrice={basePrice} optionPriceDelta={resolved.optionPriceDelta} totalPrice={resolved.totalPrice} currencyCode={currencyCode} />

                {hasIssues ? (
                  <div className="mt-5 space-y-2">
                    {resolved.issues.map((issue) => (
                      <p key={`${issue.ruleId}-${issue.groupId}-${issue.optionId}`} className="flex gap-2 rounded-sm bg-danger-tint p-4 text-[15px] leading-6 text-danger">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{issue.message}
                      </p>
                    ))}
                  </div>
                ) : null}

                {!variant?.availableForSale ? (
                  <p className="mt-5 rounded-sm bg-danger-tint p-4 text-[15px] leading-6 text-danger">
                    This option combination is not available to order online. <a href={`/support?product=${encodeURIComponent(product.handle)}`} className="font-semibold underline underline-offset-4">Contact us</a> and we will help with the closest available choice.
                  </p>
                ) : null}

                {error ? <p className="mt-4 text-[15px] text-danger">{error}</p> : null}

                <div className="mt-6 grid gap-3">
                  <button type="button" disabled={!canCheckout || loading} onClick={addToCart} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button bg-accent px-5 text-[17px] font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
                    Continue to secure checkout — {formatMoney(resolved.totalPrice, currencyCode)}
                  </button>
                  {disabledReason ? <p className="text-[15px] leading-6 text-danger">{disabledReason}</p> : null}
                  <button type="button" onClick={goToPreviousGroup} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-button border border-border-strong px-5 text-[17px] font-semibold text-text hover:bg-surface-tint">
                    <ChevronLeft className="h-5 w-5" /> Back to {activeGroup.label}
                  </button>
                </div>
                <p className="mt-5 text-center text-[15px] text-text-dim">Secure checkout by Shopify</p>
                <a href={`/support?product=${encodeURIComponent(product.handle)}`} className="mt-2 flex min-h-11 items-center justify-center text-[15px] font-semibold text-accent underline underline-offset-4">Questions? Talk to a real person</a>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className={clsx("pdp-mobile-build-dock fixed inset-x-0 bottom-0 z-40 border-t border-border p-3 shadow-[0_-4px_20px_rgba(41,32,27,0.14)] transition duration-200 lg:hidden", isMobileDockVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0")}>
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-dim">{displayTitle}</p>
            <p className="text-[17px] font-semibold text-text" aria-live="polite">{formatMoney(resolved.totalPrice, currencyCode)}</p>
          </div>
          <button
            type="button"
            disabled={isReviewing ? !canCheckout || loading : false}
            onClick={isReviewing ? addToCart : showReview}
            className="inline-flex min-h-12 min-w-32 items-center justify-center gap-2 rounded-button bg-accent px-4 text-base font-semibold text-white hover:bg-accent-hover disabled:opacity-45"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isReviewing ? "Checkout" : "Review build"}
          </button>
        </div>
      </div>

      {isPreviewOpen && heroImage ? <ImagePreviewModal imageUrl={heroImage.url} alt={displayTitle} onClose={() => setPreviewOpen(false)} /> : null}
      </div>
    </section>
  );
}

function BuildSummary({ groups, selected, selectedOptions, basePrice, optionPriceDelta, totalPrice, currencyCode, leadTimeNote }: {
  groups: CustomizationGroup[];
  selected: CustomizationSelections;
  selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"];
  basePrice: number;
  optionPriceDelta: number;
  totalPrice: number;
  currencyCode: string;
  leadTimeNote?: string;
}) {
  return (
    <div className="mt-5 rounded-md bg-surface-tint p-5">
      <h3 className="text-xl font-semibold">Your build</h3>
      <div className="mt-3 divide-y divide-border">
        {groups.map((group) => {
          const summary = groupSelectionSummary(group, selected[group.id], selectedOptions, currencyCode);
          return <div key={group.id} className="build-summary-row py-3 text-[15px]"><span className="text-text-dim">{group.label}</span><span className="min-w-0 font-semibold text-text">{summary}</span></div>;
        })}
      </div>
      <PriceSummary basePrice={basePrice} optionPriceDelta={optionPriceDelta} totalPrice={totalPrice} currencyCode={currencyCode} compact />
      <div aria-live="polite" className="sr-only">Current total {formatMoney(totalPrice, currencyCode)}</div>
      {leadTimeNote ? <p className="mt-4 text-sm leading-6 text-text-dim"><Clock3 className="mr-2 inline h-4 w-4" />{leadTimeNote}</p> : null}
      <p className="mt-3 text-sm leading-6 text-text-dim">Our team reviews every configuration before anything is made or shipped.</p>
    </div>
  );
}

function ReviewRows({ groups, selected, selectedOptions, currencyCode, onEdit }: {
  groups: CustomizationGroup[];
  selected: CustomizationSelections;
  selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"];
  currencyCode: string;
  onEdit: (groupId: string) => void;
}) {
  return (
    <div className="mt-5 divide-y divide-border rounded-md border border-border px-4">
      {groups.map((group) => (
        <div key={group.id} className="flex min-h-[72px] items-center gap-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] text-text-dim">{group.label}</span>
            <span className="mt-0.5 block text-[15px] font-semibold text-text">{groupSelectionSummary(group, selected[group.id], selectedOptions, currencyCode)}</span>
          </span>
          <button type="button" onClick={() => onEdit(group.id)} className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-accent">Change</button>
        </div>
      ))}
    </div>
  );
}

function PriceSummary({ basePrice, optionPriceDelta, totalPrice, currencyCode, compact = false }: {
  basePrice: number;
  optionPriceDelta: number;
  totalPrice: number;
  currencyCode: string;
  compact?: boolean;
}) {
  return (
    <div className={clsx("border-t border-border", compact ? "mt-2 pt-3" : "mt-5 rounded-md bg-surface-tint p-4")}>
      <div className="flex justify-between gap-4 text-[15px] text-text-dim"><span>Base</span><span>{formatMoney(basePrice, currencyCode)}</span></div>
      <div className="mt-2 flex justify-between gap-4 text-[15px] text-text-dim"><span>Options</span><span>{formatMoney(optionPriceDelta, currencyCode)}</span></div>
      <div className="mt-3 flex justify-between gap-4 border-t border-border pt-3 text-xl font-semibold text-text"><span>Total</span><span>{formatMoney(totalPrice, currencyCode)}</span></div>
    </div>
  );
}

function OptionPalette({ group, selected, selections, onSelect, config, currencyCode }: {
  group: CustomizationGroup;
  selected: CustomizationSelectionValue | undefined;
  selections: CustomizationSelections;
  onSelect: (optionId: string) => void;
  config: ReturnType<typeof getCustomizationConfig>;
  currencyCode: string;
}) {
  return (
    <div>
      {group.resources?.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {group.resources.map((resource) => (
            <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border px-3 text-[15px] font-semibold text-accent hover:bg-accent-tint">
              {resource.label}<ExternalLink className="h-4 w-4" />
            </a>
          ))}
        </div>
      ) : null}
      <div className={clsx("product-option-grid grid grid-cols-1 gap-3", group.options.length >= 8 && "product-option-grid--scroll") }>
        {group.options.map((option) => {
          const conflict = getOptionConflict(config, selections, group.id, option.id);
          const isSelected = selectionIds(selected).includes(option.id);
          const unavailableOnline = !isOptionAvailableForCheckout(config, group.id, option.id);
          const isDisabled = (Boolean(conflict) || unavailableOnline) && !isSelected;
          const notice = conflict || (unavailableOnline ? "Supplier price not yet verified — unavailable for online checkout." : null);
          return <OptionTile key={option.id} option={option} selected={isSelected} disabled={isDisabled} notice={notice} currencyCode={currencyCode} onClick={() => onSelect(option.id)} />;
        })}
      </div>
    </div>
  );
}

function OptionTile({ option, selected, disabled, notice, currencyCode, onClick }: {
  option: CustomizationOption;
  selected: boolean;
  disabled: boolean;
  notice: string | null;
  currencyCode: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        "option-tile relative flex min-h-24 min-w-0 items-start gap-4 rounded-md border p-4 text-left transition-colors",
        selected && "is-selected",
        selected ? "border-2 border-accent bg-accent-tint" : "border-border bg-surface hover:border-accent",
        disabled && "cursor-not-allowed border-dashed bg-bg hover:border-border"
      )}
    >
      {selected ? <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white"><Check className="h-4 w-4" /></span> : null}
      <OptionMark option={option} selected={selected} />
      <span className="min-w-0 flex-1 pr-5">
        <span className="block text-[17px] font-semibold text-text">{option.label}</span>
        {option.description ? <span className="mt-1 block text-sm leading-5 text-text-dim">{option.description}</span> : null}
        <span className="option-tile__price mt-2 inline-flex text-sm font-semibold">
          {disabled && option.priceDelta === undefined && !/\bfree\b/i.test(option.label) ? "Unavailable online" : optionPriceLabel(option, currencyCode)}
        </span>
        {option.productionNote ? <span className="mt-2 flex gap-1.5 text-sm leading-5 text-text-dim"><Info className="mt-0.5 h-4 w-4 shrink-0" />{option.productionNote}</span> : null}
        {disabled ? <span className="mt-2 flex gap-1.5 text-sm leading-5 text-danger"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{notice}</span> : null}
      </span>
    </button>
  );
}

function optionPriceLabel(option: CustomizationOption, currencyCode: string) {
  if (option.priceDelta !== undefined) return option.priceDelta ? `+ ${formatMoney(option.priceDelta, currencyCode)}` : "Included";
  return "Included";
}

function OptionMark({ option, selected }: { option: CustomizationOption; selected: boolean }) {
  if (option.swatch?.kind === "image") {
    return <span className={clsx("relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border bg-surface-tint", selected ? "border-accent" : "border-border")} aria-hidden="true"><Image src={option.swatch.value} alt="" fill sizes="64px" className="object-cover" loading="lazy" unoptimized /></span>;
  }
  if (option.swatch?.kind === "color") {
    return <span className="h-12 w-12 shrink-0 rounded-full border-2 border-border" style={{ backgroundColor: option.swatch.value }} aria-hidden="true" />;
  }
  return <span className={clsx("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold", selected ? "bg-accent text-white" : "bg-surface-tint text-text")}>{option.swatch?.label ?? option.label.slice(0, 1)}</span>;
}

function ProductOptionsOnRequest({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const displayTitle = productPublicTitle(product);
  const displayName = productDisplayName(product);
  const brandName = product.extended.brand || product.vendor || "DollWow";
  const heroImage = product.featuredImage ?? product.images[0] ?? null;
  const basePrice = Number(firstAvailable?.price.amount ?? product.priceRange.minVariantPrice.amount);
  const currencyCode = firstAvailable?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode;
  const canCheckout = Boolean(firstAvailable?.id && firstAvailable.availableForSale);

  async function addToCart() {
    if (!canCheckout || !firstAvailable?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cart/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ merchandiseId: firstAvailable.id, quantity: 1, attributes: displayName ? [{ key: "DollWow Reference Name", value: displayName }] : [] })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not start checkout.");
        return;
      }
      const checkoutUrl = normalizeCheckoutUrl(payload.checkoutUrl);
      writeBrowserCartState({
        checkoutUrl,
        totalQuantity: payload.totalQuantity ?? 1,
        productTitle: displayTitle,
        productDisplayName: displayName || undefined,
        productHandle: product.handle,
        productImageUrl: heroImage?.url,
        productImageAlt: heroImage?.altText ?? displayTitle,
        currencyCode,
        customizationSummary: []
      });
      router.push(checkoutUrl);
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg bg-surface p-5 text-text shadow-card sm:p-8">
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.62fr)]">
        <div>
          <p className="text-[15px] font-semibold text-text-dim">{brandName}</p>
          <h2 className="mt-1 font-display text-3xl font-semibold">Order this doll as shown</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-text-dim">This listing is priced for the doll shown in the gallery and specifications. Contact us before checkout if you would like to confirm a different version.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <GoldButton disabled={!canCheckout || loading} onClick={addToCart}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
              {loading ? "Starting checkout" : `Continue to secure checkout — ${formatMoney(basePrice, currencyCode)}`}
            </GoldButton>
            <a href={`/support?product=${encodeURIComponent(product.handle)}`} className="inline-flex min-h-[52px] items-center justify-center rounded-button border-2 border-accent px-5 text-[17px] font-semibold text-accent hover:bg-accent-tint">Ask about this doll</a>
          </div>
          {error ? <p className="mt-3 text-[15px] text-danger">{error}</p> : null}
        </div>
        <div className="rounded-md bg-surface-tint p-5">
          <p className="text-[15px] font-semibold text-text-dim">Listing price</p>
          <p className="mt-2 text-xl font-semibold">{formatMoney(basePrice, currencyCode)}</p>
          <p className="mt-1 text-[15px] leading-6 text-text-dim">For the doll shown in the product gallery and listed specifications.</p>
        </div>
      </div>
    </section>
  );
}

function cartCustomizationSummary(selectedOptions: Array<{ groupLabel: string; optionLabel: string; priceDelta: number }>) {
  const byGroup = new Map<string, { optionLabels: string[]; priceDelta: number }>();
  for (const option of selectedOptions) {
    const current = byGroup.get(option.groupLabel) ?? { optionLabels: [], priceDelta: 0 };
    current.optionLabels.push(option.optionLabel);
    current.priceDelta += option.priceDelta;
    byGroup.set(option.groupLabel, current);
  }
  return [...byGroup.entries()].map(([groupLabel, summary]) => ({ groupLabel, optionLabels: summary.optionLabels, priceDelta: summary.priceDelta }));
}

function selectedLabelForGroup(group: CustomizationGroup, value: CustomizationSelectionValue | undefined) {
  const labels = selectionIds(value).map((optionId) => group.options.find((option) => option.id === optionId)?.label).filter(Boolean);
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0] ?? "";
  return labels.join(", ");
}

function groupSelectionSummary(group: CustomizationGroup, value: CustomizationSelectionValue | undefined, selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"], currencyCode: string) {
  const label = selectedLabelForGroup(group, value) || "Factory default";
  const options = selectedOptions.filter((option) => option.groupId === group.id);
  const delta = options.reduce((sum, option) => sum + option.priceDelta, 0);
  return delta ? `${label} (+${formatMoney(delta, currencyCode)})` : `${label} — included`;
}
