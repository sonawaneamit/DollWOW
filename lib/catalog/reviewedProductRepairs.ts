import "server-only";
import { createHash } from "node:crypto";
import type { Product } from "@/types/product";

// Individually approved DOL-177 repairs. Provenance and approval notes stay in
// private evidence, never in serialized product fields or client bundles.
const amyHandle = "starpery-amy-161cm-h-cup-silicone-head-companion-doll-75l94";
const removedAmyImage = "60f73e3861eca80f4d247790601dbaecc2ec1196e25bf43f73a14aaa5879b3f5";
const amyReplacement = {
  url: "https://cdn.shopify.com/s/files/1/0960/7531/7432/files/161cm5ft3-H-cup-Silicone-Head-Sex-Doll-_E2_80_93-Amy-1-2.jpg?v=1780685041",
  altText: "Starpery Amy 161cm H-Cup Silicone Head Companion Doll",
  width: 1000, height: 1500
};
const fingerprint = (url: string) => createHash("sha256").update(url).digest("hex");

export function applyReviewedProductRepairs(product: Product): Product {
  if (product.id === "gid://shopify/Product/10433809187000" && product.handle === amyHandle) {
    const allowed = (image: { url: string }) => fingerprint(image.url) !== removedAmyImage;
    const sources = [product.featuredImage, ...product.images, ...(product.media ?? []).map(media => media.type === "image" ? media.image : media.previewImage)];
    if (!sources.some(image => image && !allowed(image))) return product;
    const images = product.images.filter(allowed);
    const featuredImage = product.featuredImage && allowed(product.featuredImage)
      ? product.featuredImage : images[0] ?? amyReplacement;
    return {
      ...product, featuredImage, images: images.length ? images : [featuredImage],
      media: product.media?.filter(media => media.type === "image" ? allowed(media.image) : !media.previewImage || allowed(media.previewImage))
    };
  }
  if (product.id !== "gid://shopify/Product/10518047129784" ||
    product.handle !== "irontech-lifelike-and-premium-quality-companion-doll-1chy9" ||
    product.title !== "Lifelike & Premium Quality Customizable Companion Doll" ||
    !product.featuredImage || fingerprint(product.featuredImage.url) !== "e6ce11d224516d6f84e25a84b0ebf4acce91696ecdcd65ad2bdd2362af94f556" ||
    (product.extended.heightCm && product.extended.heightCm !== 166) ||
    (product.extended.material && !/^(?:adult doll|silicone)$/i.test(product.extended.material))) return product;

  return {
    ...product,
    title: "Irontech Harley Quinn 166cm C-Cup Silicone Companion Doll",
    seo: { ...product.seo, title: !product.seo?.title || product.seo.title.startsWith("Lifelike & Premium Quality Customizable Companion Doll")
      ? "Irontech Harley Quinn 166cm C-Cup Silicone Companion Doll" : product.seo.title },
    extended: {
      ...product.extended, displayName: "Harley Quinn", heightCm: 166,
      material: "silicone", cupSize: "C", weightLb: 97,
      measurements: {
        Height: "166 cm", Weight: "44 kg / 97 lb", "Cup size": "C-Cup",
        "Feet Length": "22 cm", Bust: "84 cm", "Legs Length": "84 cm",
        Waist: "67 cm", "Arms Length": "72 cm", Hip: "97 cm", "Shoulders Width": "40 cm",
        "Vagina Depth": "18 cm", "Anus Depth": "16 cm", "Oral Depth": "N/A"
      }
    }
  };
}
