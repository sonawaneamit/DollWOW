import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JinsanOctoberPdpPromotion } from "@/components/promotions/JinsanOctoberPromotion";
import { isJinsanOctoberActive, jinsanOctoberBrandForProduct, JINSAN_OCTOBER_OFFERS } from "@/lib/promotions/jinsanOctober2026";
import type { Product } from "@/types/product";

type PromoProduct = Pick<Product, "title" | "handle" | "vendor" | "productType" | "tags" | "extended">;
const clock = "2026-10-03T12:00:00Z";
const now = new Date(clock);
function product(brand = "Lusandy", overrides: Partial<PromoProduct> = {}): PromoProduct {
  return { title: "Adult companion doll", handle: "adult-companion-doll", vendor: "DollWow", productType: "Doll", tags: [], extended: { brand, material: brand === "Lusandy" ? "Silicone" : "TPE", heightCm: 165, stockStatus: "custom" }, ...overrides };
}

describe("Jinsan October factory banners", () => {
  it.each([
    ["2026-10-01T06:59:59.999Z", false],
    ["2026-10-01T07:00:00Z", true],
    ["2026-11-01T06:59:59.999Z", true],
    ["2026-11-01T07:00:00Z", false]
  ])("checks campaign boundary %s", (date, active) => {
    expect(isJinsanOctoberActive(new Date(date))).toBe(active);
  });
  it.each([["Lusandy", "lusandy"], ["WM Doll", "wm"], ["Irontech", null]])("matches %s independently", (brand, expected) => {
    expect(jinsanOctoberBrandForProduct(product(brand), now)).toBe(expected);
  });
  it.each(["torso", "hips", "head-only", "body-only", "anime"])("excludes %s", title => {
    expect(jinsanOctoberBrandForProduct(product("Lusandy", { title }), now)).toBeNull();
  });
  it("fails closed for stock, material, and WM height mismatches", () => {
    const base = product("WM Doll");
    for (const extended of [
      { ...base.extended, stockStatus: "ready_to_ship" as const },
      { ...base.extended, material: "Silicone" },
      { ...base.extended, heightCm: 140 },
      { ...base.extended, heightCm: undefined }
    ]) expect(jinsanOctoberBrandForProduct({ ...base, extended }, now)).toBeNull();
  });
  it("keeps Lusandy's eight promotional and six standard inclusions separate", () => {
    expect(JINSAN_OCTOBER_OFFERS.lusandy.included).toHaveLength(8);
    expect(JINSAN_OCTOBER_OFFERS.lusandy.standard).toHaveLength(6);
    expect(JINSAN_OCTOBER_OFFERS.lusandy.discounts).toHaveLength(0);
  });
  it("renders a collapsed accessible banner and discloses manual WM discount confirmation", () => {
    const markup = renderToStaticMarkup(createElement(JinsanOctoberPdpPromotion, { product: product("WM Doll"), promoClock: clock }));
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls="wm-october-2026-pdp-details"');
    expect(markup).toContain("not automatically applied");
    expect(markup).not.toContain("Super weight reduction");
  });
  it("renders nothing after expiry", () => {
    expect(renderToStaticMarkup(createElement(JinsanOctoberPdpPromotion, { product: product(), promoClock: "2026-11-02T12:00:00Z" }))).toBe("");
  });
});
