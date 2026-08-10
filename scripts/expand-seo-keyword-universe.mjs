import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IDEAS_ENDPOINT = "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live";
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
const step1Dir = path.resolve(
  ROOT,
  args.step1Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-01-competitor-keywords")
);
const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-02-keyword-universe")
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-02-keyword-universe.md`)
);
const keywordLimit = positiveInteger(args.keywordLimit) ?? 1000;
const seedLimit = Math.min(positiveInteger(args.seedLimit) ?? 50, 200);
const locationCode = positiveInteger(args.locationCode) ?? 2840;
const languageCode = args.language || "en";

if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const occurrences = [];
const sourceStatus = [];
const costLedger = [];

const competitorRows = JSON.parse(
  await fs.readFile(path.join(step1Dir, "competitor-ranked-keywords.json"), "utf8")
);
for (const row of competitorRows.filter((item) => item.isIndustryRelevant && item.keyword)) {
  occurrences.push({
    keyword: row.keyword,
    normalizedKeyword: normalizeKeyword(row.keyword),
    sourceType: "competitor_ranked_keyword",
    sourceId: row.domain,
    sourceUrl: row.url,
    searchVolume: row.searchVolume,
    cpc: row.cpc,
    competition: row.competition,
    keywordDifficulty: row.keywordDifficulty,
    mainIntent: row.mainIntent,
    rank: row.rankGroup,
    collectedAt: generatedAt
  });
}
sourceStatus.push({ source: "competitor_ranked_keywords", status: "complete", rows: occurrences.length });

const seedSelection = selectDiverseSeeds(competitorRows, seedLimit);
await writeJson(path.join(outputDir, "dataforseo-seed-selection.json"), seedSelection);

let ideasResponse = null;
if (execute) {
  ideasResponse = await fetchKeywordIdeas(seedSelection.map((seed) => seed.keyword));
  await writeJson(path.join(outputDir, "raw-dataforseo-keyword-ideas.json"), ideasResponse);
  const task = ideasResponse.tasks?.[0];
  costLedger.push({
    endpoint: "dataforseo_labs/google/keyword_ideas/live",
    taskId: task?.id || null,
    cost: Number(task?.cost || ideasResponse.cost || 0),
    requestedAt: generatedAt
  });
  const ideas = normalizeIdeas(ideasResponse);
  occurrences.push(...ideas);
  sourceStatus.push({ source: "dataforseo_keyword_ideas", status: "complete", rows: ideas.length });
} else {
  sourceStatus.push({ source: "dataforseo_keyword_ideas", status: "dry-run", rows: 0 });
}

const productFeed = await loadProductFeed();
const catalogRows = catalogOccurrences(productFeed.products || []);
occurrences.push(...catalogRows);
sourceStatus.push({
  source: "shopify_public_product_feed",
  status: "complete",
  rows: catalogRows.length,
  details: `${productFeed.productCount || productFeed.products?.length || 0} public products`
});

const contentRows = await contentOccurrences();
occurrences.push(...contentRows);
sourceStatus.push({ source: "dollwow_existing_content", status: "complete", rows: contentRows.length });

const sitemapRows = await sitemapOccurrences();
occurrences.push(...sitemapRows);
sourceStatus.push({ source: "dollwow_sitemap_routes", status: "complete", rows: sitemapRows.length });

await appendOptionalExport("gsc", args.gscFile);
await appendOptionalExport("bing", args.bingFile);
sourceStatus.push({
  source: "live_serp_discoveries",
  status: "scheduled_step_3",
  rows: 0,
  details: "PAA, related searches, discussions, images, video, and shopping are collected with live SERPs in Step 3."
});

const universe = aggregateExactKeywords(occurrences);
const summary = buildSummary(universe, occurrences, seedSelection, sourceStatus, costLedger);

await writeJson(path.join(outputDir, "keyword-source-occurrences.json"), occurrences);
await fs.writeFile(path.join(outputDir, "keyword-source-occurrences.csv"), toCsv(occurrences), "utf8");
await writeJson(path.join(outputDir, "candidate-keyword-universe.json"), universe);
await fs.writeFile(path.join(outputDir, "candidate-keyword-universe.csv"), toCsv(universe), "utf8");
await writeJson(path.join(outputDir, "source-manifest.json"), {
  generatedAt,
  mode: execute ? "production" : "dry-run",
  locationCode,
  languageCode,
  seedLimit,
  keywordLimit,
  seedSelection,
  sourceStatus,
  costLedger
});
await writeJson(path.join(outputDir, "step-02-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary), "utf8");

console.log(`${execute ? "Completed" : "Prepared"} Step 2 keyword-universe expansion.`);
console.log(`Source occurrences: ${occurrences.length}`);
console.log(`Exact-normalized candidates: ${universe.length}`);
console.log(`Recorded API cost: $${summary.cost.total.toFixed(4)}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);
if (!execute) console.log("Dry run only. Add --execute to call DataForSEO Keyword Ideas.");

async function fetchKeywordIdeas(keywords) {
  const payload = [
    {
      keywords,
      location_code: locationCode,
      language_code: languageCode,
      closely_variants: false,
      ignore_synonyms: false,
      include_serp_info: true,
      include_clickstream_data: false,
      limit: keywordLimit,
      filters: [["keyword_info.search_volume", ">", 0]],
      order_by: ["relevance,desc", "keyword_info.search_volume,desc"],
      tag: `dollwow-step-02-keyword-ideas-${dateStamp}`
    }
  ];
  const response = await fetch(IDEAS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  const task = body.tasks?.[0];
  if (!response.ok || Number(body.status_code || 0) >= 40000 || Number(task?.status_code || 0) >= 40000) {
    throw new Error(task?.status_message || body.status_message || `DataForSEO HTTP ${response.status}`);
  }
  return body;
}

function normalizeIdeas(response) {
  const items = response.tasks?.flatMap((task) => task.result || []).flatMap((result) => result.items || []) || [];
  return items.map((item) => ({
    keyword: cleanText(item.keyword),
    normalizedKeyword: normalizeKeyword(item.keyword),
    sourceType: "dataforseo_keyword_idea",
    sourceId: "keyword_ideas",
    sourceUrl: "",
    searchVolume: numberOrNull(item.keyword_info?.search_volume),
    cpc: numberOrNull(item.keyword_info?.cpc),
    competition: numberOrNull(item.keyword_info?.competition),
    keywordDifficulty: numberOrNull(item.keyword_properties?.keyword_difficulty),
    mainIntent: cleanText(item.search_intent_info?.main_intent),
    rank: null,
    serpFeatures: Array.isArray(item.serp_info?.serp_item_types) ? item.serp_info.serp_item_types.join("|") : "",
    averageReferringDomains: numberOrNull(item.avg_backlinks_info?.referring_domains),
    collectedAt: generatedAt
  }));
}

function selectDiverseSeeds(rows, limit) {
  const groups = new Map();
  for (const row of rows.filter((item) => item.isIndustryRelevant && item.normalizedKeyword)) {
    const key = row.normalizedKeyword;
    const current = groups.get(key) || {
      keyword: key,
      domains: new Set(),
      searchVolume: 0,
      bestRank: 999,
      urls: new Set()
    };
    current.domains.add(row.domain);
    current.urls.add(row.url);
    current.searchVolume = Math.max(current.searchVolume, Number(row.searchVolume || 0));
    current.bestRank = Math.min(current.bestRank, Number(row.rankGroup || 999));
    groups.set(key, current);
  }
  const candidates = [...groups.values()]
    .map((item) => ({
      keyword: item.keyword,
      domainCount: item.domains.size,
      searchVolume: item.searchVolume,
      bestRank: item.bestRank,
      rankingUrlCount: item.urls.size,
      evidenceScore: item.domains.size * 100 + Math.log10(item.searchVolume + 1) * 10 + Math.max(0, 20 - item.bestRank)
    }))
    .filter((item) => item.searchVolume >= 20)
    .sort((a, b) => b.evidenceScore - a.evidenceScore || b.searchVolume - a.searchVolume);

  const selected = [];
  for (const candidate of candidates) {
    const tokens = seedSimilarityTokens(candidate.keyword);
    const tooSimilar = selected.some((item) => jaccard(tokens, seedSimilarityTokens(item.keyword)) >= 0.68);
    if (!tooSimilar) selected.push(candidate);
    if (selected.length >= limit) break;
  }
  return selected;
}

function catalogOccurrences(products) {
  const rows = [];
  for (const product of products) {
    const brand = cleanText(product.brand);
    const material = cleanText(product.material);
    const bodyType = cleanText(product.bodyType);
    const height = numberOrNull(product.heightCm);
    const stockStatus = cleanText(product.stockStatus);
    const sourceId = cleanText(product.handle);
    const sourceUrl = cleanText(product.canonicalUrl);
    const candidates = [
      [product.title, "catalog_product_title"],
      [brand ? `${brand} sex dolls` : "", "catalog_brand"],
      [brand ? `${brand} dolls` : "", "catalog_brand"],
      [material && material.toLowerCase() !== "adult doll" ? `${material} sex dolls` : "", "catalog_material"],
      [brand && material && material.toLowerCase() !== "adult doll" ? `${brand} ${material} sex dolls` : "", "catalog_brand_material"],
      [bodyType ? `${bodyType} sex dolls` : "", "catalog_body_type"],
      [height ? `${height}cm sex doll` : "", "catalog_height"],
      [stockStatus === "ready_to_ship" ? "ready to ship sex dolls" : "", "catalog_stock_path"],
      [product.customAvailable ? "custom sex dolls" : "", "catalog_customization"]
    ];
    for (const [keyword, sourceType] of candidates) {
      if (!cleanText(keyword)) continue;
      rows.push({
        keyword: cleanText(keyword),
        normalizedKeyword: normalizeKeyword(keyword),
        sourceType,
        sourceId,
        sourceUrl,
        searchVolume: null,
        cpc: null,
        competition: null,
        keywordDifficulty: null,
        mainIntent: "",
        rank: null,
        collectedAt: generatedAt
      });
    }
  }
  return rows;
}

async function contentOccurrences() {
  const base = path.join(ROOT, "content", "learn");
  const files = await walkFiles(base, ".md");
  const rows = [];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] || "";
    const relative = path.relative(ROOT, file);
    const primary = scalarField(frontmatter, "primaryKeyword");
    const secondary = arrayField(frontmatter, "secondaryKeywords");
    const title = scalarField(frontmatter, "title");
    for (const [keyword, sourceType] of [
      [primary, "existing_primary_keyword"],
      ...secondary.map((item) => [item, "existing_secondary_keyword"]),
      [title, "existing_content_title"]
    ]) {
      if (!keyword) continue;
      rows.push(sourceOccurrence(keyword, sourceType, relative, ""));
    }
  }
  return rows;
}

async function sitemapOccurrences() {
  const response = await fetch("https://dollwow.com/sitemap.xml");
  if (!response.ok) throw new Error(`Unable to fetch DollWow sitemap: HTTP ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  return urls
    .filter((url) => /\/(learn|shop|brands)\//.test(url))
    .map((url) => {
      const slug = new URL(url).pathname.split("/").filter(Boolean).at(-1) || "";
      return sourceOccurrence(slug.replace(/-/g, " "), "existing_sitemap_route", url, url);
    });
}

async function appendOptionalExport(name, fileArg) {
  if (!fileArg) {
    sourceStatus.push({
      source: `${name}_query_export`,
      status: "pending_import",
      rows: 0,
      details: `No --${name}-file supplied in this run.`
    });
    return;
  }
  const file = path.resolve(ROOT, fileArg);
  const text = await fs.readFile(file, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] || "").map((value) => value.toLowerCase());
  const queryIndex = headers.findIndex((value) => /query|keyword/.test(value));
  if (queryIndex === -1) throw new Error(`${name.toUpperCase()} export has no query/keyword column.`);
  let count = 0;
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const keyword = cleanText(values[queryIndex]);
    if (!keyword) continue;
    occurrences.push(sourceOccurrence(keyword, `${name}_query`, path.relative(ROOT, file), ""));
    count += 1;
  }
  sourceStatus.push({ source: `${name}_query_export`, status: "complete", rows: count, details: path.relative(ROOT, file) });
}

function aggregateExactKeywords(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!row.normalizedKeyword) continue;
    const current = groups.get(row.normalizedKeyword) || {
      keyword: row.normalizedKeyword,
      normalizedKeyword: row.normalizedKeyword,
      sourceTypes: new Set(),
      sourceIds: new Set(),
      sourceUrls: new Set(),
      sourceOccurrenceCount: 0,
      competitorDomainCount: 0,
      competitorDomains: new Set(),
      searchVolume: null,
      cpc: null,
      competition: null,
      keywordDifficulty: null,
      intents: new Set(),
      bestCompetitorRank: null,
      serpFeatures: new Set(),
      averageReferringDomains: null
    };
    current.sourceTypes.add(row.sourceType);
    if (row.sourceId) current.sourceIds.add(row.sourceId);
    if (row.sourceUrl) current.sourceUrls.add(row.sourceUrl);
    current.sourceOccurrenceCount += 1;
    if (row.sourceType === "competitor_ranked_keyword") current.competitorDomains.add(row.sourceId);
    current.searchVolume = maxNullable(current.searchVolume, row.searchVolume);
    current.cpc = maxNullable(current.cpc, row.cpc);
    current.competition = maxNullable(current.competition, row.competition);
    current.keywordDifficulty = maxNullable(current.keywordDifficulty, row.keywordDifficulty);
    if (row.mainIntent) current.intents.add(row.mainIntent);
    current.bestCompetitorRank = minNullable(current.bestCompetitorRank, row.rank);
    for (const feature of String(row.serpFeatures || "").split("|").filter(Boolean)) current.serpFeatures.add(feature);
    current.averageReferringDomains = maxNullable(current.averageReferringDomains, row.averageReferringDomains);
    groups.set(row.normalizedKeyword, current);
  }
  return [...groups.values()]
    .map((item) => ({
      ...item,
      sourceTypes: [...item.sourceTypes].sort().join("|"),
      sourceIds: [...item.sourceIds].sort().join("|"),
      sourceUrls: [...item.sourceUrls].sort().join("|"),
      competitorDomains: [...item.competitorDomains].sort().join("|"),
      competitorDomainCount: item.competitorDomains.size,
      intents: [...item.intents].sort().join("|"),
      serpFeatures: [...item.serpFeatures].sort().join("|")
    }))
    .sort((a, b) =>
      b.competitorDomainCount - a.competitorDomainCount ||
      Number(b.searchVolume || 0) - Number(a.searchVolume || 0) ||
      a.keyword.localeCompare(b.keyword)
    );
}

function buildSummary(universe, occurrenceRows, seeds, statuses, costs) {
  const bySource = occurrenceRows.reduce((accumulator, row) => {
    accumulator[row.sourceType] = (accumulator[row.sourceType] || 0) + 1;
    return accumulator;
  }, {});
  const totalCost = costs.reduce((total, row) => total + Number(row.cost || 0), 0);
  const requiredSources = [
    "competitor_ranked_keywords",
    "dataforseo_keyword_ideas",
    "shopify_public_product_feed",
    "dollwow_existing_content",
    "dollwow_sitemap_routes",
    "gsc_query_export",
    "bing_query_export",
    "live_serp_discoveries"
  ];
  const statusMap = new Map(statuses.map((item) => [item.source, item]));
  const accounted = requiredSources.every((source) => statusMap.has(source));
  return {
    generatedAt,
    mode: execute ? "production" : "dry-run",
    step: 2,
    objective: "Expand the raw keyword universe from labeled evidence sources",
    totals: {
      sourceOccurrences: occurrenceRows.length,
      exactNormalizedCandidates: universe.length,
      dataSelectedSeeds: seeds.length,
      sourcesAccountedFor: statuses.length
    },
    bySource,
    sourceStatus: statuses,
    seedSelection: seeds,
    cost: { currency: "USD", total: totalCost, entries: costs },
    completionGate: {
      passed: execute && accounted && universe.length > 0 && statuses.some((item) => item.source === "dataforseo_keyword_ideas" && item.status === "complete"),
      criteria: "Competitor, DataForSEO expansion, Shopify, existing content, GSC/Bing, and live-SERP sources are included or explicitly scheduled/pending with provenance."
    },
    caveat: "This is an exact-normalized candidate universe, not the final synonym or intent deduplication. Step 4 performs canonical normalization."
  };
}

function renderReport(summary) {
  return [
    "# Step 2: Raw Keyword Universe Expansion",
    "",
    `Generated: ${summary.generatedAt}`,
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
    `- Source occurrences: ${summary.totals.sourceOccurrences}`,
    `- Exact-normalized candidate keywords: ${summary.totals.exactNormalizedCandidates}`,
    `- Data-selected expansion seeds: ${summary.totals.dataSelectedSeeds}`,
    `- Recorded API cost: $${summary.cost.total.toFixed(4)}`,
    "",
    "## Source Status",
    "",
    "| Source | Status | Rows | Details |",
    "| --- | --- | ---: | --- |",
    ...summary.sourceStatus.map((item) => `| ${item.source} | ${item.status} | ${item.rows || 0} | ${item.details || ""} |`),
    "",
    "## Occurrences By Source Type",
    "",
    ...Object.entries(summary.bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => `- ${source}: ${count}`),
    "",
    "## Data-Selected Seeds",
    "",
    "| Keyword | Competitor domains | Volume | Best rank | Evidence score |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...summary.seedSelection.map((seed) => `| ${seed.keyword} | ${seed.domainCount} | ${seed.searchVolume} | ${seed.bestRank} | ${seed.evidenceScore.toFixed(2)} |`),
    "",
    "## Caveat",
    "",
    summary.caveat,
    ""
  ].join("\n");
}

async function loadProductFeed() {
  const source = args.productFeed || "https://dollwow.com/product-feed.json";
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Unable to fetch product feed: HTTP ${response.status}`);
    const data = await response.json();
    await writeJson(path.join(outputDir, "source-dollwow-product-feed.json"), data);
    return data;
  }
  return JSON.parse(await fs.readFile(path.resolve(ROOT, source), "utf8"));
}

async function walkFiles(directory, extension) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(file, extension)));
    else if (entry.isFile() && entry.name.endsWith(extension)) files.push(file);
  }
  return files;
}

function scalarField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return cleanText(match?.[1] || "").replace(/^['"]|['"]$/g, "");
}

function arrayField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*\\[(.*)\\]$`, "m"));
  if (!match) return [];
  return parseCsvLine(match[1]).map((value) => cleanText(value).replace(/^['"]|['"]$/g, "")).filter(Boolean);
}

function sourceOccurrence(keyword, sourceType, sourceId, sourceUrl) {
  return {
    keyword: cleanText(keyword),
    normalizedKeyword: normalizeKeyword(keyword),
    sourceType,
    sourceId,
    sourceUrl,
    searchVolume: null,
    cpc: null,
    competition: null,
    keywordDifficulty: null,
    mainIntent: "",
    rank: null,
    collectedAt: generatedAt
  };
}

function seedSimilarityTokens(keyword) {
  const canonical = normalizeKeyword(keyword)
    .replace(/\bsexdolls?\b/g, "sex doll")
    .replace(/\bsec dolls?\b/g, "sex doll");
  return new Set(
    canonical
      .split(" ")
      .filter(Boolean)
      .map((token) => (token === "dolls" ? "doll" : token))
  );
}

function jaccard(left, right) {
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function maxNullable(left, right) {
  const values = [left, right].map(numberOrNull).filter((value) => value !== null);
  return values.length ? Math.max(...values) : null;
}

function minNullable(left, right) {
  const values = [left, right].map(numberOrNull).filter((value) => value !== null);
  return values.length ? Math.min(...values) : null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeKeyword(value) {
  return cleanText(value).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(current);
      current = "";
    } else current += character;
  }
  values.push(current);
  return values;
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

async function writeJson(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
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
    if (["execute", "help"].includes(key)) parsed[key] = true;
    else {
      parsed[key] = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function positiveInteger(value) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function printHelp() {
  console.log(`Usage: node scripts/expand-seo-keyword-universe.mjs [options]

Options:
  --execute                 Call production DataForSEO Keyword Ideas.
  --step1-dir <path>        Step 1 artifact directory.
  --product-feed <path|url> Shopify/public product feed source.
  --gsc-file <csv>          Optional GSC query export.
  --bing-file <csv>         Optional Bing query export.
  --seed-limit <n>          Diverse evidence-selected seeds, default 50.
  --keyword-limit <n>       Keyword ideas returned, default 1000.
  --out-dir <path>          Artifact directory.
  --report <path>           Human-readable report path.
  --env <path>              Additional env file.
  --help                    Show this help.`);
}
