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
  Sparkles
} from "lucide-react";
import { productBuilderHeading } from "@/lib/catalog/bodyType";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { defaultMultipleOptionId, getDefaultSelections, getOptionConflict, nextMultipleSelection, resolveCustomization, selectionIds } from "@/lib/customization/resolve";
import { writeBrowserCartState } from "@/lib/cart/browser";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { productDisplayName, productPublicTitle } from "@/lib/catalog/naming";
import { formatMoney } from "@/lib/utils/currency";
import type { CustomizationGroup, CustomizationOption, CustomizationSelections, CustomizationSelectionValue } from "@/types/customization";
import type { Product } from "@/types/product";
import { GoldButton } from "./GoldButton";
import { ImagePreviewModal } from "./ImagePreviewModal";

export function ProductOptions({ product }: { product: Product }) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const stepPanelRef = useRef<HTMLElement>(null);
  const optionScrollerRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const config = useMemo(() => getCustomizationConfig(product), [product]);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [activeGroupId, setActiveGroupId] = useState(config.groups[0]?.id ?? "");
  const [isReviewing, setReviewing] = useState(false);
  const [selected, setSelected] = useState(() => getDefaultSelections(config));
  const [reviewedGroupIds, setReviewedGroupIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobileDockVisible, setMobileDockVisible] = useState(false);

  const variant = product.variants.find((item) => item.id === variantId) ?? firstAvailable;
  const basePrice = Number(variant?.price.amount ?? product.priceRange.minVariantPrice.amount);
  const currencyCode = variant?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode;
  const resolved = useMemo(() => resolveCustomization(config, selected, basePrice), [basePrice, config, selected]);
  const activeGroupIndex = Math.max(0, config.groups.findIndex((group) => group.id === activeGroupId));
  const activeGroup = config.groups[activeGroupIndex] ?? config.groups[0];
  const previousGroup = config.groups[activeGroupIndex - 1] ?? null;
  const nextGroup = config.groups[activeGroupIndex + 1] ?? null;
  const stepCount = config.groups.length + 1;
  const heroImage = product.featuredImage ?? product.images[0] ?? null;
  const displayTitle = productPublicTitle(product);
  const displayName = productDisplayName(product);
  const builderHeading = productBuilderHeading(product);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const hasIssues = resolved.issues.length > 0;
  const canCheckout = Boolean(variantId && variant?.availableForSale && !hasIssues);
  const reviewedCount = reviewedGroupIds.size;

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
  }, [activeGroupId, isReviewing]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setMobileDockVisible(entry.isIntersecting), {
      threshold: 0.08
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  async function addToCart() {
    if (!canCheckout) return;
    setLoading(true);
    setError("");
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
              title: `${displayName || displayTitle} custom options`
            }
          : undefined
      })
    });
    const payload = await response.json();
    setLoading(false);
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
    router.push(checkoutUrl);
  }

  function selectOption(groupId: string, optionId: string) {
    const group = config.groups.find((item) => item.id === groupId);
    markGroupReviewed(groupId);
    setSelected((current) => ({
      ...current,
      [groupId]: group?.selectionMode === "multiple" ? nextMultipleSelection(defaultMultipleOptionId(group.options), current[groupId], optionId) : optionId
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
    if (nextGroup) {
      setActiveGroupId(nextGroup.id);
      return;
    }
    setReviewing(true);
  }

  function goToGroup(groupId: string) {
    setReviewing(false);
    setActiveGroupId(groupId);
  }

  function showReview() {
    setReviewing(true);
  }

  return (
    <section ref={rootRef} data-tone="blush" className="product-builder relative overflow-hidden rounded-[30px] border border-gold-500/20 bg-[linear-gradient(135deg,rgba(26,17,13,0.96),rgba(7,4,3,0.98))] shadow-soft">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(42rem_32rem_at_78%_8%,rgba(79,156,138,0.1),transparent_62%),radial-gradient(36rem_28rem_at_20%_16%,rgba(192,105,94,0.12),transparent_64%)]" />
      <div
        className={clsx(
          "relative grid min-h-[760px] lg:min-h-0 lg:grid-cols-[132px_minmax(0,1fr)_420px] xl:grid-cols-[144px_minmax(0,1fr)_460px]",
          isReviewing ? "lg:h-auto" : "lg:h-[880px]"
        )}
      >
        <CategoryRail
          groups={config.groups}
          activeGroupId={activeGroup.id}
          selected={selected}
          reviewedGroupIds={reviewedGroupIds}
          isReviewing={isReviewing}
          onSelect={goToGroup}
        />

        <div
          className={clsx(
            "builder-stage relative flex min-h-[560px] flex-col border-y border-gold-500/20 bg-[linear-gradient(180deg,rgba(245,225,210,0.045),rgba(79,156,138,0.035)_45%,rgba(217,154,111,0.028))] p-5 sm:p-8 lg:border-x lg:border-y-0",
            isReviewing ? "overflow-visible lg:min-h-[880px]" : "overflow-hidden lg:min-h-0"
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(246,233,221,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(246,233,221,0.08)_1px,transparent_1px)] [background-size:46px_46px]" />
          <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold-300">{isReviewing ? "Build review" : "Build studio"}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ivory-50">{isReviewing ? "Confirm your build" : builderHeading}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ivory-500">
                {isReviewing
                  ? "Review the selected options, edit anything that needs a second look, then continue to checkout."
                  : "Choose what matters. The price updates as you go, and our team checks it all before anything is made or shipped."}
              </p>
            </div>
            <div className="rounded-full border border-gold-500/20 bg-ivory-50/[0.045] px-4 py-2 text-sm text-ivory-300">
              {isReviewing ? "Ready to review" : `${reviewedCount}/${config.groups.length} reviewed`}
            </div>
          </div>

          <div className={clsx("relative z-10 mx-auto flex min-h-0 w-full flex-1 items-center justify-center", isReviewing ? "my-6 max-w-[920px] items-start overflow-visible py-2" : "my-4 max-w-[640px]")}>
            {isReviewing ? (
              <BuildReviewSummary
                selectedOptions={resolved.selectedOptions}
                basePrice={basePrice}
                optionPriceDelta={resolved.optionPriceDelta}
                totalPrice={resolved.totalPrice}
                currencyCode={currencyCode}
                onEdit={goToGroup}
              />
            ) : (
              <>
                <div className="absolute inset-x-10 bottom-5 h-16 rounded-full bg-gold-500/12 blur-3xl" />
                <div data-tone="deep" className="builder-preview-island noir-media-wrap studio-float relative aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-[30px] border border-gold-500/18 bg-ink-950 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:max-w-[320px] xl:max-w-[340px]">
                  {heroImage ? (
                    <button type="button" onClick={() => setPreviewOpen(true)} className="relative block h-full w-full" aria-label="Open product image preview">
                      <Image src={heroImage.url} alt={displayTitle} fill sizes="(min-width: 1024px) 36vw, 92vw" className="object-cover noir-media" />
                    </button>
                  ) : (
                    <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ivory-500">{displayTitle}</div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(0,0,0,0.62))]" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-[18px] border border-gold-500/18 bg-ink-950/78 p-4 backdrop-blur">
                    <p className="line-clamp-1 text-sm font-semibold text-ivory-50">{displayTitle}</p>
                    <p className="mt-1 text-xs text-ivory-500">{product.extended.brand ?? product.vendor}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {!isReviewing && (
            <SelectedTray
              groups={config.groups}
              selected={selected}
              selectedOptions={resolved.selectedOptions}
              reviewedGroupIds={reviewedGroupIds}
              currencyCode={currencyCode}
            />
          )}
        </div>

        <aside ref={stepPanelRef} data-tone="deep" className="builder-panel scroll-mt-28 flex min-h-[660px] flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(33,21,15,0.98),rgba(15,8,7,0.98))] text-ivory-50 lg:min-h-0">
          <div className="shrink-0 border-b border-gold-500/20 bg-ink-950/28 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gold-300">{isReviewing ? "Final review" : "Now choosing"}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold">{isReviewing ? "Your selections" : activeGroup.label}</h3>
              <span className="rounded-full border border-gold-500/20 bg-ivory-50/[0.06] px-3 py-1 text-xs font-semibold text-ivory-400">
                {isReviewing ? `${stepCount}/${stepCount}` : `${activeGroupIndex + 1}/${stepCount}`}
              </span>
            </div>
            {(isReviewing || activeGroup.description) && (
              <p className="mt-2 text-sm leading-5 text-ivory-400">
                {isReviewing ? "Final specs are passed to Shopify as order notes and confirmed by our team before fulfillment." : activeGroup.description}
              </p>
            )}
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

          <div ref={optionScrollerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            {isReviewing ? (
              <ReviewSidebarSummary selectedOptions={resolved.selectedOptions} currencyCode={currencyCode} onEdit={goToGroup} />
            ) : (
              <OptionPalette
                group={activeGroup}
                selected={selected[activeGroup.id]}
                selections={selected}
                isGroupReviewed={reviewedGroupIds.has(activeGroup.id)}
                onSelect={(optionId) => selectOption(activeGroup.id, optionId)}
                config={config}
                currencyCode={currencyCode}
              />
            )}

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

          <div data-tone="deep" className="builder-price-island shrink-0 border-t border-gold-500/20 bg-[linear-gradient(180deg,rgba(246,233,221,0.055),rgba(79,156,138,0.055))] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-ivory-500">Your build</p>
                <p className="mt-1 text-2xl font-semibold">{formatMoney(resolved.totalPrice, currencyCode)}</p>
              </div>
              <div className="text-right text-xs text-ivory-500">
                <p>Base {formatMoney(basePrice, currencyCode)}</p>
                <p>Options {formatMoney(resolved.optionPriceDelta, currencyCode)}</p>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-3 grid gap-2">
              {isReviewing ? (
                <button
                  type="button"
                  disabled={!canCheckout || loading}
                  onClick={addToCart}
                  className="builder-primary-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#4f9c8a] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#438b7a] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  Checkout
                </button>
              ) : nextGroup ? (
                <button
                  type="button"
                  onClick={goToNextGroup}
                  className="builder-primary-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-gold-200 to-gold-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-ink-950 transition hover:-translate-y-0.5"
                >
                  Next: {nextGroup.label}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextGroup}
                  className="builder-primary-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-gold-200 to-gold-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-ink-950 transition hover:-translate-y-0.5"
                >
                  Review build
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {(previousGroup || isReviewing) && (
                <button
                  type="button"
                  onClick={goToPreviousGroup}
                  className="builder-secondary-button inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] border border-gold-500/20 bg-ivory-50/[0.045] px-5 py-2 text-sm font-semibold text-ivory-50 transition hover:border-gold-300/60"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {isReviewing ? `Back: ${activeGroup.label}` : `Back: ${previousGroup?.label}`}
                </button>
              )}
            </div>
            <div className="mt-3 grid gap-2 text-xs text-ivory-400 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Assurance icon={<ShieldCheck className="h-4 w-4" />} text="Discreet Shopify checkout" />
              <Assurance icon={<Clock3 className="h-4 w-4" />} text="Final specs confirmed by support" />
            </div>
          </div>
        </aside>
      </div>

      <div data-tone="deep" className={clsx("builder-price-island fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/16 bg-ink-950/95 p-3 shadow-soft backdrop-blur transition duration-200 lg:hidden", isMobileDockVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0")}>
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-ivory-500">{displayTitle}</p>
            <p className="text-base font-semibold text-gold-300">{formatMoney(resolved.totalPrice, currencyCode)}</p>
          </div>
          <GoldButton className="min-w-36 px-4" disabled={!canCheckout || loading} onClick={isReviewing ? addToCart : showReview}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
            {isReviewing ? "Checkout" : "Review"}
          </GoldButton>
        </div>
      </div>
      {isPreviewOpen && heroImage && (
        <ImagePreviewModal imageUrl={heroImage.url} alt={displayTitle} onClose={() => setPreviewOpen(false)} />
      )}
    </section>
  );
}

function cartCustomizationSummary(
  selectedOptions: Array<{ groupLabel: string; optionLabel: string; priceDelta: number }>
) {
  const byGroup = new Map<string, { optionLabels: string[]; priceDelta: number }>();
  for (const option of selectedOptions) {
    const current = byGroup.get(option.groupLabel) ?? { optionLabels: [], priceDelta: 0 };
    current.optionLabels.push(option.optionLabel);
    current.priceDelta += option.priceDelta;
    byGroup.set(option.groupLabel, current);
  }
  return [...byGroup.entries()].map(([groupLabel, summary]) => ({
    groupLabel,
    optionLabels: summary.optionLabels,
    priceDelta: summary.priceDelta
  }));
}

function CategoryRail({
  groups,
  activeGroupId,
  selected,
  reviewedGroupIds,
  isReviewing,
  onSelect
}: {
  groups: CustomizationGroup[];
  activeGroupId: string;
  selected: CustomizationSelections;
  reviewedGroupIds: Set<string>;
  isReviewing: boolean;
  onSelect: (groupId: string) => void;
}) {
  return (
    <nav className="builder-rail flex gap-2 overflow-x-auto border-b border-gold-500/20 bg-ivory-50/[0.035] p-4 lg:h-full lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:p-4">
      {groups.map((group) => {
        const active = !isReviewing && group.id === activeGroupId;
        const reviewed = reviewedGroupIds.has(group.id);
        const label = active ? "Now" : reviewed ? "Reviewed" : "Choose";
        const selectedLabel = reviewed ? selectedLabelForGroup(group, selected[group.id]) : "";
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
              <span className={clsx("mt-1 block text-xs", active ? "text-ink-500" : "text-ivory-600")}>{selectedLabel || label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function BuildReviewSummary({
  selectedOptions,
  basePrice,
  optionPriceDelta,
  totalPrice,
  currencyCode,
  onEdit
}: {
  selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"];
  basePrice: number;
  optionPriceDelta: number;
  totalPrice: number;
  currencyCode: string;
  onEdit: (groupId: string) => void;
}) {
  return (
    <div data-tone="deep" className="builder-review-island w-full rounded-[28px] border border-gold-500/20 bg-[linear-gradient(155deg,rgba(7,4,3,0.82),rgba(35,21,16,0.78))] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <PriceStat label="Base doll" value={formatMoney(basePrice, currencyCode)} />
        <PriceStat label="Options" value={formatMoney(optionPriceDelta, currencyCode)} />
        <PriceStat label="Total" value={formatMoney(totalPrice, currencyCode)} strong />
      </div>
      <div className="mt-4 max-h-[520px] overflow-y-auto pr-1 lg:max-h-[600px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {selectedOptions.map((option) => (
            <button
              type="button"
              key={`${option.groupId}-${option.optionId}`}
              onClick={() => onEdit(option.groupId)}
              className="group flex items-start gap-3 rounded-[18px] border border-gold-500/16 bg-ivory-50/[0.045] p-3 text-left transition hover:-translate-y-0.5 hover:border-gold-300/55 hover:bg-ivory-50/[0.07]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#4f9c8a]/15 text-[#9bd7c9]">
                {groupIcon(option.groupId)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs uppercase tracking-[0.12em] text-ivory-500">{option.groupLabel}</span>
                <span className="mt-1 block truncate text-sm font-semibold text-ivory-50">{option.optionLabel}</span>
                <span className="mt-2 inline-flex rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-gold-300">
                  {option.priceDelta ? formatMoney(option.priceDelta, currencyCode) : "Included"}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-gold-300 opacity-70 transition group-hover:opacity-100">Edit</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewSidebarSummary({
  selectedOptions,
  currencyCode,
  onEdit
}: {
  selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"];
  currencyCode: string;
  onEdit: (groupId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {selectedOptions.map((option) => (
        <button
          type="button"
          key={`${option.groupId}-${option.optionId}`}
          onClick={() => onEdit(option.groupId)}
          className="flex w-full items-center gap-3 rounded-[14px] border border-gold-500/14 bg-ink-950/48 p-3 text-left transition hover:border-gold-300/50 hover:bg-ivory-50/[0.055]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#4f9c8a]/14 text-[#9bd7c9]">{groupIcon(option.groupId)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ivory-50">{option.optionLabel}</span>
            <span className="mt-0.5 block truncate text-xs text-ivory-500">{option.groupLabel}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-gold-300">{option.priceDelta ? formatMoney(option.priceDelta, currencyCode) : "Edit"}</span>
        </button>
      ))}
    </div>
  );
}

function PriceStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={clsx("rounded-[16px] border p-3", strong ? "border-gold-300/34 bg-gold-300/10" : "border-gold-500/12 bg-ivory-50/[0.04]")}>
      <p className="text-xs uppercase tracking-[0.14em] text-ivory-500">{label}</p>
      <p className={clsx("mt-1 font-semibold", strong ? "text-xl text-gold-200" : "text-ivory-50")}>{value}</p>
    </div>
  );
}

function OptionPalette({
  group,
  selected,
  selections,
  isGroupReviewed,
  onSelect,
  config,
  currencyCode
}: {
  group: CustomizationGroup;
  selected: CustomizationSelectionValue | undefined;
  selections: CustomizationSelections;
  isGroupReviewed: boolean;
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
        const isSelected = selectionIds(selected).includes(option.id);
        const isDisabled = Boolean(conflict) && !isSelected;
        const showSelected = isSelected && isGroupReviewed;
        return (
          <OptionTile
            key={option.id}
            group={group}
            option={option}
            selected={showSelected}
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
        "option-tile group relative flex min-h-32 flex-col items-center justify-start overflow-hidden rounded-[22px] border p-3 text-center transition duration-200",
        selected ? "border-[#4f9c8a] bg-[linear-gradient(180deg,rgba(79,156,138,0.09),rgba(7,4,3,0.62))] shadow-[0_16px_40px_rgba(79,156,138,0.16)]" : "border-gold-500/20 bg-ink-950/62 hover:-translate-y-0.5 hover:border-gold-300/60 hover:shadow-[0_16px_40px_rgba(20,6,4,0.32)]",
        selected && "is-selected",
        disabled && "cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-gold-500/20 hover:shadow-none"
      )}
    >
      {selected && (
        <span className="option-check absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#4f9c8a] text-white shadow-[0_8px_24px_rgba(79,156,138,0.28)]">
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

function OptionMark({ option, selected }: { option: CustomizationOption; selected: boolean }) {
  if (option.swatch?.kind === "image") {
    return (
      <span className={clsx("relative mt-0.5 h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border bg-ink-900 xl:h-18 xl:w-18", selected ? "border-[#4f9c8a]" : "border-gold-500/20")} aria-hidden="true">
        <Image src={option.swatch.value} alt="" fill sizes="72px" className="object-cover" loading="lazy" unoptimized />
      </span>
    );
  }
  if (option.swatch?.kind === "color") {
    return (
      <span
        className={clsx("mt-0.5 h-12 w-12 shrink-0 rounded-full border-[5px]", selected ? "border-[#4f9c8a]/35" : "border-ivory-50/10")}
        style={{ backgroundColor: option.swatch.value }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={clsx("mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-semibold", selected ? "border-[#4f9c8a] bg-[#4f9c8a]/15 text-[#9bd7c9]" : "border-gold-500/20 bg-ivory-50/[0.045] text-ivory-500")}>
      {option.swatch?.label ?? option.label.slice(0, 1)}
    </span>
  );
}

function SelectedTray({
  groups,
  selected,
  selectedOptions,
  reviewedGroupIds,
  currencyCode
}: {
  groups: CustomizationGroup[];
  selected: CustomizationSelections;
  selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"];
  reviewedGroupIds: Set<string>;
  currencyCode: string;
}) {
  const reviewedOptions = selectedOptions.filter((option) => reviewedGroupIds.has(option.groupId));
  const progress = groups.length ? (reviewedGroupIds.size / groups.length) * 100 : 0;

  return (
    <div className="relative z-10">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ivory-500">Reviewed ({reviewedGroupIds.size}/{groups.length})</h3>
        <p className="hidden text-xs text-ivory-600 sm:block">Defaults are included until changed.</p>
      </div>
      <div className="border-t border-gold-500/12 pt-3">
        <div className="h-2 overflow-hidden rounded-full bg-ivory-50/[0.18]">
          <div className="h-full rounded-full bg-[#236b5f] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        {reviewedOptions.length ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {groups.filter((group) => reviewedGroupIds.has(group.id)).map((group) => {
              const label = selectedLabelForGroup(group, selected[group.id]);
              const priceDelta = selectedOptions.filter((option) => option.groupId === group.id).reduce((sum, option) => sum + option.priceDelta, 0);
              return (
                <div key={group.id} className="flex min-w-36 max-w-48 items-center gap-2 rounded-full border border-gold-500/14 bg-ivory-50/[0.38] px-3 py-2 shadow-[0_8px_22px_rgba(96,40,38,0.08)]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#236b5f] text-[#fff4f1]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 text-xs leading-4">
                    <span className="block truncate font-semibold text-[#3d231f]">{group.label}</span>
                    <span className="block truncate text-[#7a5b55]">{label || "Reviewed"}</span>
                    {priceDelta ? <span className="block truncate font-semibold text-[#236b5f]">+ {formatMoney(priceDelta, currencyCode)}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-[14px] border border-gold-500/12 bg-ivory-50/[0.28] px-3 py-2 text-sm text-[#7a5b55]">
            Start with Material, then move through each group. The checked state appears as you review or change options.
          </p>
        )}
      </div>
    </div>
  );
}

function selectedLabelForGroup(group: CustomizationGroup, value: CustomizationSelectionValue | undefined) {
  const optionIds = selectionIds(value);
  const labels = optionIds
    .map((optionId) => group.options.find((option) => option.id === optionId)?.label)
    .filter(Boolean);
  if (!labels.length) return "";
  if (labels.length === 1) return labels[0] ?? "";
  return `${labels.length} selected`;
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
