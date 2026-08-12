import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const retry = process.argv.find((arg) => arg.startsWith("--retry="))?.split("=")[1];
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-12/step-73-wave4-guides");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) throw new Error("DataForSEO credentials are required.");

const topics = [
  {
    key: "best",
    keyword: "best sex dolls",
    keywords: ["best sex dolls", "best sex doll for first time buyer", "top sex dolls", "best realistic sex dolls"],
    url: "https://dollwow.com/learn/best-sex-dolls",
    prompt: "How should a US first-time buyer identify the best sex doll for their needs? Cover product form, material, exact size and weight, realism evidence, ready stock versus custom production, total price, seller proof, arrival support, care, and repairs. Cite current sources.",
    competitors: {
      1: "https://www.innerbody.com/best-sex-dolls",
      2: "https://www.yourdoll.com/blogs/sex-doll-guides/best-sex-dolls",
      3: "https://www.sexdollqueen.com/blogs/articles/best-sex-dolls-usa-reviews"
    }
  },
  {
    key: "size-weight",
    keyword: "sex doll sizes",
    keywords: ["sex doll sizes", "sex doll weight", "how much do sex dolls weigh", "sex doll measurements", "sex doll size chart"],
    url: "https://dollwow.com/learn/sex-doll-size-weight-guide",
    prompt: "How should a US buyer compare sex doll size and weight before ordering? Cover height, listed weight, body measurements, delivery access, repeated handling, storage, support-surface capacity, material uncertainty, and product-specific verification. Use US and metric units and cite current sources.",
    competitors: {
      1: "https://www.yourdoll.com/blogs/sex-doll-guides/how-much-do-sex-dolls-weigh",
      2: "https://www.rosemarydoll.com/blogs/sex-doll-guides/sex-doll-size-guide",
      3: "https://www.sexdollqueen.com/blogs/articles/sex-doll-size-guide"
    }
  }
];

const keywords = [...new Set(topics.flatMap((topic) => topic.keywords))];
const calls = [
  call("bing-keywords", "Bing Keyword Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-wave4-guides-bing" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-wave4-guides-ai-keywords" }]),
  ...topics.flatMap((topic) => [
    call(`bing-serp-${topic.key}`, "Bing SERP", "/serp/bing/organic/live/advanced", [{ keyword: topic.keyword, location_code: 2840, language_code: "en", device: "desktop", os: "windows", depth: 20, tag: `dollwow-wave4-guides-bing-serp-${topic.key}` }]),
    call(`ai-mode-${topic.key}`, "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: topic.prompt, location_code: 2840, language_code: "en", device: "desktop", tag: `dollwow-wave4-guides-ai-mode-${topic.key}` }]),
    call(`chatgpt-${topic.key}`, "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: topic.prompt, location_code: 2840, language_code: "en", tag: `dollwow-wave4-guides-chatgpt-${topic.key}` }]),
    call(`perplexity-${topic.key}`, "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: topic.prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current verifiable sources.", model_name: "sonar", max_output_tokens: 1400, web_search_country_iso_code: "US", tag: `dollwow-wave4-guides-perplexity-${topic.key}` }]),
    call(`backlinks-${topic.key}`, "Backlinks", "/backlinks/page_intersection/live", [{ targets: topic.competitors, exclude_targets: [topic.url], intersection_mode: "all", limit: 100, order_by: ["1.rank,desc"], backlinks_status_type: "live", include_subdomains: true, exclude_internal_backlinks: true, rank_scale: "one_hundred", tag: `dollwow-wave4-guides-backlinks-${topic.key}` }]),
    call(`onpage-${topic.key}`, "OnPage", "/on_page/instant_pages", [{ url: topic.url, load_resources: false, enable_javascript: false, check_spell: false }])
  ]),
  ...["google", "chat_gpt"].map((platform) => call(`mentions-${platform}`, "LLM Mentions", "/ai_optimization/llm_mentions/target_metrics/live", [{ location_code: 2840, language_code: "en", platform, target: [{ keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" }, ...topics.map((topic) => ({ keyword: topic.keyword, search_scope: ["any"], match_type: "word_match" }))], tag: `dollwow-wave4-guides-mentions-${platform}` }]))
];

await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of retry ? calls.filter((callItem) => callItem.id === retry) : calls) records.push(await executeCall(item));
const totalCost = records.reduce((sum, item) => sum + Number(item.cost || 0), 0);
const manifest = { generatedAt: new Date().toISOString(), execute, totalCost, requestCount: records.length, failedRequests: records.filter((item) => item.error).length, records };
await fs.writeFile(path.join(outputDir, retry ? `request-manifest-retry-${retry}.json` : "request-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost, requestCount: records.length, failedRequests: manifest.failedRequests, records: records.map(({ id, api, endpoint, cost, statusCode, statusMessage }) => ({ id, api, endpoint, cost, statusCode, statusMessage })) }, null, 2));

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
