import { describe, expect, it } from "vitest";
import { catalogPageFromValue, paginateCatalog } from "@/lib/catalog/pagination";

describe("catalog pagination", () => {
  it("limits a large catalog to predictable pages", () => {
    const products = Array.from({ length: 600 }, (_, index) => index + 1);
    const result = paginateCatalog(products, 2);

    expect(result.items).toHaveLength(36);
    expect(result.items[0]).toBe(37);
    expect(result.items.at(-1)).toBe(72);
    expect(result.totalPages).toBe(17);
    expect(result.startItem).toBe(37);
    expect(result.endItem).toBe(72);
  });

  it("normalizes invalid and out-of-range pages", () => {
    expect(catalogPageFromValue("nope")).toBe(1);
    expect(catalogPageFromValue("0")).toBe(1);
    expect(paginateCatalog([1, 2, 3], 99).page).toBe(1);
  });
});
