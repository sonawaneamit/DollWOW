"use client";

export type BrowserCartState = {
  checkoutUrl: string;
  totalQuantity: number;
  productTitle?: string;
  productDisplayName?: string;
  productHandle?: string;
  productImageUrl?: string;
  productImageAlt?: string;
  currencyCode?: string;
  customizationSummary?: BrowserCartCustomizationItem[];
  updatedAt: string;
};

export type BrowserCartCustomizationItem = {
  groupLabel: string;
  optionLabels: string[];
  priceDelta?: number;
};

const STORAGE_KEY = "dollwow-cart-state";

export function readBrowserCartState(): BrowserCartState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrowserCartState;
    if (!parsed?.checkoutUrl || !parsed?.totalQuantity) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBrowserCartState(input: Omit<BrowserCartState, "updatedAt">) {
  if (typeof window === "undefined") return;
  const state: BrowserCartState = {
    ...input,
    updatedAt: new Date().toISOString()
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("dollwow:cart-updated", { detail: state }));
}

export function clearBrowserCartState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("dollwow:cart-updated", { detail: null }));
}
