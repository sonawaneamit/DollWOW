import { afterEach, describe, expect, it, vi } from "vitest";
import { MD_OCTOBER_TIMING, isMdOctoberActive } from "@/lib/promotions/mdOctober2026";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("MD Doll is preview-only", () => {
  it("stays hidden in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.resetModules();
    const brands = await import("@/lib/catalog/brands");
    expect(brands.isHiddenCatalogBrand("md")).toBe(true);
    expect(brands.catalogBrands.map((b) => b.value)).not.toContain("md");
  });
  it("renders on Vercel preview deployments", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.resetModules();
    const brands = await import("@/lib/catalog/brands");
    expect(brands.isHiddenCatalogBrand("md")).toBe(false);
    expect(brands.catalogBrands.map((b) => b.value)).toContain("md");
    expect(brands.isHiddenCatalogBrand("zelex")).toBe(true);
  });
});

describe("MD October promotion window", () => {
  it("runs 1-31 October on the US Pacific clock and reverts automatically", () => {
    expect(MD_OCTOBER_TIMING.endsAt).toBe("2026-11-01T07:00:00.000Z");
    expect(isMdOctoberActive(new Date("2026-10-14T12:00:00Z"))).toBe(true);
    expect(isMdOctoberActive(new Date("2026-11-01T06:59:59Z"))).toBe(true);
    expect(isMdOctoberActive(new Date("2026-11-01T07:00:00Z"))).toBe(false);
    expect(isMdOctoberActive(new Date("2026-10-01T06:59:59Z"))).toBe(false);
  });
});
