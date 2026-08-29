import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { DollVue } from "@/components/dollvue/DollVue";
import { DollVueAccessGate } from "@/components/dollvue/DollVueAccessGate";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { isDollVueProduct, isDollVueCatalogProduct, DOLLVUE_FREE_PREVIEWS, dollVueConfigForProduct, dollVueGroups } from "@/lib/dollvue/config";
import { dollVueUsageForEmail } from "@/lib/dollvue/accountUsage";
import { maskedEmail, verifyDollVueSessionValue, DOLLVUE_SESSION_COOKIE } from "@/lib/dollvue/session";
import { productDisplayName } from "@/lib/catalog/naming";
import { protectedProductImageUrl, productImageSources } from "@/lib/catalog/productImage";
import { getProductByHandle } from "@/lib/shopify/storefront";

export const metadata: Metadata = {
  title: "DollVue™ | See Your Doll Your Way",
  robots: { index: false, follow: false, nocache: true }
};
export const dynamic = "force-dynamic";

export default async function DollVueProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!isDollVueProduct(handle)) notFound();
  const product = await getProductByHandle(handle, { cache: "force-cache", revalidate: 3600 });
  if (!product || !isDollVueCatalogProduct(product)) notFound();
  const session = verifyDollVueSessionValue((await cookies()).get(DOLLVUE_SESSION_COOKIE)?.value);
  if (!session) return <div className="dollvue-access-shell"><DollVueAccessGate handle={handle} /></div>;
  const usage = await dollVueUsageForEmail(session.email);
  const groups = dollVueGroups(dollVueConfigForProduct(product, getCustomizationConfig(product)));
  const photos = productImageSources(product).slice(0, 8).map((image, position) => ({
    position,
    url: protectedProductImageUrl(product.handle, position, "card"),
    alt: image.altText || `${productDisplayName(product) || product.title} reference photo ${position + 1}`
  }));

  return (
    <DollVue
      product={{
        handle: product.handle,
        name: productDisplayName(product) || product.title,
        brand: product.extended.brand || product.vendor,
        photos
      }}
      groups={groups}
      freePreviews={DOLLVUE_FREE_PREVIEWS}
      initialRemaining={usage.remaining}
      verifiedEmail={maskedEmail(session.email)}
      live={usage.available && Boolean(process.env.VENICE_API_KEY) && process.env.DOLLVUE_ENABLED === "true"}
    />
  );
}
