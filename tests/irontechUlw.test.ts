import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";

function irontech(material: string, productType = "Doll"): Product {
  const source = sampleProducts[0];
  return {
    ...source,
    title: "Irontech 165cm full body doll",
    handle: "irontech-165cm-full-body-doll",
    vendor: "Irontech Dolls",
    productType,
    tags: ["irontech", "customizable"],
    extended: { ...source.extended, brand: "Irontech Dolls", material, customizationGroups: undefined }
  };
}

describe("Irontech Ultra Light Weight customization", () => {
  it("adds the $195 ULW choice to full silicone bodies with supplier resources", () => {
    const config = getCustomizationConfig(irontech("Full silicone"));
    const group = config.groups.find((item) => item.id === "body-weight");

    expect(group?.options.find((option) => option.id === "ultra-lightweight")?.priceDelta).toBe(195);
    expect(group?.resources?.map((resource) => resource.kind)).toEqual(["video", "document", "web"]);
  });

  it.each(["TPE", "Silicone head", "Hybrid"])("does not offer ULW for %s bodies", (material) => {
    expect(getCustomizationConfig(irontech(material)).groups.some((group) => group.id === "body-weight")).toBe(false);
  });

  it.each(["Torso", "Hips"])("does not offer ULW for %s products", (productType) => {
    expect(getCustomizationConfig(irontech("Full silicone", productType)).groups.some((group) => group.id === "body-weight")).toBe(false);
  });
});
