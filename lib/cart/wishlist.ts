"use client";

import { useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/utils/storageStore";

export type WishlistEntry = {
  productHandle: string;
  productTitle: string;
  brand?: string;
  imageUrl?: string;
  imageAlt?: string;
  unitPrice: number;
  currencyCode: string;
  readyToShip?: boolean;
  savedAt: string;
};

export const MAX_WISHLIST_ENTRIES = 60;

const WISHLIST_STORAGE_KEY = "dollwow-wishlist-v1";
export const WISHLIST_UPDATED_EVENT = "dollwow:wishlist-updated";

// ---------- Pure helpers (unit-tested) ----------

export function toggleWishlistEntry(
  items: WishlistEntry[],
  entry: Omit<WishlistEntry, "savedAt"> & { savedAt?: string }
): { items: WishlistEntry[]; saved: boolean } {
  const exists = items.some((item) => item.productHandle === entry.productHandle);
  if (exists) {
    return { items: items.filter((item) => item.productHandle !== entry.productHandle), saved: false };
  }
  const nextEntry: WishlistEntry = { ...entry, savedAt: entry.savedAt ?? new Date().toISOString() };
  return { items: [nextEntry, ...items].slice(0, MAX_WISHLIST_ENTRIES), saved: true };
}

export function isInWishlist(items: WishlistEntry[], productHandle: string): boolean {
  return items.some((item) => item.productHandle === productHandle);
}

// ---------- Browser persistence ----------

function parseWishlist(raw: string | null): WishlistEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWishlistEntry);
  } catch {
    return [];
  }
}

const wishlistStore = createStorageStore<WishlistEntry[]>(WISHLIST_STORAGE_KEY, WISHLIST_UPDATED_EVENT, parseWishlist, []);

/** Reactive access to the saved-for-later list (SSR-safe, re-renders on any write). */
export function useWishlist(): WishlistEntry[] {
  return useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot, wishlistStore.getServerSnapshot);
}

export function readWishlist(): WishlistEntry[] {
  if (typeof window === "undefined") return [];
  return parseWishlist(window.localStorage.getItem(WISHLIST_STORAGE_KEY));
}

export function writeWishlist(items: WishlistEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, { detail: items }));
}

export function removeFromWishlist(productHandle: string) {
  writeWishlist(readWishlist().filter((item) => item.productHandle !== productHandle));
}

function isWishlistEntry(value: unknown): value is WishlistEntry {
  const entry = value as WishlistEntry;
  return Boolean(
    entry &&
      typeof entry.productHandle === "string" &&
      typeof entry.productTitle === "string" &&
      Number.isFinite(entry.unitPrice) &&
      typeof entry.currencyCode === "string"
  );
}
