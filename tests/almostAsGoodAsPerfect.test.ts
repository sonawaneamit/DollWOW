import { describe, expect, it } from "vitest";
import {
  almostAsGoodAsPerfectNote,
  isAlmostAsGoodAsPerfect,
  shouldSkipWarehouseDeliveryDate
} from "@/lib/catalog/almostAsGoodAsPerfect";
import { collectionPresets, filterProducts } from "@/lib/catalog/filters";
import type { Product } from "@/types/product";

function product(partial: Partial<Product> & { id: string; tags: string[] }): Product {
  return {
    title: partial.title || "IDO 167cm F-Cup Wheat Silicone Doll — Almost as Good as Perfect (#5)",
    handle: partial.handle || "ido-167cm-f-cup-wheat-silicone-almost-as-good-as-perfect-5",
    vendor: "DollWow",
    productType: "Silicone doll",
    tags: partial.tags,
    images: [],
    variants: [],
    priceRange: { minVariantPrice: { amount: "1819.00", currencyCode: "USD" }, maxVariantPrice: { amount: "1819.00", currencyCode: "USD" } },
    extended: {
      brand: "IDO Doll",
      material: "Silicone",
      heightCm: 167,
      cupSize: "F-cup",
      stockStatus: "ready_to_ship",
      qcNote: "This doll is almost as good as perfect. It has visible repair marks on the foot and dents on the arm, but it is fully usable, which is why it is discounted.",
      ...(partial.extended || {})
    },
    ...partial
  } as Product;
}

describe("almost as good as perfect", () => {
  it("recognises the clearance tag and note", () => {
    const doll = product({ id: "a", tags: ["ido", "almost-as-good-as-perfect"] });
    expect(isAlmostAsGoodAsPerfect(doll)).toBe(true);
    expect(almostAsGoodAsPerfectNote(doll)).toMatch(/repair marks on the foot/i);
    expect(isAlmostAsGoodAsPerfect(product({ id: "b", tags: ["ido", "ready_to_ship"] }))).toBe(false);
  });

  it("filters the shop collection to tagged dolls only", () => {
    const clearance = product({ id: "clearance", tags: ["almost-as-good-as-perfect", "ido"] });
    const regular = product({ id: "regular", tags: ["ido", "ready_to_ship"], extended: { qcNote: undefined } as Product["extended"] });
    const filtered = filterProducts([clearance, regular], collectionPresets["almost-as-good-as-perfect"].filters);
    expect(filtered.map((item) => item.id)).toEqual(["clearance"]);
  });

  it("skips the 3-business-day date when the estimate is in weeks", () => {
    expect(shouldSkipWarehouseDeliveryDate("Est. 4–8 weeks by sea from China")).toBe(true);
    expect(shouldSkipWarehouseDeliveryDate("Est. 3 business days")).toBe(false);
  });

  it("does not appear in the ready-to-ship filter", () => {
    const clearance = product({
      id: "clearance",
      tags: ["almost-as-good-as-perfect", "ido"],
      extended: { stockStatus: "ready_to_ship" } as Product["extended"]
    });
    const regular = product({
      id: "regular",
      tags: ["ido", "ready_to_ship"],
      extended: { stockStatus: "ready_to_ship", qcNote: undefined } as Product["extended"]
    });
    const filtered = filterProducts([clearance, regular], { availability: "ready_to_ship" });
    expect(filtered.map((item) => item.id)).toEqual(["regular"]);
  });
});
