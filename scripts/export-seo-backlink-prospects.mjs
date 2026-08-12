import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://api.dataforseo.com/v3/backlinks/backlinks/live";
const DEFAULT_TARGETS = [
  "yourdoll.com",
  "rosemarydoll.com",
  "siliconwives.com",
  "joylovedolls.com",
  "bestrealdoll.com",
  "betterlovedoll.com",
  "sexdolltech.com",
  "myrobotdoll.com",
  "sexdollqueen.com"
];
const args = parseArgs(process.argv.slice(2));

await loadEnvFile(path.join(ROOT, ".env.local"));
const execute = Boolean(args.execute);
const targets = String(args.targets || DEFAULT_TARGETS.join(",")).split(",").map(clean).filter(Boolean);
const limit = Math.min(Math.max(Number(args.limit || 1000), 1), 1000);
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const outputDir = path.resolve(ROOT, args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-53-backlink-prospects"));
const reportPath = path.resolve(ROOT, args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-53-backlink-prospects.md`));
const desktopCsv = path.resolve(args.desktopCsv || path.join("/Users/amitsonawane/Desktop/DollWOW Content Docs", "Backlink Outreach Prospects - Unfiltered.csv"));
const desktopDomainCsv = path.resolve(args.desktopDomainCsv || path.join("/Users/amitsonawane/Desktop/DollWOW Content Docs", "Backlink Referring Domains - Review First.csv"));

if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.mkdir(path.dirname(desktopCsv), { recursive: true });

const responses = [];
for (const target of targets) {
  const body = execute ? await fetchBacklinks(target) : { tasks: [] };
  await fs.writeFile(path.join(outputDir, `${target}-backlinks.json`), `${JSON.stringify(body, null, 2)}\n`, "utf8");
  responses.push({ target, body });
}

const cost = responses.reduce((sum, item) => sum + Number(item.body.tasks?.[0]?.cost || 0), 0);
const rows = normalizeRows(responses);
const domains = summarizeDomains(rows);
await fs.writeFile(path.join(outputDir, "backlink-prospects-unfiltered.csv"), toCsv(rows), "utf8");
await fs.writeFile(path.join(outputDir, "referring-domain-summary.csv"), toCsv(domains), "utf8");
await fs.writeFile(desktopCsv, toCsv(rows), "utf8");
await fs.writeFile(desktopDomainCsv, toCsv(domains), "utf8");
await fs.writeFile(reportPath, renderReport({ generatedAt, targets, limit, rows, domains, cost, execute, desktopCsv }), "utf8");

console.log(`${execute ? "Exported" : "Prepared"} ${rows.length} unfiltered backlink source URLs across ${targets.length} competitors.`);
console.log(`Unique referring domains: ${domains.length}`);
console.log(`Recorded cost: $${cost.toFixed(4)}`);
console.log(`Desktop CSV: ${desktopCsv}`);
console.log(`Desktop domain review: ${desktopDomainCsv}`);
if (!execute) console.log("Dry run only. Add --execute to call DataForSEO.");

async function fetchBacklinks(target) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([{
      target,
      mode: "one_per_domain",
      limit,
      backlinks_status_type: "live",
      include_subdomains: true,
      exclude_internal_backlinks: true,
      order_by: ["domain_from_rank,desc", "page_from_rank,desc"],
      rank_scale: "one_hundred",
      tag: `dollwow-unfiltered-prospects-${target}-${dateStamp}`
    }])
  });
  const body = await response.json();
  const task = body.tasks?.[0];
  if (!response.ok || Number(body.status_code || 0) >= 40000 || Number(task?.status_code || 0) >= 40000) {
    throw new Error(task?.status_message || body.status_message || `DataForSEO HTTP ${response.status}`);
  }
  return body;
}

function normalizeRows(responses) {
  const bySource = new Map();
  for (const { target, body } of responses) {
    const items = body.tasks?.flatMap((task) => task.result || []).flatMap((result) => result.items || []) || [];
    for (const item of items) {
      const sourceUrl = clean(item.url_from);
      if (!sourceUrl) continue;
      const sourceDomain = clean(item.domain_from);
      const key = sourceUrl;
      const row = bySource.get(key) || {
        sourceUrl,
        sourceDomain,
        competitorTargets: new Set(),
        targetUrls: new Set(),
        sourceDomainRank: Number(item.domain_from_rank || 0),
        sourcePageRank: Number(item.page_from_rank || 0),
        sourceSpamScore: Number(item.url_from_spam_score || 0),
        dofollow: Boolean(item.dofollow),
        linkType: clean(item.type),
        semanticLocation: clean(item.semantic_location),
        platformTypes: Array.isArray(item.platform_types) ? item.platform_types.join("|") : clean(item.platform_types),
        anchor: clean(item.anchor),
        firstSeen: clean(item.first_seen),
        lastSeen: clean(item.last_seen),
        sourceCategory: classifySource(sourceDomain, sourceUrl),
        apparentSpamRisk: spamRisk(item, sourceDomain),
        topicalRelevance: topicalRelevance(sourceDomain, sourceUrl, item.anchor),
        suggestedDollWowAsset: suggestedAsset(sourceDomain, sourceUrl, item.anchor),
        manualReview: "Required",
        preservationNote: "Unfiltered source URL; classification is advisory and does not remove the prospect."
      };
      row.competitorTargets.add(target);
      row.targetUrls.add(clean(item.url_to));
      row.sourceDomainRank = Math.max(row.sourceDomainRank, Number(item.domain_from_rank || 0));
      row.sourcePageRank = Math.max(row.sourcePageRank, Number(item.page_from_rank || 0));
      bySource.set(key, row);
    }
  }
  return [...bySource.values()].map((row) => ({
    ...row,
    competitorTargets: [...row.competitorTargets].sort().join("|"),
    targetUrls: [...row.targetUrls].filter(Boolean).sort().join("|")
  })).sort((a, b) => b.sourceDomainRank - a.sourceDomainRank || a.sourceDomain.localeCompare(b.sourceDomain));
}

function summarizeDomains(rows) {
  const map = new Map();
  for (const row of rows) {
    const current = map.get(row.sourceDomain) || {
      sourceDomain: row.sourceDomain,
      sourceUrls: 0,
      competitorTargets: new Set(),
      bestDomainRank: 0,
      highestSpamScore: 0,
      sourceCategories: new Set(),
      topicalRelevance: new Set(),
      suggestedDollWowAssets: new Set()
    };
    current.sourceUrls += 1;
    row.competitorTargets.split("|").filter(Boolean).forEach((target) => current.competitorTargets.add(target));
    current.bestDomainRank = Math.max(current.bestDomainRank, row.sourceDomainRank);
    current.highestSpamScore = Math.max(current.highestSpamScore, row.sourceSpamScore);
    current.sourceCategories.add(row.sourceCategory);
    current.topicalRelevance.add(row.topicalRelevance);
    current.suggestedDollWowAssets.add(row.suggestedDollWowAsset);
    map.set(row.sourceDomain, current);
  }
  return [...map.values()].map((row) => ({
    ...row,
    competitorTargets: [...row.competitorTargets].sort().join("|"),
    competitorCount: row.competitorTargets.size,
    sourceCategories: [...row.sourceCategories].join("|"),
    topicalRelevance: [...row.topicalRelevance].join("|"),
    suggestedDollWowAssets: [...row.suggestedDollWowAssets].join("|")
  })).sort((a, b) => b.competitorCount - a.competitorCount || b.bestDomainRank - a.bestDomainRank);
}

function classifySource(domain, url) {
  const text = `${domain} ${url}`.toLowerCase();
  if (/reddit|forum|community|board|quora/.test(text)) return "forum-or-community";
  if (/youtube|vimeo|tiktok|instagram|facebook|twitter|x\.com|pinterest/.test(text)) return "social-or-video";
  if (/coupon|deal|promo|discount|voucher/.test(text)) return "coupon-or-deal";
  if (/directory|listing|list-of|links|catalog|aggregator/.test(text)) return "directory-or-aggregator";
  if (/blog|news|magazine|journal|press|article/.test(text)) return "publisher-or-blog";
  if (/affiliate|review|best-/.test(text)) return "affiliate-or-review";
  return "unclassified";
}

function spamRisk(item, domain) {
  const spam = Number(item.url_from_spam_score || 0);
  const lowTrustTld = /\.(?:xyz|top|click|win|biz|online|icu|site|live)$/i.test(domain);
  if (spam >= 70 || lowTrustTld) return "high";
  if (spam >= 35 || Number(item.domain_from_rank || 0) < 15) return "medium";
  return "low-or-unknown";
}

function topicalRelevance(domain, url, anchor) {
  const text = `${domain} ${url} ${anchor}`.toLowerCase();
  if (/sex.?doll|love.?doll|companion.?doll|tpe|silicone|robot.?doll/.test(text)) return "direct";
  if (/adult|intim|sex|relationship|sexual|dating|fetish/.test(text)) return "adjacent-adult";
  if (/shopping|review|coupon|deal|directory|forum|blog|news/.test(text)) return "format-relevant";
  return "unknown";
}

function suggestedAsset(domain, url, anchor) {
  const text = `${domain} ${url} ${anchor}`.toLowerCase();
  if (/weight|size|measurement|height|lightweight/.test(text)) return "/learn/sex-doll-size-weight-guide";
  if (/clean|care|maintenance/.test(text)) return "/learn/how-to-clean-a-sex-doll";
  if (/storage|case|move|handling/.test(text)) return "/learn/sex-doll-storage";
  if (/price|cost|cheap|budget|deal|coupon/.test(text)) return "/learn/sex-doll-cost";
  if (/silicone|tpe|material/.test(text)) return "/learn/tpe-vs-silicone-sex-dolls";
  if (/guide|buy|choose|first/.test(text)) return "/learn/sex-doll-guide";
  return "manual asset match";
}

function renderReport({ generatedAt, targets, limit, rows, domains, cost, execute, desktopCsv }) {
  const categoryCounts = counts(rows, "sourceCategory");
  const relevanceCounts = counts(rows, "topicalRelevance");
  const riskCounts = counts(rows, "apparentSpamRisk");
  return `# Unfiltered Backlink Prospect Export\n\nGenerated: ${generatedAt}\n\nMode: ${execute ? "production" : "dry-run"}\n\n## Scope\n\n- Competitors: ${targets.length}\n- Requested maximum source URLs per competitor: ${limit}\n- Unique source URLs preserved: ${rows.length}\n- Unique referring domains: ${domains.length}\n- Recorded DataForSEO cost: $${cost.toFixed(4)}\n- Owner-facing CSV: \`${desktopCsv}\`\n\n## Preservation Rule\n\nThis export retains every returned source URL, including adult publishers, aggregators, directories, forums, social platforms, affiliates, coupon sites, and apparent spam. Automated labels are advisory. No URL is removed because of its subject matter or risk score. Outreach remains a manual decision.\n\n## Source Categories\n\n${table(categoryCounts)}\n\n## Topical Relevance\n\n${table(relevanceCounts)}\n\n## Apparent Spam Risk\n\n${table(riskCounts)}\n\n## Use\n\nStart with domains that link to several competitors, have direct or adjacent relevance, and can plausibly cite a specific DollWow asset. Review the exact source URL manually before outreach. Do not buy links, impersonate customers, invent relationships, or promise reciprocal placement.\n`;
}

function counts(rows, field) {
  return [...rows.reduce((map, row) => map.set(row[field], (map.get(row[field]) || 0) + 1), new Map()).entries()].sort((a, b) => b[1] - a[1]);
}

function table(rows) {
  return ["| Label | URLs |", "| --- | ---: |", ...rows.map(([label, count]) => `| ${label} | ${count} |`)].join("\n");
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

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = values[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else { parsed[key] = next; index += 1; }
  }
  return parsed;
}

async function loadEnvFile(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}
