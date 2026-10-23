import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { applyReviewedProductRepairs } from "@/lib/catalog/reviewedProductRepairs";
import { productImageSources, withProtectedProductImages } from "@/lib/catalog/productImage";
import { productReviewedPdpHeading } from "@/lib/catalog/reviewedGalleryLooks";

const removed = { url: "https://cdn.shopify.com/s/files/1/0960/7531/7432/files/161cm5ft3-H-cup-Silicone-Head-Sex-Doll-_E2_80_93-Amy-12-1.jpg?v=1780685041", altText: "Amy" };
const next = { url: "https://cdn.shopify.com/s/files/1/0960/7531/7432/files/161cm5ft3-H-cup-Silicone-Head-Sex-Doll-_E2_80_93-Amy-1-2.jpg?v=1780685041", altText: "Amy" };
const amy = { ...sampleProducts[0], id: "gid://shopify/Product/10433809187000", handle: "starpery-amy-161cm-h-cup-silicone-head-companion-doll-75l94", featuredImage: removed, images: [removed, next], media: [{ type: "image" as const, image: removed, altText: "Amy" }, { type: "image" as const, image: next, altText: "Amy" }] };

describe("individually reviewed catalog repairs", () => {
  it("removes only Amy's rejected image from every source and makes image one first", () => {
    const before = JSON.stringify(amy);
    const repaired = applyReviewedProductRepairs(amy);
    expect(repaired.featuredImage).toEqual(next);
    expect(repaired.images).toEqual([next]);
    expect(productImageSources(repaired)).toEqual([next]);
    expect(JSON.stringify(repaired)).not.toContain(removed.url);
    expect(withProtectedProductImages(repaired).featuredImage?.url).toContain("reviewed-gallery-20261021");
    expect(JSON.stringify(amy)).toBe(before);
    expect(repaired.variants).toBe(amy.variants);
    expect(repaired.extended).toBe(amy.extended);
  });
  it("also protects featured-image-only list records without changing unrelated galleries", () => {
    const thin = { ...amy, images: [], media: [] };
    expect(applyReviewedProductRepairs(thin).featuredImage?.url).toBe(next.url);
    const other = { ...amy, id: "another-record" };
    expect(applyReviewedProductRepairs(other)).toBe(other);
    const thera = { ...amy, id: "thera", handle: "dolls-castle-thera-pulitzer-156cm-d-cup-silicone-companion-doll-jkaf6" };
    expect(applyReviewedProductRepairs(thera)).toBe(thera);
    const empty = { ...amy, featuredImage: null, images: [], media: [] };
    expect(applyReviewedProductRepairs(empty)).toBe(empty);
  });
  it("repairs the verified Irontech body without asserting a fitted ROS head or changing commerce", () => {
    const raw = { ...sampleProducts[0], id: "gid://shopify/Product/10518047129784", handle: "irontech-lifelike-and-premium-quality-companion-doll-1chy9", title: "Lifelike & Premium Quality Customizable Companion Doll", featuredImage: { url: "https://cdn.shopify.com/s/files/1/0960/7531/7432/files/166cm5ft5-C-cup-Silicone-Sex-Doll-_E2_80_93-Ivy-6.jpg?v=1786295888", altText: "Original" }, extended: { ...sampleProducts[0].extended, material: "Adult doll", heightCm: 0, headModel: undefined } };
    const fixed = applyReviewedProductRepairs(raw);
    expect(fixed.extended).toMatchObject({ heightCm: 166, cupSize: "C", material: "silicone", weightLb: 97, measurements: { Waist: "67 cm", Hip: "97 cm" } });
    expect(fixed.title).not.toContain("ROS");
    expect(fixed.extended.headModel).toBeUndefined();
    expect(fixed.variants).toBe(raw.variants);
    expect(fixed.priceRange).toBe(raw.priceRange);
    expect(fixed.extended.customizationGroups).toBe(raw.extended.customizationGroups);
    expect(applyReviewedProductRepairs({ ...raw, featuredImage: next })).toMatchObject({ title: raw.title });
    expect(applyReviewedProductRepairs({ ...raw, extended: { ...raw.extended, heightCm: 180 } })).toMatchObject({ title: raw.title });
  });
  it("puts the distinct Vera offer wording only on the actual supported $699 choice", () => {
    const vera = { ...sampleProducts[0], id: "gid://shopify/Product/10433890779320", handle: "yl-vera-151cm-e-cup-tpe-companion-doll-1qghg", title: "YL Vera 151cm E-Cup TPE Companion Doll", extended: { ...sampleProducts[0].extended, brand: "YL Dolls", displayName: "Vera", customizationGroups: [{ id: "upgraded-flight-case-add-on", label: "Flight Case", required: false, selectionMode: "single" as const, display: "compact" as const, options: [{ id: "case", label: "Flight Case", priceDelta: 699 }] }] } };
    expect(productReviewedPdpHeading(vera)).toContain("Vera: $699 Flight Case Option");
    expect(productReviewedPdpHeading({ ...vera, handle: "wm-vera-151cm-e-cup-tpe-companion-doll-1qghg" })).not.toContain("$699");
    expect(productReviewedPdpHeading({ ...vera, extended: { ...vera.extended, customizationGroups: [] } })).not.toContain("$699");
  });
});
