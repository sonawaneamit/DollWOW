import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { logAIUsageEvent } from "@/lib/ai/usage";
import { validatePublicHttpUrl } from "@/lib/compare/urlSafety";
import { runOpenAIVisualCatalogSearch } from "@/lib/search/openaiVisualSearch";
import { findLocalVisualMatches } from "@/lib/search/localVisualIndex";
import { buildCatalogSuggestions, runApifyVisualSearch } from "@/lib/search/visualSearch";
import { getProducts } from "@/lib/shopify/storefront";
import { saveVisualSearchRequest } from "@/lib/supabase/repositories";
import { uploadVisualSearchAsset } from "@/lib/supabase/storage";
import { env } from "@/lib/utils/env";
import type { VisualSearchRequestRecord } from "@/types/visualSearch";

const schema = z.object({
  imageUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
  mode: z.enum(["customer_lookup", "import_review"]).default("customer_lookup"),
  uploadedImageBytes: z.instanceof(ArrayBuffer).optional()
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
  const rateLimit = await checkRateLimit({
    scope: "visual-search",
    identifier,
    limit: 15,
    windowSeconds: 300
  });

  if (!rateLimit.allowed) {
    await logAIUsageEvent({
      feature: "visual-search",
      provider: "deterministic",
      route: "/api/search/visual",
      status: "blocked",
      ip: identifier,
      metadata: { reason: "rate_limit" }
    });

    return NextResponse.json(
      { error: "Too many visual searches. Please wait a few minutes and try again.", resetAt: rateLimit.resetAt },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    const input = await parseVisualSearchInput(request);
    const validation = validatePublicHttpUrl(input.imageUrl);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.reason }, { status: 400, headers: rateLimitHeaders(rateLimit) });
    }

    const products = await getProducts({ first: 2200, includeCustomizationGroups: false });
    let results = [] as Awaited<ReturnType<typeof runApifyVisualSearch>>;
    let catalogSuggestions = input.uploadedImageBytes ? await findLocalVisualMatches(products, input.uploadedImageBytes) : [];
    let status: VisualSearchRequestRecord["status"] = "new";
    let notes: string | undefined;
    let provider = "deterministic";

    if (catalogSuggestions.length) {
      status = "processed";
      notes = "Matched a DollWow catalog image.";
      provider = "dollwow_local_visual_index";
      results = catalogSuggestions.map((suggestion, index) => {
        const resultUrl = new URL(`/products/${suggestion.handle}`, env.NEXT_PUBLIC_SITE_URL);
        return {
          rank: index + 1,
          resultUrl: resultUrl.toString(),
          resultDomain: resultUrl.hostname.replace(/^www\./, ""),
          title: suggestion.title,
          snippet: "Matched a DollWow catalog image.",
          imageUrl: suggestion.imageUrl,
          confidence: 1,
          rawResult: { provider: "dollwow_local_visual_index", handle: suggestion.handle }
        };
      });
    } else {
      try {
        const openaiMatch = await runOpenAIVisualCatalogSearch({
          imageUrl: validation.url.toString(),
          products
        });
        if (openaiMatch.suggestions.length) {
          provider = "openai_visual_rerank";
          status = "processed";
          notes = "Matched from the uploaded photo.";
          results = openaiMatch.results;
          catalogSuggestions = openaiMatch.suggestions;
        }
      } catch (error) {
        notes = error instanceof Error ? error.message : "DollWow image matching is currently unavailable.";
      }

      if (!catalogSuggestions.length) {
      try {
        provider = "apify_google_lens";
        results = await runApifyVisualSearch({ imageUrl: validation.url.toString() });
        status = results.length ? "processed" : "needs_review";
        if (!results.length) notes = "Provider returned no usable public matches.";
      } catch (error) {
        status = "provider_unavailable";
        notes = error instanceof Error ? error.message : "Visual-search provider is currently unavailable.";
      }

      catalogSuggestions = results.length ? buildCatalogSuggestions(products, results) : [];
      }
    }

    const record: VisualSearchRequestRecord = {
      id: crypto.randomUUID(),
      imageUrl: validation.url.toString(),
      customerEmail: input.customerEmail,
      mode: input.mode,
      status,
      notes,
      results,
      catalogSuggestions,
      createdAt: new Date().toISOString()
    };

    await saveVisualSearchRequest(record);
    await logAIUsageEvent({
      feature: "visual-search",
      provider,
      route: "/api/search/visual",
      status: status === "provider_unavailable" ? "fallback" : "success",
      ip: identifier,
      metadata: {
        mode: input.mode,
        requestStatus: status,
        resultCount: results.length,
        catalogSuggestionCount: catalogSuggestions.length
      }
    });

    return NextResponse.json(record, { headers: rateLimitHeaders(rateLimit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Visual search could not be completed.";
    await logAIUsageEvent({
      feature: "visual-search",
      provider: "visual_search",
      route: "/api/search/visual",
      status: "error",
      ip: identifier,
      metadata: { message }
    });
    return NextResponse.json({ error: message }, { status: 400, headers: rateLimitHeaders(rateLimit) });
  }
}

async function parseVisualSearchInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const imageFile = formData.get("imageFile");
    const imageUrlRaw = formData.get("imageUrl");
    const customerEmailRaw = formData.get("customerEmail");
    const modeRaw = formData.get("mode");

    if (imageFile instanceof File && imageFile.size > 0) {
      const uploadedImageBytes = await imageFile.arrayBuffer();
      const uploaded = await uploadVisualSearchAsset(imageFile);
      return schema.parse({
        imageUrl: uploaded.publicUrl,
        customerEmail: typeof customerEmailRaw === "string" ? customerEmailRaw : undefined,
        mode: typeof modeRaw === "string" ? modeRaw : "customer_lookup",
        uploadedImageBytes
      });
    }

    return schema.parse({
      imageUrl: typeof imageUrlRaw === "string" ? imageUrlRaw : "",
      customerEmail: typeof customerEmailRaw === "string" ? customerEmailRaw : undefined,
      mode: typeof modeRaw === "string" ? modeRaw : "customer_lookup"
    });
  }

  return schema.parse(await request.json());
}

function rateLimitHeaders(rateLimit: { limit: number; remaining: number; resetAt: string }) {
  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": rateLimit.resetAt
  };
}
