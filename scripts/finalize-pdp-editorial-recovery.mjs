#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const basePath = "data/exports/pdp-phase/full-body-editorial-approved-v6.json";
const heldPath = "data/exports/pdp-phase/full-body-editorial-held-v6.json";
const holdRecoveryPath = "data/exports/pdp-phase/full-body-editorial-hold-recovery-v3.json";
const rivlinPath = "data/exports/pdp-phase/full-body-editorial-rivlin-recovery-v2.json";
const baseRecoveryPath = "data/exports/pdp-phase/full-body-editorial-base-quality-recovery-v3.json";
const fullOutput = "data/exports/pdp-phase/full-body-editorial-approved-v7.json";
const deltaOutput = "data/exports/pdp-phase/full-body-editorial-approved-v7-delta.json";
const remainingOutput = "data/exports/pdp-phase/full-body-editorial-held-v7.json";

const base = JSON.parse(await fs.readFile(basePath, "utf8")).records;
const originalHeld = JSON.parse(await fs.readFile(heldPath, "utf8")).records;
const holdRecovery = JSON.parse(await fs.readFile(holdRecoveryPath, "utf8")).records;
const rivlin = JSON.parse(await fs.readFile(rivlinPath, "utf8")).records;
const baseRecovery = JSON.parse(await fs.readFile(baseRecoveryPath, "utf8")).records;

const yuHandle = "irontech-yu-164cm-f-cup-silicone-companion-doll-13oc3";
const manualYu = normalizeRecord({
  ...baseRecovery.find((record) => record.handle === yuHandle),
  draft: {
    eyebrow: "After Dark",
    heading: "A Closer Look at Yu",
    paragraph: "Yu catches your attention in a muted gray-blue one-piece, its slim straps and front zipper tracing the lines of her 164 cm (5 ft 5 in) silicone body. Off-white fishnets draw the eye along her legs, while dark brown bangs and a black bow frame vivid blue eyes and softly parted pink lips. At 92.6 lb (42.0 kg), her F-cup proportions give the look a striking presence. Pull the zipper down slowly, guide her from the stool, and let the quiet room become something far more intimate. With Yu, restraint is only where the evening begins."
  },
  publishable: true,
  provenance: {
    ...(baseRecovery.find((record) => record.handle === yuHandle)?.provenance || {}),
    promptVersion: "pdp-editorial-human-correction-v1",
    generatedAt: new Date().toISOString(),
  },
});

const cleanHoldRecovery = holdRecovery.filter((record) => record.publishable).map(normalizeRecord);
const cleanRivlin = rivlin.filter((record) => record.publishable).map(normalizeRecord);
const cleanBaseRecovery = baseRecovery
  .filter((record) => record.publishable && record.handle !== yuHandle)
  .map(normalizeRecord)
  .map((record) => record.handle === "sedoll-yuuka-e-158cm-d-cup-tpe-companion-doll-1km30"
    ? { ...record, eyebrow: "After Dark" }
    : record);
const replacements = [...cleanHoldRecovery, ...cleanRivlin, ...cleanBaseRecovery, manualYu];
const replacementByHandle = new Map(replacements.map((record) => [record.handle, record]));
const fullRecords = base.map((record) => replacementByHandle.get(record.handle) || record);
for (const record of replacements) {
  if (!fullRecords.some((entry) => entry.handle === record.handle)) fullRecords.push(record);
}

const originalHeldByHandle = new Map(originalHeld.map((record) => [record.handle, record]));
const remaining = originalHeld.filter((record) => !replacementByHandle.has(record.handle));
const excluded = remaining.filter((record) => record.status === "excluded_not_full_body");
const held = remaining.filter((record) => record.status !== "excluded_not_full_body");

validate(fullRecords);
if (fullRecords.length !== 2747) throw new Error(`Expected 2747 approved records, found ${fullRecords.length}`);
if (replacements.length !== 57) throw new Error(`Expected 57 delta records, found ${replacements.length}`);
if (held.length !== 6 || excluded.length !== 3) {
  throw new Error(`Expected six held and three excluded records, found ${held.length} held and ${excluded.length} excluded`);
}
for (const record of replacements) {
  const prior = originalHeldByHandle.get(record.handle);
  if (!prior && !base.some((entry) => entry.handle === record.handle)) {
    throw new Error(`Replacement ${record.handle} has no prior source record`);
  }
}

await write(fullOutput, { generatedAt: new Date().toISOString(), count: fullRecords.length, records: fullRecords });
await write(deltaOutput, { generatedAt: new Date().toISOString(), count: replacements.length, records: replacements });
await write(remainingOutput, { generatedAt: new Date().toISOString(), count: remaining.length, heldCount: held.length, excludedCount: excluded.length, records: remaining });

console.log(`Approved: ${fullRecords.length}`);
console.log(`Delta: ${replacements.length}`);
console.log(`Held for insufficient imagery: ${held.length}`);
console.log(`Excluded non-full-body: ${excluded.length}`);

function normalizeRecord(record) {
  const draft = record.draft || record;
  return {
    handle: record.handle,
    sourceUrl: record.sourceUrl,
    eyebrow: draft.eyebrow,
    heading: draft.heading,
    paragraph: draft.paragraph,
    verifiedFacts: record.verifiedFacts || [],
    sourceImages: record.sourceImages || [],
    generatedAt: record.provenance?.generatedAt || record.generatedAt || new Date().toISOString(),
    promptVersion: record.provenance?.promptVersion || record.promptVersion || "pdp-editorial-fantasy-v5",
    status: "approved_for_catalog_human_spot_check",
  };
}

function validate(records) {
  const handles = new Set();
  const paragraphs = new Map();
  const banned = [
    "—", "not just", "this gallery", "product photo", "product image", "visual evidence",
    "studio", "masterpiece of", "waits for you", "waiting for you",
    "demands your full attention", "private sanctuary", "ready for you", "clearly adult"
  ];
  for (const record of records) {
    if (handles.has(record.handle)) throw new Error(`Duplicate handle: ${record.handle}`);
    handles.add(record.handle);
    const text = `${record.eyebrow} ${record.heading} ${record.paragraph}`.toLowerCase();
    const failures = banned.filter((phrase) => containsPhrase(text, phrase));
    const words = String(record.paragraph || "").trim().split(/\s+/).filter(Boolean).length;
    if (words < 80 || words > 140 || failures.length) {
      throw new Error(`Quality failure for ${record.handle}: words=${words}, phrases=${failures.join(", ")}`);
    }
    const normalized = record.paragraph.toLowerCase().replace(/\s+/g, " ").trim();
    if (paragraphs.has(normalized)) throw new Error(`Duplicate paragraph: ${record.handle} and ${paragraphs.get(normalized)}`);
    paragraphs.set(normalized, record.handle);
  }
}

function containsPhrase(text, phrase) {
  const escaped = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

async function write(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}
