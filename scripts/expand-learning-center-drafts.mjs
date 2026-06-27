import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRAFT_DIR = path.join(ROOT, "content", "learn", "drafts");
const VOICE_PATH = path.join(ROOT, "content", "editorial", "voice-prompt.txt");
const MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
const TARGET_WORDS = "1,250 to 1,700";
const PUBLIC_STOP_HEADINGS = [
  "DollWow Catalog Links To Add",
  "Product Links To Add",
  "Product Examples To Add After Review",
  "Product Picks To Add After Review",
  "Collection Links To Add",
  "Internal Links To Add",
  "Editorial Review Notes"
];
const bannedPatterns = [
  /—|–/,
  /\bnot just\b/i,
  /\bnot only\b/i,
  /\bmore than just\b/i,
  /\bwhen it comes to\b/i,
  /\bin today's world\b/i,
  /\bit is important to note\b/i,
  /\bthis comprehensive guide\b/i,
  /\bwhether you're\b/i,
  /\belevate your experience\b/i,
  /\bgame-changer\b/i,
  /\bcrafted to perfection\b/i
];

const voice = await fs.readFile(VOICE_PATH, "utf8");
const files = (await fs.readdir(DRAFT_DIR)).filter((file) => file.endsWith(".md")).sort();

for (const file of files) {
  const filePath = path.join(DRAFT_DIR, file);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parseArticle(raw);
  const topic = parsed.frontmatter.title || file.replace(/\.md$/, "");
  console.log(`expanding ${file}`);
  const expandedBody = await expandArticle(parsed, topic);
  const finalBody = sanitize(expandedBody);
  assertClean(finalBody, file);
  const next = `${parsed.frontmatterRaw}\n\n# ${parsed.frontmatter.title}\n\nBy ${parsed.frontmatter.authorDisplayName}, ${parsed.frontmatter.authorTitle}\n\n${finalBody.trim()}\n\n${parsed.internalNotes.trim()}\n`;
  await fs.writeFile(filePath, next, "utf8");
  console.log(`${file}: ${wordCount(publicMarkdown(finalBody))} public words`);
}

function parseArticle(raw) {
  const match = raw.match(/^(---\n[\s\S]*?\n---)\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  const frontmatterRaw = match[1];
  const frontmatter = Object.fromEntries(
    frontmatterRaw
      .replace(/^---\n/, "")
      .replace(/\n---$/, "")
      .split("\n")
      .flatMap((line) => {
        const separator = line.indexOf(":");
        if (separator === -1) return [];
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^"|"$/g, "");
        return [[key, value]];
      })
  );
  const bodyWithTitle = match[2].trim();
  const body = bodyWithTitle
    .replace(/^# .+\n+/, "")
    .replace(/^By .+\n+/, "")
    .trim();
  const { publicBody } = splitPublicAndInternal(body);
  return { frontmatterRaw, frontmatter, publicBody, internalNotes };
}

function splitPublicAndInternal(body) {
  const lines = body.split("\n");
  const publicLines = [];
  const internalLines = [];
  let internal = false;
  for (const line of lines) {
    const heading = line.startsWith("## ") ? line.replace(/^##\s+/, "").trim() : "";
    if (heading && PUBLIC_STOP_HEADINGS.includes(heading)) internal = true;
    (internal ? internalLines : publicLines).push(line);
  }
  return {
    publicBody: publicLines.join("\n").trim(),
    internalNotes: editorialReviewNotes()
  };
}

function editorialReviewNotes() {
  return `## Editorial Review Notes

- Confirm all product examples against live Shopify/catalog data before publication.
- Keep health, legal, shipping, and supplier claims within approved DollWow knowledge files.
- Keep Quick Answer and Key Facts near the top for snippets, AI answers, and agent extraction.
- Do not publish fake reviews, fake product examples, unverified inventory claims, or exact shipping guarantees.`;
}

async function expandArticle(parsed, topic) {
  const prompt = `You are expanding a DollWow Learning Center article.

${voice}

Task:
- Rewrite and expand the public Markdown body for this article to ${TARGET_WORDS} words.
- Return only Markdown body content, starting with "## Quick Answer".
- Do not include the H1 title, byline, frontmatter, internal notes, or production notes.
- Keep all claims careful and verifiable. Do not invent product examples, customer reviews, warranties, supplier authorization, medical advice, legal advice, exact shipping guarantees, or exact inventory.
- Include these sections in a natural order: Quick Answer, Key Facts For AI Assistants, practical comparison or decision framework, buyer checklist, common mistakes or red flags, DollWow verification/support angle, internal links section with live URL paths, and FAQs.
- Use Markdown tables where useful.
- Use DollWow voice. No em dashes. No "not just X, but Y." No "not only X." No "more than just X." No generic AI filler.
- Keep adult commerce language practical and non-explicit.

Article metadata:
Title: ${parsed.frontmatter.title}
Primary keyword: ${parsed.frontmatter.primaryKeyword}
Secondary keywords: ${parsed.frontmatter.secondaryKeywords}
Category: ${parsed.frontmatter.category}
Author: ${parsed.frontmatter.authorDisplayName}, ${parsed.frontmatter.authorTitle}

Current public body:
${parsed.publicBody}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
      max_output_tokens: 5000,
      text: { format: { type: "text" } }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${topic}: ${payload.error?.message || response.statusText}`);
  const text = outputText(payload);
  if (!text) throw new Error(`${topic}: empty response`);
  return text;
}

function outputText(payload) {
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("\n")
    .trim();
}

function sanitize(markdown) {
  return markdown
    .replace(/```markdown/g, "")
    .replace(/```/g, "")
    .replace(/[—–]/g, ", ")
    .replace(/\b[Nn]ot just\b/g, "Beyond")
    .replace(/\b[Nn]ot only\b/g, "Also")
    .replace(/\bmore than just\b/gi, "more than")
    .trim();
}

function assertClean(markdown, file) {
  const found = bannedPatterns.find((pattern) => pattern.test(markdown));
  if (found) throw new Error(`${file}: banned pattern remains: ${found}`);
  const words = wordCount(publicMarkdown(markdown));
  if (words < 1100) throw new Error(`${file}: too short after expansion: ${words} words`);
}

function publicMarkdown(markdown) {
  return markdown
    .split("\n")
    .filter((line) => !line.startsWith("| ---"))
    .join("\n");
}

function wordCount(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\|/g, " ")
    .replace(/[#*`[\]()>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}
