import { describe, expect, it } from "vitest";
import {
  ALMOST_AS_GOOD_AS_PERFECT_AVAILABILITY,
  ALMOST_AS_GOOD_AS_PERFECT_CART_SHIPPING,
  ALMOST_AS_GOOD_AS_PERFECT_PANEL_BODY,
  ALMOST_AS_GOOD_AS_PERFECT_PANEL_HEADING,
  almostAsGoodAsPerfectBuyBoxDetail,
  almostAsGoodAsPerfectNote,
  cartItemShippingLabel,
  isAlmostAsGoodAsPerfect,
  isAlmostAsGoodAsPerfectItem,
  shouldSkipWarehouseDeliveryDate
} from "@/lib/catalog/almostAsGoodAsPerfect";
import { collectionPresets, filterProducts } from "@/lib/catalog/filters";
import { buildProductFaqStructuredData, buildProductStructuredData, pdpFaqItems } from "@/lib/catalog/pdpSeo";
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

  it("uses customer-facing China sea shipping copy for clearance units only", () => {
    const clearance = product({ id: "clearance", tags: ["almost-as-good-as-perfect", "ido"] });

    expect(ALMOST_AS_GOOD_AS_PERFECT_AVAILABILITY).toBe("Ships in 4–8 weeks by sea from China");
    expect(ALMOST_AS_GOOD_AS_PERFECT_CART_SHIPPING).toBe("Ships in 4–8 weeks");
    expect(ALMOST_AS_GOOD_AS_PERFECT_PANEL_HEADING).toMatch(/one-of-a-kind/i);
    expect(ALMOST_AS_GOOD_AS_PERFECT_PANEL_HEADING).not.toMatch(/warehouse doll/i);
    expect(ALMOST_AS_GOOD_AS_PERFECT_PANEL_BODY).toMatch(/small cosmetic mark/i);
    expect(ALMOST_AS_GOOD_AS_PERFECT_PANEL_BODY).toMatch(/any IDO head/i);
    expect(ALMOST_AS_GOOD_AS_PERFECT_PANEL_BODY).not.toMatch(/Stock record|Factory-order colors/i);
    expect(almostAsGoodAsPerfectBuyBoxDetail("Est. 4–8 weeks by sea from China")).toMatch(/any IDO head/i);
    expect(almostAsGoodAsPerfectBuyBoxDetail("Est. 4–8 weeks by sea from China")).not.toMatch(/Factory customization options do not apply/i);

    expect(isAlmostAsGoodAsPerfectItem({ productHandle: clearance.handle, productTitle: clearance.title, readyToShip: true })).toBe(true);
    expect(isAlmostAsGoodAsPerfectItem({ productHandle: "fanreal-gina-ready-to-ship", productTitle: "Fanreal Gina", readyToShip: true })).toBe(false);

    expect(cartItemShippingLabel({ readyToShip: true, productHandle: clearance.handle, productTitle: clearance.title })).toBe("Ships in 4–8 weeks");
    expect(cartItemShippingLabel({ readyToShip: true, productHandle: "fanreal-gina-us-warehouse", productTitle: "Fanreal Gina" })).toBe("Ready to ship");
    expect(cartItemShippingLabel({ readyToShip: false, productHandle: "custom-factory-doll", productTitle: "Custom doll" })).toBe("Reviewed before production");
    expect(
      cartItemShippingLabel(
        { readyToShip: true, productHandle: "fanreal-gina-us-warehouse", productTitle: "Fanreal Gina" },
        "Ready to ship · timing confirmed before checkout",
        "Made to order · reviewed by our team first"
      )
    ).toBe("Ready to ship · timing confirmed before checkout");
  });

  it("keeps JSON-LD from calling clearance units ready to ship", () => {
    const clearance = product({
      id: "clearance",
      tags: ["almost-as-good-as-perfect", "ido"],
      extended: {
        stockStatus: "ready_to_ship",
        deliveryEstimate: "Est. 4–8 weeks by sea from China",
        warehouseCountry: "China",
        stockLastCheckedAt: "2026-11-23",
        customAvailable: false
      } as Product["extended"]
    });
    const regular = product({
      id: "regular",
      tags: ["ido", "ready_to_ship"],
      handle: "ido-regular-us-warehouse",
      title: "IDO Regular US Warehouse Doll",
      extended: { stockStatus: "ready_to_ship", customAvailable: false, qcNote: undefined } as Product["extended"]
    });

    const clearanceSchema = buildProductStructuredData(clearance);
    const regularSchema = buildProductStructuredData(regular);
    expect(clearanceSchema.additionalProperty).toContainEqual(expect.objectContaining({ name: "Stock status", value: ALMOST_AS_GOOD_AS_PERFECT_AVAILABILITY }));
    expect(clearanceSchema.additionalProperty).not.toContainEqual(expect.objectContaining({ name: "Stock status", value: "Ready to ship" }));
    expect(clearanceSchema.additionalProperty).not.toContainEqual(expect.objectContaining({ name: "Stock last checked" }));
    expect(clearanceSchema.offers.availability).toBe("https://schema.org/LimitedAvailability");
    expect(String(clearanceSchema.keywords)).not.toMatch(/ready to ship/i);
    expect(regularSchema.additionalProperty).toContainEqual(expect.objectContaining({ name: "Stock status", value: "Ready to ship" }));
    expect(regularSchema.offers.availability).toBe("https://schema.org/InStock");

    const faqs = pdpFaqItems(clearance);
    expect(faqs.map((item) => item.answer).join(" ")).toMatch(/4–8 weeks by sea/i);
    expect(faqs.map((item) => item.answer).join(" ")).not.toMatch(/Warehouse dolls usually move faster/i);
    expect(faqs.map((item) => item.answer).join(" ")).not.toMatch(/listed as ready to ship/i);
    expect(buildProductFaqStructuredData(clearance).mainEntity.find((item) => item.name === "Do I get factory approval photos before shipment?")?.acceptedAnswer.text).not.toMatch(/Warehouse dolls usually move faster/i);
    expect(pdpFaqItems(regular).some((item) => /Warehouse dolls usually move faster/i.test(item.answer))).toBe(true);
  });
});
