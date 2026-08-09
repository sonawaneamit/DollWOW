import { describe, expect, it } from "vitest";
import { isInWishlist, MAX_WISHLIST_ENTRIES, toggleWishlistEntry, type WishlistEntry } from "@/lib/cart/wishlist";

function makeEntry(handle: string): Omit<WishlistEntry, "savedAt"> {
  return {
    productHandle: handle,
    productTitle: `Doll ${handle}`,
    unitPrice: 1999,
    currencyCode: "USD"
  };
}

describe("wishlist helpers", () => {
  it("saves a new entry, newest first", () => {
    const first = toggleWishlistEntry([], makeEntry("doll-a"));
    expect(first.saved).toBe(true);
    expect(first.items).toHaveLength(1);
    expect(first.items[0].savedAt).toBeTruthy();

    const second = toggleWishlistEntry(first.items, makeEntry("doll-b"));
    expect(second.items[0].productHandle).toBe("doll-b");
    expect(isInWishlist(second.items, "doll-a")).toBe(true);
    expect(isInWishlist(second.items, "doll-b")).toBe(true);
  });

  it("removes an existing entry on second toggle", () => {
    const added = toggleWishlistEntry([], makeEntry("doll-a"));
    const removed = toggleWishlistEntry(added.items, makeEntry("doll-a"));
    expect(removed.saved).toBe(false);
    expect(removed.items).toHaveLength(0);
  });

  it("caps the list at the maximum, keeping the newest", () => {
    let items: WishlistEntry[] = [];
    for (let index = 0; index < MAX_WISHLIST_ENTRIES + 5; index += 1) {
      items = toggleWishlistEntry(items, makeEntry(`doll-${index}`)).items;
    }
    expect(items).toHaveLength(MAX_WISHLIST_ENTRIES);
    expect(items[0].productHandle).toBe(`doll-${MAX_WISHLIST_ENTRIES + 4}`);
    expect(isInWishlist(items, "doll-0")).toBe(false);
  });

  it("keeps a provided savedAt timestamp", () => {
    const result = toggleWishlistEntry([], { ...makeEntry("doll-a"), savedAt: "2026-01-01T00:00:00.000Z" });
    expect(result.items[0].savedAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
