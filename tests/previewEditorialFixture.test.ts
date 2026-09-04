import { describe, expect, it } from "vitest";
import {
  IRONTECH_FLORA_PREVIEW_HANDLE,
  withPreviewEditorialFixture
} from "@/lib/catalog/previewEditorialFixture";
import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";

function floraProduct(): Product {
  return {
    ...sampleProducts[0],
    handle: IRONTECH_FLORA_PREVIEW_HANDLE,
    extended: {
      ...sampleProducts[0].extended,
      editorialIntro: undefined
    }
  };
}

describe("Flora preview editorial fixture", () => {
  it("supplies the live Flora editorial when it is missing on Vercel preview", () => {
    const preview = withPreviewEditorialFixture(floraProduct(), "preview");

    expect(preview.extended.editorialIntro).toMatchObject({
      eyebrow: "Unapologetic Elegance",
      heading: "A Study in Crimson Ambition"
    });
  });

  it("leaves non-preview products unchanged", () => {
    const product = floraProduct();

    expect(withPreviewEditorialFixture(product, "production")).toBe(product);
  });

  it("preserves an existing editorial on Vercel preview", () => {
    const product = floraProduct();
    product.extended.editorialIntro = {
      eyebrow: "Admin eyebrow",
      heading: "Admin heading",
      paragraph: "Admin paragraph"
    };

    expect(withPreviewEditorialFixture(product, "preview")).toBe(product);
    expect(product.extended.editorialIntro.heading).toBe("Admin heading");
  });

  it("replaces incomplete Admin editorial shells on Vercel preview", () => {
    const product = floraProduct();
    product.extended.editorialIntro = { eyebrow: "", heading: "", paragraph: "" };

    const preview = withPreviewEditorialFixture(product, "preview");
    expect(preview.extended.editorialIntro).toMatchObject({
      eyebrow: "Unapologetic Elegance",
      heading: "A Study in Crimson Ambition"
    });
  });
});
