#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
await loadEnv(path.join(ROOT, ".env.local"));

const VENICE_ENDPOINT = "https://api.venice.ai/api/v1/chat/completions";
const WRITER_MODEL = process.env.PDP_EDITORIAL_WRITER_MODEL || "gemma-4-uncensored";
const REVIEWER_MODEL = process.env.PDP_EDITORIAL_REVIEWER_MODEL || "venice-uncensored-1-2";
const inputPath = process.argv[2] || "data/exports/pdp-phase/full-body-editorial-production-final-v6.json";
const heldPath = process.argv[3] || "data/exports/pdp-phase/full-body-editorial-held-v6.json";
const outputPath = process.argv[4] || "data/exports/pdp-phase/full-body-editorial-hold-recovery-v1.json";
const previousPath = process.argv[5];

if (!process.env.VENICE_API_KEY) throw new Error("VENICE_API_KEY is required");

const production = JSON.parse(await fs.readFile(inputPath, "utf8"));
const held = JSON.parse(await fs.readFile(heldPath, "utf8"));
const productionRecords = production.results || production.records || [];
const productionByHandle = new Map(productionRecords.map((record) => [record.handle, record]));
const previous = previousPath ? JSON.parse(await fs.readFile(previousPath, "utf8")) : { records: [] };
const previousByHandle = new Map((previous.records || []).map((record) => [record.handle, record]));
const reviewable = held.records.filter((record) => {
  if (record.status !== "draft_needs_human_review") return false;
  return previousByHandle.get(record.handle)?.publishable !== true;
});

const writerPrompt = `Revise one rejected DollWOW adult-commerce editorial introduction.

Return strict JSON with eyebrow, heading, and paragraph only. Keep the paragraph between 90 and 130 words.

Write premium, sensual, erotically persuasive American English for a clearly adult sex doll. Preserve the useful product-specific visual scenario and distinctive details in the rejected draft, but fix every supplied rejection reason.

Verified catalog facts may appear naturally when correct. Never contradict or extend them. Treat wardrobe, props, and surroundings as visible styling, not included merchandise. Do not invent material feel, warmth, scent, capabilities, availability, shipping, price, warranty, performance, or buyer outcomes. Do not discuss a photo, gallery, studio, prompt, evidence, SEO, specifications, or content production. Avoid cheap generic filler and stock AI phrasing. Do not use an em dash or the construction "not just X, but Y." Every subject is an adult.`;

const reviewerPrompt = `Audit only the supplied revised adult fantasy copy. Return strict JSON with passed, violations, and notes.

Fail only when the draft contradicts verified catalog facts or neutral visual evidence; invents a real product capability, included item, commerce promise, material property, or buyer outcome; leaks photography, gallery, studio, prompt, evidence, SEO, specification, or production language; uses an em dash; uses youth-coded framing; or contains cheap generic filler.

Correct verified measurements, material, cup size, appearance, and wardrobe details may appear naturally. Fictional adult actions, dialogue, agency, setting, mood, and erotic interaction are allowed. Review the revised draft only and do not rewrite it.`;

const banned = [
  "—", "not just", "unforgettable", "waits for you", "waits for your", "waiting for you",
  "knowing gaze", "demands your full attention", "demands your undivided attention",
  "the world outside fades", "world outside fades", "forget the world outside",
  "private sanctuary", "the only rule", "masterpiece of", "ready for you",
  "innocence", "innocent", "schoolgirl", "school girl", "childlike", "barely legal", "teen",
  "in this photo", "in the photo", "product photo", "product image", "the image shows",
  "the gallery shows", "this gallery", "contact sheet", "studio", "editorial copy",
  "visual evidence", "source material", "seo", "product data", "visual narrative",
  "composition", "static display", "clearly adult", "ready for you"
];

const results = (previous.records || []).filter((record) => record.publishable === true);
for (let offset = 0; offset < reviewable.length; offset += 4) {
  const batch = reviewable.slice(offset, offset + 4);
  const recovered = await Promise.all(batch.map(recover));
  results.push(...recovered);
  await writeOutput();
  console.log(`Recovered ${Math.min(offset + batch.length, reviewable.length)}/${reviewable.length}`);
}

await writeOutput();
console.log(`Wrote ${results.length} recovery records to ${outputPath}`);
console.log(`Passed: ${results.filter((record) => record.publishable).length}`);

async function recover(heldRecord) {
  const source = productionByHandle.get(heldRecord.handle);
  const prior = previousByHandle.get(heldRecord.handle);
  if (!source?.draft || !source?.extraction) {
    return { handle: heldRecord.handle, publishable: false, error: "Missing cached draft or visual evidence" };
  }

  try {
    const writing = await callVenice({
      model: WRITER_MODEL,
      messages: [
        { role: "system", content: writerPrompt },
        { role: "user", content: JSON.stringify({
          verifiedFacts: source.verifiedFacts,
          neutralVisualEvidence: source.extraction,
          rejectedDraft: prior?.draft || source.draft,
          staticFailures: prior?.staticChecks?.failures || heldRecord.staticFailures,
          reviewerViolations: prior?.reviewer?.violations || heldRecord.reviewerViolations,
        }) },
      ],
    });
    const staticChecks = runStaticChecks(writing.content);
    const review = await callVenice({
      model: REVIEWER_MODEL,
      messages: [
        { role: "system", content: reviewerPrompt },
        { role: "user", content: JSON.stringify({
          verifiedFacts: source.verifiedFacts,
          neutralVisualEvidence: source.extraction,
          revisedDraft: writing.content,
        }) },
      ],
    });

    return {
      handle: heldRecord.handle,
      sourceUrl: heldRecord.sourceUrl,
      verifiedFacts: source.verifiedFacts,
      sourceImages: source.sourceImages,
      draft: writing.content,
      staticChecks,
      reviewer: review.content,
      publishable: staticChecks.passed && review.content.passed === true,
      provenance: {
        promptVersion: "pdp-editorial-hold-recovery-v1",
        writerModel: WRITER_MODEL,
        reviewerModel: REVIEWER_MODEL,
        generatedAt: new Date().toISOString(),
        writerCost: writing.cost,
        reviewerCost: review.cost,
      },
    };
  } catch (error) {
    return { handle: heldRecord.handle, sourceUrl: heldRecord.sourceUrl, publishable: false, error: String(error) };
  }
}

function runStaticChecks(draft) {
  const paragraph = String(draft?.paragraph || "");
  const normalized = paragraph.toLowerCase();
  const failures = banned.filter((phrase) => normalized.includes(phrase.toLowerCase()));
  const wordCount = paragraph.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 90 || wordCount > 130) failures.push(`word_count_${wordCount}`);
  return { passed: failures.length === 0, failures, wordCount };
}

async function callVenice({ model, messages }) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(VENICE_ENDPOINT, {
        method: "POST",
        signal: AbortSignal.timeout(45_000),
        headers: { Authorization: `Bearer ${process.env.VENICE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0.5,
          max_completion_tokens: 1000,
          messages,
          response_format: { type: "json_object" },
          venice_parameters: {
            include_venice_system_prompt: false,
            disable_thinking: true,
            strip_thinking_response: true,
            enable_web_search: "off",
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(`${model} returned ${response.status}: ${JSON.stringify(body)}`);
      return {
        content: JSON.parse(String(body.choices?.[0]?.message?.content || "{}").replace(/^```json\s*/i, "").replace(/\s*```$/, "")),
        cost: body.cost || null,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

async function writeOutput() {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const cost = results.reduce((sum, record) => sum + costValue(record.provenance?.writerCost) + costValue(record.provenance?.reviewerCost), 0);
  await fs.writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), count: results.length, publishable: results.filter((record) => record.publishable).length, cost, records: results }, null, 2)}\n`);
}

function costValue(value) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    return Number(value.usd || value.total || value.total_cost || value.cost || 0);
  }
  return Number(value || 0);
}

async function loadEnv(filePath) {
  const text = await fs.readFile(filePath, "utf8").catch(() => "");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ||= value;
  }
}
