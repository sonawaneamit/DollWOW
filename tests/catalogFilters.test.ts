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
      productType: "Custom Silicone doll",
      tags: ["silicone", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "Silicone" }
    };
    const tpe = {
      ...sampleProducts[0],
      id: "tpe",
      productType: "Custom TPE doll",
      tags: ["tpe", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "TPE" }
    };
    const hybrid = {
      ...sampleProducts[0],
      id: "hybrid",
      productType: "Custom Hybrid doll",
      tags: ["hybrid", "silicone-head", "full-doll"],
      extended: { ...sampleProducts[0].extended, material: "Hybrid" }
    };

    expect(filterProducts([fullSilicone, tpe, hybrid], { material: "silicone" }).map((product) => product.id)).toEqual(["full-silicone"]);
    expect(filterProducts([fullSilicone, tpe, hybrid], { material: "tpe" }).map((product) => product.id)).toEqual(["tpe"]);
    expect(filterProducts([fullSilicone, tpe, hybrid], { material: "hybrid" }).map((product) => product.id)).toEqual(["hybrid"]);
  });

  it("separates full dolls, torsos, and hips", () => {
    const fullDoll = { ...sampleProducts[0], id: "full", productType: "Custom TPE doll", tags: ["tpe", "full-doll"] };
    const torso = { ...sampleProducts[0], id: "torso", productType: "Custom TPE torso doll", tags: ["tpe", "torso"] };
    const hips = { ...sampleProducts[0], id: "hips", productType: "Custom Silicone hips", tags: ["silicone", "hips"] };

    expect(filterProducts([fullDoll, torso, hips], { productForm: "full-doll" }).map((product) => product.id)).toEqual(["full"]);
    expect(filterProducts([fullDoll, torso, hips], { productForm: "torso" }).map((product) => product.id)).toEqual(["torso"]);
    expect(filterProducts([fullDoll, torso, hips], { productForm: "hips" }).map((product) => product.id)).toEqual(["hips"]);
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
      extended: { ...sampleProducts[0].extended, heightCm: 120 }
    };
    const petiteButNotMini = {
      ...sampleProducts[0],
      id: "petite",
      extended: { ...sampleProducts[0].extended, heightCm: 150 }
    };

    expect(collectionPresets["mini-sex-dolls"].filters.height).toBe("0-120");
    expect(filterProducts([mini, petiteButNotMini], collectionPresets["mini-sex-dolls"].filters).map((product) => product.id)).toEqual(["mini"]);
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
});
