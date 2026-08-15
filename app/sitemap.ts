import type { MetadataRoute } from "next";
import { brandHubHandles } from "@/lib/catalog/brandSeo";
import { collectionPresets, isIndexableShopCollectionHandle } from "@/lib/catalog/filters";
import { getLearningArticles } from "@/lib/learn/content";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";
import { getCatalogBrand } from "@/lib/catalog/brands";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

const staticRoutes = [
  "",
  "/brands",
  "/learn",
  "/authors/jesse",
  "/authors/alex",
  "/customize",
  "/warehouse",
  "/help-me-choose",
  "/compare",
  "/why-dollwow",
  "/authorized-vendors",
  "/how-ordering-works",
  "/buyer-protection",
  "/care-for-life",
  "/factory-photos",
  "/dollvue",
  "/best-price-guarantee",
  "/price-match",
  "/scam-alert",
  "/shipping",
  "/shipping-protection",
  "/returns",
  "/privacy-policy",
  "/faq",
  "/support",
  "/supplier",
  "/adult-only",
  "/datasets/sex-doll-size-weight-2026.json"
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const products = await getSeoCatalogProducts({ first: 5000 });
  const articles = getLearningArticles();

  const staticEntries = staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  })) satisfies MetadataRoute.Sitemap;

  const collectionEntries = Object.keys(collectionPresets)
    .filter((handle) => !getCatalogBrand(handle))
    .filter(isIndexableShopCollectionHandle)
    .sort()
    .map((handle) => ({
      url: `${siteUrl}/shop/${handle}`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.8
    })) satisfies MetadataRoute.Sitemap;

  const brandEntries = brandHubHandles
    .sort()
    .map((handle) => ({
      url: `${siteUrl}/brands/${handle}`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.78
    })) satisfies MetadataRoute.Sitemap;

  const productEntries = products
    .filter((product) => product.handle)
    .map((product) => ({
      url: `${siteUrl}/products/${product.handle}`,
      ...(product.extended.stockLastCheckedAt ? { lastModified: new Date(product.extended.stockLastCheckedAt) } : {}),
      changeFrequency: "weekly",
      priority: 0.65
    })) satisfies MetadataRoute.Sitemap;

  const learnEntries = articles.map((article) => ({
    url: `${siteUrl}/learn/${article.slug}`,
    lastModified: new Date(article.lastReviewed),
    changeFrequency: "monthly",
    priority: 0.75
  })) satisfies MetadataRoute.Sitemap;

  return [...staticEntries, ...collectionEntries, ...brandEntries, ...productEntries, ...learnEntries];
}
