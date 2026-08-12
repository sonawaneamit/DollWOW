import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const fetchMerchant = process.argv.includes("--fetch-merchant");
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-12/step-77-editorial-care-batch");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");

const topics = [
  topic("cost", "sex doll cost", ["sex doll cost", "sex doll price", "how much does a sex doll cost", "silicone sex doll price", "tpe sex doll price"], "https://dollwow.com/learn/sex-doll-cost", "How should a US buyer calculate the complete cost of a sex doll? Separate starting, configured, delivered, and ownership cost; compare product form, material, size, options, stock or production, shipping, taxes, seller proof, care, and support. Cite current sources.", ["https://www.yourdoll.com/blogs/sex-doll-guides/how-much-do-sex-dolls-cost", "https://www.rosemarydoll.com/blogs/sex-doll-guides/how-much-does-a-sex-doll-cost", "https://www.sexdollqueen.com/blogs/articles/how-much-do-sex-dolls-cost"]),
  topic("reviews", "sex doll reviews", ["sex doll reviews", "sex doll review", "best sex doll reviews", "real sex doll reviews", "sex doll customer reviews"], "https://dollwow.com/learn/sex-doll-reviews", "How should a US buyer evaluate sex doll reviews before ordering? Cover exact product identity, photos and video, specifications, seller and order date, sponsorship, ratings, delivery, support, negative reviews, current policies, and independent verification. Cite current sources.", ["https://www.innerbody.com/best-sex-dolls", "https://www.sexdollqueen.com/blogs/articles/best-sex-dolls-usa-reviews", "https://www.reddit.com/r/SexDolls/"]),
  topic("cleaning", "how to clean a sex doll", ["how to clean a sex doll", "sex doll cleaning", "how to clean tpe sex doll", "how to clean silicone sex doll", "sex doll care"], "https://dollwow.com/learn/how-to-clean-a-sex-doll", "How should an owner clean and dry a sex doll safely? Cover exact material, body surface, fixed openings, removable inserts, face, hair, electronics, rinsing, complete drying, powder or oil only when approved, stains, storage, and when to stop and ask support. Cite current manufacturer sources.", ["https://www.tantaly.com/pages/cleaning-and-maintenance-guide-for-sex-doll", "https://realdoll.com/wp-content/uploads/2025/08/Care-Guide-Realdoll-Classic-R2.pdf", "https://www.irontechdoll.com/sex-doll-care/"])
];

const keywords = [...new Set(topics.flatMap((item) => item.keywords))];
const calls = [
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-editorial-care-bing" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-editorial-care-ai-keywords" }]),
  ...topics.flatMap((item) => [
    call(`bing-serp-${item.key}`, "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: item.keyword, location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag: `dollwow-editorial-care-bing-${item.key}` }]),
    call(`ai-mode-${item.key}`, "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: item.prompt, location_code: 2840, language_code: "en", device: "desktop", tag: `dollwow-editorial-care-ai-mode-${item.key}` }]),
    call(`chatgpt-${item.key}`, "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: item.prompt, location_code: 2840, language_code: "en", tag: `dollwow-editorial-care-chatgpt-${item.key}` }]),
    call(`claude-${item.key}`, "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: item.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current official and verifiable sources.", model_name: "claude-haiku-4-5", max_output_tokens: 1400, web_search: true, tag: `dollwow-editorial-care-claude-${item.key}` }]),
    call(`gemini-${item.key}`, "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: item.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current official and verifiable sources.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1400, web_search: true, tag: `dollwow-editorial-care-gemini-${item.key}` }]),
    call(`perplexity-${item.key}`, "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: item.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current official and verifiable sources.", model_name: "sonar", max_output_tokens: 1400, web_search_country_iso_code: "US", tag: `dollwow-editorial-care-perplexity-${item.key}` }]),
    call(`content-${item.key}`, "Content Analysis", "/content_analysis/search/live", [{ keyword: item.keyword, limit: 30, order_by: ["content_info.date_published,desc"], tag: `dollwow-editorial-care-content-${item.key}` }]),
    call(`backlinks-${item.key}`, "Backlinks", "/backlinks/page_intersection/live", [{ targets: Object.fromEntries(item.competitors.map((url, index) => [index + 1, url])), exclude_targets: [item.url], intersection_mode: "all", limit: 100, order_by: ["1.rank,desc"], backlinks_status_type: "live", include_subdomains: true, exclude_internal_backlinks: true, rank_scale: "one_hundred", tag: `dollwow-editorial-care-backlinks-${item.key}` }]),
    call(`onpage-${item.key}`, "OnPage", "/on_page/instant_pages", [{ url: item.url, load_resources: false, enable_javascript: false, check_spell: false }])
  ]),
  ...["google", "chat_gpt"].map((platform) => call(`mentions-${platform}`, "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform, target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, ...topics.map((item) => ({ keyword: item.keyword, search_scope: ["any"], match_type: "word_match" }))], tag: `dollwow-editorial-care-mentions-${platform}` }]))
];

await fs.mkdir(outputDir, { recursive: true });
const records = [];
if (!fetchMerchant) for (const item of calls) records.push(await executeCall(item));
if (!fetchMerchant) for (const item of topics) records.push(await executeMerchant(item));
if (fetchMerchant) for (const item of topics) records.push(await fetchMerchantResult(item));

const manifest = { generatedAt: new Date().toISOString(), execute, totalCost: records.reduce((sum, item) => sum + Number(item.cost || 0), 0), requestCount: records.length, failedRequests: records.filter((item) => item.error).length, records };
await fs.writeFile(path.join(outputDir, fetchMerchant ? "request-manifest-merchant-results.json" : "request-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost: manifest.totalCost, requestCount: manifest.requestCount, failedRequests: manifest.failedRequests }, null, 2));

function topic(key, keyword, keywordList, url, prompt, competitors) { return { key, keyword, keywords: keywordList, url, prompt, competitors }; }
function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }
async function executeCall(item) {
  const record = { ...item, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try { const response = await post(item.endpoint, item.payload); const task = response.tasks?.[0] || {}; Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null }); await fs.writeFile(path.join(outputDir, `${item.id}.json`), `${JSON.stringify(response, null, 2)}\n`); }
  catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}
async function executeMerchant(item) {
  const id = `merchant-${item.key}`; const record = { id, api: "Merchant", executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try { const response = await post("/merchant/google/products/task_post", [{ keyword: item.keyword, location_code: 2840, language_code: "en", depth: 40, priority: 2, tag: `dollwow-editorial-care-${id}` }]); const task = response.tasks?.[0] || {}; Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null }); await fs.writeFile(path.join(outputDir, `${id}-post.json`), `${JSON.stringify(response, null, 2)}\n`); }
  catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}
async function fetchMerchantResult(item) {
  const id = `merchant-${item.key}`; const posted = JSON.parse(await fs.readFile(path.join(outputDir, `${id}-post.json`), "utf8")); const taskId = posted.tasks?.[0]?.id; const endpoint = `/merchant/google/products/task_get/advanced/${taskId}`; const record = { id: `${id}-result`, api: "Merchant", executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try { const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() }); const body = await response.json(); const task = body.tasks?.[0] || {}; Object.assign(record, { statusCode: task.status_code || body.status_code || null, statusMessage: task.status_message || body.status_message || null }); await fs.writeFile(path.join(outputDir, `${id}.json`), `${JSON.stringify(body, null, 2)}\n`); }
  catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}
async function post(endpoint, payload) { const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) }); const body = await response.json(); const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000); if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`); return body; }
function authHeaders() { return { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" }; }
async function loadEnv(file) { const text = await fs.readFile(file, "utf8"); for (const line of text.split(/\r?\n/)) { const trimmed = line.trim(); if (!trimmed || trimmed.startsWith("#")) continue; const equals = trimmed.indexOf("="); if (equals < 1) continue; const key = trimmed.slice(0, equals).trim(); const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, ""); if (!(key in process.env)) process.env[key] = value; } }
