import { NextResponse } from "next/server";
import { z } from "zod";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";
import { decidePriceMatch } from "@/lib/compare/priceMatch";
import { extractProductFromHtml } from "@/lib/compare/extractProduct";
import { sendPriceMatchAdminAlert } from "@/lib/email/adminAlerts";
import { fetchPublicPage } from "@/lib/compare/fetchPage";
import { matchCatalog } from "@/lib/compare/matchCatalog";
import { validatePublicHttpUrl } from "@/lib/compare/urlSafety";
import { createPriceMatchDiscountCode } from "@/lib/shopify/admin";
import { getProducts } from "@/lib/shopify/storefront";
import { productPublicTitle } from "@/lib/catalog/naming";
import { getPriceMatchConfig, saveComparisonRequest, saveSupportLead } from "@/lib/supabase/repositories";
import { uploadPriceMatchEvidence } from "@/lib/supabase/storage";
import { hasShopifyAdminEnv } from "@/lib/utils/env";
import type { ComparisonRequest, ParsedListing } from "@/types/comparison";

const schema = z.object({
  inputUrl: z.string().url(),
  quotedPrice: z.coerce.number().positive().optional(),
  quotedCurrency: z.enum(["USD", "CAD", "GBP", "EUR"]).optional(),
  requestedDiscountAmount: z.coerce.number().min(0).optional(),
  email: z.string().email().optional(),
  screenshotUrl: z.string().url().optional(),
  targetProductHandle: z.string().min(1).optional(),
  targetProductTitle: z.string().min(1).optional()
});

export async function POST(request: Request) {
  try {
    const input = await parseCompareInput(request);
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

    const [products, priceMatchConfig] = await Promise.all([getProducts({ first: 2000 }), getPriceMatchConfig()]);
    const targetProduct = input.targetProductHandle ? products.find((item) => item.handle === input.targetProductHandle) : undefined;
    const match = matchCatalog(parsed, products);
    const matchedProduct = targetProduct ?? match.product;
    const confidence = targetProduct ? "high" : match.confidence;
    const priceMatch = decidePriceMatch({
      parsed,
      product: matchedProduct,
      confidence,
      approvedVendors: priceMatchConfig.approvedVendors,
      rules: priceMatchConfig.rules
    });
    const detectedPrice = parsed?.price ?? parsed?.salePrice ?? null;
    if (input.quotedPrice && detectedPrice) {
      const delta = Math.abs(input.quotedPrice - detectedPrice);
      if (delta > Math.max(25, detectedPrice * 0.05)) {
        priceMatch.allowed = false;
        priceMatch.reasons.unshift(`The page scrape found ${detectedPrice}, which does not closely match the quoted price of ${input.quotedPrice}.`);
      }
    } else if (input.quotedPrice && !detectedPrice) {
      priceMatch.reasons.unshift(`The quoted price was ${input.quotedPrice}, but the page price could not be verified automatically.`);
    }
    if (input.screenshotUrl) {
      priceMatch.allowed = false;
      priceMatch.reasons.unshift("A configured-cart screenshot was included, so this request is queued for team review instead of auto-matching.");
    }
    if (priceMatch.allowed && matchedProduct && hasShopifyAdminEnv()) {
      const variant = matchedProduct.variants.find((item) => item.availableForSale);
      if (variant && priceMatch.discountPercent && priceMatch.expiresAt) {
        const code = `DOLLWOW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const discount = await createPriceMatchDiscountCode({
          title: `DollWow price match for ${productPublicTitle(matchedProduct)}`,
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
    const matchProductId = targetProduct ? targetProduct.id : priceMatch.allowed ? matchedProduct?.id : undefined;
    const comparison: ComparisonRequest = {
      id: crypto.randomUUID(),
      inputUrl: input.inputUrl,
      customerEmail: input.email,
      quotedPrice: input.quotedPrice,
      quotedCurrency: input.quotedCurrency ?? parsed?.currency ?? "USD",
      requestedDiscountAmount: input.requestedDiscountAmount,
      screenshotUrl: input.screenshotUrl,
      targetProductHandle: input.targetProductHandle,
      targetProductTitle: input.targetProductTitle,
      status: priceMatch.allowed ? "discount_ready" : matchProductId ? "matched" : "needs_review",
      adminStatus: "new",
      confidence,
      parsed,
      matchProductId,
      priceMatch,
      createdAt: new Date().toISOString()
    };

    await saveComparisonRequest(comparison);
    await sendPriceMatchAdminAlert(comparison);
    if (!priceMatch.allowed && input.email) {
      await saveSupportLead({
        sourceFlow: "compare",
        email: input.email,
        question: `Please verify this listing: ${input.inputUrl}${input.quotedPrice ? ` (quoted price: ${input.quotedCurrency ?? parsed?.currency ?? "USD"} ${input.quotedPrice})` : ""}${input.requestedDiscountAmount ? ` (requested discount: ${input.quotedCurrency ?? parsed?.currency ?? "USD"} ${input.requestedDiscountAmount})` : ""}${input.screenshotUrl ? ` (evidence: ${input.screenshotUrl})` : ""}`,
        productIds: targetProduct ? [targetProduct.id] : []
      });
    }
    trackServerEvent(analyticsEvents.submitCompareListing, {
      input_domain: parsed.sourceDomain,
      has_email: Boolean(input.email),
      confidence
    });
    return NextResponse.json({ id: comparison.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit comparison." },
      { status: 400 }
    );
  }
}

async function parseCompareInput(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const screenshotFile = formData.get("screenshotFile");
    let screenshotUrl: string | undefined;
    if (screenshotFile instanceof File && screenshotFile.size > 0) {
      const uploaded = await uploadPriceMatchEvidence(screenshotFile);
      screenshotUrl = uploaded.publicUrl;
    }

    return schema.parse({
      inputUrl: typeof formData.get("inputUrl") === "string" ? formData.get("inputUrl") : "",
      quotedPrice: typeof formData.get("quotedPrice") === "string" ? formData.get("quotedPrice") : undefined,
      quotedCurrency: typeof formData.get("quotedCurrency") === "string" ? formData.get("quotedCurrency") : undefined,
      requestedDiscountAmount:
        typeof formData.get("requestedDiscountAmount") === "string" ? formData.get("requestedDiscountAmount") : undefined,
      email: typeof formData.get("email") === "string" ? formData.get("email") : undefined,
      screenshotUrl,
      targetProductHandle: typeof formData.get("targetProductHandle") === "string" ? formData.get("targetProductHandle") : undefined,
      targetProductTitle: typeof formData.get("targetProductTitle") === "string" ? formData.get("targetProductTitle") : undefined
    });
  }

  return schema.parse(await request.json());
}
