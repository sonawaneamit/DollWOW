import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const sourcePath = path.resolve(args.source || "/Users/amitsonawane/Desktop/DollWOW Content Docs/Backlink Outreach Prospects - Unfiltered.csv");
const outputPath = path.resolve(args.output || "/Users/amitsonawane/Desktop/DollWOW Content Docs/Backlink Outreach Shortlist - Review First.csv");
const reportPath = path.resolve(args.report || path.join(ROOT, "docs", "seo-intelligence", "2026-08-12-step-55-backlink-outreach-shortlist.md"));
const limit = Math.max(1, Number(args.limit || 300));

const rows = parseCsv(await fs.readFile(sourcePath, "utf8"));
const domainCounts = new Map();
for (const row of rows) {
  const targets = splitPipe(row.competitorTargets);
  const current = domainCounts.get(row.sourceDomain) || new Set();
  targets.forEach((target) => current.add(target));
  domainCounts.set(row.sourceDomain, current);
}

const scored = rows.map((row) => scoreRow(row, domainCounts.get(row.sourceDomain)?.size || 0));
const shortlist = scored
  .filter((row) => row.outreachFit !== "low" && (row.topicalRelevance !== "unknown" || row.competitorCount >= 3))
  .sort((a, b) => b.priorityScore - a.priorityScore || b.sourceDomainRank - a.sourceDomainRank || a.sourceUrl.localeCompare(b.sourceUrl))
  .slice(0, limit)
  .map((row, index) => ({ reviewOrder: index + 1, ...row }));

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(outputPath, toCsv(shortlist), "utf8");
await fs.writeFile(reportPath, renderReport(rows, shortlist), "utf8");

console.log(`Built a ${shortlist.length}-URL review-first shortlist from ${rows.length} preserved prospects.`);
console.log(`Shortlist: ${outputPath}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function scoreRow(row, competitorCount) {
  const direct = row.topicalRelevance === "direct";
  const adjacent = row.topicalRelevance === "adjacent-adult";
  const formatRelevant = row.topicalRelevance === "format-relevant";
  const assetMatched = row.suggestedDollWowAsset?.startsWith("/");
  const sourceBoost = {
    "forum-or-community": 16,
    "publisher-or-blog": 14,
    "directory-or-aggregator": 12,
    "affiliate-or-review": 10,
    "social-or-video": 6,
    "coupon-or-deal": 2,
    unclassified: 0
  }[row.sourceCategory] || 0;
  const riskPenalty = row.apparentSpamRisk === "high" ? 18 : row.apparentSpamRisk === "medium" ? 7 : 0;
  const outreachFit = classifyOutreachFit(row);
  const fitBoost = outreachFit === "high" ? 20 : outreachFit === "medium" ? 5 : -30;
  const priorityScore = Math.round(
    (direct ? 35 : adjacent ? 22 : formatRelevant ? 12 : 0) +
    Math.min(competitorCount * 5, 30) +
    Math.min(Number(row.sourceDomainRank || 0) / 5, 20) +
    sourceBoost +
    (assetMatched ? 12 : 0) +
    (row.dofollow === "true" ? 3 : 0) -
    riskPenalty +
    fitBoost
  );
  return {
    sourceUrl: row.sourceUrl,
    sourceDomain: row.sourceDomain,
    priorityScore,
    competitorCount,
    competitorTargets: row.competitorTargets,
    competitorDestinationUrls: row.targetUrls,
    sourceCategory: row.sourceCategory,
    outreachFit,
    topicalRelevance: row.topicalRelevance,
    apparentSpamRisk: row.apparentSpamRisk,
    sourceDomainRank: Number(row.sourceDomainRank || 0),
    sourcePageRank: Number(row.sourcePageRank || 0),
    sourceSpamScore: Number(row.sourceSpamScore || 0),
    dofollow: row.dofollow,
    linkType: row.linkType,
    anchor: row.anchor,
    suggestedDollWowAsset: row.suggestedDollWowAsset,
    outreachAngle: outreachAngle(row),
    manualReview: "Required before outreach",
    preservationNote: "Prioritized from the unfiltered master export; adult and aggregator URLs remain visible."
  };
}

function classifyOutreachFit(row) {
  const text = `${row.sourceUrl} ${row.anchor}`.toLowerCase();
  if (/\/(?:reply|profile|member|author|login|search|tag)\b|wp-content|\.(?:jpg|jpeg|png|webp|gif)(?:\?|$)|building-a-personal-brand|\b(?:sale|classified|marketplace)\b|\/vente-/.test(text)) return "low";
  if (/\b(?:guide|review|choose|choosing|best|comparison|compare|resource|directory|size|weight|height|material|silicone|tpe|clean|care|maintenance|storage|sex.?doll|love.?doll|realdoll)\b/.test(text)) return "high";
  if (["forum-or-community", "publisher-or-blog", "directory-or-aggregator", "affiliate-or-review"].includes(row.sourceCategory) && row.topicalRelevance !== "unknown") return "medium";
  return row.topicalRelevance === "direct" || row.topicalRelevance === "adjacent-adult" ? "medium" : "low";
}

function outreachAngle(row) {
  if (row.suggestedDollWowAsset?.startsWith("/")) return `Offer the relevant original resource: https://dollwow.com${row.suggestedDollWowAsset}`;
  if (row.sourceCategory === "forum-or-community") return "Review the community rules, then contribute a useful answer or resource only where self-reference is allowed.";
  if (row.sourceCategory === "directory-or-aggregator") return "Check submission or editorial-listing requirements and propose DollWow as a verified retailer/resource.";
  if (row.sourceCategory === "publisher-or-blog" || row.sourceCategory === "affiliate-or-review") return "Pitch a factual catalog dataset, buyer guide, product comparison, or expert contribution matched to the exact page.";
  if (row.sourceCategory === "social-or-video") return "Review the account and propose a product-grounded visual, expert comment, or resource collaboration.";
  return "Review the exact page and choose the closest DollWow guide, original dataset, collection, or support program.";
}

function renderReport(allRows, shortlist) {
  const categories = count(shortlist, "sourceCategory");
  const risks = count(shortlist, "apparentSpamRisk");
  const assets = count(shortlist, "suggestedDollWowAsset");
  return `# Backlink Outreach Shortlist\n\nGenerated: ${new Date().toISOString()}\n\n## Scope\n\n- Preserved master prospects: ${allRows.length}\n- Review-first shortlist: ${shortlist.length}\n- Adult, aggregator, forum, affiliate, social, and publisher URLs remain visible.\n- This shortlist does not delete or replace any row in the unfiltered master export.\n\n## Ranking Method\n\nThe review order rewards direct or adjacent relevance, links to several competitors, stronger domain signals, useful source formats, dofollow status, a clear DollWow asset match, and an editorial or resource-style page. Resale listings, profile pages, reply pages, raw images, and obvious injected off-topic articles remain in the unfiltered master export but do not enter this working shortlist. Apparent risk lowers priority but never censors a URL. Every source requires manual review before outreach.\n\n## Source Mix\n\n${markdownTable(categories)}\n\n## Advisory Risk Mix\n\n${markdownTable(risks)}\n\n## Most Common Suggested Assets\n\n${markdownTable(assets.slice(0, 12))}\n\n## Outreach Rules\n\n- Lead with a useful resource, original catalog evidence, accurate product comparison, or expert contribution.\n- Follow forum and directory rules. Do not pose as a customer.\n- Do not buy placements, automate spam, promise reciprocal links, or claim hands-on experience that did not happen.\n- Review the exact page, ownership, recency, and contact route manually.\n`;
}

function parseCsv(text) {
  const records = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field); records.push(row); row = []; field = ""; }
    else if (char !== "\r") field += char;
  }
  if (field || row.length) { row.push(field); records.push(row); }
  const [headers, ...values] = records.filter((record) => record.some(Boolean));
  return values.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] || ""])));
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csv(row[header])).join(",")).join("\n")}\n`;
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function splitPipe(value) { return String(value || "").split("|").filter(Boolean); }
function count(rows, field) { return [...rows.reduce((map, row) => map.set(row[field] || "unknown", (map.get(row[field] || "unknown") || 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1]); }
function markdownTable(rows) { return ["| Label | URLs |", "| --- | ---: |", ...rows.map(([label, value]) => `| ${label} | ${value} |`)].join("\n"); }
function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    if (!values[index].startsWith("--")) continue;
    const key = values[index].slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = values[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else { parsed[key] = next; index += 1; }
  }
  return parsed;
}
