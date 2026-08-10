import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const step3Dirs = String(
  args.step3Dir || [
    path.join("data", "exports", "seo-intelligence", dateStamp, "step-03-live-metrics-serps"),
    path.join("data", "exports", "seo-intelligence", dateStamp, "step-03b-coverage-addendum")
  ].join(",")
).split(",").map((value) => path.resolve(ROOT, value.trim())).filter(Boolean);
const step4Dir = path.resolve(
  ROOT,
  args.step4Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-04b-coverage-normalized")
);
const step5Dir = path.resolve(
  ROOT,
  args.step5Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-05b-coverage-clusters")
);
const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-06-intent-page-type")
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-06-intent-page-type.md`)
);

const RETAILER_DOMAINS = new Set([
  "yourdoll.com", "rosemarydoll.com", "joylovedolls.com", "bestrealdoll.com", "realsexdoll.com",
  "sexyrealsexdolls.com", "sexdollpartner.com", "sexdolltech.com", "siliconwives.com", "siliconelovers.com",
  "myrobotdoll.com", "uloversdoll.com", "dollpimp.com", "kanadoll.com", "sexdollqueen.com", "realdoll.com",
  "amazon.com", "ebay.com", "aliexpress.com", "mysexdolls.com", "venuslovedolls.com", "poptorso.com", "xtorso.com"
]);
const COMMUNITY_DOMAINS = new Set([
  "youtube.com", "reddit.com", "facebook.com", "instagram.com", "tiktok.com", "x.com", "twitter.com",
  "dollforum.com", "trustpilot.com", "quora.com"
]);
const MANUAL_DECISIONS = new Map([
  ["sexbots price", manualDecision("commercial-investigation", "technology-research", "consideration", "technology-guide", "Explain current pricing claims and product limitations before linking only to genuinely relevant products.", "Mixed commerce and technology SERP; a technology pricing guide matches intent without implying unsupported catalog capabilities.")],
  ["us warehouse sex dolls", manualDecision("transactional", "availability", "decision", "collection", "Browse verified US warehouse inventory and open a product with current fulfillment details.", "Validated against DollWOW's live warehouse, which currently exposes 53 US items.")],
  ["sex robots", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Understand the current state of sex robots, then compare only products with verified capabilities.", "Reference, video, editorial, manufacturer, and commerce results create mixed intent; an evidence-led technology hub is the safest match.")],
  ["robotic sex dolls", manualDecision("informational", "commercial-investigation", "consideration", "technology-guide", "Compare verified robotic features and limitations before viewing relevant products.", "Mixed editorial and commerce SERP requires a technology guide, not an unverified robotic-product collection.")],
  ["real doll", manualDecision("competitor-navigation", "commercial-investigation", "consideration", "competitor-alternative-guide", "Understand RealDoll brand context, then compare relevant DollWOW alternatives.", "Official RealDoll, retailer, reference, and community results show meaningful trademarked-brand intent; do not treat this as a generic DollWOW collection keyword.")],
  ["sexbot", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Learn the terminology and current product reality before following relevant commercial paths.", "Broad entity intent includes entertainment and AI tools; keep the page educational and tightly scoped.")],
  ["realbotix", manualDecision("competitor-navigation", "technology-research", "consideration", "competitor-alternative-guide", "Understand Realbotix and compare relevant DollWOW alternatives without implying equivalence.", "The SERP is dominated by the official entity, media, and social sources; DollWOW should use a factual alternative guide, not a brand hub.")],
  ["gynoid", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Understand the term and its relationship to adult robotics.", "Broad reference and fiction intent makes this an educational subtopic rather than a commercial landing page.")],
  ["ai sexbot", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Understand current AI companion and robotics capabilities before comparing products.", "Mixed AI tools, academic sources, media, and robotics entities support an educational hub.")],
  ["artificial intelligence sexbot", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Understand current AI and robotics capabilities before comparing products.", "Mixed reference and commerce intent should be resolved by an evidence-led technology guide.")],
  ["ai dolls", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Understand what AI doll claims mean and which capabilities are actually available.", "The query includes non-adult toys and broad AI intent, so commercial targeting must remain tightly qualified.")],
  ["dolls castle", manualDecision("brand-navigation", "transactional", "consideration", "brand-hub", "Compare current Dolls Castle listings and open a relevant product.", "DollWOW carries the brand, but opportunity scoring must discount substantial non-adult intent in the SERP.")],
  ["sex doll stores", manualDecision("commercial-investigation", "retailer-comparison", "consideration", "competitor-alternative-guide", "Compare store-selection criteria, then continue to DollWOW's catalog and buyer protections.", "The SERP favors retailers and local stores rather than a single product collection.")],
  ["real doll artificial intelligence", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Understand RealDoll and AI robotics context before comparing relevant alternatives.", "Trademarked entity and technology intent should be handled as factual education.")],
  ["ai companion doll", manualDecision("informational", "technology-research", "awareness", "technology-guide", "Understand AI companion terminology and verified capabilities.", "Mixed product, media, and robotics results support an educational subtopic.")],
  ["real doll eyes", manualDecision("non-target", "unrelated-craft-intent", "none", "no-action", "Do not create a DollWOW page for this query.", "The SERP is dominated by craft, replacement-eye, and collectible-doll intent.")],
  ["gay love doll", manualDecision("transactional", "audience-specific-shopping", "consideration", "collection", "Browse relevant adult products using respectful, inventory-backed filters.", "Commerce intent is present, but Step 7 must verify sufficient distinct inventory before page creation.")],
  ["dolls castle review", manualDecision("commercial-investigation", "brand-evaluation", "consideration", "review-guide", "Evaluate Dolls Castle using transparent criteria, then browse verified listings.", "The term has no measured demand and mixed non-adult intent; Step 7 should score it below the brand hub.")]
]);

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const clusters = JSON.parse(await fs.readFile(path.join(step5Dir, "empirical-clusters.json"), "utf8"));
const canonical = JSON.parse(await fs.readFile(path.join(step4Dir, "canonical-keywords.json"), "utf8"));
const serps = (await Promise.all(step3Dirs.map(async (dir) => JSON.parse(await fs.readFile(path.join(dir, "normalized-serps.json"), "utf8"))))).flat();
const canonicalByKeyword = new Map(canonical.map((row) => [normalize(row.canonicalKeyword), row]));
const serpByKeyword = groupBy(serps, (row) => normalize(row.keyword));

const rows = clusters.map((cluster) => classifyCluster(cluster));
const ambiguous = rows.filter((row) => row.classificationStatus === "manual-review");
const summary = {
  generatedAt,
  clusterCount: rows.length,
  classifiedCount: rows.filter((row) => row.primaryIntent && row.winningPageType).length,
  manualReviewCount: ambiguous.length,
  manuallyValidatedCount: rows.filter((row) => row.classificationStatus === "manually-validated").length,
  byIntent: countBy(rows, "primaryIntent"),
  byPageType: countBy(rows, "winningPageType"),
  byBuyerStage: countBy(rows, "buyerStage"),
  byConfidence: countBy(rows, "confidence"),
  completionGate: {
    status: rows.length === clusters.length && rows.every((row) => row.primaryIntent && row.winningPageType && row.expectedAction) ? "Passed" : "Failed",
    criteria: "Every empirical cluster has an explicit intent, buyer stage, winning page type, expected action, confidence, and review status."
  }
};

await writeJson(path.join(outputDir, "cluster-intent-page-type.json"), rows);
await fs.writeFile(path.join(outputDir, "cluster-intent-page-type.csv"), toCsv(rows), "utf8");
await writeJson(path.join(outputDir, "manual-review-queue.json"), ambiguous);
await writeJson(path.join(outputDir, "step-06-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary, rows, ambiguous), "utf8");

console.log("Completed Step 6 intent and winning-page-type classification.");
console.log(`Clusters classified: ${summary.classifiedCount}/${summary.clusterCount}`);
console.log(`Manual review: ${summary.manualReviewCount}`);
console.log(`Completion gate: ${summary.completionGate.status}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function classifyCluster(cluster) {
  const members = cluster.members || [];
  const canonicalRows = members.map((member) => canonicalByKeyword.get(normalize(member))).filter(Boolean);
  const keywordSerps = members.flatMap((member) => serpByKeyword.get(normalize(member)) || []);
  const topResults = keywordSerps.flatMap((serp) => (serp.organicResults || []).filter((item) => Number(item.rankGroup || 999) <= 10));
  const resultRows = topResults.map((item) => ({ ...item, evidenceType: classifyEvidenceType(item) }));
  const evidenceCounts = countBy(resultRows, "evidenceType");
  const eligibleCounts = Object.fromEntries(Object.entries(evidenceCounts).filter(([type]) => !["community", "reference"].includes(type)));
  const topDomains = Object.entries(countBy(resultRows, "domain")).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([domain, count]) => `${domain}:${count}`).join("|");
  const profile = keywordProfile(cluster, canonicalRows);
  const automatedDecision = decideIntentAndPageType(cluster, profile, eligibleCounts, evidenceCounts);
  const reviewedDecision = MANUAL_DECISIONS.get(normalize(cluster.anchorKeyword));
  const decision = reviewedDecision || automatedDecision;
  const totalEligible = Object.values(eligibleCounts).reduce((sum, value) => sum + value, 0);
  const sortedTypes = Object.entries(eligibleCounts).sort((a, b) => b[1] - a[1]);
  const leadShare = totalEligible ? Number(((sortedTypes[0]?.[1] || 0) / totalEligible).toFixed(3)) : 0;
  const runnerUpShare = totalEligible ? Number(((sortedTypes[1]?.[1] || 0) / totalEligible).toFixed(3)) : 0;
  const confidence = confidenceFor(decision, leadShare, runnerUpShare, keywordSerps, cluster);
  const reviewReasons = reviewedDecision ? [] : reviewReasonsFor(cluster, profile, decision, evidenceCounts, confidence);

  return {
    clusterId: cluster.clusterId,
    primaryKeyword: cluster.anchorKeyword,
    supportingKeywords: members.filter((member) => member !== cluster.anchorKeyword).join("|"),
    memberCount: cluster.memberCount,
    combinedSearchVolume: cluster.combinedSearchVolume,
    primaryIntent: decision.primaryIntent,
    secondaryIntent: decision.secondaryIntent,
    buyerStage: decision.buyerStage,
    winningPageType: decision.winningPageType,
    expectedAction: decision.expectedAction,
    confidence,
    classificationStatus: reviewedDecision ? "manually-validated" : reviewReasons.length ? "manual-review" : "classified",
    reviewReasons: reviewReasons.join("|"),
    manualDecisionNote: reviewedDecision?.note || "",
    brands: cluster.brands,
    materials: cluster.materials,
    audiences: cluster.audiences,
    modifiers: cluster.modifiers,
    existingDollWowTarget: cluster.existingDollWowTarget,
    catalogEvidence: cluster.catalogEvidence,
    desktopMobileSerps: keywordSerps.length,
    top10EvidenceRows: resultRows.length,
    evidenceCounts: serializeCounts(evidenceCounts),
    leadingEvidenceShare: leadShare,
    runnerUpEvidenceShare: runnerUpShare,
    topDomains
  };
}

function keywordProfile(cluster, canonicalRows) {
  const text = normalize((cluster.members || []).join(" "));
  const brands = unique(canonicalRows.flatMap((row) => splitPipe(row.brands)));
  const competitors = unique(canonicalRows.flatMap((row) => splitPipe(row.competitorEntities)));
  const modifiers = unique(canonicalRows.flatMap((row) => splitPipe(row.modifiers)));
  const queryShapes = unique(canonicalRows.flatMap((row) => splitPipe(row.queryShapes)));
  return {
    text,
    brands,
    modifiers,
    queryShapes,
    isReview: /\breviews?\b/.test(text) || modifiers.includes("review"),
    isComparison: /\b(vs|versus|compare|comparison|difference)\b/.test(text) || modifiers.includes("comparison"),
    isCare: /\b(clean|cleaning|care|storage|store|repair|glue|powder|maintain|maintenance)\b/.test(text),
    isTrust: /\b(legal|law|scam|privacy|discreet|warranty|return|safe|safety)\b/.test(text),
    isFulfillment: /\b(ready to ship|in stock|available now|quick ship|fast shipping|warehouse)\b/.test(text),
    isDeliveryQuestion: /\b(delivery time|shipping works|how long.*ship)\b/.test(text),
    isPricing: /\b(cost|price|how much)\b/.test(text),
    isBest: /\bbest\b/.test(text),
    isTechnology: /\b(ai|artificial intelligence|robots?|robotic|sexbots?|gynoid|realbotix)\b/.test(text),
    isQuestion: queryShapes.includes("question") || /^(how|what|why|where|when|which|can|are|is|do|does|should)\b/.test(text),
    isCommercial: /\b(for sale|buy|cheap|affordable|store|stores|custom|in stock|ready to ship|warehouse)\b/.test(text),
    hasBrand: brands.length > 0,
    hasCompetitor: competitors.length > 0,
    competitors
  };
}

function decideIntentAndPageType(cluster, profile, eligibleCounts, allCounts) {
  if (profile.isComparison) return decision("commercial-investigation", "informational", "consideration", "comparison-guide", "Compare the options, then continue to the relevant collections or products.");
  if (profile.isReview) return decision("commercial-investigation", "brand-evaluation", "consideration", "review-guide", "Evaluate the brand or product set using transparent criteria, then browse verified listings.");
  if (profile.isCare || profile.isTrust || profile.isDeliveryQuestion || profile.isQuestion || profile.isPricing) {
    return decision("informational", profile.isPricing ? "commercial-investigation" : "risk-reduction", profile.isPricing ? "consideration" : "post-purchase-or-consideration", "learning-guide", "Get a direct answer, then continue to the most relevant guide, policy, collection, or support path.");
  }
  if (profile.hasCompetitor) return decision("competitor-navigation", "commercial-investigation", "consideration", "competitor-alternative-guide", "Understand the competitor context, then compare DollWOW's relevant catalog and buyer protections.");
  if (profile.hasBrand) return decision("brand-navigation", "transactional", "consideration", "brand-hub", "Compare the current brand catalog and open a relevant product.");
  if (profile.isFulfillment) return decision("transactional", "availability", "decision", "collection", "Browse currently available inventory and open a product with verified fulfillment details.");
  if (profile.isTechnology && !cluster.catalogEvidence) return decision(profile.isCommercial ? "commercial-investigation" : "informational", profile.isCommercial ? "transactional" : "technology-research", profile.isCommercial ? "consideration" : "awareness", "technology-guide", "Understand current capabilities and limitations before comparing relevant products.");
  if (profile.isBest) return decision("commercial-investigation", "transactional", "consideration", "best-of-guide", "Compare recommendations using visible criteria and continue to matching products or collections.");

  const commerce = Number(eligibleCounts.collection || 0) + Number(eligibleCounts.product || 0) + Number(eligibleCounts["commerce-landing"] || 0) + Number(eligibleCounts["brand-hub"] || 0);
  const editorial = Number(eligibleCounts.guide || 0) + Number(eligibleCounts.news || 0);
  if (Number(eligibleCounts.product || 0) > commerce * 0.55) return decision("transactional", "product-navigation", "decision", "product-or-model-page", "Inspect the exact product and configure or purchase it.");
  if (commerce >= editorial) return decision("transactional", "commercial-investigation", "consideration", "collection", "Browse and filter relevant products, then open a product page.");
  return decision("informational", profile.isCommercial ? "commercial-investigation" : "topic-research", "awareness", "learning-guide", "Learn the topic, then continue to the most relevant commercial or support destination.");
}

function decision(primaryIntent, secondaryIntent, buyerStage, winningPageType, expectedAction) {
  return { primaryIntent, secondaryIntent, buyerStage, winningPageType, expectedAction };
}

function manualDecision(primaryIntent, secondaryIntent, buyerStage, winningPageType, expectedAction, note) {
  return { ...decision(primaryIntent, secondaryIntent, buyerStage, winningPageType, expectedAction), note };
}

function classifyEvidenceType(item) {
  const domain = normalizeDomain(item.domain || hostname(item.url));
  const pathname = pathnameOf(item.url);
  const title = normalize(item.title);
  if (COMMUNITY_DOMAINS.has(domain)) return "community";
  if (/wikipedia\.org$|\.edu$|\.gov$/.test(domain)) return "reference";
  if (/\/(products?|item|p)\//.test(pathname) || /product-detail/.test(pathname)) return "product";
  if (/\/(blog|guide|learn|article|articles|faq|news|resources|how-to|reviews?)\b/.test(pathname) || /^(best|how|what|why|guide|review|compare)\b/.test(title)) return "guide";
  if (/\/(collections?|category|categories|shop|warehouse|ready-to-ship|brands?)\b/.test(pathname)) return "collection";
  if (!pathname || pathname === "/") return RETAILER_DOMAINS.has(domain) ? "commerce-landing" : "brand-hub";
  if (RETAILER_DOMAINS.has(domain)) return "commerce-landing";
  if (/\b(news|magazine|journal)\b/.test(title)) return "news";
  return "other";
}

function confidenceFor(decisionRow, lead, runnerUp, keywordSerps, cluster) {
  const bothDevices = new Set(keywordSerps.map((row) => row.device)).size >= 2;
  const ruleStrong = ["brand-hub", "comparison-guide", "review-guide"].includes(decisionRow.winningPageType);
  if (bothDevices && (ruleStrong || lead >= 0.52 || lead - runnerUp >= 0.25)) return "high";
  if (bothDevices && (lead >= 0.35 || cluster.memberCount > 1)) return "medium";
  return "low";
}

function reviewReasonsFor(cluster, profile, decisionRow, evidenceCounts, confidence) {
  const reasons = [];
  if (confidence === "low") reasons.push("low_page_type_confidence");
  const otherDominates = Number(evidenceCounts.other || 0) > Number(evidenceCounts.collection || 0) + Number(evidenceCounts.guide || 0) + Number(evidenceCounts.product || 0) + Number(evidenceCounts["commerce-landing"] || 0);
  if (otherDominates && (confidence === "low" || profile.isTechnology || (!profile.hasBrand && !profile.isComparison && !profile.isReview && Number(cluster.combinedSearchVolume || 0) >= 500))) reasons.push("serp_dominated_by_unclassified_or_entity_results");
  if (profile.isTechnology && decisionRow.winningPageType !== "technology-guide" && !cluster.catalogEvidence) reasons.push("technology_claim_and_catalog_boundary");
  if (/\breal doll\b/.test(profile.text)) reasons.push("generic_query_may_overlap_realdoll_trademark_or_brand_intent");
  if (/\bdolls castle\b/.test(profile.text)) reasons.push("mixed_non_adult_brand_intent");
  if (profile.isFulfillment && /\bwarehouse\b/.test(profile.text)) reasons.push("warehouse_claim_requires_operational_verification");
  return unique(reasons);
}

function renderReport(summary, classified, manualReview) {
  const priority = [...classified].sort((a, b) => b.combinedSearchVolume - a.combinedSearchVolume).slice(0, 45);
  return `# Step 6: Search Intent And Winning Page Type

Generated: ${summary.generatedAt}

## Completion Gate

Status: ${summary.completionGate.status}

${summary.completionGate.criteria}

## Totals

- Clusters classified: ${summary.classifiedCount}/${summary.clusterCount}
- Manual-review flags: ${summary.manualReviewCount}
- Manually validated decisions: ${summary.manuallyValidatedCount}
- Primary intents: ${serializeCounts(summary.byIntent)}
- Winning page types: ${serializeCounts(summary.byPageType)}
- Confidence: ${serializeCounts(summary.byConfidence)}

## Highest-Demand Classifications

| Cluster | Volume | Primary intent | Buyer stage | Winning page type | Confidence | Review |
| --- | ---: | --- | --- | --- | --- | --- |
${priority.map((row) => `| ${row.primaryKeyword} | ${row.combinedSearchVolume} | ${row.primaryIntent} | ${row.buyerStage} | ${row.winningPageType} | ${row.confidence} | ${row.reviewReasons || ""} |`).join("\n")}

## Manual Review Queue

${manualReview.length ? manualReview.map((row) => `- ${row.primaryKeyword}: ${row.reviewReasons}`).join("\n") : "No clusters flagged."}

## Method

- Uses the corrected empirical clusters and all purchased US desktop/mobile SERPs.
- Reclassifies top-ten results into collection, commerce landing, product, brand hub, guide, news, community, reference, and other evidence.
- Applies explicit query-shape rules for brands, reviews, comparisons, care, trust, fulfillment, pricing, questions, technology, and best-of intent.
- Keeps forums, video, social, and reference sources visible without allowing them to masquerade as the recommended DollWOW page type.
- Carries ambiguous entity, trademark, warehouse-claim, and mixed-intent cases into manual review rather than forcing certainty.
`;
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

function pathnameOf(url) {
  try {
    return new URL(url).pathname.toLowerCase().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function normalizeDomain(value) {
  return String(value || "").toLowerCase().replace(/^www\./, "");
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
