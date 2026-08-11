import { describe, expect, it } from "vitest";
import { collectionPresets, filterProducts } from "@/lib/catalog/filters";
import { sampleProducts } from "@/lib/data/sample-products";

describe("catalog filters", () => {
  it("trusts the canonical product brand before noisy imported tags", () => {
    const irontechWithStrayWmTag = {
      ...sampleProducts[0],
      id: "irontech-with-wm-tag",
      handle: "wm-alessia-154cm-i-cup-tpe-companion-doll-1ymco",
      title: "Irontech Alessia 154cm I-Cup TPE Companion Doll",
      vendor: "DollWow",
      tags: ["wm", "wm-dolls", "irontech", "irontech-doll", "tpe"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "Irontech Dolls"
      }
    };
    const wmProduct = {
      ...sampleProducts[0],
      id: "real-wm",
      handle: "wm-anae-156cm-h-cup-tpe-companion-doll-17j0e",
      title: "WM Anae 156cm H-Cup TPE Companion Doll",
      vendor: "DollWow",
      tags: ["wm", "wm-dolls", "tpe"],
      extended: {
        ...sampleProducts[0].extended,
        brand: "WM Dolls"
      }
    };

    expect(filterProducts([irontechWithStrayWmTag, wmProduct], { brand: "wm" }).map((product) => product.id)).toEqual(["real-wm"]);
  });

  it("keeps full silicone, TPE, and hybrid material results distinct", () => {
    const fullSilicone = {
      ...sampleProducts[0],
      id: "full-silicone",
      title: "Full Silicone Test Doll",
      productType: "Custom Silicone doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "Silicone" }
    };
    const tpe = {
      ...sampleProducts[0],
      id: "tpe",
      title: "TPE Test Doll",
      productType: "Custom TPE doll",
      tags: ["tpe", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "TPE" }
    };
    const hybrid = {
      ...sampleProducts[0],
      id: "hybrid",
      title: "Hybrid Test Doll",
      productType: "Custom Hybrid doll",
      tags: ["hybrid", "silicone-head", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "Hybrid" }
    };
    const hybridWithIncompleteTags = {
      ...sampleProducts[0],
      id: "hybrid-incomplete-tags",
      title: "Sienna Ray 165cm Silicone Head Doll",
      productType: "Custom doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "Silicone" }
    };

    const products = [fullSilicone, tpe, hybrid, hybridWithIncompleteTags];

    expect(filterProducts(products, { material: "silicone" }).map((product) => product.id)).toEqual(["full-silicone"]);
    expect(filterProducts(products, { material: "tpe" }).map((product) => product.id)).toEqual(["tpe"]);
    expect(filterProducts(products, { material: "hybrid" }).map((product) => product.id)).toEqual(["hybrid", "hybrid-incomplete-tags"]);
  });

  it("separates full dolls, torsos, and hips", () => {
    const fullDoll = { ...sampleProducts[0], id: "full", productType: "Custom TPE doll", tags: ["tpe", "full-doll"] };
    const torso = { ...sampleProducts[0], id: "torso", productType: "Custom TPE torso doll", tags: ["tpe", "torso"] };
    const hips = { ...sampleProducts[0], id: "hips", productType: "Custom Silicone hips", tags: ["silicone", "hips"] };

    expect(filterProducts([fullDoll, torso, hips], { productForm: "full-doll" }).map((product) => product.id)).toEqual(["full"]);
    expect(filterProducts([fullDoll, torso, hips], { productForm: "torso" }).map((product) => product.id)).toEqual(["torso"]);
    expect(filterProducts([fullDoll, torso, hips], { productForm: "hips" }).map((product) => product.id)).toEqual(["hips"]);
  });

  it("keeps the TPE collection focused on full dolls", () => {
    const fullDoll = { ...sampleProducts[0], id: "full-tpe", productType: "Custom TPE doll", tags: ["tpe", "full-doll"] };
    const torso = { ...sampleProducts[0], id: "tpe-torso", productType: "Custom TPE torso doll", tags: ["tpe", "torso"] };
    const hybrid = {
      ...sampleProducts[0],
      id: "tpe-hybrid",
      title: "Silicone Head TPE Body Doll",
      productType: "Custom hybrid doll",
      tags: ["tpe", "silicone-head", "hybrid", "full-doll"]
    };

    expect(filterProducts([fullDoll, torso, hybrid], collectionPresets.tpe.filters).map((product) => product.id)).toEqual(["full-tpe"]);
  });

  it("uses full-silicone dolls as the realistic collection candidate pool", () => {
    const fullSilicone = { ...sampleProducts[0], id: "realistic-candidate", productType: "Custom Silicone doll", tags: ["silicone", "full-doll"] };
    const tpe = {
      ...sampleProducts[0],
      id: "tpe-full",
      title: "TPE Full Doll",
      productType: "Custom TPE doll",
      tags: ["tpe", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "TPE", sourceTitle: "TPE Full Doll" }
    };
    const siliconeTorso = { ...sampleProducts[0], id: "silicone-torso", productType: "Custom Silicone torso", tags: ["silicone", "torso"] };

    expect(filterProducts([fullSilicone, tpe, siliconeTorso], collectionPresets["realistic-sex-dolls"].filters).map((product) => product.id)).toEqual([
      "realistic-candidate"
    ]);
  });

  it("keeps the custom collection focused on full dolls", () => {
    const fullCustom = {
      ...sampleProducts[0],
      id: "custom-full",
      productType: "Custom TPE doll",
      tags: ["custom", "tpe", "full-doll"],
      extended: { ...sampleProducts[0].extended, stockStatus: "custom" as const }
    };
    const customTorso = {
      ...sampleProducts[0],
      id: "custom-torso",
      productType: "Custom TPE torso",
      tags: ["custom", "tpe", "torso"],
      extended: { ...sampleProducts[0].extended, stockStatus: "custom" as const }
    };
    const readyFull = {
      ...sampleProducts[0],
      id: "ready-full",
      productType: "Ready TPE doll",
      tags: ["ready_to_ship", "tpe", "full-doll"],
      extended: { ...sampleProducts[0].extended, stockStatus: "ready_to_ship" as const }
    };

    expect(filterProducts([fullCustom, customTorso, readyFull], collectionPresets.custom.filters).map((product) => product.id)).toEqual(["custom-full"]);
  });

  it("filters ready-to-ship products by every supported warehouse region", () => {
    const usAndEu = {
      ...sampleProducts[0],
      id: "us-eu",
      extended: {
        ...sampleProducts[0].extended,
        warehouseCountry: "United States",
        warehouseRegions: ["United States", "European Union"]
      }
    };
    const canada = {
      ...sampleProducts[0],
      id: "canada",
      extended: { ...sampleProducts[0].extended, warehouseCountry: "Canada", warehouseRegions: ["Canada"] }
    };
    const australia = {
      ...sampleProducts[0],
      id: "australia",
      extended: { ...sampleProducts[0].extended, warehouseCountry: "Australia", warehouseRegions: ["Australia"] }
    };
    const products = [usAndEu, canada, australia];

    expect(filterProducts(products, { region: "us" }).map((product) => product.id)).toEqual(["us-eu"]);
    expect(filterProducts(products, { region: "eu" }).map((product) => product.id)).toEqual(["us-eu"]);
    expect(filterProducts(products, { region: "ca" }).map((product) => product.id)).toEqual(["canada"]);
    expect(filterProducts(products, { region: "au" }).map((product) => product.id)).toEqual(["australia"]);
  });

  it("keeps the mini collection at 120 cm and under", () => {
    const mini = {
      ...sampleProducts[0],
      id: "mini",
      productType: "Custom silicone doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, heightCm: 120 }
    };
    const petiteButNotMini = {
      ...sampleProducts[0],
      id: "petite",
      productType: "Custom silicone doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, heightCm: 150 }
    };
    const unknownHeight = {
      ...sampleProducts[0],
      id: "unknown-height",
      productType: "Custom silicone doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, heightCm: 0 }
    };
    const compactTorsoWithWrongTag = {
      ...sampleProducts[0],
      id: "compact-torso",
      title: "Climax Torsos 80cm TPE Doll",
      productType: "Custom doll",
      tags: ["tpe", "full-doll"],
      extended: { ...sampleProducts[0].extended, heightCm: 80, sourceTitle: "" }
    };
    const compactStandaloneHead = {
      ...sampleProducts[0],
      id: "compact-head",
      title: "Silicone Doll Head 28cm",
      productType: "Custom doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, heightCm: 28, sourceTitle: "Standalone Head" }
    };

    expect(collectionPresets["mini-sex-dolls"].filters.height).toBe("0-120");
    expect(collectionPresets["mini-sex-dolls"].filters.productForm).toBe("full-doll");
    expect(filterProducts(
      [mini, petiteButNotMini, unknownHeight, compactTorsoWithWrongTag, compactStandaloneHead],
      collectionPresets["mini-sex-dolls"].filters
    ).map((product) => product.id)).toEqual(["mini"]);
  });

  it("keeps the affordable collection at a live starting price of $1,000 or less", () => {
    const affordable = {
      ...sampleProducts[0],
      id: "affordable",
      priceRange: {
        ...sampleProducts[0].priceRange,
        minVariantPrice: { amount: "1000.00", currencyCode: "USD" }
      }
    };
    const aboveBoundary = {
      ...sampleProducts[0],
      id: "above-boundary",
      priceRange: {
        ...sampleProducts[0].priceRange,
        minVariantPrice: { amount: "1000.01", currencyCode: "USD" }
      }
    };

    expect(collectionPresets["cheap-sex-dolls"].filters).toEqual({ price: "0-1000", sort: "price-asc" });
    expect(filterProducts([aboveBoundary, affordable], collectionPresets["cheap-sex-dolls"].filters).map((product) => product.id)).toEqual(["affordable"]);
  });

  it("keeps appearance collections on their researched canonical titles and filters", () => {
    expect(collectionPresets["asian-dolls"]).toEqual({
      title: "Asian sex dolls",
      filters: { look: "look-asian" }
    });
    expect(collectionPresets["black-dolls"]).toEqual({
      title: "Black sex dolls",
      filters: { look: "skin-black" }
    });
  });
});
