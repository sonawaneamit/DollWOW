"use client";

import { useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/utils/storageStore";
import type { CustomizationSelections } from "@/types/customization";
import { customizationSelectionIdentity } from "@/lib/customization/identity";

export type BagItem = {
  merchandiseId: string;
  productHandle: string;
  productTitle: string;
  productDisplayName?: string;
  brand?: string;
  imageUrl?: string;
  imageAlt?: string;
  unitPrice: number;
  currencyCode: string;
  quantity: number;
  readyToShip?: boolean;
  selections?: CustomizationSelections;
  attributes?: Array<{ key: string; value: string }>;
  customizationCharge?: {
    amount: number;
    currencyCode: string;
    title?: string;
    items?: Array<{ group?: string; label: string; amount: number }>;
  };
  addedAt: string;
};

export const MAX_ITEM_QUANTITY = 10;
export const MAX_BAG_ITEMS = 20;

const BAG_STORAGE_KEY = "dollwow-bag-v1";
export const BAG_UPDATED_EVENT = "dollwow:bag-updated";

// ---------- Pure helpers (unit-tested) ----------

export function upsertBagItem(items: BagItem[], item: Omit<BagItem, "addedAt"> & { addedAt?: string }): BagItem[] {
  const quantity = clampQuantity(item.quantity);
  const nextItem: BagItem = { ...item, quantity, addedAt: item.addedAt ?? new Date().toISOString() };
  const existingIndex = items.findIndex((entry) => bagItemIdentity(entry) === bagItemIdentity(nextItem));

  if (existingIndex === -1) {
    return [...items, nextItem].slice(-MAX_BAG_ITEMS);
  }

  return items.map((entry, index) =>
    index === existingIndex
      ? { ...entry, ...nextItem, quantity: clampQuantity(entry.quantity + quantity), addedAt: entry.addedAt }
      : entry
  );
}

export function bagItemIdentity(item: Pick<BagItem, "merchandiseId" | "selections">) {
  return `${item.merchandiseId}::${customizationSelectionIdentity(item.selections)}`;
}

export function updateBagItemQuantity(items: BagItem[], identity: string, quantity: number): BagItem[] {
  if (quantity <= 0) return removeBagItem(items, identity);
  const resolvedIdentity = resolveBagIdentity(items, identity);
  return items.map((entry) => (bagItemIdentity(entry) === resolvedIdentity ? { ...entry, quantity: clampQuantity(quantity) } : entry));
}

export function removeBagItem(items: BagItem[], identity: string): BagItem[] {
  const resolvedIdentity = resolveBagIdentity(items, identity);
  return items.filter((entry) => bagItemIdentity(entry) !== resolvedIdentity);
}

export function bagItemCount(items: BagItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function bagSubtotal(items: BagItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) * 100) / 100;
}

export function bagCurrency(items: BagItem[], fallback = "USD"): string {
  return items[0]?.currencyCode ?? fallback;
}

function clampQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.round(quantity)));
}

function resolveBagIdentity(items: BagItem[], identity: string) {
  if (items.some((entry) => bagItemIdentity(entry) === identity)) return identity;
  const merchandiseMatches = items.filter((entry) => entry.merchandiseId === identity);
  return merchandiseMatches.length === 1 ? bagItemIdentity(merchandiseMatches[0]) : identity;
}

// ---------- Browser persistence ----------

function parseBag(raw: string | null): BagItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBagItem);
  } catch {
    return [];
  }
}

const bagStore = createStorageStore<BagItem[]>(BAG_STORAGE_KEY, BAG_UPDATED_EVENT, parseBag, []);

/** Reactive access to the bag (SSR-safe, re-renders on any bag write). */
export function useBag(): BagItem[] {
  return useSyncExternalStore(bagStore.subscribe, bagStore.getSnapshot, bagStore.getServerSnapshot);
}

export function readBag(): BagItem[] {
  if (typeof window === "undefined") return [];
  return parseBag(window.localStorage.getItem(BAG_STORAGE_KEY));
}

export function writeBag(items: BagItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(BAG_UPDATED_EVENT, { detail: items }));
}

export function clearBag() {
  writeBag([]);
}

function isBagItem(value: unknown): value is BagItem {
  const item = value as BagItem;
  return Boolean(
    item &&
      typeof item.merchandiseId === "string" &&
      item.merchandiseId.startsWith("gid://shopify/ProductVariant/") &&
      typeof item.productHandle === "string" &&
      typeof item.productTitle === "string" &&
      Number.isFinite(item.unitPrice) &&
      Number.isFinite(item.quantity)
  );
}
