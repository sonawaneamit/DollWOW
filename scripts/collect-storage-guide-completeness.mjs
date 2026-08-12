import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-12/step-76-storage-guide");
const url = "https://dollwow.com/learn/sex-doll-storage";
const keywords = ["sex doll storage", "how to store a sex doll", "sex doll storage bag", "sex doll storage case", "hanging sex doll storage"];
const prompt = "How should a US owner store a sex doll safely and privately? Compare flat, hanging, standing, bag, case, and original-box storage by material, size, weight, support, pressure, moisture, dye transfer, access, and privacy. Cite current sources.";

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");

const calls = [
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-storage-bing" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-storage-ai-keywords" }]),
  call("bing-serp", "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: "sex doll storage", location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag: "dollwow-storage-bing-serp" }]),
  call("ai-mode", "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", device: "desktop", tag: "dollwow-storage-ai-mode" }]),
  call("chatgpt", "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", tag: "dollwow-storage-chatgpt" }]),
  call("claude", "Claude", "/ai_optimization/claude/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US owner-safety researcher. Prefer current manufacturer guidance and verifiable sources.", model_name: "claude-haiku-4-5", max_output_tokens: 1400, web_search: true, tag: "dollwow-storage-claude" }]),
  call("gemini", "Gemini", "/ai_optimization/gemini/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US owner-safety researcher. Prefer current manufacturer guidance and verifiable sources.", model_name: "gemini-2.5-flash-lite", max_output_tokens: 1400, web_search: true, tag: "dollwow-storage-gemini" }]),
  call("perplexity", "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US owner-safety researcher. Prefer current manufacturer guidance and verifiable sources.", model_name: "sonar", max_output_tokens: 1400, web_search_country_iso_code: "US", tag: "dollwow-storage-perplexity" }]),
  call("content", "Content Analysis", "/content_analysis/search/live", [{ keyword: "sex doll storage", limit: 30, order_by: ["content_info.date_published,desc"], tag: "dollwow-storage-content" }]),
  call("backlinks", "Backlinks", "/backlinks/page_intersection/live", [{ targets: { 1: "https://www.sexdollqueen.com/blogs/articles/how-to-hide-a-sex-doll", 2: "https://www.yourdoll.com/storage-solutions-for-real-sex-dolls-with-accessories/", 3: "https://www.coeros.com/collections/sex-doll-storage/" }, exclude_targets: [url], intersection_mode: "all", limit: 100, order_by: ["1.rank,desc"], backlinks_status_type: "live", include_subdomains: true, exclude_internal_backlinks: true, rank_scale: "one_hundred", tag: "dollwow-storage-backlinks" }]),
  call("onpage", "OnPage", "/on_page/instant_pages", [{ url, load_resources: false, enable_javascript: false, check_spell: false }]),
  ...["google", "chat_gpt"].map((platform) => call(`mentions-${platform}`, "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform, target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, { keyword: "sex doll storage", search_scope: ["any"], match_type: "word_match" }], tag: `dollwow-storage-mentions-${platform}` }]))
];

await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of calls) records.push(await executeCall(item));
const manifest = { generatedAt: new Date().toISOString(), execute, totalCost: records.reduce((sum, item) => sum + Number(item.cost || 0), 0), requestCount: records.length, failedRequests: records.filter((item) => item.error).length, records };
await fs.writeFile(path.join(outputDir, "request-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost: manifest.totalCost, requestCount: manifest.requestCount, failedRequests: manifest.failedRequests }, null, 2));

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

function call(id, api, endpoint, payload) { return { id, api, endpoint, payload }; }
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
