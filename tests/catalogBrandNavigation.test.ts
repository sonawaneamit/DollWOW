import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { brandCollectionRedirectHref, brandHubHref, canonicalBrandValue, catalogBrands } from "@/lib/catalog/brands";
import { catalogFilterOptions } from "@/lib/catalog/filters";

describe("catalog brand navigation", () => {
  it("keeps every registered brand available to menus and filters", () => {
    expect(catalogFilterOptions.brands.map((brand) => brand.value)).toEqual(catalogBrands.map((brand) => brand.value));
    expect(catalogBrands.every((brand) => brandHubHref(brand.value) === `/brands/${brand.collectionHandle}`)).toBe(true);
  });

  it("consolidates old brand collection handles into the public brand hub", () => {
    for (const brand of catalogBrands) {
      const destination = `/brands/${brand.collectionHandle}`;
      expect(brandCollectionRedirectHref(brand.value)).toBe(destination);
      expect(brandCollectionRedirectHref(brand.collectionHandle)).toBe(destination);
    }
    expect(brandCollectionRedirectHref("zelex")).toBeNull();
    expect(brandCollectionRedirectHref("silicone")).toBeNull();
  });

  it("includes Real Lady with its dedicated brand hub", () => {
    const realLady = catalogBrands.find((brand) => brand.value === "real-lady");
    expect(realLady).toMatchObject({ label: "Real Lady", collectionHandle: "real-lady-dolls" });
    expect(catalogFilterOptions.brands.some((brand) => brand.value === "real-lady")).toBe(true);
  });

  it("registers Fanreal aliases separately from Avant", () => {
    const fanreal = catalogBrands.find((brand) => brand.value === "fanreal");

    expect(fanreal).toMatchObject({
      value: "fanreal",
      label: "Fanreal",
      collectionHandle: "fanreal",
      aliases: ["fanreal", "fanreal doll", "fanrui"]
    });
    expect(canonicalBrandValue("Fanrui")).toBe("fanreal");
    expect(canonicalBrandValue("Avant Doll")).toBe("avant");
  });

  it("renders the desktop brand directory as balanced columns without an internal scroller", () => {
    const headerSource = fs.readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");

    expect(headerSource).toContain("splitIntoBalancedColumns(brandLinks, 3)");
    expect(headerSource).toContain("grid grid-cols-3 divide-x divide-border");
    expect(headerSource).not.toContain('max-h-[min(65vh,620px)] overflow-y-auto');
  });
});
