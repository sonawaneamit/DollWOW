#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const API_BASE = "https://api.dataforseo.com/v3";
const ENV_SOURCE = process.env.DOLLWOW_ENV_FILE || path.join(ROOT, ".env.local");
const OUTPUT = path.join(ROOT, "data/exports/seo-intelligence/2026-08-29/lusandy-nadia-159");
const LIVE_URL = "https://dollwow.com/products/lusandy-nadia-159cm-g-cup-silicone-companion-doll";
const SOURCE_URL = "https://lusandydoll.com/products/lusandy-nadia-thicc-silicone-doll-159cm";
const execute = process.argv.includes("--execute");
const postRelease = process.argv.includes("--post-release");
const fetchMerchant = process.argv.includes("--fetch-merchant");
const only = process.argv.find((value) => value.startsWith("--only="))?.slice("--only=".length);

await loadEnv();
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");
await fs.mkdir(OUTPUT, { recursive: true });

const keywords = [
  "Lusandy Nadia", "Lusandy Nadia 159cm", "Lusandy 159cm doll", "159cm silicone doll",
  "G cup silicone doll", "custom silicone doll", "super light silicone doll"
];
const prompt = "A US buyer is considering the Lusandy Nadia 159 cm G-cup silicone custom-order doll. What exact product specifications, body-weight construction, material, customization choices, factory-order timing, seller support, price, and pre-shipment approval evidence should the buyer verify? Prefer the current manufacturer source and cite sources. Do not infer unsupported facts.";
const tag = "dollwow-lusandy-nadia-159";

const calls = [
  call("google-keywords", "Google Keyword Data", "/keywords_data/google_ads/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", include_adult_keywords: true, tag }]),
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag }]),
  call("labs-ideas", "DataForSEO Labs", "/dataforseo_labs/google/keyword_ideas/live", [{ keywords: ["Lusandy Nadia", "Lusandy doll", "159cm silicone doll"], location_code: 2840, language_code: "en", include_serp_info: true, include_seed_keyword: true, limit: 100, tag }]),
  call("labs-manufacturer-ranked", "DataForSEO Labs", "/dataforseo_labs/google/ranked_keywords/live", [{ target: "lusandydoll.com", location_code: 2840, language_code: "en", item_types: ["organic", "featured_snippet", "ai_overview_reference"], include_serp_info: true, limit: 100, tag }]),
  call("google-serp-desktop", "Google SERP", "/serp/google/organic/live/advanced", [{ keyword: "Lusandy Nadia 159cm", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 30, tag }]),
  call("google-serp-mobile", "Google SERP", "/serp/google/organic/live/advanced", [{ keyword: "Lusandy Nadia 159cm", location_code: 2840, language_code: "en", device: "mobile", os: "android", depth: 20, tag }]),
  call("bing-serp", "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: "Lusandy Nadia 159cm", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag }]),
  call("google-ai-mode", "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", device: "desktop", tag }]),
  call("chatgpt", "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", tag }]),
  call("claude", "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer the current official manufacturer source and distinguish verified facts from retailer claims.", model_name: "claude-haiku-4-5", max_output_tokens: 1200, web_search: true, tag }]),
  call("gemini", "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer the current official manufacturer source and distinguish verified facts from retailer claims.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1200, web_search: true, tag }]),
  call("perplexity", "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer the current official manufacturer source and distinguish verified facts from retailer claims.", model_name: "sonar", max_output_tokens: 1200, web_search_country_iso_code: "US", tag }]),
  call("content-analysis", "Content Analysis", "/content_analysis/search/live", [{ keyword: "Lusandy Nadia 159cm", limit: 30, order_by: ["content_info.date_published,desc"], tag }]),
  call("manufacturer-onpage", "OnPage", "/on_page/instant_pages", [{ url: SOURCE_URL, load_resources: false, enable_javascript: false, check_spell: false }]),
  call("manufacturer-backlinks", "Backlinks", "/backlinks/summary/live", [{ target: "lusandydoll.com", include_subdomains: true, backlinks_status_type: "live", internal_list_limit: 10, rank_scale: "one_hundred", tag }]),
  call("dollwow-domain", "Domain Analytics", "/backlinks/summary/live", [{ target: "dollwow.com", include_subdomains: true, backlinks_status_type: "live", internal_list_limit: 10, rank_scale: "one_hundred", tag }]),
  call("mentions-google", "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform: "google", target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, { keyword: "Lusandy Nadia", search_scope: ["any"], match_type: "word_match" }], tag }]),
  call("mentions-chatgpt", "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform: "chat_gpt", target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, { keyword: "Lusandy Nadia", search_scope: ["any"], match_type: "word_match" }], tag }]),
  ...(postRelease ? [call("dollwow-onpage", "OnPage", "/on_page/instant_pages", [{ url: LIVE_URL, load_resources: false, enable_javascript: false, check_spell: false }])] : [])
];

const records = [];
if (!fetchMerchant) for (const item of (only ? calls.filter((candidate) => candidate.id === only) : calls)) records.push(await executeCall(item));
if (!fetchMerchant && !postRelease && !only) records.push(await postMerchant());
if (fetchMerchant) records.push(await fetchMerchantResult());

const manifest = {
  generatedAt: new Date().toISOString(),
  execute,
  postRelease,
  targetUrl: LIVE_URL,
  canonicalOwner: LIVE_URL,
  primaryFactSource: SOURCE_URL,
  decisionQuestions: [
    "Does branded demand support a dedicated product PDP?",
    "Which page types and facts win organic, shopping, and AI answers?",
    "Which specifications must be server-rendered and which polluted claims must be rejected?",
    "Can DollWow own one canonical custom PDP without conflicting with RTS inventory?"
  ],
  totalCost: records.reduce((sum, item) => sum + Number(item.cost || 0), 0),
  requestCount: records.length,
  failedRequests: records.filter((item) => item.error).length,
  records
};
const name = fetchMerchant ? "request-manifest-merchant-results.json" : only ? `request-manifest-retry-${only}.json` : postRelease ? "request-manifest-post-release.json" : "request-manifest.json";
await fs.writeFile(path.join(OUTPUT, name), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), manifest: name, totalCost: manifest.totalCost, requestCount: manifest.requestCount, failedRequests: manifest.failedRequests, records: records.map(({ id, api, cost, statusCode, statusMessage }) => ({ id, api, cost, statusCode, statusMessage })) }, null, 2));

function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }

async function executeCall(item) {
  const record = { ...item, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await post(item.endpoint, item.payload);
    const task = response.tasks?.[0] || {};
    Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null });
    await fs.writeFile(path.join(OUTPUT, `${item.id}.json`), `${JSON.stringify(response, null, 2)}\n`);
  } catch (error) {
    record.error = true;
    record.statusMessage = error instanceof Error ? error.message : String(error);
  }
  return record;
}

async function postMerchant() {
  const endpoint = "/merchant/google/products/task_post";
  const record = { id: "merchant", api: "Merchant", endpoint, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await post(endpoint, [{ keyword: "Lusandy Nadia 159cm", location_code: 2840, language_code: "en", depth: 40, priority: 2, tag }]);
    const task = response.tasks?.[0] || {};
    Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null });
    await fs.writeFile(path.join(OUTPUT, "merchant-post.json"), `${JSON.stringify(response, null, 2)}\n`);
  } catch (error) {
    record.error = true;
    record.statusMessage = error instanceof Error ? error.message : String(error);
  }
  return record;
}

async function fetchMerchantResult() {
  const posted = JSON.parse(await fs.readFile(path.join(OUTPUT, "merchant-post.json"), "utf8"));
  const taskId = posted.tasks?.[0]?.id;
  const endpoint = `/merchant/google/products/task_get/advanced/${taskId}`;
  const record = { id: "merchant-result", api: "Merchant", endpoint, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
    const body = await response.json();
    const task = body.tasks?.[0] || {};
    Object.assign(record, { statusCode: task.status_code || body.status_code || null, statusMessage: task.status_message || body.status_message || null });
    await fs.writeFile(path.join(OUTPUT, "merchant-result.json"), `${JSON.stringify(body, null, 2)}\n`);
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

function authHeaders() {
  return { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "content-type": "application/json" };
}

async function loadEnv() {
  const text = await fs.readFile(ENV_SOURCE, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    let value = line.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[line.slice(0, index).trim()] ||= value;
  }
}
