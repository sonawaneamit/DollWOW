"use client";

import Image from "next/image";
import { AfterpayMessaging } from "@/components/AfterpayMessaging";
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
  MapPin,
  Maximize2,
  PackageCheck,
  Search,
  ShoppingBag
} from "lucide-react";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import { writeBrowserCartState } from "@/lib/cart/browser";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { productBuilderHeading } from "@/lib/catalog/bodyType";
import { estimatedDeliveryDate } from "@/lib/catalog/delivery";
import { productDisplayName, productPublicTitle } from "@/lib/catalog/naming";
import { protectedProductImageUrlFor } from "@/lib/catalog/productImage";
import { getCustomizationConfig } from "@/lib/customization/configs";
import {
  getDefaultSelections,
  getOptionConflict,
  isNeutralDefaultOption,
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
import { Care365Seal } from "./care/Care365Seal";
import { dollVueSelectionKey } from "@/lib/dollvue/public";
import { PaymentLogos } from "./PaymentLogos";
import { promotionOptionPrice, withPromotionOptionPricing } from "@/lib/promotions/optionPricing";
import { PromotionalOptionPrice } from "./promotions/PromotionalOptionPrice";
import { configurationPresets, matchesConfigurationPreset, type PresetId } from "@/lib/customization/presets";
import { ConfigurationPresets } from "./ConfigurationPresets";
import { templateConfigurationPresets, type TemplatePresetDefinition } from "@/lib/customization/template-presets";
import { litaHeadChoice, presetChoiceOptions, replacePresetChoice, withPresetChoices } from "@/lib/customization/preset-choices";
import { PresetChoiceDialog } from "./PresetChoiceDialog";

export function ProductOptions({ product, promoClock, templateRecipe, presetChoicePreview = false }: { product: Product; promoClock?: string; templateRecipe?: TemplatePresetDefinition | null; presetChoicePreview?: boolean }) {
  const config = useMemo(() => getCustomizationConfig(product), [product]);
  const isFixedWarehouseUnit = product.extended.stockStatus === "ready_to_ship" && product.extended.customAvailable !== true;
  if (isFixedWarehouseUnit) return <ProductOptionsOnRequest product={product} fixedWarehouseUnit />;
  return config.groups.length ? <ProductOptionsBuilder product={product} config={config} promoClock={promoClock} templateRecipe={templateRecipe} presetChoicePreview={presetChoicePreview} /> : <ProductOptionsOnRequest product={product} />;
}

function ProductOptionsBuilder({ product, config, promoClock, templateRecipe, presetChoicePreview }: { product: Product; config: ReturnType<typeof getCustomizationConfig>; promoClock?: string; templateRecipe?: TemplatePresetDefinition | null; presetChoicePreview: boolean }) {
  const router = useRouter();
  const didMountRef = useRef(false);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const scrollToPurchaseRef = useRef(false);
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const promotionNow = usePromotionClock(promoClock);
  const pricedConfig = useMemo(() => withPromotionOptionPricing(product, config, promotionNow), [config, product, promotionNow]);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [activeGroupId, setActiveGroupId] = useState(pricedConfig.groups[0]?.id ?? "");
  const [isReviewing, setReviewing] = useState(false);
  const [manualExpanded, setManualExpanded] = useState(false);
  const [selected, setSelected] = useState(() => getDefaultSelections(pricedConfig));
  const [, setReviewedGroupIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [chosenPreset, setChosenPreset] = useState<PresetId | null>(null);
  const [choiceDialogGroup, setChoiceDialogGroup] = useState<string | null>(null);
  const [choiceDrafts, setChoiceDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let restoreFrame: number | undefined;
    try {
      const key = dollVueSelectionKey(product.handle);
      const saved = JSON.parse(window.localStorage.getItem(key) || "null") as { selections?: Record<string, string>; savedAt?: number } | null;
      if (!saved?.selections || !saved.savedAt || Date.now() - saved.savedAt > 24 * 60 * 60 * 1000) return;
      const supported = Object.fromEntries(Object.entries(saved.selections).filter(([groupId, optionId]) =>
        pricedConfig.groups.some((group) => group.id === groupId && group.options.some((option) => option.id === optionId))
      ));
      if (!Object.keys(supported).length) return;
      restoreFrame = window.requestAnimationFrame(() => {
        setSelected((current) => ({ ...current, ...supported }));
        const firstSelectedGroup = pricedConfig.groups.find((group) => supported[group.id]);
        if (firstSelectedGroup) setActiveGroupId(firstSelectedGroup.id);
        window.localStorage.removeItem(key);
      });
    } catch {
      // Keep factory defaults if a saved DollVue choice cannot be restored.
    }
    return () => {
      if (restoreFrame !== undefined) window.cancelAnimationFrame(restoreFrame);
    };
  }, [pricedConfig.groups, product.handle]);

  const variant = product.variants.find((item) => item.id === variantId) ?? firstAvailable;
  const basePrice = Number(variant?.price.amount ?? product.priceRange.minVariantPrice.amount);
  const currencyCode = variant?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode;
  const resolved = useMemo(() => resolveCustomization(pricedConfig, selected, basePrice), [basePrice, pricedConfig, selected]);
  const visibleGroups = pricedConfig.groups.filter(group => Object.hasOwn(resolved.selections, group.id) &&
    (!/^(?:(?:select|selec)\s+)?tattoo\s+position$/i.test(group.label.trim()) ||
      resolved.selectedOptions.some(option => /^(?:(?:select|selec)\s+)?tattoo$/i.test(option.groupLabel.trim()) &&
        !isNeutralDefaultOption(option.optionId, option.optionLabel))));
  const recipePresets = useMemo(() => templateRecipe === undefined
    ? configurationPresets(product.handle, pricedConfig, basePrice, selected)
    : templateConfigurationPresets(templateRecipe, config, pricedConfig, basePrice, selected),
  [product.handle, config, pricedConfig, basePrice, selected, templateRecipe]);
  const presets = useMemo(() => presetChoicePreview
    ? withPresetChoices(recipePresets, pricedConfig, basePrice, selected, [litaHeadChoice], chosenPreset && chosenPreset !== "starter" ? [litaHeadChoice.groupId] : [])
    : recipePresets.map(preset => ({ ...preset, choiceSlots: [], pendingChoices: [] })),
  [recipePresets, pricedConfig, basePrice, selected, presetChoicePreview, chosenPreset]);
  const activePreset = presets.find(preset => preset.id === chosenPreset && matchesConfigurationPreset(preset, selected));
  const pendingChoices = activePreset?.pendingChoices ?? [];
  const dialogSlot = activePreset?.choiceSlots.find(slot => slot.groupId === choiceDialogGroup);
  const dialogOptions = dialogSlot ? presetChoiceOptions(pricedConfig, selected, dialogSlot)
    .filter(option => !selectionIds(selected[dialogSlot.groupId]).slice(1).includes(option.id)) : [];
  const purchaseTotal = pendingChoices.length ? activePreset!.totalPrice : resolved.totalPrice;
  const manualVisible = presets.length !== 3 || manualExpanded;
  const activeGroupIndex = Math.max(0, visibleGroups.findIndex((group) => group.id === activeGroupId));
  const activeGroup = visibleGroups[activeGroupIndex];
  const previousGroup = visibleGroups[activeGroupIndex - 1] ?? null;
  const nextGroup = visibleGroups[activeGroupIndex + 1] ?? null;
  const heroImage = product.featuredImage ?? product.images[0] ?? null;
  const heroImageUrl = protectedProductImageUrlFor(product, heroImage);
  const displayTitle = productPublicTitle(product);
  const displayName = productDisplayName(product);
  const hasIssues = resolved.issues.length > 0;
  const canCheckout = Boolean(variantId && variant?.availableForSale && !hasIssues && !resolved.requiresPriceConfirmation);

  useEffect(() => {
    if (!scrollToPurchaseRef.current) return;
    let settledFrame: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      // Let the preset radio's focus scroll and collapsed layout settle first.
      settledFrame = window.requestAnimationFrame(() => {
        const target = purchaseRef.current;
        if (!target) return;
        scrollToPurchaseRef.current = false;
        target.scrollIntoView({
          block: "center",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (settledFrame !== undefined) window.cancelAnimationFrame(settledFrame);
    };
  }, [selected]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (typeof window === "undefined" || window.innerWidth >= 1024 || !manualVisible) return;
    const targetId = isReviewing ? "custom-step-review" : `custom-step-${activeGroup?.id}`;
    const frame = window.requestAnimationFrame(() => {
      const panel = document.getElementById(targetId);
      if (!panel) return;
      const top = panel.getBoundingClientRect().top + window.scrollY - 92;
      const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.scrollTo({ top: Math.max(0, top), behavior });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeGroup?.id, isReviewing, manualVisible]);

  async function addToCart() {
    if (pendingChoices.length) {
      setChoiceDialogGroup(pendingChoices[0].groupId);
      return;
    }
    if (!canCheckout || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cart/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchandiseId: variantId,
          quantity: 1,
          selections: resolved.selections,
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
        customizationSummary: cartCustomizationSummary(resolved.selectedOptions.filter(option => visibleGroups.some(group => group.id === option.groupId)))
      });
      trackEvent(analyticsEvents.addToCart, {
        product_handle: product.handle,
        configuration_preset: activePreset?.id ?? (chosenPreset ? "customized" : "none"),
        value: resolved.totalPrice,
        currency: currencyCode,
        items: [{
          item_id: variantId,
          item_name: displayName || displayTitle,
          item_brand: product.extended.brand ?? product.vendor,
          price: resolved.totalPrice,
          quantity: 1
        }]
      });
      trackEvent(analyticsEvents.beginCheckout, {
        value: resolved.totalPrice,
        currency: currencyCode,
        items: [{
          item_id: variantId,
          item_name: displayName || displayTitle,
          item_brand: product.extended.brand ?? product.vendor,
          price: resolved.totalPrice,
          quantity: 1
        }]
      });
      router.push(checkoutUrl);
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function selectOption(groupId: string, optionId: string) {
    if (!isOptionAvailableForCheckout(pricedConfig, groupId, optionId)) return;
    if (chosenPreset) trackEvent("configuration_preset_edited", { product_handle: product.handle, preset: chosenPreset, group_id: groupId });
    const group = pricedConfig.groups.find((item) => item.id === groupId);
    if (presetChoicePreview && groupId === litaHeadChoice.groupId) {
      const next = group?.selectionMode === "multiple" ? nextMultipleSelection(group.options, selected[groupId], optionId) : optionId;
      if (selectionIds(next).every(id => id === litaHeadChoice.emptyOptionId)) {
        setChosenPreset(null);
        setChoiceDialogGroup(null);
      }
    }
    markGroupReviewed(groupId);
    setSelected((current) => ({
      ...current,
      [groupId]: group?.selectionMode === "multiple"
        ? nextMultipleSelection(group.options, current[groupId], optionId)
        : optionId
    }));
  }

  function markGroupReviewed(groupId: string) {
    setReviewedGroupIds((current) => new Set(current).add(groupId));
  }

  function goToPreviousGroup() {
    if (isReviewing) {
      const finalGroup = visibleGroups.at(-1);
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
    setManualExpanded(true);
    setReviewing(false);
    setActiveGroupId(groupId);
  }

  function showReview() {
    setReviewing(true);
  }

  const disabledReason = resolved.issues[0]?.message || (resolved.requiresPriceConfirmation ? "Please contact us to confirm the selected option prices." : !variant?.availableForSale ? "This build is not available to order online." : "");

  return (
    <section className="product-builder relative rounded-lg bg-surface p-5 text-text shadow-card sm:p-7 lg:p-8">
      <div className="product-builder__content">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold text-text-dim">{productBuilderHeading(product)}</p>
          <h2 className="mt-1 break-words font-display text-2xl font-semibold leading-tight sm:text-3xl">Customize {displayName || "your doll"}</h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-text-dim">
            {presets.length === 3 && visibleGroups[0] ? <>
              Pick a popular setup below. Or skip to <a href={`#custom-step-${visibleGroups[0].id}`} aria-expanded={manualVisible} aria-controls={`manual-options-${product.handle}`} onClick={event => {
                event.preventDefault();
                const firstGroup = visibleGroups[0];
                goToGroup(firstGroup.id);
                window.requestAnimationFrame(() => {
                  const panel = document.getElementById(`custom-step-${firstGroup.id}`);
                  panel?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
                  panel?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
                });
              }} className="font-semibold text-accent underline underline-offset-4">customize step-by-step</a>.
            </> : "Choose each option below to make this build your own."}
          </p>
        </div>
      </div>

      {presets.length === 3 && (
        <ConfigurationPresets presets={presets} activeId={activePreset?.id} handle={product.handle} currencyCode={currencyCode} onSelect={preset => {
                    scrollToPurchaseRef.current = preset.pendingChoices.length === 0;
                    setManualExpanded(false);
                    setReviewing(false);
                    setSelected(preset.selections);
                    setChosenPreset(preset.id);
                    setChoiceDialogGroup(preset.pendingChoices[0]?.groupId ?? null);
                    setError("");
                    trackEvent("configuration_preset_selected", { product_handle: product.handle, preset: preset.id, value: preset.totalPrice, currency: currencyCode });
                  }} />
      )}

      {activePreset?.choiceSlots.map(slot => {
        const choice = pricedConfig.groups.find(group => group.id === slot.groupId)?.options.find(option => option.id === selectionIds(selected[slot.groupId])[0] && option.id !== slot.emptyOptionId);
        return <div key={slot.groupId} className="mb-5 flex items-center gap-3 border-y border-border py-3" data-preset-choice-summary>
          {choice?.swatch?.kind === "image" && <Image src={choice.swatch.value} alt={choice.label} width={52} height={52} className="h-[52px] w-[52px] rounded-sm object-contain" unoptimized />}
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{slot.label}{choice ? ` ${choice.label}` : ": choose your style"}</p><p className="text-xs text-text-dim">{choice ? "Your choice is saved with this setup." : "Choose to complete your setup. No style is preselected."}</p></div>
          <button type="button" className="min-h-11 shrink-0 text-sm font-semibold text-accent underline underline-offset-4" onClick={() => { setChoiceDrafts(current => ({ ...current, [slot.groupId]: choice?.id ?? current[slot.groupId] })); setChoiceDialogGroup(slot.groupId); }}>{choice ? "Change" : "Choose head"}</button>
        </div>;
      })}

      <div className={clsx("grid gap-8", manualVisible && "lg:grid-cols-12 lg:items-start")}>
        {manualVisible && <div className="rounded-md bg-surface-tint p-4 lg:hidden">
          <p className="text-sm font-semibold text-text-dim">Current build</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <span className="text-sm text-text-dim">Starting total</span>
            <strong className="text-xl text-text" aria-live="polite">{formatMoney(resolved.totalPrice, currencyCode)}</strong>
          </div>
          <p className="mt-2 text-sm leading-5 text-text-dim">Your default build is ready. Customize as much or as little as you want.</p>
        </div>}
        {manualVisible && <aside className="hidden lg:col-span-5 lg:block">
          <div className="lg:sticky lg:top-24">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-tint">
              {heroImageUrl ? (
                <button type="button" onClick={() => setPreviewOpen(true)} className="relative block h-full w-full" aria-label="Enlarge product image">
                  <Image src={heroImageUrl} alt={displayTitle} fill sizes="(min-width: 1024px) 38vw, 92vw" className="object-cover" />
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
              groups={visibleGroups}
              selected={resolved.selections}
              selectedOptions={resolved.selectedOptions}
              basePrice={basePrice}
              optionPriceDelta={resolved.optionPriceDelta}
              totalPrice={resolved.totalPrice}
              currencyCode={currencyCode}
              leadTimeNote={pricedConfig.leadTimeNote}
              stockStatus={product.extended.stockStatus}
            />
          </div>
        </aside>}

        <div className={clsx("product-builder-groups", manualVisible && "lg:col-span-7")}>
          <div id={`manual-options-${product.handle}`} hidden={!manualVisible} data-manual-options>
          {presets.length === 3 && <button type="button" onClick={() => setManualExpanded(false)} className="mb-3 min-h-11 text-sm font-semibold text-accent underline underline-offset-4">Hide step-by-step options</button>}
          {product.variants.length > 1 ? (
            <label className="product-builder-variant block rounded-md bg-surface-tint p-4">
              <span className="mb-2 block text-[15px] font-semibold text-text-dim">Choose a build</span>
              <StyledSelect value={variantId} onValueChange={setVariantId} ariaLabel="Choose a build" className="product-builder-variant-select" options={product.variants.map((item) => ({ label: item.title, value: item.id }))} />
            </label>
          ) : null}

          <div className="sticky top-24 z-30 -mx-1 mb-4 border-y border-border bg-surface/95 px-1 py-3 shadow-card backdrop-blur lg:hidden">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="leading-tight text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">Ready when you are</p>
                <p className="mt-0.5 text-base font-semibold text-text" aria-live="polite">
                  {formatMoney(resolved.totalPrice, currencyCode)}
                </p>
              </div>
            </div>
          </div>

          {visibleGroups.map((group, index) => {
            const active = !isReviewing && group.id === activeGroup?.id;
            return (
              <section
                key={group.id}
                id={`custom-step-${group.id}`}
                className={clsx("product-builder-group scroll-mt-24 rounded-md border bg-surface transition-colors", active ? "is-active border-accent shadow-card" : "border-border")}
              >
                <button
                  type="button"
                  onClick={() => goToGroup(group.id)}
                  className="product-builder-group__trigger flex min-h-[72px] w-full items-center gap-4 rounded-md px-4 py-3 text-left sm:px-5"
                  aria-expanded={active}
                  aria-controls={`custom-options-${group.id}`}
                >
                  <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold", active ? "bg-accent text-white" : "bg-surface-tint text-text")}>{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-text">{group.label}</span>
                    {!active ? <span className="mt-0.5 block text-[15px] leading-6 text-text-dim">{selectedLabelForGroup(group, resolved.selections[group.id]) || "Factory default — included"}</span> : null}
                  </span>
                  {!active ? <span className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-accent">Change</span> : null}
                </button>

                {active ? (
                  <div id={`custom-options-${group.id}`} className="border-t border-border px-4 pb-5 pt-5 sm:px-5">
                    <p className="text-[15px] font-semibold text-text-dim">Step {index + 1} of {visibleGroups.length}</p>
                    {group.description ? <p className="mt-2 text-[15px] leading-6 text-text-dim">{group.description}</p> : null}
                    <div className="mt-5">
                      <OptionPalette
                        key={group.id}
                        product={product}
                        catalogConfig={config}
                        group={group}
                        selected={resolved.selections[group.id]}
                        selections={resolved.selections}
                        onSelect={(optionId) => selectOption(group.id, optionId)}
                        config={pricedConfig}
                        currencyCode={currencyCode}
                        promotionNow={promotionNow}
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

          </div>
          <section id="custom-step-review" className={clsx("product-builder-group product-builder-review scroll-mt-24 rounded-md border bg-surface", isReviewing ? "is-active border-accent shadow-card" : "border-border")}>
            {!isReviewing ? (
              <button type="button" onClick={showReview} className="product-builder-group__trigger flex min-h-[72px] w-full items-center gap-4 rounded-md px-4 text-left sm:px-5" aria-expanded="false">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-text"><Check className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1 text-[17px] font-semibold">Review your build</span>
                <span className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-accent">Review</span>
              </button>
            ) : (
              <div className="p-4 sm:p-6">
                <p className="text-[15px] font-semibold text-text-dim">Review</p>
                <h3 className="mt-1 font-display text-2xl font-semibold">Review your build</h3>
                <p className="mt-2 text-[15px] leading-6 text-text-dim">Check each choice, then continue to checkout. You can still change anything.</p>

                <ReviewRows groups={visibleGroups} selected={resolved.selections} selectedOptions={resolved.selectedOptions} currencyCode={currencyCode} onEdit={goToGroup} />
              </div>
            )}
          </section>

          <div ref={purchaseRef} data-configuration-purchase className="mt-5 scroll-mt-28 border-t border-border pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p role="status" aria-live="polite" aria-atomic="true" className="flex items-center gap-2 text-base font-semibold text-text">
                    <Check className="h-5 w-5 text-accent" aria-hidden="true" />
                    {pendingChoices.length ? `${activePreset!.label}: one choice left` : activePreset ? `${activePreset.label} applied` : chosenPreset ? "Your customized build" : "Your build"}
                  </p>
                  <button type="button" onClick={() => {
                    showReview();
                    window.requestAnimationFrame(() => document.getElementById("custom-step-review")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
                  }} className="min-h-11 text-sm font-semibold text-accent underline underline-offset-4">Review / edit options</button>
                </div>
                <PriceSummary basePrice={basePrice} optionPriceDelta={purchaseTotal - basePrice} totalPrice={purchaseTotal} currencyCode={currencyCode} />
                {pendingChoices.length > 0 && <p className="mt-2 text-sm text-text-dim">Includes the extra-head upgrade. Choose your head before adding to cart.</p>}

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

                {error ? <p role="alert" className="mt-4 text-[15px] text-danger">{error}</p> : null}

                <div className="mt-6 grid gap-3">
                  <button type="button" disabled={!canCheckout || loading} onClick={addToCart} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button bg-accent px-5 text-[17px] font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
                    {loading ? "Adding to Cart…" : "Add to Cart"}
                  </button>
                  {disabledReason ? <p className="text-[15px] leading-6 text-danger">{disabledReason}</p> : null}
                </div>

                <div className="mt-5 border-t border-border pt-5">
                  <PaymentLogos />
                </div>

                <p className="mt-5 text-center text-[15px] text-text-dim">Secure checkout by Shopify</p>
                <a href={`/support?product=${encodeURIComponent(product.handle)}`} className="mt-2 flex min-h-11 items-center justify-center text-[15px] font-semibold text-accent underline underline-offset-4">Questions? Talk to a real person</a>
          </div>
          <Care365Seal purchase className="mt-4" />
        </div>
      </div>

      {isPreviewOpen && heroImageUrl ? <ImagePreviewModal imageUrl={heroImageUrl} alt={displayTitle} onClose={() => setPreviewOpen(false)} /> : null}
      {dialogSlot && activePreset && <PresetChoiceDialog open title={dialogSlot.title} presetLabel={activePreset.label} dollName={displayName || displayTitle}
        options={dialogOptions} selectedId={selectionIds(selected[dialogSlot.groupId])[0]} draftId={choiceDrafts[dialogSlot.groupId]}
        onDraft={id => setChoiceDrafts(current => ({ ...current, [dialogSlot.groupId]: id }))}
        totalWithoutChoice={resolveCustomization(pricedConfig, replacePresetChoice(pricedConfig, selected, dialogSlot, dialogSlot.emptyOptionId), basePrice).totalPrice}
        currencyCode={currencyCode} step={activePreset.choiceSlots.findIndex(slot => slot.groupId === dialogSlot.groupId) + 1} steps={activePreset.choiceSlots.length}
        onClose={() => setChoiceDialogGroup(null)} onConfirm={id => {
          if (!dialogOptions.some(option => option.id === id)) return;
          const next = resolveCustomization(pricedConfig, replacePresetChoice(pricedConfig, selected, dialogSlot, id), basePrice);
          if (next.issues.length || next.requiresPriceConfirmation) return;
          const nextSlot = pendingChoices.find(slot => slot.groupId !== dialogSlot.groupId);
          scrollToPurchaseRef.current = !nextSlot;
          setSelected(next.selections);
          setChoiceDialogGroup(nextSlot?.groupId ?? null);
          setError("");
        }} />}
      </div>
    </section>
  );
}

function BuildSummary({ groups, selected, selectedOptions, basePrice, optionPriceDelta, totalPrice, currencyCode, leadTimeNote, stockStatus }: {
  groups: CustomizationGroup[];
  selected: CustomizationSelections;
  selectedOptions: ReturnType<typeof resolveCustomization>["selectedOptions"];
  basePrice: number;
  optionPriceDelta: number;
  totalPrice: number;
  currencyCode: string;
  leadTimeNote?: string;
  stockStatus?: Product["extended"]["stockStatus"];
}) {
  const estimatedDate = stockStatus ? estimatedDeliveryDate(stockStatus) : undefined;

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
      {estimatedDate ? (
        <p className="mt-4 text-sm leading-6 text-text-dim">
          Est. delivery <span className="font-semibold text-text">{estimatedDate.formatted}</span>
        </p>
      ) : null}
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
      <AfterpayMessaging amount={totalPrice} currencyCode={currencyCode} pageType="product" />
    </div>
  );
}

function OptionPalette({ product, catalogConfig, group, selected, selections, onSelect, config, currencyCode, promotionNow }: {
  product: Product;
  catalogConfig: ReturnType<typeof getCustomizationConfig>;
  group: CustomizationGroup;
  selected: CustomizationSelectionValue | undefined;
  selections: CustomizationSelections;
  onSelect: (optionId: string) => void;
  config: ReturnType<typeof getCustomizationConfig>;
  currencyCode: string;
  promotionNow: Date;
}) {
  const [query, setQuery] = useState("");
  const searchable = group.options.length >= 24;
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return group.options;
    return group.options.filter((option) =>
      [option.label, option.description, option.swatch?.label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [group.options, query]);

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
      {searchable ? (
        <div className="mb-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-dim" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Find a ${group.label.toLowerCase().replace(/^(choose|add)\s+(an?\s+)?/, "")}`}
              className="min-h-12 w-full rounded-sm border border-border bg-surface pl-11 pr-4 text-base text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <p className="mt-2 text-sm text-text-dim" aria-live="polite">
            {query ? `${visibleOptions.length} of ${group.options.length} choices` : `${group.options.length} choices`}
          </p>
        </div>
      ) : null}
      <div className={clsx("product-option-grid grid grid-cols-1 gap-3", group.options.length >= 8 && "product-option-grid--scroll") }>
        {visibleOptions.map((option) => {
          const catalogGroup = catalogConfig.groups.find((item) => item.id === group.id);
          const catalogOption = catalogGroup?.options.find((item) => item.id === option.id) ?? option;
          const conflict = getOptionConflict(config, selections, group.id, option.id);
          const isSelected = selectionIds(selected).includes(option.id);
          const unavailableOnline = !isOptionAvailableForCheckout(config, group.id, option.id);
          const isDisabled = (Boolean(conflict) || unavailableOnline) && !isSelected;
          const notice = conflict || (unavailableOnline ? "Supplier price not yet verified — unavailable for online checkout." : null);
          return <OptionTile key={option.id} product={product} group={catalogGroup ?? group} option={option} catalogOption={catalogOption} selected={isSelected} disabled={isDisabled} notice={notice} currencyCode={currencyCode} promotionNow={promotionNow} allowPromotions={!catalogConfig.groups.some(item => item.visibleWhen !== undefined)} onClick={() => onSelect(option.id)} />;
        })}
      </div>
      {searchable && !visibleOptions.length ? (
        <p className="rounded-sm border border-border bg-surface-tint p-4 text-[15px] text-text-dim">No matching choices. Try a head number or a shorter name.</p>
      ) : null}
    </div>
  );
}

function OptionTile({ product, group, option, catalogOption, selected, disabled, notice, currencyCode, promotionNow, allowPromotions, onClick }: {
  product: Product;
  group: CustomizationGroup;
  option: CustomizationOption;
  catalogOption: CustomizationOption;
  selected: boolean;
  disabled: boolean;
  notice: string | null;
  currencyCode: string;
  promotionNow: Date;
  allowPromotions: boolean;
  onClick: () => void;
}) {
  const pricing = promotionOptionPrice(product, group, catalogOption, promotionNow, allowPromotions);
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
        <span className="block text-[17px] font-semibold text-text">{pricing.displayLabel}</span>
        {option.description ? <span className="mt-1 block text-sm leading-5 text-text-dim">{option.description}</span> : null}
        <span className="option-tile__price mt-2 inline-flex text-sm font-semibold">
          {disabled && catalogOption.priceDelta === undefined && !pricing.active && !/\bfree\b/i.test(option.label)
            ? "Unavailable online"
            : <PromotionalOptionPrice pricing={pricing} currencyCode={currencyCode} included={option.priceLabel === "included"} />}
        </span>
        {option.productionNote ? <span className="mt-2 flex gap-1.5 text-sm leading-5 text-text-dim"><Info className="mt-0.5 h-4 w-4 shrink-0" />{option.productionNote}</span> : null}
        {disabled ? <span className="mt-2 flex gap-1.5 text-sm leading-5 text-danger"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{notice}</span> : null}
      </span>
    </button>
  );
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

function ProductOptionsOnRequest({ product, fixedWarehouseUnit = false }: { product: Product; fixedWarehouseUnit?: boolean }) {
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
  const checkedAt = product.extended.stockLastCheckedAt ? new Date(product.extended.stockLastCheckedAt) : null;
  const checkedLabel = checkedAt && !Number.isNaN(checkedAt.getTime())
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(checkedAt)
    : null;

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
      const eventParams = {
        product_handle: product.handle,
        value: basePrice,
        currency: currencyCode,
        items: [{ item_id: firstAvailable.id, item_name: displayName || displayTitle, price: basePrice, quantity: 1 }]
      };
      trackEvent(analyticsEvents.addToCart, eventParams);
      trackEvent(analyticsEvents.beginCheckout, eventParams);
      router.push(checkoutUrl);
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg bg-surface p-5 text-text shadow-card sm:p-8">
      <div className={fixedWarehouseUnit ? "" : "grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.62fr)]"}>
        <div>
          <p className="text-[15px] font-semibold text-text-dim">{brandName}</p>
          <h2 className="mt-1 font-display text-3xl font-semibold">{fixedWarehouseUnit ? "This warehouse doll ships as shown" : "Order this doll as shown"}</h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-text-dim">
            {fixedWarehouseUnit
              ? "This is a specific stocked configuration. Factory-order colors, heads, and body upgrades are not available unless they are explicitly listed for this unit."
              : "This listing is priced for the doll shown in the gallery and specifications. Contact us before checkout if you would like to confirm a different version."}
          </p>
          {fixedWarehouseUnit ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-md bg-stock-tint p-4 text-stock">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div><p className="text-sm font-semibold">Warehouse region</p><p className="mt-1 text-base font-semibold text-text">{product.extended.warehouseRegions?.join(", ") || product.extended.warehouseCountry || "Confirming location"}</p></div>
              </div>
              <div className="flex items-start gap-3 rounded-md bg-surface-tint p-4">
                <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div><p className="text-sm font-semibold text-text-dim">Stock record</p><p className="mt-1 text-base font-semibold text-text">{checkedLabel ? `Checked ${checkedLabel}` : "Confirmed before dispatch"}</p></div>
              </div>
            </div>
          ) : null}
          {!fixedWarehouseUnit ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <GoldButton disabled={!canCheckout || loading} onClick={addToCart}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
                {loading ? "Adding to Cart…" : "Add to Cart"}
              </GoldButton>
              <a href={`/support?product=${encodeURIComponent(product.handle)}`} className="inline-flex min-h-[52px] items-center justify-center rounded-button border-2 border-accent px-5 text-[17px] font-semibold text-accent hover:bg-accent-tint">Ask about this doll</a>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-[15px] text-danger">{error}</p> : null}
        </div>
        {!fixedWarehouseUnit ? (
          <div className="rounded-md bg-surface-tint p-5">
            <p className="text-[15px] font-semibold text-text-dim">Listing price</p>
            <p className="mt-2 text-xl font-semibold">{formatMoney(basePrice, currencyCode)}</p>
            <p className="mt-1 text-[15px] leading-6 text-text-dim">For the doll shown in the product gallery and listed specifications.</p>
          </div>
        ) : null}
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

function usePromotionClock(previewClock?: string) {
  const previewTimestamp = previewClock ? Date.parse(previewClock) : Number.NaN;
  const [now, setNow] = useState(() => new Date(Number.isFinite(previewTimestamp) ? previewTimestamp : Date.now()));

  useEffect(() => {
    if (Number.isFinite(previewTimestamp)) return;
    const interval = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(interval);
  }, [previewTimestamp]);

  return now;
}
