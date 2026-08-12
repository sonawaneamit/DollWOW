import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const execute = process.argv.includes("--execute");
const retryBacklinks = process.argv.includes("--retry-backlinks");
const generatedAt = new Date().toISOString();
const outputDir = path.join(ROOT, "data/exports/seo-intelligence/2026-08-12/step-70-wave1-final-evidence");

await loadEnv(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO credentials are required.");
}

const intents = [
  {
    key: "first-buyer",
    keyword: "sex doll buying guide",
    prompt: "I am buying my first adult sex doll in the US. What should I compare before choosing one, and which current sources are useful? Cite sources."
  },
  {
    key: "shop",
    keyword: "sex dolls",
    prompt: "Where can a US buyer compare sex dolls online, and what product facts and seller protections should be checked before ordering? Cite sources."
  },
  {
    key: "silicone",
    keyword: "silicone sex dolls",
    prompt: "How should a US buyer choose a silicone sex doll? Compare construction, weight, care, options, price factors, and seller proof. Cite sources."
  }
];

const pageIntersections = [
  {
    key: "guide",
    targets: {
      1: "https://sexyrealsexdolls.com/collections/the-ultimate-sex-doll-guide",
      2: "https://www.innerbody.com/best-sex-dolls",
      3: "https://siliconedoll.ca/blog/best-sex-doll-buyers-guide/"
    },
    exclude: ["https://dollwow.com/learn/sex-doll-guide"]
  },
  {
    key: "shop",
    targets: {
      1: "https://www.yourdoll.com/",
      2: "https://realsexdoll.com/newest-sex-dolls/",
      3: "https://www.joylovedolls.com/"
    },
    exclude: ["https://dollwow.com/shop/sex-dolls"]
  },
  {
    key: "silicone",
    targets: {
      1: "https://siliconelovers.com/collections/fanreal-silicone-dolls",
      2: "https://www.bestrealdoll.com/collections/silicone-dolls",
      3: "https://www.siliconwives.com/pages/how-to-use-a-sex-doll"
    },
    exclude: ["https://dollwow.com/shop/silicone"]
  }
];

const calls = [
  ...intents.map(({ key, keyword }) => call(`bing-serp-${key}`, "Bing SERP", "/serp/bing/organic/live/advanced", [{
    keyword,
    location_code: 2840,
    language_code: "en",
    device: "desktop",
    os: "windows",
    depth: 20,
    tag: `dollwow-wave1-bing-serp-${key}`
  }])),
  ...intents.map(({ key, keyword }) => call(`content-${key}`, "Content Analysis", "/content_analysis/search/live", [{
    keyword,
    limit: 30,
    order_by: ["content_info.date_published,desc"],
    tag: `dollwow-wave1-content-${key}`
  }])),
  ...intents.flatMap(({ key, prompt }) => [
    call(`claude-${key}`, "Claude", "/ai_optimization/claude/llm_responses/live", [{
      user_prompt: prompt,
      system_message: "Answer as a neutral US buyer researcher. Prefer current verifiable sources.",
      model_name: "claude-haiku-4-5",
      max_output_tokens: 1400,
      web_search: true,
      tag: `dollwow-wave1-claude-${key}`
    }]),
    call(`gemini-${key}`, "Gemini", "/ai_optimization/gemini/llm_responses/live", [{
      user_prompt: prompt,
      system_message: "Answer as a neutral US buyer researcher. Prefer current verifiable sources.",
      model_name: "gemini-2.5-flash-lite",
      max_output_tokens: 1400,
      web_search: true,
      tag: `dollwow-wave1-gemini-${key}`
    }])
  ]),
  ...pageIntersections.map(({ key, targets, exclude }) => call(`page-links-${key}`, "Backlinks", "/backlinks/page_intersection/live", [{
    targets,
    exclude_targets: exclude,
    intersection_mode: "all",
    limit: 100,
    order_by: ["1.rank,desc"],
    backlinks_status_type: "live",
    include_subdomains: true,
    exclude_internal_backlinks: true,
    rank_scale: "one_hundred",
    tag: `dollwow-wave1-page-links-${key}`
  }]))
];

const merchantCalls = [
  { id: "merchant-shop", keyword: "sex dolls" },
  { id: "merchant-silicone", keyword: "silicone sex dolls" }
];

const selectedCalls = retryBacklinks ? calls.filter((item) => item.api === "Backlinks") : calls;
const selectedMerchantCalls = retryBacklinks ? [] : merchantCalls;

await fs.mkdir(outputDir, { recursive: true });
const records = [];
for (const item of selectedCalls) {
  records.push(await executeCall(item));
}
for (const item of selectedMerchantCalls) {
  records.push(await executeMerchant(item));
}

const totalCost = records.reduce((sum, item) => sum + Number(item.cost || 0), 0);
const manifest = {
  generatedAt,
  execute,
  totalCost,
  requestCount: records.length,
  failedRequests: records.filter((item) => item.error).length,
  records
};
const manifestFile = retryBacklinks ? "request-manifest-backlinks-retry.json" : "request-manifest.json";
await fs.writeFile(path.join(outputDir, manifestFile), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({
  outputDir: path.relative(ROOT, outputDir),
  totalCost,
  requestCount: records.length,
  failedRequests: manifest.failedRequests,
  records: records.map(({ id, api, endpoint, cost, statusCode, statusMessage }) => ({ id, api, endpoint, cost, statusCode, statusMessage }))
}, null, 2));

async function executeCall(item) {
  const record = { ...item, executed: execute, taskId: null, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
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
  return record;
}

async function executeMerchant(item) {
  const endpoint = "/merchant/google/products/task_post";
  const record = { ...item, api: "Merchant", endpoint, executed: execute, taskId: null, cost: 0, statusCode: null, statusMessage: execute ? null : "Dry run" };
  if (!execute) return record;
  try {
    const posted = await post(endpoint, [{
      keyword: item.keyword,
      location_code: 2840,
      language_code: "en",
      depth: 40,
      priority: 2,
      tag: `dollwow-wave1-${item.id}`
    }]);
    const task = posted.tasks?.[0] || {};
    record.taskId = task.id || null;
    record.cost = Number(task.cost || 0);
    record.statusCode = task.status_code || posted.status_code || null;
    record.statusMessage = task.status_message || posted.status_message || null;
    await fs.writeFile(path.join(outputDir, `${item.id}-post.json`), `${JSON.stringify(posted, null, 2)}\n`);
    if (record.taskId) {
      const result = await pollMerchant(record.taskId);
      await fs.writeFile(path.join(outputDir, `${item.id}.json`), `${JSON.stringify(result, null, 2)}\n`);
    }
  } catch (error) {
    record.error = true;
    record.statusMessage = error instanceof Error ? error.message : String(error);
  }
  return record;
}

async function pollMerchant(taskId) {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await fetch(`${API_BASE}/merchant/google/products/task_get/advanced/${taskId}`, { headers: authHeaders() });
    const body = await response.json();
    const task = body.tasks?.[0] || {};
    if (Number(task.status_code || 0) === 20000 && task.result?.length) return body;
    if (Number(task.status_code || 0) >= 40000) throw new Error(task.status_message || body.status_message);
  }
  throw new Error(`Merchant result ${taskId} was not ready after 90 seconds.`);
}

function call(id, api, endpoint, payload) {
  return { id, api, endpoint, payload };
}

async function post(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  const failed = body.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
  if (!response.ok || Number(body.status_code || 0) >= 40000 || failed) {
    throw new Error(failed?.status_message || body.status_message || `HTTP ${response.status}`);
  }
  return body;
}

function authHeaders() {
  return {
    Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
    "Content-Type": "application/json"
  };
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
