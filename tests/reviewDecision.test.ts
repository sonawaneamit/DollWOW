import { describe, expect, it } from "vitest";
import { resolveApprovedDiscountAmount } from "@/lib/compare/reviewDecision";

describe("resolveApprovedDiscountAmount", () => {
  it("uses manual override when provided", () => {
    expect(resolveApprovedDiscountAmount({ manualDiscountAmount: 200, basePrice: 2700, quotedPrice: 2500 })).toBe(200);
  });

  it("falls back to base price difference", () => {
    expect(resolveApprovedDiscountAmount({ basePrice: 2700, quotedPrice: 2500 })).toBe(200);
  });

  it("never goes below zero", () => {
    expect(resolveApprovedDiscountAmount({ basePrice: 2400, quotedPrice: 2500 })).toBe(0);
  });
});
