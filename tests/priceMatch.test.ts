import { describe, expect, it } from "vitest";
import { decidePriceMatch } from "@/lib/compare/priceMatch";
import { sampleProducts } from "@/lib/data/sample-products";

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
});
