import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const key = arg("key") || "betterlovedoll";
const configPath = path.join(ROOT, "data/seo/alternative-page-targets.json");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");

const configs = JSON.parse(await fs.readFile(configPath, "utf8"));
const target = configs[key];
if (!target) throw new Error(`Unknown alternative-page key: ${key}`);

const date = new Date().toISOString().slice(0, 10);
const outputDir = path.join(ROOT, `data/exports/seo-intelligence/${date}/alternative-${key}`);
const keywords = [...new Set(target.keywords)];
const prompt = target.prompt;
const calls = [
  call("google-keywords", "Google Keyword Data", "/keywords_data/google_ads/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", include_adult_keywords: true, sort_by: "relevance", tag: `dollwow-alt-${key}-google-keywords` }]),
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: `dollwow-alt-${key}-bing-keywords` }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: `dollwow-alt-${key}-ai-keywords` }]),
  ...target.serpKeywords.flatMap((keyword, index) => [
    call(`google-serp-${index + 1}-desktop`, "Google SERP", "/serp/google/organic/live/advanced", [{ keyword, location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 30, tag: `dollwow-alt-${key}-google-${index + 1}-desktop` }]),
    call(`google-serp-${index + 1}-mobile`, "Google SERP", "/serp/google/organic/live/advanced", [{ keyword, location_code: 2840, language_code: "en", device: "mobile", os: "android", depth: 20, tag: `dollwow-alt-${key}-google-${index + 1}-mobile` }])
  ]),
  call("bing-serp", "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: target.serpKeywords[0], location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag: `dollwow-alt-${key}-bing-serp` }]),
  call("labs-ranked", "DataForSEO Labs", "/dataforseo_labs/google/ranked_keywords/live", [{ target: target.domain, location_code: 2840, language_code: "en", item_types: ["organic", "featured_snippet"], include_serp_info: true, limit: 200, order_by: ["keyword_data.keyword_info.search_volume,desc"], tag: `dollwow-alt-${key}-ranked` }]),
  call("labs-gap", "DataForSEO Labs", "/dataforseo_labs/google/domain_intersection/live", [{ target1: target.domain, target2: "dollwow.com", intersections: false, location_code: 2840, language_code: "en", item_types: ["organic", "featured_snippet"], include_serp_info: true, limit: 200, order_by: ["keyword_data.keyword_info.search_volume,desc"], tag: `dollwow-alt-${key}-gap` }]),
  call("ai-mode", "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", device: "desktop", tag: `dollwow-alt-${key}-ai-mode` }]),
  call("chatgpt", "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", tag: `dollwow-alt-${key}-chatgpt` }]),
  call("claude", "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Compare verifiable capabilities and avoid fear marketing, invented testing, volatile prices, or unsupported seller claims.", model_name: "claude-haiku-4-5", max_output_tokens: 1600, web_search: true, tag: `dollwow-alt-${key}-claude` }]),
  call("gemini", "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Compare verifiable capabilities and avoid fear marketing, invented testing, volatile prices, or unsupported seller claims.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1600, web_search: true, tag: `dollwow-alt-${key}-gemini` }]),
  call("perplexity", "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Compare verifiable capabilities and avoid fear marketing, invented testing, volatile prices, or unsupported seller claims.", model_name: "sonar", max_output_tokens: 1600, web_search_country_iso_code: "US", tag: `dollwow-alt-${key}-perplexity` }]),
  call("content-summary", "Content Analysis", "/content_analysis/summary/live", [{ keyword: target.serpKeywords[0], internal_list_limit: 10, tag: `dollwow-alt-${key}-content-summary` }]),
  call("content-search", "Content Analysis", "/content_analysis/search/live", [{ keyword: target.serpKeywords[0], limit: 30, order_by: ["content_info.date_published,desc"], tag: `dollwow-alt-${key}-content-search` }]),
  call("backlinks-summary", "Backlinks", "/backlinks/summary/live", [{ target: target.domain, include_subdomains: true, backlinks_status_type: "live", internal_list_limit: 10, rank_scale: "one_hundred", tag: `dollwow-alt-${key}-backlinks-summary` }]),
  call("backlinks-intersection", "Backlinks", "/backlinks/page_intersection/live", [{ targets: Object.fromEntries(target.comparisonUrls.map((url, index) => [index + 1, url])), exclude_targets: [target.url], intersection_mode: "all", limit: 100, order_by: ["1.rank,desc"], backlinks_status_type: "live", include_subdomains: true, exclude_internal_backlinks: true, rank_scale: "one_hundred", tag: `dollwow-alt-${key}-backlinks-intersection` }]),
  call("onpage", "OnPage", "/on_page/instant_pages", [{ url: target.url, load_resources: false, enable_javascript: false, check_spell: false }]),
  ...["google", "chat_gpt"].map((platform) => call(`mentions-${platform}`, "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform, target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, { keyword: target.serpKeywords[0], search_scope: ["any"], match_type: "word_match" }, { keyword: target.brand, search_scope: ["any"], match_type: "word_match" }], tag: `dollwow-alt-${key}-mentions-${platform}` }]))
];

await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of calls) records.push(await executeCall(item));
const merchant = await executeMerchant();
records.push(merchant);
const manifest = { generatedAt: new Date().toISOString(), key, target, execute, totalCost: records.reduce((sum, item) => sum + Number(item.cost || 0), 0), requestCount: records.length, failedRequests: records.filter((item) => item.error).length, records };
await fs.writeFile(path.join(outputDir, "request-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost: manifest.totalCost, requestCount: manifest.requestCount, failedRequests: manifest.failedRequests, records: records.map(({ id, api, cost, statusCode, statusMessage }) => ({ id, api, cost, statusCode, statusMessage })) }, null, 2));
process.exit(0);

function arg(name) { return process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("="); }
function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }
async function executeCall(item) { const record = { ...item, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" }; if (!execute) return record; try { const response = await post(item.endpoint, item.payload); const task = response.tasks?.[0] || {}; Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null }); await fs.writeFile(path.join(outputDir, `${item.id}.json`), `${JSON.stringify(response, null, 2)}\n`); } catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); } return record; }
async function executeMerchant() { const item = call("merchant", "Merchant", "/merchant/google/products/task_post", [{ keyword: target.brand, location_code: 2840, language_code: "en", depth: 40, priority: 2, tag: `dollwow-alt-${key}-merchant` }]); return executeCall(item); }
async function post(endpoint, payload) { const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload), signal: AbortSignal.timeout(180000) }); const body = await response.json(); const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000); if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`); return body; }
function authHeaders() { return { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" }; }
async function loadEnv(file) { const text = await fs.readFile(file, "utf8"); for (const line of text.split(/\r?\n/)) { const trimmed = line.trim(); if (!trimmed || trimmed.startsWith("#")) continue; const equals = trimmed.indexOf("="); if (equals < 1) continue; const envKey = trimmed.slice(0, equals).trim(); const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, ""); if (!(envKey in process.env)) process.env[envKey] = value; } }
