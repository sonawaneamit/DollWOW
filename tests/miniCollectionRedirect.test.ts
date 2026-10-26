import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("approved legacy mini collection redirect", () => {
  it("returns exactly one explicit 301 for the legacy path on either host", async () => {
    const redirects = await nextConfig.redirects!();
    const matches = redirects.filter((entry) => entry.source === "/shop/mini-sex-dolls-0");
    expect(matches).toEqual([{
      source: "/shop/mini-sex-dolls-0",
      destination: "/shop/mini-sex-dolls",
      statusCode: 301
    }]);
  });

  it("does not redirect the canonical collection or introduce a broad mini rule", async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects.some((entry) => entry.source === "/shop/mini-sex-dolls")).toBe(false);
    expect(redirects.filter((entry) => entry.source.includes("mini-sex-dolls"))).toHaveLength(1);
  });
});
