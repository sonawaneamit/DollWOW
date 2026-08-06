import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(process.argv.slice(2).map((value, index, values) => [value, values[index + 1]]));
const officialPath = path.resolve(args.get("--official") || path.join(ROOT, "data/imports/rosretty-official.json"));
const referencePath = path.resolve(args.get("--reference") || path.join(ROOT, "data/imports/rosretty-yourdoll.json"));
const secondaryReferencePath = args.get("--secondary-reference")
  ? path.resolve(args.get("--secondary-reference"))
  : null;
const outputPath = path.resolve(args.get("--output") || path.join(ROOT, "data/exports/rosretty-review-manifest.json"));
const reviewPath = path.resolve(args.get("--review-html") || path.join(ROOT, "data/exports/rosretty-visual-review.html"));
const approvalsPath = args.get("--approvals")
  ? path.resolve(args.get("--approvals"))
  : path.join(ROOT, "data/imports/rosretty-visual-review-approvals.json");

const [officialSource, referenceSource, secondaryReferenceSource] = await Promise.all([
  readProducts(officialPath),
  readProducts(referencePath),
  secondaryReferencePath ? readProducts(secondaryReferencePath) : []
]);
const approvals = await readApprovals(approvalsPath);
const referenceSources = [...referenceSource, ...secondaryReferenceSource];

const products = officialSource.map((official) => {
  const candidates = referenceSources
    .map((reference) => scoreCandidate(official, reference))
    .sort((left, right) => right.score - left.score)
    .filter((candidate) => candidate.score >= 35)
    .slice(0, 3);
  const exactReview = findReview(approvals, official.sourceUrl, candidates[0]?.reference?.sourceUrl);
  const reviewedPair = exactReview || findReviewForOfficial(approvals, official.sourceUrl);
  const reviewedReference = referenceSources.find((reference) => reference.sourceUrl === reviewedPair?.referenceUrl);
  if (reviewedReference && !candidates.some((candidate) => candidate.reference.sourceUrl === reviewedReference.sourceUrl)) {
    candidates.unshift({
      reference: compactProduct(reviewedReference),
      score: reviewedPair.decision === "approved" ? 100 : 0,
      signals: [{ label: "manually reviewed gallery pair", value: 100, type: "review" }]
    });
  }
  const best = candidates[0];
  const closeScores = candidates.filter((candidate) => best && best.score - candidate.score <= 8).length;
  const review = findReview(approvals, official.sourceUrl, best?.reference?.sourceUrl) || reviewedPair;

  return {
    official: compactProduct(official),
    candidates,
    status: review?.decision === "approved"
      ? "approved-for-import"
      : review?.decision === "rejected"
        ? "candidate-rejected"
        : !best
          ? "no-credible-candidate"
          : best.score >= 70 && closeScores === 1
            ? "visual-review-required"
            : "ambiguous-review-required",
    reviewChecks: {
      specMatch: Boolean(best && best.signals.filter((signal) => signal.type === "spec").length >= 3),
      mediaCompared: Boolean(review),
      titleReviewed: Boolean(review),
      approvedForImport: review?.decision === "approved"
    },
    visualReview: {
      state: review?.decision || "pending",
      reviewer: review?.reviewer || null,
      note: review?.note || null,
      instruction: "Open the official and reference galleries side by side. Confirm face/head, body proportions, gallery identity, and the listed configuration before approving this pair.",
      officialPreview: primaryImage(official),
      candidatePreview: primaryImage(best?.reference),
      officialUrl: official.sourceUrl,
      candidateUrl: best?.reference?.sourceUrl ?? null
    }
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  policy: "A numeric score only finds candidates. No Rosretty product may be imported or published from this file until a reviewer marks the official-versus-reference gallery pair approved.",
  sourceFiles: { official: officialPath, reference: referencePath, secondaryReference: secondaryReferencePath, approvals: approvalsPath },
  totals: {
    officialProducts: products.length,
    strongCandidates: products.filter((product) => product.status === "visual-review-required").length,
    ambiguousOrMissing: products.filter((product) => ["ambiguous-review-required", "no-credible-candidate"].includes(product.status)).length,
    approvedForImport: products.filter((product) => product.status === "approved-for-import").length,
    rejectedAfterReview: products.filter((product) => product.status === "candidate-rejected").length
  },
  products
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(reviewPath, renderReviewPage(report));
console.log(JSON.stringify({ outputPath, reviewPath, totals: report.totals }, null, 2));

async function readProducts(filePath) {
  const source = JSON.parse(await fs.readFile(filePath, "utf8"));
  const products = Array.isArray(source) ? source : source.products;
  if (!Array.isArray(products)) throw new Error(`${filePath} must contain a products array.`);
  return products.map(normalizeProduct);
}

async function readApprovals(filePath) {
  try {
    const source = JSON.parse(await fs.readFile(filePath, "utf8"));
    const approvals = Array.isArray(source) ? source : source.approvals;
    if (!Array.isArray(approvals)) throw new Error("must contain an approvals array");
    return approvals;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw new Error(`Could not read Rosretty visual approvals at ${filePath}: ${error.message}`);
  }
}

function findReview(approvals, officialUrl, referenceUrl) {
  return approvals.find((approval) => approval.officialUrl === officialUrl && approval.referenceUrl === referenceUrl) ?? null;
}

function findReviewForOfficial(approvals, officialUrl) {
  return approvals.find((approval) => approval.officialUrl === officialUrl) ?? null;
}

function normalizeProduct(product) {
  const title = String(product.title || product.name || "").trim();
  const specs = product.specs || product.measurements || {};
  const imageUrls = unique([
    ...(product.imageUrls || product.images || []),
    product.imageUrl,
    product.featuredImage
  ].filter(Boolean));
  return {
    title,
    sourceUrl: product.sourceUrl || product.url || null,
    sku: product.sku || null,
    headId: inferHeadId(product.sku, title),
    imageUrls,
    heightCm: numberOrNull(product.heightCm ?? specs.heightCm ?? valueFrom(specs, "height")),
    cupSize: normalizeCup(product.cupSize ?? specs.cupSize ?? valueFrom(specs, "cup")),
    material: normalizeMaterial(product.material ?? specs.material ?? valueFrom(specs, "material") ?? title),
    measurements: normalizeMeasurements(product.measurements ?? specs),
    raw: product
  };
}

function scoreCandidate(official, reference) {
  const signals = [];
  let score = 0;
  const add = (value, label, type = "spec") => {
    score += value;
    signals.push({ label, value, type });
  };

  // A Rosretty head identifier is a stronger signal than a shared height or cup.
  // Different dolls often share a body specification, so known conflicting head IDs
  // are not useful candidates for the visual-review queue.
  if (official.headId && reference.headId && official.headId !== reference.headId) {
    return {
      reference: compactProduct(reference),
      score: 0,
      signals: [{ label: `different head ID (${official.headId} vs ${reference.headId})`, value: 0, type: "identity" }]
    };
  }
  if (official.headId && reference.headId && official.headId === reference.headId) {
    add(50, `same head ID (${official.headId})`, "identity");
  }

  if (official.heightCm && official.heightCm === reference.heightCm) add(22, `same height (${official.heightCm} cm)`);
  if (official.material && official.material === reference.material) add(18, `same material (${official.material})`);
  if (official.cupSize && official.cupSize === reference.cupSize) add(10, `same cup size (${official.cupSize})`);

  for (const key of ["bust", "waist", "hip", "footLength", "weightKg", "shoulderWidth", "legLength"]) {
    const officialValue = official.measurements[key];
    const referenceValue = reference.measurements[key];
    if (officialValue && referenceValue && Math.abs(officialValue - referenceValue) <= measurementTolerance(key)) {
      add(key === "bust" || key === "waist" || key === "hip" ? 10 : 5, `same ${labelFor(key)}`);
    }
  }

  const nameOverlap = overlappingWords(official.title, reference.title);
  if (nameOverlap.length) add(Math.min(12, nameOverlap.length * 4), `title overlap: ${nameOverlap.join(", ")}`, "title");

  return { reference: compactProduct(reference), score, signals };
}

function normalizeMeasurements(source) {
  return {
    bust: dimension(source, ["bust"]),
    waist: dimension(source, ["waist"]),
    hip: dimension(source, ["hip"]),
    footLength: dimension(source, ["foot", "feet length"]),
    weightKg: weight(source),
    shoulderWidth: dimension(source, ["shoulder"]),
    legLength: dimension(source, ["leg"])
  };
}

function dimension(source, names) {
  const raw = names.map((name) => valueFrom(source, name)).find(Boolean);
  const centimeters = String(raw || "").match(/(\d+(?:\.\d+)?)\s*cm/i);
  return centimeters ? Number(centimeters[1]) : numberOrNull(raw);
}

function weight(source) {
  const raw = valueFrom(source, "weight");
  const kilograms = String(raw || "").match(/(\d+(?:\.\d+)?)\s*kg/i);
  return kilograms ? Number(kilograms[1]) : numberOrNull(raw);
}

function valueFrom(source, needle) {
  const exact = Object.entries(source || {}).find(([key]) => String(key).toLowerCase().replace(/[^a-z]/g, "").includes(needle.replace(/[^a-z]/g, "")));
  return exact?.[1] ?? null;
}

function compactProduct(product) {
  if (!product) return null;
  return {
    title: product.title,
    sourceUrl: product.sourceUrl,
    sku: product.sku,
    headId: product.headId,
    imageUrls: product.imageUrls,
    heightCm: product.heightCm,
    cupSize: product.cupSize,
    material: product.material,
    measurements: product.measurements
  };
}

function inferHeadId(sku, title) {
  const source = `${sku || ""} ${title || ""}`.toUpperCase();
  const headReference = source.match(/\bHEAD\s*(?:#|NO\.?|NUMBER)?\s*(S\d{1,3})\b/);
  if (headReference) return headReference[1];
  const skuReference = source.match(/\b(?:RD|RS)[-_ ]?(S\d{1,3})[-_ ]/);
  return skuReference?.[1] ?? null;
}

function primaryImage(product) {
  return product?.imageUrls?.[0] ?? null;
}

function normalizeMaterial(value) {
  const text = String(value || "").toLowerCase();
  if (/silicone\s*head.*tpe|tpe.*silicone\s*head/.test(text)) return "silicone-head-tpe-body";
  if (/full\s*silicone|silicone/.test(text)) return "silicone";
  if (/tpe/.test(text)) return "tpe";
  return null;
}

function normalizeCup(value) {
  const match = String(value || "").match(/\b([a-z])\s*-?\s*cup\b/i);
  return match ? `${match[1].toUpperCase()}-Cup` : null;
}

function numberOrNull(value) {
  const number = Number(String(value ?? "").match(/\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : null;
}

function measurementTolerance(key) {
  return key === "weightKg" ? 1.5 : 1;
}

function labelFor(key) {
  return key.replace(/[A-Z]/g, (character) => ` ${character.toLowerCase()}`);
}

function overlappingWords(left, right) {
  const words = (value) => new Set(String(value).toLowerCase().match(/[a-z]{4,}/g) || []);
  const ignored = new Set(["doll", "rosretty", "silicone", "realistic", "lifelike", "small", "breasts", "head"]);
  const rightWords = words(right);
  return [...words(left)].filter((word) => rightWords.has(word) && !ignored.has(word));
}

function unique(values) {
  return [...new Set(values)];
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function renderReviewPage(report) {
  const cards = report.products.map((product, index) => {
    const best = product.candidates[0];
    return `<article class="pair">
      <p class="index">${index + 1}. ${escapeHtml(product.status.replace(/-/g, " "))}</p>
      <div class="grid">
        ${renderSide("Official Rosretty", product.official, product.visualReview.officialPreview)}
        ${renderSide("Comparison listing", best?.reference, product.visualReview.candidatePreview)}
      </div>
      <p class="score">${best ? `Candidate score: <strong>${best.score}</strong>. ${escapeHtml(best.signals.map((signal) => signal.label).join("; "))}` : "No credible comparison listing was found from the factual data. Keep this product out of the import queue until a reviewer finds and confirms the correct listing."}</p>
      <p class="instruction">${escapeHtml(product.visualReview.note || product.visualReview.instruction)}</p>
      <p class="index">Review: ${escapeHtml(product.visualReview.state)}${product.visualReview.reviewer ? ` by ${escapeHtml(product.visualReview.reviewer)}` : ""}</p>
    </article>`;
  }).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Rosretty Visual Review</title><style>
    body{margin:0;background:#130907;color:#f7e9df;font:16px/1.45 Arial,sans-serif}.wrap{max-width:1280px;margin:auto;padding:48px 24px}.pair{border:1px solid #684432;padding:24px;margin:24px 0;background:#1d0e0a}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.side{border:1px solid #513529;padding:16px}.side img{width:100%;height:460px;object-fit:contain;background:#080403}.index{color:#efbc98;text-transform:uppercase;letter-spacing:.12em}.score,.instruction{color:#d6c0b2}.link{color:#efbc98}@media(max-width:760px){.grid{grid-template-columns:1fr}.side img{height:360px}}
  </style></head><body><main class="wrap"><p class="index">Rosretty import gate</p><h1>Visual match review</h1><p>Scores identify candidates only. Do not import or publish until the paired galleries have been checked.</p>${cards}</main></body></html>`;
}

function renderSide(label, product, image) {
  if (!product) return `<section class="side"><h2>${label}</h2><p>No candidate found.</p></section>`;
  return `<section class="side"><p class="index">${label}</p><h2>${escapeHtml(product.title)}</h2>${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)}">` : ""}<p>${escapeHtml([product.heightCm && `${product.heightCm} cm`, product.cupSize, product.material].filter(Boolean).join(" · "))}</p>${product.sourceUrl ? `<a class="link" href="${escapeHtml(product.sourceUrl)}">Open source page</a>` : ""}</section>`;
}
