import { describe, expect, it } from "vitest";
import { MAX_COMPARE_ENTRIES, toggleCompareEntry, type CompareEntry } from "@/lib/compare/products";

function entry(handle: string): Omit<CompareEntry, "addedAt"> {
  return { productHandle: handle, productTitle: `Doll ${handle}`, unitPrice: 1000, currencyCode: "USD" };
}

describe("product comparison shortlist", () => {
  it("adds and removes a product", () => {
    const added = toggleCompareEntry([], entry("one"));
    expect(added.added).toBe(true);
    expect(added.entries).toHaveLength(1);
    const removed = toggleCompareEntry(added.entries, entry("one"));
    expect(removed.added).toBe(false);
    expect(removed.entries).toEqual([]);
  });

  it("caps comparisons at four products", () => {
    const existing = Array.from({ length: MAX_COMPARE_ENTRIES }, (_, index) => ({ ...entry(String(index)), addedAt: new Date().toISOString() }));
    const result = toggleCompareEntry(existing, entry("overflow"));
    expect(result.full).toBe(true);
    expect(result.entries).toEqual(existing);
  });
});
