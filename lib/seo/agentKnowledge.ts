import { collectionPresets } from "@/lib/catalog/filters";
import { getLearningArticles } from "@/lib/learn/content";

export type AgentKnowledgeRecord = {
  id: string;
  type: "core" | "collection" | "guide" | "policy" | "tool" | "feed";
  title: string;
  url: string;
  summary: string;
  markdownUrl?: string;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

const staticRecords: AgentKnowledgeRecord[] = [
  {
    id: "home",
    type: "core",
    title: "DollWow",
    url: siteUrl,
    summary: "Compare, customize, and order premium companion dolls with private support and clear buying guidance."
  },
  {
    id: "shop",
    type: "core",
    title: "Shop sex dolls",
    url: `${siteUrl}/shop/sex-dolls`,
    summary: "Browse the live DollWow catalog by brand, material, size, body style, availability, and customization path."
  },
  {
    id: "learn",
    type: "core",
    title: "DollWow Learning Center",
    url: `${siteUrl}/learn`,
    summary: "Buyer guides covering materials, sizing, care, privacy, brands, cost, customization, and ownership."
  },
  {
    id: "help-me-choose",
    type: "tool",
    title: "Help me choose",
    url: `${siteUrl}/help-me-choose`,
    summary: "A guided product finder for narrowing the catalog around a buyer's priorities."
  },
  {
    id: "dollvue",
    type: "tool",
    title: "DollVue",
    url: `${siteUrl}/dollvue`,
    markdownUrl: `${siteUrl}/markdown/dollvue`,
    summary: "Preview supported appearance choices on real DollWow product photography before ordering."
  },
  {
    id: "compare",
    type: "tool",
    title: "Compare products",
    url: `${siteUrl}/compare-products`,
    summary: "Compare current DollWow products and their live catalog details side by side."
  },
  {
    id: "care-for-life",
    type: "policy",
    title: "DollWow Care for Life",
    url: `${siteUrl}/care-for-life`,
    summary: "Ownership support, care guidance, and repair coordination available with DollWow dolls under the published terms."
  },
  {
    id: "price-match",
    type: "policy",
    title: "Best Price Guarantee",
    url: `${siteUrl}/best-price-guarantee`,
    summary: "Published terms for requesting a legitimate price review before or after purchase."
  },
  {
    id: "buyer-protection",
    type: "policy",
    title: "Buyer Protection",
    url: `${siteUrl}/buyer-protection`,
    summary: "DollWow's published buying, build-review, arrival, and support protections."
  },
  {
    id: "shipping",
    type: "policy",
    title: "Shipping",
    url: `${siteUrl}/shipping`,
    summary: "Current shipping, delivery, discretion, and order-handling guidance."
  },
  {
    id: "returns",
    type: "policy",
    title: "Returns",
    url: `${siteUrl}/returns`,
    summary: "Current DollWow return and resolution terms."
  }
];

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

const stopWords = new Set([
  "a", "about", "all", "an", "and", "are", "best", "buy", "can", "doll", "dolls", "for", "from", "get",
  "guide", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or", "sex", "shop", "that", "the", "to", "what",
  "where", "which", "with"
]);

export function getAgentKnowledgeRecords(): AgentKnowledgeRecord[] {
  const collectionRecords = priorityCollections.flatMap((handle): AgentKnowledgeRecord[] => {
    const preset = collectionPresets[handle];
    if (!preset) return [];
    return [{
      id: `collection-${handle}`,
      type: "collection",
      title: preset.title,
      url: `${siteUrl}/shop/${handle}`,
      summary: `Current DollWow catalog collection for ${preset.title.toLowerCase()}, with live products and buyer guidance.`
    }];
  });

  const guideRecords = getLearningArticles().map((article): AgentKnowledgeRecord => ({
    id: `guide-${article.slug}`,
    type: "guide",
    title: article.title,
    url: `${siteUrl}/learn/${article.slug}`,
    markdownUrl: `${siteUrl}/markdown/learn/${article.slug}`,
    summary: article.description || article.excerpt
  }));

  return [...staticRecords, ...collectionRecords, ...guideRecords];
}

export function searchAgentKnowledge(query: string, limit = 8): AgentKnowledgeRecord[] {
  const normalizedQuery = normalize(query).slice(0, 200);
  const terms = [...new Set(normalizedQuery.split(" ").filter((term) => term.length > 1 && !stopWords.has(term)))];
  const records = getAgentKnowledgeRecords();

  if (!terms.length) return records.slice(0, limit);

  return records
    .map((record, index) => {
      const title = normalize(record.title);
      const summary = normalize(record.summary);
      const id = normalize(record.id);
      const score = terms.reduce((total, term) => {
        return total + (title.includes(term) ? 8 : 0) + (id.includes(term) ? 4 : 0) + (summary.includes(term) ? 2 : 0);
      }, 0);
      return { record, score, index };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ record }) => record);
}

export function agentKnowledgeAsText(query: string, records: AgentKnowledgeRecord[]) {
  const lines = [
    "# DollWow query results",
    "",
    `Query: ${query || "DollWow"}`,
    "",
    "Catalog and policy pages are the source of truth for current product, price, stock, shipping, and support claims.",
    ""
  ];

  if (!records.length) {
    lines.push("No close match was found. Use the site index or Learning Center:", "", `- ${siteUrl}/agent-index.json`, `- ${siteUrl}/learn`);
    return lines.join("\n");
  }

  for (const record of records) {
    lines.push(`## ${record.title}`, "", record.summary, "", `Canonical: ${record.url}`);
    if (record.markdownUrl) lines.push(`Markdown: ${record.markdownUrl}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
