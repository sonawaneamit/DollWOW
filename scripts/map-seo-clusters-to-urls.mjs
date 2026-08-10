import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const step7Dir = path.resolve(ROOT, args.step7Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-07-opportunity-scoring"));
const outputDir = path.resolve(ROOT, args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-08-url-map"));
const reportPath = path.resolve(ROOT, args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-08-url-map.md`));
const sitemapUrl = args.sitemap || "https://dollwow.com/sitemap.xml";

function urlDecision(cluster) {
  if (cluster.productionGate === "no-action" || cluster.priorityTier === "No action") {
    return baseDecision(null, "no-action", "none", "Exclude and preserve in the decision log.");
  }
  if (cluster.productionGate !== "eligible") {
    return baseDecision(null, "hold", pageRole(cluster.winningPageType), `Do not create a URL until ${cluster.productionGate} is resolved.`);
  }

  const keyword = normalize(cluster.primaryKeyword);
  const explicit = EXPLICIT_PATHS[keyword];
  const canonicalPath = explicit || inferredPath(cluster);
  const role = pageRole(cluster.winningPageType);
  return baseDecision(canonicalPath, liveUrls.has(canonicalPath) ? "existing" : "proposed", role, rationale(cluster, canonicalPath));
}

function inferredPath(cluster) {
  const keyword = normalize(cluster.primaryKeyword);
  if (cluster.winningPageType === "brand-hub") return `/brands/${slugify(keyword.replace(/\bdolls?\b/g, "").trim())}-dolls`;
  if (cluster.winningPageType === "brand-directory") return "/brands";
  if (cluster.winningPageType === "collection") return `/shop/${slugify(keyword)}`;
  return `/learn/${slugify(keyword)}`;
}

const EXPLICIT_PATHS = {
  "sex dolls": "/shop/sex-dolls",
  "adult dolls": "/shop/sex-dolls",
  "love dolls for sale": "/shop/sex-dolls",
  "companion dolls": "/shop/sex-dolls",
  "companion doll life size": "/shop/sex-dolls",
  "silicone sex dolls": "/shop/silicone",
  "life size silicone doll": "/shop/silicone",
  "silicone doll woman": "/shop/silicone",
  "full size silicone doll": "/shop/silicone",
  "silicone companion doll": "/shop/silicone",
  "full silicone dolls for sale": "/shop/silicone",
  "silicone doll factory": "/shop/silicone",
  "human silicone doll": "/shop/silicone",
  "tpe doll": "/shop/tpe",
  "mini sex dolls": "/shop/mini-sex-dolls",
  "sex doll cheap": "/shop/cheap-sex-dolls",
  "torso sex dolls": "/shop/torsos",
  "most realistic sex dolls": "/shop/realistic-sex-dolls",
  "silicone dolls that look real": "/shop/realistic-sex-dolls",
  "realistic silicone dolls for sale": "/shop/realistic-sex-dolls",
  "life size silicone dolls for sale": "/shop/realistic-sex-dolls",
  "sex doll girlfriend": "/shop/realistic-sex-dolls",
  "custom sex dolls": "/shop/custom",
  "male sex doll": "/shop/male-dolls",
  "petite sex doll": "/shop/petite-dolls",
  "small love doll": "/shop/petite-dolls",
  "asian sex dolls": "/shop/asian-dolls",
  "black sex dolls": "/shop/black-dolls",
  "lightweight sex dolls": "/shop/lightweight-sex-dolls",
  "new sex doll": "/shop/new-sex-dolls",
  "in stock sex dolls": "/shop/ready-to-ship",
  "ready to ship sex dolls": "/shop/ready-to-ship",
  "fast shipping sex dolls": "/shop/ready-to-ship",
  "us warehouse sex dolls": "/warehouse",
  "anime love doll": "/shop/anime-dolls",
  "plump sex doll": "/shop/fuller-dolls",
  "slim sex doll": "/shop/slim-dolls",

  "irontech": "/brands/irontech-dolls",
  "irontech doll": "/brands/irontech-dolls",
  "irontech tpe dolls": "/brands/irontech-dolls",
  "starpery": "/brands/starpery-dolls",
  "tantaly": "/brands/tantaly-dolls",
  "wm dolls": "/brands/wm-dolls",
  "wm sex doll": "/brands/wm-dolls",
  "wm tpe dolls": "/brands/wm-dolls",
  "wm silicone dolls": "/brands/wm-dolls",
  "se doll": "/brands/se-doll",
  "erovenus": "/brands/erovenus-dolls",
  "climax doll": "/brands/climax-dolls",
  "6ye dolls": "/brands/6ye-dolls",
  "dolls castle": "/brands/dolls-castle",
  "real lady": "/brands/real-lady-dolls",
  "sex dolls brands": "/brands",

  "best sex dolls": "/learn/best-sex-dolls",
  "sex doll review": "/learn/sex-doll-reviews",
  "best sex doll reviews": "/learn/sex-doll-reviews",
  "tpe vs silicone sex dolls": "/learn/tpe-vs-silicone-sex-dolls",
  "ready to ship vs custom sex dolls": "/learn/ready-to-ship-vs-custom-sex-dolls",
  "rosemary doll": "/learn/rosemarydoll-alternatives",
  "real doll": "/learn/realdoll-alternatives",
  "realbotix": "/learn/realbotix-alternatives",
  "sex doll stores": "/learn/best-sex-doll-stores",
  "best sex doll stores": "/learn/best-sex-doll-stores",
  "best tpe sex doll": "/learn/best-tpe-sex-dolls",
  "6ye dolls review": "/learn/6ye-dolls-buying-guide",
  "irontech dolls review": "/learn/irontech-dolls-buying-guide",
  "wm dolls review": "/learn/wm-dolls-buying-guide",
  "se doll review": "/learn/se-doll-buying-guide",
  "starpery dolls review": "/learn/starpery-dolls-buying-guide",
  "tantaly dolls review": "/learn/tantaly-dolls-buying-guide",
  "dolls castle review": "/learn/dolls-castle-buying-guide",
  "zelex dolls review": "/learn/zelex-dolls-review",
  "soft silicone dolls reviews": "/learn/silicone-sex-doll-guide",
  "sex doll storage": "/learn/sex-doll-storage",
  "how to clean sex doll": "/learn/how-to-clean-a-sex-doll",
  "sex doll care": "/learn/sex-doll-maintenance-checklist",
  "sex doll price": "/learn/sex-doll-cost",
  "how much is a silicone doll": "/learn/sex-doll-cost",
  "male sex doll buying guide": "/learn/male-sex-doll-buying-guide",
  "are sex dolls legal": "/learn/sex-doll-laws-us",
  "sex doll laws": "/learn/sex-doll-laws-us",
  "sex doll shipping": "/learn/discreet-sex-doll-shipping",
  "discreet sex doll shipping": "/learn/discreet-sex-doll-shipping",
  "sex doll delivery time": "/learn/discreet-sex-doll-shipping",
  "what is a love doll": "/learn/sex-doll-guide",
  "what is a silicone doll": "/learn/silicone-sex-doll-guide",
  "how to make a silicone doll": "/learn/how-silicone-sex-dolls-are-made",
  "silicone doll repair": "/learn/silicone-sex-doll-repair",
  "tpe doll glue": "/learn/tpe-sex-doll-repair",

  "sex robots": "/learn/sex-robots",
  "robotic sex dolls": "/learn/sex-robots",
  "sex robot for sale": "/learn/sex-robots",
  "sexbot": "/learn/ai-sex-dolls",
  "ai sexbot": "/learn/ai-sex-dolls",
  "artificial intelligence sexbot": "/learn/ai-sex-dolls",
  "ai dolls": "/learn/ai-sex-dolls",
  "ai sex dolls": "/learn/ai-sex-dolls",
  "ai love doll": "/learn/ai-companion-dolls",
  "ai companion doll": "/learn/ai-companion-dolls",
  "sexbots price": "/learn/sex-robot-cost",
  "gynoid": "/learn/what-is-a-gynoid",
  "real doll artificial intelligence": "/learn/realdoll-ai-and-robotics",
  "sexbot news": "/learn/sex-robot-news"
};

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const clusters = JSON.parse(await fs.readFile(path.join(step7Dir, "cluster-opportunity-matrix.json"), "utf8"));
const liveUrls = await fetchSitemapPaths(sitemapUrl);
const mapped = clusters.map((cluster) => ({ ...cluster, ...urlDecision(cluster) }));
const byTarget = groupBy(mapped.filter((row) => row.canonicalPath), (row) => row.canonicalPath);

for (const [canonicalPath, targetRows] of byTarget) {
  const eligible = targetRows.filter((row) => row.urlStatus !== "hold" && row.urlStatus !== "no-action").sort((a, b) => a.rank - b.rank);
  if (!eligible.length) continue;
  const owner = eligible[0];
  for (const row of eligible) {
    row.canonicalOwnerCluster = owner.primaryKeyword;
    row.mappingAction = row === owner
      ? liveUrls.has(canonicalPath) ? "expand-existing" : "create"
      : liveUrls.has(canonicalPath) ? "consolidate-into-existing" : "consolidate-into-proposed";
  }
}

const rows = mapped.sort((a, b) => a.rank - b.rank);
const proposedPages = unique(rows.filter((row) => row.mappingAction === "create").map((row) => row.canonicalPath));
const existingPages = unique(rows.filter((row) => row.mappingAction === "expand-existing").map((row) => row.canonicalPath));
const summary = {
  generatedAt,
  sitemapUrl,
  liveUrlCount: liveUrls.size,
  clusterCount: rows.length,
  mappedClusterCount: rows.filter((row) => row.canonicalPath || row.urlStatus === "no-action" || row.urlStatus === "hold").length,
  existingCanonicalPages: existingPages.length,
  proposedCanonicalPages: proposedPages.length,
  byAction: countBy(rows, "mappingAction"),
  byRole: countBy(rows, "pageRole"),
  completionGate: {
    status: validate(rows) ? "Passed" : "Failed",
    criteria: "Every cluster has one explicit canonical decision, every eligible target has one owner, and held or excluded clusters cannot create pages."
  }
};

await writeJson(path.join(outputDir, "cluster-url-map.json"), rows);
await fs.writeFile(path.join(outputDir, "cluster-url-map.csv"), toCsv(rows), "utf8");
await writeJson(path.join(outputDir, "canonical-page-backlog.json"), buildPageBacklog(rows));
await writeJson(path.join(outputDir, "step-08-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary, rows), "utf8");

console.log("Completed Step 8 canonical URL and cannibalization mapping.");
console.log(`Clusters mapped: ${summary.mappedClusterCount}/${summary.clusterCount}`);
console.log(`Existing canonical owners: ${summary.existingCanonicalPages}`);
console.log(`Proposed canonical pages: ${summary.proposedCanonicalPages}`);
console.log(`Completion gate: ${summary.completionGate.status}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function baseDecision(canonicalPath, urlStatus, role, mappingRationale) {
  return { canonicalPath, urlStatus, pageRole: role, mappingRationale, canonicalOwnerCluster: null, mappingAction: urlStatus };
}

function pageRole(pageType) {
  if (["collection", "brand-hub", "brand-directory", "product-or-model-page"].includes(pageType)) return "money-page";
  if (pageType === "no-action") return "none";
  return "supporting-content";
}

function rationale(cluster, canonicalPath) {
  return `${cluster.winningPageType} intent maps to ${canonicalPath}; related query variants share one canonical owner unless the SERP validation step proves a distinct intent.`;
}

function buildPageBacklog(rows) {
  const groups = groupBy(rows.filter((row) => row.canonicalPath && !["hold", "no-action"].includes(row.urlStatus)), (row) => row.canonicalPath);
  return [...groups.entries()].map(([canonicalPath, members]) => {
    const sorted = [...members].sort((a, b) => a.rank - b.rank);
    return {
      canonicalPath,
      live: liveUrls.has(canonicalPath),
      action: liveUrls.has(canonicalPath) ? "expand-existing" : "create",
      ownerCluster: sorted[0].primaryKeyword,
      priorityTier: bestTier(sorted.map((row) => row.priorityTier)),
      pageRole: sorted[0].pageRole,
      combinedClusterVolume: sorted.reduce((sum, row) => sum + Number(row.combinedSearchVolume || 0), 0),
      targetClusters: sorted.map((row) => row.primaryKeyword),
      supportingKeywords: unique(sorted.flatMap((row) => splitPipe(row.supportingKeywords)))
    };
  }).sort((a, b) => tierNumber(a.priorityTier) - tierNumber(b.priorityTier) || b.combinedClusterVolume - a.combinedClusterVolume);
}

function validate(rows) {
  if (!rows.length) return false;
  if (rows.some((row) => !row.canonicalPath && !["hold", "no-action"].includes(row.urlStatus))) return false;
  if (rows.some((row) => ["hold", "no-action"].includes(row.urlStatus) && ["create", "expand-existing"].includes(row.mappingAction))) return false;
  for (const members of groupBy(rows.filter((row) => row.canonicalPath && !["hold", "no-action"].includes(row.urlStatus)), (row) => row.canonicalPath).values()) {
    if (members.filter((row) => ["create", "expand-existing"].includes(row.mappingAction)).length !== 1) return false;
  }
  return true;
}

async function fetchSitemapPaths(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load sitemap: HTTP ${response.status}`);
  const xml = await response.text();
  return new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname.replace(/\/$/, "") || "/"));
}

function renderReport(summary, rows) {
  const backlog = buildPageBacklog(rows);
  const priority = backlog.slice(0, 70);
  const held = rows.filter((row) => ["hold", "no-action"].includes(row.urlStatus));
  return `# Step 8: Canonical URL And Cannibalization Map

Generated: ${summary.generatedAt}

## Completion Gate

Status: ${summary.completionGate.status}

${summary.completionGate.criteria}

## Totals

- Live sitemap URLs inspected: ${summary.liveUrlCount}
- Clusters mapped: ${summary.mappedClusterCount}/${summary.clusterCount}
- Existing canonical owners to expand: ${summary.existingCanonicalPages}
- New canonical pages proposed: ${summary.proposedCanonicalPages}
- Actions: ${serializeCounts(summary.byAction)}

## Canonical Page Backlog

| Priority | Canonical URL | Status | Role | Volume | Owner cluster | Consolidated clusters |
| --- | --- | --- | --- | ---: | --- | --- |
${priority.map((row) => `| ${row.priorityTier} | ${row.canonicalPath} | ${row.action} | ${row.pageRole} | ${row.combinedClusterVolume} | ${row.ownerCluster} | ${row.targetClusters.join("; ")} |`).join("\n")}

## Held Or Excluded

${held.map((row) => `- ${row.primaryKeyword}: ${row.productionGate}; ${row.mappingRationale}`).join("\n")}

## Rules

- One canonical URL owns each intent group; secondary clusters become headings, copy requirements, FAQs, or supporting terms.
- Existing live pages are expanded before a replacement is considered.
- New URLs are proposed only when no current canonical page satisfies the validated intent.
- Brand modifiers such as material plus brand consolidate into the authoritative brand hub unless Step 9 proves a separate SERP and sufficient inventory.
- Held, blocked, and no-action clusters cannot generate public pages.
`;
}

function bestTier(tiers) {
  return [...tiers].sort((a, b) => tierNumber(a) - tierNumber(b))[0];
}

function tierNumber(tier) {
  return { "Tier 1": 1, "Tier 2": 2, "Tier 3": 3, Backlog: 4, Blocked: 5, "No action": 6 }[tier] || 9;
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const values = map.get(key) || [];
    values.push(row);
    map.set(key, values);
  }
  return map;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function serializeCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key, value]) => `${key}:${value}`).join("|");
}

function splitPipe(value) {
  return String(value || "").split("|").map((item) => item.trim()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = unique(rows.flatMap((row) => Object.keys(row)));
  const escape = (value) => {
    const text = value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n")}\n`;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const arg = values[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    parsed[key] = values[index + 1];
    index += 1;
  }
  return parsed;
}
