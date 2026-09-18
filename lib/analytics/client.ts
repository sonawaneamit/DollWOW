"use client";

import { analyticsEvents } from "@/lib/analytics/events";
import { track } from "@vercel/analytics";

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
  trackVercelOnly(event, cleaned);
  if (!window.gtag && process.env.NODE_ENV !== "production") {
    console.info("[analytics:event]", event, cleaned);
  }
}

export function trackVercelOnly(event: string, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined") return;
  const properties: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    // Free-text searches and URLs may contain personal information.
    if (/email|name|search_term|url|location|destination/i.test(key)) continue;
    if (typeof value === "string") properties[key] = value.slice(0, 255);
    else if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) properties[key] = value;
  }
  try {
    track(event, properties);
  } catch {
    // Telemetry must never interrupt checkout or hide a successful submission.
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
