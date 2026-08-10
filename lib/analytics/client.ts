"use client";

import { analyticsEvents } from "@/lib/analytics/events";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEventParams = Record<string, string | number | boolean | object | undefined>;

/**
 * Client-side event tracking. Events are queued onto the dataLayer, so calls
 * made before the GA4 script finishes loading are not lost. When no
 * measurement ID is configured (local dev), events are logged instead.
 */
export function trackEvent(event: string, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined") return;
  const cleaned = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  window.dataLayer = window.dataLayer ?? [];
  window.gtag?.("event", event, cleaned);
  if (!window.gtag && process.env.NODE_ENV !== "production") {
    console.info("[analytics:event]", event, cleaned);
  }
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title
  });
}

export type AnalyticsItem = {
  id: string;
  name: string;
  brand?: string;
  variant?: string;
  price?: number;
  currency?: string;
  quantity?: number;
};

export function ga4Item(item: AnalyticsItem) {
  return {
    item_id: item.id,
    item_name: item.name,
    item_brand: item.brand,
    item_variant: item.variant,
    price: item.price,
    currency: item.currency,
    quantity: item.quantity ?? 1
  };
}

export { analyticsEvents };
