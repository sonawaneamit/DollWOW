import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const merchantTaskId = process.argv.find((value) => value.startsWith("--merchant-task-id="))?.split("=")[1];
const generatedAt = new Date().toISOString();
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-30/dol-25-september-promos");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO credentials are required.");
}

if (merchantTaskId) {
  const response = await get(`/merchant/google/products/task_get/advanced/${merchantTaskId}`);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "merchant-result.json"), `${JSON.stringify(response, null, 2)}\n`);
  console.log(JSON.stringify({
    taskId: merchantTaskId,
    statusCode: response.tasks?.[0]?.status_code || response.status_code,
    statusMessage: response.tasks?.[0]?.status_message || response.status_message,
    itemsCount: response.tasks?.[0]?.result?.[0]?.items_count || 0
  }, null, 2));
  process.exit(0);
}

const keywords = [
  "se doll promotion",
  "se doll sale",
  "se doll tpe",
  "se doll discount",
  "sex doll promotions"
];
const prompt = "What current SE Doll TPE promotions or free custom-order upgrades are available in September 2026? Give exact dates and separate verified factory bonuses from retailer discounts. Cite current sources.";
const calls = [
  call("google-keywords", "Google Keyword Data", "/dataforseo_labs/google/keyword_overview/live", [{ keywords, location_code: 2840, language_code: "en", include_serp_info: true, tag: "dollwow-dol25-google-keywords" }]),
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-dol25-bing-keywords" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-dol25-ai-keywords" }]),
  call("labs-ranked", "DataForSEO Labs", "/dataforseo_labs/google/ranked_keywords/live", [{ target: "sedoll.com", location_code: 2840, language_code: "en", item_types: ["organic", "featured_snippet"], include_serp_info: true, limit: 100, order_by: ["keyword_data.keyword_info.search_volume,desc"], tag: "dollwow-dol25-sedoll-ranked" }]),
  call("labs-gap", "DataForSEO Labs", "/dataforseo_labs/google/domain_intersection/live", [{ target1: "sedoll.com", target2: "dollwow.com", intersections: false, location_code: 2840, language_code: "en", item_types: ["organic", "featured_snippet"], include_serp_info: true, limit: 100, order_by: ["keyword_data.keyword_info.search_volume,desc"], tag: "dollwow-dol25-sedoll-gap" }]),
  call("google-serp-desktop", "Google Organic SERP", "/serp/google/organic/live/advanced", [{ keyword: "se doll promotion", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 50, tag: "dollwow-dol25-google-desktop" }]),
  call("google-serp-mobile", "Google Organic SERP", "/serp/google/organic/live/advanced", [{ keyword: "se doll promotion", location_code: 2840, language_code: "en", device: "mobile", os: "android", depth: 50, tag: "dollwow-dol25-google-mobile" }]),
  call("bing-serp", "Bing Organic SERP", "/serp/bing/organic/live/advanced", [{ keyword: "se doll promotion", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag: "dollwow-dol25-bing-serp" }]),
  call("google-ai-mode", "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", device: "desktop", tag: "dollwow-dol25-ai-mode" }]),
  call("chatgpt-scraper", "ChatGPT LLM Scraper", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", tag: "dollwow-dol25-chatgpt-scraper" }]),
  call("chatgpt-response", "ChatGPT Response", "/ai_optimization/chat_gpt/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Use current sources and distinguish manufacturer facts from retailer claims.", model_name: "gpt-5.4-nano", max_output_tokens: 1200, web_search: true, web_search_country_iso_code: "US", tag: "dollwow-dol25-chatgpt-response" }]),
  call("claude-response", "Claude Response", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Use current sources and distinguish manufacturer facts from retailer claims.", model_name: "claude-haiku-4-5", max_output_tokens: 1200, web_search: true, tag: "dollwow-dol25-claude" }]),
  call("gemini-response", "Gemini Response", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Use current sources and distinguish manufacturer facts from retailer claims.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1200, web_search: true, tag: "dollwow-dol25-gemini" }]),
  call("perplexity-response", "Perplexity Response", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Use current sources and distinguish manufacturer facts from retailer claims.", model_name: "sonar", max_output_tokens: 1200, web_search_country_iso_code: "US", tag: "dollwow-dol25-perplexity" }]),
  call("content-summary", "Content Analysis", "/content_analysis/summary/live", [{ keyword: "se doll promotion", internal_list_limit: 10, tag: "dollwow-dol25-content-summary" }]),
  call("content-search", "Content Analysis", "/content_analysis/search/live", [{ keyword: "se doll promotion", limit: 20, order_by: ["content_info.date_published,desc"], tag: "dollwow-dol25-content-search" }]),
  call("backlinks-summary", "Backlinks", "/backlinks/summary/live", [{ target: "dollwow.com", include_subdomains: true, exclude_internal_backlinks: true, tag: "dollwow-dol25-backlinks" }]),
  call("onpage-pre-release", "OnPage", "/on_page/instant_pages", [{ url: "https://dollwow.com/promo", load_resources: false, enable_javascript: false, check_spell: false }]),
  ...["google", "chat_gpt"].map((platform) => call(`mentions-${platform}`, "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform, target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, { keyword: "SE Doll", search_scope: ["any"], match_type: "word_match" }], tag: `dollwow-dol25-mentions-${platform}` }]))
];

await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of calls) records.push(await executeCall(item));
records.push(await executeMerchant());

const totalCost = records.reduce((sum, item) => sum + Number(item.cost || 0), 0);
const manifest = {
  generatedAt,
  execute,
  totalCost,
  requestCount: records.length,
  failedRequests: records.filter((item) => item.error).length,
  records
};
await fs.writeFile(path.join(outputDir, "request-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({
  outputDir: path.relative(ROOT, outputDir),
  totalCost,
  requestCount: records.length,
  failedRequests: manifest.failedRequests,
  records: records.map(({ id, api, endpoint, taskId, cost, statusCode, statusMessage }) => ({ id, api, endpoint, taskId, cost, statusCode, statusMessage }))
}, null, 2));

async function executeCall(item) {
  const record = { ...item, executed: execute, taskId: null, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
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

async function executeMerchant() {
  return executeCall(call("merchant-post", "Merchant", "/merchant/google/products/task_post", [{ keyword: "SE Doll", location_code: 2840, language_code: "en", depth: 40, priority: 2, tag: "dollwow-dol25-merchant" }]));
}

function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }

async function post(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
  const body = await response.json();
  const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
  if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`);
  return body;
}

async function get(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
  const body = await response.json();
  const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
  if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`);
  return body;
}

function authHeaders() {
  return { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" };
}

async function loadEnv(file) {
  const text = await fs.readFile(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals < 1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
