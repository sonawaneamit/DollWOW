import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { brandAuthorizations, getBrandAuthorization } from "@/lib/catalog/authorizations";

describe("Erovenus authorization", () => {
  it("exposes one certificate using the existing public card format", () => {
    const entries = brandAuthorizations.filter((entry) => entry.id === "erovenus");
    expect(entries).toHaveLength(1);
    expect(getBrandAuthorization("erovenus")).toEqual(entries[0]);
    expect(entries[0]).toMatchObject({
      brand: "Erovenus",
      brandValue: "erovenus",
      status: "certificate",
      certificateIssuer: "Erovenus"
    });
  });

  it("uses local, nonempty original and preview documents", () => {
    const entry = getBrandAuthorization("erovenus")!;
    for (const src of [entry.certificateSrc!, entry.certificatePreviewSrc!]) {
      expect(src.startsWith("/images/authorizations/")).toBe(true);
      expect(existsSync(`public${src}`)).toBe(true);
      expect(readFileSync(`public${src}`).length).toBeGreaterThan(1000);
    }
  });
});
