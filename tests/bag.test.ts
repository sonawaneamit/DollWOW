import { describe, expect, it } from "vitest";
import {
  bagCurrency,
  bagItemCount,
  bagSubtotal,
  MAX_BAG_ITEMS,
  MAX_ITEM_QUANTITY,
  removeBagItem,
  updateBagItemQuantity,
  upsertBagItem,
  type BagItem
} from "@/lib/cart/bag";

function makeItem(overrides: Partial<BagItem> = {}): Omit<BagItem, "addedAt"> {
  return {
    merchandiseId: "gid://shopify/ProductVariant/1",
    productHandle: "doll-a",
    productTitle: "Doll A",
    unitPrice: 1999,
    currencyCode: "USD",
    quantity: 1,
    ...overrides
  };
}

describe("bag helpers", () => {
  it("adds a new item and stamps addedAt", () => {
    const items = upsertBagItem([], makeItem());
    expect(items).toHaveLength(1);
    expect(items[0].merchandiseId).toBe("gid://shopify/ProductVariant/1");
    expect(items[0].addedAt).toBeTruthy();
  });

  it("merges quantity when the same variant is added again", () => {
    const first = upsertBagItem([], makeItem({ quantity: 1 }));
    const second = upsertBagItem(first, makeItem({ quantity: 2 }));
    expect(second).toHaveLength(1);
    expect(second[0].quantity).toBe(3);
  });

  it("clamps quantity to the per-item maximum", () => {
    const items = upsertBagItem([], makeItem({ quantity: 99 }));
    expect(items[0].quantity).toBe(MAX_ITEM_QUANTITY);

    const merged = upsertBagItem(items, makeItem({ quantity: 8 }));
    expect(merged[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });

  it("keeps distinct variants as separate lines and caps the bag", () => {
    let items: BagItem[] = [];
    for (let index = 0; index < MAX_BAG_ITEMS + 3; index += 1) {
      items = upsertBagItem(items, makeItem({ merchandiseId: `gid://shopify/ProductVariant/${index}` }));
    }
    expect(items).toHaveLength(MAX_BAG_ITEMS);
    // Oldest entries are dropped first.
    expect(items.some((item) => item.merchandiseId === "gid://shopify/ProductVariant/0")).toBe(false);
    expect(items.some((item) => item.merchandiseId === `gid://shopify/ProductVariant/${MAX_BAG_ITEMS + 2}`)).toBe(true);
  });

  it("updates quantity and removes the line at zero", () => {
    const items = upsertBagItem([], makeItem({ quantity: 2 }));
    expect(updateBagItemQuantity(items, "gid://shopify/ProductVariant/1", 5)[0].quantity).toBe(5);
    expect(updateBagItemQuantity(items, "gid://shopify/ProductVariant/1", 0)).toHaveLength(0);
  });

  it("removes items and computes count, subtotal, and currency", () => {
    let items: BagItem[] = [];
    items = upsertBagItem(items, makeItem({ quantity: 1, unitPrice: 1299.99 }));
    items = upsertBagItem(items, makeItem({ merchandiseId: "gid://shopify/ProductVariant/2", quantity: 2, unitPrice: 49.5 }));

    expect(bagItemCount(items)).toBe(3);
    expect(bagSubtotal(items)).toBe(1398.99);
    expect(bagCurrency(items)).toBe("USD");
    expect(bagCurrency([], "EUR")).toBe("EUR");

    expect(removeBagItem(items, "gid://shopify/ProductVariant/2")).toHaveLength(1);
  });
});
