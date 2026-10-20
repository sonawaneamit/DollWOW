"use client";

import { analyticsEvents } from "@/lib/analytics/events";
import { track } from "@vercel/analytics";
import { readConsent } from "@/lib/analytics/consent";
import { analyticsHostAllowed, analyticsPageLocation, type AnalyticsConfig } from "@/lib/analytics/config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    dollwowAnalytics?: AnalyticsConfig;
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
  if (event === analyticsEvents.purchase) return;
  const cleaned = Object.fromEntries(Object.entries(params).filter(([key, value]) => value !== undefined && !/email|search_term|query|message|page_location|page_referrer|destination_url/i.test(key)));
  if (analyticsHostAllowed(window.dollwowAnalytics ?? null, window.location.hostname) && readConsent() === "granted") {
    window.gtag?.("event", event, { ...cleaned, page_location: analyticsPageLocation(window.location.href), send_to: window.dollwowAnalytics!.measurementId });
  }
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
  if (!analyticsHostAllowed(window.dollwowAnalytics ?? null, window.location.hostname) || readConsent() !== "granted") return;
  window.gtag?.("event", "page_view", {
    page_location: analyticsPageLocation(new URL(path, window.location.origin).href),
    page_referrer: document.referrer ? new URL(document.referrer).origin : "",
    send_to: window.dollwowAnalytics!.measurementId,
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
