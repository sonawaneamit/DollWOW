import { describe, expect, it } from "vitest";
import { customerDeliveryEstimate } from "@/lib/catalog/delivery";
import { buildPdpFitChecks, buildPdpTrustSignals } from "@/lib/catalog/pdpSeo";
import { sampleProducts } from "@/lib/data/sample-products";

describe("customer delivery estimates", () => {
  it("generates 3 business days for ready-to-ship products", () => {
    expect(customerDeliveryEstimate("ready_to_ship", undefined, "TPE")).toBe("Est. 3 business days");
    expect(customerDeliveryEstimate("ready_to_ship", undefined, "Silicone")).toBe("Est. 3 business days");
    expect(customerDeliveryEstimate("ready_to_ship", undefined, undefined)).toBe("Est. 3 business days");
  });

  it("generates 3 weeks for all custom products regardless of material", () => {
    expect(customerDeliveryEstimate("custom", undefined, "TPE")).toBe("Est. 3 weeks");
    expect(customerDeliveryEstimate("custom", undefined, "Silicone")).toBe("Est. 3 weeks");
    expect(customerDeliveryEstimate("custom", undefined, "Full silicone")).toBe("Est. 3 weeks");
    expect(customerDeliveryEstimate("custom", undefined, "Silicone head / TPE body")).toBe("Est. 3 weeks");
    expect(customerDeliveryEstimate("custom", undefined, "Hybrid")).toBe("Est. 3 weeks");
    expect(customerDeliveryEstimate("custom", undefined, undefined)).toBe("Est. 3 weeks");
  });

  it("returns undefined when stock status is unknown", () => {
    expect(customerDeliveryEstimate("check_stock", undefined, "TPE")).toBeUndefined();
    expect(customerDeliveryEstimate(undefined, undefined, "TPE")).toBeUndefined();
  });

  it("preserves a product-specific supplier estimate over generated estimates", () => {
    expect(customerDeliveryEstimate("custom", "Quoted after configuration review", "TPE")).toBe(
      "Quoted after configuration review"
    );
    expect(customerDeliveryEstimate("ready_to_ship", "Ships same day", "Silicone")).toBe(
      "Ships same day"
    );
  });

  it("hides known legacy defaults imported across the catalog and falls back to generated estimates", () => {
    expect(customerDeliveryEstimate("custom", "4-8 weeks", "TPE")).toBe("Est. 3 weeks");
    expect(customerDeliveryEstimate("custom", "Usually 3-5 weeks from order to delivery", "Silicone")).toBe(
      "Est. 3 weeks"
    );
    expect(customerDeliveryEstimate("ready_to_ship", "Fast shipping after stock confirmation", "TPE")).toBe(
      "Est. 3 business days"
    );
    expect(customerDeliveryEstimate("ready_to_ship", "Ships within 1-3 business days after stock confirmation", "Silicone")).toBe(
      "Est. 3 business days"
    );
  });

  it("does not include confirmed before payment language", () => {
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

    expect(copy).not.toMatch(/\b(confirmed?|confirm)\b.*\b(before|payment|checkout)\b/i);
  });
});
