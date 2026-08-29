import fs from "node:fs";
import path from "node:path";
import authorsData from "@/content/editorial/authors.json";
import { env } from "@/lib/utils/env";

export type LearnAuthor = {
  displayName: string;
  title: string;
  gender: "female" | "male";
  pronouns: string;
  profilePath: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  privacyNote: string;
  shortBio: string;
  bio: string;
  voice: string;
};

export type LearnArticle = {
  title: string;
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  description: string;
  category: string;
  author: string;
  authorDisplayName: string;
  authorTitle: string;
  status: string;
  reviewOwner: string;
  lastReviewed: string;
  featuredImage: string;
  featuredImageAlt: string;
  body: string;
  excerpt: string;
};

const ROOT = process.cwd();
const DRAFT_DIR = path.join(ROOT, "content", "learn", "drafts");
const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
const internalHeadings = [
  "DollWow Catalog Links To Add",
  "Product Links To Add",
  "Product Examples To Add After Review",
  "Product Picks To Add After Review",
  "Collection Links To Add",
  "Internal Links To Add",
  "Editorial Review Notes"
];

export function getLearnAuthors() {
  return authorsData as Record<string, LearnAuthor>;
}

export function getLearnAuthor(key: string) {
  return getLearnAuthors()[key];
}

export function learnAuthorUrl(key: string) {
  const author = getLearnAuthor(key);
  return `${siteUrl}${author?.profilePath ?? `/authors/${key}`}`;
}

export function getLearningArticles() {
  if (!fs.existsSync(DRAFT_DIR)) return [];
  return fs
    .readdirSync(DRAFT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readArticle(path.join(DRAFT_DIR, file)))
    .filter((article) => article.status === "production")
    .sort((a, b) => priority(a.slug) - priority(b.slug) || a.title.localeCompare(b.title));
}

export function getLearningArticle(slug: string) {
  return getLearningArticles().find((article) => article.slug === slug) ?? null;
}

export function learnArticleUrl(slug: string) {
  return `${siteUrl}/learn/${slug}`;
}

export function buildArticleStructuredData(article: LearnArticle) {
  const author = getLearnAuthor(article.author);
  const citations = extractExternalCitationUrls(article.body);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: learnArticleUrl(article.slug),
    datePublished: article.lastReviewed,
    dateModified: article.lastReviewed,
    author: {
      "@type": "Person",
      name: article.authorDisplayName,
      jobTitle: article.authorTitle,
      description: author?.shortBio ?? undefined,
      url: learnAuthorUrl(article.author),
      image: author?.image ? absoluteUrl(author.image) : undefined
    },
    publisher: {
      "@type": "Organization",
      name: "DollWow",
      url: siteUrl
    },
    mainEntityOfPage: learnArticleUrl(article.slug),
    image: absoluteUrl(article.featuredImage),
    keywords: [article.primaryKeyword, ...article.secondaryKeywords].join(", "),
    citation: citations.length ? citations : undefined
  };
}

export function buildArticleBreadcrumbStructuredData(article: LearnArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Learning Center", item: `${siteUrl}/learn` },
      { "@type": "ListItem", position: 3, name: article.title, item: learnArticleUrl(article.slug) }
    ]
  };
}

export function buildArticleFaqStructuredData(article: LearnArticle) {
  const faq = extractFaqItems(article.body);
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

function readArticle(filePath: string): LearnArticle {
  const raw = fs.readFileSync(filePath, "utf8");
  const { frontmatter, markdown } = parseFrontmatter(raw);
  const publicBody = publicMarkdown(markdown);
  const article = {
    title: stringValue(frontmatter.title),
    slug: stringValue(frontmatter.slug),
    primaryKeyword: stringValue(frontmatter.primaryKeyword),
    secondaryKeywords: arrayValue(frontmatter.secondaryKeywords),
    description: stringValue(frontmatter.description),
    category: stringValue(frontmatter.category),
    author: stringValue(frontmatter.author),
    authorDisplayName: stringValue(frontmatter.authorDisplayName),
    authorTitle: stringValue(frontmatter.authorTitle),
    status: stringValue(frontmatter.status),
    reviewOwner: stringValue(frontmatter.reviewOwner),
    lastReviewed: stringValue(frontmatter.lastReviewed),
    featuredImage: featuredImagePath(stringValue(frontmatter.slug)),
    featuredImageAlt: featuredImageAlt(stringValue(frontmatter.title), stringValue(frontmatter.slug)),
    body: publicBody,
    excerpt: excerpt(publicBody)
  };
  return article;
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {} as Record<string, unknown>, markdown: raw };
  const frontmatter = Object.fromEntries(
    match[1].split("\n").flatMap((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return [];
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      return [[key, parseValue(rawValue)]];
    })
  );
  return { frontmatter, markdown: match[2] };
}

function parseValue(value: string) {
  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value.replace(/^"|"$/g, "");
}

function publicMarkdown(markdown: string) {
  const lines = markdown.split("\n");
  const publicLines = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("# ")) continue;
    if (/^By\s+/.test(line)) continue;
    if (line.startsWith("## ") && internalHeadings.includes(line.replace(/^##\s+/, "").trim())) {
      while (index + 1 < lines.length && !lines[index + 1].startsWith("## ")) {
        index += 1;
      }
      continue;
    }
    publicLines.push(line);
  }
  return publicLines.join("\n").trim();
}

function extractFaqItems(markdown: string) {
  const faqStart = markdown.indexOf("## FAQs");
  if (faqStart === -1) return [];
  const faqMarkdown = markdown.slice(faqStart).split("\n## ")[0];
  const entries = faqMarkdown.split(/\n###\s+/).slice(1);
  return entries
    .map((entry) => {
      const [questionLine, ...answerLines] = entry.split("\n");
      return {
        question: questionLine.trim(),
        answer: answerLines.join(" ").replace(/\s+/g, " ").trim()
      };
    })
    .filter((item) => item.question && item.answer);
}

function extractExternalCitationUrls(markdown: string) {
  return [...new Set(
    [...markdown.matchAll(/\[[^\]]+\]\((https:\/\/[^)]+)\)/g)]
      .map((match) => match[1])
      .filter((url) => {
        try {
          return new URL(url).hostname !== new URL(siteUrl).hostname;
        } catch {
          return false;
        }
      })
  )];
}

function excerpt(markdown: string) {
  const quickAnswer = markdown.match(/## Quick Answer\n\n([\s\S]*?)(\n## |\n$)/)?.[1];
  const text = (quickAnswer || markdown)
    .replace(/^#+\s+/gm, "")
    .replace(/\|.*\|/g, "")
    .replace(/[-*]\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 190 ? `${text.slice(0, 187).replace(/\s+\S*$/, "")}...` : text;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function priority(slug: string) {
  const order = [
    "sex-doll-guide",
    "sex-doll-size-weight-guide",
    "best-sex-dolls",
    "sex-robots",
    "ai-sex-dolls",
    "tpe-vs-silicone-sex-dolls",
    "sex-doll-cost",
    "best-sex-doll-stores",
    "best-tpe-sex-dolls",
    "silicone-sex-doll-guide",
    "how-silicone-sex-dolls-are-made",
    "tpe-sex-doll-repair",
    "silicone-sex-doll-repair",
    "used-sex-dolls",
    "most-realistic-sex-dolls",
    "mini-sex-dolls",
    "male-sex-doll-buying-guide",
    "sex-doll-reviews",
    "ready-to-ship-vs-custom-sex-dolls",
    "discreet-sex-doll-shipping",
    "yourdoll-alternatives",
    "bestrealdoll-alternatives",
    "siliconwives-alternatives",
    "joylovedolls-alternatives",
    "rosemarydoll-alternatives",
    "realdoll-alternatives",
    "betterlovedoll-alternatives",
    "realsexdoll-alternatives",
    "sexdolltech-alternatives",
    "myrobotdoll-alternatives",
    "sexdollqueen-alternatives",
    "how-to-clean-a-sex-doll",
    "sex-doll-storage",
    "sex-doll-maintenance-checklist",
    "sex-doll-scams",
    "sex-doll-laws-us",
    "custom-sex-dolls",
    "implanted-hair-vs-wig",
    "standing-feet-sex-doll-guide",
    "body-heating-sex-doll-guide",
    "sex-doll-skeleton-options",
    "wm-dolls-buying-guide",
    "irontech-dolls-buying-guide",
    "starpery-dolls-buying-guide",
    "tantaly-buying-guide",
    "erovenus-dolls-review-guide",
    "zelex-dolls-buying-guide",
    "se-doll-buying-guide",
    "6ye-dolls-buying-guide"
  ];
  const index = order.indexOf(slug);
  return index === -1 ? 999 : index;
}

function featuredImagePath(slug: string) {
  const relativePath = `/images/learn/${slug}.webp`;
  const filePath = path.join(ROOT, "public", relativePath);
  return fs.existsSync(filePath) ? relativePath : "";
}

function featuredImageAlt(title: string, slug: string) {
  const altBySlug: Record<string, string> = {
    "sex-doll-guide": "Irontech Evie silicone doll in the 2026 sex doll buying guide",
    "tpe-vs-silicone-sex-dolls": "TPE and silicone doll material comparison using real DollWow catalog products",
    "sex-doll-cost": "Sex doll cost guide comparing product price, options, fulfillment, and ownership factors",
    "best-sex-dolls": "Best sex dolls buying guide featuring a selection of real DollWow catalog products",
    "best-sex-doll-stores": "Guide to choosing a reputable sex doll store using seller approval, exact product facts, protected payment, fulfillment, arrival support, and ownership care",
    "best-tpe-sex-dolls": "Six current TPE sex dolls compared by size, listed weight, availability, manufacturer, and buyer fit",
    "silicone-sex-doll-guide": "Full-silicone sex doll guide using current DollWow products to explain material, feel, care, weight, repair, and cost",
    "sex-doll-size-weight-guide": "Sex doll size and weight guide using original data from current full-size DollWow catalog listings",
    "most-realistic-sex-dolls": "Guide to evaluating realistic sex doll proportions, finish, face detail, and configuration",
    "mini-sex-dolls": "Mini sex doll size, weight, handling, and private storage guide",
    "male-sex-doll-buying-guide": "Male sex doll buying guide featuring a real DollWow catalog product",
    "sex-doll-reviews": "Sex doll review checklist for checking product photos, specifications, seller claims, and support",
    "ready-to-ship-vs-custom-sex-dolls": "Ready-to-ship and custom sex doll order paths compared",
    "discreet-sex-doll-shipping": "Discreet sex doll shipping guide covering packaging, delivery, privacy, and order checks",
    "betterlovedoll-alternatives": "Two current DollWow catalog dolls and four checks for choosing product form, material, ready or custom ordering, and a realistic handling limit",
    "realsexdoll-alternatives": "Two current DollWow catalog dolls and five close-up checks for face, eyes and hair, skin finish, hands and feet, and the exact final build",
    "sexdolltech-alternatives": "Two current DollWow catalog dolls and four checks for material, measurements, supported options, and the delivered total",
    "myrobotdoll-alternatives": "Two current male DollWow catalog dolls beside four separate interaction levels from a conventional doll to verified robotics",
    "sexdollqueen-alternatives": "Two current DollWow catalog dolls and four checks for confirming an exact ready-stock configuration",
    "yourdoll-alternatives": "A current Starpery doll and WM male doll with five checks for comparing the same body and head, material, options, delivered total, and ownership support",
    "bestrealdoll-alternatives": "A current Starpery catalog doll in a home-planning studio with handling, space, material, timing, and budget checks",
    "siliconwives-alternatives": "Two current SE Doll faces in an evidence desk showing exact-product photos, multiple angles, specifications, and written confirmation",
    "joylovedolls-alternatives": "Current Irontech Tidiane and 6YE Claudy catalog examples beside five checks for comparing male doll formats",
    "rosemarydoll-alternatives": "Current AngelKiss and Starpery catalog dolls beside an exact-match checklist for body and head, material, options, fulfillment, and ownership support",
    "realdoll-alternatives": "A current Starpery catalog doll in a premium silicone inspection spread covering sculpt, finish, construction, measurements, handling, and options",
    "tantaly-buying-guide": "Three current Tantaly torso formats with verified heights and a checklist for comparing width, depth, weight, and material",
    "erovenus-dolls-review-guide": "Three current Erovenus products illustrating product form, surface finish, complete scale, and the evidence a useful review should include",
    "piper-dolls-buying-guide": "Piper Dolls buying guide featuring the current adult Piper Lana silicone doll with TPE, silicone, compact, and full-size comparison prompts",
    "how-silicone-sex-dolls-are-made": "Visual guide to silicone doll production from sculpting and mold preparation through skeleton placement, silicone casting, hand finishing, inspection, and packing",
    "sex-doll-breast-options": "Sex doll breast options guide using a current Irontech silicone product and conceptual solid, hollow, and gel-filled construction diagrams",
    "tpe-sex-doll-repair": "TPE damage triage guide using a current Irontech TPE doll and illustrated examples of a small surface split, high-stress damage, and exposed internal components",
    "silicone-sex-doll-repair": "Silicone repair decision map using a current Starpery full-silicone doll and illustrated paths for tears, finish loss, loose components, seams, internal changes, and powered areas",
    "used-sex-dolls": "Used sex doll inspection dossier using a current WM catalog product and six evidence checks for identity, dated views, condition, repair history, packaging, and written transaction terms"
  };
  if (altBySlug[slug]) return altBySlug[slug];
  return `Editorial featured image for ${title}`;
}

export function absoluteUrl(pathname: string) {
  if (!pathname) return undefined;
  if (/^https?:\/\//.test(pathname)) return pathname;
  return `${siteUrl}${pathname}`;
}
