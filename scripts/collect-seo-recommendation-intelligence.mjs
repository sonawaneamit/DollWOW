import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const args = parseArgs(process.argv.slice(2));
const execute = Boolean(args.execute);
const topic = args.topic || "best sex doll stores";
const slug = args.slug || "store-selection";
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, `recommendation-${slug}`)
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-recommendation-${slug}.md`)
);

await loadEnvFile(path.join(ROOT, ".env.local"));
if (execute && (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)) {
  throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for --execute.");
}

const prompt = args.prompt || `I am a US shopper comparing where to buy a full-size adult sex doll online. Which stores or source types should I consider, what warning signs should I avoid, and what proof should I verify before paying? Name examples only when supportable and cite current web sources.`;
const systemMessage = args.systemMessage || "Answer as a neutral US consumer researcher. Prioritize verifiable buying criteria and current sources.";
const calls = [
  {
    id: "chatgpt-live-response",
    api: "AI Optimization",
    endpoint: "/ai_optimization/chat_gpt/llm_responses/live",
    payload: [{
      user_prompt: prompt,
      system_message: systemMessage,
      model_name: "gpt-5.4-nano",
      max_output_tokens: 1400,
      web_search: true,
      web_search_country_iso_code: "US",
      tag: `dollwow-${slug}-chatgpt`
    }]
  },
  {
    id: "claude-live-response",
    api: "AI Optimization",
    endpoint: "/ai_optimization/claude/llm_responses/live",
    payload: [{
      user_prompt: prompt,
      system_message: systemMessage,
      model_name: "claude-haiku-4-5",
      max_output_tokens: 1400,
      web_search: true,
      tag: `dollwow-${slug}-claude`
    }]
  },
  {
    id: "gemini-live-response",
    api: "AI Optimization",
    endpoint: "/ai_optimization/gemini/llm_responses/live",
    payload: [{
      user_prompt: prompt,
      system_message: systemMessage,
      model_name: "gemini-2.5-flash-lite",
      max_output_tokens: 1400,
      web_search: true,
      tag: `dollwow-${slug}-gemini`
    }]
  },
  {
    id: "content-search",
    api: "Content Analysis",
    endpoint: "/content_analysis/search/live",
    payload: [{
      keyword: topic,
      limit: 20,
      order_by: ["content_info.date_published,desc"],
      tag: `dollwow-${slug}-content-search`
    }]
  }
];

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const records = [];
for (const call of calls) {
  const record = {
    ...call,
    executed: execute,
    cost: 0,
    taskId: null,
    statusCode: null,
    statusMessage: execute ? null : "Dry run",
    responseFile: `${call.id}.json`
  };
  if (execute) {
    try {
      const response = await callDataForSeo(call.endpoint, call.payload);
      const task = response.tasks?.[0] || {};
      record.cost = Number(task.cost || 0);
      record.taskId = task.id || null;
      record.statusCode = task.status_code || response.status_code || null;
      record.statusMessage = task.status_message || response.status_message || null;
      await fs.writeFile(path.join(outputDir, record.responseFile), JSON.stringify(response, null, 2), "utf8");
    } catch (error) {
      record.error = true;
      record.statusMessage = error.message;
    }
  }
  records.push(record);
}

const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
await fs.writeFile(path.join(outputDir, "request-manifest.json"), JSON.stringify({ generatedAt, topic, prompt, totalCost, records }, null, 2), "utf8");
await fs.writeFile(reportPath, renderReport(records, totalCost), "utf8");

console.log(`${execute ? "Completed" : "Prepared"} recommendation intelligence for ${topic}.`);
console.log(`Requests: ${records.length}; failures: ${records.filter((record) => record.error).length}`);
console.log(`Recorded cost: $${totalCost.toFixed(4)}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

async function callDataForSeo(endpoint, payload) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  const task = body.tasks?.[0];
  if (!response.ok || Number(body.status_code || 0) >= 40000 || Number(task?.status_code || 0) >= 40000) {
    throw new Error(task?.status_message || body.status_message || `DataForSEO HTTP ${response.status}`);
  }
  return body;
}

function renderReport(records, totalCost) {
  const rows = records.map((record) => `| ${record.api} | \`${record.endpoint}\` | $${record.cost.toFixed(4)} | ${record.statusMessage || ""} |`).join("\n");
  return `# Recommendation Intelligence: ${topic}\n\nGenerated: ${generatedAt}\n\n## Decision\n\nBenchmark how current answer engines and indexed content frame this recommendation question before writing. Raw responses are cached locally; only findings that can improve buyer usefulness, source quality, or answer structure should change the public page.\n\n## Run Summary\n\n- Mode: ${execute ? "execute" : "dry-run"}\n- Requests: ${records.length}\n- Failed requests: ${records.filter((record) => record.error).length}\n- Recorded cost: $${totalCost.toFixed(4)}\n\n| API | Endpoint | Cost | Status |\n| --- | --- | ---: | --- |\n${rows}\n\n## Prompt\n\n${prompt}\n\n## Usage Rule\n\nTreat model responses as competitive research, not factual authority. Verify material claims against DollWow policies, current catalog data, manufacturer documentation, and primary sources before publication.\n`;
}

async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equals = trimmed.indexOf("=");
      if (equals < 1) continue;
      const key = trimmed.slice(0, equals).trim();
      const value = trimmed.slice(equals + 1).trim().replace(/^['\"]|['\"]$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = values[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}
