"use client";

import { useSyncExternalStore } from "react";
import { createStorageStore } from "@/lib/utils/storageStore";

export type CompareEntry = {
  productHandle: string;
  productTitle: string;
  brand?: string;
  imageUrl?: string;
  unitPrice: number;
  currencyCode: string;
  merchandiseId?: string;
  material?: string;
  heightCm?: number;
  weightLb?: number;
  cupSize?: string;
  productType?: string;
  measurements?: Record<string, string>;
  warehouseRegions?: string[];
  stockStatus?: string;
  customAvailable?: boolean;
  addedAt: string;
};

export const MAX_COMPARE_ENTRIES = 4;
const STORAGE_KEY = "dollwow-product-compare-v1";
const UPDATED_EVENT = "dollwow:product-compare-updated";

function parse(raw: string | null): CompareEntry[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((entry) => entry && typeof entry.productHandle === "string" && typeof entry.productTitle === "string").slice(0, MAX_COMPARE_ENTRIES);
  } catch {
    return [];
  }
}

const store = createStorageStore<CompareEntry[]>(STORAGE_KEY, UPDATED_EVENT, parse, []);

export function useCompareEntries() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function readCompareEntries() {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(STORAGE_KEY));
}

export function writeCompareEntries(entries: CompareEntry[]) {
  if (typeof window === "undefined") return;
  const next = entries.slice(0, MAX_COMPARE_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: next }));
}

export function toggleCompareEntry(entries: CompareEntry[], entry: Omit<CompareEntry, "addedAt">) {
  const exists = entries.some((item) => item.productHandle === entry.productHandle);
  if (exists) return { entries: entries.filter((item) => item.productHandle !== entry.productHandle), added: false, full: false };
  if (entries.length >= MAX_COMPARE_ENTRIES) return { entries, added: false, full: true };
  return { entries: [...entries, { ...entry, addedAt: new Date().toISOString() }], added: true, full: false };
}
