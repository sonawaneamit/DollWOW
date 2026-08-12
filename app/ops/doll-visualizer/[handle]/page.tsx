import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { DollVisualizer } from "@/components/doll-visualizer/DollVisualizer";
import { VisualizerAccessGate } from "@/components/doll-visualizer/VisualizerAccessGate";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { isVisualizerProduct, VISUALIZER_FREE_PREVIEWS, visualizerConfigForProduct, visualizerGroups } from "@/lib/doll-visualizer/config";
import { visualizerUsageForEmail } from "@/lib/doll-visualizer/accountUsage";
import { maskedEmail, verifyVisualizerSessionValue, VISUALIZER_SESSION_COOKIE } from "@/lib/doll-visualizer/session";
import { productDisplayName } from "@/lib/catalog/naming";
import { protectedProductImageUrl, productImageSources } from "@/lib/catalog/productImage";
import { getProductByHandle } from "@/lib/shopify/storefront";

export const metadata: Metadata = {
  title: "Doll Visualizer™ | See Your Doll Your Way",
  robots: { index: false, follow: false, nocache: true }
};
export const dynamic = "force-dynamic";

export default async function DollVisualizerProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!isVisualizerProduct(handle)) notFound();
  const session = verifyVisualizerSessionValue((await cookies()).get(VISUALIZER_SESSION_COOKIE)?.value);
  if (!session) return <div className="visualizer-access-shell"><VisualizerAccessGate handle={handle} /></div>;
  const usage = await visualizerUsageForEmail(session.email);
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
      initialRemaining={usage.remaining}
      verifiedEmail={maskedEmail(session.email)}
      live={usage.available && Boolean(process.env.VENICE_API_KEY) && process.env.DOLL_VISUALIZER_ENABLED === "true"}
    />
  );
}
