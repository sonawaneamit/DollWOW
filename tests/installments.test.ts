import { describe, expect, it } from "vitest";
import { installmentConfig, installmentLabel, monthlyInstallment } from "@/lib/commerce/installments";

describe("installments", () => {
  it("splits into rounded-up monthly amounts", () => {
    expect(monthlyInstallment(1000, 12)).toBe(84);
    expect(monthlyInstallment(2400)).toBe(200);
  });

  it("returns 0 for invalid input", () => {
    expect(monthlyInstallment(0)).toBe(0);
    expect(monthlyInstallment(-50)).toBe(0);
    expect(monthlyInstallment(Number.NaN)).toBe(0);
    expect(monthlyInstallment(1000, 0)).toBe(0);
  });

  it("stays hidden unless explicitly enabled", () => {
    // NEXT_PUBLIC_SHOW_INSTALLMENTS is not set in tests, so the feature is off.
    expect(installmentConfig.enabled).toBe(false);
    expect(installmentLabel(2400, "USD", (amount) => `$${amount}`)).toBeNull();
  });
});
