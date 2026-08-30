import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-30/dol-25-promo-index");
const keywords = ["sex doll sale", "sex doll promotions", "SE Doll sale", "SE Doll September promotion"];
const prompt = "What current SE Doll promotions are available to US buyers in September 2026? Separate TPE or STPE custom-order bonuses from Silicone Pro bonuses, give exact dates, and avoid unsupported discounts or retailer claims. Cite current sources where supported.";

await loadEnv(path.join(ROOT, ".env.local"));
await fs.mkdir(outputDir, { recursive: true });

const calls = [
  call("google-keywords", "Google Keyword Data", "/keywords_data/google_ads/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", include_adult_keywords: true, tag: "dollwow-dol25-google-keywords" }]),
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-dol25-bing-keywords" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-dol25-ai-keywords" }]),
  call("labs-ideas", "DataForSEO Labs", "/dataforseo_labs/google/keyword_ideas/live", [{ keywords: ["sex doll promotions", "SE Doll sale"], location_code: 2840, language_code: "en", include_serp_info: true, include_seed_keyword: true, limit: 100, order_by: ["keyword_info.search_volume,desc"], tag: "dollwow-dol25-labs-ideas" }]),
  call("labs-relevant-pages", "DataForSEO Labs", "/dataforseo_labs/google/relevant_pages/live", [{ target: "sedoll.com", location_code: 2840, language_code: "en", limit: 20, tag: "dollwow-dol25-labs-pages" }]),
  call("google-serp-desktop", "Google organic SERP", "/serp/google/organic/live/advanced", [{ keyword: "SE Doll sale", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 30, tag: "dollwow-dol25-google-desktop" }]),
  call("google-serp-mobile", "Google organic SERP", "/serp/google/organic/live/advanced", [{ keyword: "SE Doll sale", location_code: 2840, language_code: "en", device: "mobile", os: "android", depth: 30, tag: "dollwow-dol25-google-mobile" }]),
  call("bing-serp", "Bing organic SERP", "/serp/bing/organic/live/advanced", [{ keyword: "SE Doll sale", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 30, tag: "dollwow-dol25-bing-serp" }]),
  call("google-ai-mode", "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", device: "desktop", tag: "dollwow-dol25-ai-mode" }]),
  call("chatgpt", "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", tag: "dollwow-dol25-chatgpt" }]),
  call("claude", "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current manufacturer sources and reject unsupported discount claims.", model_name: "claude-haiku-4-5", max_output_tokens: 1000, web_search: true, tag: "dollwow-dol25-claude" }]),
  call("gemini", "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current manufacturer sources and reject unsupported discount claims.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1000, web_search: true, tag: "dollwow-dol25-gemini" }]),
  call("perplexity", "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current manufacturer sources and reject unsupported discount claims.", model_name: "sonar", max_output_tokens: 1000, web_search_country_iso_code: "US", tag: "dollwow-dol25-perplexity" }]),
  call("mentions-google", "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform: "google", target: mentionTargets(), tag: "dollwow-dol25-mentions-google" }]),
  call("mentions-chatgpt", "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform: "chat_gpt", target: mentionTargets(), tag: "dollwow-dol25-mentions-chatgpt" }]),
  call("content-analysis", "Content Analysis", "/content_analysis/search/live", [{ keyword: "SE Doll September promotion", limit: 20, order_by: ["content_info.date_published,desc"], tag: "dollwow-dol25-content" }]),
  call("onpage-pre-release", "OnPage", "/on_page/instant_pages", [{ url: "https://dollwow.com/promo", load_resources: false, enable_javascript: false, check_spell: false }]),
  call("backlinks-domain", "Backlinks", "/backlinks/summary/live", [{ target: "dollwow.com", include_subdomains: true, exclude_internal_backlinks: true, tag: "dollwow-dol25-backlinks" }])
];

if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");

const records = [];
for (const request of calls) records.push(await executeCall(request));
records.push(await executeMerchant());
await fs.writeFile(path.join(outputDir, "request-manifest.json"), `${JSON.stringify(records, null, 2)}\n`);
const summary = {
  generatedAt: new Date().toISOString(),
  execute,
  requestCount: records.length,
  failedRequests: records.filter((record) => record.error).length,
  totalCost: records.reduce((sum, record) => sum + Number(record.cost || 0), 0),
  records
};
await fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ requestCount: summary.requestCount, failedRequests: summary.failedRequests, totalCost: summary.totalCost, outputDir: path.relative(ROOT, outputDir) }, null, 2));

function call(id, api, endpoint, payload) {
  return { id, api, endpoint, payload };
}

function mentionTargets() {
  return [
    { keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" },
    { keyword: "SE Doll sale", search_scope: ["any"], match_type: "word_match" },
    { keyword: "sex doll promotions", search_scope: ["any"], match_type: "word_match" }
  ];
}

async function executeCall(request) {
  const record = { ...request, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await post(request.endpoint, request.payload);
    const task = response.tasks?.[0] || {};
    Object.assign(record, { cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null, taskId: task.id || null });
    await fs.writeFile(path.join(outputDir, `${request.id}.json`), `${JSON.stringify(response, null, 2)}\n`);
  } catch (error) {
    record.error = true;
    record.statusMessage = error instanceof Error ? error.message : String(error);
  }
  return record;
}

async function executeMerchant() {
  const request = call("merchant", "Merchant", "/merchant/google/products/task_post", [{ keyword: "SE Doll sale", location_code: 2840, language_code: "en", depth: 40, priority: 2, tag: "dollwow-dol25-merchant" }]);
  const record = await executeCall(request);
  if (!execute || record.error || !record.taskId) return record;
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const response = await get(`/merchant/google/products/task_get/advanced/${record.taskId}`);
  await fs.writeFile(path.join(outputDir, "merchant-result.json"), `${JSON.stringify(response, null, 2)}\n`);
  const task = response.tasks?.[0] || {};
  record.resultStatusCode = task.status_code || response.status_code || null;
  record.resultStatusMessage = task.status_message || response.status_message || null;
  return record;
}

async function post(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
  return parseResponse(response);
}

async function get(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
  return parseResponse(response, true);
}

async function parseResponse(response, allowTaskPending = false) {
  const body = await response.json();
  const task = body.tasks?.[0];
  if (!response.ok || Number(body.status_code || 0) >= 40000 || (!allowTaskPending && Number(task?.status_code || 0) >= 40000)) {
    throw new Error(task?.status_message || body.status_message || `DataForSEO HTTP ${response.status}`);
  }
  return body;
}

function authHeaders() {
  return {
    Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
    "Content-Type": "application/json"
  };
}

async function loadEnv(file) {
  const source = await fs.readFile(file, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
