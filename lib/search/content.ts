import { getLearningArticles } from "@/lib/learn/content";

export type SiteSearchResult = {
  id: string;
  href: string;
  title: string;
  description: string;
  kind: "Guide" | "Page";
  score: number;
};

const sitePages = [
  { href: "/help-me-choose", title: "Help me choose", description: "Get a practical shortlist based on size, material, budget, delivery, and customization.", keywords: "quiz recommendation first doll choose" },
  { href: "/care-for-life", title: "DollWow Care for Life", description: "Ownership support before the build, at arrival, and through ownership.", keywords: "care 365 repair support damage" },
  { href: "/buyer-protection", title: "Buyer protection", description: "Learn how DollWow supports build review, private checkout, shipping, and arrival issues.", keywords: "protection guarantee approval safe purchase" },
  { href: "/shipping", title: "Shipping and delivery", description: "Delivery timing, discreet packaging, warehouse orders, and custom production explained.", keywords: "shipping delivery warehouse discreet packaging timing" },
  { href: "/returns", title: "Returns and order changes", description: "Review return eligibility, order changes, and what to do when an order arrives.", keywords: "return refund cancel cancellation change order" },
  { href: "/best-price-guarantee", title: "Best price guarantee", description: "How DollWow reviews legitimate like-for-like offers for the same doll configuration.", keywords: "price match cheaper discount guarantee" },
  { href: "/authorized-vendors", title: "Brand certifications", description: "See the brand approvals and authorization evidence available to DollWow shoppers.", keywords: "certificate authorized seller dealer approval" },
  { href: "/how-ordering-works", title: "How ordering works", description: "Follow the path from choosing a doll through build review, production, approval, and delivery.", keywords: "order production process factory photos checkout" },
  { href: "/faq", title: "Frequently asked questions", description: "Answers about dolls, customization, payment, shipping, privacy, and ownership.", keywords: "faq questions help answers" },
  { href: "/support", title: "Contact DollWow support", description: "Ask a product, ordering, delivery, care, or repair question.", keywords: "support contact specialist help chat" },
  { href: "/compare", title: "Compare dolls", description: "Compare photos, price, material, measurements, availability, and product details side by side.", keywords: "comparison compare products specs" },
  { href: "/warehouse", title: "Ready-to-ship inventory", description: "Browse dolls currently listed for faster dispatch by warehouse region.", keywords: "ready stock warehouse usa eu canada australia" },
  { href: "/learn", title: "Learning Center", description: "Practical buying, comparison, care, repair, material, and ownership guides.", keywords: "blog articles guides learn education" },
  { href: "/why-dollwow", title: "Why DollWow", description: "Learn how DollWow approaches product clarity, ordering support, and ownership care.", keywords: "about company trust why" }
] as const;

export function searchSiteContent(query: string, limit = 6): SiteSearchResult[] {
  const terms = normalize(query).split(" ").filter((term) => term.length > 1);
  if (!terms.length) return [];

  const pages = sitePages.map((page) => ({
    id: `page:${page.href}`,
    href: page.href,
    title: page.title,
    description: page.description,
    kind: "Page" as const,
    score: scoreText(terms, page.title, page.description, page.keywords)
  }));

  const guides = getLearningArticles().map((article) => ({
    id: `guide:${article.slug}`,
    href: `/learn/${article.slug}`,
    title: article.title,
    description: article.description || article.excerpt,
    kind: "Guide" as const,
    score: scoreText(
      terms,
      article.title,
      article.description,
      article.primaryKeyword,
      article.secondaryKeywords.join(" "),
      article.category,
      article.body
    )
  }));

  return [...pages, ...guides]
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

function scoreText(terms: string[], title: string, description: string, ...supporting: string[]) {
  const normalizedTitle = normalize(title);
  const normalizedDescription = normalize(description);
  const normalizedSupporting = normalize(supporting.join(" "));
  const phrase = terms.join(" ");
  let score = normalizedTitle.includes(phrase) ? 60 : 0;

  for (const term of terms) {
    if (normalizedTitle === term) score += 45;
    else if (normalizedTitle.startsWith(term)) score += 28;
    else if (normalizedTitle.includes(term)) score += 20;
    if (normalizedDescription.includes(term)) score += 7;
    if (normalizedSupporting.includes(term)) score += 2;
  }

  return score;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
