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
    expect(product.title).toBe("Zarina 153cm G-Cup TPE Customizable Companion Doll");
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

  it("uses the actual product brand when collection brand metadata disagrees", () => {
    const product = toDollWowImportProduct({
      ...baseProduct,
      brand: "YL Dolls",
      brandSlug: "wm",
      title: "151cm/4ft11 E Cup TPE Sex Doll - Vera",
      specs: {
        heightCm: 151,
        weightLb: 70,
        cupSize: "E"
      }
    });

    expect(product.brand).toBe("YL Dolls");
    expect(product.handle).toMatch(/^yl-vera-151cm-e-cup-tpe-companion-doll-/);
  });

  it("does not turn N/A cup values into N-cup catalog copy", () => {
    const product = toDollWowImportProduct({
      ...baseProduct,
      title: "60cm/2ft NA-Cup TPE Companion Doll - Mark",
      specs: {
        heightCm: 60,
        weightLb: 33,
        cupSize: "N/A"
      }
    });

    expect(product.title).toBe("Mark 60cm TPE Customizable Companion Doll");
    expect(product.handle).not.toContain("n-cup");
  });

  it("canonicalizes Anglekiss source typos to Angelkiss", () => {
    const product = toDollWowImportProduct({
      ...baseProduct,
      brand: "Anglekiss Dolls",
      brandSlug: "anglekiss-dolls",
      handle: "anglekiss-dolls-heads",
      title: "Heads",
      sourceUrl: "https://www.rosemarydoll.com/product/heads/",
      sourceTitle: "Heads",
      sourceHandle: "heads",
      specs: {}
    });

    expect(product.brand).toBe("Angelkiss");
    expect(product.handle).toMatch(/^angelkiss-/);
    expect(product.handle).not.toMatch(/^anglekiss-/);
    expect(product.reviewFlags.legacyHandles).toEqual(expect.arrayContaining([expect.stringMatching(/^anglekiss-dolls-/)]));
  });

  it("blocks products scraped from Rosemary exclusive collections even when product copy is subtle", () => {
    const product = toDollWowImportProduct({
      ...baseProduct,
      title: "Anime Cosplay Silicone Sex Doll - Mizuno Luzmi",
      sourceCollectionUrl: "https://www.rosemarydoll.com/es/sex-doll-brands/exclusive/"
    });

    expect(product.excludedFromDollWow).toBe(true);
    expect(product.reviewFlags.exclusiveSignals.map((signal) => signal.type)).toContain("exclusive-source-collection");
  });

  it("does not block sitewide student discount menu copy as a product theme", () => {
    const product = toDollWowImportProduct({
      ...baseProduct,
      title: "175cm/5ft9 Male TPE Sex Doll - Jack",
      description: `${baseProduct.description} Workers, First Responders & Seniors Discounts NEW Student Discounts NEW RosemaryDoll Foundation`
    });

    expect(product.excludedFromDollWow).toBe(false);
    expect(product.reviewFlags.exclusiveSignals.map((signal) => signal.type)).not.toContain("restricted-school-theme");
  });
});
