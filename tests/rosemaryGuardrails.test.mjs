import { describe, expect, it } from "vitest";
import {
  findRosemaryExclusiveSignals,
  toDollWowImportProduct
} from "../scripts/rosemary-guardrails.mjs";

const baseProduct = {
  source: "rosemarydoll",
  sourceUrl: "https://www.rosemarydoll.com/product/153cm-5ft-g-cup-tpe-sex-doll-zarina/",
  handle: "153cm-5ft-g-cup-tpe-sex-doll-zarina",
  title: "153cm/5ft G Cup TPE Sex Doll - Zarina",
  brand: "WM Dolls",
  brandSlug: "wm",
  description: "Brand: WM Dolls Height: 153 cm Weight: 70 lbs Bra Size: G Cup",
  price: 1599,
  currency: "USD",
  stockStatus: "custom",
  customAvailable: true,
  specs: {
    heightCm: 153,
    weightLb: 70,
    cupSize: "G"
  },
  optionGroups: []
};

describe("Rosemary import guardrails", () => {
  it("flags Rosemary-exclusive or likeness-restricted products", () => {
    const signals = findRosemaryExclusiveSignals({
      ...baseProduct,
      html: "<main>This Rosemary exclusive doll is only available to Rosemary customers.</main>"
    });

    expect(signals.map((signal) => signal.type)).toContain("rosemary-exclusive");
  });

  it("rewrites titles, handles, and descriptions for DollWow import artifacts", () => {
    const product = toDollWowImportProduct(baseProduct);

    expect(product.sourceTitle).toBe(baseProduct.title);
    expect(product.title).toBe("Zarina 153cm G-Cup TPE Companion Doll");
    expect(product.handle).toMatch(/^wm-zarina-153cm-g-cup-tpe-companion-doll-/);
    expect(product.description).toContain("prepared by DollWow");
    expect(product.description).not.toContain("Rosemary");
    expect(product.excludedFromDollWow).toBe(false);
  });

  it("marks exclusive products as excluded from DollWow outputs", () => {
    const product = toDollWowImportProduct({
      ...baseProduct,
      description: `${baseProduct.description} Rosemary exclusive doll.`
    });

    expect(product.excludedFromDollWow).toBe(true);
    expect(product.reviewFlags.exclusiveSignals.length).toBeGreaterThan(0);
  });
});
