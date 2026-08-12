import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const fetchMerchant = process.argv.includes("--fetch-merchant");
const retry = process.argv.find((arg) => arg.startsWith("--retry="))?.split("=")[1];
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-12/step-74-tier1-brand-hubs");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");

const brands = [
  brand("wm", "WM dolls", "wm dolls", "wm-dolls", "wmdolls.com", ["wm dolls", "wm sex doll", "wm tpe dolls", "wm silicone dolls"], ["https://www.yourdoll.com/collections/wm-doll", "https://www.rosemarydoll.com/collections/wm-dolls", "https://www.joylovedolls.com/collections/wm-dolls"]),
  brand("irontech", "Irontech dolls", "irontech dolls", "irontech-dolls", "irontechdoll.com", ["irontech dolls", "irontech doll", "irontech silicone dolls", "irontech tpe dolls"], ["https://www.yourdoll.com/collections/irontech-doll", "https://www.rosemarydoll.com/collections/irontech-doll", "https://www.bestrealdoll.com/collections/irontech-doll"]),
  brand("starpery", "Starpery dolls", "starpery dolls", "starpery-dolls", "starpery.com", ["starpery dolls", "starpery sex doll", "starpery silicone dolls"], ["https://www.yourdoll.com/collections/starpery-doll", "https://www.rosemarydoll.com/collections/starpery", "https://www.joylovedolls.com/collections/starpery-dolls"]),
  brand("se-doll", "SE Doll", "se doll", "se-doll", "sedoll.com", ["se doll", "se sex doll", "se doll silicone", "se doll tpe"], ["https://www.rosemarydoll.com/collections/se-doll", "https://www.siliconwives.com/collections/se-doll", "https://www.realsexdoll.com/collections/se-doll"]),
  brand("tantaly", "Tantaly dolls", "tantaly dolls", "tantaly-dolls", "tantaly.com", ["tantaly", "tantaly dolls", "tantaly torso", "tantaly sex doll"], ["https://www.yourdoll.com/collections/tantaly", "https://www.rosemarydoll.com/collections/tantaly", "https://www.xtorso.com/collections/tantaly"]),
  brand("erovenus", "Erovenus dolls", "erovenus dolls", "erovenus-dolls", "erovenus.com", ["erovenus", "erovenus dolls", "erovenus torso", "erovenus sex doll"], ["https://www.rosemarydoll.com/collections/erovenus", "https://www.yourdoll.com/collections/erovenus", "https://www.sexdollqueen.com/collections/erovenus"])
];

const keywords = [...new Set(brands.flatMap((item) => item.keywords))];
const incomplete = new Set(["wm", "irontech", "erovenus"]);
const calls = [
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-tier1-brands-bing" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-tier1-brands-ai-keywords" }]),
  ...brands.flatMap((item) => [
    call(`bing-serp-${item.key}`, "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: item.keyword, location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag: `dollwow-tier1-bing-${item.key}` }]),
    call(`ai-mode-${item.key}`, "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: item.prompt, location_code: 2840, language_code: "en", device: "desktop", tag: `dollwow-tier1-ai-mode-${item.key}` }]),
    call(`chatgpt-${item.key}`, "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: item.prompt, location_code: 2840, language_code: "en", tag: `dollwow-tier1-chatgpt-${item.key}` }]),
    call(`claude-${item.key}`, "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: item.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer official manufacturer facts and current verifiable sources.", model_name: "claude-haiku-4-5", max_output_tokens: 1200, web_search: true, tag: `dollwow-tier1-claude-${item.key}` }]),
    call(`gemini-${item.key}`, "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: item.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer official manufacturer facts and current verifiable sources.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1200, web_search: true, tag: `dollwow-tier1-gemini-${item.key}` }]),
    call(`perplexity-${item.key}`, "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: item.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer official manufacturer facts and current verifiable sources.", model_name: "sonar", max_output_tokens: 1200, web_search_country_iso_code: "US", tag: `dollwow-tier1-perplexity-${item.key}` }]),
    call(`backlinks-intersection-${item.key}`, "Backlinks", "/backlinks/page_intersection/live", [{ targets: Object.fromEntries(item.competitors.map((url, index) => [index + 1, url])), exclude_targets: [item.url], intersection_mode: "all", limit: 100, order_by: ["1.rank,desc"], backlinks_status_type: "live", include_subdomains: true, exclude_internal_backlinks: true, rank_scale: "one_hundred", tag: `dollwow-tier1-intersection-${item.key}` }]),
    call(`onpage-${item.key}`, "OnPage", "/on_page/instant_pages", [{ url: item.url, load_resources: false, enable_javascript: false, check_spell: false }]),
    ...(incomplete.has(item.key) ? [
      call(`content-summary-${item.key}`, "Content Analysis", "/content_analysis/summary/live", [{ keyword: item.keyword, internal_list_limit: 10, tag: `dollwow-tier1-content-summary-${item.key}` }]),
      call(`content-search-${item.key}`, "Content Analysis", "/content_analysis/search/live", [{ keyword: item.keyword, limit: 20, order_by: ["content_info.date_published,desc"], tag: `dollwow-tier1-content-search-${item.key}` }]),
      call(`backlinks-summary-${item.key}`, "Backlinks", "/backlinks/summary/live", [{ target: item.manufacturerDomain, include_subdomains: true, exclude_internal_backlinks: true, tag: `dollwow-tier1-backlinks-summary-${item.key}` }]),
      call(`linked-pages-${item.key}`, "Backlinks", "/backlinks/domain_pages/live", [{ target: item.manufacturerDomain, limit: 20, order_by: ["page_summary.backlinks,desc", "page_summary.rank,desc"], include_subdomains: true, exclude_internal_backlinks: true, tag: `dollwow-tier1-linked-pages-${item.key}` }])
    ] : [])
  ]),
  ...["google", "chat_gpt"].map((platform) => call(`mentions-${platform}`, "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform, target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, ...brands.map((item) => ({ keyword: item.keyword, search_scope: ["any"], match_type: "word_match" }))], tag: `dollwow-tier1-brand-mentions-${platform}` }]))
];

await fs.mkdir(outputDir, { recursive: true });
const selected = retry ? calls.filter((item) => item.id === retry) : fetchMerchant ? [] : calls;
const records = [];
for (const item of selected) records.push(await executeCall(item));
if (!retry && !fetchMerchant) for (const item of brands) records.push(await executeMerchant(item));
if (fetchMerchant) for (const item of brands) records.push(await fetchMerchantResult(item));

const manifest = { generatedAt: new Date().toISOString(), execute, totalCost: records.reduce((sum, item) => sum + Number(item.cost || 0), 0), requestCount: records.length, failedRequests: records.filter((item) => item.error).length, records };
const manifestName = retry ? `request-manifest-retry-${retry}.json` : fetchMerchant ? "request-manifest-merchant-results.json" : "request-manifest.json";
await fs.writeFile(path.join(outputDir, manifestName), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost: manifest.totalCost, requestCount: manifest.requestCount, failedRequests: manifest.failedRequests, records: records.map(({ id, api, cost, statusCode, statusMessage }) => ({ id, api, cost, statusCode, statusMessage })) }, null, 2));

function brand(key, label, keyword, handle, manufacturerDomain, keywordList, competitors) {
  return { key, label, keyword, handle, manufacturerDomain, keywords: keywordList, competitors, url: `https://dollwow.com/brands/${handle}`, prompt: `A US buyer is comparing ${label}. Explain what the brand is known for, its material and product-form paths, size and weight checks, model-specific options, seller approval, ordering evidence, care, and support. Avoid universal quality claims and cite current sources.` };
}
async function executeCall(item) {
  const record = { ...item, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try { const response = await post(item.endpoint, item.payload); const task = response.tasks?.[0] || {}; Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null }); await fs.writeFile(path.join(outputDir, `${item.id}.json`), `${JSON.stringify(response, null, 2)}\n`); }
  catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}
async function executeMerchant(item) {
  const id = `merchant-${item.key}`; const endpoint = "/merchant/google/products/task_post"; const record = { id, api: "Merchant", endpoint, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try { const response = await post(endpoint, [{ keyword: item.keyword, location_code: 2840, language_code: "en", depth: 40, priority: 2, tag: `dollwow-tier1-${id}` }]); const task = response.tasks?.[0] || {}; Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null }); await fs.writeFile(path.join(outputDir, `${id}-post.json`), `${JSON.stringify(response, null, 2)}\n`); }
  catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}
async function fetchMerchantResult(item) {
  const id = `merchant-${item.key}`; const posted = JSON.parse(await fs.readFile(path.join(outputDir, `${id}-post.json`), "utf8")); const taskId = posted.tasks?.[0]?.id; const endpoint = `/merchant/google/products/task_get/advanced/${taskId}`; const record = { id: `${id}-result`, api: "Merchant", endpoint, executed: execute, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try { const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() }); const body = await response.json(); const task = body.tasks?.[0] || {}; Object.assign(record, { statusCode: task.status_code || body.status_code || null, statusMessage: task.status_message || body.status_message || null }); await fs.writeFile(path.join(outputDir, `${id}.json`), `${JSON.stringify(body, null, 2)}\n`); }
  catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}
function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }
async function post(endpoint, payload) { const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) }); const body = await response.json(); const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000); if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`); return body; }
function authHeaders() { return { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" }; }
async function loadEnv(file) { const text = await fs.readFile(file, "utf8"); for (const line of text.split(/\r?\n/)) { const trimmed = line.trim(); if (!trimmed || trimmed.startsWith("#")) continue; const equals = trimmed.indexOf("="); if (equals < 1) continue; const key = trimmed.slice(0, equals).trim(); const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, ""); if (!(key in process.env)) process.env[key] = value; } }
