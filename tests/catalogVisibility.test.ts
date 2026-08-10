import { describe, expect, it } from "vitest";
import { catalogBrands, getCatalogBrand, isHiddenCatalogBrand } from "@/lib/catalog/brands";

describe("catalog brand visibility", () => {
  it("keeps hidden brands recognizable without exposing them in navigation", () => {
    expect(getCatalogBrand("Zelex Dolls")?.value).toBe("zelex");
    expect(isHiddenCatalogBrand("Zelex Dolls")).toBe(true);
    expect(catalogBrands.some((brand) => brand.value === "zelex")).toBe(false);
  });
});
