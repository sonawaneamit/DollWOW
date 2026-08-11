import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const DEFAULT_BRANDS = [
  {
    key: "starpery",
    keyword: "starpery dolls",
    manufacturerDomain: "starpery.com",
    dollwowUrl: "https://dollwow.com/brands/starpery-dolls"
  },
  {
    key: "tantaly",
    keyword: "tantaly dolls",
    manufacturerDomain: "tantaly.com",
    dollwowUrl: "https://dollwow.com/brands/tantaly-dolls"
  },
  {
    key: "se-doll",
    keyword: "SE Doll",
    manufacturerDomain: "sedoll.com",
    dollwowUrl: "https://dollwow.com/brands/se-doll"
  },
  {
    key: "climax",
    keyword: "Climax Doll",
    manufacturerDomain: "climax-doll.com",
    dollwowUrl: "https://dollwow.com/brands/climax-dolls"
  },
  {
    key: "dolls-castle",
    keyword: "Dolls Castle sex doll",
    manufacturerDomain: "dolls-castle.com",
    dollwowUrl: "https://dollwow.com/brands/dolls-castle"
  },
  {
    key: "real-lady",
    keyword: "Real Lady sex doll",
    manufacturerDomain: "real-lady.com",
    dollwowUrl: "https://dollwow.com/brands/real-lady-dolls"
  }
];

const args = parseArgs(process.argv.slice(2));
await loadEnvFile(path.join(ROOT, ".env.local"));

const execute = Boolean(args.execute);
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const selectedBrands = args.brands
  ? DEFAULT_BRANDS.filter((brand) => args.brands.split(",").map((value) => value.trim()).includes(brand.key))
  : DEFAULT_BRANDS;
const selectedApis = new Set(
  (args.apis || "content,backlinks,onpage,ai")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

if (selectedBrands.length === 0) {
  throw new Error(`No matching brands. Choose from: ${DEFAULT_BRANDS.map((brand) => brand.key).join(", ")}.`);
}

const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-13-brand-intelligence", execute ? "live" : "dry-run")
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-13-brand-intelligence${execute ? "" : "-dry-run"}.md`)
);

if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const calls = buildCalls(selectedBrands, selectedApis);
const records = [];

for (const call of calls) {
  const record = {
    id: call.id,
    api: call.api,
    endpoint: call.endpoint,
    purpose: call.purpose,
    requestedAt: new Date().toISOString(),
    payload: call.payload,
    responseFile: `raw-${call.id}.json`,
    executed: execute,
    cost: 0,
    taskId: null,
    statusCode: null,
    statusMessage: execute ? null : "Dry run"
  };

  if (execute) {
    try {
      const response = await callDataForSeo(call.endpoint, call.payload);
      const task = response.tasks?.[0] ?? {};
      record.cost = Number(task.cost || 0);
      record.taskId = task.id || null;
      record.statusCode = task.status_code || response.status_code || null;
      record.statusMessage = task.status_message || response.status_message || null;
      await writeJson(path.join(outputDir, record.responseFile), response);
    } catch (error) {
      record.statusMessage = error.message;
      record.error = true;
    }
  }

  records.push(record);
}

const summary = {
  generatedAt,
  mode: execute ? "execute" : "dry-run",
  brands: selectedBrands.map((brand) => brand.keyword),
  brandCount: selectedBrands.length,
  requestCount: records.length,
  successfulRequests: records.filter((record) => !record.error && record.executed).length,
  failedRequests: records.filter((record) => record.error).length,
  totalCost: round(records.reduce((sum, record) => sum + record.cost, 0), 6),
  apiCosts: Object.fromEntries(
    [...new Set(records.map((record) => record.api))].map((api) => [
      api,
      round(records.filter((record) => record.api === api).reduce((sum, record) => sum + record.cost, 0), 6)
    ])
  ),
  calls: records
};

await writeJson(path.join(outputDir, "request-manifest.json"), records);
await writeJson(path.join(outputDir, "cost-ledger.json"), {
  generatedAt,
  totalCost: summary.totalCost,
  apiCosts: summary.apiCosts,
  tasks: records.map(({ id, api, endpoint, taskId, cost, statusCode, statusMessage }) => ({
    id,
    api,
    endpoint,
    taskId,
    cost,
    statusCode,
    statusMessage
  }))
});
await writeJson(path.join(outputDir, "step-13-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary), "utf8");

console.log(`${execute ? "Completed" : "Prepared"} multi-API brand intelligence.`);
console.log(`Requests: ${summary.requestCount}; failures: ${summary.failedRequests}`);
console.log(`Recorded cost: $${summary.totalCost.toFixed(4)}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function buildCalls(brands, apis) {
  const calls = [];

  for (const brand of brands) {
    if (apis.has("content")) calls.push({
      id: `${brand.key}-content-summary`,
      api: "Content Analysis",
      endpoint: "/content_analysis/summary/live",
      purpose: `Measure citation volume, page types, sentiment, and recurring coverage around ${brand.keyword}.`,
      payload: [{ keyword: brand.keyword, internal_list_limit: 10, tag: `dollwow-${brand.key}-content-summary` }]
    });
    if (apis.has("content")) calls.push({
      id: `${brand.key}-content-search`,
      api: "Content Analysis",
      endpoint: "/content_analysis/search/live",
      purpose: `Identify concrete articles, discussions, and ecommerce pages citing ${brand.keyword}.`,
      payload: [{ keyword: brand.keyword, limit: 20, order_by: ["content_info.date_published,desc"], tag: `dollwow-${brand.key}-content-search` }]
    });
    if (apis.has("backlinks")) calls.push({
      id: `${brand.key}-backlink-summary`,
      api: "Backlinks",
      endpoint: "/backlinks/summary/live",
      purpose: `Establish the manufacturer domain backlink baseline for ${brand.keyword}.`,
      payload: [{ target: brand.manufacturerDomain, include_subdomains: true, exclude_internal_backlinks: true, tag: `dollwow-${brand.key}-backlink-summary` }]
    });
    if (apis.has("backlinks")) calls.push({
      id: `${brand.key}-linked-pages`,
      api: "Backlinks",
      endpoint: "/backlinks/domain_pages/live",
      purpose: `Find the ${brand.keyword} pages that have attracted the most links and reveal useful linkable formats.`,
      payload: [{
        target: brand.manufacturerDomain,
        limit: 20,
        order_by: ["page_summary.backlinks,desc", "page_summary.rank,desc"],
        include_subdomains: true,
        exclude_internal_backlinks: true,
        tag: `dollwow-${brand.key}-linked-pages`
      }]
    });
    if (apis.has("onpage")) calls.push({
      id: `${brand.key}-onpage-baseline`,
      api: "OnPage",
      endpoint: "/on_page/instant_pages",
      purpose: `Capture the current crawlable on-page baseline for ${brand.dollwowUrl} before the upgrade.`,
      payload: [{ url: brand.dollwowUrl, load_resources: false, enable_javascript: false, check_spell: false }]
    });
  }

  for (const platform of apis.has("ai") ? ["google", "chat_gpt"] : []) {
    calls.push({
      id: `brand-ai-mentions-${platform}`,
      api: "AI Optimization",
      endpoint: "/ai_optimization/llm_mentions/target_metrics/live",
      purpose: `Establish a US English ${platform} mention baseline for DollWow and the three Tier 1 brands.`,
      payload: [{
        location_code: 2840,
        language_code: "en",
        platform,
        target: [
          { keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" },
          ...brands.map((brand) => ({ keyword: brand.keyword, search_scope: ["any"], match_type: "word_match" }))
        ],
        tag: `dollwow-tier-one-brand-ai-${platform}`
      }]
    });
  }

  return calls;
}

async function callDataForSeo(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
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

function renderReport(summary) {
  const rows = summary.calls
    .map((record) => `| ${record.api} | \`${record.endpoint}\` | ${record.purpose} | $${record.cost.toFixed(4)} | ${record.statusMessage || ""} |`)
    .join("\n");
  return `# Brand Multi-API Intelligence\n\nGenerated: ${summary.generatedAt}\n\n## Purpose\n\nUse DataForSEO beyond keyword and SERP discovery where another dataset can change the content, visual, citation, or technical decision. Calls are cached and recorded so the same decision is not purchased twice.\n\n## Run Summary\n\n- Mode: ${summary.mode}\n- Brands: ${summary.brands.join(", ")}\n- Requests: ${summary.requestCount}\n- Failed requests: ${summary.failedRequests}\n- Recorded cost: $${summary.totalCost.toFixed(4)}\n\n## Requests\n\n| API | Endpoint | Decision supported | Cost | Status |\n| --- | --- | --- | ---: | --- |\n${rows}\n\n## Endpoint Policy\n\n- Labs and SERP evidence continue to own keyword demand, intent, ranking pages, and page-type decisions.\n- Content Analysis is used to find citation patterns, discussion themes, freshness, and useful source types.\n- Backlinks is used to identify link-earning pages and formats. It does not justify copying competitors.\n- AI Optimization establishes answer-engine mention and source baselines. Zero results are still a useful baseline.\n- OnPage validates the public URL before and after material changes. Resource-heavy rendering is omitted unless the lightweight scan identifies a reason to pay for it.\n- Domain Analytics is reserved for competitor technology or domain-infrastructure questions. It does not improve these brand descriptions.\n- Merchant data is used for shopping and price context only. Shopify remains authoritative for DollWow products and prices.\n- App Data and Business Data are not relevant to the current ecommerce content decision.\n`;
}

async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--execute") parsed.execute = true;
    else if (arg === "--out-dir") parsed.outDir = argv[++index];
    else if (arg === "--report") parsed.report = argv[++index];
    else if (arg === "--brands") parsed.brands = argv[++index];
    else if (arg === "--apis") parsed.apis = argv[++index];
  }
  return parsed;
}

function round(value, digits) {
  return Number(value.toFixed(digits));
}
