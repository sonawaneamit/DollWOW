"use client";

import { useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/utils/storageStore";

export type ConsentState = "granted" | "denied" | "unknown";

const CONSENT_STORAGE_KEY = "dollwow-consent-v1";
const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

type StoredConsent = {
  state: Exclude<ConsentState, "unknown">;
  updatedAt: string;
};

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return "unknown";
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.state !== "granted" && parsed.state !== "denied") return "unknown";
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (!Number.isFinite(age) || age < 0 || age > CONSENT_MAX_AGE_MS) return "unknown";
    return parsed.state;
  } catch {
    return "unknown";
  }
}

function parseConsent(raw: string | null): ConsentState {
  if (!raw) return "unknown";
  try {
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed.state !== "granted" && parsed.state !== "denied") return "unknown";
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (!Number.isFinite(age) || age < 0 || age > CONSENT_MAX_AGE_MS) return "unknown";
    return parsed.state;
  } catch {
    return "unknown";
  }
}

const consentStore = createStorageStore<ConsentState>(CONSENT_STORAGE_KEY, "dollwow:consent-updated", parseConsent, "unknown");

/** Reactive access to the analytics consent choice (SSR-safe). */
export function useConsent(): ConsentState {
  return useSyncExternalStore(consentStore.subscribe, consentStore.getSnapshot, consentStore.getServerSnapshot);
}

export function writeConsent(state: Exclude<ConsentState, "unknown">) {
  if (typeof window === "undefined") return;
  const payload: StoredConsent = { state, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  updateGtagConsent(state);
  window.dispatchEvent(new CustomEvent("dollwow:consent-updated", { detail: state }));
}

export function updateGtagConsent(state: Exclude<ConsentState, "unknown">) {
  if (typeof window === "undefined") return;
  if (state === "denied") {
    document.cookie = "dollwow_ga_context=; Path=/; Max-Age=0; SameSite=Lax";
    if (/(^|\.)dollwow\.com$/.test(location.hostname)) document.cookie = "dollwow_ga_context=; Path=/; Domain=dollwow.com; Max-Age=0; SameSite=Lax; Secure";
  }
  const value = state === "granted" ? "granted" : "denied";
  window.gtag?.("consent", "update", {
    analytics_storage: value,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
}
