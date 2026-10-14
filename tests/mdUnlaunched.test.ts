import { describe, expect, it } from "vitest";
import { catalogBrands, brandFilterOptions, isHiddenCatalogBrand } from "@/lib/catalog/brands";
import { brandAuthorizations, liveAuthorizedBrands } from "@/lib/catalog/authorizations";
import { brandHubHandles } from "@/lib/catalog/brandSeo";

describe("MD Doll stays unlaunched while IDO is live", () => {
  it("keeps MD off every public brand surface", () => {
    expect(isHiddenCatalogBrand("md")).toBe(true);
    expect(catalogBrands.map((b) => b.value)).not.toContain("md");
    expect(brandFilterOptions().map((b) => b.value)).not.toContain("md");
    expect(brandHubHandles).not.toContain("md-dolls");
    expect(brandAuthorizations.map((a) => a.brandValue)).not.toContain("md");
    expect(liveAuthorizedBrands.map((b) => b.value)).not.toContain("md");
  });
  it("keeps IDO public", () => {
    expect(catalogBrands.map((b) => b.value)).toContain("ido");
    expect(brandHubHandles).toContain("ido-dolls");
    expect(brandAuthorizations.map((a) => a.brandValue)).toContain("ido");
  });
});
