import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { DollVue } from "@/components/dollvue/DollVue";
import { DollVueAccessGate } from "@/components/dollvue/DollVueAccessGate";
import { DOLLVUE_FREE_PREVIEWS, dollVueGroups } from "@/lib/dollvue/config";
import { resolveCurrentDollVueEligibility } from '@/lib/dollvue/eligibility';
import { dollVueUsageForEmail } from "@/lib/dollvue/accountUsage";
import { maskedEmail, verifyDollVueSessionValue, DOLLVUE_SESSION_COOKIE } from "@/lib/dollvue/session";
import { productDisplayName } from "@/lib/catalog/naming";
import { protectedProductImageUrl, productImageSources } from "@/lib/catalog/productImage";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { publicCustomizationConfig } from '@/lib/catalog/publicPayload';

export const metadata: Metadata = {
  title: "DollVue™ | See Your Doll Your Way",
  robots: { index: false, follow: false, nocache: true }
};
export const dynamic = "force-dynamic";

export default async function DollVueProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProductByHandle(handle, { cache: 'no-store', strict: true });
  if (!product) notFound();
  const eligibility = await resolveCurrentDollVueEligibility(product);
  if (!eligibility.available) notFound();
  const session = verifyDollVueSessionValue((await cookies()).get(DOLLVUE_SESSION_COOKIE)?.value);
  if (!session) return <div className="dollvue-access-shell"><DollVueAccessGate handle={handle} /></div>;
  const usage = await dollVueUsageForEmail(session.email);
  const groups = dollVueGroups(publicCustomizationConfig(eligibility.config));
  const sources = productImageSources(product);
  const photos = eligibility.sourcePositions.map(position => ({
    position,
    url: protectedProductImageUrl(product.handle, position, "card"),
    alt: sources[position].altText || `${productDisplayName(product) || product.title} reference photo ${position + 1}`
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
