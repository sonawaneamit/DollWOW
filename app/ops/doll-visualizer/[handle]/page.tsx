import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DollVisualizer } from "@/components/doll-visualizer/DollVisualizer";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { isVisualizerProduct, VISUALIZER_FREE_PREVIEWS, visualizerConfigForProduct, visualizerGroups } from "@/lib/doll-visualizer/config";
import { productDisplayName } from "@/lib/catalog/naming";
import { protectedProductImageUrl, productImageSources } from "@/lib/catalog/productImage";
import { getProductByHandle } from "@/lib/shopify/storefront";

export const metadata: Metadata = {
  title: "Doll Visualizer™ private preview",
  robots: { index: false, follow: false, nocache: true }
};
export const dynamic = "force-dynamic";

export default async function DollVisualizerProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!isVisualizerProduct(handle)) notFound();
  const product = await getProductByHandle(handle, { cache: "force-cache", revalidate: 3600 });
  if (!product) notFound();
  const groups = visualizerGroups(visualizerConfigForProduct(product, getCustomizationConfig(product)));
  const photos = productImageSources(product).slice(0, 8).map((image, position) => ({
    position,
    url: protectedProductImageUrl(product.handle, position, "card"),
    alt: image.altText || `${productDisplayName(product) || product.title} reference photo ${position + 1}`
  }));

  return (
    <DollVisualizer
      product={{
        handle: product.handle,
        name: productDisplayName(product) || product.title,
        brand: product.extended.brand || product.vendor,
        photos
      }}
      groups={groups}
      freePreviews={VISUALIZER_FREE_PREVIEWS}
      live={Boolean(process.env.VENICE_API_KEY) && process.env.DOLL_VISUALIZER_ENABLED === "true"}
    />
  );
}
