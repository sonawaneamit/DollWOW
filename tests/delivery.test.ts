import { describe, expect, it } from "vitest";
import { customerDeliveryEstimate } from "@/lib/catalog/delivery";
import { buildPdpFitChecks, buildPdpTrustSignals } from "@/lib/catalog/pdpSeo";
import { sampleProducts } from "@/lib/data/sample-products";

describe("customer delivery estimates", () => {
  it("does not invent a default estimate for custom or warehouse products", () => {
    expect(customerDeliveryEstimate("custom")).toBeUndefined();
    expect(customerDeliveryEstimate("ready_to_ship")).toBeUndefined();
  });

  it("preserves a product-specific supplier estimate", () => {
    expect(customerDeliveryEstimate("custom", "Quoted after configuration review")).toBe(
      "Quoted after configuration review"
    );
  });

  it("hides known legacy defaults imported across the catalog", () => {
    expect(customerDeliveryEstimate("custom", "4-8 weeks")).toBeUndefined();
    expect(customerDeliveryEstimate("custom", "Usually 3-5 weeks from order to delivery")).toBeUndefined();
    expect(customerDeliveryEstimate("ready_to_ship", "Fast shipping after stock confirmation")).toBeUndefined();
    expect(customerDeliveryEstimate("ready_to_ship", "Ships within 1-3 business days after stock confirmation")).toBeUndefined();
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
