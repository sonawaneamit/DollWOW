"use client";

import { useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/utils/storageStore";

export type RecentlyViewedEntry = {
  productHandle: string;
  productTitle: string;
  brand?: string;
  imageUrl?: string;
  imageAlt?: string;
  unitPrice: number;
  currencyCode: string;
  readyToShip?: boolean;
  viewedAt: string;
};

export const MAX_RECENTLY_VIEWED_ENTRIES = 12;

const RECENTLY_VIEWED_STORAGE_KEY = "dollwow-recently-viewed-v1";
export const RECENTLY_VIEWED_UPDATED_EVENT = "dollwow:recently-viewed-updated";

// ---------- Pure helpers ----------

export function pushRecentlyViewed(
  items: RecentlyViewedEntry[],
  entry: Omit<RecentlyViewedEntry, "viewedAt"> & { viewedAt?: string }
): RecentlyViewedEntry[] {
  const nextEntry: RecentlyViewedEntry = { ...entry, viewedAt: entry.viewedAt ?? new Date().toISOString() };
  return [nextEntry, ...items.filter((item) => item.productHandle !== entry.productHandle)].slice(0, MAX_RECENTLY_VIEWED_ENTRIES);
}

// ---------- Browser persistence ----------

function parseRecentlyViewed(raw: string | null): RecentlyViewedEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentlyViewedEntry);
  } catch {
    return [];
  }
}

const recentlyViewedStore = createStorageStore<RecentlyViewedEntry[]>(
  RECENTLY_VIEWED_STORAGE_KEY,
  RECENTLY_VIEWED_UPDATED_EVENT,
  parseRecentlyViewed,
  []
);

/** Reactive access to the recently-viewed list (SSR-safe). */
export function useRecentlyViewed(): RecentlyViewedEntry[] {
  return useSyncExternalStore(recentlyViewedStore.subscribe, recentlyViewedStore.getSnapshot, recentlyViewedStore.getServerSnapshot);
}

export function readRecentlyViewed(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  return parseRecentlyViewed(window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY));
}

/** Records a product view (dedupes by handle, newest first, capped). */
export function writeRecentlyViewed(entry: Omit<RecentlyViewedEntry, "viewedAt">) {
  if (typeof window === "undefined") return;
  const next = pushRecentlyViewed(readRecentlyViewed(), entry);
  window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_UPDATED_EVENT, { detail: next }));
}

function isRecentlyViewedEntry(value: unknown): value is RecentlyViewedEntry {
  const entry = value as RecentlyViewedEntry;
  return Boolean(
    entry &&
      typeof entry.productHandle === "string" &&
      typeof entry.productTitle === "string" &&
      Number.isFinite(entry.unitPrice) &&
      typeof entry.currencyCode === "string"
  );
}
