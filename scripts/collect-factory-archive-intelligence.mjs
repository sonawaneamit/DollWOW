import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-14/factory-approval-archive");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DataForSEO credentials are required.");
}

const keywords = [
  "sex doll factory photos",
  "sex doll factory pictures",
  "doll factory photos",
  "doll factory pictures",
  "sex doll pictures",
  "sex doll photos",
  "sex doll approval photos",
  "sex doll qc photos",
  "sex doll quality control photos",
  "sex doll pre shipment photos",
  "factory photos before shipping",
  "custom sex doll factory photos",
  "sex doll production photos"
];

const prompts = {
  meaning: "What are sex doll factory approval photos, what can a buyer check in them before shipment, what can photographs not prove, and when are they available? Cite current sources.",
  examples: "Show useful examples and explain how a buyer should review sex doll factory photos or pre-shipment QC pictures without assuming they guarantee quality or exact future results. Cite current sources."
};

const calls = [
  call("google-keywords", "Google Keyword Data", "/keywords_data/google_ads/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", include_adult_keywords: true, tag: "dollwow-factory-archive-google-keywords" }]),
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-factory-archive-bing-keywords" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-factory-archive-ai-keywords" }]),
  call("labs-ideas", "DataForSEO Labs", "/dataforseo_labs/google/keyword_ideas/live", [{ keywords: ["sex doll factory photos", "sex doll factory pictures", "sex doll pictures"], location_code: 2840, language_code: "en", include_serp_info: true, include_seed_keyword: true, limit: 500, order_by: ["keyword_info.search_volume,desc"], tag: "dollwow-factory-archive-ideas" }]),
  call("labs-competitor-ranked", "DataForSEO Labs", "/dataforseo_labs/google/ranked_keywords/live", [{ target: "sexdollpicture.com", location_code: 2840, language_code: "en", item_types: ["organic", "featured_snippet", "ai_overview_reference"], include_serp_info: true, limit: 500, order_by: ["keyword_data.keyword_info.search_volume,desc"], tag: "dollwow-factory-archive-competitor-ranked" }]),
  ...["sex doll factory photos", "sex doll factory pictures", "sex doll pictures", "sex doll qc photos"].flatMap((keyword, index) => [
    call(`google-serp-desktop-${index + 1}`, "Google SERP", "/serp/google/organic/live/advanced", [{ keyword, location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 30, tag: `dollwow-factory-archive-google-desktop-${index + 1}` }]),
    call(`google-serp-mobile-${index + 1}`, "Google SERP", "/serp/google/organic/live/advanced", [{ keyword, location_code: 2840, language_code: "en", device: "mobile", os: "android", depth: 20, tag: `dollwow-factory-archive-google-mobile-${index + 1}` }])
  ]),
  call("bing-serp", "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: "sex doll factory photos", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 30, tag: "dollwow-factory-archive-bing-serp" }]),
  ...Object.entries(prompts).flatMap(([key, prompt]) => [
    call(`ai-mode-${key}`, "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", device: "desktop", tag: `dollwow-factory-archive-ai-mode-${key}` }]),
    call(`chatgpt-${key}`, "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", tag: `dollwow-factory-archive-chatgpt-${key}` }]),
    call(`claude-${key}`, "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer verifiable current sources and distinguish visible review from guarantees.", model_name: "claude-haiku-4-5", max_output_tokens: 1400, web_search: true, tag: `dollwow-factory-archive-claude-${key}` }]),
    call(`gemini-${key}`, "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer verifiable current sources and distinguish visible review from guarantees.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1400, web_search: true, tag: `dollwow-factory-archive-gemini-${key}` }]),
    call(`perplexity-${key}`, "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer verifiable current sources and distinguish visible review from guarantees.", model_name: "sonar", max_output_tokens: 1400, web_search_country_iso_code: "US", tag: `dollwow-factory-archive-perplexity-${key}` }])
  ]),
  call("content-analysis", "Content Analysis", "/content_analysis/search/live", [{ keyword: "sex doll factory photos", limit: 50, order_by: ["content_info.date_published,desc"], tag: "dollwow-factory-archive-content" }]),
  call("competitor-onpage", "OnPage", "/on_page/instant_pages", [{ url: "https://www.sexdollpicture.com/", load_resources: false, enable_javascript: true, check_spell: false }]),
  call("competitor-backlink-summary", "Backlinks", "/backlinks/summary/live", [{ target: "sexdollpicture.com", include_subdomains: true, backlinks_status_type: "live", internal_list_limit: 10, rank_scale: "one_hundred", tag: "dollwow-factory-archive-backlink-summary" }]),
  call("competitor-backlinks", "Backlinks", "/backlinks/backlinks/live", [{ target: "sexdollpicture.com", include_subdomains: true, backlinks_status_type: "live", limit: 200, order_by: ["rank,desc"], exclude_internal_backlinks: true, rank_scale: "one_hundred", tag: "dollwow-factory-archive-backlinks" }]),
  call("mentions-google", "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform: "google", target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, { keyword: "sex doll factory photos", search_scope: ["any"], match_type: "word_match" }, { keyword: "sexdollpicture.com", search_scope: ["any"], match_type: "word_match" }], tag: "dollwow-factory-archive-mentions-google" }]),
  call("mentions-chatgpt", "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform: "chat_gpt", target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, { keyword: "sex doll factory photos", search_scope: ["any"], match_type: "word_match" }, { keyword: "sexdollpicture.com", search_scope: ["any"], match_type: "word_match" }], tag: "dollwow-factory-archive-mentions-chatgpt" }])
];

await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of calls) records.push(await executeCall(item));
const manifest = {
  generatedAt: new Date().toISOString(),
  execute,
  decisionQuestions: [
    "What language do US searchers use for factory, approval, QC, production, and pre-shipment photos?",
    "Which page types and sources win organic and AI answers?",
    "What information gaps can a real anonymized archive fill?",
    "Should one canonical archive own the visual intent, and how should image discovery work?",
    "Which competitor practices or claims should DollWOW reject?"
  ],
  deliberatelyExcluded: {
    merchant: "The page is an informational visual archive, not a shopping-result owner.",
    businessData: "No local-business decision question.",
    appData: "No app decision question.",
    amazonLabs: "No Amazon marketplace decision question.",
    dollwowOnPage: "The candidate URL is intentionally local-only and unavailable to DataForSEO before owner approval. Pre-publication source checks replace a remote crawl; run focused OnPage immediately after release."
  },
  totalCost: records.reduce((sum, item) => sum + Number(item.cost || 0), 0),
  requestCount: records.length,
  failedRequests: records.filter((item) => item.error).length,
  records
};
await fs.writeFile(path.join(outputDir, "request-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost: manifest.totalCost, requestCount: manifest.requestCount, failedRequests: manifest.failedRequests }, null, 2));

function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }
async function executeCall(item) {
  const record = { ...item, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await post(item.endpoint, item.payload);
    const task = response.tasks?.[0] || {};
    Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null });
    await fs.writeFile(path.join(outputDir, `${item.id}.json`), `${JSON.stringify(response, null, 2)}\n`);
  } catch (error) {
    record.error = true;
    record.statusMessage = error instanceof Error ? error.message : String(error);
  }
  return record;
}
async function post(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
  const body = await response.json();
  const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
  if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`);
  return body;
}
function authHeaders() { return { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" }; }
async function loadEnv(file) {
  const text = await fs.readFile(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals < 1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
