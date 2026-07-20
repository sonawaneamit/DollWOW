"use client";

import { useSyncExternalStore } from "react";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { createStorageStore } from "@/lib/utils/storageStore";

const STORAGE_KEY = "dollwow-cart";

type BrowserCartState = {
  checkoutUrl: string;
  totalQuantity: number;
  updatedAt: string;
  productTitle?: string;
  productDisplayName?: string;
  productHandle?: string;
  productImageUrl?: string;
  productImageAlt?: string;
  merchandiseId?: string;
  quantity?: number;
  readyToShip?: boolean;
  customizationSummary?: string[];
};

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

const legacyCartStore = createStorageStore<BrowserCartState | null>(STORAGE_KEY, "dollwow:cart-updated", parseBrowserCartState, null);

/** Reactive access to the legacy saved-checkout state (SSR-safe). */
export function useLegacyCartState(): BrowserCartState | null {
  return useSyncExternalStore(legacyCartStore.subscribe, legacyCartStore.getSnapshot, legacyCartStore.getServerSnapshot);
}

export function readBrowserCartState(): BrowserCartState | null {
  if (typeof window === "undefined") return null;
  return parseBrowserCartState(window.localStorage.getItem(STORAGE_KEY));
}

export function writeBrowserCartState(state: Omit<BrowserCartState, "updatedAt">) {
  if (typeof window === "undefined") return;
  const payload: BrowserCartState = { ...state, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("dollwow:cart-updated"));
}

export function clearBrowserCartState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("dollwow:cart-updated"));
}

export type { BrowserCartState };
