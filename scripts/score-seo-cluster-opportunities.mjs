import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let tokenCache = null;
const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const step3Dirs = String(
  args.step3Dir || [
    path.join("data", "exports", "seo-intelligence", dateStamp, "step-03-live-metrics-serps"),
    path.join("data", "exports", "seo-intelligence", dateStamp, "step-03b-coverage-addendum")
  ].join(",")
).split(",").map((value) => path.resolve(ROOT, value.trim())).filter(Boolean);
const step4Dir = path.resolve(ROOT, args.step4Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-04b-coverage-normalized"));
const step6Dir = path.resolve(ROOT, args.step6Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-06-intent-page-type"));
const outputDir = path.resolve(ROOT, args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-07-opportunity-scoring"));
const reportPath = path.resolve(ROOT, args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-07-opportunity-scoring.md`));
const productFeedSource = args.productFeed || "https://dollwow.com/product-feed.json";

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await loadLocalEnv();

const clusters = JSON.parse(await fs.readFile(path.join(step6Dir, "cluster-intent-page-type.json"), "utf8"));
const canonical = JSON.parse(await fs.readFile(path.join(step4Dir, "canonical-keywords.json"), "utf8"));
const serps = (await Promise.all(step3Dirs.map(async (dir) => JSON.parse(await fs.readFile(path.join(dir, "normalized-serps.json"), "utf8"))))).flat();
const productFeed = await loadJson(productFeedSource);
const feedProducts = productFeed.products || [];
const adminCatalog = await fetchAdminCatalog().catch((error) => {
  console.warn(`Shopify Admin catalog enrichment unavailable: ${error instanceof Error ? error.message : String(error)}`);
  return [];
});
const adminByHandle = new Map(adminCatalog.map((product) => [product.handle, product]));
const products = feedProducts.map((product) => ({ ...product, ...(adminByHandle.get(product.handle) || {}) }));
const technologyProducts = products.filter((product) => /\b(ai|robot|robotic|sexbot)\b/i.test([
  product.title,
  product.productType,
  ...(product.lookTags || [])
].filter(Boolean).join(" ")));
const canonicalByKeyword = new Map(canonical.map((row) => [normalize(row.canonicalKeyword), row]));
const serpByKeyword = groupBy(serps, (row) => normalize(row.keyword));
const maxVolume = Math.max(...clusters.map((row) => Number(row.combinedSearchVolume || 0)), 1);
const rows = clusters.map((cluster) => scoreCluster(cluster)).sort((a, b) => b.opportunityScore - a.opportunityScore || b.combinedSearchVolume - a.combinedSearchVolume);
rows.forEach((row, index) => { row.rank = index + 1; });
const summary = {
  generatedAt,
  productFeedSource,
  productFeedGeneratedAt: productFeed.generatedAt || null,
  productCount: products.length,
  adminCatalogMatchedProducts: products.filter((product) => adminByHandle.has(product.handle)).length,
  clusterCount: rows.length,
  byTier: countBy(rows, "priorityTier"),
  byGate: countBy(rows, "productionGate"),
  tierOneCount: rows.filter((row) => row.priorityTier === "Tier 1").length,
  tierTwoCount: rows.filter((row) => row.priorityTier === "Tier 2").length,
  completionGate: {
    status: rows.length === clusters.length && rows.every(hasCompleteScoring) ? "Passed" : "Failed",
    criteria: "Every Step 6 cluster has visible component scores, inventory support, a production gate, and a priority tier."
  }
};

await writeJson(path.join(outputDir, "cluster-opportunity-matrix.json"), rows);
await fs.writeFile(path.join(outputDir, "cluster-opportunity-matrix.csv"), toCsv(rows), "utf8");
await writeJson(path.join(outputDir, "step-07-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary, rows), "utf8");

console.log("Completed Step 7 cluster opportunity scoring.");
console.log(`Clusters scored: ${rows.length}`);
console.log(`Tier 1: ${summary.tierOneCount}`);
console.log(`Tier 2: ${summary.tierTwoCount}`);
console.log(`Catalog products: ${summary.productCount}`);
console.log(`Completion gate: ${summary.completionGate.status}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function scoreCluster(cluster) {
  const memberKeywords = [cluster.primaryKeyword, ...splitPipe(cluster.supportingKeywords)];
  const canonicalRows = memberKeywords.map((keyword) => canonicalByKeyword.get(normalize(keyword))).filter(Boolean);
  const keywordSerps = memberKeywords.flatMap((keyword) => serpByKeyword.get(normalize(keyword)) || []);
  const volume = Number(cluster.combinedSearchVolume || 0);
  const maxCpc = Math.max(...canonicalRows.map((row) => Number(row.cpc || 0)), 0);
  const bestDollWowRank = minimum(keywordSerps.map((row) => row.dollWowBestRank).filter((value) => value !== null && value !== "" && Number.isFinite(Number(value))));
  const trafficScore = round(100 * Math.log1p(volume) / Math.log1p(maxVolume));
  const commercialScore = commercialValueScore(cluster, maxCpc);
  const inventory = inventorySupport(cluster, canonicalRows);
  const feasibilityScore = rankingFeasibilityScore(cluster, trafficScore, bestDollWowRank);
  const geoScore = geoCitationScore(cluster);
  const authorityScore = existingAuthorityScore(cluster, bestDollWowRank);
  const rawScore = trafficScore * 0.25 + commercialScore * 0.2 + inventory.score * 0.2 + feasibilityScore * 0.15 + geoScore * 0.1 + authorityScore * 0.1;
  const productionGate = gateFor(cluster, inventory.count);
  const opportunityScore = productionGate === "no-action" ? 0 : round(rawScore);
  const priorityTier = tierFor(opportunityScore, productionGate);

  return {
    rank: 0,
    clusterId: cluster.clusterId,
    primaryKeyword: cluster.primaryKeyword,
    supportingKeywords: cluster.supportingKeywords,
    combinedSearchVolume: volume,
    maxCpc: round(maxCpc),
    primaryIntent: cluster.primaryIntent,
    winningPageType: cluster.winningPageType,
    buyerStage: cluster.buyerStage,
    trafficScore,
    commercialValueScore: commercialScore,
    inventoryAdvantageScore: inventory.score,
    rankingFeasibilityScore: feasibilityScore,
    geoCitationScore: geoScore,
    existingAuthorityScore: authorityScore,
    opportunityScore,
    priorityTier,
    productionGate,
    inventorySupportCount: inventory.count,
    inventorySupportBasis: inventory.basis,
    bestCurrentDollWowRank: bestDollWowRank,
    existingDollWowTarget: cluster.existingDollWowTarget,
    classificationConfidence: cluster.confidence,
    classificationStatus: cluster.classificationStatus,
    manualDecisionNote: cluster.manualDecisionNote,
    recommendedNextStep: nextStepFor(cluster, productionGate, priorityTier)
  };
}

function commercialValueScore(cluster, cpc) {
  const intentScore = {
    transactional: 100,
    "brand-navigation": 95,
    "competitor-navigation": 88,
    "commercial-investigation": 85,
    informational: cluster.winningPageType === "technology-guide" ? 52 : 42,
    "non-target": 0
  }[cluster.primaryIntent] ?? 35;
  const cpcScore = Math.min(100, Math.log1p(Math.min(cpc, 12)) / Math.log1p(12) * 100);
  return round(intentScore * 0.68 + cpcScore * 0.32);
}

function inventorySupport(cluster, canonicalRows) {
  const keyword = normalize([cluster.primaryKeyword, cluster.supportingKeywords].join(" "));
  const brands = unique(canonicalRows.flatMap((row) => splitPipe(row.brands)));
  const materials = unique(canonicalRows.flatMap((row) => splitPipe(row.materials)));
  const audiences = unique(canonicalRows.flatMap((row) => splitPipe(row.audiences)));
  let matches = products;
  let basis = "entire customer-visible catalog";

  if (cluster.winningPageType === "no-action") return { count: 0, score: 0, basis: "explicitly excluded query" };
  if (brands.length) {
    matches = products.filter((product) => brands.some((brand) => normalize(product.brand) === normalize(brand)));
    basis = `brand:${brands.join("|")}`;
  } else if (/\bus warehouse\b/.test(keyword)) {
    matches = products.filter((product) => product.stockStatus === "ready_to_ship" && /\b(united states|usa|us)\b/i.test(product.warehouseCountry || ""));
    basis = "ready-to-ship products with US warehouse data";
  } else if (/\b(ready to ship|in stock|available now|quick ship|fast shipping)\b/.test(keyword)) {
    matches = products.filter((product) => product.stockStatus === "ready_to_ship");
    basis = "ready-to-ship products";
  } else if (/\bcustom\b/.test(keyword)) {
    matches = products.filter((product) => product.customAvailable === true);
    basis = "customizable products";
  } else if (cluster.winningPageType === "technology-guide") {
    matches = technologyProducts;
    basis = "products explicitly tagged or titled with supported AI or robotic capabilities";
  } else if (/\bmale sex doll\b/.test(normalize(cluster.primaryKeyword))) {
    matches = products.filter((product) => product.bodyType === "male");
    basis = "verified or conservatively inferred male body type";
  } else if (/\b(futa|gay love doll)\b/.test(keyword)) {
    const feature = /\bfuta\b/.test(keyword) ? /\bfuta\b/i : /\bgay\b/i;
    matches = products.filter((product) => feature.test(productSearchText(product)));
    basis = "explicit matching catalog classification";
  } else if (/\btorso\b/.test(keyword)) {
    matches = products.filter((product) => /\b(torso|hips?)\b/i.test(productSearchText(product)));
    basis = "torso or hips product form";
  } else if (materials.length === 1 && cluster.winningPageType !== "comparison-guide") {
    matches = products.filter((product) => normalize(product.material).includes(normalize(materials[0])));
    basis = `material:${materials[0]}`;
  } else if (audiences.includes("Female")) {
    matches = products.filter((product) => product.bodyType === "female");
    basis = "female body type";
  } else if (/\bmini\b/.test(keyword)) {
    matches = products.filter((product) => Number(product.heightCm || 999) <= 120);
    basis = "height at or below 120 cm";
  } else if (/\b(petite|small)\b/.test(keyword)) {
    matches = products.filter((product) => Number(product.heightCm || 999) <= 155);
    basis = "height at or below 155 cm";
  } else if (/\blightweight\b/.test(keyword)) {
    matches = products.filter((product) => Number(product.weightLb || 999) <= 70);
    basis = "listed weight at or below 70 lb";
  } else if (/\b(cheap|affordable)\b/.test(keyword)) {
    matches = products.filter((product) => Number(product.priceRange?.min?.amount || 999999) <= 1000);
    basis = "starting price at or below $1,000";
  } else {
    const appearance = ["asian", "black", "african", "japanese", "latina", "brunette", "blonde", "redhead"].find((term) => new RegExp(`\\b${term}\\b`).test(keyword));
    if (appearance) {
      const aliases = appearance === "asian" ? /\b(asian|japanese|korean|chinese)\b/i : appearance === "black" || appearance === "african" ? /\b(black|african)\b/i : new RegExp(`\\b${appearance}\\b`, "i");
      matches = products.filter((product) => aliases.test(productSearchText(product)));
      basis = `verified catalog metadata:${appearance}`;
    } else {
      const feature = ["anime", "heated", "heating", "bubble butt", "plump", "bbw", "chubby", "slim", "slender"].find((term) => new RegExp(`\\b${term}\\b`).test(keyword));
      if (feature) {
        const aliases = feature === "heated" || feature === "heating" ? /\b(heated|heating)\b/i : feature === "plump" ? /\b(plump|bbw|chubby|fuller)\b/i : feature === "slim" ? /\b(slim|slender)\b/i : new RegExp(`\\b${feature}\\b`, "i");
        matches = products.filter((product) => aliases.test(productSearchText(product)));
        basis = `verified catalog metadata:${feature}`;
      }
    }
  }

  const count = matches.length;
  let score = inventoryCountScore(count);
  if (["learning-guide", "technology-guide", "review-guide", "best-of-guide", "comparison-guide", "competitor-alternative-guide"].includes(cluster.winningPageType) && basis === "entire customer-visible catalog") score = Math.min(score, 75);
  if (cluster.winningPageType === "technology-guide") score = Math.min(score, count > 0 ? 48 : 20);
  return { count, score, basis };
}

function inventoryCountScore(count) {
  if (count >= 200) return 100;
  if (count >= 100) return 95;
  if (count >= 50) return 88;
  if (count >= 25) return 78;
  if (count >= 10) return 65;
  if (count >= 5) return 48;
  if (count >= 1) return 28;
  return 0;
}

function rankingFeasibilityScore(cluster, trafficScore, bestRank) {
  const rankEvidence = bestRank == null ? 28 : bestRank <= 10 ? 100 : bestRank <= 20 ? 88 : bestRank <= 50 ? 70 : bestRank <= 100 ? 52 : 35;
  const demandDifficulty = Math.max(15, 100 - trafficScore * 0.72);
  const confidence = cluster.confidence === "high" ? 90 : cluster.confidence === "medium" ? 72 : 48;
  let score = rankEvidence * 0.45 + demandDifficulty * 0.35 + confidence * 0.2;
  if (/mixed|ambiguous|non-adult/i.test(cluster.manualDecisionNote || "")) score -= 18;
  return round(Math.max(0, score));
}

function geoCitationScore(cluster) {
  const base = {
    "comparison-guide": 100,
    "learning-guide": 96,
    "technology-guide": 94,
    "review-guide": 90,
    "best-of-guide": 90,
    "competitor-alternative-guide": 86,
    "brand-directory": 82,
    "brand-hub": 72,
    collection: 58,
    "product-or-model-page": 42,
    "no-action": 0
  }[cluster.winningPageType] ?? 50;
  const evidenceBonus = /\b(reference|community|guide):[1-9]/.test(cluster.evidenceCounts || "") ? 6 : 0;
  return Math.min(100, base + evidenceBonus);
}

function existingAuthorityScore(cluster, bestRank) {
  if (bestRank != null) return bestRank <= 10 ? 100 : bestRank <= 20 ? 88 : bestRank <= 50 ? 72 : bestRank <= 100 ? 56 : 38;
  return cluster.existingDollWowTarget ? 46 : 18;
}

function gateFor(cluster, inventoryCount) {
  if (cluster.winningPageType === "no-action" || cluster.primaryIntent === "non-target") return "no-action";
  if (cluster.winningPageType === "brand-hub" && inventoryCount === 0) return "blocked-no-authorized-inventory";
  if (cluster.winningPageType === "collection" && inventoryCount < 5) return "hold-insufficient-inventory";
  if (cluster.winningPageType === "collection" && inventoryCount < 10) return "manual-inventory-review";
  return "eligible";
}

function tierFor(score, gate) {
  if (gate === "no-action") return "No action";
  if (gate.startsWith("blocked") || gate.startsWith("hold")) return "Blocked";
  if (score >= 68) return "Tier 1";
  if (score >= 58) return "Tier 2";
  if (score >= 45) return "Tier 3";
  return "Backlog";
}

function nextStepFor(cluster, gate, tier) {
  if (gate === "no-action") return "Exclude from production and preserve the decision log.";
  if (gate === "blocked-no-authorized-inventory") return "Do not publish commercially until authorized inventory is live.";
  if (gate.includes("inventory")) return "Audit distinct qualifying inventory before page creation.";
  if (tier === "Tier 1") return `Prioritize ${cluster.winningPageType} in the first production wave.`;
  if (tier === "Tier 2") return `Map to an existing or planned ${cluster.winningPageType} after Tier 1.`;
  if (tier === "Tier 3") return "Retain for the second roadmap wave or consolidation into a stronger parent page.";
  return "Monitor demand and consolidate into a parent page where useful.";
}

function hasCompleteScoring(row) {
  return ["trafficScore", "commercialValueScore", "inventoryAdvantageScore", "rankingFeasibilityScore", "geoCitationScore", "existingAuthorityScore", "opportunityScore"].every((key) => Number.isFinite(Number(row[key]))) && row.priorityTier && row.productionGate;
}

function renderReport(summary, rows) {
  const top = rows.slice(0, 60);
  const blocked = rows.filter((row) => row.productionGate !== "eligible");
  return `# Step 7: Cluster Opportunity And Feasibility Scoring

Generated: ${summary.generatedAt}

## Completion Gate

Status: ${summary.completionGate.status}

${summary.completionGate.criteria}

## Inputs

- Corrected Step 6 clusters: ${summary.clusterCount}
- Catalog products evaluated: ${summary.productCount}
- Products matched to Shopify Admin metadata: ${summary.adminCatalogMatchedProducts}
- Product feed generated: ${summary.productFeedGeneratedAt || "unknown"}
- Priority tiers: ${serializeCounts(summary.byTier)}
- Production gates: ${serializeCounts(summary.byGate)}

## Scoring Model

- 25% deduplicated traffic potential
- 20% commercial value
- 20% DollWOW inventory advantage
- 15% ranking feasibility
- 10% GEO and citation opportunity
- 10% existing DollWOW authority

## Highest-Priority Opportunities

| Rank | Cluster | Volume | Page type | Inventory | Traffic | Commercial | Feasibility | GEO | Authority | Score | Tier | Gate |
| ---: | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${top.map((row, index) => `| ${index + 1} | ${row.primaryKeyword} | ${row.combinedSearchVolume} | ${row.winningPageType} | ${row.inventorySupportCount} | ${row.trafficScore} | ${row.commercialValueScore} | ${row.rankingFeasibilityScore} | ${row.geoCitationScore} | ${row.existingAuthorityScore} | ${row.opportunityScore} | ${row.priorityTier} | ${row.productionGate} |`).join("\n")}

## Blocked, Held, Or Excluded

${blocked.length ? blocked.map((row) => `- ${row.primaryKeyword}: ${row.productionGate}; ${row.inventorySupportBasis}; ${row.recommendedNextStep}`).join("\n") : "None."}

## Interpretation Rules

- Search volume is log-normalized so one very broad term cannot erase the rest of the roadmap.
- Adult-query volume can be under-reported, so CPC, SERP activity, current rankings, catalog support, and intent remain visible as separate components.
- Brand hubs with no live authorized inventory are blocked regardless of demand.
- Collection opportunities require enough qualifying inventory to provide a useful, non-thin shopping experience.
- Technology topics receive citation value but limited inventory credit unless the catalog supports the claimed capabilities.
- A high score prioritizes further validation and URL mapping; it does not authorize unsupported claims or automatic publication.
`;
}

async function loadJson(source) {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not load ${source}: HTTP ${response.status}`);
    return response.json();
  }
  return JSON.parse(await fs.readFile(path.resolve(ROOT, source), "utf8"));
}

function productSearchText(product) {
  return [product.title, product.productType, product.sourceTitle, product.sourceHandle, ...(product.tags || []), ...(product.lookTags || [])].filter(Boolean).join(" ");
}

function inferBodyType(product) {
  const current = normalize(product.bodyType);
  if (current === "male" || current === "female") return current;
  const text = normalize(productSearchText(product));
  if (/\b(male|man|men|masculine|male doll|male dolls)\b/.test(text)) return "male";
  if (/\b(female|woman|women|feminine|female doll|female dolls)\b/.test(text)) return "female";
  return null;
}

async function fetchAdminCatalog() {
  if (!process.env.SHOPIFY_STORE_DOMAIN) return [];
  const products = [];
  let after = null;
  while (true) {
    const data = await adminFetch(`query SeoCatalog($first: Int!, $after: String) {
      products(first: $first, after: $after, sortKey: TITLE) {
        edges { node {
          handle title productType tags
          bodyType: metafield(namespace: "custom", key: "body_type") { value }
          lookTags: metafield(namespace: "custom", key: "look_tags") { value }
          sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
          sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
        } }
        pageInfo { hasNextPage endCursor }
      }
    }`, { first: 250, after });
    products.push(...data.products.edges.map(({ node }) => ({
      handle: node.handle,
      tags: node.tags || [],
      bodyType: inferBodyType({
        bodyType: node.bodyType?.value,
        title: node.title,
        productType: node.productType,
        sourceTitle: node.sourceTitle?.value,
        sourceHandle: node.sourceHandle?.value,
        tags: node.tags || []
      }),
      lookTags: parseJson(node.lookTags?.value) || [],
      sourceTitle: node.sourceTitle?.value || "",
      sourceHandle: node.sourceHandle?.value || ""
    })));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products;
}

async function adminFetch(query, variables) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const token = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `Shopify Admin API failed with HTTP ${response.status}.`);
  return payload.data;
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  if (tokenCache?.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) throw new Error("Shopify Admin credentials are unavailable.");
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET })
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || "Could not obtain Shopify Admin token.");
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000 };
  return tokenCache.accessToken;
}

async function loadLocalEnv() {
  try {
    const content = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 0) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

function parseJson(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
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

function minimum(values) {
  return values.length ? Math.min(...values.map(Number)) : null;
}

function round(value) {
  return Number(Number(value || 0).toFixed(2));
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
