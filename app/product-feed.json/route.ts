import { NextResponse } from "next/server";
import { productPublicTitle } from "@/lib/catalog/naming";
import { getProducts } from "@/lib/shopify/storefront";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

export const revalidate = 3600;

export async function GET() {
  const products = await getProducts({ first: 2200 });
  const payload = {
    site: "DollWow",
    canonicalBaseUrl: siteUrl,
    generatedAt: new Date().toISOString(),
    productCount: products.length,
    products: products.map((product) => ({
      handle: product.handle,
      title: productPublicTitle(product),
      canonicalUrl: `${siteUrl}/products/${product.handle}`,
      brand: product.extended.brand || product.vendor || null,
      material: product.extended.material || null,
      bodyType: product.extended.bodyType || null,
      heightCm: product.extended.heightCm || null,
      weightLb: product.extended.weightLb || null,
      cupSize: product.extended.cupSize || null,
      priceRange: {
        min: product.priceRange.minVariantPrice,
        max: product.priceRange.maxVariantPrice
      },
      stockStatus: product.extended.stockStatus || null,
      customAvailable: product.extended.customAvailable ?? null,
      deliveryEstimate: product.extended.deliveryEstimate || null,
      warehouseCountry: product.extended.warehouseCountry || null,
      stockLastCheckedAt: product.extended.stockLastCheckedAt || null,
      image: product.featuredImage
        ? {
            url: product.featuredImage.url,
            altText: product.featuredImage.altText || productPublicTitle(product)
          }
        : null
    }))
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
