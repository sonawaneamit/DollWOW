import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { productPublicTitle } from "@/lib/catalog/naming";
import type { Product } from "@/types/product";
import type { VisualSearchCatalogSuggestion } from "@/types/visualSearch";

type LocalVisualAsset = {
  productHandle: string;
  assetPath: string;
};

export const LOCAL_VISUAL_ASSETS: LocalVisualAsset[] = [
  {
    productHandle: "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
    assetPath: "/images/home-hero/portraits-new/sedoll-carry-home.png"
  },
  {
    productHandle: "starpery-adele-153cm-e-cup-silicone-head-companion-doll-1dn4l",
    assetPath: "/images/home-hero/portraits-new/starpery-adele-home-v2.png"
  },
  {
    productHandle: "172cm-5ft8-e-cup-silicone-sex-doll-ida-belle",
    assetPath: "/images/home-hero/portraits-new/zelex-ida-home.png"
  }
];

let cachedLocalIndex: Promise<Array<LocalVisualAsset & { sha256: string }>> | null = null;

export async function findLocalVisualMatches(products: Product[], imageBytes: ArrayBuffer, limit = 6): Promise<VisualSearchCatalogSuggestion[]> {
  const submittedHash = sha256(Buffer.from(imageBytes));
  const index = await getLocalVisualIndex();
  const byHandle = new Map(products.map((product) => [product.handle, product]));

  return index
    .filter((asset) => asset.sha256 === submittedHash)
    .map((asset) => byHandle.get(asset.productHandle))
    .filter((product): product is Product => Boolean(product))
    .slice(0, limit)
    .map((product) => ({
      productId: product.id,
      handle: product.handle,
      title: productPublicTitle(product),
      brand: product.extended.brand || product.vendor,
      score: 100,
      imageUrl: product.featuredImage?.url
    }));
}

async function getLocalVisualIndex() {
  cachedLocalIndex ??= Promise.all(
    LOCAL_VISUAL_ASSETS.map(async (asset) => {
      const bytes = await readFile(path.join(process.cwd(), "public", asset.assetPath.replace(/^\//, "")));
      return {
        ...asset,
        sha256: sha256(bytes)
      };
    })
  );
  return cachedLocalIndex;
}

function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}
