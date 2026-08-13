import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const preparedPath = path.resolve(ROOT, args.input || "data/exports/dollwow-irontech-both-current-storefront-products.json");
const duplicateReviewPath = path.resolve(
  ROOT,
  args.review || "data/exports/import-duplicate-review-2026-08-13T08-59-49-692Z.json"
);
const outputPath = path.resolve(ROOT, args.output || "data/exports/irontech-missing-draft-candidates.json");
const reportPath = path.resolve(ROOT, args.report || "data/exports/irontech-missing-draft-review.json");
const syncPaths = String(
  args.sync ||
    [
      "data/exports/shopify-rosemary-option-price-sync-irontech-dolls.json",
      "data/exports/shopify-rosemary-option-price-sync-irontech.json",
      "data/exports/shopify-rosemary-option-price-sync-irontech-doll.json"
    ].join(",")
)
  .split(",")
  .map((entry) => path.resolve(ROOT, entry.trim()));

const prepared = JSON.parse(await fs.readFile(preparedPath, "utf8"));
const duplicateReview = JSON.parse(await fs.readFile(duplicateReviewPath, "utf8"));
const syncRows = (
  await Promise.all(syncPaths.map(async (file) => JSON.parse(await fs.readFile(file, "utf8"))))
).flatMap((payload) => payload.products || []);

const mappedSourceUrls = new Map(
  syncRows.filter((row) => row.sourceUrl).map((row) => [canonicalUrl(row.sourceUrl), row])
);
const reviewBySource = new Map(
  duplicateReview.reviews.map((row) => [canonicalUrl(row.sourceUrl || ""), row])
);

const decisions = [];
const candidates = [];

for (const product of prepared) {
  const sourceUrl = canonicalUrl(product.sourceUrl);
  const mapped = mappedSourceUrls.get(sourceUrl);
  const duplicate = reviewBySource.get(sourceUrl);

  if (mapped) {
    decisions.push(decision(product, "existing", "Exact Rosemary source URL is already attached to a live DollWOW product.", {
      existingHandle: mapped.handle
    }));
    continue;
  }

  if (!duplicate || duplicate.recommendation !== "likely_safe_new_listing") {
    decisions.push(
      decision(
        product,
        "manual_review",
        duplicate?.notes || "No duplicate review result was available.",
        { recommendation: duplicate?.recommendation, liveCandidates: duplicate?.liveCandidates || [] }
      )
    );
    continue;
  }

  const nonCatalogReason = nonCatalogSourceReason(product);
  if (nonCatalogReason) {
    decisions.push(decision(product, "excluded_non_catalog", nonCatalogReason));
    continue;
  }

  const conflict = sourceConflict(product);
  if (conflict) {
    decisions.push(decision(product, "source_conflict", conflict));
    continue;
  }

  const optionIssue = optionStructureIssue(product);
  if (optionIssue) {
    decisions.push(decision(product, "option_review", optionIssue));
    continue;
  }

  candidates.push(product);
}

const consolidated = consolidateExactSourceIdentities(candidates, decisions);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(consolidated, null, 2), "utf8");

const summary = {
  prepared: prepared.length,
  existingExactSource: decisions.filter((row) => row.status === "existing").length,
  manualReview: decisions.filter((row) => row.status === "manual_review").length,
  excludedNonCatalog: decisions.filter((row) => row.status === "excluded_non_catalog").length,
  sourceConflicts: decisions.filter((row) => row.status === "source_conflict").length,
  optionReview: decisions.filter((row) => row.status === "option_review").length,
  consolidatedDuplicateSources: decisions.filter((row) => row.status === "consolidated_duplicate_source").length,
  draftCandidates: consolidated.length,
  candidateMaterials: countBy(consolidated, (product) => product.extended?.material || "Unknown"),
  candidateBodyTypes: countBy(consolidated, (product) => product.extended?.bodyType || "Unknown")
};

await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      inputs: {
        prepared: path.relative(ROOT, preparedPath),
        duplicateReview: path.relative(ROOT, duplicateReviewPath),
        syncReports: syncPaths.map((file) => path.relative(ROOT, file))
      },
      output: path.relative(ROOT, outputPath),
      summary,
      decisions
    },
    null,
    2
  ),
  "utf8"
);

console.log(
  JSON.stringify(
    {
      summary,
      candidates: path.relative(ROOT, outputPath),
      report: path.relative(ROOT, reportPath)
    },
    null,
    2
  )
);

function nonCatalogSourceReason(product) {
  const source = `${product.sourceUrl || ""} ${product.sourceTitle || ""}`.toLowerCase();
  if (/\bin-stock\b|ready[- ]to[- ]ship/.test(source)) {
    return "Regional warehouse inventory belongs in the stock reconciliation workflow, not the custom catalog import.";
  }
  if (/irontech-sex-doll-silicone-heads/.test(source) || (!product.extended?.heightCm && /\bheads?\b/.test(source))) {
    return "Generic head-library/reference page is not a standalone doll product.";
  }
  return null;
}

function sourceConflict(product) {
  const titleCup = String(product.sourceTitle || "").match(/\b(?:minus |plus )?([a-z]+)-cup\b/i)?.[1];
  const specCup = String(product.extended?.cupSize || "").replace(/-?cup/gi, "").trim();
  if (titleCup && specCup && titleCup.toLowerCase() !== specCup.toLowerCase()) {
    return `Source title says ${titleCup.toUpperCase()}-cup while the source specification table says ${specCup.toUpperCase()}-cup.`;
  }
  if (!product.priceRange?.minVariantPrice?.amount) return "Source product does not have a usable base price.";
  if (!product.images?.length) return "Source product does not have a usable gallery.";
  return null;
}

function optionStructureIssue(product) {
  const groups = product.extended?.customizationGroups || [];
  if (!groups.length) return "No supplier customization groups were captured.";
  for (const group of groups) {
    if (!group.id || !group.label || !Array.isArray(group.options) || group.options.length < 2) {
      return `Malformed customization group: ${group.label || group.id || "unknown"}.`;
    }
    if (group.selectionMode === "multiple" && group.required) {
      return `Multi-select group is incorrectly marked required: ${group.label}.`;
    }
  }
  return null;
}

function consolidateExactSourceIdentities(products, decisionRows) {
  const groups = new Map();
  for (const product of products) {
    const key = exactSourceIdentity(product);
    const group = groups.get(key) || [];
    group.push(product);
    groups.set(key, group);
  }

  const kept = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      kept.push(group[0]);
      continue;
    }

    const ranked = [...group].sort((left, right) => productCompleteness(right) - productCompleteness(left));
    const primary = mergeProductImages(ranked[0], ranked.slice(1));
    kept.push(primary);
    for (const duplicate of ranked.slice(1)) {
      decisionRows.push(
        decision(
          duplicate,
          "consolidated_duplicate_source",
          "Same public name, body, head, material, size, and series as the retained source listing; unique gallery images were merged into one draft.",
          { retainedSourceUrl: primary.sourceUrl }
        )
      );
    }
  }

  return kept;
}

function exactSourceIdentity(product) {
  return [
    normalizedSourceName(product.sourceTitle),
    product.extended?.heightCm,
    product.extended?.cupSize,
    product.extended?.headModel,
    product.extended?.material,
    sourceSeries(product)
  ]
    .map((value) => normalize(value))
    .join("|");
}

function normalizedSourceName(title) {
  return String(title || "")
    .replace(/^\s*\d+(?:t)?cm[^–—]*[–—-]\s*/i, "")
    .replace(/\b(?:silicone head|silicone|tpe) sex doll\b/gi, "")
    .replace(/\s*\(head\s+[^)]+\)\s*$/i, "")
    .trim();
}

function sourceSeries(product) {
  const text = `${product.sourceTitle || ""} ${product.sourceUrl || ""}`.toLowerCase();
  return [
    /oriental/.test(text) ? "oriental" : "standard",
    /young-series|\birn\b/.test(text) ? "young" : "standard-age",
    /ros max/.test(text) ? "ros-max" : "standard-head",
    /\b2\.0\b/.test(text) ? "2.0" : "standard-body"
  ].join("|");
}

function mergeProductImages(primary, duplicates) {
  const images = new Map((primary.images || []).map((image) => [canonicalImageUrl(image.url), image]));
  for (const duplicate of duplicates) {
    for (const image of duplicate.images || []) {
      if (!images.has(canonicalImageUrl(image.url))) images.set(canonicalImageUrl(image.url), image);
    }
  }
  const merged = [...images.values()];
  return {
    ...primary,
    images: merged,
    featuredImage: primary.featuredImage || merged[0] || null,
    reviewFlags: {
      ...(primary.reviewFlags || {}),
      consolidatedSourceUrls: duplicates.map((product) => product.sourceUrl)
    }
  };
}

function productCompleteness(product) {
  return (product.images?.length || 0) * 10 + (product.extended?.customizationGroups?.length || 0) * 3 + String(product.description || "").length;
}

function decision(product, status, reason, extra = {}) {
  return {
    status,
    reason,
    handle: product.handle,
    title: product.title,
    sourceTitle: product.sourceTitle,
    sourceUrl: product.sourceUrl,
    ...extra
  };
}

function countBy(rows, getter) {
  return rows.reduce((counts, row) => {
    const key = getter(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return String(value || "").replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}

function canonicalImageUrl(value) {
  return canonicalUrl(value).replace(/-\d+x\d+(?=\.[^.]+$)/i, "").toLowerCase();
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const next = argv[index + 1];
    parsed[token.slice(2)] = next && !next.startsWith("--") ? next : true;
    if (next && !next.startsWith("--")) index += 1;
  }
  return parsed;
}
