import { NextResponse } from "next/server";
import { collectionPresets } from "@/lib/catalog/filters";
import { getLearningArticles } from "@/lib/learn/content";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

const priorityCollections = [
  "sex-dolls",
  "realistic-sex-dolls",
  "tpe",
  "silicone",
  "male-dolls",
  "mini-sex-dolls",
  "ready-to-ship",
  "custom"
];

const policies = [
  { label: "Buyer Protection", path: "/buyer-protection" },
  { label: "Best Price Guarantee", path: "/best-price-guarantee" },
  { label: "Shipping", path: "/shipping" },
  { label: "Returns", path: "/returns" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Editorial Policy", path: "/editorial-policy" }
];

export const revalidate = 3600;

export function GET() {
  const articles = getLearningArticles();
  const payload = {
    site: "DollWow",
    canonicalBaseUrl: siteUrl,
    description:
      "DollWow helps adults compare, customize, and order premium companion dolls with clear catalog details, private support, price-match review, and buyer protection.",
    contentBoundaries: [
      "Catalog and policy pages are the source of truth for product, price, stock, shipping, and support claims.",
      "Generated editorial visuals are educational or decorative and should not be treated as actual product photography.",
      "Health, legal, and safety topics are informational and are not a substitute for professional advice."
    ],
    contributors: [
      {
        id: "jesse",
        name: "Jesse",
        title: "Licensed Sexologist and DollWow Intimacy Education Editor",
        topics: ["care", "privacy", "buyer questions", "safety", "intimacy education"]
      },
      {
        id: "alex",
        name: "Alex",
        title: "Doll Collector and DollWow Product Educator with 20+ Years of Experience",
        topics: ["product comparison", "brand comparisons", "materials", "measurements", "customization"]
      }
    ],
    collections: priorityCollections
      .map((handle) => collectionPresets[handle] ? { handle, title: collectionPresets[handle].title, url: `${siteUrl}/shop/${handle}` } : null)
      .filter(Boolean),
    guides: articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      category: article.category,
      primaryKeyword: article.primaryKeyword,
      author: article.authorDisplayName,
      lastReviewed: article.lastReviewed,
      url: `${siteUrl}/learn/${article.slug}`
    })),
    policies: policies.map((policy) => ({
      ...policy,
      url: `${siteUrl}${policy.path}`
    })),
    tools: [
      { label: "Compare a listing", url: `${siteUrl}/compare` },
      { label: "Help me choose", url: `${siteUrl}/help-me-choose` },
      { label: "Support", url: `${siteUrl}/support` }
    ],
    feeds: [
      { label: "Sitemap", url: `${siteUrl}/sitemap.xml` },
      { label: "LLMs text map", url: `${siteUrl}/llms.txt` },
      { label: "Product feed", url: `${siteUrl}/product-feed.json` }
    ]
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
