"use client";

import { createElement, useSyncExternalStore } from "react";
import Script from "next/script";
import { useCurrency } from "@/components/CurrencyProvider";
import { DEFAULT_STOREFRONT_THEME } from "@/lib/storefrontTheme";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("dollwow-theme-change", onChange);
  return () => window.removeEventListener("dollwow-theme-change", onChange);
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

// Public placement identifiers from DollWow's production Business Hub, 2026-09-16.
const merchantId = "d32e9dfd-9b59-4645-9857-57c9ebbb8aec";
const placements = {
  product: "cff7bd8f-8410-43fc-af8a-e60a0ac4a9a1",
  cart: "1a70b503-e849-4d3d-bac5-e0b368cc1f2f"
};

type Props = {
  amount: number;
  currencyCode: string;
  pageType: keyof typeof placements;
  itemSkus?: string;
  itemCategories?: string;
  eligible?: boolean;
  usesDisplayCurrency?: boolean;
};

export function AfterpayMessaging({ amount, currencyCode, pageType, itemSkus, itemCategories, eligible = true, usesDisplayCurrency = false }: Props) {
  const { currency } = useCurrency();
  const appearance = useSyncExternalStore(subscribeToTheme, currentTheme, () => DEFAULT_STOREFRONT_THEME);
  // The currency switcher is an indicative conversion, not a Shopify market.
  // Do not imply approval in another country based on a display preference.
  if (!eligible || !Number.isFinite(amount) || amount <= 0 || currencyCode !== "USD" || (usesDisplayCurrency && currency !== "USD")) return null;

  return (
    <div className="mt-1 text-sm text-text-dim" data-afterpay-messaging={pageType}>
      <Script id="afterpay-messaging-sdk" src="https://js.squarecdn.com/square-marketplace.js" strategy="afterInteractive" />
      {createElement("square-placement", {
        key: `${pageType}:${itemSkus ?? ""}:${itemCategories ?? ""}:${appearance}`,
        "data-mpid": merchantId,
        "data-placement-id": placements[pageType],
        "data-page-type": pageType,
        "data-amount": amount.toFixed(2),
        "data-currency": currencyCode,
        "data-consumer-locale": "en-US",
        "data-item-skus": itemSkus,
        "data-item-categories": itemCategories,
        "data-is-eligible": "true",
        "data-size": "xs",
        "data-appearance": appearance
      })}
    </div>
  );
}
