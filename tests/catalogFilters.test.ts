import { describe, expect, it } from "vitest";
import { canonicalShopCollectionHandle, collectionPresets, filterProducts, filtersFromSearchParams, getCatalogFilterLabel, isIndexableShopCollectionHandle } from "@/lib/catalog/filters";
import { sampleProducts } from "@/lib/data/sample-products";

describe("catalog filters", () => {
  it("filters DollVue-enabled products with the shared eligibility rule", () => {
    const customExtended = { ...sampleProducts[0].extended, stockStatus: "custom" as const };
    const irontech = { ...sampleProducts[0], id: "dollvue-irontech", handle: "irontech-luna-152cm-a-cup-silicone-companion-doll-12nvb", extended: customExtended };
    const starpery = { ...sampleProducts[0], id: "dollvue-starpery", handle: "starpery-xue-171cm-xue-4-full-silicone-doll", extended: customExtended };
    const readyToShipIrontech = {
      ...sampleProducts[0],
      id: "ready-dollvue-irontech",
      handle: "irontech-ready-ship-example",
      extended: { ...sampleProducts[0].extended, stockStatus: "ready_to_ship" as const }
    };
    const otherBrand = { ...sampleProducts[0], id: "not-dollvue", handle: "wm-example-165cm-tpe-doll" };

    expect(filtersFromSearchParams({ dollVue: "enabled" }).dollVue).toBe("enabled");
    expect(getCatalogFilterLabel("dollVue", "enabled")).toBe("DollVue enabled");
    expect(filterProducts([irontech, starpery, readyToShipIrontech, otherBrand], { dollVue: "enabled" }).map((product) => product.id)).toEqual([
      "dollvue-irontech",
      "dollvue-starpery"
    ]);
  });

  it("keeps one indexable owner for collection aliases and utility sizes", () => {
    expect(canonicalShopCollectionHandle("hair-black")).toBe("black-hair-dolls");
    expect(canonicalShopCollectionHandle("shape-fuller")).toBe("fuller-dolls");
    expect(canonicalShopCollectionHandle("customizable")).toBe("custom");
    expect(canonicalShopCollectionHandle("custom-0")).toBe("custom");
    expect(canonicalShopCollectionHandle("silicone-head")).toBe("hybrid");
    expect(canonicalShopCollectionHandle("transgender-sex-dolls")).toBe("futa-sex-dolls");
    expect(canonicalShopCollectionHandle("trans-sex-dolls")).toBe("futa-sex-dolls");
    expect(isIndexableShopCollectionHandle("black-hair-dolls")).toBe(true);
    expect(isIndexableShopCollectionHandle("hair-black")).toBe(false);
    expect(isIndexableShopCollectionHandle("height-160-164")).toBe(true);
  });

  it("only includes full feminine dolls with a verified insertable penis option", () => {
    const eligible = {
      ...sampleProducts[0],
      id: "eligible-futa",
      productType: "Custom TPE doll",
      tags: ["female-doll", "full-doll", "tpe"],
      extended: { ...sampleProducts[0].extended, bodyType: "female" as const, penisAddOnAvailable: true }
    };
    const noOption = {
      ...eligible,
      id: "no-option",
      extended: { ...eligible.extended, penisAddOnAvailable: false }
    };
    const male = {
      ...eligible,
      id: "male-with-option",
      tags: ["male-doll", "full-doll", "tpe"],
      extended: { ...eligible.extended, bodyType: "male" as const }
    };
    const torso = {
      ...eligible,
      id: "torso-with-option",
      productType: "Custom TPE torso doll",
      tags: ["female-doll", "torso", "tpe"]
    };

    expect(collectionPresets["futa-sex-dolls"].filters).toEqual({
      bodyType: "female",
      productForm: "full-doll",
      capability: "insertable-penis-add-on"
    });
    expect(filterProducts([eligible, noOption, male, torso], collectionPresets["futa-sex-dolls"].filters).map((product) => product.id)).toEqual([
      "eligible-futa"
    ]);
  });

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

  it("lets structural partial-body evidence override a misleading full-doll tag", () => {
    const hipsWithWrongTag = {
      ...sampleProducts[0],
      id: "misleading-hips",
      title: "Daisy 29cm Customizable Companion Doll",
      productType: "Custom Adult doll",
      tags: ["customizable", "full-doll"],
      extended: {
        ...sampleProducts[0].extended,
        heightCm: 29,
        measurements: {
          Height: "11 in / 29 cm",
          Bust: "N/A",
          Waist: "1 ft 11 in / 59.5 cm",
          Hip: "3 ft 10 in / 117.5 cm",
          "Feet Length": "N/A",
          "Legs Length": "11 in / 28 cm",
          "Arms Length": "N/A"
        }
      }
    };
    const torsoWithWrongTag = {
      ...sampleProducts[0],
      id: "misleading-torso",
      title: "Jenny 90cm D-Cup Customizable Companion Doll",
      productType: "Custom Adult doll",
      tags: ["customizable", "full-doll"],
      extended: {
        ...sampleProducts[0].extended,
        heightCm: 90,
        measurements: {
          Height: "2 ft 11 in / 90 cm",
          Bust: "2 ft 8 in / 81 cm",
          Waist: "1 ft 12 in / 60 cm",
          Hip: "3 ft 4 in / 101 cm",
          "Feet Length": "N/A",
          "Legs Length": "N/A",
          "Arms Length": "N/A"
        }
      }
    };
    const torsoFromSourceSignal = {
      ...sampleProducts[0],
      id: "source-torso",
      title: "Compact Silicone Doll",
      productType: "Custom Silicone doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, sourceTitle: "Body profile torso" }
    };
    const completeMiniDoll = {
      ...sampleProducts[0],
      id: "complete-mini",
      title: "Complete Mini Doll 90cm",
      productType: "Custom Silicone doll",
      tags: ["silicone", "full-doll"],
      extended: {
        ...sampleProducts[0].extended,
        heightCm: 90,
        measurements: {
          Height: "2 ft 11 in / 90 cm",
          Bust: "2 ft 3 in / 70 cm",
          Waist: "1 ft 8 in / 50 cm",
          Hip: "2 ft 7 in / 80 cm",
          "Feet Length": "7 in / 18 cm",
          "Legs Length": "1 ft 10 in / 56 cm",
          "Arms Length": "1 ft 4 in / 41 cm"
        }
      }
    };
    const products = [hipsWithWrongTag, torsoWithWrongTag, torsoFromSourceSignal, completeMiniDoll];

    expect(filterProducts(products, { productForm: "full-doll" }).map((product) => product.id)).toEqual(["complete-mini"]);
    expect(filterProducts(products, { productForm: "torso" }).map((product) => product.id)).toEqual(["misleading-torso", "source-torso"]);
    expect(filterProducts(products, { productForm: "hips" }).map((product) => product.id)).toEqual(["misleading-hips"]);
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

  it("keeps the lightweight collection below 75 lb", () => {
    const lightweight = {
      ...sampleProducts[0],
      id: "lightweight",
      extended: { ...sampleProducts[0].extended, weightLb: 74 }
    };
    const boundary = {
      ...sampleProducts[0],
      id: "boundary",
      extended: { ...sampleProducts[0].extended, weightLb: 75 }
    };
    const unknownWeight = {
      ...sampleProducts[0],
      id: "unknown-weight",
      extended: { ...sampleProducts[0].extended, weightLb: 0 }
    };

    expect(collectionPresets["lightweight-sex-dolls"]).toEqual({
      title: "Lightweight sex dolls",
      filters: { productForm: "full-doll", weight: "0-74" }
    });
    expect(filterProducts(
      [boundary, unknownWeight, lightweight],
      collectionPresets["lightweight-sex-dolls"].filters
    ).map((product) => product.id)).toEqual(["lightweight"]);
  });

  it("uses source release order for the new sex dolls collection", () => {
    const earlier = {
      ...sampleProducts[0],
      id: "earlier-release",
      extended: { ...sampleProducts[0].extended, sourceReleaseRank: 2 }
    };
    const newer = {
      ...sampleProducts[0],
      id: "newer-release",
      extended: { ...sampleProducts[0].extended, sourceReleaseRank: 8 }
    };

    expect(collectionPresets["new-sex-dolls"]).toEqual({
      title: "New sex dolls and latest arrivals",
      filters: { sort: "latest" }
    });
    expect(filterProducts([earlier, newer], collectionPresets["new-sex-dolls"].filters).map((product) => product.id)).toEqual([
      "newer-release",
      "earlier-release"
    ]);
    expect(canonicalShopCollectionHandle("new-arrivals")).toBe("new-sex-dolls");
    expect(canonicalShopCollectionHandle("newest-sex-dolls")).toBe("new-sex-dolls");
    expect(canonicalShopCollectionHandle("latest-sex-dolls")).toBe("new-sex-dolls");
    expect(isIndexableShopCollectionHandle("new-arrivals")).toBe(false);
  });

  it("keeps appearance collections on their researched canonical titles and filters", () => {
    expect(collectionPresets["asian-dolls"]).toEqual({
      title: "Asian sex dolls",
      filters: { look: "look-asian" }
    });
    expect(canonicalShopCollectionHandle("japanese-sex-dolls")).toBe("asian-dolls");
    expect(canonicalShopCollectionHandle("japanese-dolls")).toBe("asian-dolls");
    expect(isIndexableShopCollectionHandle("japanese-sex-dolls")).toBe(false);
    expect(collectionPresets["black-dolls"]).toEqual({
      title: "Black sex dolls",
      filters: { look: "skin-black" }
    });
    expect(canonicalShopCollectionHandle("ebony-sex-dolls")).toBe("black-dolls");
    expect(canonicalShopCollectionHandle("dark-skin-sex-dolls")).toBe("black-dolls");
    expect(isIndexableShopCollectionHandle("ebony-sex-dolls")).toBe(false);
  });

  it("keeps female body-style collections free of misleading male shape tags", () => {
    const femaleFuller = {
      ...sampleProducts[0],
      id: "female-fuller",
      tags: ["female-doll", "shape-fuller"]
    };
    const maleFuller = {
      ...sampleProducts[0],
      id: "male-fuller",
      tags: ["male-doll", "shape-fuller"]
    };
    const femaleSlimAndFuller = {
      ...sampleProducts[0],
      id: "female-slim-fuller",
      tags: ["female-doll", "shape-slim", "shape-fuller"]
    };
    const maleSlim = {
      ...sampleProducts[0],
      id: "male-slim",
      tags: ["male-doll", "shape-slim"]
    };
    const products = [femaleFuller, maleFuller, femaleSlimAndFuller, maleSlim];

    expect(filterProducts(products, collectionPresets["fuller-dolls"].filters).map((product) => product.id)).toEqual([
      "female-fuller",
      "female-slim-fuller"
    ]);
    expect(filterProducts(products, collectionPresets["slim-dolls"].filters).map((product) => product.id)).toEqual([
      "female-slim-fuller"
    ]);
  });
});
