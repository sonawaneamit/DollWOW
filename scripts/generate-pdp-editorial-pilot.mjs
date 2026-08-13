#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const VENICE_ENDPOINT = "https://api.venice.ai/api/v1/chat/completions";
const EXTRACTOR_MODEL = process.env.PDP_EDITORIAL_EXTRACTOR_MODEL || "qwen3-vl-235b-a22b";
const WRITER_MODEL = process.env.PDP_EDITORIAL_WRITER_MODEL || "venice-uncensored-1-2";
const OUTPUT = process.argv[2] || "data/exports/pdp-phase/pdp-editorial-pilot-drafts.json";

const products = [
  {
    handle: "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
    facts: ["Irontech Evie", "clearly adult doll", "full silicone", "161 cm (5 ft 3 in)", "F-cup"],
  },
  {
    handle: "wm-y019-157cm-b-cup-silicone-companion-doll-txhmc",
    facts: ["WM Lila Dane", "clearly adult doll", "full silicone", "157 cm (5 ft 2 in)", "B-cup"],
  },
  {
    handle: "starpery-keisha-174cm-d-cup-silicone-companion-doll-1n6ah",
    facts: ["Starpery Keisha", "clearly adult doll", "full silicone", "174 cm (5 ft 9 in)", "D-cup"],
  },
  {
    handle: "sedoll-aryana-b-160cm-c-cup-silicone-companion-doll-9kt9z",
    facts: ["SE Doll Aryana B", "clearly adult doll", "full silicone", "160 cm (5 ft 3 in)", "C-cup"],
  },
  {
    handle: "piper-lana-155cm-f-cup-silicone-companion-doll-1d7qv",
    facts: ["Piper Lana", "clearly adult doll", "full silicone", "155 cm (5 ft 1 in)", "F-cup"],
  },
  {
    handle: "irontech-kevin-176cm-silicone-companion-doll-is1mv",
    facts: ["Irontech Kevin", "clearly adult male doll", "full silicone", "176 cm (5 ft 9 in)"],
  },
];

const extractorPrompt = `Analyze this supplier-authorized contact sheet for one clearly adult doll product. Return strict JSON only with these arrays:
- visibleStyling: hair, eyes, makeup, expression, clothing, props, pose, lighting, color palette, and setting that are visibly consistent
- uncertainDetails: anything partly obscured, inconsistent, or unsafe to state confidently
- prohibitedInferences: personality, feelings, agency, function, movement, realism, included items, performance, or buyer outcomes that must not be inferred

Describe only visible evidence. Do not interpret a prop as a personality, occupation, hobby, or included accessory. Do not identify a real person.`;

const writerPrompt = `You are the senior product editor for DollWOW. Write premium customer-facing American English for a clearly adult doll. The supplied verified facts and locked visible evidence are the complete allowed evidence.

Requirements:
- Return strict JSON with heading and paragraph only.
- Paragraph must be 80-140 words.
- Write sensual but tasteful editorial prose specific to the styling.
- Treat clothing, props, and scenery as editorial styling, never as included items.
- Use both US and metric measurements exactly as supplied when a measurement appears.
- Do not add material feel, craftsmanship, technology, function, movement, realism, personality, feelings, agency, consent, anatomy beyond an approved cup size, availability, performance, or buyer outcomes.
- Do not say a prop suggests an interest, occupation, mood, behavior, or personality.
- Do not mention photos, gallery, contact sheet, product data, SEO, prompts, evidence, or review.
- Write for a shopper. Do not call the doll a figure, product, item, static display, composition, presentation, visual narrative, or clearly adult.
- Describe the overall look and atmosphere rather than cataloging every visible garment and prop.
- Do not describe nudity clinically or mention close-up anatomy.
- Do not use an em dash or the construction "not just X, but Y."
- Avoid exudes, elevate, unforgettable, lifelike experience, perfect companion, designed to please, ready for you, and generic sales filler.
- Use a natural heading such as "Meet Evie" or "Kevin's Look and Presence."`;

function extractJson(raw) {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

async function callVenice({ model, messages, maxCompletionTokens = 1200 }) {
  const response = await fetch(VENICE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      max_completion_tokens: maxCompletionTokens,
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
    content: extractJson(body.choices?.[0]?.message?.content || "{}"),
    usage: body.usage || null,
    cost: body.cost || null,
  };
}

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function runStaticChecks(draft) {
  const paragraph = draft.paragraph || "";
  const normalized = paragraph.toLowerCase();
  const banned = [
    "—",
    "not just",
    "lifelike experience",
    "perfect companion",
    "designed to please",
    "ready for you",
    "unforgettable",
    "exudes",
    "elevate",
    "photos",
    "gallery",
    "seo",
    "product data",
    "visual narrative",
    "composition",
    "static display",
    "clearly adult",
  ];
  const failures = banned.filter((phrase) => normalized.includes(phrase.toLowerCase()));
  const count = wordCount(paragraph);
  if (count < 80 || count > 140) failures.push(`word_count_${count}`);
  return { passed: failures.length === 0, failures, wordCount: count };
}

async function main() {
  if (!process.env.VENICE_API_KEY) throw new Error("VENICE_API_KEY is required");

  const results = [];
  for (const product of products) {
    const contactSheet = path.join("output/pdp-pilot-contact-sheets", `${product.handle}-contact.jpg`);
    const image = await fs.readFile(contactSheet, "base64");
    const extraction = await callVenice({
      model: EXTRACTOR_MODEL,
      messages: [
        { role: "system", content: "You are a precise visual evidence extractor for adult commerce. Return JSON only." },
        {
          role: "user",
          content: [
            { type: "text", text: extractorPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          ],
        },
      ],
    });

    const writing = await callVenice({
      model: WRITER_MODEL,
      messages: [
        { role: "system", content: writerPrompt },
        {
          role: "user",
          content: JSON.stringify({
            verifiedFacts: product.facts,
            lockedVisibleEvidence: extraction.content.visibleStyling || [],
            excludedUncertainDetails: extraction.content.uncertainDetails || [],
          }),
        },
      ],
    });

    results.push({
      handle: product.handle,
      verifiedFacts: product.facts,
      sourceImages: Array.from({ length: 8 }, (_, index) => `/product-media/v4/${product.handle}/${index}?size=card`),
      extraction: extraction.content,
      draft: writing.content,
      staticChecks: runStaticChecks(writing.content),
      provenance: {
        extractorModel: EXTRACTOR_MODEL,
        writerModel: WRITER_MODEL,
        promptVersion: "pdp-editorial-pilot-v1",
        generatedAt: new Date().toISOString(),
        extractorUsage: extraction.usage,
        writerUsage: writing.usage,
        extractorCost: extraction.cost,
        writerCost: writing.cost,
        status: "draft_needs_human_review",
      },
    });
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.log(`Wrote ${results.length} review-only drafts to ${OUTPUT}`);
  for (const result of results) {
    console.log(`${result.handle}: ${result.staticChecks.passed ? "static pass" : result.staticChecks.failures.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
