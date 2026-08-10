import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const METRICS_ENDPOINT = "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live";
const SERP_ENDPOINT = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";
const KNOWN_BRAND_PATTERN = /\b(wm|zelex|irontech|starpery|6ye|sedoll|se doll|jy doll|sy doll|funwest|climax|tantaly|fanreal|galatea|rosemary|piper doll|dolls castle|real lady|erovenus|rosretty|moonvale|ai tech)\b/i;
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
const candidateLimit = Math.min(positiveInteger(args.candidateLimit) ?? 1000, 1000);
const serpLimit = Math.min(positiveInteger(args.serpLimit) ?? 100, 250);
const concurrency = Math.min(positiveInteger(args.concurrency) ?? 6, 12);
const desktopDepth = Math.min(positiveInteger(args.desktopDepth) ?? 20, 100);
const mobileDepth = Math.min(positiveInteger(args.mobileDepth) ?? 10, 100);
const locationCode = positiveInteger(args.locationCode) ?? 2840;
const languageCode = args.language || "en";
const keywordFile = args.keywordFile ? path.resolve(ROOT, args.keywordFile) : null;
const step2Dir = path.resolve(
  ROOT,
  args.step2Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-02-keyword-universe")
);
const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-03-live-metrics-serps")
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-03-live-metrics-serps.md`)
);

if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const universe = JSON.parse(await fs.readFile(path.join(step2Dir, "candidate-keyword-universe.json"), "utf8"));
const targetedKeywords = keywordFile ? JSON.parse(await fs.readFile(keywordFile, "utf8")) : null;
const prequalified = targetedKeywords
  ? selectTargetedKeywords(universe, targetedKeywords)
  : selectPrequalified(universe, candidateLimit);
let metricsResponse = null;
let freshMetrics = [];
const costLedger = [];

if (execute) {
  metricsResponse = await callDataForSeo(METRICS_ENDPOINT, [
    {
      keywords: prequalified.map((item) => item.keyword),
      location_code: locationCode,
      language_code: languageCode,
      include_adult_keywords: true,
      sort_by: "relevance",
      tag: `dollwow-step-03-metrics-${dateStamp}`
    }
  ]);
  freshMetrics = normalizeMetrics(metricsResponse);
  recordCost(costLedger, "keywords_data/google_ads/search_volume/live", metricsResponse, {
    keywordCount: prequalified.length
  });
} else {
  freshMetrics = prequalified.map((item) => ({
    keyword: item.keyword,
    normalizedKeyword: item.normalizedKeyword,
    searchVolume: item.searchVolume,
    competition: item.competition,
    competitionIndex: null,
    cpc: item.cpc,
    lowTopOfPageBid: null,
    highTopOfPageBid: null,
    monthlySearches: []
  }));
}

const enriched = mergeMetrics(prequalified, freshMetrics);
const selectedKeywords = targetedKeywords
  ? enriched.map((item, index) => ({ ...item, serpPriority: index + 1 }))
  : selectBattlefieldKeywords(enriched, serpLimit);
const serpRequests = selectedKeywords.flatMap((item) => [
  { ...item, device: "desktop", os: "windows", depth: desktopDepth },
  { ...item, device: "mobile", os: "android", depth: mobileDepth }
]);

let serpResponses = [];
if (execute) {
  serpResponses = await mapConcurrent(serpRequests, concurrency, async (request, index) => {
    try {
      const response = await callDataForSeo(
        SERP_ENDPOINT,
        [
          {
            keyword: request.keyword,
            location_code: locationCode,
            language_code: languageCode,
            device: request.device,
            os: request.os,
            depth: request.depth,
            tag: `dollwow-step-03-${request.device}-${index + 1}-${dateStamp}`
          }
        ],
        3
      );
      recordCost(costLedger, "serp/google/organic/live/advanced", response, {
        keyword: request.keyword,
        device: request.device,
        depth: request.depth
      });
      return { request, response, error: null };
    } catch (error) {
      return { request, response: null, error: error.message };
    }
  });
} else {
  serpResponses = serpRequests.map((request) => ({ request, response: null, error: null }));
}

const normalizedSerps = normalizeSerps(serpResponses);
const organicRows = normalizedSerps.flatMap((serp) => serp.organicResults.map((item) => ({
  keyword: serp.keyword,
  battlefield: serp.battlefield,
  device: serp.device,
  rankGroup: item.rankGroup,
  rankAbsolute: item.rankAbsolute,
  domain: item.domain,
  url: item.url,
  title: item.title,
  description: item.description,
  pageType: item.pageType,
  isDollWow: item.domain === "dollwow.com"
})));
const featureRows = normalizedSerps.map((serp) => ({
  keyword: serp.keyword,
  battlefield: serp.battlefield,
  device: serp.device,
  itemTypes: serp.itemTypes.join("|"),
  peopleAlsoAsk: serp.peopleAlsoAsk.join("|"),
  relatedSearches: serp.relatedSearches.join("|"),
  organicCount: serp.organicResults.length,
  dollWowBestRank: serp.dollWowBestRank
}));
const summary = buildSummary({
  universe,
  prequalified,
  freshMetrics,
  selectedKeywords,
  serpRequests,
  serpResponses,
  normalizedSerps,
  organicRows,
  costLedger
});

await writeJson(path.join(outputDir, "prequalified-keywords.json"), prequalified);
await fs.writeFile(path.join(outputDir, "prequalified-keywords.csv"), toCsv(prequalified), "utf8");
await writeJson(path.join(outputDir, "keyword-metrics.json"), enriched);
await fs.writeFile(path.join(outputDir, "keyword-metrics.csv"), toCsv(enriched), "utf8");
await writeJson(path.join(outputDir, "selected-serp-keywords.json"), selectedKeywords);
await fs.writeFile(path.join(outputDir, "selected-serp-keywords.csv"), toCsv(selectedKeywords), "utf8");
await writeJson(path.join(outputDir, "raw-dataforseo-keyword-metrics.json"), metricsResponse || {});
await writeJson(path.join(outputDir, "raw-dataforseo-serp-responses.json"), serpResponses);
await writeJson(path.join(outputDir, "normalized-serps.json"), normalizedSerps);
await fs.writeFile(path.join(outputDir, "organic-serp-results.csv"), toCsv(organicRows), "utf8");
await fs.writeFile(path.join(outputDir, "serp-features.csv"), toCsv(featureRows), "utf8");
await writeJson(path.join(outputDir, "cost-ledger.json"), costLedger);
await writeJson(path.join(outputDir, "source-manifest.json"), {
  generatedAt,
  mode: execute ? "production" : "dry-run",
  sourceStep: step2Dir,
  endpoints: [METRICS_ENDPOINT, SERP_ENDPOINT],
  locationCode,
  languageCode,
  candidateLimit,
  serpLimit,
  desktopDepth,
  mobileDepth,
  concurrency,
  keywordFile: keywordFile ? path.relative(ROOT, keywordFile) : null
});
await writeJson(path.join(outputDir, "step-03-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary), "utf8");

console.log(`${execute ? "Completed" : "Prepared"} Step 3 live metrics and SERP collection.`);
console.log(`Prequalified metrics candidates: ${prequalified.length}`);
console.log(`Selected SERP keywords: ${selectedKeywords.length}`);
console.log(`SERP requests: ${serpRequests.length}`);
console.log(`Successful SERPs: ${summary.serps.successful}`);
console.log(`Recorded API cost: $${summary.cost.total.toFixed(4)}`);
console.log(`Completion gate: ${summary.completionGate.status}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);
if (!execute) console.log("Dry run only. Add --execute to call DataForSEO.");

function selectPrequalified(rows, limit) {
  return rows
    .filter(isPaidDataCandidate)
    .map((item) => ({ ...item, battlefield: classifyBattlefield(item), evidenceScore: evidenceScore(item) }))
    .sort((a, b) => b.evidenceScore - a.evidenceScore || Number(b.searchVolume || 0) - Number(a.searchVolume || 0))
    .slice(0, limit);
}

function selectTargetedKeywords(rows, targets) {
  const byKeyword = new Map(rows.map((item) => [normalizeKeyword(item.normalizedKeyword || item.keyword), item]));
  const seen = new Set();
  return targets.flatMap((target) => {
    const keyword = cleanText(typeof target === "string" ? target : target.keyword);
    const normalizedKeyword = normalizeKeyword(keyword);
    if (!keyword || seen.has(normalizedKeyword)) return [];
    seen.add(normalizedKeyword);
    const existing = byKeyword.get(normalizedKeyword) || {
      keyword,
      normalizedKeyword,
      sourceTypes: "coverage_addendum_seed",
      sourceIds: "coverage_addendum",
      sourceUrls: "",
      sourceOccurrenceCount: 1,
      competitorDomainCount: 0,
      competitorDomains: "",
      searchVolume: null,
      cpc: null,
      competition: null,
      keywordDifficulty: null,
      bestCompetitorRank: null
    };
    return [{
      ...existing,
      keyword,
      normalizedKeyword,
      strategicPillar: typeof target === "string" ? "" : cleanText(target.pillar),
      rationale: typeof target === "string" ? "" : cleanText(target.rationale),
      battlefield: classifyBattlefield(existing),
      evidenceScore: evidenceScore(existing)
    }];
  });
}

function isPaidDataCandidate(item) {
  const keyword = cleanText(item.keyword);
  if (!keyword || keyword.length > 80 || keyword.split(/\s+/).length > 7) return false;
  const sourceTypes = splitPipe(item.sourceTypes);
  const hasKnownBrand = KNOWN_BRAND_PATTERN.test(keyword);
  const hasAdultContext = /\b(sex\s*dolls?|love dolls?|companion dolls?|tpe dolls?|silicone dolls?|futa|sexbots?|adult dolls?|real dolls?|lifelike dolls?)\b/i.test(keyword);
  const hasAdultGenderContext = /\b(male|female) dolls?\b/i.test(keyword) && /\b(sex|love|companion|life size|anatomically|realistic|silicone|tpe|body)\b/i.test(keyword);
  if (!hasAdultContext && !hasAdultGenderContext && !hasKnownBrand) return false;
  const hasStrategicSource = sourceTypes.some((type) =>
    [
      "competitor_ranked_keyword",
      "dataforseo_keyword_idea",
      "existing_primary_keyword",
      "existing_secondary_keyword",
      "existing_content_title",
      "existing_sitemap_route",
      "catalog_brand",
      "catalog_material",
      "catalog_brand_material",
      "catalog_stock_path",
      "catalog_customization",
      "catalog_body_type"
    ].includes(type)
  );
  if (!hasStrategicSource) return false;
  if (sourceTypes.every((type) => ["catalog_product_title", "catalog_height"].includes(type))) return false;
  if (/\b(sexdolls?|sexdalls?)\b/i.test(keyword) || /^(sec dolls?|s dolls|love dolls com)$/i.test(keyword)) return false;
  if (/\b(vintage|mattel|barbie|porcelain|reborn|american girl|bratz|dollhouse|toy robot|robot doll toy|anime doll|eve doll|mr clean|rubber bands|doll clothes|tonner|sweet rosemary|sweet love|pippa doll|so truly|truly real|inflatable|blow up)\b/i.test(keyword)) return false;
  if (/\b(photos?|pictures?)\b/i.test(keyword) || /^i love doll$/i.test(keyword)) return false;
  if (/\b202[0-5]\b/.test(keyword)) return false;
  return true;
}

function evidenceScore(item) {
  const sourceTypes = splitPipe(item.sourceTypes);
  const volume = Number(item.searchVolume || 0);
  const difficulty = Number(item.keywordDifficulty);
  let score = Number(item.competitorDomainCount || 0) * 35;
  score += Math.log10(volume + 1) * 30;
  score += Math.min(sourceTypes.length, 5) * 16;
  score += sourceTypes.some((type) => type.startsWith("existing_")) ? 40 : 0;
  score += sourceTypes.some((type) => type.startsWith("catalog_")) ? 28 : 0;
  score += sourceTypes.includes("dataforseo_keyword_idea") ? 12 : 0;
  score += Number(item.bestCompetitorRank || 999) <= 10 ? 20 : 0;
  score += Math.min(Number(item.cpc || 0) * 6, 24);
  if (Number.isFinite(difficulty) && difficulty <= 70) score += (70 - difficulty) * 0.25;
  return Number(score.toFixed(2));
}

function classifyBattlefield(item) {
  const keyword = item.normalizedKeyword || item.keyword.toLowerCase();
  const sources = splitPipe(item.sourceTypes);
  if (KNOWN_BRAND_PATTERN.test(keyword) || (sources.includes("catalog_brand") && !/^(sex|silicone|tpe|custom|male|female|realistic|ready)/.test(keyword))) return "brands";
  if (/\b(tpe|silicone|material|latex)\b/.test(keyword)) return "materials";
  if (/\b(male|man|men|futa|trans|female)\b/.test(keyword)) return "audiences";
  if (/\b(mini|torso|small|petite|lightweight|life size|full size|height|cm|inch|bbw|plump|curvy)\b/.test(keyword)) return "body-and-form";
  if (/\b(cost|price|cheap|affordable|buy|sale|shipping|warehouse|ready to ship|custom|review|best)\b/.test(keyword)) return "buying";
  if (/\b(clean|care|storage|powder|repair|maintain|lifespan|safe|legal|scam|privacy|discreet|warranty|return)\b/.test(keyword)) return "care-and-trust";
  if (/\b(robot|robotic| ai |sexbot|talking|heated|interactive)\b/.test(` ${keyword} `)) return "technology";
  if (/\b(asian|black|african|japanese|latina|brunette|blonde|redhead)\b/.test(keyword)) return "appearance";
  return "core";
}

function normalizeMetrics(response) {
  return (response.tasks || [])
    .flatMap((task) => task.result || [])
    .filter((item) => item.keyword)
    .map((item) => ({
      keyword: cleanText(item.keyword),
      normalizedKeyword: normalizeKeyword(item.keyword),
      searchVolume: numberOrNull(item.search_volume),
      competition: numberOrNull(item.competition),
      competitionIndex: numberOrNull(item.competition_index),
      cpc: numberOrNull(item.cpc),
      lowTopOfPageBid: numberOrNull(item.low_top_of_page_bid),
      highTopOfPageBid: numberOrNull(item.high_top_of_page_bid),
      monthlySearches: item.monthly_searches || []
    }));
}

function mergeMetrics(candidates, metricRows) {
  const byKeyword = new Map(metricRows.map((item) => [item.normalizedKeyword, item]));
  return candidates.map((item) => {
    const fresh = byKeyword.get(item.normalizedKeyword);
    const searchVolume = fresh?.searchVolume ?? numberOrNull(item.searchVolume);
    const cpc = fresh?.cpc ?? numberOrNull(item.cpc);
    const opportunityScore = item.evidenceScore + Math.log10(Number(searchVolume || 0) + 1) * 12 + Math.min(Number(cpc || 0) * 3, 12);
    return {
      ...item,
      priorSearchVolume: numberOrNull(item.searchVolume),
      searchVolume,
      cpc,
      competition: fresh?.competition ?? numberOrNull(item.competition),
      competitionIndex: fresh?.competitionIndex ?? null,
      lowTopOfPageBid: fresh?.lowTopOfPageBid ?? null,
      highTopOfPageBid: fresh?.highTopOfPageBid ?? null,
      monthlySearches: fresh?.monthlySearches ?? [],
      hasFreshMetrics: Boolean(fresh),
      opportunityScore: Number(opportunityScore.toFixed(2))
    };
  });
}

function selectBattlefieldKeywords(rows, limit) {
  const quotas = {
    core: 12,
    materials: 14,
    audiences: 12,
    "body-and-form": 12,
    buying: 16,
    "care-and-trust": 10,
    technology: 6,
    brands: 12,
    appearance: 6
  };
  const selected = [];
  const selectedKeys = new Set();
  const sorted = [...rows].sort((a, b) => b.opportunityScore - a.opportunityScore || Number(b.searchVolume || 0) - Number(a.searchVolume || 0));
  for (const [battlefield, quota] of Object.entries(quotas)) {
    for (const item of sorted.filter((row) => row.battlefield === battlefield)) {
      if (selected.filter((row) => row.battlefield === battlefield).length >= quota || selected.length >= limit) break;
      if (isNearDuplicate(item, selected)) continue;
      selected.push(item);
      selectedKeys.add(item.normalizedKeyword);
    }
  }
  for (const item of sorted) {
    if (selected.length >= limit) break;
    if (selectedKeys.has(item.normalizedKeyword) || isNearDuplicate(item, selected)) continue;
    selected.push(item);
    selectedKeys.add(item.normalizedKeyword);
  }
  return selected
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .map((item, index) => ({ ...item, serpPriority: index + 1 }));
}

function isNearDuplicate(item, selected) {
  const tokens = meaningfulTokens(item.normalizedKeyword);
  return selected.some((existing) => {
    if (existing.battlefield !== item.battlefield) return false;
    return jaccard(tokens, meaningfulTokens(existing.normalizedKeyword)) >= 0.86;
  });
}

function normalizeSerps(rows) {
  return rows.map(({ request, response, error }) => {
    const task = response?.tasks?.[0] || {};
    const result = task.result?.[0] || {};
    const items = result.items || [];
    const organicResults = items
      .filter((item) => item.type === "organic" && item.url)
      .map((item) => ({
        rankGroup: numberOrNull(item.rank_group),
        rankAbsolute: numberOrNull(item.rank_absolute),
        domain: normalizeDomain(item.domain || hostname(item.url)),
        url: item.url || "",
        title: cleanText(item.title),
        description: cleanText(item.description),
        pageType: classifyPage(item)
      }))
      .sort((a, b) => Number(a.rankGroup || 999) - Number(b.rankGroup || 999));
    const itemTypes = unique(items.map((item) => item.type).filter(Boolean));
    const peopleAlsoAsk = unique(collectFeatureText(items, /people_also_ask/i));
    const relatedSearches = unique(collectFeatureText(items, /related_search/i));
    const dollWowRanks = organicResults.filter((item) => item.domain === "dollwow.com").map((item) => item.rankGroup).filter(Boolean);
    return {
      keyword: request.keyword,
      normalizedKeyword: request.normalizedKeyword,
      battlefield: request.battlefield,
      serpPriority: request.serpPriority,
      device: request.device,
      depth: request.depth,
      searchVolume: request.searchVolume,
      cpc: request.cpc,
      statusCode: task.status_code || null,
      statusMessage: task.status_message || (error ? "error" : "dry-run"),
      error,
      checkUrl: result.check_url || "",
      itemTypes,
      peopleAlsoAsk,
      relatedSearches,
      dollWowBestRank: dollWowRanks.length ? Math.min(...dollWowRanks) : null,
      organicResults
    };
  });
}

function collectFeatureText(items, typePattern) {
  const values = [];
  const walk = (value, inheritedType = "") => {
    if (!value || typeof value !== "object") return;
    const type = cleanText(value.type || inheritedType);
    if (typePattern.test(type)) {
      for (const key of ["title", "keyword", "query", "question", "text"]) {
        if (typeof value[key] === "string" && cleanText(value[key])) values.push(cleanText(value[key]));
      }
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) child.forEach((item) => walk(item, type));
      else if (child && typeof child === "object") walk(child, type);
    }
  };
  items.forEach((item) => walk(item));
  return values;
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
  if (/\/product|\/products|\/p\//.test(pathname)) return "product";
  if (/\/blog|\/guide|\/learn|\/article|\/faq|\/how-|\/what-|\/best-|\/review/.test(pathname)) return "guide";
  if (/\/collections|\/collection|\/category|\/shop|\/sex-dolls|\/dolls|\/male-dolls|\/silicone|\/tpe/.test(pathname)) return "collection";
  if (/^(best|how|what|review|guide|compare)/.test(title)) return "guide";
  return "other";
}

function buildSummary({ universe: allRows, prequalified: metricCandidates, freshMetrics: metricRows, selectedKeywords: selected, serpRequests: requests, serpResponses: responses, normalizedSerps: serps, organicRows: organic, costLedger: costs }) {
  const successful = responses.filter((item) => !item.error && (!execute || Number(item.response?.tasks?.[0]?.status_code || 0) < 40000)).length;
  const expected = requests.length;
  const successRate = expected ? successful / expected : 0;
  const deviceCoverage = selected.filter((item) => {
    const devices = new Set(serps.filter((serp) => serp.normalizedKeyword === item.normalizedKeyword && !serp.error).map((serp) => serp.device));
    return devices.has("desktop") && devices.has("mobile");
  }).length;
  const domainStats = aggregateDomains(organic);
  const pageTypes = countBy(organic, "pageType");
  const itemTypes = countValues(serps.flatMap((serp) => serp.itemTypes));
  const battlefieldCounts = countBy(selected, "battlefield");
  const totalCost = costs.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const gatePassed = !execute || (metricRows.length > 0 && successRate >= 0.95 && deviceCoverage >= Math.ceil(selected.length * 0.95));
  return {
    generatedAt,
    mode: execute ? "production" : "dry-run",
    market: { locationCode, languageCode },
    candidates: {
      rawUniverse: allRows.length,
      prequalifiedForMetrics: metricCandidates.length,
      freshMetricRows: metricRows.length,
      selectedForSerps: selected.length,
      battlefieldCounts
    },
    serps: {
      requested: expected,
      successful,
      failed: expected - successful,
      successRate: Number(successRate.toFixed(4)),
      keywordsWithBothDevices: deviceCoverage,
      desktopDepth,
      mobileDepth,
      organicRows: organic.length,
      pageTypes,
      itemTypes
    },
    topDomains: domainStats.slice(0, 30),
    cost: { total: Number(totalCost.toFixed(4)), ledger: costs },
    completionGate: {
      status: gatePassed ? "Passed" : "Failed",
      criteria: "Fresh US metrics exist and at least 95% of selected keywords have successful desktop and mobile live SERPs."
    }
  };
}

function aggregateDomains(rows) {
  const map = new Map();
  for (const row of rows.filter((item) => item.domain && !item.isDollWow)) {
    const current = map.get(row.domain) || { domain: row.domain, keywords: new Set(), appearances: 0, top10: 0, bestRank: null, pageTypes: {} };
    current.keywords.add(row.keyword);
    current.appearances += 1;
    if (Number(row.rankGroup || 999) <= 10) current.top10 += 1;
    current.bestRank = current.bestRank === null ? row.rankGroup : Math.min(current.bestRank, row.rankGroup || 999);
    current.pageTypes[row.pageType] = (current.pageTypes[row.pageType] || 0) + 1;
    map.set(row.domain, current);
  }
  return [...map.values()]
    .map((item) => ({ ...item, keywordCount: item.keywords.size, keywords: undefined }))
    .sort((a, b) => b.top10 - a.top10 || b.keywordCount - a.keywordCount || b.appearances - a.appearances);
}

function renderReport(summary) {
  return `# Step 3: Live US Keyword Metrics And SERPs

Generated: ${summary.generatedAt}

Mode: ${summary.mode}

## Completion Gate

Status: ${summary.completionGate.status}

${summary.completionGate.criteria}

## Coverage

- Raw Step 2 universe: ${summary.candidates.rawUniverse}
- Prequalified for fresh metrics: ${summary.candidates.prequalifiedForMetrics}
- Fresh metric rows returned: ${summary.candidates.freshMetricRows}
- Keywords selected for live SERPs: ${summary.candidates.selectedForSerps}
- Desktop and mobile SERPs requested: ${summary.serps.requested}
- Successful SERPs: ${summary.serps.successful}
- Keywords with both devices: ${summary.serps.keywordsWithBothDevices}
- Normalized organic result rows: ${summary.serps.organicRows}
- Recorded DataForSEO cost: $${summary.cost.total.toFixed(4)}

## Battlefield Coverage

| Battlefield | Keywords |
| --- | ---: |
${Object.entries(summary.candidates.battlefieldCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => `| ${name} | ${count} |`).join("\n")}

## Top Live US Competitors

| Domain | Keywords | Appearances | Top 10 | Best rank | Page types |
| --- | ---: | ---: | ---: | ---: | --- |
${summary.topDomains.slice(0, 20).map((item) => `| ${item.domain} | ${item.keywordCount} | ${item.appearances} | ${item.top10} | ${item.bestRank ?? ""} | ${Object.entries(item.pageTypes).map(([type, count]) => `${type}: ${count}`).join(", ")} |`).join("\n")}

## SERP Composition

${Object.entries(summary.serps.pageTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => `- ${type}: ${count}`).join("\n")}

## Notes

- Search-volume reporting for adult queries may be incomplete even with adult keywords enabled. SERP activity, competitor coverage, CPC, catalog fit, and first-party impressions remain part of later scoring.
- Step 4 performs final normalization and rejected-term logging. Paid SERP collection excludes obvious malformed terms but preserves the untouched Step 2 universe.
- The normalized desktop and mobile result sets become the evidence for weighted SERP-overlap clustering in Step 5.
`;
}

async function callDataForSeo(endpoint, payload, retries = 1) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      const failedTask = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
      if (!response.ok || Number(body.status_code || 0) >= 40000 || failedTask || body.tasks_error) {
        throw new Error(failedTask?.status_message || body.status_message || `DataForSEO HTTP ${response.status}`);
      }
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(400 * attempt);
    }
  }
  throw lastError;
}

function recordCost(ledger, endpoint, response, context) {
  for (const task of response.tasks || []) {
    ledger.push({ endpoint, taskId: task.id || null, cost: Number(task.cost || 0), requestedAt: generatedAt, ...context });
  }
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function splitPipe(value) {
  return String(value || "").split("|").map(cleanText).filter(Boolean);
}

function meaningfulTokens(value) {
  return new Set(normalizeKeyword(value).split(" ").filter((token) => token && !["sex", "doll", "dolls", "love", "realistic"].includes(token)));
}

function jaccard(left, right) {
  if (!left.size && !right.size) return 1;
  const intersection = [...left].filter((item) => right.has(item)).length;
  return intersection / new Set([...left, ...right]).size;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function countValues(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
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

function normalizeKeyword(value) {
  return cleanText(value).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = unique(rows.flatMap((row) => Object.keys(row))).filter((key) => !["monthlySearches"].includes(key));
  const escape = (value) => {
    const text = Array.isArray(value) ? value.join("|") : value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n")}\n`;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (["help", "execute"].includes(key)) parsed[key] = true;
    else {
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
  npm run seo:intelligence:step3
  npm run seo:intelligence:step3 -- --execute
  npm run seo:intelligence:step3 -- --execute --candidate-limit 1000 --serp-limit 100 --concurrency 6
  npm run seo:intelligence:step3 -- --execute --keyword-file <json> --out-dir <path>

Dry-runs by default. Production mode refreshes US Google Ads keyword metrics, then collects desktop and mobile Google organic live advanced SERPs for the strongest battlefield-balanced candidates.`);
}
