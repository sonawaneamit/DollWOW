import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const mergeThreshold = numberArg(args.mergeThreshold, 0.28);
const edgeFloor = numberArg(args.edgeFloor, 0.08);
const resultDepth = Math.min(positiveInteger(args.depth) ?? 10, 20);
const step3Dirs = String(
  args.step3Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-03-live-metrics-serps")
).split(",").map((value) => path.resolve(ROOT, value.trim())).filter(Boolean);
const step4Dir = path.resolve(
  ROOT,
  args.step4Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-04-normalized-keywords")
);
const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-05-serp-clusters")
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-05-serp-clusters.md`)
);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const canonicalKeywords = JSON.parse(await fs.readFile(path.join(step4Dir, "canonical-keywords.json"), "utf8"));
const variantMap = JSON.parse(await fs.readFile(path.join(step4Dir, "keyword-variant-map.json"), "utf8"));
const serps = (await Promise.all(step3Dirs.map(async (dir) => JSON.parse(await fs.readFile(path.join(dir, "normalized-serps.json"), "utf8"))))).flat();

const canonicalByKey = new Map(canonicalKeywords.map((row) => [row.variantKey, row]));
const variantToKey = new Map();
for (const row of variantMap) {
  for (const value of [row.keyword, row.normalizedKeyword, row.correctedKeyword]) {
    if (value) variantToKey.set(normalizePhrase(value), row.variantKey);
  }
}

const nodes = buildNodes(serps, variantToKey, canonicalByKey);
const documentFrequency = buildDocumentFrequency(nodes);
const similarities = buildSimilarities(nodes, documentFrequency);
const empiricalClusters = agglomerativeClusters(nodes, similarities, mergeThreshold);
const clusterRows = summarizeClusters(empiricalClusters, similarities);
const assignments = clusterRows.flatMap((cluster) =>
  cluster.members.map((member) => ({
    clusterId: cluster.clusterId,
    clusterLabel: cluster.clusterLabel,
    canonicalKeyword: member,
    memberCount: cluster.memberCount,
    confidence: cluster.confidence,
    averageSimilarity: cluster.averageSimilarity,
    minimumSimilarity: cluster.minimumSimilarity,
    maximumSimilarity: cluster.maximumSimilarity,
    searchVolume: canonicalByKeyword(member)?.searchVolume || 0,
    selectedForStep3Serp: true
  }))
);
const clusteredKeys = new Set(assignments.map((row) => canonicalByKeyword(row.canonicalKeyword)?.variantKey).filter(Boolean));
const deferred = canonicalKeywords
  .filter((row) => !clusteredKeys.has(row.variantKey))
  .map((row) => ({
    canonicalKeyword: row.canonicalKeyword,
    variantKey: row.variantKey,
    searchVolume: row.searchVolume,
    competitorDomainCount: row.competitorDomainCount,
    existingDollWowTarget: row.existingDollWowTarget,
    catalogEvidence: row.catalogEvidence,
    reason: "no_live_step_3_serp"
  }));
const outliers = clusterRows.filter((cluster) => cluster.memberCount === 1);
const manualReview = buildManualReview(clusterRows, similarities, outliers);
const graph = {
  generatedAt,
  thresholds: { mergeThreshold, edgeFloor, resultDepth },
  nodes: nodes.map((node) => ({
    id: node.variantKey,
    keyword: node.keyword,
    searchVolume: node.data.searchVolume,
    competitorDomainCount: node.data.competitorDomainCount,
    materials: node.data.materials,
    audiences: node.data.audiences,
    brands: node.data.brands,
    modifiers: node.data.modifiers,
    devices: [...node.devices]
  })),
  edges: similarities.filter((edge) => edge.score >= edgeFloor)
};
const summary = buildSummary({ nodes, clusterRows, assignments, deferred, outliers, similarities, manualReview });

await writeJson(path.join(outputDir, "serp-similarity-graph.json"), graph);
await fs.writeFile(path.join(outputDir, "serp-similarity-edges.csv"), toCsv(graph.edges), "utf8");
await writeJson(path.join(outputDir, "empirical-clusters.json"), clusterRows);
await fs.writeFile(path.join(outputDir, "empirical-clusters.csv"), toCsv(clusterRows.map(flattenCluster)), "utf8");
await writeJson(path.join(outputDir, "cluster-assignments.json"), assignments);
await fs.writeFile(path.join(outputDir, "cluster-assignments.csv"), toCsv(assignments), "utf8");
await writeJson(path.join(outputDir, "deferred-no-live-serp.json"), deferred);
await fs.writeFile(path.join(outputDir, "deferred-no-live-serp.csv"), toCsv(deferred), "utf8");
await writeJson(path.join(outputDir, "outliers.json"), outliers);
await writeJson(path.join(outputDir, "manual-review-queue.json"), manualReview);
await writeJson(path.join(outputDir, "clustering-methodology.json"), methodology());
await writeJson(path.join(outputDir, "step-05-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary, clusterRows, manualReview), "utf8");

console.log("Completed Step 5 weighted SERP-overlap clustering.");
console.log(`Live-SERP canonical nodes: ${nodes.length}`);
console.log(`Empirical clusters: ${clusterRows.length}`);
console.log(`Multi-keyword clusters: ${clusterRows.filter((row) => row.memberCount > 1).length}`);
console.log(`Outliers: ${outliers.length}`);
console.log(`Deferred without live SERPs: ${deferred.length}`);
console.log(`Completion gate: ${summary.completionGate.status}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function buildNodes(serpRows, variantLookup, canonicalLookup) {
  const map = new Map();
  for (const serp of serpRows.filter((row) => !row.error)) {
    const normalized = normalizePhrase(serp.normalizedKeyword || serp.keyword);
    const variantKey = variantLookup.get(normalized);
    const data = canonicalLookup.get(variantKey);
    if (!variantKey || !data) continue;
    const current = map.get(variantKey) || {
      variantKey,
      keyword: data.canonicalKeyword,
      data,
      devices: new Set(),
      results: { desktop: [], mobile: [] },
      itemTypes: { desktop: new Set(), mobile: new Set() }
    };
    current.devices.add(serp.device);
    current.results[serp.device] = (serp.organicResults || []).slice(0, resultDepth).map((item) => ({
      rank: Number(item.rankGroup || item.rankAbsolute || 999),
      url: normalizeUrl(item.url),
      domain: normalizeDomain(item.domain || hostname(item.url))
    }));
    current.itemTypes[serp.device] = new Set(serp.itemTypes || []);
    map.set(variantKey, current);
  }
  return [...map.values()].sort((a, b) => nodePriority(b) - nodePriority(a));
}

function buildDocumentFrequency(nodesToCount) {
  const result = { desktopUrl: new Map(), mobileUrl: new Map(), desktopDomain: new Map(), mobileDomain: new Map() };
  for (const node of nodesToCount) {
    for (const device of ["desktop", "mobile"]) {
      const urls = new Set(node.results[device].map((item) => item.url).filter(Boolean));
      const domains = new Set(node.results[device].map((item) => item.domain).filter(Boolean));
      for (const value of urls) result[`${device}Url`].set(value, (result[`${device}Url`].get(value) || 0) + 1);
      for (const value of domains) result[`${device}Domain`].set(value, (result[`${device}Domain`].get(value) || 0) + 1);
    }
  }
  return result;
}

function buildSimilarities(nodesToCompare, frequencies) {
  const edges = [];
  for (let leftIndex = 0; leftIndex < nodesToCompare.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodesToCompare.length; rightIndex += 1) {
      const left = nodesToCompare[leftIndex];
      const right = nodesToCompare[rightIndex];
      const desktopUrl = rankedOverlap(left, right, "desktop", "url", frequencies.desktopUrl, nodesToCompare.length);
      const mobileUrl = rankedOverlap(left, right, "mobile", "url", frequencies.mobileUrl, nodesToCompare.length);
      const desktopDomain = rankedOverlap(left, right, "desktop", "domain", frequencies.desktopDomain, nodesToCompare.length);
      const mobileDomain = rankedOverlap(left, right, "mobile", "domain", frequencies.mobileDomain, nodesToCompare.length);
      const semantic = semanticSimilarity(left, right);
      const feature = featureSimilarity(left, right);
      const rawScore = desktopUrl * 0.35 + mobileUrl * 0.3 + desktopDomain * 0.1 + mobileDomain * 0.1 + semantic * 0.1 + feature * 0.05;
      const intentGuard = surfaceCompatibility(left, right);
      const score = rawScore * intentGuard;
      edges.push({
        source: left.variantKey,
        sourceKeyword: left.keyword,
        target: right.variantKey,
        targetKeyword: right.keyword,
        score: round(score),
        rawScore: round(rawScore),
        intentGuard: round(intentGuard),
        sourceSurfaceFamily: surfaceFamily(left),
        targetSurfaceFamily: surfaceFamily(right),
        desktopUrl: round(desktopUrl),
        mobileUrl: round(mobileUrl),
        desktopDomain: round(desktopDomain),
        mobileDomain: round(mobileDomain),
        semantic: round(semantic),
        feature: round(feature),
        sharedDesktopUrls: sharedCount(left, right, "desktop", "url"),
        sharedMobileUrls: sharedCount(left, right, "mobile", "url"),
        sharedDesktopDomains: sharedCount(left, right, "desktop", "domain"),
        sharedMobileDomains: sharedCount(left, right, "mobile", "domain")
      });
    }
  }
  return edges.sort((a, b) => b.score - a.score);
}

function rankedOverlap(left, right, device, property, frequencies, documentCount) {
  const leftWeights = rankedWeights(left.results[device], property, frequencies, documentCount);
  const rightWeights = rankedWeights(right.results[device], property, frequencies, documentCount);
  const keys = new Set([...leftWeights.keys(), ...rightWeights.keys()]);
  if (!keys.size) return 0;
  let intersection = 0;
  let union = 0;
  for (const key of keys) {
    const leftWeight = leftWeights.get(key) || 0;
    const rightWeight = rightWeights.get(key) || 0;
    intersection += Math.min(leftWeight, rightWeight);
    union += Math.max(leftWeight, rightWeight);
  }
  return union ? intersection / union : 0;
}

function rankedWeights(results, property, frequencies, documentCount) {
  const map = new Map();
  for (const item of results) {
    const value = item[property];
    if (!value) continue;
    const rankWeight = 1 / Math.log2(Math.max(2, item.rank + 1));
    const df = frequencies.get(value) || 1;
    const idf = Math.log((documentCount + 1) / (df + 1)) + 1;
    map.set(value, Math.max(map.get(value) || 0, rankWeight * idf));
  }
  return map;
}

function semanticSimilarity(left, right) {
  const tokenScore = jaccard(semanticTokens(left.keyword), semanticTokens(right.keyword));
  const leftEntities = entityTokens(left.data);
  const rightEntities = entityTokens(right.data);
  const entityScore = leftEntities.size || rightEntities.size ? jaccard(leftEntities, rightEntities) : 0;
  return tokenScore * 0.7 + entityScore * 0.3;
}

function surfaceFamily(node) {
  const keyword = normalizePhrase(node.keyword);
  if (/\b(clean|cleaning|wash|care|maintain)\b/.test(keyword)) return "care";
  if (/\b(storage|store|bag|case)\b/.test(keyword)) return "storage";
  if (/\b(legal|law|laws)\b/.test(keyword)) return "legal";
  if (/\b(cost|price|how much)\b/.test(keyword)) return "pricing";
  if (/\b(review|reviews)\b/.test(keyword)) return "review";
  if (/\b(shipping|discreet|delivery)\b/.test(keyword)) return "shipping";
  if (/\b(vs|versus|compare|comparison|difference)\b/.test(keyword)) return "comparison";
  if (/\b(for sale|buy|cheap|affordable|store|stores)\b/.test(keyword)) return "shopping";
  if (splitPipe(node.data.brands).length || splitPipe(node.data.competitorEntities).length) return "brand";
  return "category";
}

function surfaceCompatibility(left, right) {
  const leftFamily = surfaceFamily(left);
  const rightFamily = surfaceFamily(right);
  if (leftFamily === rightFamily) return 1;
  const pair = new Set([leftFamily, rightFamily]);
  if (pair.has("legal")) return 0.25;
  if (pair.has("brand")) return 0.3;
  if (pair.has("care") && pair.has("storage")) return 0.7;
  if (pair.has("care") || pair.has("storage")) return 0.45;
  if (pair.has("pricing") && pair.has("category")) return 0.5;
  if (pair.has("pricing") && pair.has("shopping")) return 0.65;
  if (pair.has("shopping") && pair.has("category")) return 0.8;
  if (pair.has("review") && pair.has("category")) return 0.6;
  if (pair.has("review") && pair.has("shopping")) return 0.75;
  if (pair.has("shipping") && pair.has("shopping")) return 0.75;
  if (pair.has("shipping") && pair.has("category")) return 0.65;
  if (pair.has("comparison")) return 0.7;
  return 0.55;
}

function featureSimilarity(left, right) {
  const desktop = jaccard(left.itemTypes.desktop, right.itemTypes.desktop);
  const mobile = jaccard(left.itemTypes.mobile, right.itemTypes.mobile);
  return (desktop + mobile) / 2;
}

function agglomerativeClusters(nodesToCluster, edges, threshold) {
  let clusters = nodesToCluster.map((node) => [node.variantKey]);
  const scoreMap = edgeScoreMap(edges);
  while (true) {
    let best = null;
    for (let leftIndex = 0; leftIndex < clusters.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < clusters.length; rightIndex += 1) {
        const score = clusterSimilarity(clusters[leftIndex], clusters[rightIndex], scoreMap);
        const strongest = clusterStrongestEdge(clusters[leftIndex], clusters[rightIndex], scoreMap);
        if (score >= threshold && strongest >= threshold + 0.05 && (!best || score > best.score)) {
          best = { leftIndex, rightIndex, score };
        }
      }
    }
    if (!best) break;
    clusters[best.leftIndex] = [...clusters[best.leftIndex], ...clusters[best.rightIndex]];
    clusters.splice(best.rightIndex, 1);
  }
  return clusters;
}

function summarizeClusters(clusters, similaritiesToUse) {
  const scoreMap = edgeScoreMap(similaritiesToUse);
  const nodeMap = new Map(nodes.map((node) => [node.variantKey, node]));
  return clusters
    .map((members) => {
      const memberNodes = members.map((key) => nodeMap.get(key));
      const pairs = pairScores(members, scoreMap);
      const average = pairs.length ? averageOf(pairs) : 0;
      const minimum = pairs.length ? Math.min(...pairs) : 0;
      const maximum = pairs.length ? Math.max(...pairs) : 0;
      const anchor = [...memberNodes].sort((a, b) => nodePriority(b) - nodePriority(a))[0];
      return {
        clusterId: "",
        clusterLabel: anchor.keyword,
        anchorKeyword: anchor.keyword,
        members: memberNodes.map((node) => node.keyword),
        variantKeys: members,
        memberCount: members.length,
        combinedSearchVolume: memberNodes.reduce((sum, node) => sum + Number(node.data.searchVolume || 0), 0),
        maximumSearchVolume: Math.max(...memberNodes.map((node) => Number(node.data.searchVolume || 0))),
        averageSimilarity: round(average),
        minimumSimilarity: round(minimum),
        maximumSimilarity: round(maximum),
        confidence: clusterConfidence(members.length, average, minimum, memberNodes),
        catalogEvidence: memberNodes.some((node) => node.data.catalogEvidence),
        existingDollWowTarget: memberNodes.some((node) => node.data.existingDollWowTarget),
        materials: unionNodeField(memberNodes, "materials"),
        audiences: unionNodeField(memberNodes, "audiences"),
        brands: unionNodeField(memberNodes, "brands"),
        modifiers: unionNodeField(memberNodes, "modifiers"),
        surfaceFamilies: unique(memberNodes.map((node) => surfaceFamily(node))).join("|"),
        deviceCoverage: unique(memberNodes.flatMap((node) => [...node.devices])).join("|")
      };
    })
    .sort((a, b) => b.memberCount - a.memberCount || b.combinedSearchVolume - a.combinedSearchVolume)
    .map((row, index) => ({ ...row, clusterId: `C${String(index + 1).padStart(3, "0")}` }));
}

function clusterConfidence(size, average, minimum, memberNodes) {
  if (size === 1) return "outlier";
  const bothDevices = memberNodes.every((node) => node.devices.has("desktop") && node.devices.has("mobile"));
  if (average >= 0.45 && minimum >= 0.3 && bothDevices) return "high";
  if (average >= 0.32 && minimum >= 0.18 && bothDevices) return "medium";
  return "low";
}

function buildManualReview(clusters, edges, singletonClusters) {
  const borderlineEdges = edges
    .filter((edge) => edge.score >= mergeThreshold - 0.05 && edge.score < mergeThreshold + 0.05)
    .slice(0, 80);
  const flags = [];
  for (const cluster of clusters) {
    if (cluster.memberCount >= 8) flags.push({ type: "large_cluster", clusterId: cluster.clusterId, label: cluster.clusterLabel, members: cluster.members, reason: "Review for chaining or mixed intent." });
    if (cluster.memberCount > 1 && cluster.confidence === "low") flags.push({ type: "low_confidence_cluster", clusterId: cluster.clusterId, label: cluster.clusterLabel, members: cluster.members, reason: "Average or minimum pair similarity is near the merge threshold." });
    if (splitPipe(cluster.brands).length > 1) flags.push({ type: "mixed_brand_cluster", clusterId: cluster.clusterId, label: cluster.clusterLabel, members: cluster.members, reason: "Multiple brand entities may indicate a comparison cluster or an erroneous merge." });
    if (splitPipe(cluster.materials).length > 1 && !cluster.modifiers.includes("comparison")) flags.push({ type: "mixed_material_cluster", clusterId: cluster.clusterId, label: cluster.clusterLabel, members: cluster.members, reason: "Multiple materials without an explicit comparison modifier." });
    const surfaceFamilies = splitPipe(cluster.surfaceFamilies);
    if (surfaceFamilies.length > 1 && !surfaceFamilies.every((family) => ["category", "shopping"].includes(family))) flags.push({ type: "mixed_surface_family", clusterId: cluster.clusterId, label: cluster.clusterLabel, members: cluster.members, reason: "Review whether different query purposes should own separate URLs." });
  }
  return {
    flaggedClusters: flags,
    borderlineEdges,
    highestVolumeOutliers: singletonClusters.sort((a, b) => b.combinedSearchVolume - a.combinedSearchVolume).slice(0, 30)
  };
}

function buildSummary({ nodes: nodeRows, clusterRows: clusters, assignments: assignmentRows, deferred: deferredRows, outliers: outlierRows, similarities: edgeRows, manualReview: review }) {
  const assigned = new Set(assignmentRows.map((row) => row.canonicalKeyword));
  const allAssigned = nodeRows.every((node) => assigned.has(node.keyword));
  const sampledClusters = clusters.filter((cluster) => cluster.memberCount > 1).slice(0, 12);
  const gatePassed = allAssigned && clusters.length > 0 && edgeRows.length === (nodeRows.length * (nodeRows.length - 1)) / 2;
  return {
    generatedAt,
    methodology: "IDF-weighted rank-decayed URL/domain overlap across desktop and mobile, supported by entity-aware lexical similarity and SERP-feature overlap.",
    thresholds: { mergeThreshold, edgeFloor, resultDepth },
    liveSerpNodes: nodeRows.length,
    pairwiseComparisons: edgeRows.length,
    empiricalClusterCount: clusters.length,
    multiKeywordClusters: clusters.filter((cluster) => cluster.memberCount > 1).length,
    outlierCount: outlierRows.length,
    deferredWithoutLiveSerp: deferredRows.length,
    assignments: assignmentRows.length,
    confidenceCounts: countBy(clusters, "confidence"),
    flaggedClusterCount: review.flaggedClusters.length,
    borderlineEdgeCount: review.borderlineEdges.length,
    sampleClusters: sampledClusters,
    completionGate: {
      status: gatePassed ? "Passed" : "Failed",
      criteria: "Every retained live-SERP canonical keyword is assigned, every pair is scored, thresholds are recorded, and outliers plus review flags are explicit."
    },
    cost: 0
  };
}

function methodology() {
  return {
    generatedAt,
    mergeThreshold,
    edgeFloor,
    resultDepth,
    similarityWeights: {
      desktopUrl: 0.35,
      mobileUrl: 0.3,
      desktopDomain: 0.1,
      mobileDomain: 0.1,
      entityAwareLexical: 0.1,
      serpFeatures: 0.05
    },
    weighting: "Organic result weights decay by rank and are multiplied by inverse document frequency so ubiquitous URLs and domains contribute less. A query-shape guard reduces false merges between clearly different pricing, legal, care, brand, review, shipping, and category purposes.",
    clustering: "Agglomerative average-link merging. A merge requires average cross-cluster similarity at the threshold and at least one pair five points above it.",
    guardrails: [
      "SERP overlap supplies 85% of pair similarity.",
      "Desktop and mobile are calculated independently.",
      "Semantic and entity overlap cannot force a merge without SERP support.",
      "Query-shape compatibility can reduce a pair score but cannot increase it.",
      "Singletons remain explicit outliers.",
      "Canonical keywords without live Step 3 SERPs remain deferred rather than being assigned by assumption."
    ]
  };
}

function renderReport(summary, clusters, review) {
  return `# Step 5: Empirical SERP-Overlap Clusters

Generated: ${summary.generatedAt}

## Completion Gate

Status: ${summary.completionGate.status}

${summary.completionGate.criteria}

## Method

${summary.methodology}

- Merge threshold: ${summary.thresholds.mergeThreshold}
- Result depth per device: ${summary.thresholds.resultDepth}
- API cost: $0.0000

## Totals

- Live-SERP canonical nodes: ${summary.liveSerpNodes}
- Pairwise comparisons: ${summary.pairwiseComparisons}
- Empirical clusters: ${summary.empiricalClusterCount}
- Multi-keyword clusters: ${summary.multiKeywordClusters}
- Outliers: ${summary.outlierCount}
- Deferred canonical keywords without live SERPs: ${summary.deferredWithoutLiveSerp}
- Flagged clusters for manual review: ${summary.flaggedClusterCount}

## Cluster Summary

| ID | Anchor | Members | Volume | Avg similarity | Min | Confidence | Existing target | Catalog |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
${clusters.map((cluster) => `| ${cluster.clusterId} | ${cluster.clusterLabel} | ${cluster.memberCount} | ${cluster.combinedSearchVolume} | ${cluster.averageSimilarity} | ${cluster.minimumSimilarity} | ${cluster.confidence} | ${cluster.existingDollWowTarget ? "yes" : "no"} | ${cluster.catalogEvidence ? "yes" : "no"} |`).join("\n")}

## Multi-Keyword Cluster Members

${clusters.filter((cluster) => cluster.memberCount > 1).map((cluster) => `### ${cluster.clusterId}: ${cluster.clusterLabel}\n\n${cluster.members.map((member) => `- ${member}`).join("\n")}\n`).join("\n")}

## Manual Review Queue

- Flagged clusters: ${review.flaggedClusters.length}
- Borderline edges: ${review.borderlineEdges.length}
- High-volume outliers listed: ${review.highestVolumeOutliers.length}

Step 6 must classify intent and winning page type from each cluster's actual SERP composition. No page type is assigned in this step.
`;
}

function flattenCluster(cluster) {
  return { ...cluster, members: cluster.members.join("|"), variantKeys: cluster.variantKeys.join("|") };
}

function edgeScoreMap(edges) {
  const map = new Map();
  for (const edge of edges) map.set(pairKey(edge.source, edge.target), edge.score);
  return map;
}

function clusterSimilarity(left, right, scoreMap) {
  const scores = [];
  for (const leftKey of left) for (const rightKey of right) scores.push(scoreMap.get(pairKey(leftKey, rightKey)) || 0);
  return averageOf(scores);
}

function clusterStrongestEdge(left, right, scoreMap) {
  let strongest = 0;
  for (const leftKey of left) for (const rightKey of right) strongest = Math.max(strongest, scoreMap.get(pairKey(leftKey, rightKey)) || 0);
  return strongest;
}

function pairScores(members, scoreMap) {
  const scores = [];
  for (let left = 0; left < members.length; left += 1) {
    for (let right = left + 1; right < members.length; right += 1) scores.push(scoreMap.get(pairKey(members[left], members[right])) || 0);
  }
  return scores;
}

function pairKey(left, right) {
  return [left, right].sort().join("::");
}

function sharedCount(left, right, device, property) {
  const leftValues = new Set(left.results[device].map((item) => item[property]).filter(Boolean));
  return new Set(right.results[device].map((item) => item[property]).filter((value) => leftValues.has(value))).size;
}

function semanticTokens(value) {
  const normalized = normalizePhrase(value)
    .replace(/how much/g, "price")
    .replace(/\b(cost|costs|prices)\b/g, "price")
    .replace(/\b(robotic|robots|sexbot|sexbots)\b/g, "robot")
    .replace(/\b(clean|cleaning)\b/g, "cleaning")
    .replace(/\b(reviews)\b/g, "review")
    .replace(/\b(dolls)\b/g, "doll");
  return new Set(normalized.split(" ").filter((token) => token && !["sex", "doll", "love", "a", "the", "for", "of", "in", "to", "and"].includes(token)));
}

function entityTokens(data) {
  return new Set(["materials", "audiences", "brands", "appearanceEntities", "formEntities", "modifiers"].flatMap((key) => splitPipe(data[key]).map((value) => `${key}:${value.toLowerCase()}`)));
}

function unionNodeField(memberNodes, key) {
  return unique(memberNodes.flatMap((node) => splitPipe(node.data[key]))).join("|");
}

function nodePriority(node) {
  return Math.log10(Number(node.data.searchVolume || 0) + 1) * 30 + Number(node.data.competitorDomainCount || 0) * 20 + (node.data.existingDollWowTarget ? 25 : 0) + (node.data.catalogEvidence ? 20 : 0);
}

function canonicalByKeyword(keyword) {
  return canonicalKeywords.find((row) => row.canonicalKeyword === keyword);
}

function jaccard(left, right) {
  if (!left.size && !right.size) return 0;
  const intersection = [...left].filter((item) => right.has(item)).length;
  return intersection / new Set([...left, ...right]).size;
}

function averageOf(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    const pathname = url.pathname.replace(/\/$/, "") || "/";
    return `${normalizeDomain(url.hostname)}${pathname}`;
  } catch {
    return "";
  }
}

function hostname(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function normalizeDomain(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "");
}

function normalizePhrase(value) {
  return String(value || "").toLowerCase().replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function splitPipe(value) {
  return String(value || "").split("|").map((item) => item.trim()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function round(value) {
  return Number(Number(value || 0).toFixed(4));
}

function positiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function numberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 1 ? parsed : fallback;
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = unique(rows.flatMap((row) => Object.keys(row)));
  const escape = (value) => {
    const text = Array.isArray(value) ? value.join("|") : value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
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
