"use client";

import { useSyncExternalStore } from "react";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { createStorageStore } from "@/lib/utils/storageStore";

export type BrowserCartCustomizationItem = {
  groupLabel: string;
  optionLabels: string[];
  priceDelta?: number;
};

export type BrowserCartState = {
  checkoutUrl: string;
  totalQuantity: number;
  productTitle?: string;
  productDisplayName?: string;
  productHandle?: string;
  productImageUrl?: string;
  productImageAlt?: string;
  merchandiseId?: string;
  quantity?: number;
  readyToShip?: boolean;
  currencyCode?: string;
  customizationSummary?: BrowserCartCustomizationItem[];
  updatedAt: string;
};

// Keep the original key: returning visitors may still hold a saved checkout
// written by the previous single-item flow.
const STORAGE_KEY = "dollwow-cart-state";
const CART_UPDATED_EVENT = "dollwow:cart-updated";

function parseBrowserCartState(raw: string | null): BrowserCartState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BrowserCartState;
    if (!parsed?.checkoutUrl || !parsed?.totalQuantity) return null;
    return {
      ...parsed,
      checkoutUrl: normalizeCheckoutUrl(parsed.checkoutUrl)
    };
  } catch {
    return null;
  }
}

const legacyCartStore = createStorageStore<BrowserCartState | null>(STORAGE_KEY, CART_UPDATED_EVENT, parseBrowserCartState, null);

/** Reactive access to the legacy saved-checkout state (SSR-safe). */
export function useLegacyCartState(): BrowserCartState | null {
  return useSyncExternalStore(legacyCartStore.subscribe, legacyCartStore.getSnapshot, legacyCartStore.getServerSnapshot);
}

export function readBrowserCartState(): BrowserCartState | null {
  if (typeof window === "undefined") return null;
  return parseBrowserCartState(window.localStorage.getItem(STORAGE_KEY));
}

export function writeBrowserCartState(input: Omit<BrowserCartState, "updatedAt">) {
  if (typeof window === "undefined") return;
  const state: BrowserCartState = {
    ...input,
    checkoutUrl: normalizeCheckoutUrl(input.checkoutUrl),
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: state }));
}

export function clearBrowserCartState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: null }));
}
