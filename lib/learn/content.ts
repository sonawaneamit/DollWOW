import fs from "node:fs";
import path from "node:path";
import authorsData from "@/content/editorial/authors.json";
import { env } from "@/lib/utils/env";

export type LearnAuthor = {
  displayName: string;
  title: string;
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

export function getLearningArticles() {
  if (!fs.existsSync(DRAFT_DIR)) return [];
  return fs
    .readdirSync(DRAFT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readArticle(path.join(DRAFT_DIR, file)))
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
      description: author?.shortBio ?? undefined
    },
    publisher: {
      "@type": "Organization",
      name: "DollWow",
      url: siteUrl
    },
    mainEntityOfPage: learnArticleUrl(article.slug),
    image: absoluteUrl(article.featuredImage),
    keywords: [article.primaryKeyword, ...article.secondaryKeywords].join(", ")
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
    featuredImageAlt: featuredImageAlt(stringValue(frontmatter.title)),
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
    "tpe-vs-silicone-sex-dolls",
    "sex-doll-cost",
    "best-sex-dolls",
    "most-realistic-sex-dolls",
    "mini-sex-dolls",
    "male-sex-doll-buying-guide",
    "sex-doll-reviews",
    "ready-to-ship-vs-custom-sex-dolls",
    "discreet-sex-doll-shipping"
  ];
  const index = order.indexOf(slug);
  return index === -1 ? 999 : index;
}

function featuredImagePath(slug: string) {
  const relativePath = `/images/learn/${slug}.webp`;
  const filePath = path.join(ROOT, "public", relativePath);
  return fs.existsSync(filePath) ? relativePath : "";
}

function featuredImageAlt(title: string) {
  return `Editorial featured image for ${title}`;
}

export function absoluteUrl(pathname: string) {
  if (!pathname) return undefined;
  if (/^https?:\/\//.test(pathname)) return pathname;
  return `${siteUrl}${pathname}`;
}
