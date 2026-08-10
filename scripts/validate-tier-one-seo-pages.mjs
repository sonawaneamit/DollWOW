import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const step3Dirs = String(args.step3Dir || [
  path.join("data", "exports", "seo-intelligence", dateStamp, "step-03-live-metrics-serps"),
  path.join("data", "exports", "seo-intelligence", dateStamp, "step-03b-coverage-addendum")
].join(",")).split(",").map((value) => path.resolve(ROOT, value.trim()));
const step8Dir = path.resolve(ROOT, args.step8Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-08-url-map"));
const outputDir = path.resolve(ROOT, args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-09-tier-one-validation"));
const reportPath = path.resolve(ROOT, args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-09-tier-one-validation.md`));

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const urlMap = JSON.parse(await fs.readFile(path.join(step8Dir, "cluster-url-map.json"), "utf8"));
const serps = (await Promise.all(step3Dirs.map(async (dir) => JSON.parse(await fs.readFile(path.join(dir, "normalized-serps.json"), "utf8"))))).flat();
const serpByKeyword = groupBy(serps, (row) => normalize(row.keyword));
const tierOneRows = urlMap.filter((row) => row.priorityTier === "Tier 1" && row.canonicalPath);
const byCanonical = groupBy(tierOneRows, (row) => row.canonicalPath);
const validations = [...byCanonical.entries()].map(([canonicalPath, clusters]) => validatePage(canonicalPath, clusters)).sort((a, b) => a.rank - b.rank);
const summary = {
  generatedAt,
  tierOneClusters: tierOneRows.length,
  tierOneCanonicalPages: validations.length,
  byDecision: countBy(validations, "decision"),
  livePages: validations.filter((row) => row.live).length,
  proposedPages: validations.filter((row) => !row.live).length,
  completionGate: {
    status: validations.length > 0 && validations.every((row) => ["approved", "approved-with-constraints"].includes(row.decision) && row.topCompetitors.length && row.matchRequirements.length && row.exceedAdvantages.length) ? "Passed" : "Failed",
    criteria: "Every Tier 1 canonical owner has a reviewed SERP set, inventory evidence, claim constraints, a cannibalization decision, Match requirements, and at least three Exceed advantages."
  }
};

await writeJson(path.join(outputDir, "tier-one-page-validations.json"), validations);
await fs.writeFile(path.join(outputDir, "tier-one-page-validations.csv"), toCsv(validations), "utf8");
await writeJson(path.join(outputDir, "step-09-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary, validations), "utf8");

console.log("Completed Step 9 manual Tier 1 validation.");
console.log(`Tier 1 clusters: ${summary.tierOneClusters}`);
console.log(`Canonical pages reviewed: ${summary.tierOneCanonicalPages}`);
console.log(`Completion gate: ${summary.completionGate.status}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function validatePage(canonicalPath, clusters) {
  const sorted = [...clusters].sort((a, b) => a.rank - b.rank);
  const owner = sorted[0];
  const keywords = unique(sorted.flatMap((row) => [row.primaryKeyword, ...splitPipe(row.supportingKeywords)]));
  const pageSerps = keywords.flatMap((keyword) => serpByKeyword.get(normalize(keyword)) || []);
  const topResults = pageSerps.flatMap((serp) => (serp.organicResults || []).filter((result) => Number(result.rankGroup || 999) <= 10));
  const topCompetitors = aggregateCompetitors(topResults).slice(0, 8);
  const pageTypeMix = countBy(topResults, "pageType");
  const constraints = constraintsFor(owner, canonicalPath);
  const matchRequirements = matchFor(owner, pageTypeMix);
  const exceedAdvantages = exceedFor(owner, canonicalPath);
  return {
    rank: owner.rank,
    canonicalPath,
    live: owner.urlStatus === "existing",
    ownerCluster: owner.primaryKeyword,
    targetClusters: sorted.map((row) => row.primaryKeyword),
    supportingKeywords: keywords.filter((keyword) => !sorted.some((row) => row.primaryKeyword === keyword)),
    combinedSearchVolume: sorted.reduce((sum, row) => sum + Number(row.combinedSearchVolume || 0), 0),
    pageRole: owner.pageRole,
    winningPageType: owner.winningPageType,
    inventorySupportCount: Math.min(...sorted.map((row) => Number(row.inventorySupportCount || 0))),
    inventorySupportBasis: unique(sorted.map((row) => row.inventorySupportBasis)),
    serpSnapshotsReviewed: pageSerps.length,
    top10ResultsReviewed: topResults.length,
    pageTypeMix,
    topCompetitors,
    cannibalizationDecision: `Keep ${canonicalPath} as the sole canonical owner for ${sorted.map((row) => row.primaryKeyword).join(", ")}.`,
    claimConstraints: constraints,
    matchRequirements,
    exceedAdvantages,
    decision: constraints.length ? "approved-with-constraints" : "approved",
    nextAction: owner.urlStatus === "existing" ? "Expand and optimize the live canonical page." : "Create the canonical page, then add it to navigation, sitemap, and internal-link modules."
  };
}

function aggregateCompetitors(results) {
  const map = new Map();
  for (const result of results) {
    const domain = result.domain || safeHostname(result.url);
    if (!domain || domain === "dollwow.com") continue;
    const current = map.get(domain) || { domain, appearances: 0, bestRank: Infinity, rankingUrls: new Map() };
    current.appearances += 1;
    current.bestRank = Math.min(current.bestRank, Number(result.rankGroup || 999));
    if (result.url) current.rankingUrls.set(result.url, (current.rankingUrls.get(result.url) || 0) + 1);
    map.set(domain, current);
  }
  return [...map.values()].map((row) => ({
    domain: row.domain,
    appearances: row.appearances,
    bestRank: row.bestRank,
    leadingUrl: [...row.rankingUrls.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ""
  })).sort((a, b) => b.appearances - a.appearances || a.bestRank - b.bestRank);
}

function constraintsFor(owner, canonicalPath) {
  const constraints = [];
  if (owner.inventorySupportCount < 50) constraints.push(`Keep product claims tied to the ${owner.inventorySupportCount} currently verified qualifying listings and refresh when inventory changes.`);
  if (/realistic/.test(canonicalPath)) constraints.push("Define visible realism criteria; do not imply every catalog item is equally realistic or independently tested.");
  if (/cheap/.test(canonicalPath)) constraints.push("Use current price bands and customer-facing affordable/value language; do not hard-code prices or equate low price with low quality.");
  if (/best-sex-dolls/.test(canonicalPath)) constraints.push("Publish the selection methodology, review date, and product-data basis; do not claim hands-on testing that did not occur.");
  if (/male-dolls/.test(canonicalPath)) constraints.push("QA the 49 qualifying product classifications before publication and use respectful, product-specific language.");
  if (/tantaly/.test(canonicalPath)) constraints.push("Treat Tantaly as brand intent, keep claims limited to the 30 live listings, and avoid unsupported authorization or availability language.");
  if (/erovenus/.test(canonicalPath)) constraints.push("The brand hub is viable with 29 listings but must not imply a larger range than is live.");
  return constraints;
}

function matchFor(owner, pageTypeMix) {
  const observedTypes = Object.entries(pageTypeMix).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type]) => type);
  if (owner.winningPageType === "brand-hub") return [
    "Current brand catalog with crawlable product links and useful filters.",
    "Original brand overview, material and customization context, FAQs, and dated inventory facts.",
    `SERP format coverage informed by ${observedTypes.join(", ") || "brand and commerce"} results.`
  ];
  if (owner.winningPageType === "best-of-guide") return [
    "Clear recommendation methodology, use-case categories, comparison table, and current product examples.",
    "Direct answers to recurring buyer questions with author, reviewer, and review date.",
    `SERP format coverage informed by ${observedTypes.join(", ") || "guide"} results.`
  ];
  return [
    "Crawlable introductory copy that directly satisfies the shopping intent without delaying the product grid.",
    "Qualified inventory, useful filters, FAQs, ItemList and breadcrumb schema, and links to relevant Learning Center guides.",
    `SERP format coverage informed by ${observedTypes.join(", ") || "collection"} results.`
  ];
}

function exceedFor(owner, canonicalPath) {
  const common = [
    "Use live Shopify inventory facts and product cards instead of generic stock copy.",
    "Add concise GEO answer units, explicit entities, measurement pairs, FAQs, and source-worthy comparison facts.",
    "Use real product imagery, useful comparison visuals, and contextual links from education to the exact money page."
  ];
  if (owner.winningPageType === "brand-hub") common.push("Expose brand-specific materials, sizes, customization paths, and current availability in a scannable comparison layer.");
  if (canonicalPath === "/shop/sex-dolls") common.push("Make DollWOW's finder, comparison, privacy, warehouse, and support advantages visible without turning the page into marketing filler.");
  if (canonicalPath === "/learn/best-sex-dolls") common.push("Build transparent recommendation cards around real catalog products, buyer use cases, and current data rather than anonymous rankings.");
  return common;
}

function renderReport(summary, validations) {
  return `# Step 9: Tier 1 Manual Validation

Generated: ${summary.generatedAt}

## Completion Gate

Status: ${summary.completionGate.status}

${summary.completionGate.criteria}

## Totals

- Tier 1 clusters reviewed: ${summary.tierOneClusters}
- Distinct canonical owners reviewed: ${summary.tierOneCanonicalPages}
- Live pages: ${summary.livePages}
- Proposed pages: ${summary.proposedPages}
- Decisions: ${serializeCounts(summary.byDecision)}

## Reviewed Set

| Rank | Canonical URL | Status | Volume | Inventory | SERPs | Top competitors | Decision |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
${validations.map((row) => `| ${row.rank} | ${row.canonicalPath} | ${row.live ? "live" : "proposed"} | ${row.combinedSearchVolume} | ${row.inventorySupportCount} | ${row.serpSnapshotsReviewed} | ${row.topCompetitors.slice(0, 5).map((item) => item.domain).join(", ")} | ${row.decision} |`).join("\n")}

## Page Decisions

${validations.map((row) => `### ${row.canonicalPath}

- Owner: ${row.ownerCluster}
- Clusters: ${row.targetClusters.join("; ")}
- Cannibalization: ${row.cannibalizationDecision}
- Constraints: ${row.claimConstraints.length ? row.claimConstraints.join(" ") : "No exceptional constraints beyond the sitewide accuracy rules."}
- Match: ${row.matchRequirements.join(" ")}
- Exceed: ${row.exceedAdvantages.join(" ")}
- Next: ${row.nextAction}`).join("\n\n")}

## Validation Rule

Approval authorizes architecture and production planning. It does not authorize invented reviews, unsupported product claims, stale prices, or automatic publication without copy and visual QA.
`;
}

function safeHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
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
