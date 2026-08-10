"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { readCompareEntries, toggleCompareEntry, useCompareEntries, writeCompareEntries, type CompareEntry } from "@/lib/compare/products";

type ComparisonContextValue = {
  entries: CompareEntry[];
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggle: (entry: Omit<CompareEntry, "addedAt">) => { added: boolean; full: boolean };
  remove: (handle: string) => void;
  clear: () => void;
};

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function useComparison() {
  const value = useContext(ComparisonContext);
  if (!value) throw new Error("useComparison must be used inside ComparisonProvider");
  return value;
}

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const entries = useCompareEntries();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggle = useCallback((entry: Omit<CompareEntry, "addedAt">) => {
    const result = toggleCompareEntry(readCompareEntries(), entry);
    writeCompareEntries(result.entries);
    if (result.added || result.full) setDrawerOpen(true);
    return { added: result.added, full: result.full };
  }, []);
  const remove = useCallback((handle: string) => writeCompareEntries(readCompareEntries().filter((entry) => entry.productHandle !== handle)), []);
  const clear = useCallback(() => writeCompareEntries([]), []);
  const value = useMemo(() => ({ entries, drawerOpen, openDrawer, closeDrawer, toggle, remove, clear }), [entries, drawerOpen, openDrawer, closeDrawer, toggle, remove, clear]);
  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}
