import { describe, expect, it } from "vitest";
import { storefrontAuthHeaders } from "@/lib/shopify/auth";

describe("storefrontAuthHeaders", () => {
  it("uses private token header for Headless private tokens", () => {
    expect(storefrontAuthHeaders("shpat_example")).toEqual({
      "Shopify-Storefront-Private-Token": "shpat_example"
    });
  });

  it("uses public token header for public Storefront tokens", () => {
    expect(storefrontAuthHeaders("public-token")).toEqual({
      "X-Shopify-Storefront-Access-Token": "public-token"
    });
  });
});
