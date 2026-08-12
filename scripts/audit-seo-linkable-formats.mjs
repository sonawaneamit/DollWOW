import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = "https://api.dataforseo.com/v3";
const TARGETS = [
  "dollwow.com",
  "yourdoll.com",
  "rosemarydoll.com",
  "siliconwives.com",
  "joylovedolls.com",
  "bestrealdoll.com",
  "betterlovedoll.com",
  "sexdolltech.com",
  "myrobotdoll.com",
  "sexdollqueen.com"
];
const args = parseArgs(process.argv.slice(2));
await loadEnv();

const execute = Boolean(args.execute);
const domains = args.domains ? String(args.domains).split(",").map((value) => value.trim()).filter(Boolean) : TARGETS;
const date = new Date().toISOString().slice(0, 10);
const outputDir = path.resolve(ROOT, args.outDir || `data/exports/seo-intelligence/${date}/step-51-linkable-formats`);
const reportPath = path.resolve(ROOT, args.report || `docs/seo-intelligence/${date}-step-51-linkable-formats.md`);
const calls = domains.flatMap((domain) => [
  {
    domain,
    kind: "summary",
    endpoint: "/backlinks/summary/live",
    payload: [{ target: domain, include_subdomains: true, exclude_internal_backlinks: true, tag: `dollwow-linkable-${domain}-summary` }]
  },
  {
    domain,
    kind: "pages",
    endpoint: "/backlinks/domain_pages/live",
    payload: [{
      target: domain,
      limit: 100,
      order_by: ["page_summary.referring_domains,desc", "page_summary.backlinks,desc"],
      include_subdomains: true,
      exclude_internal_backlinks: true,
      tag: `dollwow-linkable-${domain}-pages`
    }]
  }
]);

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", domains, requests: calls.length, calls }, null, 2));
  process.exit(0);
}

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });
const records = [];
for (const call of calls) {
  const response = await apiPost(call.endpoint, call.payload);
  const task = response.tasks?.[0] || {};
  const record = { ...call, cost: Number(task.cost || 0), status: task.status_message, responseFile: `${call.domain}-${call.kind}.json` };
  records.push(record);
  await fs.writeFile(path.join(outputDir, record.responseFile), `${JSON.stringify(response, null, 2)}\n`, "utf8");
}

const audit = buildAudit(records, outputDir);
await fs.writeFile(path.join(outputDir, "audit.json"), `${JSON.stringify(audit, null, 2)}\n`, "utf8");
await fs.writeFile(reportPath, renderReport(audit), "utf8");
console.log(JSON.stringify({ domains: domains.length, requests: records.length, cost: audit.totalCost, report: path.relative(ROOT, reportPath) }, null, 2));

function buildAudit(records, dir) {
  return {
    generatedAt: new Date().toISOString(),
    totalCost: records.reduce((sum, record) => sum + record.cost, 0),
    domains: records.filter((record) => record.kind === "summary").map((record) => ({
      domain: record.domain,
      summaryFile: path.relative(ROOT, path.join(dir, record.responseFile)),
      pagesFile: path.relative(ROOT, path.join(dir, `${record.domain}-pages.json`))
    }))
  };
}

function renderReport(audit) {
  const rows = audit.domains.map((item) => `| ${item.domain} | \`${item.summaryFile}\` | \`${item.pagesFile}\` |`).join("\n");
  return `# Competitor Linkable-Format Audit\n\nGenerated: ${audit.generatedAt}\n\n- Domains: ${audit.domains.length}\n- Requests: ${audit.domains.length * 2}\n- Recorded cost: $${audit.totalCost.toFixed(4)}\n\n## Purpose\n\nIdentify the competitor page formats that earn referring domains so DollWow can prioritize genuinely useful, citeable assets. This is content intelligence, not an instruction to copy pages or begin outreach.\n\n## Raw Evidence\n\n| Domain | Summary | Most-linked pages |\n| --- | --- | --- |\n${rows}\n\n## Review Gate\n\nClassify the leading pages as home, collection, product, guide, research, tool, policy, campaign, community, or noise. Discount sitewide links, scraper links, coupon spam, and unrelated historical URLs. Add only formats that improve the existing canonical content map.\n`;
}

async function apiPost(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  const task = payload.tasks?.[0];
  if (!response.ok || Number(payload.status_code || 0) >= 40000 || Number(task?.status_code || 0) >= 40000) throw new Error(task?.status_message || payload.status_message || `DataForSEO HTTP ${response.status}`);
  return payload;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = values[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else { parsed[key] = next; index += 1; }
  }
  return parsed;
}

async function loadEnv() {
  const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const split = trimmed.indexOf("=");
    if (split < 1) continue;
    const key = trimmed.slice(0, split).trim();
    const value = trimmed.slice(split + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ||= value;
  }
}
