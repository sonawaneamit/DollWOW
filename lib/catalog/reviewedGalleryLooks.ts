import "server-only";
import { createHash } from "node:crypto";
import type { Product } from "@/types/product";
import { productPdpHeading } from "./naming";

type ReviewedLook = { id: string; handle: string; imageFingerprint: string; label: string };

// Image-bound visual labels describe a gallery, not included clothing or upgrades.
const reviewedLooks: ReviewedLook[] = [
  { id: "gid://shopify/Product/10518049226936", handle: "irontech-rita-165cm-g-cup-hybrid-companion-doll-1laqf", imageFingerprint: "aff997591421d15eaf50e013b6eac76645cd8f3db23c45f671834963965acbba", label: "Denim Gallery" },
  { id: "gid://shopify/Product/10518045229240", handle: "irontech-rita-165cm-g-cup-hybrid-companion-doll-eli3u", imageFingerprint: "8e638d5d8032c01de53ae23f63373a91dd03432cd21fe08d636fa56545be4df8", label: "Cream Knit Gallery" },
  { id: "gid://shopify/Product/10518049063096", handle: "irontech-kitty-166cm-d-cup-silicone-companion-doll-1s0dp", imageFingerprint: "9ab0643ad484e4d6cfc29cb239804bd055e8bd6b7092a6878f0dd8f728f9158f", label: "White Halter Gallery" },
  { id: "gid://shopify/Product/10518048506040", handle: "irontech-kitty-166cm-d-cup-silicone-companion-doll-1e8wo", imageFingerprint: "7c247f2afc730eb02b4d505ddc7d341faf1f6866824d62b13c35e38bd7a92ec5", label: "Gold Adornments Gallery" },
  { id: "gid://shopify/Product/10518048473272", handle: "irontech-zara-166cm-c-cup-silicone-companion-doll-h02oi", imageFingerprint: "78ecc1ef2ce8d2bcd8f8ead881bab3d10ce12356cd478167378b133884336c84", label: "Black Dress Gallery" },
  { id: "gid://shopify/Product/10518047883448", handle: "irontech-zara-166cm-c-cup-silicone-companion-doll-1vnvl", imageFingerprint: "385b416e048ec16f3d7646140343df4d4b1206e34c44b2b3882ccadef1997c76", label: "Yellow and Floral Gallery" },
  { id: "gid://shopify/Product/10518048178360", handle: "irontech-luna-164cm-f-cup-silicone-companion-doll-1k1yp", imageFingerprint: "65f3bd94bf335e737c90b9b1df3f0c32996edd949aa2c820dbe33f502ac77611", label: "White Sportswear Gallery" },
  { id: "gid://shopify/Product/10433357971640", handle: "irontech-luna-164cm-f-cup-silicone-companion-doll-r0bub", imageFingerprint: "53a7f8b467547358384c06e77f69853df1dd098ad08ab1205af2d5f13dbd0aaf", label: "Grey Jacket Gallery" },
  { id: "gid://shopify/Product/10518047523000", handle: "irontech-luna-168cm-b-cup-silicone-companion-doll-nvkut", imageFingerprint: "9e26ff1fb0b363034f54713f50b6683a582ccd255860c4250c7f2bef9a377ca8", label: "Crochet and Denim Gallery" },
  { id: "gid://shopify/Product/10518044246200", handle: "irontech-luna-168cm-b-cup-silicone-companion-doll-30cz3", imageFingerprint: "4b7d66f2565141653bef284e258a75d23ed39ec3cb737d09c40fa67da80374c0", label: "Dark-Haired Portrait Gallery" }
];

export function productReviewedGalleryLabel(product: Product) {
  const look = reviewedLooks.find(item => item.id === product.id && item.handle === product.handle);
  if (!look || !product.featuredImage?.url) return "";
  const fingerprint = createHash("sha256").update(product.featuredImage.url).digest("hex");
  return fingerprint === look.imageFingerprint ? look.label : "";
}

export function productReviewedPdpHeading(product: Product) {
  const heading = productPdpHeading(product);
  const label = productReviewedGalleryLabel(product);
  return label ? `${heading} - ${label}` : heading;
}
