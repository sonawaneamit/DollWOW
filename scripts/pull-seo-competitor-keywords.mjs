import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LABS_BASE = "https://api.dataforseo.com/v3/dataforseo_labs/google";
const DEFAULT_DOMAINS = [
  "yourdoll.com",
  "bestrealdoll.com",
  "siliconwives.com",
  "betterlovedoll.com",
  "sexdolltech.com",
  "realdoll.com",
  "joylovedolls.com",
  "realsexdoll.com",
  "rosemarydoll.com",
  "uloversdoll.com",
  "spartanlover.com",
  "myrobotdoll.com",
  "dollwow.com"
];
const RELEVANCE_PATTERNS = [
  /\bsex\s*dolls?\b/i,
  /\blove\s*dolls?\b/i,
  /\brealistic\s*dolls?\b/i,
  /\badult\s*dolls?\b/i,
  /\bcompanion\s*dolls?\b/i,
  /\btpe\s*dolls?\b/i,
  /\bsilicone\s*dolls?\b/i,
  /\bmale\s*dolls?\b/i,
  /\bfemale\s*dolls?\b/i,
  /\btorso\s*dolls?\b/i,
  /\bmini\s*dolls?\b/i,
  /\b(?:wm|irontech|starpery|zelex|se doll|6ye|tantaly|piper doll|real lady)\b/i
];

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

await loadEnvFile(path.join(ROOT, ".env.local"));
if (args.env) await loadEnvFile(path.resolve(ROOT, args.env));

const execute = Boolean(args.execute);
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const domains = await loadDomains();
const keywordLimit = positiveInteger(args.keywordLimit) ?? 1000;
const pageLimit = positiveInteger(args.pageLimit) ?? 100;
const locationCode = positiveInteger(args.locationCode) ?? 2840;
const languageCode = args.language || "en";
const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-01-competitor-keywords")
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-01-competitor-keywords.md`)
);

if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const requests = [];
const domainResults = [];

for (const domain of domains) {
  const rankedPayload = {
    target: domain,
    location_code: locationCode,
    language_code: languageCode,
    item_types: ["organic", "featured_snippet", "ai_overview_reference"],
    historical_serp_mode: "live",
    ignore_synonyms: false,
    limit: keywordLimit,
    order_by: [
      "keyword_data.keyword_info.search_volume,desc",
      "ranked_serp_element.serp_item.rank_group,asc"
    ],
    tag: `dollwow-step-01-ranked-${domain}`
  };
  const pagesPayload = {
    target: domain,
    location_code: locationCode,
    language_code: languageCode,
    item_types: ["organic", "featured_snippet"],
    historical_serp_mode: "live",
    ignore_synonyms: false,
    limit: pageLimit,
    order_by: ["metrics.organic.etv,desc", "metrics.organic.count,desc"],
    tag: `dollwow-step-01-pages-${domain}`
  };

  if (!execute) {
    requests.push(requestRecord(domain, "ranked_keywords", rankedPayload));
    requests.push(requestRecord(domain, "relevant_pages", pagesPayload));
    domainResults.push({ domain, rankedKeywords: [], relevantPages: [], errors: [] });
    continue;
  }

  const errors = [];
  let rankedResponse = null;
  let pagesResponse = null;

  try {
    rankedResponse = await callDataForSeo("ranked_keywords", rankedPayload);
    requests.push(requestRecord(domain, "ranked_keywords", rankedPayload, rankedResponse));
    await writeJson(path.join(outputDir, `raw-${safeName(domain)}-ranked-keywords.json`), rankedResponse);
  } catch (error) {
    errors.push({ endpoint: "ranked_keywords", message: error.message });
  }

  try {
    pagesResponse = await callDataForSeo("relevant_pages", pagesPayload);
    requests.push(requestRecord(domain, "relevant_pages", pagesPayload, pagesResponse));
    await writeJson(path.join(outputDir, `raw-${safeName(domain)}-relevant-pages.json`), pagesResponse);
  } catch (error) {
    errors.push({ endpoint: "relevant_pages", message: error.message });
  }

  domainResults.push({
    domain,
    rankedKeywords: normalizeRankedKeywords(domain, rankedResponse),
    relevantPages: normalizeRelevantPages(domain, pagesResponse),
    errors
  });
}

const allKeywords = domainResults.flatMap((entry) => entry.rankedKeywords);
const allPages = domainResults.flatMap((entry) => entry.relevantPages);
const summary = buildSummary(domainResults, requests, allKeywords, allPages);

await writeJson(path.join(outputDir, "request-manifest.json"), {
  generatedAt,
  mode: execute ? "production" : "dry-run",
  locationCode,
  languageCode,
  keywordLimit,
  pageLimit,
  domains,
  requests
});
await writeJson(path.join(outputDir, "competitor-ranked-keywords.json"), allKeywords);
await writeJson(path.join(outputDir, "competitor-relevant-pages.json"), allPages);
await writeJson(path.join(outputDir, "step-01-summary.json"), summary);
await fs.writeFile(path.join(outputDir, "competitor-ranked-keywords.csv"), toCsv(allKeywords), "utf8");
await fs.writeFile(path.join(outputDir, "competitor-relevant-pages.csv"), toCsv(allPages), "utf8");
await fs.writeFile(reportPath, renderReport(summary), "utf8");

console.log(`${execute ? "Completed" : "Prepared"} Step 1 for ${domains.length} domains.`);
console.log(`Ranked keyword rows: ${allKeywords.length}`);
console.log(`Relevant page rows: ${allPages.length}`);
console.log(`Recorded API cost: $${summary.cost.total.toFixed(4)}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);
if (!execute) console.log("Dry run only. Add --execute to call DataForSEO.");

async function callDataForSeo(endpoint, payload) {
  const response = await fetch(`${LABS_BASE}/${endpoint}/live`, {
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

function normalizeRankedKeywords(domain, response) {
  const items = response?.tasks?.flatMap((task) => task.result || []).flatMap((result) => result.items || []) || [];
  return items.map((item) => {
    const keywordData = item.keyword_data || {};
    const keywordInfo = keywordData.keyword_info || {};
    const properties = keywordData.keyword_properties || {};
    const intent = keywordData.search_intent_info || {};
    const serpItem = item.ranked_serp_element?.serp_item || {};
    const keyword = cleanText(keywordData.keyword);
    const url = cleanText(serpItem.url);
    const title = cleanText(serpItem.title);
    const relevanceText = `${keyword} ${url} ${title}`;
    return {
      domain,
      keyword,
      normalizedKeyword: normalizeKeyword(keyword),
      isIndustryRelevant: RELEVANCE_PATTERNS.some((pattern) => pattern.test(relevanceText)),
      searchVolume: numberOrNull(keywordInfo.search_volume),
      cpc: numberOrNull(keywordInfo.cpc),
      competition: numberOrNull(keywordInfo.competition),
      keywordDifficulty: numberOrNull(properties.keyword_difficulty ?? keywordData.serp_info?.keyword_difficulty),
      mainIntent: cleanText(intent.main_intent),
      foreignIntents: Array.isArray(intent.foreign_intent) ? intent.foreign_intent.join("|") : "",
      coreKeyword: cleanText(properties.core_keyword),
      resultType: cleanText(serpItem.type),
      rankGroup: numberOrNull(serpItem.rank_group),
      rankAbsolute: numberOrNull(serpItem.rank_absolute),
      rankingDomain: cleanText(serpItem.domain),
      url,
      title,
      description: cleanText(serpItem.description),
      etv: numberOrNull(serpItem.etv),
      estimatedPaidTrafficCost: numberOrNull(serpItem.estimated_paid_traffic_cost),
      serpFeatures: Array.isArray(keywordData.serp_info?.serp_item_types)
        ? keywordData.serp_info.serp_item_types.join("|")
        : "",
      keywordUpdatedAt: cleanText(keywordInfo.last_updated_time),
      serpUpdatedAt: cleanText(keywordData.serp_info?.last_updated_time),
      source: "dataforseo_labs_ranked_keywords"
    };
  });
}

function normalizeRelevantPages(domain, response) {
  const items = response?.tasks?.flatMap((task) => task.result || []).flatMap((result) => result.items || []) || [];
  return items.map((item) => {
    const organic = item.metrics?.organic || {};
    const pageAddress = cleanText(item.page_address);
    return {
      domain,
      pageAddress,
      isIndustryRelevant: RELEVANCE_PATTERNS.some((pattern) => pattern.test(pageAddress)),
      organicKeywordCount: numberOrNull(organic.count),
      organicEtv: numberOrNull(organic.etv),
      estimatedPaidTrafficCost: numberOrNull(organic.estimated_paid_traffic_cost),
      positions1: numberOrNull(organic.pos_1),
      positions2To3: numberOrNull(organic.pos_2_3),
      positions4To10: numberOrNull(organic.pos_4_10),
      positions11To20: numberOrNull(organic.pos_11_20),
      isNew: numberOrNull(organic.is_new),
      isUp: numberOrNull(organic.is_up),
      isDown: numberOrNull(organic.is_down),
      isLost: numberOrNull(organic.is_lost),
      source: "dataforseo_labs_relevant_pages"
    };
  });
}

function buildSummary(results, requestRecords, keywords, pages) {
  const byDomain = results.map((entry) => {
    const relevantKeywords = entry.rankedKeywords.filter((row) => row.isIndustryRelevant);
    const relevantPages = entry.relevantPages.filter((row) => row.isIndustryRelevant);
    return {
      domain: entry.domain,
      keywordRows: entry.rankedKeywords.length,
      relevantKeywordRows: relevantKeywords.length,
      relevantSearchVolume: sum(relevantKeywords.map((row) => row.searchVolume)),
      topThreeKeywords: relevantKeywords.filter((row) => Number(row.rankGroup || 999) <= 3).length,
      topTenKeywords: relevantKeywords.filter((row) => Number(row.rankGroup || 999) <= 10).length,
      pageRows: entry.relevantPages.length,
      relevantPageRows: relevantPages.length,
      estimatedOrganicTraffic: sum(entry.relevantPages.map((row) => row.organicEtv)),
      errors: entry.errors
    };
  });
  const endpointCost = requestRecords.reduce((accumulator, request) => {
    accumulator[request.endpoint] = (accumulator[request.endpoint] || 0) + Number(request.cost || 0);
    return accumulator;
  }, {});
  return {
    generatedAt,
    mode: execute ? "production" : "dry-run",
    step: 1,
    objective: "Pull competitor-ranked keywords and relevant pages",
    locationCode,
    languageCode,
    domains,
    totals: {
      domains: domains.length,
      rankedKeywordRows: keywords.length,
      industryRelevantKeywordRows: keywords.filter((row) => row.isIndustryRelevant).length,
      relevantPageRows: pages.length,
      industryRelevantPageRows: pages.filter((row) => row.isIndustryRelevant).length,
      errors: byDomain.reduce((count, row) => count + row.errors.length, 0)
    },
    cost: {
      currency: "USD",
      byEndpoint: endpointCost,
      total: sum(Object.values(endpointCost))
    },
    byDomain: byDomain.sort((a, b) => b.relevantSearchVolume - a.relevantSearchVolume),
    completionGate: {
      passed: byDomain.every((row) => row.keywordRows > 0 || row.errors.length > 0) && requestRecords.length === domains.length * 2,
      criteria: "Every seed competitor has a response or documented exclusion, with keywords, pages, positions, traffic fields, timestamps, and cost provenance."
    }
  };
}

function requestRecord(domain, endpoint, payload, response = null) {
  const task = response?.tasks?.[0];
  return {
    domain,
    endpoint,
    requestedAt: new Date().toISOString(),
    payload,
    taskId: task?.id || null,
    statusCode: task?.status_code || (execute ? null : 0),
    statusMessage: task?.status_message || (execute ? null : "dry-run"),
    cost: Number(task?.cost || response?.cost || 0)
  };
}

function renderReport(summary) {
  const lines = [
    "# Step 1: Competitor Ranked Keywords And Relevant Pages",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    `Market: United States (${summary.locationCode}), language ${summary.languageCode}`,
    "",
    `Mode: ${summary.mode}`,
    "",
    "## Completion Gate",
    "",
    `Status: ${summary.completionGate.passed ? "Passed" : "Not passed"}`,
    "",
    summary.completionGate.criteria,
    "",
    "## Totals",
    "",
    `- Domains: ${summary.totals.domains}`,
    `- Ranked keyword rows: ${summary.totals.rankedKeywordRows}`,
    `- Industry-relevant keyword rows: ${summary.totals.industryRelevantKeywordRows}`,
    `- Relevant page rows: ${summary.totals.relevantPageRows}`,
    `- Industry-relevant page rows: ${summary.totals.industryRelevantPageRows}`,
    `- Recorded API cost: $${summary.cost.total.toFixed(4)}`,
    `- Errors: ${summary.totals.errors}`,
    "",
    "## Domain Coverage",
    "",
    "| Domain | Keywords | Relevant keywords | Relevant volume | Top 3 | Top 10 | Pages | Estimated page ETV | Errors |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...summary.byDomain.map(
      (row) =>
        `| ${row.domain} | ${row.keywordRows} | ${row.relevantKeywordRows} | ${Math.round(row.relevantSearchVolume)} | ${row.topThreeKeywords} | ${row.topTenKeywords} | ${row.pageRows} | ${Math.round(row.estimatedOrganicTraffic)} | ${row.errors.length} |`
    ),
    "",
    "## Cost Ledger",
    "",
    ...Object.entries(summary.cost.byEndpoint).map(([endpoint, cost]) => `- ${endpoint}: $${Number(cost).toFixed(4)}`),
    "",
    "## Interpretation Rules",
    "",
    "- This step collects evidence. It does not define clusters or page targets by itself.",
    "- Industry relevance is a transparent first-pass filter and will be reviewed during normalization.",
    "- Search volume can be incomplete for sensitive terms, so later steps also use SERP overlap, ranking URLs, ETV, GSC, and catalog evidence.",
    "- Raw API responses remain alongside normalized exports for auditability.",
    ""
  ];
  return lines.join("\n");
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n") + "\n";
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function loadDomains() {
  if (args.domainFile) {
    const text = await fs.readFile(path.resolve(ROOT, args.domainFile), "utf8");
    return unique(text.split(/\r?\n|,/).map(normalizeDomain).filter(Boolean));
  }
  if (args.domains) return unique(String(args.domains).split(",").map(normalizeDomain).filter(Boolean));
  return DEFAULT_DOMAINS;
}

async function loadEnvFile(envPath) {
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] ||= value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function writeJson(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (["execute", "help"].includes(key)) parsed[key] = true;
    else {
      parsed[key] = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function normalizeDomain(value) {
  return cleanText(value).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

function normalizeKeyword(value) {
  return cleanText(value).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function safeName(value) {
  return value.replace(/[^a-z0-9.-]+/gi, "-");
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function positiveInteger(value) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function unique(values) {
  return [...new Set(values)];
}

function printHelp() {
  console.log(`Usage: node scripts/pull-seo-competitor-keywords.mjs [options]

Options:
  --execute                 Call production DataForSEO endpoints.
  --domains <csv>           Override the default competitor domains.
  --domain-file <path>      Load competitor domains from a line/CSV file.
  --keyword-limit <n>       Ranked keywords per domain, default 1000.
  --page-limit <n>          Relevant pages per domain, default 100.
  --location-code <n>       DataForSEO location code, default 2840 (US).
  --language <code>         Language code, default en.
  --out-dir <path>          Artifact directory.
  --report <path>           Human-readable report path.
  --env <path>              Additional env file.
  --help                    Show this help.`);
}
