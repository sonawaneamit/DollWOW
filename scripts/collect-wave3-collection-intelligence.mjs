import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const retry = process.argv.find((arg) => arg.startsWith("--retry="))?.split("=")[1];
const fetchMerchant = process.argv.includes("--fetch-merchant");
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-12/step-72-wave3-collections");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");

const topics = [
  {
    key: "affordable",
    keyword: "cheap sex dolls",
    keywords: ["cheap sex dolls", "affordable sex dolls", "sex dolls under 1000", "budget sex doll"],
    url: "https://dollwow.com/shop/cheap-sex-dolls",
    prompt: "How should a US buyer compare affordable sex dolls without sacrificing product truth or support? Cover product form, material, size, weight, starting versus delivered price, seller proof, care, and ownership support. Cite current sources.",
    competitors: { 1: "https://www.yourdoll.com/collections/cheap-sex-dolls", 2: "https://www.rosemarydoll.com/collections/cheap-sex-dolls", 3: "https://www.bestrealdoll.com/collections/cheap-sex-dolls" }
  },
  {
    key: "realistic",
    keyword: "most realistic sex dolls",
    keywords: ["most realistic sex dolls", "realistic sex dolls", "lifelike sex dolls", "realistic silicone dolls for sale"],
    url: "https://dollwow.com/shop/realistic-sex-dolls",
    prompt: "How should a US buyer compare the most realistic sex dolls without relying on subjective rankings? Cover face and body coherence, material, finish, eyes, hands, photographs, weight, configuration, seller proof, and support. Cite current sources.",
    competitors: { 1: "https://www.yourdoll.com/collections/realistic-sex-dolls", 2: "https://www.rosemarydoll.com/collections/realistic-sex-dolls", 3: "https://www.siliconwives.com/blogs/news/who-makes-the-most-realistic-sex-dolls" }
  },
  {
    key: "custom",
    keyword: "custom sex dolls",
    keywords: ["custom sex dolls", "customizable sex dolls", "build your own sex doll", "made to order sex doll"],
    url: "https://dollwow.com/shop/custom",
    prompt: "How should a US buyer plan a custom sex doll order? Cover body and head selection, material, size, weight, option compatibility, configured price, production review, factory media, shipping, seller proof, and ownership support. Cite current sources.",
    competitors: { 1: "https://www.yourdoll.com/collections/custom-sex-dolls", 2: "https://www.rosemarydoll.com/collections/custom-sex-dolls", 3: "https://www.siliconwives.com/collections/custom-sex-dolls" }
  }
];

const keywords = [...new Set(topics.flatMap((topic) => topic.keywords))];
const calls = [
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-wave3-bing" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-wave3-ai-keywords" }]),
  ...topics.flatMap((topic) => [
    call(`bing-serp-${topic.key}`, "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: topic.keyword, location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag: `dollwow-wave3-bing-serp-${topic.key}` }]),
    call(`ai-mode-${topic.key}`, "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: topic.prompt, location_code: 2840, language_code: "en", device: "desktop", tag: `dollwow-wave3-ai-mode-${topic.key}` }]),
    call(`chatgpt-${topic.key}`, "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: topic.prompt, location_code: 2840, language_code: "en", tag: `dollwow-wave3-chatgpt-${topic.key}` }]),
    call(`claude-${topic.key}`, "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: topic.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current verifiable sources.", model_name: "claude-haiku-4-5", max_output_tokens: 1400, web_search: true, tag: `dollwow-wave3-claude-${topic.key}` }]),
    call(`gemini-${topic.key}`, "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: topic.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current verifiable sources.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1400, web_search: true, tag: `dollwow-wave3-gemini-${topic.key}` }]),
    call(`perplexity-${topic.key}`, "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: topic.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current verifiable sources.", model_name: "sonar", max_output_tokens: 1400, web_search_country_iso_code: "US", tag: `dollwow-wave3-perplexity-${topic.key}` }]),
    call(`content-${topic.key}`, "Content Analysis", "/content_analysis/search/live", [{ keyword: topic.keyword, limit: 30, order_by: ["content_info.date_published,desc"], tag: `dollwow-wave3-content-${topic.key}` }]),
    call(`backlinks-${topic.key}`, "Backlinks", "/backlinks/page_intersection/live", [{ targets: topic.competitors, exclude_targets: [topic.url], intersection_mode: "all", limit: 100, order_by: ["1.rank,desc"], backlinks_status_type: "live", include_subdomains: true, exclude_internal_backlinks: true, rank_scale: "one_hundred", tag: `dollwow-wave3-backlinks-${topic.key}` }]),
    call(`onpage-${topic.key}`, "OnPage", "/on_page/instant_pages", [{ url: topic.url, load_resources: false, enable_javascript: false, check_spell: false }])
  ]),
  ...["google", "chat_gpt"].map((platform) => call(`mentions-${platform}`, "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform, target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, ...topics.map((topic) => ({ keyword: topic.keyword, search_scope: ["any"], match_type: "word_match" }))], tag: `dollwow-wave3-mentions-${platform}` }]))
];

const selectedCalls = retry ? calls.filter((item) => item.id === retry) : fetchMerchant ? [] : calls;
await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of selectedCalls) records.push(await executeCall(item));
if (!retry && !fetchMerchant) for (const topic of topics) records.push(await executeMerchant(topic));
if (fetchMerchant) for (const topic of topics) records.push(await fetchMerchantResult(topic));

const totalCost = records.reduce((sum, item) => sum + Number(item.cost || 0), 0);
const manifest = { generatedAt: new Date().toISOString(), execute, totalCost, requestCount: records.length, failedRequests: records.filter((item) => item.error).length, records };
const manifestName = retry ? `request-manifest-retry-${retry}.json` : fetchMerchant ? "request-manifest-merchant-results.json" : "request-manifest.json";
await fs.writeFile(path.join(outputDir, manifestName), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost, requestCount: records.length, failedRequests: manifest.failedRequests, records: records.map(({ id, api, endpoint, cost, statusCode, statusMessage }) => ({ id, api, endpoint, cost, statusCode, statusMessage })) }, null, 2));

async function executeCall(item) {
  const record = { ...item, executed: execute, taskId: null, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await post(item.endpoint, item.payload); const task = response.tasks?.[0] || {};
    Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null });
    await fs.writeFile(path.join(outputDir, `${item.id}.json`), `${JSON.stringify(response, null, 2)}\n`);
  } catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}

async function executeMerchant(topic) {
  const id = `merchant-${topic.key}`; const endpoint = "/merchant/google/products/task_post";
  const record = { id, api: "Merchant", endpoint, executed: execute, taskId: null, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await post(endpoint, [{ keyword: topic.keyword, location_code: 2840, language_code: "en", depth: 40, priority: 2, tag: `dollwow-wave3-${id}` }]); const task = response.tasks?.[0] || {};
    Object.assign(record, { taskId: task.id || null, cost: Number(task.cost || 0), statusCode: task.status_code || response.status_code || null, statusMessage: task.status_message || response.status_message || null });
    await fs.writeFile(path.join(outputDir, `${id}-post.json`), `${JSON.stringify(response, null, 2)}\n`);
  } catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}

async function fetchMerchantResult(topic) {
  const id = `merchant-${topic.key}`; const posted = JSON.parse(await fs.readFile(path.join(outputDir, `${id}-post.json`), "utf8")); const taskId = posted.tasks?.[0]?.id;
  const endpoint = `/merchant/google/products/task_get/advanced/${taskId}`; const record = { id: `${id}-result`, api: "Merchant", endpoint, executed: execute, taskId, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() }); const body = await response.json(); const task = body.tasks?.[0] || {};
    Object.assign(record, { statusCode: task.status_code || body.status_code || null, statusMessage: task.status_message || body.status_message || null });
    await fs.writeFile(path.join(outputDir, `${id}.json`), `${JSON.stringify(body, null, 2)}\n`);
  } catch (error) { record.error = true; record.statusMessage = error instanceof Error ? error.message : String(error); }
  return record;
}

function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }
async function post(endpoint, payload) { const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) }); const body = await response.json(); const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000); if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`); return body; }
function authHeaders() { return { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" }; }
async function loadEnv(file) { const text = await fs.readFile(file, "utf8"); for (const line of text.split(/\r?\n/)) { const trimmed = line.trim(); if (!trimmed || trimmed.startsWith("#")) continue; const equals = trimmed.indexOf("="); if (equals < 1) continue; const key = trimmed.slice(0, equals).trim(); const value = trimmed.slice(equals + 1).trim().replace(/^['"]|['"]$/g, ""); if (!(key in process.env)) process.env[key] = value; } }
