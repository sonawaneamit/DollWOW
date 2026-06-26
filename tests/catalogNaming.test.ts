import { describe, expect, it } from "vitest";
import { buildDollWowCatalogName, normalizeCup, normalizeMaterial, normalizePublicTitleForAudit, productDisplayName, productDisplayNameForUi, productPdpTitle, productPublicTitle, productSeoTitle } from "@/lib/catalog/naming";
import { sampleProducts } from "@/lib/data/sample-products";

describe("DollWow catalog naming", () => {
  it("builds factual DollWow-owned public names", () => {
    const name = buildDollWowCatalogName({
      brand: "WM Dolls",
      modelName: "Anae",
      heightCm: 156,
      cupSize: "H-Cup",
      material: "TPE",
      customAvailable: true
    });

    expect(name.title).toBe("Anae 156cm H-Cup TPE Customizable Companion Doll");
    expect(name.handleBase).toBe("anae-156cm-h-cup-tpe-customizable-companion-doll");
    expect(name.facts).toEqual(["156cm", "H-Cup", "TPE", "Customizable", "Companion Doll"]);
  });

  it("does not turn N/A cup values into N-Cup", () => {
    const name = buildDollWowCatalogName({
      brand: "Tantaly",
      modelName: "Mark",
      heightCm: 60,
      cupSize: "N/A",
      material: "TPE",
      customAvailable: true
    });

    expect(name.title).toBe("Mark 60cm TPE Customizable Companion Doll");
    expect(name.handleBase).not.toContain("n-cup");
    expect(normalizeCup("NA-Cup")).toBe("");
    expect(normalizeCup("N/A")).toBe("");
  });

  it("normalizes materials and public titles for duplicate audits", () => {
    expect(normalizeMaterial("Custom silicone head build")).toBe("Silicone Head");
    expect(normalizePublicTitleForAudit("Anae 156cm H-Cup TPE Customizable Companion Doll")).toBe("anae 156cm h cup tpe");
  });

  it("does not repeat head in silicone-head public titles", () => {
    const title = productPublicTitle({
      ...sampleProducts[0],
      title: "Adele 153cm E-Cup Silicone Head Customizable Companion Doll",
      productType: "Custom silicone-head doll",
      tags: ["custom", "silicone-head", "starpery"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "Starpery",
        material: "Silicone Head",
        heightCm: 153,
        cupSize: "E",
        stockStatus: "custom"
      }
    });

    expect(title).toBe("Starpery Adele 153cm E-Cup Silicone Head");
    expect(title).not.toContain("Head Head");
  });

  it("drops awkward two-word source names when a clear series already exists", () => {
    const title = productPublicTitle({
      ...sampleProducts[0],
      title: "160cm/5ft3 J-cup Silicone Sex Doll - Boris Dunlop (ZELEX SLE 3.0)",
      handle: "160cm-5ft3-j-cup-silicone-sex-doll-boris-dunlop-zelex-sle-3-0",
      productType: "Ready to ship silicone doll",
      vendor: "Zelex Dolls",
      tags: ["ready_to_ship", "zelex"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "Zelex Dolls",
        material: "Silicone",
        heightCm: 160,
        cupSize: "J",
        stockStatus: "ready_to_ship"
      }
    });

    expect(title).toBe("Zelex SLE 3.0 160cm J-Cup Silicone");
    expect(title).not.toContain("Boris Dunlop");
  });

  it("does not double-prefix an already branded public title", () => {
    const title = productPublicTitle({
      ...sampleProducts[0],
      title: "Starpery Adele 153cm E-Cup Silicone Head Customizable Companion Doll",
      handle: "starpery-adele-153cm-e-cup-silicone-head-companion-doll-1dn4l",
      productType: "Custom silicone-head doll",
      vendor: "Starpery Dolls",
      tags: ["custom", "silicone-head", "starpery"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "Starpery Dolls",
        material: "Silicone Head",
        heightCm: 153,
        cupSize: "E",
        stockStatus: "custom",
        customAvailable: true
      }
    });

    expect(title).toBe("Starpery Adele 153cm E-Cup Silicone Head");
    expect(title).not.toContain("Starpery Starpery");
  });

  it("derives a short display name for support-friendly references", () => {
    const product = {
      ...sampleProducts[0],
      title: "160cm/5ft3 J-cup Silicone Sex Doll – Boris Dunlop (ZELEX SLE 3.0)",
      handle: "160cm-5ft3-j-cup-silicone-sex-doll-boris-dunlop",
      vendor: "Zelex Dolls",
      extended: {
        ...sampleProducts[0].extended,
        brand: "Zelex Dolls",
        sourceTitle: "160cm/5ft3 J-cup Silicone Sex Doll – Boris Dunlop (ZELEX SLE 3.0)",
        sourceHandle: "160cm-5ft3-j-cup-silicone-sex-doll-boris-dunlop"
      }
    };

    expect(productDisplayName(product)).toBe("SLE 3.0");
  });

  it("does not repeat a head reference already present in the display name", () => {
    const title = productPublicTitle({
      ...sampleProducts[0],
      title: "165cm/5ft5 D-cup Silicone Head Sex Doll - #218",
      handle: "6ye-head-218-165cm-d-cup-silicone-head-companion-doll-10x9p",
      productType: "Custom silicone-head doll",
      vendor: "6YE Dolls",
      tags: ["custom", "silicone-head", "6ye"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "6YE Dolls",
        material: "Silicone Head",
        heightCm: 165,
        cupSize: "D",
        customAvailable: true,
        stockStatus: "custom",
        headModel: "head-218",
        displayName: "Head 218"
      }
    });

    expect(title).toBe("6YE 165cm D-Cup Silicone Head");
    expect(title).not.toContain("Head 218 Head 218");
  });

  it("keeps a fuller SEO title available for search-friendly phrasing", () => {
    const title = productSeoTitle({
      ...sampleProducts[0],
      title: "165cm/5ft5 D-cup Silicone Head Sex Doll - #218",
      handle: "6ye-head-218-165cm-d-cup-silicone-head-companion-doll-10x9p",
      productType: "Custom silicone-head doll",
      vendor: "6YE Dolls",
      tags: ["custom", "silicone-head", "6ye"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "6YE Dolls",
        material: "Silicone Head",
        heightCm: 165,
        cupSize: "D",
        customAvailable: true,
        stockStatus: "custom",
        headModel: "head-218",
        displayName: "Head 218"
      }
    });

    expect(title).toBe("6YE Head 218 165cm D-Cup Silicone Head Customizable Companion Doll");
  });

  it("builds a cleaner PDP header title when the name is shown separately", () => {
    const title = productPdpTitle({
      ...sampleProducts[0],
      title: "165cm/5ft5 D-cup Silicone Head Sex Doll - #218",
      handle: "6ye-head-218-165cm-d-cup-silicone-head-companion-doll-10x9p",
      productType: "Custom silicone-head doll",
      vendor: "6YE Dolls",
      tags: ["custom", "silicone-head", "6ye"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "6YE Dolls",
        material: "Silicone Head",
        heightCm: 165,
        cupSize: "D",
        customAvailable: true,
        stockStatus: "custom",
        headModel: "head-218",
        displayName: "Head 218"
      }
    });

    expect(title).toBe("165cm D-Cup Silicone Head Customizable Companion Doll");
  });

  it("hides generic reference-style names from the PDP name line and public title", () => {
    const product = {
      ...sampleProducts[0],
      title: "165cm/5ft5 D-cup Silicone Head Sex Doll - #218",
      handle: "6ye-head-218-165cm-d-cup-silicone-head-companion-doll-10x9p",
      productType: "Custom silicone-head doll",
      vendor: "6YE Dolls",
      tags: ["custom", "silicone-head", "6ye"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "6YE Dolls",
        material: "Silicone Head",
        heightCm: 165,
        cupSize: "D",
        customAvailable: true,
        stockStatus: "custom",
        headModel: "head-218",
        displayName: "Head 218"
      }
    };

    expect(productDisplayNameForUi(product)).toBe("");
    expect(productPublicTitle(product)).toBe("6YE 165cm D-Cup Silicone Head");
  });

  it("recovers a human display name from the public title when the storefront metafield is unavailable", () => {
    const product = {
      ...sampleProducts[0],
      title: "6YE Ella Grace 165cm D-Cup Silicone Head",
      handle: "6ye-head-218-165cm-d-cup-silicone-head-companion-doll-10x9p",
      productType: "Custom silicone-head doll",
      vendor: "6YE Dolls",
      tags: ["custom", "silicone-head", "6ye"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "6YE Dolls",
        material: "Silicone Head",
        heightCm: 165,
        cupSize: "D",
        customAvailable: true,
        stockStatus: "custom",
        headModel: "head-218",
        displayName: ""
      }
    };

    expect(productDisplayName(product)).toBe("Ella Grace");
    expect(productDisplayNameForUi(product)).toBe("Ella Grace");
    expect(productPdpTitle(product)).toBe("165cm D-Cup Silicone Head Customizable Companion Doll");
    expect(productSeoTitle(product)).toBe("6YE Ella Grace 165cm D-Cup Silicone Head 218 Customizable Companion Doll");
  });
});
