import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { productPdpHeading } from "@/lib/catalog/naming";
import { productReviewedGalleryLabel, productReviewedPdpHeading } from "@/lib/catalog/reviewedGalleryLooks";
import { buildPdpMetadata } from "@/lib/catalog/pdpSeo";

const product = {
  ...sampleProducts[0],
  id: "gid://shopify/Product/10518049226936",
  handle: "irontech-rita-165cm-g-cup-hybrid-companion-doll-1laqf",
  title: "Irontech Rita 165cm G-Cup Hybrid Customizable Companion Doll",
  seo: { title: "Rita 165cm G-Cup Hybrid Customizable Companion Doll | DollWow", description: "Existing description." },
  featuredImage: {
    url: "https://cdn.shopify.com/s/files/1/0960/7531/7432/files/165cm5ft5-G-cup-Silicone-Sex-Doll-_E2_80_93-Rita-4_6b4b592f-a11f-4c78-8533-f97d5c1d06f7.jpg?v=1786296039",
    altText: "Rita"
  },
  extended: { ...sampleProducts[0].extended, brand: "Irontech", displayName: "Rita", heightCm: 165, cupSize: "G", material: "silicone-head", stockStatus: "custom" as const }
};

describe("reviewed gallery identity", () => {
  it("adds the inspected photo-set label without changing shared card naming", () => {
    expect(productReviewedGalleryLabel(product)).toBe("Denim Gallery");
    expect(productReviewedPdpHeading(product)).toBe(`${productPdpHeading(product)} - Denim Gallery`);
    expect(productPdpHeading(product)).not.toContain("Gallery");
  });

  it.each([
    { ...product, id: "another product" },
    { ...product, handle: "another-handle" },
    { ...product, featuredImage: null },
    { ...product, featuredImage: { ...product.featuredImage, url: "https://cdn.shopify.com/replacement.jpg" } }
  ])("does not carry an old look label onto another record or replacement photo", changed => {
    expect(productReviewedGalleryLabel(changed)).toBe("");
    expect(productReviewedPdpHeading(changed)).toBe(productPdpHeading(changed));
  });

  it("aligns a repeated search title and social titles with the reviewed H1", () => {
    const metadata = buildPdpMetadata(product);
    expect(metadata.title).toBe(productReviewedPdpHeading(product));
    expect(metadata.openGraph).toMatchObject({ title: metadata.title });
    expect(metadata.twitter).toMatchObject({ title: metadata.title });
    expect(metadata.description).toBe("Existing description.");
    expect(metadata.alternates?.canonical).toContain(product.handle);
  });

  it("preserves unique authored search titles", () => {
    const authored = { ...product, seo: { ...product.seo, title: "Rita - A Reviewed Unique Look" } };
    expect(buildPdpMetadata(authored).title).toBe(authored.seo.title);
  });

  it("keeps original gallery URLs out of public social image metadata", () => {
    const metadata = buildPdpMetadata(product);
    expect(metadata.openGraph).toMatchObject({ images: [{ url: `/product-media/v4/${product.handle}/0`, alt: "Rita" }] });
    expect(metadata.twitter).toMatchObject({ images: [`/product-media/v4/${product.handle}/0`] });
    expect(JSON.stringify(metadata)).not.toContain("cdn.shopify.com");
  });
});
