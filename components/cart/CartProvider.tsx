"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  bagItemCount,
  bagSubtotal,
  bagCurrency,
  readBag,
  removeBagItem,
  updateBagItemQuantity,
  upsertBagItem,
  useBag,
  writeBag,
  type BagItem
} from "@/lib/cart/bag";
import type { UpsellSnapshot } from "@/lib/cart/upsell";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";

type AddItemInput = Omit<BagItem, "addedAt" | "quantity"> & { quantity?: number };

type CartContextValue = {
  items: BagItem[];
  count: number;
  subtotal: number;
  currencyCode: string;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: AddItemInput, options?: { openDrawer?: boolean }) => void;
  updateQuantity: (merchandiseId: string, quantity: number) => void;
  removeItem: (merchandiseId: string) => void;
  clear: () => void;
  checkout: () => Promise<void>;
  checkoutPending: boolean;
  checkoutError: string;
  upsells: UpsellSnapshot[];
  loadUpsells: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useBag();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [upsells, setUpsells] = useState<UpsellSnapshot[]>([]);
  const upsellsRequestedRef = useRef(false);

  const loadUpsells = useCallback(() => {
    if (upsellsRequestedRef.current) return;
    upsellsRequestedRef.current = true;
    fetch("/api/cart/upsells")
      .then((response) => (response.ok ? response.json() : { upsells: [] }))
      .then((payload: { upsells?: UpsellSnapshot[] }) => setUpsells(payload.upsells ?? []))
      .catch(() => setUpsells([]));
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    loadUpsells();
  }, [loadUpsells]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addItem = useCallback(
    (item: AddItemInput, options?: { openDrawer?: boolean }) => {
      const next = upsertBagItem(readBag(), { ...item, quantity: item.quantity ?? 1 });
      writeBag(next);
      trackEvent(analyticsEvents.addToBag, {
        value: item.unitPrice * (item.quantity ?? 1),
        currency: item.currencyCode,
        items: [{
          item_id: item.merchandiseId,
          item_name: item.productDisplayName || item.productTitle,
          item_brand: item.brand,
          price: item.unitPrice,
          quantity: item.quantity ?? 1
        }]
      });
      if (options?.openDrawer !== false) openDrawer();
    },
    [openDrawer]
  );

  const updateQuantity = useCallback((merchandiseId: string, quantity: number) => {
    writeBag(updateBagItemQuantity(readBag(), merchandiseId, quantity));
  }, []);

  const removeItem = useCallback((merchandiseId: string) => {
    writeBag(removeBagItem(readBag(), merchandiseId));
  }, []);

  const clear = useCallback(() => writeBag([]), []);

  const checkout = useCallback(async () => {
    const bag = readBag();
    if (!bag.length || checkoutPending) return;
    setCheckoutPending(true);
    setCheckoutError("");
    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: bag.map((item) => ({
            merchandiseId: item.merchandiseId,
            quantity: item.quantity,
            attributes: item.attributes ?? [],
            customizationCharge: item.customizationCharge
          }))
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setCheckoutError(payload.error ?? "Could not start checkout.");
        return;
      }
      const subtotal = bagSubtotal(bag);
      trackEvent(analyticsEvents.beginCheckout, {
        value: subtotal,
        currency: bagCurrency(bag),
        items: bag.map((item) => ({
          item_id: item.merchandiseId,
          item_name: item.productDisplayName || item.productTitle,
          item_brand: item.brand,
          price: item.unitPrice,
          quantity: item.quantity
        }))
      });
      window.location.assign(normalizeCheckoutUrl(payload.checkoutUrl));
    } catch {
      setCheckoutError("Could not start checkout. Please try again.");
    } finally {
      setCheckoutPending(false);
    }
  }, [checkoutPending]);

  const value = useMemo<CartContextValue>(() => {
    const count = bagItemCount(items);
    return {
      items,
      count,
      subtotal: bagSubtotal(items),
      currencyCode: bagCurrency(items),
      drawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      checkout,
      checkoutPending,
      checkoutError,
      upsells: upsells.filter((upsell) => !items.some((item) => item.merchandiseId === upsell.merchandiseId)),
      loadUpsells
    };
  }, [items, drawerOpen, openDrawer, closeDrawer, addItem, updateQuantity, removeItem, clear, checkout, checkoutPending, checkoutError, upsells, loadUpsells]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
