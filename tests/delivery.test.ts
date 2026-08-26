import { describe, expect, it } from "vitest";
import { customerDeliveryEstimate } from "@/lib/catalog/delivery";
import { buildPdpFitChecks, buildPdpTrustSignals } from "@/lib/catalog/pdpSeo";
import { sampleProducts } from "@/lib/data/sample-products";

describe("customer delivery estimates", () => {
  it("generates warehouse window for ready-to-ship products", () => {
    expect(customerDeliveryEstimate("ready_to_ship", undefined, "TPE")).toBe(
      "Typically 3–5 business days after we confirm the unit"
    );
    expect(customerDeliveryEstimate("ready_to_ship", undefined, "Silicone")).toBe(
      "Typically 3–5 business days after we confirm the unit"
    );
  });

  it("generates TPE production window for custom TPE products", () => {
    expect(customerDeliveryEstimate("custom", undefined, "TPE")).toBe(
      "Typically 2–4 weeks from order to delivery"
    );
  });

  it("generates silicone/hybrid production window for custom silicone products", () => {
    expect(customerDeliveryEstimate("custom", undefined, "Silicone")).toBe(
      "Typically 4–7 weeks from order to delivery"
    );
    expect(customerDeliveryEstimate("custom", undefined, "Full silicone")).toBe(
      "Typically 4–7 weeks from order to delivery"
    );
    expect(customerDeliveryEstimate("custom", undefined, "Silicone head / TPE body")).toBe(
      "Typically 4–7 weeks from order to delivery"
    );
    expect(customerDeliveryEstimate("custom", undefined, "Hybrid")).toBe(
      "Typically 4–7 weeks from order to delivery"
    );
  });

  it("returns undefined when material is unknown for custom products", () => {
    expect(customerDeliveryEstimate("custom", undefined, undefined)).toBeUndefined();
    expect(customerDeliveryEstimate("custom", undefined, "")).toBeUndefined();
  });

  it("preserves a product-specific supplier estimate over generated windows", () => {
    expect(customerDeliveryEstimate("custom", "Quoted after configuration review", "TPE")).toBe(
      "Quoted after configuration review"
    );
    expect(customerDeliveryEstimate("ready_to_ship", "Ships same day", "Silicone")).toBe(
      "Ships same day"
    );
  });

  it("hides known legacy defaults imported across the catalog and falls back to generated windows", () => {
    expect(customerDeliveryEstimate("custom", "4-8 weeks", "TPE")).toBe(
      "Typically 2–4 weeks from order to delivery"
    );
    expect(customerDeliveryEstimate("custom", "Usually 3-5 weeks from order to delivery", "Silicone")).toBe(
      "Typically 4–7 weeks from order to delivery"
    );
    expect(customerDeliveryEstimate("ready_to_ship", "Fast shipping after stock confirmation", "TPE")).toBe(
      "Typically 3–5 business days after we confirm the unit"
    );
    expect(customerDeliveryEstimate("ready_to_ship", "Ships within 1-3 business days after stock confirmation", "Silicone")).toBe(
      "Typically 3–5 business days after we confirm the unit"
    );
  });

  it("uses confirmation language when a product has no live estimate", () => {
    const product = {
      ...sampleProducts[0],
      extended: {
        ...sampleProducts[0].extended,
        stockStatus: "ready_to_ship" as const,
        deliveryEstimate: undefined
      }
    };
    const copy = [
      ...buildPdpTrustSignals(product).map((item) => item.body),
      ...buildPdpFitChecks(product).map((item) => item.body ?? item.lines?.join(" ") ?? "")
    ].join(" ");

    expect(copy).toContain("before payment");
    expect(copy).not.toMatch(/\b\d+\s*[-–]\s*\d+\s+(?:business days?|weeks?)\b/i);
  });
});
