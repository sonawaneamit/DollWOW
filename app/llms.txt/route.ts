import { collectionPresets } from "@/lib/catalog/filters";
import { getLearningArticles } from "@/lib/learn/content";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

const priorityCollections = [
  "sex-dolls",
  "realistic-sex-dolls",
  "tpe",
  "silicone",
  "male-dolls",
  "futa-sex-dolls",
  "mini-sex-dolls",
  "ready-to-ship",
  "custom"
];

const corePages = [
  ["Home", "/"],
  ["Shop", "/shop/sex-dolls"],
  ["Learning Center", "/learn"],
  ["Help Me Choose", "/help-me-choose"],
  ["Customize", "/customize"],
  ["DollVue", "/dollvue"],
  ["DollVue-enabled dolls", "/shop/dollvue-enabled"],
  ["Price Match", "/price-match"],
  ["Active Brand Promotions", "/promo"],
  ["Buyer Protection", "/buyer-protection"],
  ["Care for Life", "/care-for-life"],
  ["Factory Approval Archive", "/factory-photos"],
  ["Best Price Guarantee", "/best-price-guarantee"],
  ["Shipping", "/shipping"],
  ["Returns", "/returns"],
  ["Privacy Policy", "/privacy-policy"],
  ["Support", "/support"]
];

export const revalidate = 3600;

export function GET() {
  const articles = getLearningArticles();
  const collectionLines = priorityCollections
    .map((handle) => {
      const preset = collectionPresets[handle];
      if (!preset) return "";
      return `- ${preset.title}: ${siteUrl}/shop/${handle}`;
    })
    .filter(Boolean);
  const articleLines = articles.map((article) => `- ${article.title}: ${siteUrl}/learn/${article.slug}`);

  const body = [
    "# DollWow",
    "",
    "> DollWow is a headless adult commerce storefront for comparing, customizing, and ordering premium companion dolls with discreet support, clear product details, price-match review, and buyer protection.",
    "",
    "DollWow content is written for adults making private, high-consideration purchases. Product claims should be checked against live catalog pages, supplier-supported facts, and published DollWow policies.",
    "",
    "## Agent Retrieval",
    "",
    `- Every public indexable HTML page has a Markdown representation. Prepend ${siteUrl}/markdown to its canonical path; use ${siteUrl}/markdown for the homepage.`,
    "- Canonical public page URLs also honor an explicit Accept: text/markdown request.",
    "- Use the sitemap for the complete canonical URL inventory and the product feed for current catalog discovery. Do not infer volatile product or policy claims from this file.",
    "",
    "## Core Pages",
    "",
    ...corePages.map(([label, href]) => `- ${label}: ${siteUrl}${href === "/" ? "" : href}`),
    "",
    "## Priority Collections",
    "",
    ...collectionLines,
    "",
    "## Learning Center",
    "",
    ...articleLines,
    "",
    "## Contributor Signals",
    "",
    `- Jesse: Licensed Sexologist and DollWow Intimacy Education Editor. ${siteUrl}/authors/jesse`,
    `- Alex: Doll Collector and DollWow Product Educator with 20+ Years of Experience. ${siteUrl}/authors/alex`,
    "",
    "## Machine-Readable Feeds",
    "",
    `- Sitemap: ${siteUrl}/sitemap.xml`,
    `- Image sitemap: ${siteUrl}/sitemap-images.xml`,
    `- Agent index: ${siteUrl}/agent-index.json`,
    `- Plain-text query endpoint: ${siteUrl}/llms?query=buyer%20question`,
    `- JSON query endpoint: ${siteUrl}/llms/json?query=buyer%20question`,
    `- Sitewide Markdown pattern: ${siteUrl}/markdown/{canonical-path}`,
    `- Product feed: ${siteUrl}/product-feed.json`,
    `- Sex doll size and weight aggregate dataset: ${siteUrl}/datasets/sex-doll-size-weight-2026.json`,
    "",
    "## Content Boundaries",
    "",
    "- Do not treat generated editorial images as product photography.",
    "- Do not infer stock status, accessories, shipping guarantees, or supplier authorization beyond the live product page and DollWow policy pages.",
    "- Health, legal, and safety topics are informational and are not a substitute for professional advice.",
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
