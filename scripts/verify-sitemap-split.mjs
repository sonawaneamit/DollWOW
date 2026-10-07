import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parse } from "node-html-parser";

const base = process.argv[2];
if (!base) throw new Error("Usage: node scripts/verify-sitemap-split.mjs <preview-origin> [--crawl]");
const output = path.resolve("data/exports/sitemap-split");
await fs.mkdir(output, { recursive: true });
const report = { checkedAt: new Date().toISOString(), base, files: [], failures: [], pages: [] };
async function get(url) {
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(45000) });
  const body = await response.text();
  return { status: response.status, type: response.headers.get("content-type"), robots: response.headers.get("x-robots-tag"), body };
}
function locs(body) { return parse(body).querySelectorAll("loc").map((node) => node.textContent); }
function checkXml(body, label) {
  const result = spawnSync("xmllint", ["--noout", "-"], { input: body, encoding: "utf8" });
  if (result.status !== 0) report.failures.push(`${label}: invalid XML: ${result.stderr}`);
}
const baseline = await get("https://dollwow.com/sitemap.xml");
if (baseline.status !== 200 || !baseline.body.includes("<urlset")) throw new Error("Expected pre-release flat production sitemap");
await fs.writeFile(path.join(output, "production-before.xml"), baseline.body);
const index = await get(`${base}/sitemap.xml`);
if (index.status !== 200 || !index.body.includes("<sitemapindex")) throw new Error(`Preview index failed: ${index.status}`);
checkXml(index.body, "index");
await fs.writeFile(path.join(output, "index.xml"), index.body);
const urls = [];
for (const canonicalFile of locs(index.body)) {
  if (!canonicalFile.startsWith("https://dollwow.com/")) report.failures.push(`Wrong index host: ${canonicalFile}`);
  const filePath = new URL(canonicalFile).pathname;
  const file = await get(`${base}${filePath}`);
  checkXml(file.body, filePath);
  const entries = locs(file.body);
  const image = filePath === "/sitemap-images.xml";
  if (file.status !== 200 || !file.type?.includes("application/xml")) report.failures.push(`Bad response: ${filePath}`);
  if (entries.length > 50000 || Buffer.byteLength(file.body) > 50 * 1024 * 1024) report.failures.push(`Too large: ${filePath}`);
  if (entries.some((url) => !url.startsWith("https://dollwow.com/"))) report.failures.push(`Wrong child host: ${filePath}`);
  if (!image) urls.push(...entries);
  report.files.push({ path: filePath, status: file.status, entries: entries.length, bytes: Buffer.byteLength(file.body) });
  await fs.writeFile(path.join(output, path.basename(filePath)), file.body);
}
const previous = new Set(locs(baseline.body));
const current = new Set(urls);
report.removed = [...previous].filter((url) => !current.has(url));
report.added = [...current].filter((url) => !previous.has(url));
report.duplicates = urls.length - current.size;
if (report.duplicates) report.failures.push("Duplicate ordinary sitemap URLs");
if (report.removed.length || report.added.length) report.failures.push("URL set changed; reconcile catalog changes");
for (const file of ["unknown.xml", "products-not-a-brand.xml"]) {
  if ((await get(`${base}/sitemaps/${file}`)).status !== 404) report.failures.push(`Expected 404: ${file}`);
}
const robots = await get(`${base}/robots.txt`);
for (const url of ["https://dollwow.com/sitemap.xml", "https://dollwow.com/sitemap-images.xml"]) {
  if (!robots.body.includes(`Sitemap: ${url}`)) report.failures.push(`Missing robots entry: ${url}`);
}
if (process.argv.includes("--crawl")) {
  const queue = [...current];
  let next = 0;
  async function worker() {
    while (next < queue.length) {
      const url = queue[next++];
      try {
        const page = await get(url);
        const isHtml = page.type?.includes("text/html");
        const dom = isHtml ? parse(page.body) : null;
        const canonical = dom?.querySelector('link[rel="canonical"]')?.getAttribute("href");
        const directives = [page.robots, ...(dom?.querySelectorAll("meta") ?? []).filter((el) => /^(robots|googlebot)$/i.test(el.getAttribute("name") ?? "")).map((el) => el.getAttribute("content"))].filter(Boolean).join(" ");
        const issues = [];
        if (page.status !== 200) issues.push(`status:${page.status}`);
        if (isHtml && canonical?.replace(/\/$/, "") !== url.replace(/\/$/, "")) issues.push("canonical");
        if (/noindex/i.test(directives)) issues.push("noindex");
        report.pages.push({ url, status: page.status, canonical, isHtml, issues });
      } catch (error) { report.pages.push({ url, issues: [String(error)] }); }
      if (report.pages.length % 250 === 0) console.log(`Checked ${report.pages.length}/${queue.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
}
report.pageIssues = report.pages.filter((page) => page.issues.length);
await fs.writeFile(path.join(output, "verification.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ files: report.files, totalUrls: current.size, added: report.added, removed: report.removed, failures: report.failures, crawled: report.pages.length, pageIssueCount: report.pageIssues.length }, null, 2));
process.exitCode = report.failures.length ? 1 : 0;
