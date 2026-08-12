import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const baseUrl = String(args.base || "https://dollwow.com").replace(/\/$/, "");
const sitemapUrl = `${baseUrl}/sitemap.xml`;
const outputPath = path.resolve(ROOT, args.output || "data/exports/learning-center-link-audit.json");
const reportPath = path.resolve(ROOT, args.report || "docs/seo-intelligence/learning-center-link-audit.md");
const concurrency = Math.max(1, Math.min(Number(args.concurrency || 12), 24));

const sitemapResponse = await fetch(sitemapUrl, { headers: requestHeaders() });
if (!sitemapResponse.ok) throw new Error(`Could not load ${sitemapUrl}: HTTP ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const publicArticleSlugs = new Set(
  Array.from(sitemap.matchAll(/<loc>https?:\/\/[^<]+\/learn\/([^<\/]+)<\/loc>/g), (match) => decodeURIComponent(match[1]))
);

const draftDirectory = path.join(ROOT, "content", "learn", "drafts");
const files = (await fs.readdir(draftDirectory)).filter((file) => file.endsWith(".md")).sort();
const references = [];

for (const file of files) {
  const source = await fs.readFile(path.join(draftDirectory, file), "utf8");
  const slug = source.match(/^slug:\s*["']?([^"'\n]+)["']?$/m)?.[1]?.trim();
  if (!slug || !publicArticleSlugs.has(slug)) continue;

  for (const [index, line] of source.split("\n").entries()) {
    for (const match of line.matchAll(/\[[^\]]+\]\((\/[^)\s]+)\)/g)) {
      const href = match[1];
      const requestPath = href.split("#")[0].split("?")[0] || "/";
      references.push({ source: `/learn/${slug}`, file: `content/learn/drafts/${file}`, line: index + 1, href, requestPath });
    }
  }
}

const uniquePaths = [...new Set(references.map((reference) => reference.requestPath))].sort();
const checks = new Array(uniquePaths.length);
let nextIndex = 0;

await Promise.all(Array.from({ length: Math.min(concurrency, uniquePaths.length) }, async () => {
  while (nextIndex < uniquePaths.length) {
    const index = nextIndex;
    nextIndex += 1;
    checks[index] = await checkPath(uniquePaths[index]);
  }
}));

const byPath = new Map(checks.map((check) => [check.path, check]));
const broken = checks.filter((check) => check.status >= 400 || check.status === 0);
const redirects = checks.filter((check) => check.status >= 300 && check.status < 400);
const payload = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  sitemapUrl,
  summary: {
    publicArticlesAudited: new Set(references.map((reference) => reference.source)).size,
    linkReferences: references.length,
    uniqueDestinations: checks.length,
    brokenDestinations: broken.length,
    redirectedDestinations: redirects.length
  },
  broken: addReferences(broken),
  redirects: addReferences(redirects),
  checks,
  references
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await fs.writeFile(reportPath, renderReport(payload), "utf8");
console.log(JSON.stringify({ ...payload.summary, output: path.relative(ROOT, outputPath), report: path.relative(ROOT, reportPath) }, null, 2));

async function checkPath(requestPath) {
  const url = `${baseUrl}${requestPath}`;
  try {
    const response = await fetch(url, { redirect: "manual", headers: requestHeaders() });
    const location = response.headers.get("location");
    return {
      path: requestPath,
      url,
      status: response.status,
      location: location ? new URL(location, url).href : null
    };
  } catch (error) {
    return { path: requestPath, url, status: 0, location: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function addReferences(items) {
  return items.map((item) => ({
    ...item,
    references: references
      .filter((reference) => reference.requestPath === item.path)
      .map(({ source, file, line, href }) => ({ source, file, line, href }))
  }));
}

function renderReport(payload) {
  const lines = [
    "# DollWow Learning Center Link Audit",
    "",
    `Generated: ${payload.generatedAt}`,
    `Production site: ${payload.baseUrl}`,
    "",
    "## Summary",
    "",
    `- Public articles audited: ${payload.summary.publicArticlesAudited}`,
    `- Internal link references: ${payload.summary.linkReferences}`,
    `- Unique internal destinations: ${payload.summary.uniqueDestinations}`,
    `- Broken destinations: ${payload.summary.brokenDestinations}`,
    `- Redirected destinations: ${payload.summary.redirectedDestinations}`,
    ""
  ];

  lines.push("## Broken Destinations", "");
  if (!payload.broken.length) lines.push("None.", "");
  for (const item of payload.broken) {
    lines.push(`### \`${item.path}\``, "", `- HTTP status: ${item.status || "request failed"}`);
    for (const reference of item.references) lines.push(`- ${reference.file}:${reference.line} from \`${reference.source}\``);
    lines.push("");
  }

  lines.push("## Redirected Destinations", "");
  if (!payload.redirects.length) lines.push("None.", "");
  for (const item of payload.redirects) {
    lines.push(`### \`${item.path}\``, "", `- HTTP status: ${item.status}`, `- Destination: ${item.location || "not supplied"}`);
    for (const reference of item.references) lines.push(`- ${reference.file}:${reference.line} from \`${reference.source}\``);
    lines.push("");
  }

  lines.push("## Operating Rule", "", "Use direct canonical links in published articles. A deliberate site redirect may remain for visitors, but Learning Center copy should not depend on it.", "");
  return lines.join("\n");
}

function requestHeaders() {
  return { "User-Agent": "DollWow Learning Center link audit/1.0" };
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    parsed[value.slice(2)] = values[index + 1];
    index += 1;
  }
  return parsed;
}
