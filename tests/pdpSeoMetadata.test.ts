import { describe, expect, it } from "vitest";
import { buildPdpMetadata } from "@/lib/catalog/pdpSeo";
import { sampleProducts } from "@/lib/data/sample-products";
import { productPublicTitle } from "@/lib/catalog/naming";

describe("product metadata", () => {
  it("uses the concise public product name for the browser and search title", () => {
    const product = {
      ...sampleProducts[0],
      extended: {
        ...sampleProducts[0].extended,
        customAvailable: true,
        displayName: "Edith Irving",
        heightCm: 167,
        cupSize: "K",
        material: "silicone-head",
        headModel: "K419"
      }
    };

    const metadata = buildPdpMetadata(product);
    expect(metadata.title).toBe(productPublicTitle(product));
    expect(String(metadata.title)).not.toContain("Customizable Companion Doll");
  });
});
