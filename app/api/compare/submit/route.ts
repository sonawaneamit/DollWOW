import { NextResponse } from "next/server";
import { z } from "zod";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";
import { decidePriceMatch } from "@/lib/compare/priceMatch";
import { extractProductFromHtml } from "@/lib/compare/extractProduct";
import { fetchPublicPage } from "@/lib/compare/fetchPage";
import { matchCatalog } from "@/lib/compare/matchCatalog";
import { validatePublicHttpUrl } from "@/lib/compare/urlSafety";
import { createPriceMatchDiscountCode } from "@/lib/shopify/admin";
import { getProducts } from "@/lib/shopify/storefront";
import { saveComparisonRequest, saveSupportLead } from "@/lib/supabase/repositories";
import { hasShopifyAdminEnv } from "@/lib/utils/env";
import type { ComparisonRequest, ParsedListing } from "@/types/comparison";

const schema = z.object({
  inputUrl: z.string().url(),
  email: z.string().email().optional()
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const validation = validatePublicHttpUrl(input.inputUrl);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    let parsed: ParsedListing | null = null;
    try {
      const html = await fetchPublicPage(input.inputUrl);
      parsed = extractProductFromHtml(html, input.inputUrl);
    } catch {
      parsed = {
        inputUrl: input.inputUrl,
        sourceDomain: validation.url.hostname.replace(/^www\./, ""),
        imageUrls: [],
        lastCheckedAt: new Date().toISOString()
      };
    }

    const products = await getProducts();
    const match = matchCatalog(parsed, products);
    const priceMatch = decidePriceMatch({ parsed, product: match.product, confidence: match.confidence });
    if (priceMatch.allowed && match.product && hasShopifyAdminEnv()) {
      const variant = match.product.variants.find((item) => item.availableForSale);
      if (variant && priceMatch.discountPercent && priceMatch.expiresAt) {
        const code = `DOLLWOW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const discount = await createPriceMatchDiscountCode({
          title: `DollWow price match for ${match.product.title}`,
          code,
          startsAt: new Date().toISOString(),
          endsAt: priceMatch.expiresAt,
          percentage: priceMatch.discountPercent,
          productVariantIds: [variant.id]
        });
        priceMatch.discountCode = code;
        priceMatch.discountProviderId = discount?.id;
      }
    } else if (priceMatch.allowed && !hasShopifyAdminEnv()) {
      priceMatch.allowed = false;
      priceMatch.reasons.push("Shopify Admin credentials are needed before a discount code can be issued.");
    }
    const comparison: ComparisonRequest = {
      id: crypto.randomUUID(),
      inputUrl: input.inputUrl,
      customerEmail: input.email,
      status: priceMatch.allowed ? "discount_ready" : match.product ? "matched" : "needs_review",
      confidence: match.confidence,
      parsed,
      matchProductId: match.product?.id,
      priceMatch,
      createdAt: new Date().toISOString()
    };

    await saveComparisonRequest(comparison);
    if (!priceMatch.allowed && input.email) {
      await saveSupportLead({
        sourceFlow: "compare",
        email: input.email,
        question: `Please verify this listing: ${input.inputUrl}`,
        productIds: match.product ? [match.product.id] : []
      });
    }
    trackServerEvent(analyticsEvents.submitCompareListing, {
      input_domain: parsed.sourceDomain,
      has_email: Boolean(input.email),
      confidence: match.confidence
    });
    return NextResponse.json({ id: comparison.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit comparison." },
      { status: 400 }
    );
  }
}
