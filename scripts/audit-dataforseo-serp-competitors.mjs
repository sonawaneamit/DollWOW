import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUT_DIR = path.join(ROOT, "data", "exports");
const SERP_ENDPOINT = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";
const DEFAULT_KEYWORDS = [
  "sex dolls",
  "sex doll",
  "realistic sex dolls",
  "tpe sex doll",
  "tpe dolls",
  "silicone sex dolls",
  "male sex doll",
  "male dolls",
  "mini sex dolls",
  "torso sex dolls",
  "best sex dolls",
  "sex doll cost",
  "sex doll reviews",
  "ready to ship sex dolls",
  "custom sex doll"
];
const SEED_COMPETITORS = [
  "yourdoll.com",
  "siliconwives.com",
  "rosemarydoll.com",
  "joylovedolls.com",
  "spartandolls.com"
];
const KEYWORD_TARGETS = {
  "sex dolls": { pageType: "collection", targetPath: "/shop/sex-dolls" },
  "sex doll": { pageType: "collection", targetPath: "/shop/sex-dolls" },
  "realistic sex dolls": { pageType: "collection", targetPath: "/shop/realistic-sex-dolls" },
  "tpe sex doll": { pageType: "collection", targetPath: "/shop/tpe" },
  "tpe dolls": { pageType: "collection", targetPath: "/shop/tpe" },
  "silicone sex dolls": { pageType: "collection", targetPath: "/shop/silicone" },
  "male sex doll": { pageType: "collection", targetPath: "/shop/male-dolls" },
  "male dolls": { pageType: "collection", targetPath: "/shop/male-dolls" },
  "mini sex dolls": { pageType: "collection", targetPath: "/shop/height-under-155" },
  "torso sex dolls": { pageType: "collection", targetPath: "/shop/torso-sex-dolls" },
  "best sex dolls": { pageType: "learning-guide", targetPath: "/learn/best-sex-dolls" },
  "sex doll cost": { pageType: "learning-guide", targetPath: "/learn/sex-doll-cost" },
  "sex doll reviews": { pageType: "learning-guide", targetPath: "/learn/sex-doll-reviews" },
  "ready to ship sex dolls": { pageType: "collection", targetPath: "/shop/ready-to-ship" },
  "custom sex doll": { pageType: "collection", targetPath: "/shop/custom" }
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

await loadEnvFile(path.join(ROOT, ".env.local"));
if (args.env) await loadEnvFile(path.resolve(ROOT, args.env));

const execute = Boolean(args.execute);
const keywords = await loadKeywords();
const depth = positiveInteger(args.depth) ?? 50;
const locationName = args.location || "United States";
const languageCode = args.language || "en";
const device = args.device || "desktop";
const generatedAt = new Date().toISOString();
const stamp = generatedAt.replace(/[:.]/g, "-");
const outputDir = path.resolve(ROOT, args.outDir || DEFAULT_OUT_DIR);
const jsonPath = path.resolve(ROOT, args.out || path.join(outputDir, `dataforseo-serp-competitor-audit-${stamp}.json`));
const markdownPath = path.resolve(ROOT, args.markdown || path.join(outputDir, `dataforseo-serp-competitor-audit-${stamp}.md`));

const serpTasks = execute ? await fetchSerps(keywords) : dryRunTasks(keywords);
const audit = buildAudit(serpTasks);

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(jsonPath, JSON.stringify(audit, null, 2), "utf8");
await fs.writeFile(markdownPath, renderMarkdown(audit), "utf8");

console.log(`${execute ? "Fetched" : "Dry-run prepared"} SERP competitor audit for ${keywords.length} keywords.`);
console.log(`JSON: ${path.relative(ROOT, jsonPath)}`);
console.log(`Markdown: ${path.relative(ROOT, markdownPath)}`);
if (!execute) console.log("Dry run only. Add --execute to call DataForSEO.");

async function loadKeywords() {
  if (args.keywordFile) {
    const text = await fs.readFile(path.resolve(ROOT, args.keywordFile), "utf8");
    return unique(text.split(/\r?\n|,/).map(cleanText)).filter(Boolean);
  }
  if (args.keywords) {
    return unique(String(args.keywords).split(",").map(cleanText)).filter(Boolean);
  }
  return DEFAULT_KEYWORDS;
}

async function fetchSerps(keywordsToFetch) {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
  }

  const tasks = [];
  for (const keyword of keywordsToFetch) {
    tasks.push(await fetchSerp(keyword));
  }
  return tasks;
}

async function fetchSerp(keyword) {
  const payload = [
    {
      keyword,
      location_name: locationName,
      language_code: languageCode,
      device,
      depth
    }
  ];

  const response = await fetch(SERP_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || Number(data.status_code || 0) >= 40000) {
    throw new Error(data.status_message || `DataForSEO request failed with HTTP ${response.status}.`);
  }
  if (data.tasks_error) {
    const failedTask = data.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
    throw new Error(failedTask?.status_message || data.status_message || "DataForSEO task failed.");
  }

  const task = data.tasks?.[0] || {};
  return {
    keyword: task.data?.keyword || keyword,
    statusCode: task.status_code,
    statusMessage: task.status_message,
    result: task.result || []
  };
}

function dryRunTasks(keywordsToPrepare) {
  return keywordsToPrepare.map((keyword) => ({
    keyword,
    statusCode: 0,
    statusMessage: "dry-run",
    result: []
  }));
}

function buildAudit(tasks) {
  const keywordReports = tasks.map((task) => {
    const items = extractOrganicItems(task);
    const rankingPages = items.map((item) => ({
      rank: item.rank_group || item.rank_absolute || null,
      rankAbsolute: item.rank_absolute || null,
      domain: normalizeDomain(item.domain || hostname(item.url)),
      url: item.url || "",
      title: cleanText(item.title),
      description: cleanText(item.description),
      pageType: classifyPage(item),
      isSeedCompetitor: SEED_COMPETITORS.includes(normalizeDomain(item.domain || hostname(item.url)))
    }));
    const competitorPages = rankingPages.filter((page) => page.domain && page.domain !== "dollwow.com");
    return {
      keyword: task.keyword,
      resultCount: rankingPages.length,
      topRankingPages: rankingPages.slice(0, 20),
      topCompetitorPages: competitorPages.slice(0, 10),
      pageTypeMix: countBy(rankingPages, "pageType"),
      recommendedDollWowAsset: recommendedAsset(task.keyword, rankingPages)
    };
  });

  const allPages = keywordReports.flatMap((report) =>
    report.topRankingPages.map((page) => ({
      ...page,
      keyword: report.keyword
    }))
  );
  const domainScores = scoreDomains(allPages);

  return {
    generatedAt,
    mode: execute ? "dataforseo" : "dry-run",
    location: locationName,
    languageCode,
    device,
    depth,
    keywords,
    seedCompetitors: SEED_COMPETITORS,
    topDomains: domainScores.slice(0, 25),
    topSeedCompetitors: domainScores.filter((item) => SEED_COMPETITORS.includes(item.domain)),
    keywordReports,
    matchAndExceedRules: [
      "Match the ranking page type first. If Google rewards collections for the query, build a stronger collection page before writing another guide.",
      "Exceed the top pages with clearer product filters, live catalog links, author and editorial policy signals, FAQ schema, comparison tables, privacy/shipping details, and product proof where available.",
      "Do not copy competitor wording, fake reviews, unverifiable claims, or unsupported shipping promises.",
      "Use ranking competitor headings as inspiration for coverage gaps, then write DollWow-specific buyer guidance from catalog facts and support policies.",
      "Refresh target pages monthly against DataForSEO SERPs, Google Search Console, and live product availability."
    ]
  };
}

function extractOrganicItems(task) {
  return (task.result || [])
    .flatMap((result) => result.items || [])
    .filter((item) => item.type === "organic" && item.url)
    .sort((a, b) => Number(a.rank_group || a.rank_absolute || 999) - Number(b.rank_group || b.rank_absolute || 999));
}

function scoreDomains(pages) {
  const scores = new Map();
  for (const page of pages) {
    if (!page.domain || page.domain === "dollwow.com") continue;
    const current = scores.get(page.domain) || {
      domain: page.domain,
      keywordCount: 0,
      appearances: 0,
      bestRank: null,
      weightedScore: 0,
      pageTypes: {},
      examples: []
    };
    current.appearances += 1;
    current.bestRank = current.bestRank === null ? page.rank : Math.min(current.bestRank, page.rank || 999);
    current.weightedScore += Math.max(0, 101 - Number(page.rank || 100));
    current.pageTypes[page.pageType] = (current.pageTypes[page.pageType] || 0) + 1;
    if (!current.examples.some((example) => example.keyword === page.keyword)) {
      current.keywordCount += 1;
      if (current.examples.length < 6) {
        current.examples.push({
          keyword: page.keyword,
          rank: page.rank,
          url: page.url,
          title: page.title,
          pageType: page.pageType
        });
      }
    }
    scores.set(page.domain, current);
  }
  return [...scores.values()].sort((a, b) => b.weightedScore - a.weightedScore || b.keywordCount - a.keywordCount);
}

function recommendedAsset(keyword, pages) {
  const mix = countBy(pages.slice(0, 10), "pageType");
  const dominantType = Object.entries(mix).sort((a, b) => b[1] - a[1])[0]?.[0] || "collection";
  const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const explicitTarget = KEYWORD_TARGETS[keyword.toLowerCase()];
  const primaryType = explicitTarget?.pageType || keywordAssetType(keyword, dominantType);
  return {
    pageType: primaryType,
    targetPath: explicitTarget?.targetPath || (primaryType === "collection" ? `/shop/${slug}` : `/learn/${slug}`),
    match: dominantType,
    exceedWith: exceedRecommendations(keyword, primaryType)
  };
}

function keywordAssetType(keyword, dominantType) {
  const normalized = keyword.toLowerCase();
  if (/\b(cost|review|reviews|best|vs|compare|how|what|guide)\b/.test(normalized)) return "learning-guide";
  if (dominantType === "product") return "collection";
  if (dominantType === "guide" || dominantType === "blog") return "learning-guide";
  return "collection";
}

function exceedRecommendations(keyword, pageType) {
  const recommendations = [
    "Direct 40-80 word answer near the top.",
    "FAQ schema using real buyer questions.",
    "Internal links to relevant collections, product examples, support, price match, shipping, and editorial policy.",
    "Clear Jesse or Alex byline where relevant."
  ];
  if (pageType === "collection") {
    recommendations.push("Crawlable intro copy, ItemList schema, filters, short buying checklist, and 3-6 related guide links.");
  } else {
    recommendations.push("Comparison table, common mistakes, buyer checklist, and related product or collection cards.");
  }
  if (/\bshipping|ready|custom|cost|cheap|price\b/i.test(keyword)) {
    recommendations.push("Discreet shipping, total delivered value, support confirmation, and timing caveats.");
  }
  if (/\btpe|silicone|material\b/i.test(keyword)) {
    recommendations.push("Material care, feel, durability, weight, and supplier formulation caveats.");
  }
  return recommendations;
}

function classifyPage(item) {
  const url = String(item.url || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();
  let pathname = "";
  try {
    pathname = new URL(url).pathname.toLowerCase().replace(/\/$/, "");
  } catch {
    pathname = "";
  }
  if (!pathname) return "homepage";
  if (/\/product|\/products|\/p\//.test(url)) return "product";
  if (/\/blog|\/guide|\/learn|\/article|\/faq|\/how-|\/what-|\/best-|\/review/.test(url)) return "guide";
  if (/\/collections|\/collection|\/category|\/shop|\/sex-dolls|\/dolls|\/male-dolls|\/silicone|\/tpe/.test(url)) return "collection";
  if (/^(best|how|what|review|guide|compare)/.test(title)) return "guide";
  return "other";
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function renderMarkdown(audit) {
  return `# DollWow DataForSEO SERP Competitor Audit

Generated: ${audit.generatedAt}
Mode: ${audit.mode}
Market: ${audit.location}, ${audit.languageCode}, ${audit.device}
Depth: ${audit.depth}

## Top Competing Domains

| Domain | Keywords | Appearances | Best Rank | Score | Page Types |
| --- | ---: | ---: | ---: | ---: | --- |
${audit.topDomains
  .slice(0, 15)
  .map((item) => `| ${item.domain} | ${item.keywordCount} | ${item.appearances} | ${item.bestRank ?? ""} | ${Math.round(item.weightedScore)} | ${formatPageTypes(item.pageTypes)} |`)
  .join("\n")}

## Keyword SERP Findings

${audit.keywordReports
  .map(
    (report) => `### ${report.keyword}

Recommended DollWow asset: ${report.recommendedDollWowAsset.pageType} at \`${report.recommendedDollWowAsset.targetPath}\`

Top competitor pages:

| Rank | Domain | Type | URL |
| ---: | --- | --- | --- |
${report.topCompetitorPages
  .slice(0, 8)
  .map((page) => `| ${page.rank ?? ""} | ${page.domain} | ${page.pageType} | ${page.url} |`)
  .join("\n")}

Match and exceed:
${report.recommendedDollWowAsset.exceedWith.map((item) => `- ${item}`).join("\n")}
`
  )
  .join("\n")}

## Operating Rules

${audit.matchAndExceedRules.map((item) => `- ${item}`).join("\n")}
`;
}

function formatPageTypes(pageTypes) {
  return Object.entries(pageTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");
}

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function normalizeDomain(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "");
}

function positiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "help" || key === "execute") {
      parsed[key] = true;
    } else {
      parsed[key] = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

async function loadEnvFile(envPath) {
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] ||= value;
    }
  } catch {
    // Optional.
  }
}

function printHelp() {
  console.log(`Usage:
  npm run seo:serp-competitors
  npm run seo:serp-competitors -- --execute --env ../ColorMine-Website/.env
  npm run seo:serp-competitors -- --execute --keywords "sex dolls,tpe dolls,male sex doll"
  npm run seo:serp-competitors -- --execute --keyword-file data/exports/keywords.txt --depth 100

Dry-runs by default. With --execute, calls DataForSEO Google organic live advanced SERP API for US rankings.
Outputs ignored JSON and Markdown files under data/exports/.`);
}
