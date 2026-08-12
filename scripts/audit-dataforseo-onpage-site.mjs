import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const args = parseArgs(process.argv.slice(2));

await loadLocalEnv();

const execute = Boolean(args.execute || args.taskId);
const target = String(args.target || "dollwow.com").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
const maxCrawlPages = Number(args.maxPages || 3500);
const outputDir = path.resolve(ROOT, args.outDir || "data/exports/seo-intelligence/2026-08-12/step-49-onpage-site");
const reportPath = path.resolve(ROOT, args.report || "docs/seo-intelligence/2026-08-12-step-49-onpage-site.md");
const priorityUrls = [
  "https://dollwow.com/",
  "https://dollwow.com/shop/sex-dolls",
  "https://dollwow.com/shop/silicone",
  "https://dollwow.com/shop/tpe",
  "https://dollwow.com/shop/male-dolls",
  "https://dollwow.com/shop/mini-sex-dolls",
  "https://dollwow.com/shop/ready-to-ship",
  "https://dollwow.com/warehouse",
  "https://dollwow.com/brands",
  "https://dollwow.com/learn",
  "https://dollwow.com/learn/sex-doll-guide",
  "https://dollwow.com/learn/best-sex-dolls",
  "https://dollwow.com/learn/sex-doll-cost",
  "https://dollwow.com/learn/tpe-vs-silicone-sex-dolls",
  "https://dollwow.com/care-for-life",
  "https://dollwow.com/buyer-protection",
  "https://dollwow.com/shipping",
  "https://dollwow.com/how-ordering-works"
];

const request = {
  target,
  start_url: `https://${target}/`,
  max_crawl_pages: maxCrawlPages,
  max_crawl_depth: 20,
  respect_sitemap: true,
  force_sitewide_checks: true,
  load_resources: false,
  enable_javascript: false,
  enable_browser_rendering: false,
  calculate_keyword_density: false,
  priority_urls: priorityUrls,
  tag: `dollwow-sitewide-${new Date().toISOString().slice(0, 10)}`
};

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", endpoint: "/on_page/task_post", estimatedMaximumBasicCost: maxCrawlPages * 0.00015, request }, null, 2));
  process.exit(0);
}

const posted = args.taskId ? null : await apiPost("/on_page/task_post", [request]);
const taskId = args.taskId || posted?.tasks?.[0]?.id;
if (!taskId) throw new Error(posted?.tasks?.[0]?.status_message || "DataForSEO did not return an OnPage task ID.");
const postedCost = Number(posted?.tasks?.[0]?.cost || args.postedCost || 0);

console.log(JSON.stringify({ taskId, postedCost, maxCrawlPages }, null, 2));

const summaryPayload = await waitForSummary(taskId);
const summary = summaryPayload.tasks?.[0]?.result?.[0];
if (!summary) throw new Error("OnPage task completed without a summary result.");

const pages = await fetchAllPages(taskId);
const errorsPayload = await safePost("/on_page/errors", [{ id: taskId, limit: 1000 }]);
const nonIndexablePayload = await safePost("/on_page/non_indexable", [{ id: taskId, limit: 1000 }]);
const audit = buildAudit({ taskId, request, postedCost, summary, pages, errorsPayload, nonIndexablePayload });

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await Promise.all([
  fs.writeFile(path.join(outputDir, "request.json"), `${JSON.stringify(request, null, 2)}\n`, "utf8"),
  fs.writeFile(path.join(outputDir, "summary.json"), `${JSON.stringify(summaryPayload, null, 2)}\n`, "utf8"),
  fs.writeFile(path.join(outputDir, "pages.json"), `${JSON.stringify(pages, null, 2)}\n`, "utf8"),
  fs.writeFile(path.join(outputDir, "errors.json"), `${JSON.stringify(errorsPayload, null, 2)}\n`, "utf8"),
  fs.writeFile(path.join(outputDir, "non-indexable.json"), `${JSON.stringify(nonIndexablePayload, null, 2)}\n`, "utf8"),
  fs.writeFile(path.join(outputDir, "audit.json"), `${JSON.stringify(audit, null, 2)}\n`, "utf8"),
  fs.writeFile(reportPath, renderMarkdown(audit), "utf8")
]);

console.log(JSON.stringify({
  taskId,
  pagesCrawled: audit.pagesCrawled,
  pagesReturned: audit.pagesReturned,
  onpageScore: audit.onpageScore,
  trueCheckCounts: audit.trueCheckCounts.slice(0, 20),
  report: path.relative(ROOT, reportPath)
}, null, 2));

async function waitForSummary(id) {
  const maxAttempts = Number(args.pollAttempts || 500);
  const pollMs = Number(args.pollMs || 15000);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const payload = await apiGet(`/on_page/summary/${id}`);
    const task = payload.tasks?.[0];
    if (Number(task?.status_code || 0) >= 40000 && !/queue|handed|progress/i.test(String(task?.status_message || ""))) {
      throw new Error(task?.status_message || `OnPage summary failed with ${task?.status_code}.`);
    }
    const result = task?.result?.[0];
    const progress = String(result?.crawl_progress || "").toLowerCase();
    const crawled = Number(result?.crawl_status?.pages_crawled ?? result?.pages_crawled ?? 0);
    const queued = Number(result?.crawl_status?.pages_in_queue ?? result?.pages_in_queue ?? 0);
    console.log(`OnPage poll ${attempt}: ${progress || task?.status_message || "pending"}; crawled ${crawled}; queued ${queued}.`);
    if (result && (progress === "finished" || progress === "completed" || (crawled > 0 && queued === 0))) return payload;
    await sleep(pollMs);
  }
  throw new Error(`OnPage task ${id} did not finish within the polling window. Resume with --task-id ${id}.`);
}

async function fetchAllPages(id) {
  const items = [];
  let offset = 0;
  while (true) {
    const payload = await apiPost("/on_page/pages", [{ id, limit: 1000, offset, order_by: ["url,asc"] }]);
    const result = payload.tasks?.[0]?.result?.[0];
    const batch = result?.items || [];
    items.push(...batch);
    const total = Number(result?.total_items_count || items.length);
    if (!batch.length || items.length >= total) break;
    offset += batch.length;
  }
  return items;
}

function buildAudit({ taskId: id, request: taskRequest, postedCost: taskPostedCost, summary: taskSummary, pages: pageItems, errorsPayload: errors, nonIndexablePayload: nonIndexable }) {
  const trueChecks = new Map();
  for (const page of pageItems) {
    for (const [key, value] of Object.entries(page.checks || {})) {
      if (value === true) trueChecks.set(key, (trueChecks.get(key) || 0) + 1);
    }
  }
  const trueCheckCounts = [...trueChecks.entries()].map(([check, count]) => ({ check, count })).sort((a, b) => b.count - a.count || a.check.localeCompare(b.check));
  const criticalChecks = new Set([
    "is_4xx_code",
    "is_5xx_code",
    "is_broken",
    "is_http",
    "is_redirect",
    "redirect_chain",
    "canonical_chain",
    "canonical_to_redirect",
    "canonical_to_broken",
    "recursive_canonical",
    "has_links_to_redirects",
    "no_title",
    "no_description",
    "no_h1_tag",
    "duplicate_title_tag",
    "duplicate_meta_tags",
    "is_link_relation_conflict",
    "not_indexable"
  ]);
  const pagesWithCriticalChecks = pageItems
    .map((page) => ({
      url: page.url,
      statusCode: page.status_code,
      title: page.meta?.title || "",
      description: page.meta?.description || "",
      canonical: page.meta?.canonical || "",
      checks: Object.entries(page.checks || {}).filter(([, value]) => value === true).map(([key]) => key)
    }))
    .filter((page) => page.statusCode >= 400 || page.checks.some((check) => criticalChecks.has(check)));
  return {
    generatedAt: new Date().toISOString(),
    taskId: id,
    request: taskRequest,
    postedCost: taskPostedCost,
    pagesCrawled: Number(taskSummary.crawl_status?.pages_crawled ?? taskSummary.pages_crawled ?? 0),
    pagesInQueue: Number(taskSummary.crawl_status?.pages_in_queue ?? taskSummary.pages_in_queue ?? 0),
    onpageScore: Number(taskSummary.page_metrics?.onpage_score ?? taskSummary.onpage_score ?? 0),
    pagesReturned: pageItems.length,
    summaryChecks: taskSummary.checks || {},
    trueCheckCounts,
    pagesWithCriticalChecks,
    errors: errors?.tasks?.[0]?.result?.[0] || null,
    nonIndexable: nonIndexable?.tasks?.[0]?.result?.[0] || null
  };
}

function renderMarkdown(audit) {
  const issueRows = audit.trueCheckCounts.length
    ? audit.trueCheckCounts.slice(0, 40).map((item) => `| ${item.check} | ${item.count} |`).join("\n")
    : "| None reported | 0 |";
  const pageRows = audit.pagesWithCriticalChecks.length
    ? audit.pagesWithCriticalChecks.slice(0, 100).map((page) => `| ${page.statusCode || ""} | ${page.url} | ${page.checks.join(", ")} |`).join("\n")
    : "|  | None reported |  |";
  return `# DollWow Sitewide OnPage Audit\n\nGenerated: ${audit.generatedAt}\n\n- DataForSEO task: \`${audit.taskId}\`\n- Pages crawled: ${audit.pagesCrawled}\n- Pages returned: ${audit.pagesReturned}\n- OnPage score: ${audit.onpageScore}\n- Posted cost: $${audit.postedCost.toFixed(4)}\n- Crawl mode: basic HTML and internal-link analysis, sitemap respected, no JavaScript or resource-loading premium\n\n## Reported Page Checks\n\n| Check | Pages |\n| --- | ---: |\n${issueRows}\n\n## Pages Requiring Review\n\n| Status | URL | Checks |\n| ---: | --- | --- |\n${pageRows}\n\n## Decision Rule\n\nFix issues that affect indexability, canonicals, status codes, broken internal destinations, duplicate metadata, missing metadata, or important crawl paths. Treat cosmetic thresholds as diagnostics rather than automatic rewrite instructions. Re-run focused Instant Pages checks after material fixes instead of purchasing another full crawl immediately.\n`;
}

async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
  const payload = await response.json();
  if (!response.ok || Number(payload.status_code || 0) >= 40000) throw new Error(payload.status_message || `DataForSEO GET ${endpoint} failed with HTTP ${response.status}.`);
  return payload;
}

async function apiPost(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok || Number(payload.status_code || 0) >= 40000) throw new Error(payload.status_message || `DataForSEO POST ${endpoint} failed with HTTP ${response.status}.`);
  const taskError = payload.tasks?.find((task) => Number(task.status_code || 0) >= 40000);
  if (taskError) throw new Error(taskError.status_message || `DataForSEO task failed at ${endpoint}.`);
  return payload;
}

async function safePost(endpoint, body) {
  try {
    return await apiPost(endpoint, body);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function authHeaders() {
  const login = requireEnv("DATAFORSEO_LOGIN");
  const password = requireEnv("DATAFORSEO_PASSWORD");
  return { Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}` };
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (key === "execute") parsed[key] = true;
    else parsed[key] = values[index + 1];
  }
  return parsed;
}

async function loadLocalEnv() {
  const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] ||= value;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
