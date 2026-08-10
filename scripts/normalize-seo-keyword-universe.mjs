import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const dateStamp = generatedAt.slice(0, 10);
const step2Dir = path.resolve(
  ROOT,
  args.step2Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-02-keyword-universe")
);
const step3Dirs = String(
  args.step3Dir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-03-live-metrics-serps")
).split(",").map((value) => path.resolve(ROOT, value.trim())).filter(Boolean);
const outputDir = path.resolve(
  ROOT,
  args.outDir || path.join("data", "exports", "seo-intelligence", dateStamp, "step-04-normalized-keywords")
);
const reportPath = path.resolve(
  ROOT,
  args.report || path.join("docs", "seo-intelligence", `${dateStamp}-step-04-normalized-keywords.md`)
);

const BRAND_ALIASES = new Map([
  ["ai tech", "Ai-Tech"],
  ["ai tech dolls", "Ai-Tech"],
  ["avant doll", "Avant Doll"],
  ["climax doll", "Climax Doll"],
  ["doll castle", "Dolls Castle"],
  ["dolls castle", "Dolls Castle"],
  ["erovenus", "Erovenus"],
  ["fanreal", "Fanreal"],
  ["funwest", "FunWest"],
  ["galatea", "Galatea"],
  ["hr doll", "HR Dolls"],
  ["il doll", "IL Doll"],
  ["irontech", "Irontech Dolls"],
  ["irontech doll", "Irontech Dolls"],
  ["irontech dolls", "Irontech Dolls"],
  ["irontch dolls", "Irontech Dolls"],
  ["jarliet", "Jarliet Dolls"],
  ["jarliet dolls", "Jarliet Dolls"],
  ["jy doll", "JY Doll"],
  ["moonvale", "Moonvale"],
  ["moonvale dolls", "Moonvale"],
  ["piper doll", "Piper Dolls"],
  ["piper dolls", "Piper Dolls"],
  ["real lady", "Real Lady"],
  ["rosretty", "Rosretty"],
  ["se doll", "SE Doll"],
  ["sedoll", "SE Doll"],
  ["starpery", "Starpery Dolls"],
  ["starpery dolls", "Starpery Dolls"],
  ["sy doll", "SY Dolls"],
  ["sy dolls", "SY Dolls"],
  ["tantaly", "Tantaly"],
  ["wm", "WM Dolls"],
  ["wm doll", "WM Dolls"],
  ["wm dolls", "WM Dolls"],
  ["yl doll", "YL Dolls"],
  ["yl dolls", "YL Dolls"],
  ["zelex", "Zelex"],
  ["zelex doll", "Zelex"],
  ["zelex dolls", "Zelex"],
  ["6ye", "6YE Dolls"],
  ["6ye doll", "6YE Dolls"],
  ["6ye dolls", "6YE Dolls"]
]);

const COMPETITOR_ALIASES = new Map([
  ["best real doll", "BestRealDoll"],
  ["bestrealdoll", "BestRealDoll"],
  ["better love doll", "BetterLoveDoll"],
  ["betterlovedoll", "BetterLoveDoll"],
  ["exdoll", "EXDoll"],
  ["joy love dolls", "JoyLoveDolls"],
  ["joylovedolls", "JoyLoveDolls"],
  ["my robot doll", "MyRobotDoll"],
  ["myrobotdoll", "MyRobotDoll"],
  ["real sex doll", "RealSexDoll"],
  ["realdoll", "RealDoll"],
  ["realsexdoll", "RealSexDoll"],
  ["realbotix", "Realbotix"],
  ["rosemary doll", "RosemaryDoll"],
  ["rosemarydoll", "RosemaryDoll"],
  ["sex doll tech", "SexDollTech"],
  ["sexdolltech", "SexDollTech"],
  ["silicon wives", "Silicon Wives"],
  ["siliconwives", "Silicon Wives"],
  ["spartan lover", "SpartanLover"],
  ["spartanlover", "SpartanLover"],
  ["uloversdoll", "ULoversDoll"],
  ["u lovers doll", "ULoversDoll"],
  ["your doll", "YourDoll"],
  ["yourdoll", "YourDoll"]
]);

const MATERIALS = [
  ["tpe", "TPE"],
  ["silicone", "Silicone"],
  ["latex", "Latex"],
  ["hybrid", "Hybrid"]
];
const AUDIENCES = [
  ["male", "Male"],
  ["female", "Female"],
  ["futa", "Futa"],
  ["gay", "Gay buyers"],
  ["for women", "Women buyers"],
  ["for men", "Men buyers"]
];
const APPEARANCE = [
  ["asian", "Asian"],
  ["black", "Black"],
  ["african", "African"],
  ["japanese", "Japanese"],
  ["latina", "Latina"],
  ["brunette", "Brunette"],
  ["blonde", "Blonde"],
  ["redhead", "Redhead"],
  ["anime", "Anime-inspired"]
];
const FORM = [
  ["torso", "Torso"],
  ["mini", "Mini"],
  ["petite", "Petite"],
  ["lightweight", "Lightweight"],
  ["life size", "Life size"],
  ["full size", "Full size"],
  ["small", "Small"],
  ["curvy", "Curvy"],
  ["plump", "Plump"],
  ["bbw", "BBW"],
  ["slim", "Slim"]
];
const MODIFIERS = [
  ["best", "best"],
  ["review", "review"],
  ["reviews", "review"],
  ["cost", "cost"],
  ["price", "price"],
  ["cheap", "budget"],
  ["affordable", "budget"],
  ["buy", "buy"],
  ["for sale", "for-sale"],
  ["custom", "custom"],
  ["ready to ship", "ready-to-ship"],
  ["shipping", "shipping"],
  ["discreet", "privacy"],
  ["legal", "legal"],
  ["clean", "cleaning"],
  ["care", "care"],
  ["storage", "storage"],
  ["repair", "repair"],
  ["alternatives", "alternatives"],
  [" vs ", "comparison"],
  ["compare", "comparison"],
  ["how", "question-how"],
  ["what", "question-what"]
];

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const universe = JSON.parse(await fs.readFile(path.join(step2Dir, "candidate-keyword-universe.json"), "utf8"));
const metricRows = (await Promise.all(step3Dirs.map((dir) => readOptionalJson(path.join(dir, "keyword-metrics.json"), [])))).flat();
const selectedSerps = (await Promise.all(step3Dirs.map((dir) => readOptionalJson(path.join(dir, "selected-serp-keywords.json"), [])))).flat();
const normalizedSerps = (await Promise.all(step3Dirs.map((dir) => readOptionalJson(path.join(dir, "normalized-serps.json"), [])))).flat();
const expandedUniverse = [...universe];
const universeKeys = new Set(universe.map((row) => normalizePhrase(row.normalizedKeyword || row.keyword)));
for (const row of metricRows) {
  const normalized = normalizePhrase(row.normalizedKeyword || row.keyword);
  if (!normalized || universeKeys.has(normalized)) continue;
  universeKeys.add(normalized);
  expandedUniverse.push({
    keyword: row.keyword,
    normalizedKeyword: normalized,
    sourceTypes: "coverage_addendum_seed",
    sourceIds: "coverage_addendum",
    sourceUrls: "",
    sourceOccurrenceCount: 1,
    competitorDomainCount: 0,
    competitorDomains: "",
    searchVolume: row.searchVolume ?? null,
    cpc: row.cpc ?? null,
    competition: row.competition ?? null,
    keywordDifficulty: null,
    bestCompetitorRank: null
  });
}
const metricMap = new Map(metricRows.map((row) => [normalizePhrase(row.normalizedKeyword || row.keyword), row]));
const selectedMap = new Map(selectedSerps.map((row) => [normalizePhrase(row.normalizedKeyword || row.keyword), row]));
const serpMap = buildSerpMap(normalizedSerps);

const retainedVariants = [];
const rejected = [];

for (const row of expandedUniverse) {
  const normalized = normalizePhrase(row.normalizedKeyword || row.keyword);
  const corrected = correctPhrase(normalized);
  const rejectionReasons = rejectionReasonsFor(row, corrected);
  if (rejectionReasons.length) {
    rejected.push({
      keyword: row.keyword,
      normalizedKeyword: normalized,
      correctedKeyword: corrected,
      reasons: rejectionReasons.join("|"),
      primaryReason: rejectionReasons[0],
      sourceTypes: row.sourceTypes,
      competitorDomainCount: row.competitorDomainCount,
      searchVolume: row.searchVolume,
      sourceOccurrenceCount: row.sourceOccurrenceCount
    });
    continue;
  }

  const metrics = metricMap.get(normalized) || metricMap.get(corrected) || {};
  const selected = selectedMap.get(normalized) || selectedMap.get(corrected) || {};
  const serpEvidence = serpMap.get(normalized) || serpMap.get(corrected) || {};
  const annotations = annotateKeyword(corrected, row);
  retainedVariants.push({
    keyword: row.keyword,
    normalizedKeyword: normalized,
    correctedKeyword: corrected,
    variantKey: variantKey(corrected),
    sourceTypes: row.sourceTypes,
    sourceIds: row.sourceIds,
    sourceUrls: row.sourceUrls,
    sourceOccurrenceCount: row.sourceOccurrenceCount,
    competitorDomainCount: row.competitorDomainCount,
    competitorDomains: row.competitorDomains,
    searchVolume: metrics.searchVolume ?? row.searchVolume ?? null,
    priorSearchVolume: row.searchVolume ?? null,
    cpc: metrics.cpc ?? row.cpc ?? null,
    competition: metrics.competition ?? row.competition ?? null,
    keywordDifficulty: row.keywordDifficulty ?? null,
    bestCompetitorRank: row.bestCompetitorRank ?? null,
    freshMetrics: Boolean(metrics.hasFreshMetrics),
    selectedForStep3Serp: Boolean(selected.keyword),
    liveSerpDevices: (serpEvidence.devices || []).join("|"),
    liveSerpOrganicRows: serpEvidence.organicRows || 0,
    ...annotations
  });
}

const canonicalKeywords = buildCanonicalKeywords(retainedVariants);
const taxonomy = buildTaxonomy(canonicalKeywords, retainedVariants, rejected);
const accounting = retainedVariants.length + rejected.length;
const gatePassed = accounting === expandedUniverse.length && rejected.every((row) => row.primaryReason) && retainedVariants.every((row) => row.variantKey);
const summary = {
  generatedAt,
  rawCandidates: expandedUniverse.length,
  retainedVariants: retainedVariants.length,
  canonicalKeywords: canonicalKeywords.length,
  rejectedKeywords: rejected.length,
  accounting,
  retainedWithFreshMetrics: retainedVariants.filter((row) => row.freshMetrics).length,
  retainedWithLiveSerps: retainedVariants.filter((row) => row.liveSerpDevices).length,
  rejectionReasons: countMultiValues(rejected, "reasons"),
  taxonomy,
  completionGate: {
    status: gatePassed ? "Passed" : "Failed",
    criteria: "Every raw candidate is retained under one canonical variant key or rejected with an explicit reason."
  },
  cost: 0
};

await writeJson(path.join(outputDir, "canonical-keywords.json"), canonicalKeywords);
await fs.writeFile(path.join(outputDir, "canonical-keywords.csv"), toCsv(canonicalKeywords), "utf8");
await writeJson(path.join(outputDir, "keyword-variant-map.json"), retainedVariants);
await fs.writeFile(path.join(outputDir, "keyword-variant-map.csv"), toCsv(retainedVariants), "utf8");
await writeJson(path.join(outputDir, "rejected-keywords.json"), rejected);
await fs.writeFile(path.join(outputDir, "rejected-keywords.csv"), toCsv(rejected), "utf8");
await writeJson(path.join(outputDir, "entity-modifier-taxonomy.json"), taxonomy);
await writeJson(path.join(outputDir, "normalization-rules.json"), normalizationRules());
await writeJson(path.join(outputDir, "step-04-summary.json"), summary);
await fs.writeFile(reportPath, renderReport(summary, canonicalKeywords), "utf8");

console.log("Completed Step 4 keyword normalization and annotation.");
console.log(`Raw candidates: ${summary.rawCandidates}`);
console.log(`Retained variants: ${retainedVariants.length}`);
console.log(`Canonical keywords: ${canonicalKeywords.length}`);
console.log(`Rejected keywords: ${rejected.length}`);
console.log(`Completion gate: ${summary.completionGate.status}`);
console.log(`Artifacts: ${path.relative(ROOT, outputDir)}`);
console.log(`Report: ${path.relative(ROOT, reportPath)}`);

function rejectionReasonsFor(row, phrase) {
  const reasons = [];
  const sourceTypes = splitPipe(row.sourceTypes);
  const onlyProductEntity = sourceTypes.length > 0 && sourceTypes.every((type) => ["catalog_product_title"].includes(type));
  if (onlyProductEntity) reasons.push("catalog_pdp_entity_not_content_keyword");
  if (!phrase || phrase.length < 2) reasons.push("empty_or_too_short");
  if (phrase.length > 100 || phrase.split(" ").length > 12) reasons.push("malformed_or_overlong");
  if (/\b(2020|2021|2022|2023|2024|2025)\b/.test(phrase)) reasons.push("stale_year_modifier");
  if (/\b(child|children|kid|kids|toddler|underage|schoolgirl|school girl|teen doll|little girl)\b/.test(phrase)) reasons.push("prohibited_or_underage_coded");
  if (/\b(porn|nude|naked|pictures?|photos?|videos?|gallery|hentai)\b/.test(phrase)) reasons.push("media_seeking_not_commerce_content");
  if (/\b(barbie|bratz|monster high|american girl|porcelain|reborn|dollhouse|action figure|funko|lego|gundam|transformers|power rangers|pokemon|disney|r2d2|robot dog|robot chicken|robot toy|toy robot|teddy|puppet|figurine|plush|mattel|tonner|smart doll|baby doll|doll clothes|doll furniture|doll repair kit|body pillow|sweet love doll|shotgun love dolls)\b/.test(phrase)) reasons.push("unrelated_toy_collectible_or_accessory");
  if (/\b(wild robot|tesla robot|optimus robot|military robot|robot vacuum|robot litter|robot car|robot puppy|robot kit|robot costume|robot game|robot wars|robot city|robot bird|robot hamster|robot dragon|robot cops|robot villains|robot pokemon)\b/.test(phrase)) reasons.push("unrelated_robot_query");
  if (/^(height \d|hair |body type|cup |skin tone|customization$)/.test(phrase)) reasons.push("generated_route_label_not_search_query");
  if (!hasIndustryRelevance(row, phrase)) reasons.push("no_adult_doll_or_competitor_relevance");
  return unique(reasons);
}

function hasIndustryRelevance(row, phrase) {
  const adultContext = /\b(sex dolls?|love dolls?|companion dolls?|adult dolls?|real dolls?|lifelike dolls?|tpe dolls?|silicone dolls?|sex robots?|robotic sex dolls?|sexbots?|male sex dolls?|female sex dolls?|futa sex dolls?)\b/.test(phrase);
  const knownBrand = findEntities(phrase, BRAND_ALIASES, true).length > 0;
  const competitor = findCompetitors(phrase).length > 0;
  const existingEvidence = splitPipe(row.sourceTypes).some((type) => type.startsWith("existing_"));
  const qualifiedGeneric = existingEvidence && /\b(dolls?|tpe|silicone|sexbot|sex robot)\b/.test(phrase) && /\b(male|female|asian|black|brunette|blonde|custom|ready to ship|care|clean|storage|legal|shipping|cost|price|review|material|size|height|torso|mini|petite|lightweight)\b/.test(phrase);
  const competitorBackedAdjacent = Number(row.competitorDomainCount || 0) >= 2 && /\b(life ?size dolls?|doll for girlfriend|male torso|sex torso|sexy dolls?|ai dolls?|a i dolls?|artificial intelligence dolls?|female robots?|sexy robots?)\b/.test(phrase);
  const industryTechnology = Number(row.competitorDomainCount || 0) >= 1 && /\b(gynoid|realbotix|exdoll)\b/.test(phrase);
  return adultContext || knownBrand || competitor || qualifiedGeneric || competitorBackedAdjacent || industryTechnology;
}

function annotateKeyword(phrase, row) {
  const brands = findEntities(phrase, BRAND_ALIASES, true);
  const competitors = findCompetitors(phrase);
  const materials = findFromPairs(phrase, MATERIALS);
  const audiences = findFromPairs(phrase, AUDIENCES);
  const appearances = findFromPairs(phrase, APPEARANCE);
  const forms = findFromPairs(phrase, FORM);
  const modifiers = findFromPairs(` ${phrase} `, MODIFIERS);
  const sourceTypes = splitPipe(row.sourceTypes);
  return {
    brands: brands.join("|"),
    competitorEntities: competitors.join("|"),
    materials: materials.join("|"),
    audiences: audiences.join("|"),
    appearanceEntities: appearances.join("|"),
    formEntities: forms.join("|"),
    modifiers: modifiers.join("|"),
    queryShape: queryShape(phrase),
    catalogEvidence: sourceTypes.some((type) => type.startsWith("catalog_")),
    existingDollWowTarget: sourceTypes.some((type) => type.startsWith("existing_")),
    competitorEvidence: sourceTypes.includes("competitor_ranked_keyword"),
    dataForSeoIdeaEvidence: sourceTypes.includes("dataforseo_keyword_idea")
  };
}

function buildCanonicalKeywords(variants) {
  const groups = new Map();
  for (const row of variants) {
    const group = groups.get(row.variantKey) || [];
    group.push(row);
    groups.set(row.variantKey, group);
  }
  return [...groups.entries()]
    .map(([key, rows]) => {
      const sorted = [...rows].sort((a, b) => canonicalPreference(b) - canonicalPreference(a));
      const canonical = sorted[0];
      return {
        canonicalKeyword: canonical.correctedKeyword,
        variantKey: key,
        variants: unique(rows.map((row) => row.keyword)).join("|"),
        variantCount: rows.length,
        searchVolume: Math.max(...rows.map((row) => Number(row.searchVolume || 0))),
        cpc: maxNullable(rows.map((row) => row.cpc)),
        keywordDifficulty: minNullable(rows.map((row) => row.keywordDifficulty)),
        competitorDomainCount: Math.max(...rows.map((row) => Number(row.competitorDomainCount || 0))),
        bestCompetitorRank: minNullable(rows.map((row) => row.bestCompetitorRank)),
        sourceTypes: unionPipe(rows, "sourceTypes"),
        competitorDomains: unionPipe(rows, "competitorDomains"),
        brands: unionPipe(rows, "brands"),
        competitorEntities: unionPipe(rows, "competitorEntities"),
        materials: unionPipe(rows, "materials"),
        audiences: unionPipe(rows, "audiences"),
        appearanceEntities: unionPipe(rows, "appearanceEntities"),
        formEntities: unionPipe(rows, "formEntities"),
        modifiers: unionPipe(rows, "modifiers"),
        queryShapes: unique(rows.map((row) => row.queryShape)).join("|"),
        catalogEvidence: rows.some((row) => row.catalogEvidence),
        existingDollWowTarget: rows.some((row) => row.existingDollWowTarget),
        competitorEvidence: rows.some((row) => row.competitorEvidence),
        freshMetrics: rows.some((row) => row.freshMetrics),
        selectedForStep3Serp: rows.some((row) => row.selectedForStep3Serp),
        liveSerpDevices: unionPipe(rows, "liveSerpDevices"),
        liveSerpOrganicRows: rows.reduce((sum, row) => sum + Number(row.liveSerpOrganicRows || 0), 0)
      };
    })
    .sort((a, b) => Number(b.selectedForStep3Serp) - Number(a.selectedForStep3Serp) || b.competitorDomainCount - a.competitorDomainCount || b.searchVolume - a.searchVolume);
}

function canonicalPreference(row) {
  let score = Number(row.competitorDomainCount || 0) * 40 + Math.log10(Number(row.searchVolume || 0) + 1) * 20;
  score += row.existingDollWowTarget ? 25 : 0;
  score += row.catalogEvidence ? 20 : 0;
  score += row.freshMetrics ? 15 : 0;
  score += row.selectedForStep3Serp ? 20 : 0;
  if (/\bsex dolls\b/.test(row.correctedKeyword)) score += 8;
  if (/\b(sec doll|sexdall)\b/.test(row.normalizedKeyword)) score -= 30;
  return score;
}

function buildTaxonomy(canonical, variants, rejectedRows) {
  return {
    canonicalKeywordCount: canonical.length,
    variantCount: variants.length,
    rejectionCount: rejectedRows.length,
    brands: countPipeValues(canonical, "brands"),
    competitorEntities: countPipeValues(canonical, "competitorEntities"),
    materials: countPipeValues(canonical, "materials"),
    audiences: countPipeValues(canonical, "audiences"),
    appearances: countPipeValues(canonical, "appearanceEntities"),
    forms: countPipeValues(canonical, "formEntities"),
    modifiers: countPipeValues(canonical, "modifiers"),
    queryShapes: countPipeValues(canonical, "queryShapes")
  };
}

function buildSerpMap(serps) {
  const map = new Map();
  for (const serp of serps) {
    const key = normalizePhrase(serp.normalizedKeyword || serp.keyword);
    const current = map.get(key) || { devices: new Set(), organicRows: 0 };
    current.devices.add(serp.device);
    current.organicRows += Number(serp.organicResults?.length || 0);
    map.set(key, current);
  }
  return new Map([...map.entries()].map(([key, value]) => [key, { devices: [...value.devices], organicRows: value.organicRows }]));
}

function findEntities(phrase, aliases, allowContained = false) {
  const values = [];
  for (const [alias, label] of aliases) {
    const matches = allowContained ? containsPhrase(phrase, alias) : phrase === alias;
    if (matches) values.push(label);
  }
  return unique(values);
}

function findCompetitors(phrase) {
  const values = [];
  for (const [alias, label] of COMPETITOR_ALIASES) {
    if (phrase === alias || (containsPhrase(phrase, alias) && /\b(alternative|alternatives|review|reviews|vs|compare|coupon|shipping)\b/.test(phrase))) values.push(label);
  }
  return unique(values);
}

function findFromPairs(phrase, pairs) {
  return unique(pairs.filter(([needle]) => containsPhrase(phrase, needle.trim())).map(([, label]) => label));
}

function containsPhrase(phrase, needle) {
  return ` ${phrase} `.includes(` ${needle} `);
}

function queryShape(phrase) {
  if (/^(how|what|why|where|when|which|can|are|is|do|does|should)\b/.test(phrase)) return "question";
  if (/\b(vs|versus|compare|comparison|difference)\b/.test(phrase)) return "comparison";
  if (/\balternatives?\b/.test(phrase)) return "alternative";
  if (/\b(review|reviews)\b/.test(phrase)) return "review";
  if (findCompetitors(phrase).length) return "competitor-navigation";
  if (findEntities(phrase, BRAND_ALIASES, true).length) return "brand";
  if (/\b(clean|care|storage|repair|legal|shipping|warranty|return|privacy)\b/.test(phrase)) return "ownership-or-trust";
  if (/\b(best|buy|price|cost|cheap|sale|custom|ready to ship)\b/.test(phrase)) return "commercial-modifier";
  return "category-or-topic";
}

function correctPhrase(value) {
  return normalizePhrase(value)
    .replace(/\bsexdolls\b/g, "sex dolls")
    .replace(/\bsexdoll\b/g, "sex doll")
    .replace(/\bsexdalls\b/g, "sex dolls")
    .replace(/\bsexdall\b/g, "sex doll")
    .replace(/\blovedolls\b/g, "love dolls")
    .replace(/\blovedoll\b/g, "love doll")
    .replace(/\bsec dolls\b/g, "sex dolls")
    .replace(/\bsec doll\b/g, "sex doll")
    .replace(/\btp e\b/g, "tpe")
    .replace(/\birontch\b/g, "irontech")
    .replace(/\s+/g, " ")
    .trim();
}

function variantKey(phrase) {
  return phrase
    .split(" ")
    .map((token) => ({ dolls: "doll", reviews: "review", stores: "store", brands: "brand", prices: "price", costs: "cost", robots: "robot", alternatives: "alternative" })[token] || token)
    .join(" ");
}

function normalizePhrase(value) {
  return String(value || "").toLowerCase().replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizationRules() {
  return {
    generatedAt,
    principles: [
      "Preserve source lineage and raw wording in the variant map.",
      "Correct joined spellings and obvious industry typos before grouping.",
      "Group conservative singular/plural variants without merging different search intent.",
      "Keep catalog product titles in PDP SEO, not in the content keyword universe unless another source supplies demand evidence.",
      "Reject unrelated toys, collectibles, generic robots, media-seeking queries, stale years, and prohibited underage-coded terms.",
      "Retain catalog brands and explicit competitor-navigation or alternatives demand."
    ],
    brandAliases: Object.fromEntries(BRAND_ALIASES),
    competitorAliases: Object.fromEntries(COMPETITOR_ALIASES)
  };
}

function renderReport(summary, canonical) {
  const topReasons = Object.entries(summary.rejectionReasons).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const topKeywords = canonical.slice(0, 40);
  return `# Step 4: Normalized Keyword Universe

Generated: ${summary.generatedAt}

## Completion Gate

Status: ${summary.completionGate.status}

${summary.completionGate.criteria}

## Totals

- Raw candidates: ${summary.rawCandidates}
- Retained variants: ${summary.retainedVariants}
- Canonical keywords: ${summary.canonicalKeywords}
- Rejected keywords: ${summary.rejectedKeywords}
- Accounted candidates: ${summary.accounting}
- Retained variants with fresh metrics: ${summary.retainedWithFreshMetrics}
- Retained variants with live SERPs: ${summary.retainedWithLiveSerps}
- API cost: $0.0000

## Rejection Reasons

| Reason | Rows |
| --- | ---: |
${topReasons.map(([reason, count]) => `| ${reason} | ${count} |`).join("\n")}

## Highest-Evidence Canonical Keywords

| Keyword | Variants | Volume | Competitors | Existing target | Catalog evidence | Live SERPs |
| --- | ---: | ---: | ---: | --- | --- | --- |
${topKeywords.map((row) => `| ${row.canonicalKeyword} | ${row.variantCount} | ${row.searchVolume || 0} | ${row.competitorDomainCount} | ${row.existingDollWowTarget ? "yes" : "no"} | ${row.catalogEvidence ? "yes" : "no"} | ${row.liveSerpDevices || ""} |`).join("\n")}

## Handoff To Step 5

- Use \`canonical-keywords.json\` as the candidate node table.
- Use \`keyword-variant-map.json\` for source lineage and phrase variants.
- Use Step 3 desktop/mobile organic results to calculate weighted SERP overlap.
- Keep \`rejected-keywords.json\` as the audit trail and inspect high-volume rejections before final tier-one approval.
`;
}

function unionPipe(rows, key) {
  return unique(rows.flatMap((row) => splitPipe(row[key]))).join("|");
}

function countPipeValues(rows, key) {
  const counts = {};
  for (const row of rows) {
    for (const value of splitPipe(row[key])) counts[value] = (counts[value] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

function countMultiValues(rows, key) {
  const counts = {};
  for (const row of rows) {
    for (const value of splitPipe(row[key])) counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function maxNullable(values) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? Math.max(...numbers) : null;
}

function minNullable(values) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? Math.min(...numbers) : null;
}

function splitPipe(value) {
  return String(value || "").split("|").map((item) => item.trim()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function readOptionalJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
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
