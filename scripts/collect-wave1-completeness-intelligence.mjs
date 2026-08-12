import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const generatedAt = new Date().toISOString();
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-12/step-69-wave1-completeness");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO credentials are required.");
}

const keywords = [
  "sex dolls",
  "sex doll buying guide",
  "how to choose a sex doll",
  "silicone sex dolls",
  "how to choose a silicone sex doll",
  "tpe vs silicone sex doll"
];

const questions = [
  { key: "first-buyer", prompt: "I am buying my first adult sex doll in the US. What should I compare before choosing one, and which current sources are useful? Cite sources." },
  { key: "shop", prompt: "Where can a US buyer compare sex dolls online, and what product facts and seller protections should be checked before ordering? Cite sources." },
  { key: "silicone", prompt: "How should a US buyer choose a silicone sex doll? Compare construction, weight, care, options, price factors, and seller proof. Cite sources." }
];

const calls = [
  call("bing-keywords", "Keywords Data", "/keywords_data/bing/search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-wave1-bing" }]),
  call("ai-keywords", "AI Keyword Data", "/ai_optimization/ai_keyword_data/keywords_search_volume/live", [{ keywords, location_code: 2840, language_code: "en", tag: "dollwow-wave1-ai-keywords" }]),
  ...questions.flatMap(({ key, prompt }) => [
    call(`ai-mode-${key}`, "Google AI Mode", "/serp/google/ai_mode/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", device: "desktop", tag: `dollwow-wave1-ai-mode-${key}` }]),
    call(`perplexity-${key}`, "Perplexity", "/ai_optimization/perplexity/llm_responses/live", [{ user_prompt: prompt, system_message: "Answer as a neutral US buyer researcher. Prefer current verifiable sources.", model_name: "sonar", max_output_tokens: 1400, web_search_country_iso_code: "US", tag: `dollwow-wave1-perplexity-${key}` }]),
    call(`chatgpt-search-${key}`, "ChatGPT Search", "/ai_optimization/chat_gpt/llm_scraper/live/advanced", [{ keyword: prompt, location_code: 2840, language_code: "en", tag: `dollwow-wave1-chatgpt-search-${key}` }])
  ]),
  ...["google", "chat_gpt"].map((platform) => call(
    `mentions-${platform}`,
    "LLM Mentions",
    "/ai_optimization/llm_mentions/target_metrics/live",
    [{
      location_code: 2840,
      language_code: "en",
      platform,
      target: [
        { keyword: "dollwow.com", search_scope: ["any"], match_type: "word_match" },
        { keyword: "sex dolls", search_scope: ["any"], match_type: "word_match" },
        { keyword: "silicone sex dolls", search_scope: ["any"], match_type: "word_match" }
      ],
      tag: `dollwow-wave1-mentions-${platform}`
    }]
  )),
  ...[
    ["flagship", "https://dollwow.com/learn/sex-doll-guide"],
    ["shop", "https://dollwow.com/shop/sex-dolls"],
    ["silicone", "https://dollwow.com/shop/silicone"]
  ].map(([key, url]) => call(`onpage-${key}`, "OnPage", "/on_page/instant_pages", [{ url, load_resources: false, enable_javascript: false, check_spell: false }]))
];

await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of calls) {
  const record = { ...item, executed: execute, taskId: null, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (execute) {
    try {
      const response = await post(item.endpoint, item.payload);
      const task = response.tasks?.[0] || {};
      record.taskId = task.id || null;
      record.cost = Number(task.cost || 0);
      record.statusCode = task.status_code || response.status_code || null;
      record.statusMessage = task.status_message || response.status_message || null;
      await fs.writeFile(path.join(outputDir, `${item.id}.json`), `${JSON.stringify(response, null, 2)}\n`);
    } catch (error) {
      record.error = true;
      record.statusMessage = error instanceof Error ? error.message : String(error);
    }
  }
  records.push(record);
}

const totalCost = records.reduce((sum, item) => sum + item.cost, 0);
const manifest = { generatedAt, execute, totalCost, requestCount: records.length, failedRequests: records.filter((item) => item.error).length, records };
await fs.writeFile(path.join(outputDir, "request-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir: path.relative(ROOT, outputDir), totalCost, requestCount: records.length, failedRequests: manifest.failedRequests, records: records.map(({ id, api, endpoint, cost, statusCode, statusMessage }) => ({ id, api, endpoint, cost, statusCode, statusMessage })) }, null, 2));

function call(id, api, endpoint, payload) {
  return { id, api, endpoint, payload };
}

async function post(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
  if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) {
    throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`);
  }
  return body;
}

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
