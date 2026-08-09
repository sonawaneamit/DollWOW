import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { getSearchProducts } from "@/lib/shopify/storefront";
import { productPublicTitle } from "@/lib/catalog/naming";
import { parseCatalogSearchQuery, rankCatalogProducts } from "@/lib/search/catalog";
import { shopifyQueryForCatalogSearch } from "@/lib/catalog/filters";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() || "";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 12), 1), 36);
  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
  const rateLimit = await checkRateLimit({
    scope: "catalog-search",
    identifier,
    limit: 60,
    windowSeconds: 60,
    storage: "memory"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many searches. Please try again shortly.", resetAt: rateLimit.resetAt },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  // Ask Shopify for a small candidate set, then apply DollWow's deterministic
  // ranking. Pulling every product and configurator made ordinary model-name
  // searches slow enough to fail in a serverless request.
  const products = await getSearchProducts({
    first: 48,
    query: shopifyQueryForCatalogSearch(query),
    revalidate: 86_400
  });
  const ranked = rankCatalogProducts(products, query, limit);
  const parsed = parseCatalogSearchQuery(query);

  return NextResponse.json(
    {
      query,
      parsed,
      results: ranked.map(({ product, score }) => ({
        score,
        id: product.id,
        handle: product.handle,
        title: productPublicTitle(product),
        brand: product.extended.brand || product.vendor,
        material: product.extended.material,
        heightCm: product.extended.heightCm,
        weightLb: product.extended.weightLb,
        cupSize: product.extended.cupSize,
        stockStatus: product.extended.stockStatus,
        price: product.priceRange.minVariantPrice,
        image: product.featuredImage
      }))
    },
    {
      headers: {
        ...rateLimitHeaders(rateLimit),
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
      }
    }
  );
}

function rateLimitHeaders(rateLimit: { limit: number; remaining: number; resetAt: string }) {
  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": rateLimit.resetAt
  };
}
