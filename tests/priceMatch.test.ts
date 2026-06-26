import { describe, expect, it } from "vitest";
import { decidePriceMatch } from "@/lib/compare/priceMatch";
import { sampleProducts } from "@/lib/data/sample-products";
import { fallbackApprovedVendors } from "@/lib/compare/config";

describe("decidePriceMatch", () => {
  it("blocks unknown vendors during launch", () => {
    const decision = decidePriceMatch({
      parsed: {
        inputUrl: "https://unknown.example/product",
        sourceDomain: "unknown.example",
        title: "Aria 156",
        price: 1800,
        currency: "USD",
        imageUrls: [],
        lastCheckedAt: new Date().toISOString()
      },
      product: sampleProducts[0],
      confidence: "high"
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toContain("not approved");
  });

  it("allows an approved non-promo vendor when the match is clean", () => {
    const decision = decidePriceMatch({
      parsed: {
        inputUrl: "https://rosemarydoll.com/product/plain-listing",
        sourceDomain: "rosemarydoll.com",
        title: "Aria 156",
        price: 1800,
        currency: "USD",
        imageUrls: [],
        lastCheckedAt: new Date().toISOString()
      },
      product: sampleProducts[0],
      confidence: "high",
      approvedVendors: fallbackApprovedVendors
    });

    expect(decision.allowed).toBe(true);
    expect(decision.discountPercent).toBeTypeOf("number");
  });

  it("keeps review-approved vendors out of automatic codes until explicitly enabled", () => {
    const decision = decidePriceMatch({
      parsed: {
        inputUrl: "https://trusted.example/product/plain-listing",
        sourceDomain: "trusted.example",
        title: "Aria 156",
        price: 1800,
        currency: "USD",
        imageUrls: [],
        lastCheckedAt: new Date().toISOString()
      },
      product: sampleProducts[0],
      confidence: "high",
      approvedVendors: [
        {
          domain: "trusted.example",
          displayName: "Trusted Example",
          trustStatus: "trusted",
          trustTier: "trusted",
          allowedForPriceMatch: true,
          autoMatchEnabled: false,
          allowPromoAutoMatch: false,
          promoParsingMode: "standard"
        }
      ]
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toContain("not automatic codes");
  });

  it("keeps promo-heavy listings in team review even for approved vendors", () => {
    const decision = decidePriceMatch({
      parsed: {
        inputUrl: "https://rosemarydoll.com/product/promo-listing",
        sourceDomain: "rosemarydoll.com",
        title: "Aria 156",
        price: 1800,
        currency: "USD",
        imageUrls: [],
        couponPercent: 10,
        freebies: ["Free wig"],
        promoText: ["10% off and free wig today"],
        lastCheckedAt: new Date().toISOString()
      },
      product: sampleProducts[0],
      confidence: "high",
      approvedVendors: fallbackApprovedVendors.map((vendor) => ({
        ...vendor,
        allowPromoAutoMatch: false
      }))
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toContain("promo or freebie");
  });
});
