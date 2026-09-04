import { describe, expect, it } from "vitest";
import { FANREAL_DIANA_PREVIEW_HANDLE, withPreviewCustomizationFixture } from "@/lib/customization/previewFixture";
import { getCustomizationConfig } from "@/lib/customization/configs";
import type { Product } from "@/types/product";

function product(): Product {
  return {
    id: "diana", handle: FANREAL_DIANA_PREVIEW_HANDLE, title: "Fanreal Diana", description: "", vendor: "Fanreal",
    productType: "Custom silicone doll", tags: ["fanreal"], featuredImage: null, images: [], variants: [],
    priceRange: { minVariantPrice: { amount: "2000", currencyCode: "USD" }, maxVariantPrice: { amount: "2000", currencyCode: "USD" } },
    extended: { brand: "Fanreal", material: "Silicone", stockStatus: "custom", customizationGroups: [{ id: "live", label: "Live Shopify", display: "cards", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] }] }
  };
}

describe("Fanreal preview fixture", () => {
  it("overrides Diana only on Vercel preview with the full thumbnail customizer", () => {
    const preview = withPreviewCustomizationFixture(product(), "preview");
    expect(preview.extended.customizationGroups).toHaveLength(21);
    expect(getCustomizationConfig(preview).groups).toHaveLength(21);
    expect(preview.extended.customizationGroups?.flatMap((group) => group.options).filter((option) => option.swatch?.kind === "image")).toHaveLength(181);
    expect(preview.extended.customizationGroups?.some((group) => group.id === "order-notes")).toBe(false);
    expect(preview.extended.customizationGroups?.find((group) => group.id === "standing")?.options.find((option) => option.id === "standing-without-bolts-hard-feet")?.priceLabel).toBe("included");
    expect(JSON.stringify(preview.extended.customizationGroups)).not.toMatch(/MAP|EXW|reseller|factory URL|FREE this month|Order Notes|Message Board/i);
  });

  it("leaves the Shopify metafield path unchanged in production and outside Diana", () => {
    const live = product();
    expect(withPreviewCustomizationFixture(live, "production")).toBe(live);
    const other = { ...live, handle: "fanreal-other" };
    expect(withPreviewCustomizationFixture(other, "preview")).toBe(other);
  });
});
