import type { MetadataRoute } from "next";
import { collectionPresets } from "@/lib/catalog/filters";
import { getLearningArticles } from "@/lib/learn/content";
import { getProducts } from "@/lib/shopify/storefront";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

const staticRoutes = [
  "",
  "/shop",
  "/learn",
  "/editorial-policy",
  "/customize",
  "/warehouse",
  "/help-me-choose",
  "/compare",
  "/why-dollwow",
  "/how-ordering-works",
  "/buyer-protection",
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
  "/adult-only"
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await getProducts({ first: 2200 });
  const articles = getLearningArticles();

  const staticEntries = staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7
  })) satisfies MetadataRoute.Sitemap;

  const collectionEntries = Object.keys(collectionPresets)
    .sort()
    .map((handle) => ({
      url: `${siteUrl}/shop/${handle}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8
    })) satisfies MetadataRoute.Sitemap;

  const productEntries = products
    .filter((product) => product.handle)
    .map((product) => ({
      url: `${siteUrl}/products/${product.handle}`,
      lastModified: product.extended.stockLastCheckedAt ? new Date(product.extended.stockLastCheckedAt) : now,
      changeFrequency: "weekly",
      priority: 0.65
    })) satisfies MetadataRoute.Sitemap;

  const learnEntries = articles.map((article) => ({
    url: `${siteUrl}/learn/${article.slug}`,
    lastModified: new Date(article.lastReviewed),
    changeFrequency: "monthly",
    priority: 0.75
  })) satisfies MetadataRoute.Sitemap;

  return [...staticEntries, ...collectionEntries, ...productEntries, ...learnEntries];
}
