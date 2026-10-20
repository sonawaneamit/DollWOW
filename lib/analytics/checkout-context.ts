"use client";

import { readConsent } from "@/lib/analytics/consent";
import { analyticsHostAllowed } from "@/lib/analytics/config";

export const ANALYTICS_CONTEXT_COOKIE = "dollwow_ga_context";

/** Short-lived, consented identifiers only. Never delay or prevent a checkout. */
export async function captureCheckoutAnalytics() {
  try {
  if (typeof window === "undefined" || readConsent() !== "granted" || !analyticsHostAllowed(window.dollwowAnalytics ?? null, window.location.hostname)) return;
  const config = window.dollwowAnalytics!;
  const get = (field: string) => new Promise<unknown>(resolve => {
    const timeout = setTimeout(() => resolve(undefined), 200);
    window.gtag?.("get", config.measurementId, field, (value: unknown) => { clearTimeout(timeout); resolve(value); });
  });
  const [clientId, sessionId] = await Promise.all([get("client_id"), get("session_id")]);
  if (readConsent() !== "granted" || !/^\d+\.\d+$/.test(String(clientId)) || !/^\d+$/.test(String(sessionId))) return;
  const value = encodeURIComponent(JSON.stringify({ clientId, sessionId: String(sessionId), mode: config.mode, measurementId: config.measurementId, at: Date.now() }));
  const domain = /(^|\.)dollwow\.com$/.test(location.hostname) ? "; Domain=dollwow.com" : "";
  document.cookie = `${ANALYTICS_CONTEXT_COOKIE}=${value}; Path=/; Max-Age=1800; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}${domain}`;
  } catch {
    // Analytics storage or blocked scripts must never interrupt a sale.
  }
}
