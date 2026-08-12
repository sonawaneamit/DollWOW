import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://api.dataforseo.com/v3/dataforseo_labs/google/domain_intersection/live";
const DEFAULT_COMPETITORS = [
  "yourdoll.com",
  "rosemarydoll.com",
  "siliconwives.com",
  "joylovedolls.com",
  "bestrealdoll.com"
];
const RELEVANT = /\b(?:sex|love|adult|realistic|companion|silicone|tpe|male|female|mini|torso|robot|doll|wm|irontech|starpery|tantaly|6ye|se doll|erovenus)\b/i;

const args = parseArgs(process.argv.slice(2));
await loadEnv(path.join(ROOT, ".env.local"));
if (args.env) await loadEnv(path.resolve(ROOT, args.env));

const execute = Boolean(args.execute);
const target = normalizeDomain(args.target || "dollwow.com");
const competitors = unique(String(args.competitors || DEFAULT_COMPETITORS.join(",")).split(",").map(normalizeDomain).filter(Boolean));
const limit = positiveInteger(args.limit) || 1000;
const locationCode = positiveInteger(args.locationCode) || 2840;
const languageCode = args.language || "en";
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const outputDir = path.resolve(ROOT, args.outDir || `data/exports/seo-intelligence/${dateStamp}/domain-gaps`);
const reportPath = path.resolve(ROOT, args.report || `docs/seo-intelligence/${dateStamp}-domain-gaps.md`);

if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const rows = [];
const requests = [];

for (const competitor of competitors) {
  const payload = {
    target1: competitor,
    target2: target,
    intersections: false,
    location_code: locationCode,
    language_code: languageCode,
    item_types: ["organic", "featured_snippet"],
    include_serp_info: true,
    limit,
    order_by: ["keyword_data.keyword_info.search_volume,desc"],
    tag: `dollwow-domain-gap-${competitor}`
  };

  if (!execute) {
    requests.push({ competitor, payload, cost: 0, status: "dry-run" });
    continue;
  }

  const response = await callDataForSeo(payload);
  const task = response.tasks?.[0];
  requests.push({
    competitor,
    payload,
    taskId: task?.id || null,
    cost: Number(task?.cost || 0),
    statusCode: task?.status_code || null,
    statusMessage: task?.status_message || ""
  });
  await writeJson(path.join(outputDir, `raw-${safeName(competitor)}.json`), response);
  rows.push(...normalizeRows(competitor, target, response));
}

const relevantRows = rows.filter((row) => row.isIndustryRelevant);
const opportunities = buildOpportunities(relevantRows);
const summary = {
  generatedAt,
  mode: execute ? "production" : "dry-run",
  target,
  competitors,
  market: { locationCode, languageCode },
  totals: {
    rawRows: rows.length,
    industryRelevantRows: relevantRows.length,
    uniqueRelevantKeywords: opportunities.length
  },
  costUsd: requests.reduce((sum, request) => sum + Number(request.cost || 0), 0),
  requests
};

await writeJson(path.join(outputDir, "domain-gap-rows.json"), rows);
await writeJson(path.join(outputDir, "domain-gap-opportunities.json"), opportunities);
await writeJson(path.join(outputDir, "summary.json"), summary);
await fs.writeFile(path.join(outputDir, "domain-gap-rows.csv"), toCsv(rows), "utf8");
await fs.writeFile(path.join(outputDir, "domain-gap-opportunities.csv"), toCsv(opportunities), "utf8");
await fs.writeFile(reportPath, renderReport(summary, opportunities), "utf8");

console.log(`${execute ? "Completed" : "Prepared"} domain-gap pull for ${competitors.length} competitors.`);
console.log(`Relevant keywords: ${opportunities.length}`);
console.log(`Recorded API cost: $${summary.costUsd.toFixed(4)}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);

async function callDataForSeo(payload) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([payload])
  });
  const body = await response.json();
  const task = body.tasks?.[0];
  if (!response.ok || Number(body.status_code || 0) >= 40000 || Number(task?.status_code || 0) >= 40000) {
    throw new Error(task?.status_message || body.status_message || `DataForSEO HTTP ${response.status}`);
  }
  return body;
}

function normalizeRows(competitor, targetDomain, response) {
  const items = response.tasks?.flatMap((task) => task.result || []).flatMap((result) => result.items || []) || [];
  return items.map((item) => {
    const data = item.keyword_data || {};
    const info = data.keyword_info || {};
    const properties = data.keyword_properties || {};
    const intent = data.search_intent_info || {};
    const result = item.first_domain_serp_element || {};
    const keyword = clean(data.keyword);
    const context = `${keyword} ${result.title || ""} ${result.url || ""}`;
    return {
      competitor,
      targetMissing: targetDomain,
      keyword,
      normalizedKeyword: normalizeKeyword(keyword),
      isIndustryRelevant: RELEVANT.test(context),
      searchVolume: numberOrNull(info.search_volume),
      cpc: numberOrNull(info.cpc),
      competition: numberOrNull(info.competition),
      keywordDifficulty: numberOrNull(properties.keyword_difficulty ?? data.serp_info?.keyword_difficulty),
      intent: clean(intent.main_intent),
      competitorRank: numberOrNull(result.rank_group),
      competitorUrl: clean(result.url),
      competitorTitle: clean(result.title),
      competitorEtv: numberOrNull(result.etv),
      serpFeatures: Array.isArray(data.serp_info?.serp_item_types) ? data.serp_info.serp_item_types.join("|") : ""
    };
  });
}

function buildOpportunities(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!row.normalizedKeyword) continue;
    const current = grouped.get(row.normalizedKeyword) || [];
    current.push(row);
    grouped.set(row.normalizedKeyword, current);
  }
  return [...grouped.entries()]
    .map(([normalizedKeyword, matches]) => {
      const strongest = [...matches].sort((a, b) => (a.competitorRank || 999) - (b.competitorRank || 999))[0];
      return {
        keyword: strongest.keyword,
        normalizedKeyword,
        searchVolume: Math.max(...matches.map((row) => Number(row.searchVolume || 0))),
        cpc: Math.max(...matches.map((row) => Number(row.cpc || 0))),
        keywordDifficulty: Math.max(...matches.map((row) => Number(row.keywordDifficulty || 0))),
        intent: strongest.intent,
        competitorCount: new Set(matches.map((row) => row.competitor)).size,
        bestCompetitorRank: Math.min(...matches.map((row) => Number(row.competitorRank || 999))),
        strongestCompetitor: strongest.competitor,
        strongestUrl: strongest.competitorUrl,
        rankingCompetitors: unique(matches.map((row) => row.competitor)).join("|"),
        serpFeatures: unique(matches.flatMap((row) => String(row.serpFeatures || "").split("|")).filter(Boolean)).join("|")
      };
    })
    .sort((a, b) => b.competitorCount - a.competitorCount || b.searchVolume - a.searchVolume || a.bestCompetitorRank - b.bestCompetitorRank);
}

function renderReport(summary, opportunities) {
  const top = opportunities.slice(0, 100);
  return [
    "# DollWOW Competitor Keyword Gaps",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    `Target: ${summary.target}`,
    "",
    `Competitors: ${summary.competitors.join(", ")}`,
    "",
    `Recorded DataForSEO cost: $${summary.costUsd.toFixed(4)}`,
    "",
    `Relevant competitor-only keywords: ${summary.totals.uniqueRelevantKeywords}`,
    "",
    "## Highest-Confidence Gaps",
    "",
    "| Keyword | Volume | Competitors | Best rank | Strongest ranking page |",
    "| --- | ---: | ---: | ---: | --- |",
    ...top.map((row) => `| ${escapePipe(row.keyword)} | ${row.searchVolume} | ${row.competitorCount} | ${row.bestCompetitorRank} | ${escapePipe(row.strongestUrl)} |`),
    "",
    "## Interpretation",
    "",
    "- These are terms at least one selected competitor ranks for while DollWOW does not appear in the same DataForSEO Labs dataset.",
    "- A gap is evidence for review, not automatic permission to create a page. Existing canonical ownership, catalog support, SERP intent, and duplication risk still control production.",
    "- Adult-query volume may be incomplete. Competitor agreement, ranking URLs, current catalog depth, GSC, and live SERPs remain supporting signals.",
    ""
  ].join("\n");
}

async function loadEnv(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const split = line.indexOf("=");
      if (split < 0) continue;
      const key = line.slice(0, split).trim();
      let value = line.slice(split + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] ||= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (key === "execute") parsed[key] = true;
    else parsed[key] = values[++index];
  }
  return parsed;
}

function normalizeDomain(value) {
  return clean(value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

function normalizeKeyword(value) {
  return clean(value).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function unique(values) {
  return [...new Set(values)];
}

function safeName(value) {
  return value.replace(/[^a-z0-9.-]+/gi, "-");
}

function escapePipe(value) {
  return String(value || "").replaceAll("|", "\\|");
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const cell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => cell(row[header])).join(","))].join("\n") + "\n";
}

async function writeJson(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}
